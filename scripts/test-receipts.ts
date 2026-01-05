
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
    console.error("GOOGLE_AI_API_KEY is missing");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
// Debug: List models
async function getModel() {
    try {
        // This needs a specific API call, but we can't easily list without a model instance sometimes. 
        // We will try a few known robust models.
        const candidates = ["gemini-2.5-flash"];
        for (const m of candidates) {
            console.log(`Trying model: ${m}`);
            try {
                const model = genAI.getGenerativeModel({ model: m });
                // Simple test generation
                await model.generateContent("Test");
                console.log(`Success with ${m}`);
                return model;
            } catch (e: any) {
                console.log(`Failed ${m}: ${e.message}`);
            }
        }
    } catch (e) { console.log(e); }
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Fallback
}

// const model = await getModel();

const ARTIFACTS_DIR = "/Users/alukacs/.gemini/antigravity/brain/605554fa-a037-445d-99db-9d8e1eb16253";

// System prompt from route.ts (copied for testing)
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
- rawItems: An array of strings, where each string is a line item and its price. Format: "Item Name: Price".

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
  "rawItems": ["Fish Soup: 12.00", "Grilled Squid: 22.00", "Wine: 6.50", "Water: 5.00"]
}
`.trim();

async function testReceipt(model: any, imagePath: string) {
    console.log(`\nTesting: ${path.basename(imagePath)}`);

    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Data = imageBuffer.toString("base64");

        const result = await model.generateContent([
            SYSTEM_PROMPT + "\n\nExtract data from this receipt:",
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();
        console.log("Raw Output:", text);

        // Parse to check JSON validity
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        console.log("Parsed JSON:", JSON.stringify(parsed, null, 2));

    } catch (error) {
        console.error("Error:", error);
    }
}

async function run() {
    const model = await getModel();
    if (!model) {
        console.error("No working model found");
        return;
    }

    const files = fs.readdirSync(ARTIFACTS_DIR)
        .filter(f => f.startsWith("uploaded_image_") && f.endsWith(".jpg"))
        .sort();

    for (const file of files) {
        await testReceipt(model, path.join(ARTIFACTS_DIR, file));
    }
}

run();
