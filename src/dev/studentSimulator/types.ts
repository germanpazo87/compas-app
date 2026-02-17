/**
 * STUDENT SIMULATOR TYPES
 * Contractes per simulació determinista de comportament d'alumnes.
 * Eina de desenvolupament per testing end-to-end del sistema pedagògic.
 */

/**
 * Configuració del simulador d'alumne
 */
export interface StudentSimulatorConfig {
  /**
   * Domini inicial per concepte (0.0 - 1.0)
   * Permet modelar coneixement previ heterogeni
   */
  masteryByConcept: Record<string, number>;

  /**
   * Taxa d'oblit temporal (0.0 - 1.0)
   * 0.0 = no oblit
   * 0.1 = oblit moderat
   * 0.5 = oblit ràpid
   * Modelat basat en corbes d'oblit (Ebbinghaus)
   */
  forgettingRate: number;

  /**
   * Nivell de soroll/errors aleatoris (0.0 - 1.0)
   * 0.0 = respostes perfectament deterministes
   * 0.2 = errors ocasionals
   * 0.5 = alta variabilitat
   * Representa errors d'atenció, fatiga, etc.
   */
  noiseLevel: number;

  /**
   * Taxa d'aprenentatge (0.0 - 1.0)
   * 0.05 = aprenentatge lent
   * 0.2 = aprenentatge moderat
   * 0.5 = aprenentatge ràpid
   * Increment de mastery després de resposta correcta
   */
  learningRate: number;

  /**
   * Seed per RNG determinista (opcional)
   * Si es proporciona, garanteix reproducibilitat total
   */
  seed?: number | undefined;
}

/**
 * Resultat de simulació d'una resposta
 */
export interface StudentAnswerSimulationResult {
  conceptId: string; // Concepte avaluat
  correct: boolean; // Resposta correcta o incorrecta
  confidence: number; // Confiança interna (0.0 - 1.0)
  masteryBefore: number; // Domini abans de la resposta
  masteryAfter: number; // Domini després de la resposta
}

/**
 * Perfils predefinits d'alumne per testing
 */
export const STUDENT_PROFILES = {
  /**
   * Alumne amb domini alt però oblida ràpidament
   */
  highMasteryForgetful: {
    masteryByConcept: {},
    forgettingRate: 0.3,
    noiseLevel: 0.1,
    learningRate: 0.1,
  },

  /**
   * Alumne amb domini baix però aprenentatge ràpid
   */
  lowMasteryFastLearner: {
    masteryByConcept: {},
    forgettingRate: 0.05,
    noiseLevel: 0.15,
    learningRate: 0.4,
  },

  /**
   * Alumne erràtic amb alta variabilitat
   */
  erraticPerformer: {
    masteryByConcept: {},
    forgettingRate: 0.15,
    noiseLevel: 0.5,
    learningRate: 0.2,
  },

  /**
   * Alumne estable amb progrés lent
   */
  stableSlowLearner: {
    masteryByConcept: {},
    forgettingRate: 0.02,
    noiseLevel: 0.05,
    learningRate: 0.08,
  },
} as const;