/*src/decisionEngine/DecisionEngine.ts*//**
 * DECISION ENGINE V2 (Hierarchical & Contextual)
 * Motor adaptat al model d'àrees i competències.
 * Inclou lògica d'avançament per graf per generar Decision Drift en simulacions.
 */

import type {
  DecisionEngineConfig,
  DecisionEngineInput,
  PedagogicalDecision,
} from "./types";
import type { InteractionType } from "../pedagogy/interactions/types";
import type { StudentModel, Competence } from "../studentModel/types";
import { getInteractionPolicy } from "../pedagogy/interactions/InteractionPolicy";

export class DecisionEngine {
  private config: DecisionEngineConfig;

  constructor(config: DecisionEngineConfig) {
    this.config = config;
  }

  /**
   * MÈTODE PRINCIPAL: Decidir acció pedagògica amb context
   */
  public decide(input: DecisionEngineInput): PedagogicalDecision;
  public decide(input: DecisionEngineInput, interactionType: InteractionType): PedagogicalDecision;
  public decide(
    input: DecisionEngineInput,
    interactionType: InteractionType = "practice"
  ): PedagogicalDecision {
    const {
      currentConceptId,
      studentModel,
      conceptGraph,
      lastPerformanceScore,
      currentTime,
      lastEvocationScore = 0.5 // 👈 Valor per defecte si no ve informat
    } = input;

    // 🔍 BUSCADOR JERÀRQUIC
    const competence = this.findCompetence(studentModel, currentConceptId);
    const conceptNode = conceptGraph[currentConceptId];

    if (!competence || !conceptNode) {
      return {
        decision: "scaffold_current",
        targetConceptId: currentConceptId,
        reasoning: `Competència/Concepte "${currentConceptId}" no localitzat. Aplicant scaffold preventiu.`,
        confidence: 0.5,
      };
    }

    // 🆕 LLINDARS CONTEXTUALS (InteractionPolicy)
    const policy = getInteractionPolicy();
    const { scaffoldThreshold, reduceThreshold } = policy.getThresholds(interactionType);

    // 🔍 HEURÍSTICA COMPLETA (Ordre de prioritat)

    // 1️⃣ Performance (Mastery) molt baixa → Remediar
    if (competence.performance < scaffoldThreshold) {
      return {
        decision: "remediate_current",
        targetConceptId: currentConceptId,
        reasoning: `Rendiment baix (${competence.performance.toFixed(2)} < ${scaffoldThreshold.toFixed(2)} [${interactionType}]). Cal reforç intensiu del concepte.`,
        confidence: 0.9,
      };
    }

    // 2️⃣ Performance (Mastery) alta → AVANÇAR O REDUIR SCAFFOLD
    // 🧠 CANVI CLAU PER AL DRIFT: Si el rendiment és alt, busquem si podem progressar al següent concepte.
    if (competence.performance > reduceThreshold) {
      const nextId = this.findNextConcept(currentConceptId, conceptGraph);
      
      if (nextId) {
        return {
          decision: "advance_to_next",
          targetConceptId: nextId,
          reasoning: `Rendiment alt (${competence.performance.toFixed(2)} > ${reduceThreshold.toFixed(2)}). L'alumne està llest per al següent concepte: ${nextId}.`,
          confidence: 0.95,
        };
      }

      return {
        decision: "reduce_scaffold_current",
        targetConceptId: currentConceptId,
        reasoning: `Rendiment alt (${competence.performance.toFixed(2)} > ${reduceThreshold.toFixed(2)}). No hi ha més nodes; reduïm suport.`,
        confidence: 0.85,
      };
    }

    // 3️⃣ Recuperació de memòria dèbil → Evocar prerequisit
    if (competence.retrievalStrength < this.config.retrievalThresholdLow) {
      const prerequisite = this.selectWeakestPrerequisite(
        conceptNode.prerequisites,
        studentModel
      );

      if (prerequisite) {
        return {
          decision: "evoke_prerequisite",
          targetConceptId: prerequisite,
          reasoning: `Evocació feble (${competence.retrievalStrength.toFixed(2)} < ${this.config.retrievalThresholdLow}). Reforcem base: "${prerequisite}".`,
          confidence: 0.8,
        };
      }
    }

    // 4️⃣ Estabilitat baixa → Revisió espaiada
    if (competence.stability < this.config.stabilityThresholdLow) {
      const timeSinceReview = currentTime - competence.lastReviewed;

      if (timeSinceReview > this.config.spacedReviewIntervalMs) {
        return {
          decision: "spaced_review",
          targetConceptId: currentConceptId,
          reasoning: `Estabilitat baixa (${competence.stability.toFixed(2)}). Toca revisió espaiada (fa ${this.formatDuration(timeSinceReview)}).`,
          confidence: 0.75,
        };
      }
    }

    // 5️⃣ Rendiment recent baix (RECUPERAT) → Scaffold
    if (lastPerformanceScore < 0.6) {
      return {
        decision: "scaffold_current",
        targetConceptId: currentConceptId,
        reasoning: `Rendiment d'últim intent baix (${lastPerformanceScore.toFixed(2)}). Proporcionem suport puntual addicional.`,
        confidence: 0.7,
      };
    }

    // 6️⃣ Per defecte → Scaffold moderat
    return {
      decision: "scaffold_current",
      targetConceptId: currentConceptId,
      reasoning: `Estat intermedi en context "${interactionType}". Consolidem aprenentatge amb scaffold estàndard.`,
      confidence: 0.6,
    };
  }

  /**
   * UTILITAT: Troba el següent concepte basat en els prerequisits del graf
   */
  private findNextConcept(currentId: string, graph: any): string | undefined {
    return Object.keys(graph).find(id => 
      graph[id].prerequisites.includes(currentId)
    );
  }

  /**
   * UTILITAT: Navega per la jerarquia per trobar una competència per ID
   */
  private findCompetence(model: StudentModel, id: string): Competence | undefined {
    for (const areaKey of Object.keys(model.areas) as (keyof typeof model.areas)[]) {
      const area = model.areas[areaKey];
      
      if (id === "calculation_specific") return area.competences.calculation_specific;
      if (id === "problem_solving_specific") return area.competences.problem_solving_specific;
      
      if (area.competences.conceptual[id]) return area.competences.conceptual[id];
    }
    return undefined;
  }

  /**
   * UTILITAT: Seleccionar prerequisit més feble
   */
  private selectWeakestPrerequisite(
    prerequisites: string[],
    model: StudentModel
  ): string | undefined {
    if (prerequisites.length === 0) return undefined;

    let weakest: string | undefined = undefined;
    let lowestPerf = 1.0;

    for (const prereqId of prerequisites) {
      const comp = this.findCompetence(model, prereqId);
      if (comp && comp.performance < lowestPerf) {
        lowestPerf = comp.performance;
        weakest = prereqId;
      }
    }

    return weakest;
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} dies`;
    if (hours > 0) return `${hours} hores`;
    return "menys d'una hora";
  }
}

/**
 * FACTORY (RESTAURADA): Crear instància amb configuració per defecte
 */
export function createDecisionEngine(
  customConfig?: Partial<DecisionEngineConfig>
): DecisionEngine {
  const defaultConfig: DecisionEngineConfig = {
    masteryThresholdHigh: 0.8,
    masteryThresholdLow: 0.3,
    retrievalThresholdLow: 0.4,
    stabilityThresholdLow: 0.5,
    spacedReviewIntervalMs: 86400000, // 24 hores
  };

  return new DecisionEngine({ ...defaultConfig, ...customConfig });
}