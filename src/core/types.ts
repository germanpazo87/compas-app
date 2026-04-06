// 1. Tipus bàsics
export type ExerciseType = string;
export type ValidationStatus = "correct" | "partial" | "incorrect";

// 2. Diagnòstics
export interface DiagnosticResult {
  category: string;
  severity: "error" | "warning" | "info";
  message: string;
}

// 3. Resultat de la validació
export interface ValidationResult {
  isCorrect: boolean;
  status: ValidationStatus;
  diagnostics: DiagnosticResult[];
  normalizedValue?: unknown;
  pedagogicalMessage?: string;
}

// 4. L'esdeveniment (Aquesta és la que et donava error)
export interface InteractionEvent {
  timestamp: string;
  eventType: "attempt" | "hint_request" | "focus_lost" | "exercise_complete";
  data: unknown;
}

// 5. El registre d'un intent (usa ValidationResult)
export interface AttemptRecord {
  attemptNumber: number;
  timestamp: string;
  inputRaw: unknown;
  latencyMs: number;
  hintUsed: boolean;
  focusLost: boolean;
  validationResult: ValidationResult;
}

// 6. La traça completa (usa AttemptRecord i InteractionEvent)
export interface InteractionTrace {
  traceId: string;
  exerciseId: string;
  exerciseType: ExerciseType;
  sessionId: string;
  startedAt: string;
  completedAt?: string;
  attempts: AttemptRecord[];
  events: InteractionEvent[];
  finalResult?: ValidationResult;
}

// 7. El contracte de l'exercici
export interface TFMExerciseContract {
  exerciseId: string;
  exerciseType: ExerciseType;
  statement: string;
  expectedAnswer: unknown;
  metadata: Record<string, unknown>;
}

// 8. El context de l'exercici
export interface ExerciseContext {
  attemptNumber: number;
  previousAttemptsCount: number;
  timeSpentMs: number;
  hintsUsed: number;
}