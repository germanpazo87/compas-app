import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_CONFIG } from "../config/constants";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ExerciseParams {
  type: string;
  values: Record<string, number | string>;
  unknownField: string;
  preferredLanguage: string;
  educationalLevel?: string;
}

export interface ContextualizedExercise {
  statementCatalan: string;
  statementTranslated: string | null;
  svgParams: Record<string, any>;
  answer: number;
  tolerance: number;
}

// ---------------------------------------------------------------------------
// Module-level constants
// ---------------------------------------------------------------------------

const LANGUAGE_NAMES: Record<string, string> = {
  es:  'Spanish',
  en:  'English',
  fr:  'French',
  pt:  'Portuguese',
  ro:  'Romanian',
  ar:  'Arabic',
  ur:  'Urdu',
  pa:  'Punjabi',
  zh:  'Chinese (Simplified)',
  rom: 'Romani',
  ru:  'Russian',
};

const TOLERANCE_MAP: Record<string, number> = {
  PROPORTION_BASIC: 0.01,
  TALES_SHADOWS:   0.1,
  TALES_BASIC:     0.01,
  TALES_CONTEXT:   0.1,
  PYTH_HYPOTENUSE: 0.01,
  PYTH_LEG:        0.01,
  PYTH_CONTEXT:    0.1,
  PYTH_VERIFY:     0,
};

const CONTEXT_CONSTRAINTS: Record<string, string> = {
  PROPORTION_BASIC:
    'A simple proportion: a/b = c/x. Present it as finding an unknown value in a proportion. ' +
    'Use a simple Barcelona context (recipe scaling, map distances, price per unit). ' +
    'Keep it to 2 sentences maximum.',
  TALES_BASIC:
    'The situation MUST be geometric: two lines (paths, streets, cables) cut by three parallel lines. ' +
    'The four values are distances along the two lines. ' +
    'Do NOT use people, time, rates or non-geometric proportions.',
  TALES_SHADOWS:
    'Two vertical objects casting shadows under parallel sun rays. ' +
    'The four values are heights and shadow lengths. ' +
    'CRITICAL: Use ONLY the exact numeric values provided in "Mathematical values" — ' +
    'do NOT invent, round, or change any number. The statement must use these exact values verbatim. ' +
    'Do NOT use named real buildings or monuments (Torre Agbar, Sagrada Família, etc.) — ' +
    'their known heights contradict the exercise values. Use generic objects instead: ' +
    'lamppost (fanal), flagpole (pal de bandera), tree (arbre), ' +
    'traffic light (semàfor), antenna (antena), etc. ' +
    'Use real Barcelona locations as setting (park, street, neighbourhood) ' +
    'but generic objects as the measuring subjects.',
  TALES_SCALE:
    'The situation involves a map, blueprint or scale model and real measurements. ' +
    'One value is on the map/model, the other is the real measurement.',
  TALES_CONTEXT:
    'Mixed application. Use the subtype field in values to determine the context.',
  PYTH_HYPOTENUSE:
    'The situation involves a right triangle. Two legs are known; the student must find the hypotenuse ' +
    'using the Pythagorean theorem (a² + b² = c²). Use a realistic Barcelona context ' +
    '(ladder against a wall, diagonal of a pitch, distance between two metro stations on a grid).',
  PYTH_LEG:
    'The situation involves a right triangle. The hypotenuse and one leg are known; the student must ' +
    'find the missing leg using the Pythagorean theorem. Use a realistic Barcelona context.',
  PYTH_VERIFY:
    'The situation presents three side lengths of a triangle. The student must verify whether it is a ' +
    'right triangle by checking a² + b² = c². The answer is 1 (yes, right triangle) or 0 (no). ' +
    'State the three lengths clearly and ask "Is it a right triangle?"',
  PYTH_CONTEXT:
    'Applied Pythagorean theorem problem. Use the subtype field in values to determine the context: ' +
    'ladder (ladder against wall), distance (straight-line distance on a grid), ' +
    'diagonal (diagonal of a rectangle), height (height of a triangle or roof).',
  PYTH_HYPOTENUSE_STATEMENT:
    'Translate the following Catalan math statement to the target language. ' +
    'Mark key mathematical terms with the Catalan term in parentheses using the format *(catalan term)*. ' +
    'Example: "The right triangle *(triangle rectangle)* has legs..." ' +
    'Do not change the numbers. Return ONLY the translated sentence.',
};

