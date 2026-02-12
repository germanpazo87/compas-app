/**
 * ORACLE CONTEXT TYPES
 * Tipus centralitzats per al sistema Oracle desacoblat.
 * Defineixen el contracte de comunicació entre Domain Layer i Oracle.
 */

/**
 * Milestones pedagògiques del flux d'exercici
 */
export type ExerciseMilestone =
  | "metadata_sync"           // Alumne identifica N, variable, tipus
  | "categories_completed"    // Ha completat columna xi
  | "categories_input" 
  | "frequencies_partial"     // Ha emplenat algunes freqüències
  | "frequencies_completed";  // Ha completat tota la taula

/**
 * Tipus de variable estadística
 */
export type VariableType = "qualitative" | "quantitative_discrete";

/**
 * Nivells d'autonomia pedagògica
 */
export type AutonomyLevel = "low" | "medium" | "high";

/**
 * Resum de dataset generat
 */
export interface DatasetSummary {
  variableName: string;
  variableType: VariableType;
  N: number;
  categories: string[];
  frequencies?: Record<string, number>; // Opcional: només disponible si calculades
}

/**
 * Entrada de l'alumne (flexible segons milestone)
 */
export interface StudentInput {
  [key: string]: any; // Permet adaptació segons fase
}

/**
 * Estat de validació del Domain Layer
 */
export interface ValidationStatus {
  isCorrect: boolean;
  errorCount: number;
}

/**
 * Estat pedagògic de l'alumne
 */
export interface PedagogicalState {
  autonomyLevel: AutonomyLevel;
}

/**
 * Configuració lingüística
 */
export interface LanguageConfig {
  primaryLanguage: "ca"; // Sempre català per matemàtiques
  interactionLanguage: string; // Llengua de resposta (ca, es, en, etc.)
  glossaryMode: boolean; // Si true, inclou termes clau en català
}

/**
 * CONTEXT COMPLET QUE REP ORACLE
 * Aquest és el contracte d'entrada per generar feedback intel·ligent
 */
export interface OracleContext {
  exerciseId: string;
  milestone: ExerciseMilestone;
  datasetSummary: DatasetSummary;
  studentInput: StudentInput;
  validationStatus: ValidationStatus;
  pedagogicalState: PedagogicalState;
  languageConfig: LanguageConfig;
}