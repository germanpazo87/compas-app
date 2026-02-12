/**
 * ORACLE ENGINE
 * Motor principal del sistema Oracle desacoblat.
 * Coordina construcció de context i generació de missatges pedagògics.
 */

import { buildOracleContext, type ExerciseState } from "./contextBuilder";
import { assemblePrompt } from "./promptAssembler";
import type { OracleContext } from "../types/OracleContext";

/**
 * Configuració del motor Oracle
 */
export interface OracleEngineConfig {
  mockMode?: boolean; // Si true, retorna prompt en lloc de cridar API
  apiEndpoint?: string; // URL futura per API real
  apiKey?: string; // Clau API futura
}

/**
 * ORACLE ENGINE
 * Classe principal per generar feedback intel·ligent
 */
export class OracleEngine {
  private config: OracleEngineConfig;

  constructor(config: OracleEngineConfig = {}) {
    this.config = {
      mockMode: config.mockMode ?? true, // Default: mock per MVP
      apiEndpoint: config.apiEndpoint,
      apiKey: config.apiKey,
    };
  }

  /**
   * MÈTODE PRINCIPAL
   * Genera missatge Oracle a partir d'estat d'exercici validat
   * 
   * @param exerciseState - Estat validat pel Domain Layer
   * @returns Missatge pedagògic generat (o prompt en mock mode)
   */
  public async generateOracleMessage(exerciseState: ExerciseState): Promise<string> {
    try {
      // 1. Construeix context estructurat
      const context: OracleContext = buildOracleContext(exerciseState);

      // 2. Assembla prompt
      const prompt: string = assemblePrompt(context);

      // 3. Generació (mock o real segons configuració)
      if (this.config.mockMode) {
        return this.mockGenerate(prompt, context);
      } else {
        return await this.callExternalAPI(prompt);
      }
    } catch (error) {
      console.error("Oracle Engine Error:", error);
      return this.generateFallbackMessage(exerciseState.milestone);
    }
  }

  /**
   * MODE MOCK (MVP)
   * Retorna prompt construït per debug/testing
   */
  private mockGenerate(prompt: string, context: OracleContext): string {
    return `[ORACLE MOCK MODE - Prompt generat]

${prompt}

---
[En producció, aquest prompt seria enviat a l'API d'IA]
[Context ID: ${context.exerciseId}]
[Milestone: ${context.milestone}]`;
  }

  /**
   * CRIDA API REAL (futur)
   * Placeholder per integració futura amb Claude/OpenAI/etc
   */
  private async callExternalAPI(prompt: string): Promise<string> {
    if (!this.config.apiEndpoint || !this.config.apiKey) {
      throw new Error("API endpoint or key not configured");
    }

    // TODO: Implementar crida real en futures iteracions
    // Exemple estructura:
    // const response = await fetch(this.config.apiEndpoint, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": `Bearer ${this.config.apiKey}`,
    //   },
    //   body: JSON.stringify({ prompt }),
    // });
    // return await response.json();

    throw new Error("Real API call not implemented yet");
  }

  /**
   * Missatge de fallback si Oracle falla
   */
  private generateFallbackMessage(milestone: string): string {
    const fallbacks: Record<string, string> = {
      metadata_sync: "Revisa les dades i comprova els teus càlculs. Pots tornar-ho a intentar!",
      categories_completed: "Bon treball! Ara concentra't en comptar les freqüències.",
      frequencies_partial: "Vas per bon camí. Comprova el recompte amb atenció.",
      frequencies_completed: "Excel·lent! Reflexiona sobre què representen aquestes dades.",
    };

    return fallbacks[milestone] || "Continua treballant, vas per bon camí!";
  }

  /**
   * Permet canviar configuració en runtime
   */
  public updateConfig(newConfig: Partial<OracleEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * FACTORY per crear instància Oracle
 */
export function createOracleEngine(config?: OracleEngineConfig): OracleEngine {
  return new OracleEngine(config);
}