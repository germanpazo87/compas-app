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

function buildRotation(): 0 | 90 | 180 | 270 {
  const ROTATIONS = [0, 90, 180, 270] as const;
  return ROTATIONS[Math.floor(Math.random() * 4)] as 0 | 90 | 180 | 270;
}

function pickCatalanTemplate(templates: string[]): string {
  return templates[Math.floor(Math.random() * templates.length)];
}

function buildPythHypotenuseSteps(legA: number, legB: number, hyp: number): ExerciseStep[] {
  return [
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
      instruction: 'Substitueix els valors. c² = a² + b²',
      correctAnswer: `${legA} + ${legB}`,
      fillLabel: 'c²',
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
}

function buildPythLegSteps(
  legA: number,
  legB: number,
  hyp: number,
  unknownField: 'legA' | 'legB',
): ExerciseStep[] {
  const knownLeg        = unknownField === 'legA' ? legB : legA;
  const unknownLegValue = unknownField === 'legA' ? legA : legB;
  const unknownLetter   = unknownField === 'legA' ? 'a' : 'b';
  const knownLetter     = unknownField === 'legA' ? 'b' : 'a';
  const unknownSvgId    = unknownField; // 'legA' or 'legB' — matches PythagorasTriangleSVG click_side IDs

  const formula = unknownField === 'legA'
    ? { correct: 'a² = c² - b²', options: ['a² = c² - b²', 'b² = c² - a²', 'c² = a² + b²'] }
    : { correct: 'b² = c² - a²', options: ['b² = c² - a²', 'a² = c² - b²', 'c² = a² + b²'] };

  return [
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
      id: 'identify_hypotenuse_and_unknown',
      order: 2,
      type: 'click_svg_sequence',
      instruction: 'Identifica la hipotenusa i el catet desconegut.',
      correctAnswer: 'hypotenuse', // primary (sub-step tracking drives actual evaluation)
      subSteps: [
        {
          instruction: 'Clica sobre la hipotenusa.',
          correctAnswer: 'hypotenuse',
          hint: "La hipotenusa és el costat més llarg, davant de l'angle recte.",
        },
        {
          instruction: 'Ara clica sobre el catet desconegut (x).',
          correctAnswer: unknownSvgId,
          hint: `El catet desconegut és el que no coneixem. El catet conegut és ${knownLeg}.`,
        },
      ],
    },
    {
      id: 'select_formula',
      order: 3,
      type: 'select_option',
      instruction: 'Quina fórmula has de fer servir per calcular el catet desconegut?',
      options: formula.options,
      correctAnswer: formula.correct,
      hint: "Per trobar un catet has de RESTAR el quadrat de l'altre catet al quadrat de la hipotenusa.",
    },
    {
      id: 'substitute_values',
      order: 4,
      type: 'fill_values',
      instruction: `Substitueix els valors. ${unknownLetter}² = c² - ${knownLetter}²`,
      // order fixed: hypotenuse first, known leg second
      correctAnswer: `${hyp} - ${knownLeg}`,
      fillLabel: `${unknownLetter}²`,
      hint: `La hipotenusa és ${hyp} i el catet conegut és ${knownLeg}.`,
    },
    {
      id: 'calculate_result',
      order: 5,
      type: 'numeric_input',
      instruction: `Ara calcula ${unknownLetter} = √(c² - ${knownLetter}²). Amb els teus valors: ${unknownLetter} = √(${hyp}² - ${knownLeg}²)`,
      correctAnswer: unknownLegValue,
      hint: `Fes servir la calculadora: calcula primer ${hyp}² - ${knownLeg}², després fes l'arrel quadrada del resultat.`,
    },
  ];
}

function buildPythVerifySteps(
  sideA: number,
  sideB: number,
  sideC: number,
  isRight: number,
): ExerciseStep[] {
  const a2  = sideA * sideA;
  const b2  = sideB * sideB;
  const c2  = sideC * sideC;
  const sum = a2 + b2;

  return [
    {
      id: 'identify_hypotenuse',
      order: 1,
      type: 'click_svg',
      instruction: "Clica sobre el costat que podria ser la hipotenusa (el més llarg).",
      correctAnswer: 'hypotenuse',
      svgHighlight: 'side_hypotenuse',
      hint: "La hipotenusa sempre és el costat més llarg del triangle rectangle. Quin dels tres costats mesura més?",
    },
    {
      id: 'verify_right_angle',
      order: 2,
      type: 'select_option',
      instruction:
        `Comprova si és un triangle rectangle:\n` +
        `${sideA}² + ${sideB}² = ${a2} + ${b2} = ${sum}\n` +
        `${sideC}² = ${c2}\n` +
        `Són iguals? És un triangle rectangle?`,
      options: ['Sí, és rectangle', 'No, no és rectangle'],
      correctAnswer: isRight === 1 ? 'Sí, és rectangle' : 'No, no és rectangle',
      hint: isRight === 1
        ? `Els dos valors són iguals (${sum} = ${c2})! Quan a² + b² = c², el triangle SÍ és rectangle.`
        : `Els dos valors NO són iguals (${sum} ≠ ${c2}). Quan a² + b² ≠ c², el triangle NO és rectangle.`,
    },
  ];
}

