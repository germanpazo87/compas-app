/**
 * PREREQUISITE GENERATOR
 * Handles POWERS, SQRT and PROPORTION remediation exercises.
 * No LLM, no steps, no SVG — statement + numeric answer only.
 */

import type { ExerciseGenerator, ExerciseInstance, RNG } from "../core/ExerciseEngine";
import { generatePrerequisiteValues, type PrerequisiteLevel } from "./prerequisiteValueGenerator";

let _instanceCounter = 0;

export class PrerequisiteGenerator implements ExerciseGenerator {
  async generate(
    _rng: RNG,
    options?: { level?: PrerequisiteLevel },
  ): Promise<ExerciseInstance> {
    const level: PrerequisiteLevel = options?.level ?? 'POWERS';
    const params = generatePrerequisiteValues(level);
    const v = params.values as any;

    let statement: string;
    let answer: number;

    switch (level) {
      case 'POWERS':
        statement = `Calcula ${v.base}²`;
        answer    = v.answer as number;
        break;

      case 'SQRT':
        statement = `Calcula √${v.square}`;
        answer    = v.answer as number;
        break;

      case 'PROPORTION': {
        const vals: Record<string, string> = {
          a: params.unknownField === 'a' ? 'x' : String(v.a),
          b: params.unknownField === 'b' ? 'x' : String(v.b),
          c: params.unknownField === 'c' ? 'x' : String(v.c),
          d: params.unknownField === 'd' ? 'x' : String(v.d),
        };
        statement = `Troba x: ${vals.a}/${vals.b} = ${vals.c}/${vals.d}`;
        answer    = params.unknownField === 'a' ? v.a
                  : params.unknownField === 'b' ? v.b
                  : params.unknownField === 'c' ? v.c
                  : v.d;
        break;
      }
    }

    const id = `prerequisite-${level.toLowerCase()}-${++_instanceCounter}-${Date.now()}`;

    const instance: ExerciseInstance = {
      id,
      type: 'prerequisite',
      prompt: statement,
      solution: { correct: answer },
      data: {},
      metadata: { level, statement, answer, tolerance: 0 },
    };
    return instance;
  }

  evaluate(
    exercise: ExerciseInstance,
    answer: unknown,
  ): ReturnType<ExerciseGenerator['evaluate']> {
    const meta = exercise.metadata as { answer: number; tolerance: number };
    const raw  = typeof answer === 'string'
      ? parseFloat(answer.replace(',', '.'))
      : Number(answer);

    if (isNaN(raw)) {
      return {
        correct: false,
        score: 0,
        feedback: 'La resposta ha de ser un número.',
        error_type: 'FORMAT_ERROR',
      };
    }

    const tol       = meta.tolerance ?? 0;
    const isCorrect = Math.abs(raw - meta.answer) <= tol;
    return {
      correct: isCorrect,
      score:   isCorrect ? 1 : 0,
      feedback: isCorrect
        ? `Correcte!`
        : `Incorrecte. La resposta és ${meta.answer}.`,
      error_type: isCorrect ? 'NONE' : 'WRONG_RESULT',
    };
  }
}
