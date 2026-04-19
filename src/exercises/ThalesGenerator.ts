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
import type { ExerciseStep } from "../core/ExerciseSteps";

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

// ---------------------------------------------------------------------------
// Step builder for TALES_BASIC
// ---------------------------------------------------------------------------

/**
 * Builds 3 guided steps for TALES_BASIC:
 *  1. select_option  — identify the correct proportion
 *  2. cross_product  — apply cross multiplication
 *  3. numeric_input  — calculate x
 *
 * unknownField is one of 'segmentA' | 'segmentB' | 'segmentC' | 'segmentD'.
 * The unknown segment is displayed as 'x' in the SVG.
 */
function buildTalesBasicSteps(
  a: number, b: number, c: number, d: number,
  unknownField: string,
): ExerciseStep[] {
  // Map each segment to its display value ('x' for the unknown)
  const vals: Record<string, string> = {
    segmentA: unknownField === 'segmentA' ? 'x' : String(a),
    segmentB: unknownField === 'segmentB' ? 'x' : String(b),
    segmentC: unknownField === 'segmentC' ? 'x' : String(c),
    segmentD: unknownField === 'segmentD' ? 'x' : String(d),
  };
  const vA = vals.segmentA, vB = vals.segmentB,
        vC = vals.segmentC, vD = vals.segmentD;

  // Numeric answer for step 3
  const answer = unknownField === 'segmentA' ? a
               : unknownField === 'segmentB' ? b
               : unknownField === 'segmentC' ? c
               : d;

  // ── Step 1: proportion options ──────────────────────────────────────────
  // Both a/b=c/d and a/c=b/d (and their inverses) are valid for Tales.
  const prop1 = `${vA}/${vB} = ${vC}/${vD}`;
  const prop2 = `${vA}/${vC} = ${vB}/${vD}`;
  const prop3 = `${vB}/${vA} = ${vD}/${vC}`;
  const prop4 = `${vC}/${vA} = ${vD}/${vB}`;

  // Two distractors (invalid proportions)
  const distractor1 = `${vA}/${vD} = ${vB}/${vC}`;
  const distractor2 = `${vC}/${vB} = ${vA}/${vD}`;

  // Shuffle 4 options: 2 valid + 2 invalid
  const allOptions = [prop1, prop2, distractor1, distractor2];
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }

  // ── Step 2: cross_product ───────────────────────────────────────────────
  // Relation: a·d = b·c — place 'x' in the correct slot
  let lhs1: string, lhs2: string, rhs1: string, rhs2: string;
  if (unknownField === 'segmentA') {
    lhs1 = 'x'; lhs2 = vD; rhs1 = vB; rhs2 = vC;
  } else if (unknownField === 'segmentB') {
    lhs1 = vA; lhs2 = vD; rhs1 = 'x'; rhs2 = vC;
  } else if (unknownField === 'segmentC') {
    lhs1 = vA; lhs2 = vD; rhs1 = vB; rhs2 = 'x';
  } else {
    lhs1 = vA; lhs2 = 'x'; rhs1 = vB; rhs2 = vC;
  }
  const crossHint =
    `El producte creuat de a/b = c/d és: a·d = b·c. ` +
    `Substitueix els valors coneguts: ${lhs1}·${lhs2} = ${rhs1}·${rhs2}`;

  // Step 3: build arithmetic instruction from cross-product values
  // lhsKnown·x = rhsA·rhsB  →  x = (rhsA·rhsB) ÷ lhsKnown
  let lhsKnown: number, rhsA: number, rhsB: number;
  if (unknownField === 'segmentD') {
    lhsKnown = a; rhsA = b; rhsB = c;
  } else if (unknownField === 'segmentA') {
    lhsKnown = d; rhsA = b; rhsB = c;
  } else if (unknownField === 'segmentB') {
    lhsKnown = c; rhsA = a; rhsB = d;
  } else {
    // segmentC
    lhsKnown = b; rhsA = a; rhsB = d;
  }
  const rhsProduct = rhsA * rhsB;
  const step3Instruction =
    `Al pas anterior has trobat que ${lhsKnown}·x = ${rhsA}·${rhsB} = ${rhsProduct}.\n` +
    `Per trobar x, divideix ${rhsProduct} entre ${lhsKnown}:\n` +
    `x = ${rhsProduct} ÷ ${lhsKnown} = ?`;

  return [
    {
      id: 'tales_proportion',
      order: 1,
      type: 'select_option',
      instruction: 'Quina proporció expressa correctament el teorema de Tales per a aquest diagrama?',
      hint: 'En el teorema de Tales, els segments de la mateixa secant formen una proporció: a/b = c/d.',
      correctAnswer: prop1,
      correctAnswers: [prop1, prop2, prop3, prop4],
      options: allOptions,
    },
    {
      id: 'tales_cross_product',
      order: 2,
      type: 'cross_product',
      instruction: `Aplica el teorema de Tales i multiplica en creu:\na/b = c/d  →  [ ]·[ ] = [ ]·[ ]\nOmple els quatre buits amb els valors corresponents.`,
      hint: crossHint,
      correctAnswer: `${lhs1}|${lhs2}|${rhs1}|${rhs2}`,
      crossProductTemplate: { lhs1, lhs2, rhs1, rhs2 },
    },
    {
      id: 'tales_calculate',
      order: 3,
      type: 'numeric_input',
      instruction: step3Instruction,
      correctAnswer: answer,
    },
  ];
}

