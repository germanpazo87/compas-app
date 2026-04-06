// src/domain/statistics/types.ts
import { type StatisticsLevel } from "../../core/ExerciseEngine"; // Importem el tipus del motor
/**
 * 1. TIPUS DE VARIABLES
 * Usem 'VariableTypes' (plural) per a l'objecte de valors
 * i 'VariableType' (singular) per al tipus de TypeScript.
 */
export const VariableTypes = {
  QUALITATIVE_NOMINAL: "QUALITATIVE_NOMINAL",
  QUALITATIVE_ORDINAL: "QUALITATIVE_ORDINAL",
  QUANTITATIVE_DISCRETE: "QUANTITATIVE_DISCRETE",
  QUANTITATIVE_CONTINUOUS: "QUANTITATIVE_CONTINUOUS"
} as const;

export type VariableType = typeof VariableTypes[keyof typeof VariableTypes];

/**
 * 2. SUBTIPUS D'EXERCICIS D'ESTADÍSTICA
 */
export const StatisticsSubtypes = {
  frequency_table: "frequency_table",
  central_tendency: "central_tendency",
  dispersion: "dispersion",
  normal_distribution: "normal_distribution",
  conceptual: "conceptual"
} as const;

export type StatisticsSubtype = typeof StatisticsSubtypes[keyof typeof StatisticsSubtypes];

// ============================================================================
// 3. ESTRUCTURES DE LES FILES I SOLUCIONS
// ============================================================================

export interface FrequencyRow {
  value: number | string;
  fi: number; // Freqüència Absoluta
  ni: number; // Freqüència Relativa
  pi: number; // Percentatge (%)
  Fi: number; // Absoluta Acumulada
  Ni: number; // Relativa Acumulada
}

export interface FrequencyTableSolution {
  subtype: "frequency_table";
  variableType: VariableType;
  rows: FrequencyRow[];
  totals: { fi: number; ni: number; pi: number }; // 👈 AFEGEIX AIXÒ
  totalN: number;
}

export interface CentralTendencySolution {
  subtype: "central_tendency";
  mean: number;
  median: number;
  mode: number[]; // Array perquè pot ser bimodal o multimodal
}

export interface DispersionSolution {
  subtype: "dispersion";
  range: number;
  variancePopulation: number;
  varianceSample: number;
  stdDevPopulation: number;
  stdDevSample: number;
}

export interface NormalDistributionSolution {
  subtype: "normal_distribution";
  mean: number;
  stdDev: number;
  targetValue: number;
  zScore: number;
  probability: number; // P(X < targetValue) o P(X > targetValue)
  questionType: "probability_less" | "probability_greater";
}

export interface ConceptualSolution {
  subtype: "conceptual";
  topic: "bias" | "outliers" | "population_vs_sample" | "skewness";
  correctOptionId: string;
  explanation: string;
}

/**
 * 4. UNIÓ DISCRIMINADA DE SOLUCIONS
 * Això permet a l'Evaluator saber quins camps té cada solució segons el 'subtype'.
 */
export type StatisticsSolution =
  | FrequencyTableSolution
  | CentralTendencySolution
  | DispersionSolution
  | NormalDistributionSolution
  | ConceptualSolution;

/**
 * 5. METADADES DE L'EXERCICI
 */
export interface StatisticsMetadata {
  level: StatisticsLevel; // 👈 AFEGEIX AQUESTA LÍNIA
  difficulty: number;
  precision?: number;
  rawData?: number[];
  context?: string;
}