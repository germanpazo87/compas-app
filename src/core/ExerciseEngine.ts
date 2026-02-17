// src/core/ExerciseEngine.ts

// 1. Definicions de Tipus (Mantenim els teus i afegim el Level)
export type ExerciseType = 
  | "fractions" 
  | "statistics" 
  | "arithmetic"; // Simplificat, pots mantenir la llista llarga si vols

export type StatisticsLevel = 
  | "CONCEPTUAL"       // Nivell 1
  | "BASIC_CALC"       // Nivell 2
  | "FREQ_TABLE"       // Nivell 3
  | "CRITICAL_THINKING"; // Nivell 4

export const ExerciseErrorType = {
  FORMAT_ERROR: "FORMAT_ERROR",
  WRONG_RESULT: "WRONG_RESULT",
  NOT_SIMPLIFIED: "NOT_SIMPLIFIED",
  CALCULATION_ERROR: "CALCULATION_ERROR",
  INCOMPLETE: "INCOMPLETE",
  NONE: "NONE" // Afegit per comoditat
} as const;

export type ExerciseErrorType = typeof ExerciseErrorType[keyof typeof ExerciseErrorType];

// 2. Interfícies Base (Fusionades)
export interface StatisticsMetadata {
  level: StatisticsLevel; // 👈 NOU: Vital per al tutor
  difficulty: number;
  dataset?: number[];
  precision?: number;
  rawData?: number[]; // Legacy support
  // Per a conceptual
  options?: string[];
  correctOptionIndex?: number;
}

export interface ExerciseInstance<T=any, S = any, M = StatisticsMetadata> {
  id: string;
  type: "statistics" | "arithmetic" | "fractions";
  prompt: string;
  solution: S;
  data: T;
  metadata: M;
}

export interface AnswerEvaluationResult {
  correct: boolean;
  score?: number; // 0 a 1
  feedback: string;
  error_type?: ExerciseErrorType;
}

export type RNG = () => number;

// 3. Generador Flexible
export interface ExerciseGenerator<S = any, M = any> {
  // ⚠️ CANVI CLAU: Acceptem options per passar { level: 'BASIC_CALC' }
  generate(rng: RNG, options?: any): ExerciseInstance<S, M>;
  evaluate(exercise: ExerciseInstance<S, M>, answer: S): AnswerEvaluationResult;
}

// 4. L'Orquestrador
export class ExerciseEngine {
  private registry: Map<string, ExerciseGenerator>; // Canviat a string per flexibilitat
  private rng: RNG;

  constructor(registry: Map<string, ExerciseGenerator>, rng: RNG = Math.random) {
    this.registry = registry;
    this.rng = rng;
  }

  generate(type: string, options?: any): ExerciseInstance {
    const generator = this.registry.get(type);
    if (!generator) throw new Error(`MissingGenerator: ${type}`);
    return generator.generate(this.rng, options);
  }

  evaluate(exercise: ExerciseInstance, answer: any): AnswerEvaluationResult {
    const generator = this.registry.get(exercise.type);
    if (!generator) throw new Error(`MissingGenerator: ${exercise.type}`);
    return generator.evaluate(exercise, answer);
  }
}