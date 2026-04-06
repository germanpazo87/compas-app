import type { 
  StudentModel, 
  Competence, 
  MathArea, 
  AreaCompetences 
} from "./types";

/**
 * Helper: Crea una competència buida (inicialitzada a 0)
 */
const initCompetence = (): Competence => ({
  performance: 0,
  medal: false,
  retrievalStrength: 0,
  stability: 0,
  lastReviewed: 0,
  attempts: 0
});

/**
 * Helper: Crea una àrea matemàtica completa segons la interfície AreaCompetences
 */
const createEmptyArea = (): MathArea => ({
  mastery: false,
  competences: {
    // Aquestes dues són obligatòries segons el teu 'AreaCompetences'
    calculation_specific: initCompetence(),
    problem_solving_specific: initCompetence(),
    // Aquesta és un mapa obert
    conceptual: {} 
  }
});

/**
 * 🆕 Factory Function: Crea un model d'estudiant verge però vàlid
 * Ara inclou els comptadors per al RetrievalScheduler.
 */
export const createNewStudentModel = (id: string = "anon"): StudentModel => ({
  id,
  profile: {
    preferredLanguage: 'ca', 
    languageLevel: 'medium',
    educationalLevel: 'ESO4' // Posem ESO4 com a estàndard de test
  },
  // La propietat 'global' és la suma de mètriques + competències globals
  global: {
    reliability: 1.0,
    stability: 0,
    attempts: 0,
    
    // 🧠 NOUS CAMPS PER A L'EVOCACIÓ COGNITIVA
    lastEvocationTimestamp: Date.now(), // Iniciem el cronòmetre ara
    exercisesSinceLastEvocation: 0,     // Comptador a zero
    
    // Obligatòries segons 'GlobalCompetences':
    calculation_global: initCompetence(),
    problem_solving_global: initCompetence()
  },
  areas: {
    arithmetic: createEmptyArea(),
    statistics: createEmptyArea(),
    algebra: createEmptyArea()
    // ⚠️ Recorda: Geometry s'ha d'afegir aquí si l'afegeixes als types
  }
});