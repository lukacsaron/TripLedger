import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// Response schema from AI
const statementTransactionSchema = z.object({
    date: z.string().describe("ISO 8601 date (YYYY-MM-DD)"),
    amount: z.number(),
    currency: z.enum(["EUR", "USD", "HUF", "HRK"]),
    merchant: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    category: z.string().nullable().optional().describe("The separate, mapped 'System Category' selected from the provided list"),
    subcategory: z.string().nullable().optional().describe("The mapped 'System Subcategory' if applicable"),
    originalCategory: z.string().nullable().optional().describe("The exact category text found in the document, if any"),
});

const statementResponseSchema = z.object({
    transactions: z.array(statementTransactionSchema),
});

const SYSTEM_PROMPT = `
You are an advanced bank statement and financial document parser.
Your task is to extract a list of transactions from the provided raw text, CSV, or PDF content.

For each transaction, extract:
- date: YYYY-MM-DD format. If the year is missing, assume the current year or infer from context.
- amount: The absolute numeric value.
- currency: EUR, USD, HUF, or HRK.
- merchant: The name of the other party (store, person, company).
- description: A brief description, reference, or note about the purchase.
- category: **CRITICAL**: You MUST map the transaction to one of the "Available Categories" provided below.
  - If the document has a separate "Category" column (e.g. "Kategória"), finding the semantic match is PRIORITY #1.
  - Examples: "Útiköltség" -> "Travel", "Élelmiszer" -> "Food", "Szállás" -> "Accommodation".
  - If no exact or semantic match exists, use "Other".
- originalCategory: The RAW text from the "Category" column in the document (if present).
- subcategory: (Optional) If the document explicitly lists a subcategory, try to map it to one of the "Available Subcategories".

CRITICAL RULES FOR PARSING:
1. **Header Identification**: Look for headers in any language (English, Hungarian, etc.).
   - "Kategória" -> Category (Map this to System Category!)
   - "Alkategória" -> Subcategory/Description
   - "Target name" / "Partner" -> Merchant
   - "Source amount" / "Összeg" -> Amount
2. **CSV Handling**:
   - If the input is CSV-like, respect column mapping.
   - Be robust against empty columns (e.g. ",,,").
   - Handle quoted values that contain commas (e.g. "21,980").
3. **Multi-Currency / Exchange**:
   - If a row has "Source amount" and "Target amount", usually the *Source* is what was deducted from the user, but the *Target* is what the merchant received.
   - HOWEVER, for expense tracking, we generally want the **Operating Currency** of the transaction (e.g. if I spent 10 EUR in Austria, I want 10 EUR, even if my bank deducted 4000 HUF).
   - Rule: Use the currency that matches the location/merchant context if possible, or the "original" transaction currency.
   - If "Source currency" is HUF and "Target currency" is EUR, and the merchant is foreign, PREFER the EUR amount.
4. **Noise Filtering**:
   - Ignore header lines.
   - Ignore summary lines (e.g. "Total", "Opening Balance").
   - Ignore empty lines.
   - Ignore failed transactions if indicated.

OUTPUT FORMAT:
Return ONLY a valid JSON object with a "transactions" key containing an array of these objects.
`.trim();

interface ParseOptions {
    apiKey: string;
    fileContent: string; // Plain text content (CSV/TXT)
    mimeType?: string;   // "text/csv", "application/pdf" (not used for text content currently but good for future)
    categoryList?: string; // Optional context strings for categories
}

export async function parseStatementWithAI(options: ParseOptions) {
    const { apiKey, fileContent, categoryList } = options;

    if (!apiKey) {
        throw new Error("Google AI API key not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-2.5-flash as per user standard/preference if available, or fallback
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = `${SYSTEM_PROMPT}\n\n`;

    if (categoryList) {
        prompt += `\n**Available Categories (System)**:\n${categoryList}\n\n`;
        prompt += `INSTRUCTION: For each transaction, compare its document category (e.g. 'Útiköltség') with the 'Available Categories' above. Return the closest English match (e.g. 'Travel') in the 'category' field.`;
    }

    prompt += `Analyze the following file content and extract transactions:\n\n${fileContent}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON
        const cleanedContent = text
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        const parsedData = JSON.parse(cleanedContent);

        // Validate
        const validated = statementResponseSchema.safeParse(parsedData);

        if (!validated.success) {
            console.error("AI Validation failed:", validated.error);
            throw new Error(`Invalid data structure from AI: ${validated.error.message}`);
        }

        return validated.data.transactions;

    } catch (error) {
        console.error("AI Parsing Error:", error);
        throw error;
    }
}
