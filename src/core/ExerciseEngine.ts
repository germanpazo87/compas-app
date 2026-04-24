// src/core/ExerciseEngine.ts
import type { ExerciseStep, SteppedExercise } from "./ExerciseSteps";

// 1. Definicions de Tipus (Mantenim els teus i afegim el Level)
export type ExerciseType =
  | "fractions"
  | "statistics"
  | "arithmetic"
  | "thales"
  | "pythagoras"
  | "prerequisite";

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
  // Stepped exercise support (optional — only for stepped exercises)
  steps?: ExerciseStep[];
  currentStepIndex?: number;
  steppedState?: SteppedExercise;
}

export interface ExerciseInstance<T=any, S = any, M = StatisticsMetadata> {
  id: string;
  type: "statistics" | "arithmetic" | "fractions" | "thales" | "pythagoras" | "prerequisite";
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
  // generate() may return synchronously or asynchronously (e.g. ThalesGenerator awaits LLM)
  generate(rng: RNG, options?: any): ExerciseInstance<S, M> | Promise<ExerciseInstance<S, M>>;
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

  async generate(type: string, options?: any): Promise<ExerciseInstance> {
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