function buildPythContextSteps(
  subtype: string,
  unknownField: string,
  values: Record<string, number | string>,
): ExerciseStep[] {
  // ── Map subtype values → canonical legA / legB / hyp ──────────────────
  let legA: number, legB: number, hyp: number;
  let hypDisplay: string, legADisplay: string, legBDisplay: string;
  let hypLabel: string, legALabel: string, legBLabel: string;
  let step1Hint: string;

  switch (subtype) {
    case 'ladder':
      hyp  = Number(values.ladderLength);
      legA = Number(values.wallHeight);
      legB = Number(values.groundDistance);
      hypLabel  = 'Hipotenusa (escala)';
      legALabel = 'Catet vertical (paret)';
      legBLabel = 'Catet horitzontal (terra)';
      step1Hint = "L'escala és la hipotenusa perquè va del terra a la paret en diagonal.";
      break;
    case 'distance':
      hyp  = Number(values.distance);
      legA = Number(values.deltaY);
      legB = Number(values.deltaX);
      hypLabel  = 'Hipotenusa (distància directa)';
      legALabel = 'Catet (distància nord)';
      legBLabel = 'Catet (distància est)';
      step1Hint = "La distància en línia recta és sempre la hipotenusa del triangle rectangle.";
      break;
    case 'diagonal':
      hyp  = Number(values.diagonal);
      legA = Number(values.height);
      legB = Number(values.width);
      hypLabel  = 'Hipotenusa (diagonal)';
      legALabel = 'Catet (alçada)';
      legBLabel = 'Catet (amplada)';
      step1Hint = "La diagonal d'un rectangle és la hipotenusa del triangle rectangle que forma.";
      break;
    case 'height':
    default:
      hyp  = Number(values.slant);
      legA = Number(values.halfBase);
      legB = Number(values.triangleHeight);
      hypLabel  = 'Hipotenusa (costat igual)';
      legALabel = 'Catet (meitat de la base)';
      legBLabel = 'Catet (alçada)';
      step1Hint = "L'alçada divideix la base en dues meitats iguals, creant dos triangles rectangles.";
      break;
  }

  // ── Determine which side is unknown ────────────────────────────────────
  const fieldToSide: Record<string, 'hypotenuse' | 'legA' | 'legB'> = {
    ladderLength:    'hypotenuse',
    distance:        'hypotenuse',
    diagonal:        'hypotenuse',
    triangleHeight:  'legB',
    wallHeight:      'legA',
    groundDistance:  'legB',
    deltaX:          'legB',
    deltaY:          'legA',
    width:           'legB',
    height:          'legA',
    halfBase:        'legA',
    slant:           'hypotenuse',
  };
  const unknownSide: 'hypotenuse' | 'legA' | 'legB' = fieldToSide[unknownField] ?? 'hypotenuse';

  // ── Per-side display value: numeric string or 'x' ──────────────────────
  hypDisplay  = unknownSide === 'hypotenuse' ? 'x' : `${hyp}m`;
  legADisplay = unknownSide === 'legA'       ? 'x' : `${legA}m`;
  legBDisplay = unknownSide === 'legB'       ? 'x' : `${legB}m`;

  // The three values as dropdown options (UI will shuffle)
  const dropdownOptions = [hypDisplay, legADisplay, legBDisplay];

  // ── Step 3: formula ─────────────────────────────────────────────────────
  const formula = unknownSide === 'hypotenuse'
    ? { correct: 'c² = a² + b²', options: ['c² = a² + b²', 'a² = c² - b²', 'b² = c² - a²'] }
    : unknownSide === 'legA'
    ? { correct: 'a² = c² - b²', options: ['a² = c² - b²', 'b² = c² - a²', 'c² = a² + b²'] }
    : { correct: 'b² = c² - a²', options: ['b² = c² - a²', 'a² = c² - b²', 'c² = a² + b²'] };

  // ── Step 4: fill_values ─────────────────────────────────────────────────
  const fillLabel = unknownSide === 'hypotenuse' ? 'c²'
    : unknownSide === 'legA' ? 'a²' : 'b²';
  const fillCorrectAnswer = unknownSide === 'hypotenuse'
    ? `${legA} + ${legB}`
    : unknownSide === 'legA'
    ? `${hyp} - ${legB}`
    : `${hyp} - ${legA}`;

  // ── Step 5: unknown value ───────────────────────────────────────────────
  const unknownValue = unknownSide === 'hypotenuse' ? hyp
    : unknownSide === 'legA' ? legA : legB;

  return [
    {
      id: 'label_triangle',
      order: 1,
      type: 'label_triangle',
      instruction: "Llegeix l'enunciat i assigna cada dada al costat del triangle corresponent.",
      correctAnswer: JSON.stringify({ hypotenuse: hypDisplay, legA: legADisplay, legB: legBDisplay }),
      hint: step1Hint,
      labelOptions: [
        { id: 'hypotenuse', displayName: hypLabel,  correctValue: hypDisplay,  },
        { id: 'legA',       displayName: legALabel, correctValue: legADisplay, },
        { id: 'legB',       displayName: legBLabel, correctValue: legBDisplay, },
      ],
      // Store dropdown options list on the step so the UI can read them without recomputing
      // We reuse the options field (normally for select_option) as a string[] of the three values.
      options: dropdownOptions,
    },
    {
      id: 'identify_hypotenuse',
      order: 2,
      type: 'click_svg',
      instruction: 'Clica sobre la hipotenusa al triangle.',
      correctAnswer: 'hypotenuse',
      svgHighlight: 'side_hypotenuse',
      hint: `La hipotenusa és el costat que has identificat com ${hypDisplay} al pas anterior.`,
    },
    {
      id: 'select_formula',
      order: 3,
      type: 'select_option',
      instruction: 'Quina fórmula has de fer servir?',
      options: formula.options,
      correctAnswer: formula.correct,
      hint: unknownSide === 'hypotenuse'
        ? 'Per trobar la hipotenusa (c) necessites SUMAR els quadrats dels dos catets.'
        : "Per trobar un catet has de RESTAR el quadrat de l'altre catet al quadrat de la hipotenusa.",
    },
    {
      id: 'substitute_values',
      order: 4,
      type: 'fill_values',
      instruction: `Substitueix els valors a la fòrmula.`,
      correctAnswer: fillCorrectAnswer,
      fillLabel,
      hint: unknownSide === 'hypotenuse'
        ? `La hipotenusa és x; els catets coneguts són ${legA} i ${legB}.`
        : `La hipotenusa és ${hyp} i el catet conegut és ${unknownSide === 'legA' ? legB : legA}.`,
    },
    {
      id: 'calculate_result',
      order: 5,
      type: 'numeric_input',
      instruction: 'Calcula el resultat.',
      correctAnswer: unknownValue,
      hint: 'Fes servir la calculadora científica.',
    },
  ];
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
          svgParams:           { triangles, correctIndex,
                               t1rot: Number(v.t1rot ?? 0),
                               t2rot: Number(v.t2rot ?? 0),
                               t3rot: Number(v.t3rot ?? 0) },
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
        rotation:   Number(v.rot ?? 0),
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

      const svgRotation = buildRotation();

      // ── Statement (template — no LLM) ──────────────────────────────────
      const statementCatalan = pickCatalanTemplate([
        `Un triangle rectangle té els catets ${legA} i ${legB}. Calcula la hipotenusa (x).`,
        `Troba la hipotenusa d'un triangle rectangle amb catets ${legA} i ${legB}.`,
        `Calcula x en un triangle rectangle on a=${legA} i b=${legB}.`,
      ]);

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
      const steps = buildPythHypotenuseSteps(legA, legB, hyp);

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

    // ── Branch D: PYTH_LEG — no LLM for math; optional translation ────────
    if (level === 'PYTH_LEG') {
      const v            = params.values;
      const legA         = Number(v.legA);
      const legB         = Number(v.legB);
      const hyp          = Number(v.hypotenuse);
      const unknownField = params.unknownField as 'legA' | 'legB';
      const svgRotation  = buildRotation();
      const unknownValue = unknownField === 'legA' ? legA : legB;
      const knownLeg     = unknownField === 'legA' ? legB : legA;
      const knownLetter  = unknownField === 'legA' ? 'b' : 'a';
      const unknownLetter = unknownField === 'legA' ? 'a' : 'b';

      const statementCatalan = pickCatalanTemplate([
        `Un triangle rectangle té la hipotenusa ${hyp} i el catet ${knownLetter}=${knownLeg}. Calcula el catet desconegut (x).`,
        `Troba el catet desconegut d'un triangle rectangle amb hipotenusa ${hyp} i catet ${knownLeg}.`,
        `Calcula x en un triangle rectangle on c=${hyp} i ${knownLetter}=${knownLeg}.`,
      ]);

      const preferredLang = options?.preferredLanguage ?? 'ca';
      let statementTranslated: string | null = null;
      if (preferredLang !== 'ca') {
        try {
          const ctx = await ExerciseContextualizer.contextualize({
            type:              'PYTH_HYPOTENUSE_STATEMENT',
            values:            { legA, legB, statement: statementCatalan },
            unknownField,
            preferredLanguage: preferredLang,
          });
          statementTranslated = ctx.statementTranslated;
        } catch {
          statementTranslated = null;
        }
      }

      const steps = buildPythLegSteps(legA, legB, hyp, unknownField);

      return {
        id,
        type: 'pythagoras',
        prompt: statementCatalan,
        solution: { correct: unknownValue },
        data: { params, tolerance: 0.01 },
        metadata: {
          level,
          diagramType:         'triangle' as const,
          svgParams:           { legA, legB, hypotenuse: hyp, unknownSide: unknownField, rotation: svgRotation },
          statementCatalan,
          statementTranslated,
          tolerance:           0.01,
          steps,
          svgRotation,
          currentStepIndex:    0,
        } as any,
      };
    }

    // ── Branch E: PYTH_CONTEXT — no LLM for math; optional translation ────
    if (level === 'PYTH_CONTEXT') {
      const v        = params.values;
      const subtype  = String(v.subtype ?? 'ladder');
      const uf       = params.unknownField;

      // Canonical legA / legB / hyp (mirrors buildPythContextSteps mapping)
      let legA: number, legB: number, hyp: number;
      switch (subtype) {
        case 'ladder':
          hyp = Number(v.ladderLength); legA = Number(v.wallHeight); legB = Number(v.groundDistance);
          break;
        case 'distance':
          hyp = Number(v.distance); legA = Number(v.deltaY); legB = Number(v.deltaX);
          break;
        case 'diagonal':
          hyp = Number(v.diagonal); legA = Number(v.height); legB = Number(v.width);
          break;
        default: // height
          hyp = Number(v.slant); legA = Number(v.halfBase); legB = Number(v.triangleHeight);
          break;
      }

      const fieldToSide: Record<string, 'hypotenuse' | 'legA' | 'legB'> = {
        ladderLength: 'hypotenuse', distance: 'hypotenuse', diagonal: 'hypotenuse',
        triangleHeight: 'legB', wallHeight: 'legA', groundDistance: 'legB',
        deltaX: 'legB', deltaY: 'legA', width: 'legB', height: 'legA',
        halfBase: 'legA', slant: 'hypotenuse',
      };
      const unknownSide = fieldToSide[uf] ?? 'hypotenuse';
      const unknownValue = unknownSide === 'hypotenuse' ? hyp
        : unknownSide === 'legA' ? legA : legB;

      const svgRotation = buildRotation();

      // ── Statement template ─────────────────────────────────────────────
      const knownA = unknownSide === 'legA' ? hyp : legA;
      const knownB = unknownSide === 'legB' ? hyp : legB;
      const TEMPLATES: Record<string, string[]> = {
        ladder: [
          `Una paret té ${knownA}m d'alçada. La base de l'escala és a ${knownB}m de la paret. Quant mesura l'escala (x)?`,
          `L'escala recolzada a una paret: la paret fa ${knownA}m i la base està a ${knownB}m. Calcula la longitud de l'escala (x).`,
        ],
        distance: [
          `Des d'un punt, camines ${legA}m cap al nord i ${legB}m cap a l'est. Quina és la distància en línia recta (x)?`,
          `Un itinerari fa ${legA}m en direcció nord i ${legB}m en direcció est. Calcula la distància directa (x).`,
        ],
        diagonal: [
          `Un rectangle fa ${legB}m × ${legA}m. Quant mesura la diagonal (x)?`,
          `Una superfície rectangular de ${legB}m per ${legA}m. Calcula la seva diagonal (x).`,
        ],
        height: [
          `Un triangle isòsceles té els costats iguals de ${hyp}m i la meitat de la base és ${legA}m. Calcula l'alçada (x).`,
          `Els costats iguals d'un triangle isòsceles mesuren ${hyp}m i la base té ${legA * 2}m. Quin és l'alçada (x)?`,
        ],
      };
      const statementCatalan = pickCatalanTemplate(TEMPLATES[subtype] ?? TEMPLATES.ladder);

      // ── Optional translation ───────────────────────────────────────────
      const preferredLang = options?.preferredLanguage ?? 'ca';
      let statementTranslated: string | null = null;
      if (preferredLang !== 'ca') {
        try {
          const ctx = await ExerciseContextualizer.contextualize({
            type:              'PYTH_HYPOTENUSE_STATEMENT',
            values:            { legA, legB, statement: statementCatalan },
            unknownField:      uf,
            preferredLanguage: preferredLang,
          });
          statementTranslated = ctx.statementTranslated;
        } catch {
          statementTranslated = null;
        }
      }

      const steps = buildPythContextSteps(subtype, uf, v as Record<string, number | string>);

      return {
        id,
        type: 'pythagoras',
        prompt: statementCatalan,
        solution: { correct: unknownValue },
        data: { params, tolerance: 0.01 },
        metadata: {
          level,
          diagramType:         'triangle' as const,
          svgParams:           { legA, legB, hypotenuse: hyp, unknownSide, rotation: svgRotation },
          statementCatalan,
          statementTranslated,
          tolerance:           0.01,
          steps,
          svgRotation,
          currentStepIndex:    0,
        } as any,
      };
    }

    // ── Branch F: PYTH_VERIFY — no LLM for math; optional translation ─────
    if (level === 'PYTH_VERIFY') {
      const v       = params.values;
      const sideA   = Number(v.sideA);
      const sideB   = Number(v.sideB);
      const sideC   = Number(v.sideC);
      const isRight = Number(v.isRight);
      const svgRotation = buildRotation();

      const statementCatalan = pickCatalanTemplate([
        `Un triangle té els costats ${sideA}, ${sideB} i ${sideC}. És un triangle rectangle?`,
        `Comprova si el triangle de costats ${sideA}, ${sideB} i ${sideC} és rectangle.`,
        `Tres costats mesuren ${sideA}, ${sideB} i ${sideC}. Formen un triangle rectangle?`,
      ]);

      const preferredLang = options?.preferredLanguage ?? 'ca';
      let statementTranslated: string | null = null;
      if (preferredLang !== 'ca') {
        try {
          const ctx = await ExerciseContextualizer.contextualize({
            type:              'PYTH_HYPOTENUSE_STATEMENT',
            values:            { sideA, sideB, sideC, statement: statementCatalan },
            unknownField:      'isRight',
            preferredLanguage: preferredLang,
          });
          statementTranslated = ctx.statementTranslated;
        } catch {
          statementTranslated = null;
        }
      }

      const steps = buildPythVerifySteps(sideA, sideB, sideC, isRight);

      return {
        id,
        type: 'pythagoras',
        prompt: statementCatalan,
        solution: { correct: isRight },
        data: { params, tolerance: 0 },
        metadata: {
          level,
          diagramType:         'triangle' as const,
          svgParams:           { legA: sideA, legB: sideB, hypotenuse: sideC, unknownSide: 'none', rotation: svgRotation },
          statementCatalan,
          statementTranslated,
          tolerance:           0,
          steps,
          svgRotation,
          currentStepIndex:    0,
        } as any,
      };
    }

    // ── Branch G: all other levels — LLM contextualization ───────────────
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

    // ── PYTH_VERIFY: accept numeric (0/1) or string label ────────────────
    if (level === 'PYTH_VERIFY') {
      const correctLabel = correct === 1 ? 'Sí, és rectangle' : 'No, no és rectangle';
      const raw          = Number(answer);
      const isCorrect    = (!isNaN(raw) && raw === correct) || String(answer) === correctLabel;
      if (!isCorrect && isNaN(raw) &&
          answer !== 'Sí, és rectangle' && answer !== 'No, no és rectangle') {
        return { correct: false, score: 0, feedback: 'Selecciona Sí o No.', error_type: 'FORMAT_ERROR' };
      }
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
