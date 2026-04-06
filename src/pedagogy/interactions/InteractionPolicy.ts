/*src/pedagogy/interactions/InteractionPolicy.ts*/
/**
 * INTERACTION POLICY
 * Centralitza configuració contextual per tipus d'interacció.
 * 
 * Responsabilitat:
 * - Definir pesos d'actualització de mastery
 * - Definir llindars de decisió pedagògica
 * 
 * NO modifica lògica de StudentModel ni DecisionEngine.
 * Només proporciona paràmetres contextuals.
 */

import type { InteractionType } from "./types";

/**
 * Llindars de decisió pedagògica per tipus d'interacció
 */
export interface InteractionThresholds {
  /**
   * Llindar per activar scaffold (si mastery < threshold)
   */
  scaffoldThreshold: number;

  /**
   * Llindar per reduir scaffold (si mastery > threshold)
   */
  reduceThreshold: number;
}

/**
 * Pesos d'actualització de mastery per tipus d'interacció
 */
export interface InteractionWeights {
  /**
   * Multiplicador del delta de mastery
   * - > 1.0: impacte amplificat (remedial)
   * - 1.0: impacte estàndard (practice)
   * - < 1.0: impacte reduït (retrieval, assessment)
   */
  masteryWeight: number;
}

/**
 * Configuració completa per tipus d'interacció
 */
interface InteractionConfig {
  weights: InteractionWeights;
  thresholds: InteractionThresholds;
}

/**
 * INTERACTION POLICY
 * Classe centralitzada de configuració contextual.
 */
export class InteractionPolicy {
  private config: Record<InteractionType, InteractionConfig>;

  /**
   * Constructor amb configuració per defecte
   * Basat en evidència pedagògica:
   * 
   * - practice: Balanç estàndard aprenentatge/avaluació
   * - retrieval: Baix impacte immediat, alt benefici a llarg termini
   * - remedial: Alt impacte per accelerar recuperació
   * - assessment: Impacte moderat, llindars alts per confiança
   */
  constructor() {
    this.config = {
      practice: {
        weights: { masteryWeight: 1.0 },
        thresholds: { scaffoldThreshold: 0.5, reduceThreshold: 0.8 },
      },
      retrieval: {
        weights: { masteryWeight: 0.3 }, // Baix impacte immediat
        thresholds: { scaffoldThreshold: 0.4, reduceThreshold: 0.85 },
      },
      remedial: {
        weights: { masteryWeight: 1.2 }, // Amplificat per recuperació ràpida
        thresholds: { scaffoldThreshold: 0.6, reduceThreshold: 0.75 },
      },
      assessment: {
        weights: { masteryWeight: 0.8 }, // Impacte moderat
        thresholds: { scaffoldThreshold: 0.5, reduceThreshold: 0.85 },
      },
    };
  }

  /**
   * Obté pesos d'actualització per tipus d'interacció
   * 
   * @param type - Tipus d'interacció
   * @returns Pesos configurats
   */
  public getWeights(type: InteractionType): InteractionWeights {
    return { ...this.config[type].weights };
  }

  /**
   * Obté llindars de decisió per tipus d'interacció
   * 
   * @param type - Tipus d'interacció
   * @returns Llindars configurats
   */
  public getThresholds(type: InteractionType): InteractionThresholds {
    return { ...this.config[type].thresholds };
  }

  /**
   * Actualitza configuració per un tipus específic
   * Útil per experimentació pedagògica
   * 
   * @param type - Tipus d'interacció
   * @param config - Nova configuració parcial
   */
  public updateConfig(
    type: InteractionType,
    config: Partial<InteractionConfig>
  ): void {
    this.config[type] = {
      ...this.config[type],
      ...config,
      weights: { ...this.config[type].weights, ...config.weights },
      thresholds: { ...this.config[type].thresholds, ...config.thresholds },
    };
  }

  /**
   * Obté configuració completa (només lectura)
   */
  public getConfig(): Readonly<Record<InteractionType, InteractionConfig>> {
    return JSON.parse(JSON.stringify(this.config));
  }
}

/**
 * SINGLETON: Instància global per consistència
 */
let globalPolicy: InteractionPolicy | null = null;

/**
 * Obté o crea instància global d'InteractionPolicy
 */
export function getInteractionPolicy(): InteractionPolicy {
  if (!globalPolicy) {
    globalPolicy = new InteractionPolicy();
  }
  return globalPolicy;
}

/**
 * Reseteja política global (útil per testing)
 */
export function resetInteractionPolicy(): void {
  globalPolicy = new InteractionPolicy();
}