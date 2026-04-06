/**
 * GEOMETRY CONCEPT GRAPH
 * Graf de conceptes de geometria: Teorema de Tales i figures semblants.
 */

import type { ConceptGraph } from "./types";

export const geometryConceptGraph: ConceptGraph = {
  proportion: {
    id: "proportion",
    domain: "geometry",
    difficulty: 2,
    prerequisites: ["proportions"],   // links to arithmetic proportions node
    relatedConcepts: ["tales_basic", "tales_scale"],
    tags: ["foundations", "ratio"],
  },

  tales_basic: {
    id: "tales_basic",
    domain: "geometry",
    difficulty: 3,
    prerequisites: ["proportion"],
    relatedConcepts: ["tales_shadows", "tales_scale", "tales_context"],
    tags: ["thales", "parallel_lines"],
  },

  tales_shadows: {
    id: "tales_shadows",
    domain: "geometry",
    difficulty: 3,
    prerequisites: ["proportion", "tales_basic"],
    relatedConcepts: ["tales_context"],
    tags: ["thales", "applied", "shadow"],
  },

  tales_scale: {
    id: "tales_scale",
    domain: "geometry",
    difficulty: 3,
    prerequisites: ["proportion"],
    relatedConcepts: ["tales_basic", "tales_context"],
    tags: ["thales", "applied", "maps"],
  },

  tales_context: {
    id: "tales_context",
    domain: "geometry",
    difficulty: 4,
    prerequisites: ["tales_basic", "tales_shadows"],
    relatedConcepts: ["tales_scale"],
    tags: ["thales", "applied", "problem_solving"],
  },

  similar_id: {
    id: "similar_id",
    domain: "geometry",
    difficulty: 4,
    prerequisites: ["tales_basic", "proportion"],
    relatedConcepts: ["tales_context"],
    tags: ["similarity", "triangles", "conceptual"],
  },

  // ---------------------------------------------------------------------------
  // Pythagorean theorem nodes
  // ---------------------------------------------------------------------------

  right_triangle_id: {
    id: "right_triangle_id",
    domain: "geometry",
    difficulty: 1,
    prerequisites: [],
    relatedConcepts: ["hypotenuse_id", "pythagorean_basic"],
    tags: ["pythagorean", "triangles", "conceptual"],
  },

  square_root: {
    id: "square_root",
    domain: "geometry",
    difficulty: 1,
    prerequisites: [],
    relatedConcepts: ["pythagorean_basic"],
    tags: ["pythagorean", "arithmetic", "foundations"],
  },

  hypotenuse_id: {
    id: "hypotenuse_id",
    domain: "geometry",
    difficulty: 2,
    prerequisites: ["right_triangle_id"],
    relatedConcepts: ["pythagorean_basic"],
    tags: ["pythagorean", "triangles", "conceptual"],
  },

  pythagorean_basic: {
    id: "pythagorean_basic",
    domain: "geometry",
    difficulty: 2,
    prerequisites: ["hypotenuse_id", "square_root"],
    relatedConcepts: ["pythagorean_leg", "pythagorean_verify"],
    tags: ["pythagorean", "hypotenuse"],
  },

  pythagorean_leg: {
    id: "pythagorean_leg",
    domain: "geometry",
    difficulty: 3,
    prerequisites: ["pythagorean_basic"],
    relatedConcepts: ["pythagorean_context"],
    tags: ["pythagorean", "leg"],
  },

  pythagorean_verify: {
    id: "pythagorean_verify",
    domain: "geometry",
    difficulty: 3,
    prerequisites: ["pythagorean_basic"],
    relatedConcepts: ["pythagorean_context"],
    tags: ["pythagorean", "verification", "conceptual"],
  },

  pythagorean_context: {
    id: "pythagorean_context",
    domain: "geometry",
    difficulty: 4,
    prerequisites: ["pythagorean_leg", "pythagorean_verify"],
    relatedConcepts: [],
    tags: ["pythagorean", "applied", "problem_solving"],
  },
};
