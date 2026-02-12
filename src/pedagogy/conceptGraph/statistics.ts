/**
 * STATISTICS CONCEPT GRAPH
 * Graf de conceptes d'estadística descriptiva.
 */

import type { ConceptGraph } from "./types";

/**
 * Graf de conceptes estadístics
 */
export const statisticsConceptGraph: ConceptGraph = {
  frequency_absolute: {
    id: "frequency_absolute",
    domain: "statistics",
    difficulty: 2,
    prerequisites: ["counting", "categorization"],
    relatedConcepts: ["frequency_relative", "frequency_table"],
    tags: ["descriptive", "basic"],
  },

  frequency_relative: {
    id: "frequency_relative",
    domain: "statistics",
    difficulty: 3,
    prerequisites: ["frequency_absolute", "percentages"], // Depèn d'aritmètica!
    relatedConcepts: ["probability", "proportions"],
    tags: ["descriptive", "intermediate"],
  },

  frequency_table: {
    id: "frequency_table",
    domain: "statistics",
    difficulty: 2,
    prerequisites: ["frequency_absolute"],
    relatedConcepts: ["data_organization", "categorization"],
    tags: ["descriptive", "tables"],
  },

  // Conceptes auxiliars
  counting: {
    id: "counting",
    domain: "statistics",
    difficulty: 1,
    prerequisites: [],
    relatedConcepts: ["frequency_absolute"],
    tags: ["foundations", "basic"],
  },

  categorization: {
    id: "categorization",
    domain: "statistics",
    difficulty: 1,
    prerequisites: [],
    relatedConcepts: ["variable_types", "frequency_absolute"],
    tags: ["foundations", "classification"],
  },

  variable_types: {
    id: "variable_types",
    domain: "statistics",
    difficulty: 2,
    prerequisites: ["categorization"],
    relatedConcepts: ["qualitative", "quantitative"],
    tags: ["classification", "metadata"],
  },

  data_organization: {
    id: "data_organization",
    domain: "statistics",
    difficulty: 2,
    prerequisites: [],
    relatedConcepts: ["frequency_table", "charts"],
    tags: ["visualization", "organization"],
  },

  mean: {
    id: "mean",
    domain: "statistics",
    difficulty: 2,
    prerequisites: ["counting", "sum"],
    relatedConcepts: ["median", "mode", "central_tendency"],
    tags: ["descriptive", "measures"],
  },

  median: {
    id: "median",
    domain: "statistics",
    difficulty: 3,
    prerequisites: ["ordering", "counting"],
    relatedConcepts: ["mean", "quartiles"],
    tags: ["descriptive", "measures"],
  },

  mode: {
    id: "mode",
    domain: "statistics",
    difficulty: 2,
    prerequisites: ["frequency_absolute"],
    relatedConcepts: ["mean", "median"],
    tags: ["descriptive", "measures"],
  },
};