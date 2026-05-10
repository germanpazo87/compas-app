import type { StudentModel, Competence, MedalType, GlobalCompetences } from "./types";

// ============================================================================
// 📊 CONSTANTS DEL SISTEMA PEDAGÒGIC
// ============================================================================
const BASE_GAIN = 0.20;      // Increment per encert
const BASE_LOSS = 0.10;      // Decrement per error

/**
 * Utilitat: Limita valor entre min i max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Helper: Crea una competència buida amb el tipatge correcte
 * Inicialitza amb medalla 'NONE' i retrievalScore neutre.
 */
const initCompetence = (): Competence => ({
  performance: 0, 
  medal: 'NONE',             // 🛡️ Tipus Correcte: MedalType
  retrievalStrength: 0, 
  stability: 0, 
  lastReviewed: 0, 
  attempts: 0,
  reliability: 1.0,
  lastRetrievalScore: 0.5    // Neutre per defecte
});

/**
 * 🧠 GENERADOR DE PROMPT PER AL COMPÀS
 * Extreu el context del model per configurar la IA.
 * Aquesta funció s'exporta per ser usada al CompasService.
 */
export function generateCompasSystemPrompt(model: StudentModel): string {
  const level = model.profile?.educationalLevel || "nivell educatiu no definit";
  const lang = model.profile?.preferredLanguage || "ca";
  const reliability = (model.global?.reliability || 0.5).toFixed(2);

  return `
    Ets el tutor IA "Compàs". 
    Nivell de l'alumne: ${level}. 
    Idioma base: ${lang}.
    Fiabilitat de l'alumne: ${reliability}.
  `.trim();
}

/**
 * 📐 FUNCIÓ PURA: Càlcul del vector d'estat
 * Aplica el "Pipeline en Cascada": Reliability -> Retrieval -> Mastery -> Stability -> Medals
 */
function calculateNewCompetenceState(
  prev: Competence,
  isCorrect: boolean,
  reliability: number,
  retrievalQuality: number,
  qualityFactor: number,
): Competence {

  // CÀLCUL DEL NUCLI (Mastery Delta)
  // Gain: diminishing returns × quality-adjusted rate
  // Loss: fixed penalty regardless of quality
  let delta = 0;
  if (isCorrect) {
    const effectiveLearningRate = BASE_GAIN * qualityFactor;
    delta = (1 - prev.performance) * effectiveLearningRate;
  } else {
    delta = -BASE_LOSS;
  }

  // Actualitzem Mastery (Clamped 0-1)
  const newPerformance = clamp(prev.performance + delta, 0, 1);

  // 4️⃣ ESTABILITAT (Stability)
  // Si encerta, pugem estabilitat segons fiabilitat. Si falla, baixa fort.
  let newStability = prev.stability;
  if (isCorrect) {
    newStability += 0.05 * reliability; 
  } else {
    newStability -= 0.12; // Penalització d'estabilitat
  }
  newStability = clamp(newStability, 0, 1);

  // 5️⃣ MEDALLES (Derivada)
  const medal = calculateMedal(newPerformance, newStability);

  return {
    ...prev,
    performance: parseFloat(newPerformance.toFixed(3)),
    stability: parseFloat(newStability.toFixed(3)),
    reliability: reliability, // Guardem la fiabilitat d'aquest intent
    attempts: (prev.attempts || 0) + 1,
    lastReviewed: Date.now(),
    retrievalStrength: retrievalQuality, // Guardem l'última qualitat d'evocació
    lastRetrievalScore: retrievalQuality,
    medal
  };
}

/**
 * Helper: Determina la medalla segons llindars de Mastery i Estabilitat
 */
function calculateMedal(mastery: number, stability: number): MedalType {
  if (mastery >= 0.85 && stability >= 0.7) return 'GOLD'; // Or: Domini alt i estable
  if (mastery >= 0.65) return 'SILVER';                  // Plata: Domini funcional
  if (mastery >= 0.35) return 'BRONZE';                  // Bronze: Inici de la corba
  return 'NONE';
}

/** Options passed by the caller to inform quality-adjusted learning rate. */
export interface UpdateOptions {
  stepResults?: Array<{ attempts: number }>;
  attemptCount?: number;
  exerciseLevel?: string;
}

const BINARY_LEVELS = new Set(['SIMILAR_ID', 'PYTH_VERIFY']);

/**
 * Computes a qualityFactor ∈ [0.1, 1.0] that scales the effective learning rate.
 * Only applied to correct answers; incorrect answers always incur the full penalty.
 */
function computeQualityFactor(options?: UpdateOptions): number {
  if (!options) return 1.0;
  const { stepResults, attemptCount, exerciseLevel } = options;

  // Binary exercises (2 options): correct by elimination has minimal value
  if (exerciseLevel && BINARY_LEVELS.has(exerciseLevel) && (attemptCount ?? 1) > 1) {
    return clamp(0.15, 0.1, 1.0);
  }

  // Stepped exercises
  if (stepResults && stepResults.length > 0) {
    const failedSteps = stepResults.filter(r => r.attempts > 1).length;
    if (failedSteps === 0) return 1.0;
    if (failedSteps === 1) return clamp(0.6, 0.1, 1.0);
    return clamp(0.3, 0.1, 1.0);
  }

  // Single-answer exercises
  const attempts = attemptCount ?? 1;
  if (attempts === 1) return 1.0;
  if (attempts === 2) return clamp(0.4, 0.1, 1.0);
  return clamp(0.2, 0.1, 1.0);
}

/**
 * 🔄 UPDATER PRINCIPAL (Versió Scoring Total)
 * Punt d'entrada principal per actualitzar l'estat.
 */
