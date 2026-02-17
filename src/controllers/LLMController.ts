// src/controllers/LLMController.ts

import { GeminiClient } from "../services/GeminiClient";
import { PromptBuilder } from "../core/compas/PromptBuilder";
import { ResponseValidator } from "../services/ResponseValidator";
import { InteractionLogger } from "../services/InteractionLogger";

// 1. Importem el tipus unificat del contracte
import {
  type CompasLLMResponse, // 👈 Usem el tipus unificat
  validateCompasLLMResponse,
  enforcePedagogicalPolicy,
} from "../core/llmContract";

import type { CompasRequest } from "../types";

export class LLMController {
  private gemini: GeminiClient;
  private promptBuilder: PromptBuilder;
  private validator: ResponseValidator;
  private logger: InteractionLogger;

  constructor(apiKey: string) {
    this.gemini = new GeminiClient(apiKey);
    this.promptBuilder = new PromptBuilder();
    this.validator = new ResponseValidator();
    this.logger = new InteractionLogger();
  }

  // 🛠️ Canviem el retorn a CompasLLMResponse per coherència
  async handleRequest(request: CompasRequest): Promise<CompasLLMResponse> {
    const prompt = this.promptBuilder.build(request);

    let rawResponse: string;

    // 1️⃣ Cridada a Gemini
    try {
      rawResponse = await this.gemini.generate(prompt);
    } catch {
      // ⚠️ El teu validador ha de retornar un objecte que compleixi el nou contracte
      return this.validator.fallback(request.language) as CompasLLMResponse;
    }

    // 2️⃣ Parseig del JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      const fallback = this.validator.fallback(request.language) as CompasLLMResponse;
      await this.logger.log(request, fallback, rawResponse);
      return fallback;
    }

    // 3️⃣ Validació estricta del contracte (Aquí estava el bug)
    // 'validated' ara és del mateix tipus que retorna la funció
    let validated: CompasLLMResponse; 
    
    try {
      // La funció validateCompasLLMResponse ara retorna l'objecte amb els 10 camps
      validated = validateCompasLLMResponse(parsed);
      
      // Apliquem la política pedagògica
      enforcePedagogicalPolicy(validated, request.support_level);
    } catch (err) {
      console.error("Error de validació pedagògica:", err);
      const fallback = this.validator.fallback(request.language) as CompasLLMResponse;
      await this.logger.log(request, fallback, rawResponse);
      return fallback;
    }

    // 4️⃣ Log de la interacció amb èxit
    await this.logger.log(request, validated, rawResponse);

    return validated;
  }
}