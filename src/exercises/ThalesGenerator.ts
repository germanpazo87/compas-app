/**
 * THALES GENERATOR
 * Implements ExerciseGenerator for the Thales theorem module.
 * Combines pure math (thalesValueGenerator) with LLM contextualization
 * (ExerciseContextualizer) to produce a fully hydrated ExerciseInstance.
 */

import type { ExerciseGenerator, ExerciseInstance, RNG } from "../core/ExerciseEngine";
import { generateThalesValues, type ThalesLevel } from "./thalesValueGenerator";
import { ExerciseContextualizer } from "../services/ExerciseContextualizer";
import type { TalesDiagramType } from "../components/geometry/TalesSVG";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveDiagramType(level: ThalesLevel): TalesDiagramType | null {
  switch (level) {
    case 'TALES_BASIC':    return 'classic';
    case 'TALES_SHADOWS':  return 'shadow';
    case 'TALES_SCALE':    return null;
    case 'TALES_CONTEXT':  return null;
    case 'SIMILAR_ID':     return 'similar';
    case 'PROPORTION_BASIC': return null;
  }
}

let _instanceCounter = 0;

// ---------------------------------------------------------------------------
// ThalesGenerator
// ---------------------------------------------------------------------------

export class ThalesGenerator implements ExerciseGenerator {
  async generate(_rng: RNG, options?: { level?: ThalesLevel; preferredLanguage?: string; educationalLevel?: string }): Promise<ExerciseInstance> {
    const requestedLevel: ThalesLevel = options?.level ?? 'TALES_BASIC';

    // Guard: only levels with a working value generator are allowed.
    // SIMILAR_ID is a visual-only exercise not yet wired to this generator.
    // Any unrecognised level falls back to TALES_BASIC.
    const KNOWN_LEVELS: readonly ThalesLevel[] = [
      'PROPORTION_BASIC', 'TALES_BASIC', 'TALES_SHADOWS', 'TALES_SCALE', 'TALES_CONTEXT',
    ];
    const level: ThalesLevel = KNOWN_LEVELS.includes(requestedLevel) ? requestedLevel : 'TALES_BASIC';

    // 1. Pure math — synchronous
    const params = generateThalesValues(level);

    // 2. Override language and level from caller if provided
    if (options?.preferredLanguage) {
      params.preferredLanguage = options.preferredLanguage;
    }
    if (options?.educationalLevel) {
      params.educationalLevel = options.educationalLevel;
    }

    // 3. LLM contextualization — async
    const ctx = await ExerciseContextualizer.contextualize(params);

    // 4. Build ExerciseInstance
    const id = `thales_${level}_${++_instanceCounter}_${Date.now()}`;

    return {
      id,
      type: 'thales',
      prompt: ctx.statementCatalan,
      solution: { correct: ctx.answer },
      data: { params, tolerance: ctx.tolerance },
      metadata: {
        level,
        diagramType: resolveDiagramType(level),
        svgParams:            ctx.svgParams,
        statementCatalan:     ctx.statementCatalan,
        statementTranslated:  ctx.statementTranslated,
        tolerance:            ctx.tolerance,
      },
    };
  }

  evaluate(exercise: ExerciseInstance, answer: unknown): ReturnType<ExerciseGenerator['evaluate']> {
    const correct = (exercise.solution as { correct: number }).correct;
    const tolerance = (exercise.metadata as any).tolerance ?? 0.1;
    const raw = typeof answer === 'string' ? parseFloat(answer.replace(',', '.')) : Number(answer);

    if (isNaN(raw)) {
      return { correct: false, score: 0, feedback: 'La resposta ha de ser un número.', error_type: 'FORMAT_ERROR' };
    }

    const isCorrect = Math.abs(raw - correct) <= tolerance;
    return {
      correct: isCorrect,
      score: isCorrect ? 1 : 0,
      feedback: isCorrect
        ? `Correcte! La resposta és ${correct}.`
        : `Incorrecte. La resposta correcta és ${correct}.`,
      error_type: isCorrect ? 'NONE' : 'WRONG_RESULT',
    };
  }
}
