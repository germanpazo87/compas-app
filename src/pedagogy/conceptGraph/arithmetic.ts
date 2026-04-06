/**
 * ARITHMETIC CONCEPT GRAPH
 * Graf de conceptes d'aritmètica.
 */

import type { ConceptGraph } from "./types";

/**
 * Graf de conceptes aritmètics
 */
export const arithmeticConceptGraph: ConceptGraph = {
  fractions: {
    id: "fractions",
    domain: "arithmetic",
    difficulty: 2,
    prerequisites: [],
    relatedConcepts: ["percentages", "ratios"],
    tags: ["basic", "rational_numbers"],
  },

  percentages: {
    id: "percentages",
    domain: "arithmetic",
    difficulty: 2,
    prerequisites: ["fractions"],
    relatedConcepts: ["ratios", "proportions"],
    tags: ["basic", "applications"],
  },

  lcm: {
    id: "lcm",
    domain: "arithmetic",
    difficulty: 3,
    prerequisites: ["multiples", "prime_factorization"],
    relatedConcepts: ["gcd", "fractions"],
    tags: ["number_theory", "intermediate"],
  },

  // Conceptes auxiliars per completar el graf
  multiples: {
    id: "multiples",
    domain: "arithmetic",
    difficulty: 1,
    prerequisites: [],
    relatedConcepts: ["division", "multiplication"],
    tags: ["basic", "foundations"],
  },

  prime_factorization: {
    id: "prime_factorization",
    domain: "arithmetic",
    difficulty: 2,
    prerequisites: ["multiples"],
    relatedConcepts: ["prime_numbers", "lcm", "gcd"],
    tags: ["number_theory", "intermediate"],
  },

  ratios: {
    id: "ratios",
    domain: "arithmetic",
    difficulty: 2,
    prerequisites: ["fractions"],
    relatedConcepts: ["percentages", "proportions"],
    tags: ["basic", "applications"],
  },

  proportions: {
    id: "proportions",
    domain: "arithmetic",
    difficulty: 3,
    prerequisites: ["ratios"],
    relatedConcepts: ["percentages", "scaling"],
    tags: ["intermediate", "applications"],
  },
};