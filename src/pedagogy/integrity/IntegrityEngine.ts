// src/pedagogy/integrity/IntegrityEngine.ts

/**
 * INTEGRITY ENGINE - PROBABILISTIC REDESIGN
 * Multiplicative evidence combination preventing model collapse.
 */

import type { StudentModel } from "../../studentModel/types";
import type { ConceptGraph } from "../conceptGraph/types";
import type {
  IntegrityConfig,
  InteractionData,
  IntegrityResult,
  InteractionHistory,
} from "./types";

export class IntegrityEngine {
  private config: IntegrityConfig;
  private conceptGraph: ConceptGraph;
  private history: Map<string, InteractionHistory[]>;

  constructor(config: IntegrityConfig, conceptGraph: ConceptGraph) {
    this.config = config;
    this.conceptGraph = conceptGraph;
    this.history = new Map();
  }

  /**
   * EVALUATE INTERACTION RELIABILITY
   * Redesigned with multiplicative evidence combination
   */
  public evaluate(
    interaction: InteractionData,
    studentModel: StudentModel
  ): IntegrityResult {
    // Start with neutral belief (100% confidence)
    let confidence = 1.0;
    const flags: string[] = [];

    // ═══════════════════════════════════════════════════════════
    // HEURÍSTICA 1: Pèrdua de Focus (Tab Switching) 🆕
    // ═══════════════════════════════════════════════════════════
    if (interaction.focusLostCount && interaction.focusLostCount > 0) {
      // Apliquem una penalització severa: 35% per la primera vegada, 
      // i augmenta si es repeteix (màxim 90%).
      const focusPenalty = Math.min(interaction.focusLostCount * 0.35, 0.9);
      confidence *= (1 - focusPenalty);
      
      flags.push(
        `FOCUS_LOST: Sortida de pantalla detectada (${interaction.focusLostCount} vegades) ` +
        `[Penalització: ${(focusPenalty * 100).toFixed(0)}%]`
      );
    }

    // ═══════════════════════════════════════════════════════════
    // HEURÍSTICA 2: Response Time Anomaly (Probabilistic)
    // ═══════════════════════════════════════════════════════════
    const timePenalty = this.computeTimePenalty(interaction);
    
    if (timePenalty > 0.05) {
      confidence *= (1 - timePenalty);
      flags.push(
        `TIME_ANOMALY: ${interaction.responseTimeSeconds.toFixed(1)}s ` +
        `(penalty: ${(timePenalty * 100).toFixed(0)}%)`
      );
    }

    // ═══════════════════════════════════════════════════════════
    // HEURÍSTICA 3: Performance-Difficulty Gap (History-Aware)
    // ═══════════════════════════════════════════════════════════
    const gapPenalty = this.computeGapPenalty(interaction, studentModel);
    
    if (gapPenalty > 0.05) {
      confidence *= (1 - gapPenalty);
      flags.push(
        `PERFORMANCE_GAP: Unexpectedly correct given mastery ` +
        `(penalty: ${(gapPenalty * 100).toFixed(0)}%)`
      );
    }

    // ═══════════════════════════════════════════════════════════
    // HEURÍSTICA 4: Streak Probability (Bayesian)
    // ═══════════════════════════════════════════════════════════
    const streakPenalty = this.computeStreakPenalty(interaction, studentModel);
    
    if (streakPenalty > 0.05) {
      confidence *= (1 - streakPenalty);
      const streak = this.getStreak(interaction.conceptId);
      flags.push(
        `IMPROBABLE_STREAK: ${streak} consecutive ` +
        `(penalty: ${(streakPenalty * 100).toFixed(0)}%)`
      );
    }

    // ═══════════════════════════════════════════════════════════
    // ADJUSTMENT: Prior Reliability (Bayesian Prior)
    // ═══════════════════════════════════════════════════════════
    if (studentModel.reliability < 0.5) {
      const priorPenalty = (0.5 - studentModel.reliability) * 0.3; // Max 15% penalty
      confidence *= (1 - priorPenalty);
      flags.push(
        `LOW_PRIOR_RELIABILITY: ${(studentModel.reliability * 100).toFixed(0)}%`
      );
    }

    // ═══════════════════════════════════════════════════════════
    // FINAL SCORE AND DECISION
    // ═══════════════════════════════════════════════════════════
    const score = this.clamp(confidence, 0, 1);

    // CRITICAL: Only block in extreme cases
    const blockUpdate = score < 0.05; // Only <5% confidence blocks
    const reliable = score >= 0.5; // 50% threshold for "reliable" label

    this.recordInteraction(interaction);

    return {
      reliable,
      score,
      flags,
      blockUpdate,
    };
  }

  /**
   * HEURISTIC 2 REDESIGN: Probabilistic Time Penalty
   * * Returns penalty ∈ [0, 1] based on deviation from expected distribution
   */
  private computeTimePenalty(interaction: InteractionData): number {
    const time = interaction.responseTimeSeconds;
    
    // Usem el model d'Habilitat vs Dificultat per al temps esperat
    // No podem usar valors fixos (8 o 12) perquè castiguem al geni.
    const expectedTime = 5.0; // Valor base, millor si és dinàmic
    const zScore = (expectedTime - time) / 2;

    // Si és més lent del que s'espera, no hi ha penalització
    if (zScore <= 0) {
      return 0;
    }

    // Calculem la penalització
    const penalty = 1 / (1 + Math.exp(-2 * (zScore - 1.5)));

    // Retornem el valor final sempre
    return this.clamp(penalty, 0, 0.7);
  }

