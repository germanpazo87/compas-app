import type { ExerciseType, TFMExerciseContract, ExerciseContext, ValidationResult } from './types';

export type ExerciseEvaluator = (
  input: unknown,
  contract: TFMExerciseContract,
  context: ExerciseContext
) => ValidationResult;

export class EvaluatorRegistry {
  private evaluators = new Map<ExerciseType, ExerciseEvaluator>();

  register(type: ExerciseType, evaluator: ExerciseEvaluator): void {
    if (this.evaluators.has(type)) throw new Error(`Ja existeix: ${type}`);
    this.evaluators.set(type, evaluator);
  }

  evaluate(type: ExerciseType, input: unknown, contract: TFMExerciseContract, context: ExerciseContext): ValidationResult {
    const evaluator = this.evaluators.get(type);
    if (!evaluator) {
      return { isCorrect: false, status: "incorrect", diagnostics: [{ category: "UNKNOWN", severity: "error", message: "Avaluador no trobat" }] };
    }
    return evaluator(input, contract, context);
  }
}