import { GoogleGenerativeAI } from "@google/generative-ai";
import { type Moment } from "../types/Moment";

// Initialize Gemini
// Note: This relies on VITE_GEMINI_API_KEY being present in .env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
}

export const GeminiService = {
    /**
     * Generates a batch of moments using Gemini based on the provided params.
     */
    async generateMoments(
        category: string,
        count: number,
        intents: string[]
    ): Promise<Omit<Moment, "id">[]> {
        if (!genAI) {
            throw new Error(
                "Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file."
            );
        }

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const prompt = `
        You are a Christian content creator assistant.
        Generate ${count} distinct "Moment" objects for a spiritual app.
        
        Context:
        - Category: "${category}" (e.g. peace, anxiety, joy)
        - Intents/Tags: ${intents.join(", ")}
        - Target Audience: People seeking spiritual encouragement.
        
        Requirements for each Moment:
        1. "title": A short, inviting title (3-6 words).
        2. "message": A warm, encouraging paragraph (2-3 sentences).
        3. "verseQuote": A relevant Bible verse text (NIV or ESV preferred).
        4. "verseReference": An object with "book", "chapter", "verseStart" (number), "verseEnd" (number or null), and "version" (string).
        5. "tags": An array of strings including the category and other relevant keywords.
        
        Output Format:
        Return ONLY a raw JSON array of objects. Do not include markdown formatting like \`\`\`json.
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up markdown if present (sometimes Gemini adds it despite instructions)
            const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();

            const parsed = JSON.parse(cleanJson);

            if (!Array.isArray(parsed)) {
                throw new Error("AI response was not an array.");
            }

            // Map to Moment structure (adding defaults)
            return parsed.map((item: any) => ({
                title: item.title,
                message: item.message,
                verseQuote: item.verseQuote,
                verseReference: {
                    book: item.verseReference.book,
                    chapter: Number(item.verseReference.chapter),
                    verseStart: Number(item.verseReference.verseStart),
                    verseEnd: item.verseReference.verseEnd
                        ? Number(item.verseReference.verseEnd)
                        : null,
                    version: item.verseReference.version || "NIV",
                },
                category: category as any,
                intents: intents as any,
                tags: Array.isArray(item.tags) ? item.tags : [category],
                status: "draft",
                createdBy: "gemini-ai",
                createdAt: new Date(), // Will be converted to Timestamp by Firestore
            } as unknown as Omit<Moment, "id">));

        } catch (error) {
            console.error("Gemini Generation Error:", error);
            throw error;
        }
    },
};
