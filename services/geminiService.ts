import { GoogleGenAI, Type } from "@google/genai";
import { WordPair } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateNewWords = async (count: number = 5): Promise<WordPair[]> => {
  if (!apiKey) {
    console.warn("API Key is missing. Returning empty array.");
    return [];
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Generate ${count} simple 2-letter Hindi words (Do Akshar Wale Shabd) for a beginner language learning game.
    The words must be strictly 2 distinct characters (or a simple conjunct that acts as one sound unit, but ideally simple consonants).
    Avoid complex matras if possible, stick to the basics like 'Jal', 'Ghar', 'Fal'.
    
    Return a JSON array where each object has:
    - hindi: The Hindi word (e.g., 'जल')
    - english: The English meaning (e.g., 'Water')
    - transliteration: The English phonetic pronunciation (e.g., 'Jal')
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              hindi: { type: Type.STRING },
              english: { type: Type.STRING },
              transliteration: { type: Type.STRING }
            },
            required: ['hindi', 'english', 'transliteration']
          }
        }
      }
    });

    const rawData = response.text ? JSON.parse(response.text) : [];
    
    // Validate and add IDs
    return rawData.map((item: any, index: number) => ({
      id: `ai-${Date.now()}-${index}`,
      hindi: item.hindi,
      english: item.english,
      transliteration: item.transliteration,
    }));

  } catch (error) {
    console.error("Failed to generate words via Gemini:", error);
    return [];
  }
};
