/**
 * GUIDED MODE ENGINE
 * Selects the optimal next exercise level for a student given a topic,
 * based on the concept graph and the student's current mastery scores.
 *
 * Pure functions — no side effects, no API calls, no React.
 */

import type { StudentModel } from "../studentModel/types";
import type { ConceptGraph } from "./conceptGraph/types";
import type { ExerciseType } from "../core/ExerciseEngine";

export type GuidedTopic = 'thales' | 'pythagoras';

export interface GuidedSelection {
  exerciseType: ExerciseType;
  level: string | undefined;
  conceptId: string;
  reason: 'prerequisite_not_met' | 'lowest_mastery' | 'reinforcement';
}

// ---------------------------------------------------------------------------
// Concept-to-exercise mapping tables
// Keys are concept node IDs in the unified concept graph.
// ---------------------------------------------------------------------------

const THALES_MAP: Record<string, { exerciseType: 'thales'; level: string }> = {
  proportion:    { exerciseType: 'thales', level: 'PROPORTION_BASIC' },
  similar_id:    { exerciseType: 'thales', level: 'SIMILAR_ID' },
  tales_basic:   { exerciseType: 'thales', level: 'TALES_BASIC' },
  tales_shadows: { exerciseType: 'thales', level: 'TALES_SHADOWS' },
  tales_scale:   { exerciseType: 'thales', level: 'TALES_SCALE' },
  tales_context: { exerciseType: 'thales', level: 'TALES_CONTEXT' },
};

const PYTHAGORAS_MAP: Record<string, { exerciseType: 'pythagoras'; level: string }> = {
  right_triangle_id:   { exerciseType: 'pythagoras', level: 'RIGHT_TRIANGLE_ID' },
  hypotenuse_id:       { exerciseType: 'pythagoras', level: 'HYPOTENUSE_ID' },
  pythagorean_basic:   { exerciseType: 'pythagoras', level: 'PYTH_HYPOTENUSE' },
  pythagorean_leg:     { exerciseType: 'pythagoras', level: 'PYTH_LEG' },
  pythagorean_verify:  { exerciseType: 'pythagoras', level: 'PYTH_VERIFY' },
  pythagorean_context: { exerciseType: 'pythagoras', level: 'PYTH_CONTEXT' },
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Maps prerequisite concept IDs to their remediation exercise.
 * Used by selectRemediationExercise.
 */
const PREREQ_EXERCISE_MAP: Record<string, GuidedSelection> = {
  square_root:      { exerciseType: 'prerequisite', level: 'SQRT',       conceptId: 'square_root',      reason: 'prerequisite_not_met' },
  powers:           { exerciseType: 'prerequisite', level: 'POWERS',     conceptId: 'powers',           reason: 'prerequisite_not_met' },
  proportion_basic: { exerciseType: 'prerequisite', level: 'PROPORTION', conceptId: 'proportion_basic', reason: 'prerequisite_not_met' },
  fractions:        { exerciseType: 'fractions',    level: undefined,    conceptId: 'fractions',        reason: 'prerequisite_not_met' },
};

/** Concept IDs that live in the arithmetic area, not geometry. */
const ARITHMETIC_CONCEPTS = new Set(['fractions', 'proportion', 'proportions', 'ratio']);

/**
 * Returns the current mastery (0–1) for a given concept ID.
 * Checks arithmetic area first for arithmetic prerequisite nodes,
 * then geometry area. Returns 0 safely for new students with no data.
 */
function getMasteryForConcept(conceptId: string, studentState: StudentModel): number {
  // Prerequisite concepts tracked as conceptual competences in the arithmetic area
  if (conceptId === 'square_root' || conceptId === 'powers' || conceptId === 'proportion_basic') {
    return studentState.areas?.arithmetic?.competences?.conceptual?.[conceptId]?.performance ?? 0;
  }

  // Other prerequisite nodes that live in the arithmetic area (general calc proxy)
  if (ARITHMETIC_CONCEPTS.has(conceptId)) {
    return studentState.areas?.arithmetic?.competences?.calculation_specific?.performance ?? 0;
  }

  const geo = studentState.areas?.geometry;
  if (!geo) return 0;
  const comp = geo.competences;

  if (conceptId === 'pythagorean_basic' || conceptId === 'pythagorean_leg') {
    return comp.calculation_specific?.performance ?? 0;
  }
  if (conceptId === 'pythagorean_verify' || conceptId === 'tales_context') {
    return comp.problem_solving_specific?.performance ?? 0;
  }
  return comp.conceptual[conceptId]?.performance ?? 0;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Selects the optimal next exercise level for the given topic.
 *
 * Algorithm:
 * 1. frontier = concepts where all prereqs have mastery >= 0.7 (or no prereqs)
 *    AND the concept itself has mastery < 0.7 (not yet consolidated).
 * 2. If frontier non-empty: pick randomly from frontier → reason 'lowest_mastery'.
 * 3. If frontier empty (all consolidated): pick randomly from ALL candidates
 *    → reason 'reinforcement'.
 *
 * Consolidation threshold: 0.7
 */
export function selectNextExercise(
  topic: GuidedTopic,
  studentState: StudentModel,
  conceptGraph: ConceptGraph
): GuidedSelection {
  const map = topic === 'thales' ? THALES_MAP : PYTHAGORAS_MAP;

  // Candidates: only concept IDs present in both the map and the supplied graph
  const candidateIds = Object.keys(map).filter(id => conceptGraph[id] !== undefined);

  // Step 1: Build frontier
  const frontier: string[] = [];
  for (const id of candidateIds) {
    const node = conceptGraph[id];
    const prereqsMet = node.prerequisites.every(
      prereqId => getMasteryForConcept(prereqId, studentState) >= 0.7
    );
    const ownMastery = getMasteryForConcept(id, studentState);
    if (prereqsMet && ownMastery < 0.7) {
      frontier.push(id);
    }
  }

  // Step 2: Pick randomly from frontier
  if (frontier.length > 0) {
    const chosen = frontier[Math.floor(Math.random() * frontier.length)];
    const { exerciseType, level } = map[chosen];
    return { exerciseType, level, conceptId: chosen, reason: 'lowest_mastery' };
  }

  // Step 3: All consolidated — reinforce at random
  const pool = candidateIds.length > 0 ? candidateIds : Object.keys(map);
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  const { exerciseType, level } = map[chosen];
  return { exerciseType, level, conceptId: chosen, reason: 'reinforcement' };
}

/**
 * Returns a remediation exercise for a failed concept, or null if no
 * prerequisite needs remediation (mastery of all prereqs >= 0.5).
 *
 * Called by ExerciseContainer after an incorrect answer in adaptive mode.
 */
export function selectRemediationExercise(
  failedConceptId: string,
  studentState: StudentModel,
  conceptGraph: ConceptGraph
): GuidedSelection | null {
  const node = conceptGraph[failedConceptId];
  if (!node) return null;

  for (const prereqId of node.prerequisites) {
    if (!PREREQ_EXERCISE_MAP[prereqId]) continue;
    const mastery = getMasteryForConcept(prereqId, studentState);
    if (mastery < 0.5) {
      return PREREQ_EXERCISE_MAP[prereqId];
    }
  }
  return null;
}
