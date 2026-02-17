import { GEMINI_CONFIG } from "../config/constants";

interface GeminiRequest {
  contents: Array<{ parts: Array<{ text: string }> }>;
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
  };
}

export class GeminiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = `https://generativelanguage.googleapis.com/${GEMINI_CONFIG.API_VERSION}/models/${GEMINI_CONFIG.MODEL}:generateContent`;
  }
// Modifica el mètode generate a GeminiClient.ts

async generate(prompt: string, retries = 0): Promise<string> {
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: GEMINI_CONFIG.TEMPERATURE,
      maxOutputTokens: GEMINI_CONFIG.MAX_TOKENS,
      topP: GEMINI_CONFIG.TOP_P,
      topK: GEMINI_CONFIG.TOP_K,
      // 🚀 AQUESTA ÉS LA VARIABLE MÀGICA:
      responseMimeType: "application/json", 
    },
  };
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      GEMINI_CONFIG.TIMEOUT_MS
    );

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || "Unknown"}`);
      }

      const data = await response.json();

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid Gemini response structure");
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error: any) {
      clearTimeout(timeout);

      if (error.name === "AbortError") {
        throw new Error("Gemini request timeout");
      }

      if (retries < GEMINI_CONFIG.MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retries + 1)));
        return this.generate(prompt, retries + 1);
      }

      throw error;
    }
  }
}