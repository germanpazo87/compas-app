/**
 * STUDENT MODEL JERÀRQUIC (Versió TFM - Full Scoring)
 * Model cognitiu basat en 4 pilars: Mastery, Stability, Reliability, Retrieval.
 */

// 🆕 ENUMS I TIPUS BÀSICS
export type EducationalLevel = 'ESO1' | 'ESO2' | 'ESO3' | 'ESO4' | 'BAT1' | 'BAT2' | 'UNIVERSITAT'| 'GES1' | 'GES2'|'PPA+25';
export type AppLanguage =
| 'ca' 
| 'es' 
| 'en'
| 'zh' // Xinès (Simplificat)
| 'ur' // Urdu
| 'pa' // Punjabi
| 'ar' // Àrab
| 'rom' // Romaní
| 'ru' // Rus
| 'pt' // Portuguès
| 'fr'
| string; // 🌍 Obert a futurs idiomes suportats per Gemini

export type LanguageLevel = "low" | "medium" | "high";

// 🏅 GAMIFICACIÓ ESTRUCTURAL
// Ja no és sí/no, sinó un indicador de qualitat del domini.
export type MedalType = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD';

/**
 * 🧱 COMPETÈNCIA INDIVIDUAL (El maó fonamental)
 * Conté tot el vector d'estat per a un concepte o habilitat.
 */
export interface Competence {
  // 1️⃣ MASTERY (Rendiment)
  performance: number;      // 0.0 - 1.0: Grau de domini actual (Mastery)
  
  // 2️⃣ STABILITY (Consolidació)
  stability: number;        // 0.0 - 1.0: Resistència a l'oblit temporal
  
  // 3️⃣ RELIABILITY (Fiabilitat)
  reliability: number;      // 0.0 - 1.0: Integritat de la dada (detectat per IntegrityEngine)
  
  // 4️⃣ RETRIEVAL (Activació)
  retrievalStrength: number;   // 0.0 - 1.0: Força general d'evocació
  lastRetrievalScore?: number; // 0.0 - 1.0: Qualitat específica de l'última evocació (per al DecisionEngine)

  // ⚙️ METADADES
  lastReviewed: number;     // Timestamp (ms)
  attempts: number;         // Total d'interaccions
  
  // 🏆 RESULTAT VISUAL (Derivat)
  medal: MedalType;         // Calculat en funció de Performance + Stability
}

/**
 * Competències transversals globals
 * Apliquen a totes les àrees matemàtiques
 */
export interface GlobalCompetences {
  calculation_global: Competence;       // Càlcul i manipulació simbòlica
  problem_solving_global: Competence;   // Resolució de problemes generals
}

/**
 * Competències específiques d'una àrea
 */
export interface AreaCompetences {
  // Procedimentals (amb component transversal)
  calculation_specific: Competence;     // Càlcul específic de l'àrea
  problem_solving_specific: Competence; // Resolució específica de l'àrea
  
  // Conceptuals (sense component transversal)
  // Clau: ID del concepte (ex: "mean", "frequency_table")
  conceptual: Record<string, Competence>; 
}

/**
 * Àrea matemàtica completa
 */
export interface MathArea {
  mastery: boolean;           // true si l'àrea està dominada completament
  competences: AreaCompetences;
}

/**
 * 🧠 MÈTRIQUES GLOBALS I ESTAT DEL SCHEDULER
 */
export interface StudentGlobalMetrics {
  reliability: number;   // Score global de l'IntegrityEngine
  stability: number;     // Estabilitat mitjana de l'alumne
  attempts: number;      // Total d'intents a la plataforma
  llmInteractionsTotal: number; // Comptador acumulat de crides a CompasService.ask()

  // 🕰️ ESTAT DEL RETRIEVAL SCHEDULER (El "Policia")
  lastEvocationTimestamp: number;       // Quan va ser l'última activació cognitiva?
  exercisesSinceLastEvocation: number;  // Quants exercicis ha fet "en pilot automàtic"?
  lastEvocationScore?: number;          // Qualitat de l'última evocació global (0-1)

  // Permetre extensions futures sense trencar tipatge estricte
  [key: string]: any;
}

/**
 * Perfil de l'alumne
 */
export interface StudentProfile {
  name?: string;
  email?: string;
  preferredLanguage: AppLanguage;
  languageLevel: LanguageLevel;
  educationalLevel?: EducationalLevel; // Determinant per al GLOSEIG i dificultat
  languageFamily?: 'romantic' | 'non-romantic' | null; // Derivat de preferredLanguage per a l'anàlisi
}

/**
 * 🌍 MODEL COMPLET DE L'ALUMNE (L'Arrel)
 */
export interface StudentModel {
  id: string;
  profile: StudentProfile; 
  
  // Unió de mètriques d'estat + competències transversals
  global: StudentGlobalMetrics & GlobalCompetences; 
  
  areas: {
    arithmetic: MathArea;
    statistics: MathArea;
    algebra: MathArea;
    geometry: MathArea;
  };
}