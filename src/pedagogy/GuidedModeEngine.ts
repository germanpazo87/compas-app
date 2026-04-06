/**
 * GUIDED MODE ENGINE
 * Selects the optimal next exercise level for a student given a topic,
 * based on the concept graph and the student's current mastery scores.
 *
 * Pure functions — no side effects, no API calls, no React.
 */

import type { StudentModel } from "../studentModel/types";
import type { ConceptGraph } from "./conceptGraph/types";

export type GuidedTopic = 'thales' | 'pythagoras';

export interface GuidedSelection {
  exerciseType: 'thales' | 'pythagoras';
  level: string;
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

/** Concept IDs that live in the arithmetic area, not geometry. */
const ARITHMETIC_CONCEPTS = new Set(['fractions', 'proportion', 'proportions', 'ratio']);

/**
 * Returns the current mastery (0–1) for a given concept ID.
 * Checks arithmetic area first for arithmetic prerequisite nodes,
 * then geometry area. Returns 0 safely for new students with no data.
 */
function getMasteryForConcept(conceptId: string, studentState: StudentModel): number {
  // Prerequisite nodes that live in the arithmetic area
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
 * 1. Candidate concepts = mapping keys that exist in the concept graph,
 *    sorted ascending by difficulty.
 * 2. Split into prerequisitesMet / notMet (all prereqs mastery >= 0.7).
 * 3. If NO candidates have prerequisites met → return easiest (new student).
 * 4. From candidates with prerequisites met, pick lowest mastery below 0.85.
 * 5. If all are >= 0.85 → reinforcement on the hardest.
 */
export function selectNextExercise(
  topic: GuidedTopic,
  studentState: StudentModel,
  conceptGraph: ConceptGraph
): GuidedSelection {
  const map = topic === 'thales' ? THALES_MAP : PYTHAGORAS_MAP;

  // Only use concept IDs that exist in the supplied graph
  const candidateIds = Object.keys(map)
    .filter(id => conceptGraph[id] !== undefined)
    .sort((a, b) => conceptGraph[a].difficulty - conceptGraph[b].difficulty);

  const met: string[] = [];
  const notMet: string[] = [];

  for (const id of candidateIds) {
    const node = conceptGraph[id];
    const allPrereqsMet = node.prerequisites.every(
      prereqId => getMasteryForConcept(prereqId, studentState) >= 0.7
    );
    if (allPrereqsMet) {
      met.push(id);
    } else {
      notMet.push(id);
    }
  }

  // Step 3: No prerequisites met at all — safe fallback for new students.
  // Prefer a node with no prerequisites at all (guaranteed entry point).
  // If none found (all nodes have at least one prerequisite), use the
  // hardcoded topic fallback which is always implemented.
  if (met.length === 0) {
    const noPrereqId = candidateIds.find(id => conceptGraph[id].prerequisites.length === 0);
    if (noPrereqId) {
      const { exerciseType, level } = map[noPrereqId];
      return { exerciseType, level, conceptId: noPrereqId, reason: 'prerequisite_not_met' };
    }
    // Absolute topic fallback — always implemented
    const fallbackId = topic === 'thales' ? 'tales_basic' : 'right_triangle_id';
    const { exerciseType, level } = map[fallbackId];
    return { exerciseType, level, conceptId: fallbackId, reason: 'prerequisite_not_met' };
  }

  // Step 4: Find the node in `met` with the lowest mastery below 0.85
  let selected: string | null = null;
  let lowestMastery = Infinity;

  for (const id of met) {
    const mastery = getMasteryForConcept(id, studentState);
    if (mastery < 0.85 && mastery < lowestMastery) {
      lowestMastery = mastery;
      selected = id;
    }
  }

  if (selected !== null) {
    const { exerciseType, level } = map[selected];
    return { exerciseType, level, conceptId: selected, reason: 'lowest_mastery' };
  }

  // Step 5: All nodes with prerequisites met are >= 0.85 — reinforce the hardest
  const hardest = [...met].sort(
    (a, b) => conceptGraph[b].difficulty - conceptGraph[a].difficulty
  )[0];
  const { exerciseType, level } = map[hardest];
  return { exerciseType, level, conceptId: hardest, reason: 'reinforcement' };
}
