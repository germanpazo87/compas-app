/**
 * PYTHAGORAS VALUE GENERATOR
 * Pure math engine — no text, no API calls.
 * Generates numerical exercise parameters for the Pythagorean theorem module.
 * Caller is responsible for setting preferredLanguage before passing
 * the result to ExerciseContextualizer.contextualize().
 */

import type { ExerciseParams } from "../services/ExerciseContextualizer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PythagorasLevel =
  | 'RIGHT_TRIANGLE_ID'
  | 'HYPOTENUSE_ID'
  | 'PYTH_HYPOTENUSE'
  | 'PYTH_LEG'
  | 'PYTH_VERIFY'
  | 'PYTH_CONTEXT';

export type PythContextSubtype =
  | 'ladder'
  | 'distance'
  | 'diagonal'
  | 'height';

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

function roundTo(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

function isPythagoreanTriple(a: number, b: number, c: number): boolean {
  return a * a + b * b === c * c;
}

/**
 * Returns three sides [a, b, c] of a scalene triangle that is NOT right-angled.
 * Used for PYTH_VERIFY false cases.
 */
function generateNonRightTriangle(): [number, number, number] {
  const CANDIDATES: [number, number, number][] = [
    [3, 4, 6],
    [5, 6, 8],
    [2, 4, 5],
    [6, 7, 9],
    [4, 6, 7],
    [3, 5, 6],
    [7, 8, 11],
    [5, 8, 10],
  ];
  return randomFrom(CANDIDATES);
}

// ---------------------------------------------------------------------------
// Known Pythagorean triples
// ---------------------------------------------------------------------------

const PYTH_TRIPLES: readonly [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [6, 8, 10],
  [9, 12, 15],
  [9, 40, 41],
  [20, 21, 29],
  [12, 16, 20],
  [10, 24, 26],
] as const;

// ---------------------------------------------------------------------------
// Value generators
// ---------------------------------------------------------------------------

function generateRightTriangleId(): ExerciseParams {
  const NAMED: readonly [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17]];
  const NON_RIGHT: readonly [number, number, number][] = [
    [3, 4, 6], [5, 6, 8], [2, 4, 5], [6, 7, 9], [4, 6, 7], [3, 5, 6], [7, 8, 11], [5, 8, 10],
  ];

  const [ra, rb, rc] = randomFrom(NAMED);

  // Pick 2 distinct non-right distractors using index-based selection
  const d1Idx = randomInt(0, NON_RIGHT.length - 1);
  let d2Idx   = randomInt(0, NON_RIGHT.length - 2);
  if (d2Idx >= d1Idx) d2Idx++;
  const d1 = NON_RIGHT[d1Idx];
  const d2 = NON_RIGHT[d2Idx];

  // Choose random position for the correct (right) triangle
  const correctTriangle = randomInt(0, 2);
  const ordered: [number, number, number][] = new Array(3) as [number, number, number][];
  const distractors: [number, number, number][] = [
    d1 as [number, number, number],
    d2 as [number, number, number],
  ];
  let di = 0;
  for (let i = 0; i < 3; i++) {
    ordered[i] = i === correctTriangle ? [ra, rb, rc] : distractors[di++];
  }

  return {
    type: 'RIGHT_TRIANGLE_ID',
    values: {
      t1a: ordered[0][0], t1b: ordered[0][1], t1c: ordered[0][2],
      t2a: ordered[1][0], t2b: ordered[1][1], t2c: ordered[1][2],
      t3a: ordered[2][0], t3b: ordered[2][1], t3c: ordered[2][2],
      correctTriangle,
    },
    unknownField: 'correctTriangle',
    preferredLanguage: 'ca',
  };
}

function generateHypotenuseId(): ExerciseParams {
  const [a, b, c] = randomFrom(PYTH_TRIPLES);
  // Ask student to identify which side is the hypotenuse (stored as answer index 0/1/2)
  // We encode: answer = c (the hypotenuse value) so evaluator can check numerically.
  return {
    type: 'HYPOTENUSE_ID',
    values: { sideA: a, sideB: b, sideC: c, hypotenuse: c },
    unknownField: 'hypotenuse',
    preferredLanguage: 'ca',
  };
}

