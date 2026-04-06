/**
 * PYTHAGORAS GENERATOR
 * Implements ExerciseGenerator for the Pythagorean theorem module.
 *
 * Identification levels (RIGHT_TRIANGLE_ID, HYPOTENUSE_ID) skip the LLM —
 * the SVG is the exercise, so narrative text is not needed.
 *
 * All other levels combine pure math (pythagorasValueGenerator) with
 * LLM contextualization (ExerciseContextualizer).
 */

import type { ExerciseGenerator, ExerciseInstance, RNG } from "../core/ExerciseEngine";
import type { ExerciseStep } from "../core/ExerciseSteps";
import { generatePythagorasValues, type PythagorasLevel } from "./pythagorasValueGenerator";
import { ExerciseContextualizer } from "../services/ExerciseContextualizer";
import type { PythagorasDiagramType } from "../components/geometry/PythagorasSVG";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveDiagramType(level: PythagorasLevel): PythagorasDiagramType | null {
  switch (level) {
    case 'RIGHT_TRIANGLE_ID': return 'identify';
    case 'HYPOTENUSE_ID':     return 'hypotenuse_id';
    case 'PYTH_HYPOTENUSE':   return 'triangle';
    case 'PYTH_LEG':          return 'triangle';
    case 'PYTH_VERIFY':       return null;
    case 'PYTH_CONTEXT':      return null;
  }
}

let _instanceCounter = 0;

// ---------------------------------------------------------------------------
// PythagorasGenerator
// ---------------------------------------------------------------------------