function buildSystemInstruction(educationalLevel: string): string {
  return `\
You are a math exercise writer for GES students in Barcelona \
(adults 16+ returning to education). You write contextualized, \
varied math problems anchored in Barcelona's geography, landmarks \
and everyday life.

Student profile: ${educationalLevel} — adults (16+) returning to \
education after a gap, many with language barriers.
Write statements that are:
- Maximum 2-3 sentences total
- Simple and direct vocabulary, avoid subordinate clauses
- Numbers always as digits (3, not 'three')
- One single clear question at the end, explicitly marking x
- Avoid bureaucratic or academic register

Rules:
1. Always use real Barcelona locations, landmarks or situations \
(Eixample streets, Sagrada Família, Barceloneta, metro lines, \
Parc de la Ciutadella, Torre Agbar, Llobregat river, etc.)
2. Never use the same location twice in a row — vary the context
3. Keep the math simple and the narrative engaging
4. The unknown value must be clearly identified as x in the statement
5. Return a JSON object with exactly these fields:
   {
     "statementCatalan": "...",
     "statementTranslated": "...",
     "svgParams": { ... }
   }
6. statementTranslated format: full statement in target language where \
each key mathematical term is followed by the Catalan term in \
parentheses with asterisks: *(catalan term)*
   Example: "Three parallel lines *(rectes paral·leles)* intersect..."
7. If the target language is Catalan (ca), set statementTranslated to null
8. Return ONLY the JSON object, no markdown, no explanation`;
}

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel(
  { model: GEMINI_CONFIG.MODEL },
  { apiVersion: GEMINI_CONFIG.API_VERSION }
);

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function getTolerance(type: string, answer: number): number {
  if (type === 'TALES_SCALE') return Math.abs(answer) * 0.05;
  return TOLERANCE_MAP[type] ?? 0.1;
}

/**
 * Derives the required SVG params from the mathematical values.
 * Mathematical truth must not depend on the LLM — these fields are always
 * computed locally and merged with (i.e. take precedence over) any svgParams
 * the LLM returns.
 */
function buildRequiredSvgParams(params: ExerciseParams): Record<string, any> {
  const v = params.values;
  switch (params.type) {
    case 'TALES_SHADOWS':
      return {
        personHeight:  v.personHeight,
        personShadow:  v.personShadow,
        objectHeight:  v.objectHeight,
        objectShadow:  v.objectShadow,
        unknownField:  params.unknownField,
      };
    case 'TALES_SCALE':
      return {
        scale:       v.scale,
        direction:   v.direction,
        mapMeasure:  v.mapMeasure,
        realMeasure: v.realMeasure,
      };
    case 'TALES_BASIC':
      return {
        segmentA:        v.segmentA,
        segmentB:        v.segmentB,
        segmentC:        v.segmentC,
        segmentD:        v.segmentD,
        highlightUnknown: true,
      };
    case 'TALES_CONTEXT':
      return {};
    case 'PYTH_HYPOTENUSE':
      return {
        legA:        v.legA,
        legB:        v.legB,
        hypotenuse:  v.hypotenuse,
        unknownSide: 'hypotenuse',
      };
    case 'PYTH_LEG':
      return {
        legA:        v.legA,
        legB:        v.legB,
        hypotenuse:  v.hypotenuse,
        unknownSide: params.unknownField,
      };
    default:
      return {};
  }
}

