/**
 * AI Receipt Scanner API
 * POST /api/scan-receipt - Scan a receipt image and extract expense data
 * Now powered by Google Gemini 1.5 Flash
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

// Initialize Google AI client
// Note: We initialize this inside the handler or globally. Global is fine.
// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || ""); 
// Better to check key inside handler.

// Validation schema for request
const scanRequestSchema = z.object({
  image: z.string(), // base64 encoded image
  tripId: z.string().cuid().optional(), // Made optional just in case, but frontend sends it.
});

// Expected response structure from AI
const receiptDataSchema = z.object({
  merchant: z.string(),
  date: z.string(), // ISO 8601
  amount: z.number().positive(),
  currency: z.enum(["EUR", "USD", "HUF"]),
  category: z.string(), // Dynamic now
  subcategory: z.string().optional(),
  description: z.string(),
  paymentType: z.enum(["CASH", "CARD", "WIRE_TRANSFER"]),
  rawItems: z.array(z.string()).optional(),
  originalItems: z.array(z.string()).optional(),
});

// System prompt for the AI
const SYSTEM_PROMPT = `
You are a receipt scanner for a holiday expense tracking application.

Analyze the receipt image and extract the following information:
- merchant: The store/business name
- date: The transaction date in ISO 8601 format (YYYY-MM-DD)
- amount: The total amount (as a number)
- currency: Detect the currency (EUR, USD, or HUF)
  * EUR for European countries (€ symbol, "EUR" text, or countries like Croatia, Austria, Germany, etc.)
  * USD for United States ($ symbol, "USD" text)
  * HUF for Hungary (Ft symbol, "HUF" text, "forint")
  * If uncertain, infer from country/language context
- category: Suggest one of: Food, Travel, Accommodation, Entertainment, Groceries, Shopping, Other
- description: Brief summary of items purchased (3-5 words)
- paymentType: Detect payment method: "CASH", "CARD", or "WIRE_TRANSFER". Default to "CASH" if unclear.
- rawItems: An array of strings, where each string is a line item and its price TRANSLATED TO ENGLISH. Format: "Item Name: Price".
- originalItems: An array of strings, where each string is the line item IN ORIGINAL LANGUAGE as it appears on the receipt. Format: "Item Name: Price".

CRITICAL: Return ONLY a valid JSON object with these exact fields. No markdown, no explanations.

Example response:
{
  "merchant": "Konoba Dalmatino",
  "date": "2024-08-16",
  "amount": 45.50,
  "currency": "EUR",
  "category": "Food",
  "description": "Dinner for two",
  "paymentType": "CASH",
  "rawItems": ["Fish Soup: 12.00", "Grilled Squid: 22.00", "Wine: 6.50", "Water: 5.00"],
  "originalItems": ["Riblja Juha: 12.00", "Lignje na žaru: 22.00", "Vino: 6.50", "Voda: 5.00"]
}
`.trim();

// POST /api/scan-receipt
export async function POST(request: NextRequest) {
  try {
    // Validate API key exists
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_AI_API_KEY is missing");
      return NextResponse.json(
        { error: "Google AI API key not configured" },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { image, tripId } = scanRequestSchema.parse(body);

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-2.5-flash as requested (User asked for 2.5, 2.0 is the latest available flash model that works well)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepare content for Gemini
    // Handle data:image/jpeg;base64, prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    // Default mimeType to image/jpeg if not specified, though Gemini handles standard image formats.
    // We can try to extract mime type from prefix if it exists.
    const mimeTypeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

    // Fetch categories and subcategories
    const categories = await prisma.category.findMany({
      // @ts-ignore - subcategories exists in schema but types might be stale
      include: { subcategories: true },
    });

    const categoryList = categories.map((c: { name: string; subcategories: { name: string }[] }) =>
      `- ${c.name}: [${c.subcategories.map((s: { name: string }) => s.name).join(", ")}]`
    ).join("\n");

    const dynamicPrompt = `${SYSTEM_PROMPT}
    
    IMPORTANT: You must categorize the expense into one of the following Categories and optionally a Subcategory.
    Strictly use the names provided below.
    
    Available Categories and Subcategories:
    ${categoryList}
    
    Extract data from this receipt:`;

    const result = await model.generateContent([
      dynamicPrompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("No content in AI response");
    }

    // Parse JSON response
    let receiptData;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      receiptData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", text);
      throw new Error("Invalid JSON response from AI");
    }

    // Validate the extracted data
    // We try to be lenient if AI returns slightly different structure, but Zod enforces strictness.
    // If AI returns nulls, we might need to handle them. Zod schema expects strings/numbers.
    // Let's hope Gemini follows instructions.
    const validatedData = receiptDataSchema.parse(receiptData);

    // Return the structured data
    return NextResponse.json({
      ...validatedData,
      rawItemsText: validatedData.rawItems?.join("\n") || null,
      originalItemsText: validatedData.originalItems?.join("\n") || null,
      confidence: "medium", // Placeholder
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation failed:", (error as any).errors);
      return NextResponse.json({ error: 'Invalid input', details: (error as any).errors }, { status: 400 });
    }

    console.error("Receipt scanning failed:", error);

    // Check for specific errors
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Invalid Google AI API key" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to scan receipt. Please try again or enter manually." },
      { status: 500 }
    );
  }
}