export function updateStudentState(
  model: StudentModel,
  areaId: keyof StudentModel["areas"],
  competenceId: string,
  correct: boolean,
  integrityScore: number,
  options?: UpdateOptions,
): void {
  // 🕵️ DEBUG START
  console.groupCollapsed(`🧠 UPDATER: ${areaId} > ${competenceId}`);
  console.log("📊 Input:", { correct, integrityScore });

  // ═══════════════════════════════════════════════════════════
  // 🛡️ 0️⃣ SANITITZACIÓ D'ESTRUCTURA
  // ═══════════════════════════════════════════════════════════
  if (!model.global) {
    console.warn("⚠️ Global missing. Initializing.");
    model.global = { 
        reliability: 1, stability: 0, attempts: 0, 
        lastEvocationTimestamp: 0, exercisesSinceLastEvocation: 0,
        calculation_global: initCompetence(), problem_solving_global: initCompetence() 
    } as any;
  }

  if (!model.areas) model.areas = {} as any;
  if (!model.areas[areaId]) {
    console.warn(`⚠️ Area ${areaId} missing. Initializing.`);
    model.areas[areaId] = { 
      mastery: false, 
      competences: {
        calculation_specific: initCompetence(),
        problem_solving_specific: initCompetence(),
        conceptual: {}
      }
    };
  }

  const area = model.areas[areaId];
  if (!area.competences.conceptual) {
    area.competences.conceptual = {};
  }

  // ═══════════════════════════════════════════════════════════
  // 1️⃣ IDENTIFICACIÓ I ACCÉS SEGUR
  // ═══════════════════════════════════════════════════════════
  
  let specific: Competence;
  let globalKey: keyof GlobalCompetences | null = null;

  if (competenceId === "calculation_specific") {
    if (!area.competences.calculation_specific) area.competences.calculation_specific = initCompetence();
    specific = area.competences.calculation_specific;
    globalKey = "calculation_global";
  } else if (competenceId === "problem_solving_specific") {
    if (!area.competences.problem_solving_specific) area.competences.problem_solving_specific = initCompetence();
    specific = area.competences.problem_solving_specific;
    globalKey = "problem_solving_global";
  } else {
    // Conceptual
    if (!area.competences.conceptual[competenceId]) {
      console.log(`✨ New Concept Created: ${competenceId}`);
      area.competences.conceptual[competenceId] = initCompetence();
    }
    specific = area.competences.conceptual[competenceId]!;
  }

  // ═══════════════════════════════════════════════════════════
  // 2️⃣ EXTRACCIÓ DE DADES DEL SISTEMA
  // ═══════════════════════════════════════════════════════════
  
  // Recuperem la qualitat de l'última evocació (si existeix) o un valor baix (0.2)
  // per defecte per penalitzar la falta d'activació.
  const retrievalQuality = model.global.lastEvocationScore ?? 0.2;
  const qualityFactor = correct ? computeQualityFactor(options) : 1.0;

  console.log(`🧠 Retrieval Quality Input: ${retrievalQuality}`);

  // ═══════════════════════════════════════════════════════════
  // 3️⃣ CÀLCUL MATEMÀTIC DEL NOU ESTAT
  // ═══════════════════════════════════════════════════════════

  const updatedSpecific = calculateNewCompetenceState(specific, correct, integrityScore, retrievalQuality, qualityFactor);

  // Apliquem els canvis a l'objecte original (mutació controlada per React state)
  Object.assign(specific, updatedSpecific);

  console.log(`📈 New Mastery: ${specific.performance} | Stability: ${specific.stability} | Medal: ${specific.medal}`);

  // ═══════════════════════════════════════════════════════════
  // 4️⃣ PROPAGACIÓ A COMPETÈNCIES GLOBALS (Si escau)
  // ═══════════════════════════════════════════════════════════
  
  if (globalKey) {
    if (!model.global[globalKey]) model.global[globalKey] = initCompetence();
    const globalComp = model.global[globalKey] as Competence;
    
    // La competència global s'actualitza amb menys pes (és transversal)
    const updatedGlobal = calculateNewCompetenceState(globalComp, correct, integrityScore, retrievalQuality, qualityFactor);
    
    // Esmorteïm el canvi global (factor 0.2) perquè un sol exercici no desestabilitzi tot
    globalComp.performance = clamp(globalComp.performance * 0.8 + updatedGlobal.performance * 0.2, 0, 1);
    globalComp.stability = clamp(globalComp.stability * 0.8 + updatedGlobal.stability * 0.2, 0, 1);
    globalComp.attempts++;
  }

  // ═══════════════════════════════════════════════════════════
  // 5️⃣ ACTUALITZA MÈTRIQUES GLOBALS
  // ═══════════════════════════════════════════════════════════
  
  // Integritat global (Rolling Average)
  const alpha = 0.1; 
  model.global.reliability = (1 - alpha) * model.global.reliability + alpha * integrityScore;
  model.global.attempts = (model.global.attempts || 0) + 1;

  // ═══════════════════════════════════════════════════════════
  // 6️⃣ RECALCULA MASTERY DE L'ÀREA
  // ═══════════════════════════════════════════════════════════
  
  const areaComp = area.competences;
  
  // L'àrea es considera dominada si té Or/Plata en procedimentals i algun concepte clau
  const isSolid = (c?: Competence) => c?.medal === 'GOLD' || c?.medal === 'SILVER';

  area.mastery = 
    isSolid(areaComp.calculation_specific) && 
    isSolid(areaComp.problem_solving_specific) && 
    Object.values(areaComp.conceptual || {}).some(comp => isSolid(comp));

  if (area.mastery) {
    console.log("🏆 ÀREA DOMINADA (MASTERED)!");
  }

  console.groupEnd();
  // 🕵️ DEBUG END
}