/**
 * DECISION ENGINE TYPES
 * Contracte per motor de decisions pedagògiques basades en evidència.
 */

import type { StudentModel } from "../studentModel/types";
import type { ConceptGraph } from "../pedagogy/conceptGraph/types";

/**
 * Tipus de decisions pedagògiques possibles
 */
export type PedagogicalDecisionType =
  | "scaffold_current" // Proporcionar suport al concepte actual
  | "reduce_scaffold_current" // Reduir suport (alumne domina el concepte)
  | "evoke_prerequisite" // Evocar prerequisit dèbil
  | "evoke_related" // Evocar concepte relacionat
  | "spaced_review" // Revisió espaiada per consolidar
  | "interleave_prerequisite" // Intercalar prerequisit
  | "advance_current" // Avançar a concepte més difícil
  | "remediate_current" // Reforçar concepte actual amb més pràctica
  | "advance_to_next";

/**
 * Configuració del motor de decisions
 */
export interface DecisionEngineConfig {
  masteryThresholdHigh: number; // Ex: 0.8 (domini alt)
  masteryThresholdLow: number; // Ex: 0.3 (domini baix)

  retrievalThresholdLow: number; // Ex: 0.4 (recuperació dèbil)
  stabilityThresholdLow: number; // Ex: 0.5 (estabilitat baixa)

  spacedReviewIntervalMs: number; // Ex: 86400000 (24h)
}

/**
 * Input per motor de decisions
 */
export interface DecisionEngineInput {
  currentConceptId: string;

  studentModel: StudentModel;
  conceptGraph: ConceptGraph;

  lastPerformanceScore: number; // 0–1: Rendiment en últim intent
  currentTime: number; // Timestamp actual (ms)

  lastEvocationScore?: number; // Opcional per compatibilitat
  
  config: DecisionEngineConfig;
}

/**
 * Decisió pedagògica generada
 */
export interface PedagogicalDecision {
  decision: PedagogicalDecisionType;

  targetConceptId?: string; // Opcional: concepte objectiu (per evoke/interleave)

  reasoning: string; // Explicació de la decisió (per transparència)

  confidence: number; // 0–1: Confiança en la decisió
}