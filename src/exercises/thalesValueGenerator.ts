/**
 * THALES VALUE GENERATOR
 * Pure math engine — no text, no API calls.
 * Generates numerical exercise parameters for the Thales theorem module.
 * Caller is responsible for setting preferredLanguage before passing
 * the result to ExerciseContextualizer.contextualize().
 */

import type { ExerciseParams } from "../services/ExerciseContextualizer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThalesLevel =
  | 'SIMILAR_ID'
  | 'PROPORTION_BASIC'
  | 'TALES_BASIC'
  | 'TALES_SHADOWS'
  | 'TALES_SCALE'
  | 'TALES_CONTEXT';

export type TalesContextSubtype =
  | 'inaccessible_distance'
  | 'building_height'
  | 'map_planning';

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function randomFloat(min: number, max: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Returns true if n is an integer or ends in exactly .5 */
function isCleanNumber(n: number): boolean {
  return n % 0.5 === 0;
}

function roundTo(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

// ---------------------------------------------------------------------------
// Value generators
// ---------------------------------------------------------------------------

function generateTalesShadows(): ExerciseParams {
  const UNKNOWN_FIELDS = [
    'personHeight', 'personShadow', 'objectHeight', 'objectShadow',
  ] as const;
  // Use clean discrete sets so all four derived values stay clean
  const PH_VALUES = [1.5, 1.6, 1.8, 2.0] as const;
  const PS_VALUES = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0] as const;
  const MAX_RETRIES = 100;

  for (let i = 0; i < MAX_RETRIES; i++) {
    const personHeight  = randomFrom(PH_VALUES);
    const personShadow  = randomFrom(PS_VALUES);
    const objectShadow  = randomInt(10, 100);
    const objectHeight  = roundTo((personHeight * objectShadow) / personShadow, 1);

    if (!isCleanNumber(objectHeight) || objectHeight < 5 || objectHeight > 200) continue;

    const unknownField = randomFrom(UNKNOWN_FIELDS);

    // Unknown value must differ from all three known values
    const vals = { personHeight, personShadow, objectHeight, objectShadow };
    const answer = vals[unknownField];
    const knowns = UNKNOWN_FIELDS
      .filter(f => f !== unknownField)
      .map(f => vals[f]);
    if (knowns.includes(answer)) continue;

    return {
      type: 'TALES_SHADOWS',
      values: { personHeight, personShadow, objectShadow, objectHeight },
      unknownField,
      preferredLanguage: 'ca',
    };
  }

  // Hard fallback: pH=1.8, pS=1.2, oS=20 → oH=30
  return {
    type: 'TALES_SHADOWS',
    values: { personHeight: 1.8, personShadow: 1.2, objectShadow: 20, objectHeight: 30.0 },
    unknownField: 'objectHeight',
    preferredLanguage: 'ca',
  };
}

function generateTalesScale(): ExerciseParams {
  const SCALES = [100, 200, 500, 1000, 5000, 10000, 20000, 50000] as const;
  // Pre-approved clean map measures (cm) guaranteed to be in [0.5, 30]
  const CLEAN_MAP_MEASURES = [
    0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30,
  ] as const;

  const scale = randomFrom(SCALES);
  const direction = randomFrom(['toReal', 'toMap'] as const);

  if (direction === 'toReal') {
    // Given: mapMeasure. Unknown: realMeasure.
    const mapMeasure = randomFloat(1, 20, 1);
    const realMeasure = mapMeasure * scale;
    return {
      type: 'TALES_SCALE',
      values: { scale, direction, mapMeasure, realMeasure },
      unknownField: 'realMeasure',
      preferredLanguage: 'ca',
    };
  } else {
    // Given: realMeasure. Unknown: mapMeasure.
    // Generate answer (mapMeasure) first from the clean list — guarantees
    // mapMeasure ∈ [0.5, 30] and realMeasure is always a whole integer.
    const mapMeasure = randomFrom(CLEAN_MAP_MEASURES);
    const realMeasure = mapMeasure * scale;
    return {
      type: 'TALES_SCALE',
      values: { scale, direction, mapMeasure, realMeasure },
      unknownField: 'mapMeasure',
      preferredLanguage: 'ca',
    };
  }
}

function generateTalesBasic(): ExerciseParams {
  const UNKNOWN_FIELDS = ['segmentA', 'segmentB', 'segmentC', 'segmentD'] as const;
  const MAX_RETRIES = 100;

  for (let i = 0; i < MAX_RETRIES; i++) {
    // Generate 4 integers with a·d = b·c
    const segmentA = randomInt(2, 12);
    const segmentB = randomInt(2, 12);
    const segmentC = randomInt(2, 12);
    const segmentD = (segmentB * segmentC) / segmentA;

    if (!Number.isInteger(segmentD) || segmentD < 2 || segmentD > 20) continue;

    // Reject degenerate/visually trivial cases
    if (segmentA === segmentB) continue;  // first secant has equal halves
    if (segmentC === segmentD) continue;  // second secant has equal halves
    if (segmentA === segmentC) continue;  // top segments visually identical

    const unknownField = randomFrom(UNKNOWN_FIELDS);

    // Unknown value must differ from all three known values
    const answer = unknownField === 'segmentA' ? segmentA
                 : unknownField === 'segmentB' ? segmentB
                 : unknownField === 'segmentC' ? segmentC
                 : segmentD;
    const known = [segmentA, segmentB, segmentC, segmentD].filter(
      (_, idx) => ['segmentA','segmentB','segmentC','segmentD'][idx] !== unknownField
    );
    if (known.includes(answer)) continue;

    return {
      type: 'TALES_BASIC',
      values: { segmentA, segmentB, segmentC, segmentD },
      unknownField,
      preferredLanguage: 'ca',
    };
  }

  // Hard fallback: 3/4 = 6/8
  return {
    type: 'TALES_BASIC',
    values: { segmentA: 3, segmentB: 4, segmentC: 6, segmentD: 8 },
    unknownField: randomFrom(UNKNOWN_FIELDS),
    preferredLanguage: 'ca',
  };
}

function generateTalesContext(subtype?: TalesContextSubtype): ExerciseParams {
  const SUBTYPES: readonly TalesContextSubtype[] = [
    'inaccessible_distance',
    'building_height',
    'map_planning',
  ];
  const selected: TalesContextSubtype = subtype ?? randomFrom(SUBTYPES);
  const MAX_RETRIES = 50;

  switch (selected) {
    case 'inaccessible_distance': {
      const stakeHeight  = randomInt(1, 3);
      const stakeShadow  = randomFloat(0.5, 2.0, 1);
      const objectShadow = randomInt(20, 100);
      const objectDistance = roundTo((stakeHeight * objectShadow) / stakeShadow, 1);
      return {
        type: 'TALES_CONTEXT',
        values: { subtype: 'inaccessible_distance', stakeHeight, stakeShadow, objectShadow, objectDistance },
        unknownField: 'objectDistance',
        preferredLanguage: 'ca',
      };
    }

    case 'building_height': {
      for (let i = 0; i < MAX_RETRIES; i++) {
        const referenceHeight = randomInt(3, 10);
        const referenceShadow = randomFloat(2, 10, 1);
        const buildingShadow  = randomInt(5, 50);
        const buildingHeight  = roundTo((referenceHeight * buildingShadow) / referenceShadow, 1);

        if (buildingHeight >= 5 && buildingHeight <= 150) {
          return {
            type: 'TALES_CONTEXT',
            values: { subtype: 'building_height', referenceHeight, referenceShadow, buildingShadow, buildingHeight },
            unknownField: 'buildingHeight',
            preferredLanguage: 'ca',
          };
        }
      }
      // Hard fallback: 5m reference, 4.0m shadow, 20m building shadow → 25.0m
      return {
        type: 'TALES_CONTEXT',
        values: { subtype: 'building_height', referenceHeight: 5, referenceShadow: 4.0, buildingShadow: 20, buildingHeight: 25.0 },
        unknownField: 'buildingHeight',
        preferredLanguage: 'ca',
      };
    }

    case 'map_planning': {
      const planScale  = randomFrom([50, 100, 200] as const);
      const planLength = randomInt(5, 30);   // cm on the plan
      const realLength = planLength * planScale; // cm in reality (LLM converts units in narrative)
      return {
        type: 'TALES_CONTEXT',
        values: { subtype: 'map_planning', planScale, planLength, realLength },
        unknownField: 'realLength',
        preferredLanguage: 'ca',
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates mathematical values for a given Thales exercise level.
 * Returns an ExerciseParams object ready to pass to ExerciseContextualizer.
 * Caller should override preferredLanguage with the student's actual language.
 *
 * @throws Error for SIMILAR_ID and PROPORTION_BASIC (not yet implemented)
 */
export function generateThalesValues(level: ThalesLevel): ExerciseParams {
  switch (level) {
    case 'TALES_SHADOWS':
      return generateTalesShadows();
    case 'TALES_SCALE':
      return generateTalesScale();
    case 'TALES_BASIC':
      return generateTalesBasic();
    case 'TALES_CONTEXT':
      return generateTalesContext();
    case 'SIMILAR_ID':
      throw new Error(`ThalesLevel 'SIMILAR_ID' is not yet implemented`);
    case 'PROPORTION_BASIC': {
      const base = generateTalesBasic();
      return { ...base, type: 'PROPORTION_BASIC' };
    }
  }
}
