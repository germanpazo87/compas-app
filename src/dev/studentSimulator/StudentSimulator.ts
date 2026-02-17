/**
 * STUDENT SIMULATOR
 * Motor de simulació determinista de comportament d'alumnes.
 * Eina de testing per validació end-to-end del sistema pedagògic.
 * 
 * Modelitza:
 * - Domini parcial del coneixement
 * - Aprenentatge progressiu
 * - Oblit temporal (corbes d'Ebbinghaus)
 * - Soroll cognitiu (errors d'atenció, fatiga)
 * 
 * NO és part del producte final. Només desenvolupament/testing.
 */

import type {
  StudentSimulatorConfig,
  StudentAnswerSimulationResult,
} from "./types";
import { SeededRandom } from "./prng";

/**
 * SIMULADOR D'ALUMNE
 */
export class StudentSimulator {
  private config: StudentSimulatorConfig;
  private rng: SeededRandom;
  private currentMastery: Record<string, number>;

  constructor(config: StudentSimulatorConfig) {
    this.config = config;
    
    // Inicialitza RNG determinista
    this.rng = new SeededRandom(config.seed);
    
    // Copia profunda del domini inicial
    this.currentMastery = { ...config.masteryByConcept };
  }

  /**
   * SIMULA RESPOSTA D'ALUMNE
   * 
   * Model cognitiu:
   * 1. Recupera domini actual
   * 2. Aplica soroll aleatori
   * 3. Calcula probabilitat d'encert
   * 4. Determina correcció
   * 5. Actualitza domini segons resultat
   * 
   * @param conceptId - Concepte a avaluar
   * @returns Resultat detallat de la simulació
   */
  public simulateAnswer(conceptId: string): StudentAnswerSimulationResult {
    // 1️⃣ Recuperar mastery actual
    const masteryBefore = this.getMastery(conceptId);

    // 2️⃣ Calcular probabilitat d'encert
    // Model: P(correct) = mastery - noise + random_fluctuation
    const baseProb = masteryBefore;
    const noiseEffect = this.config.noiseLevel * (this.rng.next() - 0.5) * 2; // ±noise
    const fluctuation = (this.rng.next() - 0.5) * 0.1; // Petit ajust aleatori
    
    const correctnessProb = this.clamp(baseProb - noiseEffect + fluctuation, 0, 1);

    // 3️⃣ Determinar correcció
    const correct = this.rng.next() < correctnessProb;

    // 4️⃣ Calcular confiança (inversament proporcional al soroll)
    const confidence = this.clamp(
      masteryBefore * (1 - this.config.noiseLevel) + this.rng.next() * 0.1,
      0,
      1
    );

    // 5️⃣ Actualitzar mastery
    let masteryAfter = masteryBefore;

    if (correct) {
      // Aprenentatge: increment amb rendiments decreixents
      // Formula: Δmastery = learningRate * (1 - mastery)
      // Raonament: Més fàcil millorar si domini és baix
      const improvement = this.config.learningRate * (1 - masteryBefore);
      masteryAfter = this.clamp(masteryBefore + improvement, 0, 1);
    } else {
      // Error: reducció lleu (interferència/confusió)
      // No reduïm massa per evitar regressions poc realistes
      const degradation = this.config.learningRate * 0.1; // 10% de l'aprenentatge
      masteryAfter = this.clamp(masteryBefore - degradation, 0, 1);
    }

    // Actualitza estat intern
    this.currentMastery[conceptId] = masteryAfter;

    return {
      conceptId,
      correct,
      confidence,
      masteryBefore,
      masteryAfter,
    };
  }

  /**
   * APLICA OBLIT TEMPORAL
   * 
   * Model basat en corbes d'oblit d'Ebbinghaus:
   * - Reducció exponencial del domini
   * - Efecte proporcional al domini actual
   * - No redueix per sota d'un mínim (coneixement base)
   * 
   * Cridada típica: Després de passar temps sense practicar
   */
public applyForgetting(): void {
    const minRetention = 0.05;

    // Fem servir Object.entries per iterar de forma segura sobre clau i valor
    for (const [conceptId, currentValue] of Object.entries(this.currentMastery)) {
      
      // Ara 'currentValue' ja no és undefined, és 'number'
      const forgottenValue =
        currentValue * (1 - this.config.forgettingRate) + minRetention;

      this.currentMastery[conceptId] = this.clamp(forgottenValue, minRetention, 1);
    }
  }

  /**
   * OBTÉ DOMINI ACTUAL
   * 
   * @param conceptId - Identificador del concepte
   * @returns Domini actual (0.0 - 1.0)
   */
  public getMastery(conceptId: string): number {
    // Si no existeix, assumeix domini zero
    return this.currentMastery[conceptId] ?? 0.0;
  }

  /**
   * ESTABLEIX DOMINI MANUALMENT
   * Útil per testing de casos específics
   * 
   * @param conceptId - Identificador del concepte
   * @param mastery - Nou valor de domini (0.0 - 1.0)
   */
  public setMastery(conceptId: string, mastery: number): void {
    this.currentMastery[conceptId] = this.clamp(mastery, 0, 1);
  }

  /**
   * RESETEJA SIMULADOR
   * Torna a l'estat inicial amb nova seed (opcional)
   * 
   * @param newSeed - Nova seed per RNG (opcional)
   */
  public reset(newSeed?: number): void {
    this.currentMastery = { ...this.config.masteryByConcept };
    
    if (newSeed !== undefined) {
      this.rng.reset(newSeed);
    }
  }

  /**
   * EXPORTA ESTAT ACTUAL
   * Útil per debugging i anàlisi
   */
  public exportState(): Record<string, number> {
    return { ...this.currentMastery };
  }

  /**
   * UTILITAT: Limita valor entre min i max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

/**
 * FACTORY: Crear simulador amb perfil predefinit
 */
export function createStudentSimulator(
  profile: "highMasteryForgetful" | "lowMasteryFastLearner" | "erraticPerformer" | "stableSlowLearner",
  initialMastery: Record<string, number>,
  seed?: number
): StudentSimulator {
  const profiles = {
    highMasteryForgetful: {
      masteryByConcept: initialMastery,
      forgettingRate: 0.3,
      noiseLevel: 0.1,
      learningRate: 0.1,
      seed,
    },
    lowMasteryFastLearner: {
      masteryByConcept: initialMastery,
      forgettingRate: 0.05,
      noiseLevel: 0.15,
      learningRate: 0.4,
      seed,
    },
    erraticPerformer: {
      masteryByConcept: initialMastery,
      forgettingRate: 0.15,
      noiseLevel: 0.5,
      learningRate: 0.2,
      seed,
    },
    stableSlowLearner: {
      masteryByConcept: initialMastery,
      forgettingRate: 0.02,
      noiseLevel: 0.05,
      learningRate: 0.08,
      seed,
    },
  };

  return new StudentSimulator(profiles[profile]);
}