export class PythagorasGenerator implements ExerciseGenerator {
  async generate(
    _rng: RNG,
    options?: { level?: PythagorasLevel; preferredLanguage?: string; educationalLevel?: string },
  ): Promise<ExerciseInstance> {
    const level: PythagorasLevel = options?.level ?? 'PYTH_HYPOTENUSE';
    const params = generatePythagorasValues(level);
    const id = `pythagoras_${level}_${++_instanceCounter}_${Date.now()}`;

    // ── Branch A: RIGHT_TRIANGLE_ID — no LLM ─────────────────────────────
    if (level === 'RIGHT_TRIANGLE_ID') {
      const v = params.values;
      const triangles = [
        { a: Number(v.t1a), b: Number(v.t1b), c: Number(v.t1c) },
        { a: Number(v.t2a), b: Number(v.t2b), c: Number(v.t2c) },
        { a: Number(v.t3a), b: Number(v.t3b), c: Number(v.t3c) },
      ];
      const correctIndex = Number(v.correctTriangle);

      return {
        id,
        type: 'pythagoras',
        prompt: 'Identifica el triangle rectangle.',
        solution: { correct: correctIndex },
        data: { params, tolerance: 0 },
        metadata: {
          level,
          diagramType:         'identify',
          svgParams:           { triangles, correctIndex },
          statementCatalan:    'Identifica el triangle rectangle.',
          statementTranslated: null,
          tolerance:           0,
        },
      };
    }

    // ── Branch B: HYPOTENUSE_ID — no LLM ─────────────────────────────────
    if (level === 'HYPOTENUSE_ID') {
      const v = params.values;
      const svgParams = {
        sideA:      Number(v.sideA),
        sideB:      Number(v.sideB),
        sideC:      Number(v.sideC),
        // Generator always puts the hypotenuse as sideC → side 3 in PythagorasHypotenuseSVG
        hypotenuse: 3,
        rotation:   0,
      };

      return {
        id,
        type: 'pythagoras',
        prompt: 'Identifica la hipotenusa.',
        solution: { correct: 3 },
        data: { params, tolerance: 0 },
        metadata: {
          level,
          diagramType:         'hypotenuse_id',
          svgParams,
          statementCatalan:    'Identifica la hipotenusa.',
          statementTranslated: null,
          tolerance:           0,
        },
      };
    }

    // ── Branch C: PYTH_HYPOTENUSE — no LLM for math; optional translation ──
    if (level === 'PYTH_HYPOTENUSE') {
      const v    = params.values;
      const legA = Number(v.legA);
      const legB = Number(v.legB);
      const hyp  = Number(v.hypotenuse);
      const a2   = legA * legA;
      const b2   = legB * legB;

      const ROTATIONS = [0, 90, 180, 270] as const;
      const svgRotation = ROTATIONS[Math.floor(Math.random() * 4)] as 0 | 90 | 180 | 270;

      // ── Statement (template — no LLM) ──────────────────────────────────
      const CATALAN_CONTEXTS = [
        `Un triangle rectangle té els catets ${legA} i ${legB}. Calcula la hipotenusa (x).`,
        `Troba la hipotenusa d'un triangle rectangle amb catets ${legA} i ${legB}.`,
        `Calcula x en un triangle rectangle on a=${legA} i b=${legB}.`,
      ];
      const statementCatalan =
        CATALAN_CONTEXTS[Math.floor(Math.random() * CATALAN_CONTEXTS.length)];

      // ── Translation (lightweight LLM call only when needed) ────────────
      const preferredLang = options?.preferredLanguage ?? 'ca';
      let statementTranslated: string | null = null;
      if (preferredLang !== 'ca') {
        try {
          const ctx = await ExerciseContextualizer.contextualize({
            type:            'PYTH_HYPOTENUSE_STATEMENT',
            values:          { legA, legB, statement: statementCatalan },
            unknownField:    'hypotenuse',
            preferredLanguage: preferredLang,
          });
          statementTranslated = ctx.statementTranslated;
        } catch {
          statementTranslated = null;
        }
      }

      // ── Steps ───────────────────────────────────────────────────────────
      const steps: ExerciseStep[] = [
        {
          id: 'identify_right_angle',
          order: 1,
          type: 'click_svg',
          instruction: "Clica sobre l'angle recte del triangle.",
          hint: "L'angle recte és el que mesura exactament 90°. Busca el quadradet al triangle.",
          correctAnswer: 'corner_BL',
          svgHighlight: 'corner_BL',
        },
        {
          id: 'identify_hypotenuse',
          order: 2,
          type: 'click_svg',
          instruction: 'Ara clica sobre la hipotenusa.',
          hint: "La hipotenusa és sempre el costat més llarg, el que està davant de l'angle recte.",
          correctAnswer: 'hypotenuse',
          svgHighlight: 'side_hypotenuse',
        },
        {
          id: 'select_formula',
          order: 3,
          type: 'select_option',
          instruction: 'Quina fórmula has de fer servir per calcular la hipotenusa?',
          options: ['c² = a² + b²', 'a² = c² - b²', 'b² = c² - a²'],
          correctAnswer: 'c² = a² + b²',
          hint: 'Per trobar la hipotenusa (c) necessites SUMAR els quadrats dels dos catets.',
        },
        {
          id: 'substitute_values',
          order: 4,
          type: 'fill_values',
          // correctAnswer stores raw leg values; UI shows them squared
          // evaluation is order-independent: legA+legB or legB+legA accepted
          instruction: 'Substitueix els valors. c² = a² + b²',
          correctAnswer: `${legA} + ${legB}`,
          hint: `Entra els valors dels catets: a = ${legA} i b = ${legB} (pots posar-los en qualsevol ordre).`,
        },
        {
          id: 'calculate_result',
          order: 5,
          type: 'numeric_input',
          instruction: `Ara calcula c = √(a² + b²). Amb els teus valors: c = √(${legA}² + ${legB}²)`,
          correctAnswer: hyp,
          hint: "Fes servir la calculadora per calcular l'arrel quadrada.",
        },
      ];

      return {
        id,
        type: 'pythagoras',
        prompt: statementCatalan,
        solution: { correct: hyp },
        data: { params, tolerance: 0.01 },
        metadata: {
          level,
          diagramType:         'triangle' as const,
          svgParams:           { legA, legB, hypotenuse: hyp, unknownSide: 'hypotenuse', rotation: svgRotation },
          statementCatalan,
          statementTranslated,
          tolerance:           0.01,
          steps,
          svgRotation,
          currentStepIndex:    0,
        } as any,
      };
    }

    // ── Branch D: all other levels — LLM contextualization ───────────────
    if (options?.preferredLanguage) {
      params.preferredLanguage = options.preferredLanguage;
    }
    if (options?.educationalLevel) {
      params.educationalLevel = options.educationalLevel;
    }

    const ctx = await ExerciseContextualizer.contextualize(params);

    const instance: ExerciseInstance = {
      id,
      type: 'pythagoras',
      prompt: ctx.statementCatalan,
      solution: { correct: ctx.answer },
      data: { params, tolerance: ctx.tolerance },
      metadata: {
        level,
        diagramType:          resolveDiagramType(level),
        svgParams:            ctx.svgParams,
        statementCatalan:     ctx.statementCatalan,
        statementTranslated:  ctx.statementTranslated,
        tolerance:            ctx.tolerance,
      },
    };

    return instance;
  }

