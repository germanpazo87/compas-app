/**
 * DECISION ENGINE
 * Motor heurístic V1 per decisions pedagògiques basades en evidència.
 * Implementa lògica simple basada en llindars configurables.
 */

import type {
  DecisionEngineConfig,
  DecisionEngineInput,
  PedagogicalDecision,
  PedagogicalDecisionType,
} from "./types";
import { getConceptState, type StudentModel } from "../studentModel/types";

/**
 * MOTOR DE DECISIONS PEDAGÒGIQUES
 */
export class DecisionEngine {
  // 1. Declarem la propietat explícitament (Fix ts 1294)
  private config: DecisionEngineConfig;

  constructor(config: DecisionEngineConfig) {
    // 2. Assignació manual
    this.config = config;
  }
  /**
   * MÈTODE PRINCIPAL: Decidir acció pedagògica
   */
  public decide(input: DecisionEngineInput): PedagogicalDecision {
    const {
      currentConceptId,
      studentModel,
      conceptGraph,
      lastPerformanceScore,
      currentTime,
      config,
    } = input;

    // Obtenir estat actual del concepte
    const conceptState = getConceptState(studentModel, currentConceptId);
    const conceptNode = conceptGraph[currentConceptId];

    if (!conceptNode) {
      return {
        decision: "scaffold_current",
        reasoning: `Concepte "${currentConceptId}" no trobat al graf. Aplicant scaffold per defecte.`,
        confidence: 0.5,
      };
    }

    // 🔍 HEURÍSTICA V1: Arbre de decisió basat en llindars

    // 1️⃣ Domini molt baix → Remediar
    if (conceptState.mastery < config.masteryThresholdLow) {
      return {
        decision: "remediate_current",
        reasoning: `Domini baix (${conceptState.mastery.toFixed(2)} < ${config.masteryThresholdLow}). Necessita més pràctica del concepte actual.`,
        confidence: 0.9,
      };
    }

    // 2️⃣ Domini molt alt → Reduir scaffold
    if (conceptState.mastery > config.masteryThresholdHigh) {
      return {
        decision: "reduce_scaffold_current",
        reasoning: `Domini alt (${conceptState.mastery.toFixed(2)} > ${config.masteryThresholdHigh}). Reduïm suport per fomentar autonomia.`,
        confidence: 0.85,
      };
    }

    // 3️⃣ Recuperació dèbil → Evocar prerequisit
    if (conceptState.retrievalStrength < config.retrievalThresholdLow) {
      const prerequisite = this.selectWeakestPrerequisite(
        conceptNode.prerequisites,
        studentModel
      );

      if (prerequisite) {
        return {
          decision: "evoke_prerequisite",
          targetConceptId: prerequisite,
          reasoning: `Recuperació dèbil (${conceptState.retrievalStrength.toFixed(2)} < ${config.retrievalThresholdLow}). Evoquem prerequisit "${prerequisite}".`,
          confidence: 0.8,
        };
      }
    }

    // 4️⃣ Estabilitat baixa → Revisió espaiada
    if (conceptState.stability < config.stabilityThresholdLow) {
      const timeSinceReview = currentTime - conceptState.lastReviewed;

      if (timeSinceReview > config.spacedReviewIntervalMs) {
        return {
          decision: "spaced_review",
          reasoning: `Estabilitat baixa (${conceptState.stability.toFixed(2)} < ${config.stabilityThresholdLow}). Revisió espaiada recomanada (últim intent fa ${this.formatDuration(timeSinceReview)}).`,
          confidence: 0.75,
        };
      }
    }

    // 5️⃣ Rendiment recent baix → Scaffold
    if (lastPerformanceScore < 0.6) {
      return {
        decision: "scaffold_current",
        reasoning: `Rendiment recent baix (${lastPerformanceScore.toFixed(2)}). Proporcionem suport addicional.`,
        confidence: 0.7,
      };
    }

    // 6️⃣ Per defecte → Scaffold moderat
    return {
      decision: "scaffold_current",
      reasoning: `Estat intermedi. Mantenim scaffold estàndard per consolidar.`,
      confidence: 0.6,
    };
  }

  /**
   * UTILITAT: Seleccionar prerequisit més dèbil
   */
  private selectWeakestPrerequisite(
    prerequisites: string[],
    studentModel: StudentModel
  ): string | undefined {
    if (prerequisites.length === 0) return undefined;

    // Troba prerequisit amb menor mastery
    let weakest: string | undefined = undefined;
    let lowestMastery = 1.0;

    for (const prereqId of prerequisites) {
      const prereqState = getConceptState(studentModel, prereqId);
      if (prereqState.mastery < lowestMastery) {
        lowestMastery = prereqState.mastery;
        weakest = prereqId;
      }
    }

    return weakest;
  }

  /**
   * UTILITAT: Formateja durada temporal
   */
  private formatDuration(milliseconds: number): string {
    const hours = Math.floor(milliseconds / 3600000);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} dies`;
    if (hours > 0) return `${hours} hores`;
    return "menys d'una hora";
  }
}

/**
 * FACTORY: Crear instància amb configuració per defecte
 */
export function createDecisionEngine(
  customConfig?: Partial<DecisionEngineConfig>
): DecisionEngine {
  const defaultConfig: DecisionEngineConfig = {
    masteryThresholdHigh: 0.8,
    masteryThresholdLow: 0.3,
    retrievalThresholdLow: 0.4,
    stabilityThresholdLow: 0.5,
    spacedReviewIntervalMs: 86400000, // 24 hores
  };

  const config = { ...defaultConfig, ...customConfig };
  return new DecisionEngine(config);
}