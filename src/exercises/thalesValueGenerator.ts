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
  // Only inaccessible_distance is active — building_height removed, map_planning uses TALES_SCALE
  const SUBTYPES: readonly TalesContextSubtype[] = ['inaccessible_distance'];
  const selected: TalesContextSubtype = subtype ?? randomFrom(SUBTYPES);
  const MAX_RETRIES = 100;

  if (selected === 'map_planning') {
    throw new Error('map_planning is not implemented in generateTalesContext — use TALES_SCALE instead');
  }
  if (selected === 'building_height') {
    throw new Error('building_height is not implemented in generateTalesContext — removed');
  }

  switch (selected) {
    case 'inaccessible_distance': {
      // Proportion: stakeHeight / stakeShadow = objectDistance / measuredDistance
      // Generate all 4 as clean integers: pick 3, derive the 4th.
      const UNKNOWN_FIELDS = [
        'stakeHeight', 'stakeShadow', 'objectDistance', 'measuredDistance',
      ] as const;

      for (let i = 0; i < MAX_RETRIES; i++) {
        const stakeHeight      = randomInt(1, 5);
        const stakeShadow      = randomInt(1, 5);
        const measuredDistance = randomInt(5, 30);
        const objectDistance   = (stakeHeight * measuredDistance) / stakeShadow;

        if (!Number.isInteger(objectDistance) || objectDistance < 1 || objectDistance > 200) continue;

        // Reject if any two of the four values are equal
        const vals = [stakeHeight, stakeShadow, objectDistance, measuredDistance];
        if (new Set(vals).size < 4) continue;

        const unknownField = randomFrom(UNKNOWN_FIELDS);
        return {
          type: 'TALES_CONTEXT',
          values: { subtype: 'inaccessible_distance', stakeHeight, stakeShadow, objectDistance, measuredDistance },
          unknownField,
          preferredLanguage: 'ca',
        };
      }
      // Hard fallback: 3/2 = 18/12  (all distinct, integer cross-product)
      return {
        type: 'TALES_CONTEXT',
        values: { subtype: 'inaccessible_distance', stakeHeight: 3, stakeShadow: 2, objectDistance: 18, measuredDistance: 12 },
        unknownField: 'objectDistance',
        preferredLanguage: 'ca',
      };
    }

    case 'building_height':
    case 'map_planning':
      // Guards above handle these; branches satisfy TypeScript exhaustiveness.
      throw new Error(`Subtype '${selected}' is not handled by generateTalesContext`);
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
