/* src/core/compas/RetrievalScheduler.ts */
import type { ConceptGraph } from "../conceptGraph/types";
import type { StudentModel } from "../../studentModel/types";

export interface RetrievalConfig {
  interval: number;
  masteryThreshold: number;
  usePrerequisites: boolean;
  timeThresholdMs: number;
  debugMode?: boolean;
}

export interface RetrievalDecision {
  shouldTrigger: boolean;
  conceptToRetrieve: string;
  reason: string;
  triggerType: "INTERVAL" | "MASTERY" | "TIME" | "NONE";
}

export class RetrievalScheduler {
  // 🛡️ DECLARACIÓ EXPLÍCITA (Obligatòria per 'erasableSyntaxOnly')
  private config: RetrievalConfig;
  private conceptGraph: ConceptGraph;
  private lastMasteryTriggerIteration: number = -1;
  private readonly MASTERY_COOLDOWN: number = 3; 

  constructor(config: RetrievalConfig, conceptGraph: ConceptGraph) {
    this.config = config;
    this.conceptGraph = conceptGraph;
  }

  /**
   * Avalua si cal bloquejar l'usuari abans de començar un exercici.
   */
  public shouldBlockForEvocation(student: StudentModel, currentConceptId: string): RetrievalDecision {
    const metrics = student.global;
    const now = Date.now();
    const currentIteration = metrics.attempts || 0;

    // 1. TRIGGER TEMPORAL
    if (!metrics.lastEvocationTimestamp) {
      return this.createDecision(true, "TIME", currentConceptId, "Inici de sessió (evocació inicial).", student);
    }
    if (now - metrics.lastEvocationTimestamp > this.config.timeThresholdMs) {
      return this.createDecision(true, "TIME", currentConceptId, "Temps de refresc cognitiu excedit.", student);
    }

    // 2. TRIGGER D'INTERVAL
    const exercisesSince = metrics.exercisesSinceLastEvocation || 0;
    if (exercisesSince >= this.config.interval) {
      return this.createDecision(true, "INTERVAL", currentConceptId, `S'ha assolit el límit de ${this.config.interval} exercicis.`, student);
    }

    // 3. TRIGGER DE MASTERY (Amb Cooldown)
    const masteryMap = this.extractMasteryMap(student);
    const currentMastery = masteryMap[currentConceptId] ?? 0;
    const iterationsSinceLastMasteryTrigger = currentIteration - this.lastMasteryTriggerIteration;

    if (currentMastery < this.config.masteryThreshold && iterationsSinceLastMasteryTrigger >= this.MASTERY_COOLDOWN) {
      this.lastMasteryTriggerIteration = currentIteration;
      return this.createDecision(true, "MASTERY", currentConceptId, `Alerta de domini baix (${(currentMastery * 100).toFixed(0)}%).`, student);
    }

    return { shouldTrigger: false, conceptToRetrieve: currentConceptId, reason: "Flux estable", triggerType: "NONE" };
  }

  private selectConceptToRetrieve(currentConceptId: string, student: StudentModel): string {
    if (!this.config.usePrerequisites) return currentConceptId;

    const node = this.conceptGraph[currentConceptId];

    // Guard: no node or no prerequisites
    if (!node || !node.prerequisites || node.prerequisites.length === 0) {
      return currentConceptId;
    }

    // Filter to exercisable prerequisites only (difficulty >= 2 and present in graph).
    // This prevents foundational helper concepts like "counting", "sum", "ordering"
    // (difficulty 1, never directly exercised) from being selected as evocation targets.
    const exercisablePrereqs = node.prerequisites.filter(prId => {
      const prereqNode = this.conceptGraph[prId];
      return prereqNode && prereqNode.difficulty >= 2;
    });

    // If no prerequisites pass the filter, evoke the current concept directly
    if (exercisablePrereqs.length === 0) return currentConceptId;

    const masteryMap = this.extractMasteryMap(student);

    let weakestPrerequisite: string = exercisablePrereqs[0] ?? currentConceptId;
    let minMastery = masteryMap[weakestPrerequisite] ?? 0;

    for (const prId of exercisablePrereqs) {
      if (!prId) continue;
      const currentMastery = masteryMap[prId] ?? 0;
      if (currentMastery < minMastery) {
        minMastery = currentMastery;
        weakestPrerequisite = prId;
      }
    }

    return weakestPrerequisite;
  }

  private createDecision(shouldTrigger: boolean, type: RetrievalDecision["triggerType"], currentId: string, baseReason: string, student: StudentModel): RetrievalDecision {
    const targetConcept = this.selectConceptToRetrieve(currentId, student);
    const name = targetIdToName(targetConcept);
    const reason = targetConcept === currentId 
      ? `${baseReason} Reforç: ${name}.`
      : `${baseReason} Evocació prerequisit: ${name}.`;

    return { shouldTrigger, triggerType: type, conceptToRetrieve: targetConcept, reason };
  }

  private extractMasteryMap(student: StudentModel): Record<string, number> {
    const map: Record<string, number> = {};
    Object.values(student.areas).forEach(area => {
      Object.entries(area.competences.conceptual).forEach(([id, comp]) => {
        map[id] = comp.performance;
      });
    });
    return map;
  }

  public registerSuccessfulEvocation(student: StudentModel): StudentModel {
    const updated = JSON.parse(JSON.stringify(student));
    updated.global.lastEvocationTimestamp = Date.now();
    updated.global.exercisesSinceLastEvocation = 0;
    return updated;
  }

  public incrementExerciseCount(student: StudentModel): StudentModel {
    const updated = JSON.parse(JSON.stringify(student));
    updated.global.exercisesSinceLastEvocation = (updated.global.exercisesSinceLastEvocation || 0) + 1;
    return updated;
  }
}

// Helpers
function targetIdToName(id: string): string {
  const names: Record<string, string> = { "mean": "mitjana", "frequency_absolute": "freqüència absoluta" };
  return names[id] || id;
}

export function createRetrievalScheduler(graph: ConceptGraph, customConfig?: Partial<RetrievalConfig>): RetrievalScheduler {
  const defaults: RetrievalConfig = {
    interval: 3,
    masteryThreshold: 0.5,
    usePrerequisites: true,
    timeThresholdMs: 1000 * 60 * 60 * 4,
    debugMode: true
  };
  return new RetrievalScheduler({ ...defaults, ...customConfig }, graph);
}