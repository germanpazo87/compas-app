/**
 * ORACLE CONTEXT BUILDER
 * Transformador que converteix estat d'exercici validat en OracleContext estructurat.
 * NO recalcula matemàtiques ni valida respostes (ja fet pel Domain Layer).
 */

import type { OracleContext } from "../types/OracleContext";

/**
 * Estat d'exercici que ve del Domain Layer (ja validat)
 */
export interface ExerciseState {
  exerciseId: string;
  milestone: "metadata_sync" | "categories_completed" | "categories_input" | "frequencies_partial" | "frequencies_completed" ;
  
  // Dataset information
  datasetSummary: {
    variableName: string;
    variableType: "qualitative" | "quantitative_discrete";
    N: number;
    categories: string[];
    frequencies?: Record<string, number>;
  };
  
  // Student input (flexible structure per milestone)
  studentInput: Record<string, any>;
  
  // Validation results (computed by Domain Layer)
  validationStatus: {
    isCorrect: boolean;
    errorCount: number;
  };
  
  // Pedagogical metadata
  pedagogicalState: {
    autonomyLevel: "low" | "medium" | "high";
  };
  
  // Language preferences
  languageConfig: {
    primaryLanguage: "ca";
    interactionLanguage: string;
    glossaryMode: boolean;
  };
}

/**
 * BUILD ORACLE CONTEXT
 * Assegura forma estructural i contracte Oracle sense transformacions complexes
 */
export function buildOracleContext(exerciseState: ExerciseState): OracleContext {
  // Validació estructural bàsica
  if (!exerciseState.exerciseId || !exerciseState.milestone) {
    throw new Error("Invalid exercise state: missing required fields");
  }

  // Mapatge directe (Opció A: ja ve tot validat)
  const context: OracleContext = {
    exerciseId: exerciseState.exerciseId,
    milestone: exerciseState.milestone,
    datasetSummary: {
      variableName: exerciseState.datasetSummary.variableName,
      variableType: exerciseState.datasetSummary.variableType,
      N: exerciseState.datasetSummary.N,
      categories: [...exerciseState.datasetSummary.categories], // Immutable copy
      frequencies: exerciseState.datasetSummary.frequencies
        ? { ...exerciseState.datasetSummary.frequencies }
        : undefined,
    },
    studentInput: { ...exerciseState.studentInput },
    validationStatus: {
      isCorrect: exerciseState.validationStatus.isCorrect,
      errorCount: exerciseState.validationStatus.errorCount,
    },
    pedagogicalState: {
      autonomyLevel: exerciseState.pedagogicalState.autonomyLevel,
    },
    languageConfig: {
      primaryLanguage: exerciseState.languageConfig.primaryLanguage,
      interactionLanguage: exerciseState.languageConfig.interactionLanguage,
      glossaryMode: exerciseState.languageConfig.glossaryMode,
    },
  };

  return context;
}