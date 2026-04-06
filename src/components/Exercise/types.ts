// src/components/Exercise/types.ts
// types.ts

// 1. Definim primer l'objecte de mètriques tal com el dóna el hook
export interface InteractionMetrics {
  latencyMs: number;
  focusLostCount: number;
  startTime: number;
  firstInteractionTime: number | null; // <-- Aquesta és la clau!
  hintsOpened: number; // <--- AFEGEIX AIXÒ
}

// 2. Usem aquesta interfície dins de l'estat de la UI
export interface ExerciseUIState {
  inputValue: string;
  attempts: number;
  status: ExerciseStatus;
  lastValidation?: ValidationResult;
  metrics: InteractionMetrics; // <-- Ara són idèntics
}

// ... resta de tipus (ValidationResult, ExerciseStatus, etc.)
export type ExerciseType = string;

export type DiagnosticCategory =
  | "CORRECT"
  | "CORRECT_NOT_SIMPLIFIED"
  | "WRONG_OPERATION"
  | "WRONG_OPERAND"
  | "FORMAT_ERROR"
  | "CONCEPTUAL_ERROR"
  | "OUT_OF_RANGE"
  | "PRECISION_ERROR"
  | "UNKNOWN";

export type ValidationStatus = "correct" | "partial" | "incorrect";

export interface DiagnosticResult {
  category: DiagnosticCategory;
  severity: "error" | "warning" | "info";
  message: string;
  affectedField?: string;
  suggestedAction?: string;
}

export interface ValidationResult {
  isCorrect: boolean;
  status: ValidationStatus;
  diagnostics: DiagnosticResult[];
  normalizedValue?: unknown;
  pedagogicalMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface TFMExerciseContract {
  exerciseId: string;
  exerciseType: ExerciseType;
  statement: string;
  expectedAnswer: unknown;
  metadata: Record<string, unknown>;
}

// Estat de la UI per al component React
export type ExerciseStatus = "idle" | "typing" | "validating" | "success" | "error";

// types.ts

// Primer definim l'estructura de la telemetria
export interface InteractionMetrics {
  latencyMs: number;
  focusLostCount: number;
  startTime: number;
  firstInteractionTime: number | null; // Aquesta és la que sol faltar!
}

// Després la fem servir a l'estat global
// types.ts
// src/components/Exercise/types.ts

export interface ExerciseUIState {
  inputValue: string;
  attempts: number;
  status: ExerciseStatus;
  // Afegim "| undefined" per complir amb la regla estricta del teu compilador
  lastValidation?: ValidationResult | undefined; 
  metrics: InteractionMetrics;
}