// ---------------------------------------------------------------------------
// Step builder for TALES_SHADOWS
// ---------------------------------------------------------------------------

function buildTalesShadowsSteps(
  pH: number, pS: number, oH: number, oS: number,
  unknownField: string,
): ExerciseStep[] {
  // Display values: unknown becomes 'x'
  const vPH = unknownField === 'personHeight'  ? 'x' : String(pH);
  const vPS = unknownField === 'personShadow'  ? 'x' : String(pS);
  const vOH = unknownField === 'objectHeight'  ? 'x' : String(oH);
  const vOS = unknownField === 'objectShadow'  ? 'x' : String(oS);

  // Numeric answer
  const answer = unknownField === 'personHeight' ? pH
               : unknownField === 'personShadow'  ? pS
               : unknownField === 'objectHeight'  ? oH
               : oS;

  // ── Step 3: proportion options ──────────────────────────────────────────
  // Proportion: pH/pS = oH/oS  (and cross-type pH/oH = pS/oS)
  const prop1 = `${vPH}/${vPS} = ${vOH}/${vOS}`;
  const prop2 = `${vPH}/${vOH} = ${vPS}/${vOS}`;
  const prop3 = `${vPS}/${vPH} = ${vOS}/${vOH}`;
  const prop4 = `${vOH}/${vPH} = ${vOS}/${vPS}`;
  const distractor1 = `${vPH}/${vOS} = ${vPS}/${vOH}`;
  const distractor2 = `${vOH}/${vPS} = ${vPH}/${vOS}`;

  const propOptions = [prop1, prop2, distractor1, distractor2];
  for (let i = propOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [propOptions[i], propOptions[j]] = [propOptions[j], propOptions[i]];
  }

  // ── Step 4: cross_product ───────────────────────────────────────────────
  // Relation: pH·oS = pS·oH — place 'x' in the slot of the unknown
  let lhs1: string, lhs2: string, rhs1: string, rhs2: string;
  if (unknownField === 'personHeight') {
    lhs1 = 'x';  lhs2 = vOS; rhs1 = vPS; rhs2 = vOH;
  } else if (unknownField === 'personShadow') {
    lhs1 = vPH;  lhs2 = vOS; rhs1 = 'x'; rhs2 = vOH;
  } else if (unknownField === 'objectHeight') {
    lhs1 = vPH;  lhs2 = vOS; rhs1 = vPS; rhs2 = 'x';
  } else {
    // objectShadow
    lhs1 = vPH;  lhs2 = 'x'; rhs1 = vPS; rhs2 = vOH;
  }
  const crossHint =
    `El producte creuat de persona/ombra_p = objecte/ombra_o és: persona·ombra_o = ombra_p·objecte. ` +
    `Substitueix els valors coneguts: ${lhs1}·${lhs2} = ${rhs1}·${rhs2}`;

  // ── Step 5: arithmetic instruction ─────────────────────────────────────
  // x always on LHS: lhsKnown·x = rhsA·rhsB
  let lhsKnown: number, rhsA: number, rhsB: number;
  if (unknownField === 'personHeight') {
    lhsKnown = oS; rhsA = pS; rhsB = oH;
  } else if (unknownField === 'personShadow') {
    lhsKnown = oH; rhsA = pH; rhsB = oS;
  } else if (unknownField === 'objectHeight') {
    lhsKnown = pS; rhsA = pH; rhsB = oS;
  } else {
    lhsKnown = pH; rhsA = pS; rhsB = oH;
  }
  const rhsProduct = Math.round(rhsA * rhsB * 100) / 100;
  const step5Instruction =
    `Al pas anterior has trobat que ${lhsKnown}·x = ${rhsA}·${rhsB} = ${rhsProduct}.\n` +
    `Per trobar x, divideix ${rhsProduct} entre ${lhsKnown}:\n` +
    `x = ${rhsProduct} ÷ ${lhsKnown} = ?`;

  return [
    // Step 1 — Similar triangles
    {
      id: 'shadows_similar_triangles',
      order: 1,
      type: 'select_option',
      instruction:
        'Els dos triangles formats per la persona i la seva ombra, ' +
        "i per l'objecte i la seva ombra, són triangles semblants?",
      hint:
        'El sol forma el mateix angle amb tots els objectes en un mateix moment. ' +
        'Això significa que els raigs de sol són paral·lels, creant triangles ' +
        'amb els mateixos angles — és a dir, triangles semblants.',
      correctAnswer: 'Sí, són semblants',
      correctAnswers: ['Sí, són semblants'],
      options: ['Sí, són semblants', 'No, no són semblants'],
    },
    // Step 2 — Label segments
    {
      id: 'shadows_label_segments',
      order: 2,
      type: 'label_segments',
      instruction:
        "Identifica cada mesura de l'enunciat i assigna-la al segment corresponent del diagrama.",
      hint:
        "Llegeix l'enunciat amb atenció. Cada mesura correspon a un element concret: " +
        "la persona, la seva ombra, l'objecte o la seva ombra.",
      correctAnswer: `${vPH}|${vPS}|${vOH}|${vOS}`,
      segmentOptions: [
        { id: 'personHeight',  displayName: 'Alçada de la persona',   correctValue: vPH },
        { id: 'personShadow',  displayName: 'Ombra de la persona',    correctValue: vPS },
        { id: 'objectHeight',  displayName: "Alçada de l'objecte",    correctValue: vOH },
        { id: 'objectShadow',  displayName: "Ombra de l'objecte",     correctValue: vOS },
      ],
    },
    // Step 3 — Proportion
    {
      id: 'shadows_proportion',
      order: 3,
      type: 'select_option',
      instruction: 'Escriu la proporció correcta entre les alçades i les ombres.',
      hint: 'Les alçades i les ombres guarden la mateixa proporció perquè els triangles són semblants.',
      correctAnswer: prop1,
      correctAnswers: [prop1, prop2, prop3, prop4],
      options: propOptions,
    },
    // Step 4 — Cross product
    {
      id: 'shadows_cross_product',
      order: 4,
      type: 'cross_product',
      instruction: `Aplica el producte en creu:\npersona/ombra_p = objecte/ombra_o  →  [ ]·[ ] = [ ]·[ ]\nOmple els quatre buits amb els valors corresponents.`,
      hint: crossHint,
      correctAnswer: `${lhs1}|${lhs2}|${rhs1}|${rhs2}`,
      crossProductTemplate: { lhs1, lhs2, rhs1, rhs2 },
    },
    // Step 5 — Calculate
    {
      id: 'shadows_calculate',
      order: 5,
      type: 'numeric_input',
      instruction: step5Instruction,
      correctAnswer: answer,
    },
  ];
}