function generatePythHypotenuse(): ExerciseParams {
  const [a, b, c] = randomFrom(PYTH_TRIPLES);
  return {
    type: 'PYTH_HYPOTENUSE',
    values: { legA: a, legB: b, hypotenuse: c },
    unknownField: 'hypotenuse',
    preferredLanguage: 'ca',
  };
}

function generatePythLeg(): ExerciseParams {
  const [a, b, c] = randomFrom(PYTH_TRIPLES);
  // Randomly decide which leg is unknown
  const unknownLeg = randomFrom(['legA', 'legB'] as const);
  return {
    type: 'PYTH_LEG',
    values: { legA: a, legB: b, hypotenuse: c },
    unknownField: unknownLeg,
    preferredLanguage: 'ca',
  };
}

function generatePythVerify(): ExerciseParams {
  // 50% chance of a true right triangle, 50% false
  const isRight = Math.random() < 0.5;
  let a: number, b: number, c: number;

  if (isRight) {
    [a, b, c] = randomFrom(PYTH_TRIPLES);
  } else {
    [a, b, c] = generateNonRightTriangle();
  }

  return {
    type: 'PYTH_VERIFY',
    values: { sideA: a, sideB: b, sideC: c, isRight: isRight ? 1 : 0 },
    unknownField: 'isRight',
    preferredLanguage: 'ca',
  };
}

function generatePythContext(subtype?: PythContextSubtype): ExerciseParams {
  const SUBTYPES: readonly PythContextSubtype[] = [
    'ladder', 'distance', 'diagonal', 'height',
  ];
  const selected: PythContextSubtype = subtype ?? randomFrom(SUBTYPES);

  switch (selected) {
    case 'ladder': {
      // A ladder leans against a wall. Given wall height and ground distance, find ladder length.
      const [a, b, c] = randomFrom(PYTH_TRIPLES);
      return {
        type: 'PYTH_CONTEXT',
        values: { subtype: 'ladder', wallHeight: b, groundDistance: a, ladderLength: c },
        unknownField: 'ladderLength',
        preferredLanguage: 'ca',
      };
    }

    case 'distance': {
      // Straight-line distance between two points on a grid.
      const [a, b, c] = randomFrom(PYTH_TRIPLES);
      return {
        type: 'PYTH_CONTEXT',
        values: { subtype: 'distance', deltaX: a, deltaY: b, distance: c },
        unknownField: 'distance',
        preferredLanguage: 'ca',
      };
    }

    case 'diagonal': {
      // Diagonal of a rectangle. Given width and height, find diagonal.
      const [a, b, c] = randomFrom(PYTH_TRIPLES);
      return {
        type: 'PYTH_CONTEXT',
        values: { subtype: 'diagonal', width: a, height: b, diagonal: c },
        unknownField: 'diagonal',
        preferredLanguage: 'ca',
      };
    }

    case 'height': {
      // Height of an isosceles triangle or sloped roof given base half-width and slant.
      const [a, , c] = randomFrom(PYTH_TRIPLES);
      // b = sqrt(c^2 - a^2) — guaranteed integer by Pythagorean triple definition
      const h = roundTo(Math.sqrt(c * c - a * a), 2);
      return {
        type: 'PYTH_CONTEXT',
        values: { subtype: 'height', halfBase: a, slant: c, triangleHeight: h },
        unknownField: 'triangleHeight',
        preferredLanguage: 'ca',
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates mathematical values for a given Pythagoras exercise level.
 * Returns an ExerciseParams object ready to pass to ExerciseContextualizer.
 * Caller should override preferredLanguage with the student's actual language.
 */
export function generatePythagorasValues(level: PythagorasLevel): ExerciseParams {
  switch (level) {
    case 'RIGHT_TRIANGLE_ID':  return generateRightTriangleId();
    case 'HYPOTENUSE_ID':      return generateHypotenuseId();
    case 'PYTH_HYPOTENUSE':    return generatePythHypotenuse();
    case 'PYTH_LEG':           return generatePythLeg();
    case 'PYTH_VERIFY':        return generatePythVerify();
    case 'PYTH_CONTEXT':       return generatePythContext();
  }
}