  evaluate(exercise: ExerciseInstance, answer: unknown): ReturnType<ExerciseGenerator['evaluate']> {
    const level   = (exercise.metadata as any)?.level as string;
    const correct = (exercise.solution as { correct: number }).correct;

    // ── RIGHT_TRIANGLE_ID: exact triangle index match (0 / 1 / 2) ────────
    if (level === 'RIGHT_TRIANGLE_ID') {
      const raw = Number(answer);
      if (isNaN(raw)) {
        return { correct: false, score: 0, feedback: 'Selecciona un triangle.', error_type: 'FORMAT_ERROR' };
      }
      const isCorrect = raw === correct;
      return {
        correct: isCorrect,
        score: isCorrect ? 1 : 0,
        feedback: isCorrect
          ? 'Correcte! Heu identificat el triangle rectangle.'
          : `Incorrecte. El triangle rectangle era el Triangle ${correct + 1}.`,
        error_type: isCorrect ? 'NONE' : 'WRONG_RESULT',
      };
    }

    // ── HYPOTENUSE_ID: exact side number match (1 / 2 / 3) ───────────────
    if (level === 'HYPOTENUSE_ID') {
      const raw = Number(answer);
      if (isNaN(raw)) {
        return { correct: false, score: 0, feedback: 'Selecciona un costat.', error_type: 'FORMAT_ERROR' };
      }
      const isCorrect = raw === correct;
      return {
        correct: isCorrect,
        score: isCorrect ? 1 : 0,
        feedback: isCorrect
          ? 'Correcte! Heu identificat la hipotenusa.'
          : `Incorrecte. La hipotenusa era el Costat ${correct}.`,
        error_type: isCorrect ? 'NONE' : 'WRONG_RESULT',
      };
    }

    // ── PYTH_VERIFY: exact 0 / 1 match ───────────────────────────────────
    if (level === 'PYTH_VERIFY') {
      const raw = Number(answer);
      if (isNaN(raw)) {
        return { correct: false, score: 0, feedback: 'Selecciona Sí o No.', error_type: 'FORMAT_ERROR' };
      }
      const isCorrect   = raw === correct;
      const correctLabel = correct === 1 ? 'Sí, és rectangle' : 'No, no és rectangle';
      return {
        correct: isCorrect,
        score: isCorrect ? 1 : 0,
        feedback: isCorrect
          ? `Correcte! ${correctLabel}.`
          : `Incorrecte. La resposta correcta era: ${correctLabel}.`,
        error_type: isCorrect ? 'NONE' : 'WRONG_RESULT',
      };
    }

    // ── Default: numeric answer with tolerance ────────────────────────────
    const tolerance = (exercise.metadata as any).tolerance ?? 0.01;
    const raw = typeof answer === 'string'
      ? parseFloat((answer as string).replace(',', '.'))
      : Number(answer);

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