// ---------------------------------------------------------------------------
// Step builder for TALES_SCALE
// ---------------------------------------------------------------------------

/**
 * Builds 2 guided steps for TALES_SCALE:
 *  1. select_option — identify the operation (multiply or divide)
 *  2. numeric_input — calculate x
 *
 * direction is 'toReal' (mapMeasure → realMeasure) or
 *              'toMap'  (realMeasure → mapMeasure).
 */
function buildTalesScaleSteps(
  scale: number,
  mapMeasure: number,
  realMeasure: number,
  direction: string,
  _unknownField: string,
): ExerciseStep[] {
  const isToReal = direction === 'toReal';

  // ── Step 1: operation identification ───────────────────────────────────
  const correctOption = isToReal
    ? "Multiplicar la mesura del plànol per l'escala"
    : "Dividir la mesura real per l'escala";

  const step1Options = isToReal
    ? [
        "Multiplicar la mesura del plànol per l'escala",
        "Dividir la mesura del plànol per l'escala",
        "Multiplicar l'escala per ella mateixa",
      ]
    : [
        "Dividir la mesura real per l'escala",
        "Multiplicar la mesura real per l'escala",
        "Dividir l'escala per la mesura real",
      ];

  // Shuffle
  const shuffled = [...step1Options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const step1Hint = isToReal
    ? "Per passar del plànol a la realitat, multipliquem per l'escala: mesura_real = mesura_plànol × escala"
    : "Per passar de la realitat al plànol, dividim per l'escala: mesura_plànol = mesura_real ÷ escala";

  // ── Step 2: numeric calculation ─────────────────────────────────────────
  const step2Instruction = isToReal
    ? `Calcula la mesura real.\nmesura_real = mesura_plànol × escala\nx = ${mapMeasure} × ${scale} = ?`
    : `Calcula la mesura al plànol.\nmesura_plànol = mesura_real ÷ escala\nx = ${realMeasure} ÷ ${scale} = ?`;

  const step2Hint = isToReal
    ? `Multiplica ${mapMeasure} per ${scale}.`
    : `Divideix ${realMeasure} entre ${scale}.`;

  const step2Answer = isToReal ? realMeasure : mapMeasure;

  return [
    {
      id: 'scale_operation',
      order: 1,
      type: 'select_option',
      instruction: 'Observa les dades. Quin càlcul has de fer?',
      hint: step1Hint,
      correctAnswer: correctOption,
      correctAnswers: [correctOption],
      options: shuffled,
    },
    {
      id: 'scale_calculate',
      order: 2,
      type: 'numeric_input',
      instruction: step2Instruction,
      hint: step2Hint,
      correctAnswer: step2Answer,
    },
  ];
}

// ---------------------------------------------------------------------------
// Step builder for TALES_CONTEXT
// ---------------------------------------------------------------------------

/** Field name → ordered position within the 4-segment proportion for each subtype. */
const TALES_CONTEXT_FIELD_ORDER: Record<string, readonly string[]> = {
  inaccessible_distance: ['stakeHeight', 'stakeShadow', 'objectDistance', 'measuredDistance'],
};

/** Short segment names used in proportion options and cross-product hints. */
const TALES_CONTEXT_SHORT_LABELS: Record<string, readonly string[]> = {
  inaccessible_distance: ['PA', 'AB', 'PC', 'CD'],
};

/**
 * Builds 5 guided steps for TALES_CONTEXT (inaccessible_distance / building_height):
 *  1. select_option  — confirm similar triangles
 *  2. label_segments — assign 4 measurements to their segments
 *  3. select_option  — identify the correct proportion
 *  4. cross_product  — apply cross multiplication
 *  5. numeric_input  — calculate x
 *
 * Proportion model: val1/val2 = val3/val4  →  val1·val4 = val2·val3
 */
function buildTalesContextSteps(
  subtype: string,
  val1: number, val2: number, val3: number, val4: number,
  label1: string, label2: string, label3: string, label4: string,
  unknownField: string,
): ExerciseStep[] {
  const fieldOrder = TALES_CONTEXT_FIELD_ORDER[subtype] ?? [];
  const unkIdx = fieldOrder.indexOf(unknownField);
  if (unkIdx === -1) throw new Error(`Unknown field '${unknownField}' for subtype '${subtype}'`);

  const numVals  = [val1, val2, val3, val4];
  const labels   = [label1, label2, label3, label4];

  // Display values — unknown becomes 'x'
  const disp = numVals.map((v, i) => (i === unkIdx ? 'x' : String(v)));
  const [v1, v2, v3, v4] = disp;

  // Numeric answer
  const answer = numVals[unkIdx];

  // ── Step 1 hint (varies by subtype) ────────────────────────────────────
  const step1Hint = subtype === 'inaccessible_distance'
    ? 'Les estaques i les seves distàncies formen triangles semblants perquè mantenen la mateixa proporció.'
    : "El pal de referència i l'edifici formen triangles semblants amb les seves distàncies.";

  // ── Step 2: label_segments ──────────────────────────────────────────────
  const segmentOptions = numVals.map((_, i) => ({
    id:           fieldOrder[i],
    displayName:  labels[i],
    correctValue: disp[i],
  }));

  // ── Step 3: proportion options — use short segment names (PA/AB/PC/CD) ──
  const shortLbls = TALES_CONTEXT_SHORT_LABELS[subtype] ?? ['s1', 's2', 's3', 's4'];
  const [sA, sB, sC, sD] = shortLbls;  // PA, AB, PC, CD

  const prop1 = `${sA}/${sB} = ${sC}/${sD}`;
  const prop2 = `${sA}/${sC} = ${sB}/${sD}`;
  const prop3 = `${sB}/${sA} = ${sD}/${sC}`;
  const prop4 = `${sC}/${sA} = ${sD}/${sB}`;
  const distractor1 = `${sA}/${sD} = ${sB}/${sC}`;
  const distractor2 = `${sB}/${sC} = ${sA}/${sD}`;

  const propOptions = [prop1, prop2, distractor1, distractor2];
  for (let i = propOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [propOptions[i], propOptions[j]] = [propOptions[j], propOptions[i]];
  }

  // ── Step 4: cross_product ───────────────────────────────────────────────
  // val1·val4 = val2·val3 (PA·CD = AB·PC) — 'x' goes in the unknown slot
  let lhs1: string, lhs2: string, rhs1: string, rhs2: string;
  if      (unkIdx === 0) { lhs1 = 'x'; lhs2 = v4; rhs1 = v2; rhs2 = v3; }
  else if (unkIdx === 1) { lhs1 = v1;  lhs2 = v4; rhs1 = 'x'; rhs2 = v3; }
  else if (unkIdx === 2) { lhs1 = v1;  lhs2 = v4; rhs1 = v2;  rhs2 = 'x'; }
  else                   { lhs1 = v1;  lhs2 = 'x'; rhs1 = v2; rhs2 = v3; }

  const crossHint =
    `El producte creuat: ${sA}·${sD} = ${sB}·${sC}. ` +
    `Substitueix els valors coneguts: ${lhs1}·${lhs2} = ${rhs1}·${rhs2}`;

  // ── Step 5: arithmetic instruction ─────────────────────────────────────
  // Isolate x: lhsKnown·x = rhsA·rhsB
  let lhsKnown: number, rhsA: number, rhsB: number;
  if      (unkIdx === 0) { lhsKnown = val4; rhsA = val2; rhsB = val3; }
  else if (unkIdx === 1) { lhsKnown = val3; rhsA = val1; rhsB = val4; }
  else if (unkIdx === 2) { lhsKnown = val2; rhsA = val1; rhsB = val4; }
  else                   { lhsKnown = val1; rhsA = val2; rhsB = val3; }

  const rhsProduct = Math.round(rhsA * rhsB * 100) / 100;
  // Known multiplier segment name (the non-x side of the cross product lhs)
  const knownSeg = [sA, sB, sC, sD][unkIdx === 0 ? 3 : unkIdx === 1 ? 2 : unkIdx === 2 ? 1 : 0];
  const step5Instruction =
    `De ${sA}·${sD} = ${sB}·${sC}, has trobat que ${knownSeg}·x = ${rhsA}·${rhsB} = ${rhsProduct}.\n` +
    `Per trobar x, divideix ${rhsProduct} entre ${lhsKnown}:\n` +
    `x = ${rhsProduct} ÷ ${lhsKnown} = ?`;

  return [
    // Step 1 — Similar triangles
    {
      id: 'context_similar_triangles',
      order: 1,
      type: 'select_option',
      instruction:
        'Els dos triangles formats per les mesures de referència i les distàncies, ' +
        'són triangles semblants?',
      hint: step1Hint,
      correctAnswer: 'Sí, són semblants',
      correctAnswers: ['Sí, són semblants'],
      options: ['Sí, són semblants', 'No, no són semblants'],
    },
    // Step 2 — Label segments
    {
      id: 'context_label_segments',
      order: 2,
      type: 'label_segments',
      instruction: "Identifica cada mesura de l'enunciat i assigna-la al segment corresponent.",
      hint: "Llegeix l'enunciat amb atenció. Cada mesura correspon a un element concret del problema.",
      correctAnswer: `${v1}|${v2}|${v3}|${v4}`,
      segmentOptions,
    },
    // Step 3 — Proportion
    {
      id: 'context_proportion',
      order: 3,
      type: 'select_option',
      instruction: 'Escriu la proporció correcta entre les mesures dels dos triangles semblants.',
      hint: 'Els elements corresponents dels dos triangles semblants han de guardar la mateixa proporció.',
      correctAnswer: prop1,
      correctAnswers: [prop1, prop2, prop3, prop4],
      options: propOptions,
    },
    // Step 4 — Cross product
    {
      id: 'context_cross_product',
      order: 4,
      type: 'cross_product',
      instruction:
        'Aplica el producte en creu:\n' +
        '[ ]·[ ] = [ ]·[ ]\n' +
        'Omple els quatre buits amb els valors corresponents.',
      hint: crossHint,
      correctAnswer: `${lhs1}|${lhs2}|${rhs1}|${rhs2}`,
      crossProductTemplate: { lhs1, lhs2, rhs1, rhs2 },
    },
    // Step 5 — Calculate
    {
      id: 'context_calculate',
      order: 5,
      type: 'numeric_input',
      instruction: step5Instruction,
      correctAnswer: answer,
    },
  ];
}

// ---------------------------------------------------------------------------

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

    // 3a. TALES_BASIC — early return, no LLM needed (SVG is primary content)
    if (level === 'TALES_BASIC') {
      const v = params.values as {
        segmentA: number; segmentB: number; segmentC: number; segmentD: number;
      };
      const unknownField = params.unknownField ?? 'segmentD';
      const a = Number(v.segmentA), b = Number(v.segmentB),
            c = Number(v.segmentC), d = Number(v.segmentD);
      const answer = unknownField === 'segmentA' ? a
                   : unknownField === 'segmentB' ? b
                   : unknownField === 'segmentC' ? c
                   : d;
      const steps = buildTalesBasicSteps(a, b, c, d, unknownField);
      const instance: ExerciseInstance = {
        id: `tales-basic-${Date.now()}`,
        type: 'thales',
        prompt: '',
        solution: { correct: answer },
        data: {},
        metadata: {
          level: 'TALES_BASIC',
          diagramType: 'classic',
          statementCatalan: '',
          statementTranslated: null,
          svgParams: {
            segmentA: unknownField === 'segmentA' ? 'x' : a,
            segmentB: unknownField === 'segmentB' ? 'x' : b,
            segmentC: unknownField === 'segmentC' ? 'x' : c,
            segmentD: unknownField === 'segmentD' ? 'x' : d,
          },
          tolerance: 0.5,
          steps,
          currentStepIndex: 0,
        },
      };
      return instance;
    }

    // 3b. LLM contextualization for all other levels — async
    const ctx = await ExerciseContextualizer.contextualize(params);

    // 4. Build ExerciseInstance
    const id = `thales_${level}_${++_instanceCounter}_${Date.now()}`;

    const instance: ExerciseInstance = {
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

    // 5a. Inject guided steps for TALES_CONTEXT post-LLM
    if (level === 'TALES_CONTEXT') {
      const v   = params.values as any;
      const sub = String(v.subtype);
      const meta = instance.metadata as Record<string, any>;

      if (sub === 'inaccessible_distance') {
        const uf = params.unknownField ?? 'objectDistance';
        meta.diagramType = 'inaccessible';
        meta.svgParams = {
          seg1: uf === 'stakeHeight'      ? 'x' : v.stakeHeight,
          seg2: uf === 'stakeShadow'      ? 'x' : v.stakeShadow,
          seg3: uf === 'objectDistance'   ? 'x' : v.objectDistance,
          seg4: uf === 'measuredDistance' ? 'x' : v.measuredDistance,
        };
        meta.steps = buildTalesContextSteps(
          sub,
          Number(v.stakeHeight), Number(v.stakeShadow),
          Number(v.objectDistance), Number(v.measuredDistance),
          'Segment PA (P → A)', 'Segment AB (A → B)',
          'Segment PC (P → C)', 'Segment CD (C → D)',
          uf,
        );
        meta.currentStepIndex = 0;
      }
      // building_height removed; map_planning uses TALES_SCALE
    }

    // 5b. Inject guided steps for TALES_SCALE post-LLM
    if (level === 'TALES_SCALE') {
      const v = params.values as any;
      const meta = instance.metadata as Record<string, any>;
      meta.steps = buildTalesScaleSteps(
        Number(v.scale),
        Number(v.mapMeasure),
        Number(v.realMeasure),
        String(v.direction),
        params.unknownField ?? 'realMeasure',
      );
      meta.currentStepIndex = 0;
    }

    // 5b. Inject guided steps for TALES_SHADOWS post-LLM
    if (level === 'TALES_SHADOWS') {
      const v = params.values as {
        personHeight: number; personShadow: number;
        objectHeight: number; objectShadow: number;
      };
      const uf = params.unknownField ?? 'objectHeight';
      const meta = instance.metadata as Record<string, any>;

      // Build svgParams fresh with segmentA/B/C/D keys.
      // ctx.svgParams uses personHeight/… keys — we must not spread those.
      // segmentB = objectHeight - personHeight (extra height for geometry).
      meta.svgParams = {
        segmentA: uf === 'personHeight'  ? 'x' : v.personHeight,
        segmentB: uf === 'objectHeight'  ? 'x' : (v.objectHeight - v.personHeight),
        segmentC: uf === 'personShadow'  ? 'x' : v.personShadow,
        segmentD: uf === 'objectShadow'  ? 'x' : v.objectShadow,
      };

      meta.steps = buildTalesShadowsSteps(
        v.personHeight, v.personShadow,
        v.objectHeight, v.objectShadow,
        uf,
      );
      meta.currentStepIndex = 0;
    }

    return instance;
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