  /**
   * HEURISTIC 3 REDESIGN: History-Aware Gap Penalty
   * * Penalizes success when mastery is low RELATIVE to difficulty
   * BUT: reduces penalty for new students (sparse history)
   */
  private computeGapPenalty(
    interaction: InteractionData,
    studentModel: StudentModel
  ): number {
    if (!interaction.correct) return 0; // Only penalize unexpected success

    const conceptNode = this.conceptGraph[interaction.conceptId];
    if (!conceptNode) return 0;

    const currentMastery = this.getPriorPerformance(studentModel, interaction);
    const difficulty = conceptNode.difficulty;

    // Expected success probability
    const expectedProb = this.clamp(currentMastery / difficulty, 0, 1);

    // Gap: how much more successful than expected
    const gap = 1.0 - expectedProb; // If expectedProb=0.2, gap=0.8

    // History length adjustment: new students get leniency
    const historyLength = studentModel.areas[interaction.area]
      .competences.calculation_specific.attempts || 1;
    
    const historyFactor = Math.min(historyLength / 20, 1.0); // Full penalty at 20+ attempts

    // Penalty only if gap is large AND student is experienced
    const basePenalty = gap > 0.5 ? (gap - 0.5) * 2 : 0; // Only penalize gap > 50%
    const adjustedPenalty = basePenalty * historyFactor;

    return this.clamp(adjustedPenalty, 0, 0.6);
  }

  /**
   * HEURISTIC 4 REDESIGN: Bayesian Streak Penalty
   * * Computes P(streak | mastery) using binomial probability
   */
  private computeStreakPenalty(
    interaction: InteractionData,
    studentModel: StudentModel
  ): number {
    if (!interaction.correct) return 0;

    const streak = this.getStreak(interaction.conceptId);
    if (streak < 5) return 0; // Short streaks are normal

    const currentMastery = this.getPriorPerformance(studentModel, interaction);

    // Binomial probability: P(k successes in n trials)
    // Approximate: if mastery=0.3, P(10 consecutive) ≈ 0.3^10 ≈ 0.000006
    const streakProb = Math.pow(currentMastery, streak);

    // Convert probability to penalty (logarithmic scale)
    // Very low probability → high penalty
    const penalty = streakProb < 0.01 ? -Math.log10(streakProb) / 10 : 0;

    return this.clamp(penalty, 0, 0.5);
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════

  private getPriorPerformance(
    studentModel: StudentModel, 
    interaction: InteractionData
  ): number {
    const area = studentModel.areas[interaction.area];
    
    // 1. Si l'àrea no existeix, retornem un valor base immediatament
    if (!area) return 0.1;

    const { competences } = area;

    // 2. Comprovació de competències procedimentals
    if (interaction.competence === "calculation_specific") {
      return competences.calculation_specific.performance;
    }
    
    if (interaction.competence === "problem_solving_specific") {
      return competences.problem_solving_specific.performance;
    }

    // 3. Comprovació de competències conceptuals
    const conceptualComp = competences.conceptual[interaction.competence];
    if (conceptualComp) {
      return conceptualComp.performance;
    }

    // 4. EL RETORN FINAL (Obligatori per TypeScript)
    // Si no ha entrat en cap dels casos anteriors, retornem un "sòl" de coneixement.
    return 0.1; 
  }

  /**
   * UTILITY: Get current streak for concept
   * Versió 100% segura contra undefined i índexs fora de rang.
   */
  private getStreak(conceptId: string): number {
    // 1. Obtenim l'historial o un array buit si no n'hi ha
    const interactions = this.history.get(conceptId) || [];
    
    let streak = 0;

    // 2. Recorrem de l'últim cap enrere
    for (let i = interactions.length - 1; i >= 0; i--) {
      const entry = interactions[i];

      // 🛡️ El fix: Comprovem explícitament que 'entry' existeixi i que 'correct' sigui true
      if (entry?.correct === true) {
        streak++;
      } else {
        // Tan bon punt trobem un error (false) o un buit (undefined), parem
        break;
      }
    }

    return streak;
  }

  private recordInteraction(interaction: InteractionData): void {
    const key = interaction.conceptId;
    
    if (!this.history.has(key)) {
      this.history.set(key, []);
    }

    const record: InteractionHistory = {
      conceptId: interaction.conceptId,
      correct: interaction.correct,
      timestamp: interaction.timestamp,
    };

    // 🛡️ Ens assegurem de fer el push d'un objecte real
    const currentHistory = this.history.get(key);
    if (currentHistory) {
      currentHistory.push(record);

      // Mantenim només les últimes 20 per no saturar la memòria
      if (currentHistory.length > 20) {
        currentHistory.shift();
      }
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  public updateConfig(newConfig: Partial<IntegrityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public clearHistory(): void {
    this.history.clear();
  }
}

export function createIntegrityEngine(
  conceptGraph: ConceptGraph,
  customConfig?: Partial<IntegrityConfig>
): IntegrityEngine {
  const defaultConfig: IntegrityConfig = {
    fastResponseThreshold: 2.0,
    jumpThreshold: 0.3,
    streakThreshold: 8,
    consistencyThreshold: 0.3,
    blockThreshold: 0.05, // Changed: only extreme cases
    reliabilityPenalty: 0.3, // Changed: reduced from 0.8
  };

  const config = { ...defaultConfig, ...customConfig };
  return new IntegrityEngine(config, conceptGraph);
}