function buildFallbackStatement(params: ExerciseParams): string {
  const v = params.values;
  switch (params.type) {
    case 'TALES_SHADOWS':
      return `Una persona de ${v.personHeight}m projecta una ombra de ` +
        `${v.personShadow}m. Un objecte proper projecta una ombra de ` +
        `${v.objectShadow}m. Quant mesura l'objecte (x)?`;
    case 'TALES_SCALE':
      return v.direction === 'toReal'
        ? `Escala 1:${v.scale}. En el mapa mesura ${v.mapMeasure}cm. ` +
          `Quant mesura a la realitat (x)?`
        : `Escala 1:${v.scale}. A la realitat mesura ${v.realMeasure}cm. ` +
          `Quant mesura al mapa (x)?`;
    case 'PROPORTION_BASIC':
      return `En una proporció: ${v.segmentA}/${v.segmentB} = ${v.segmentC}/x. Calcula x.`;
    case 'TALES_BASIC':
      return `En una figura amb el Teorema de Tales: a=${v.segmentA}, ` +
        `b=${v.segmentB}, c=${v.segmentC}. Calcula x (segment d).`;
    case 'TALES_CONTEXT':
      return `Problema de proporcionalitat. Calcula x a partir dels valors: ` +
        `${JSON.stringify(v)}.`;
    case 'PYTH_HYPOTENUSE':
      return `Calcula la hipotenusa d'un triangle rectangle amb catets ${v.legA} i ${v.legB}.`;
    default:
      return `Exercici matemàtic. Calcula x = ${v[params.unknownField]}.`;
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const ExerciseContextualizer = {
  async contextualize(params: ExerciseParams): Promise<ContextualizedExercise> {
    // ── Special case: statement-only translation (no JSON, no math) ───────
    if (params.type === 'PYTH_HYPOTENUSE_STATEMENT') {
      const statement  = String(params.values.statement ?? '');
      const targetLang = LANGUAGE_NAMES[params.preferredLanguage] ?? params.preferredLanguage;
      const prompt =
        CONTEXT_CONSTRAINTS['PYTH_HYPOTENUSE_STATEMENT'] + '\n\n' +
        `Target language: ${targetLang}\n` +
        `Catalan statement: "${statement}"`;
      try {
        const result = await model.generateContent(prompt);
        return {
          statementCatalan:    statement,
          statementTranslated: result.response.text().trim() || null,
          svgParams:           {},
          answer:              0,
          tolerance:           0,
        };
      } catch (err) {
        console.warn('⚠️ ExerciseContextualizer: translation failed.', err);
        return {
          statementCatalan:    statement,
          statementTranslated: null,
          svgParams:           {},
          answer:              0,
          tolerance:           0,
        };
      }
    }

    const answer = Number(params.values[params.unknownField]);
    const tolerance = getTolerance(params.type, answer);
    const requiredSvgParams = buildRequiredSvgParams(params);

    const targetLanguage =
      LANGUAGE_NAMES[params.preferredLanguage] ?? params.preferredLanguage;

    const constraint = CONTEXT_CONSTRAINTS[params.type] ?? '';
    const userMessage =
      `Exercise type: ${params.type}\n` +
      (constraint ? `IMPORTANT CONTEXT CONSTRAINT: ${constraint}\n` : '') +
      `Mathematical values: ${JSON.stringify(params.values)}\n` +
      `Unknown field (show as x): ${params.unknownField}\n` +
      `Target language for translation: ${targetLanguage}\n\n` +
      `Generate a contextualized Barcelona-based math problem using these ` +
      `exact values. The answer must be ${params.values[params.unknownField]}.`;

    const systemInstruction = buildSystemInstruction(params.educationalLevel ?? 'GES1');
    const prompt = `${systemInstruction}\n\n${userMessage}`;

    try {
      const result = await model.generateContent(prompt);
      const rawText = result.response.text();

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

      return {
        statementCatalan:    parsed.statementCatalan    ?? buildFallbackStatement(params),
        statementTranslated: parsed.statementTranslated ?? null,
        // Local required fields take precedence — LLM svgParams are supplementary only
        svgParams: { ...(parsed.svgParams ?? {}), ...requiredSvgParams },
        answer,
        tolerance,
      };
    } catch (err) {
      console.warn('⚠️ ExerciseContextualizer: API call failed, using fallback.', err);
      return {
        statementCatalan:    buildFallbackStatement(params),
        statementTranslated: null,
        svgParams:           requiredSvgParams,
        answer,
        tolerance,
      };
    }
  },
};
