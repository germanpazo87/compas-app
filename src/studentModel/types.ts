/**
 * STUDENT MODEL TYPES
 * Model cognitiu de l'estat d'aprenentatge de l'alumne.
 * Inspirat en teories de memòria i recuperació (ACT-R, spaced repetition).
 */

/**
 * Estat de l'alumne per un concepte individual
 */
export interface StudentConceptState {
  conceptId: string;

  mastery: number; // 0–1: Nivell de domini del concepte
  retrievalStrength: number; // 0–1: Facilitat de recuperació de memòria
  stability: number; // 0–1: Estabilitat del coneixement al llarg del temps
  errorRate: number; // 0–1: Proporció d'errors en intents recents

  attempts: number; // Total d'intents realitzats
  lastReviewed: number; // Timestamp de l'última revisió (ms)
}

/**
 * Model complet de l'alumne
 * Mapa de conceptId → estat d'aprenentatge
 */
export type StudentModel = Record<string, StudentConceptState>;

/**
 * Utilitat: Crear estat inicial per un concepte
 */
export function createInitialConceptState(conceptId: string): StudentConceptState {
  return {
    conceptId,
    mastery: 0.0,
    retrievalStrength: 0.0,
    stability: 0.0,
    errorRate: 1.0, // Assumim errors inicials
    attempts: 0,
    lastReviewed: 0,
  };
}

/**
 * Utilitat: Obtenir estat d'un concepte (amb fallback a inicial)
 */
export function getConceptState(
  studentModel: StudentModel,
  conceptId: string
): StudentConceptState {
  return studentModel[conceptId] ?? createInitialConceptState(conceptId);
}