/**
 * PREREQUISITE VALUE GENERATOR
 * Pure math engine for remediation mini-modules:
 * POWERS, SQRT, PROPORTION.
 */

import type { ExerciseParams } from "../services/ExerciseContextualizer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PrerequisiteLevel = 'POWERS' | 'SQRT' | 'PROPORTION';

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// Value generators
// ---------------------------------------------------------------------------

function generatePowersValues(): ExerciseParams {
  const base = randomFrom([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const);
  const answer = base * base;
  return {
    type: 'POWERS',
    values: { base, answer },
    unknownField: 'answer',
    preferredLanguage: 'ca',
  };
}

function generateSqrtValues(): ExerciseParams {
  const PERFECT_SQUARES = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144] as const;
  const square = randomFrom(PERFECT_SQUARES);
  const answer = Math.sqrt(square);
  return {
    type: 'SQRT',
    values: { square, answer },
    unknownField: 'answer',
    preferredLanguage: 'ca',
  };
}

function generateProportionValues(): ExerciseParams {
  const UNKNOWN_FIELDS = ['a', 'b', 'c', 'd'] as const;
  const MAX_RETRIES = 50;

  for (let i = 0; i < MAX_RETRIES; i++) {
    const a = randomInt(2, 10);
    const b = randomInt(2, 10);
    const c = randomInt(2, 10);
    const d = (b * c) / a;

    if (!Number.isInteger(d) || d < 2 || d > 20) continue;
    if (a === b || c === d || a === c) continue;

    const unknownField = randomFrom(UNKNOWN_FIELDS);
    const answer = unknownField === 'a' ? a
                 : unknownField === 'b' ? b
                 : unknownField === 'c' ? c
                 : d;
    // Reject if unknown value equals any known value
    const known = [a, b, c, d].filter(
      (_, idx) => UNKNOWN_FIELDS[idx] !== unknownField,
    );
    if (known.includes(answer)) continue;

    return {
      type: 'PROPORTION',
      values: { a, b, c, d },
      unknownField,
      preferredLanguage: 'ca',
    };
  }

  // Hard fallback: 3/4 = 6/8
  return {
    type: 'PROPORTION',
    values: { a: 3, b: 4, c: 6, d: 8 },
    unknownField: randomFrom(UNKNOWN_FIELDS),
    preferredLanguage: 'ca',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generatePrerequisiteValues(level: PrerequisiteLevel): ExerciseParams {
  switch (level) {
    case 'POWERS':     return generatePowersValues();
    case 'SQRT':       return generateSqrtValues();
    case 'PROPORTION': return generateProportionValues();
  }
}
