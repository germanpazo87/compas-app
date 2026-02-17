import type { StudentModel } from "../../studentModel/types";
import { DecisionEngine } from "../../decisionEngine/DecisionEngine";
import { updateStudentState } from "../../studentModel/studentModelUpdater";
import { IntegrityEngine } from "../../pedagogy/integrity/IntegrityEngine";
import type { ConceptGraph } from "../../pedagogy/conceptGraph/types";
import { ProfileFactory, ProfileType } from "./ProfileFactory";
import * as Metrics from "./Metrics";

/**
 * RESULTATS D'UNA INTERACCIÓ INDIVIDUAL
 */
interface InteractionLog {
  t: number;
  conceptId: string;
  difficulty: number;
  correct: boolean;
  responseTime: number;
  integrityScore: number;
  mastery: number;
  realAbility: number;
}

export class SimulatorRunner {
  private graph: ConceptGraph;
  private engine: DecisionEngine;
  private integrity: IntegrityEngine;

  constructor(graph: ConceptGraph, engine: DecisionEngine, integrity: IntegrityEngine) {
    this.graph = graph;
    this.engine = engine;
    this.integrity = integrity;
  }

  /**
   * EXECUTA L'EXPERIMENT A/B PER A UN PERFIL
   */
  public async runExperiment(profileType: ProfileType, iterations: number = 100) {
    const profile = ProfileFactory.createProfile(profileType);

    // Creem dos models idèntics per començar
    const modelA = this.createNewModel();
    const modelB = this.createNewModel();

    // Executem les dues condicions
    const logsA = this.simulate(profile, modelA, iterations, false); // Condició A: Sense Integritat
    const logsB = this.simulate(profile, modelB, iterations, true);  // Condició B: Amb Integritat

    return {
      profile: profileType,
      metrics: {
        conditionA: this.calculateSummary(logsA),
        conditionB: this.calculateSummary(logsB),
        comparison: {
          decisionDrift: Metrics.computeDecisionDrift(logsA, logsB)
        }
      },
      rawLogs: { logsA, logsB }
    };
  }

  /**
   * BUCLE PRINCIPAL DE SIMULACIÓ
   */
private simulate(
    profile: any, 
    model: StudentModel, 
    iterations: number, 
    useIntegrity: boolean
  ): InteractionLog[] {
    const logs: InteractionLog[] = [];
    
    // 🧠 Variable d'estat per mantenir el concepte a través de les iteracions
    let currentConceptId = "level_1"; 

    for (let t = 0; t < iterations; t++) {
      // 1. El DecisionEngine rep el concepte actual i tria la següent acció
      const decision = this.engine.decide({
        currentConceptId: currentConceptId,
        studentModel: model,
        conceptGraph: this.graph,
        lastPerformanceScore: logs[t - 1]?.correct ? 1.0 : 0.0,
        currentTime: Date.now(),
        config: (this.engine as any).config 
      });

      // 🚀 ACTUALITZEM EL CONCEPTE: Si el motor diu d'avançar, el currentConceptId canvia
      currentConceptId = decision.targetConceptId || currentConceptId;

      const difficulty = this.graph[currentConceptId]?.difficulty || 1;
      
      // 2. L'alumne virtual respon
      const realAbility = profile.getRealAbility(t);
      const prob = profile.getProbabilityCorrect(difficulty, t);
      const correct = Math.random() < prob;
      const responseTime = profile.getResponseTime(difficulty, correct, t);

      let integrityScore = 1.0;
      let blockUpdate = false;

      // 3. Integritat
      if (useIntegrity) {
        const result = this.integrity.evaluate({
          conceptId: currentConceptId, // 👈 Usem el concepte actual real
          area: "arithmetic",
          competence: "calculation_specific",
          correct,
          responseTimeSeconds: responseTime,
          timestamp: Date.now()
        }, model);
        
        integrityScore = result.score;
        blockUpdate = result.blockUpdate;
      }

      // 4. ACTUALITZACIÓ CLAU: 
      // Hem d'actualitzar el Mastery del CONCEPTE ACTUAL (level_1, level_2...)
      // perquè el DecisionEngine el pugui veure a la següent iteració.
      if (!blockUpdate) {
        updateStudentState(
          model, 
          "arithmetic", 
          currentConceptId, // 👈 ABANS POSAVA "calculation_specific". AIXÒ ERA L'ERROR!
          correct, 
          integrityScore
        );
      }

      // 5. Enregistrem (Usem el mastery de l'àrea o del concepte per al log)
      const currentComp = (this.engine as any).findCompetence(model, currentConceptId);
      
      logs.push({
        t,
        conceptId: currentConceptId,
        difficulty,
        correct,
        responseTime,
        integrityScore,
        mastery: currentComp?.performance || 0,
        realAbility
      });
    }

    return logs;
  }

  /**
   * RESUM DE MÈTRIQUES
   */
  private calculateSummary(logs: InteractionLog[]) {
    const last = logs.at(-1);

    if (!last) {
      return {
        finalMastery: "0.000",
        finalRealAbility: "0.000",
        MAE: "0.0000",
        inflationIndex: "0.0000",
        meanIntegrityScore: "0.00"
      };
    }

    const avgIntegrity = logs.reduce((acc, l) => acc + l.integrityScore, 0) / logs.length;

    return {
      finalMastery: last.mastery.toFixed(3),
      finalRealAbility: last.realAbility.toFixed(3),
      MAE: Metrics.computeMAE(logs).toFixed(4),
      inflationIndex: Metrics.computeInflationIndex(logs).toFixed(4),
      meanIntegrityScore: avgIntegrity.toFixed(2)
    };
  }

  /**
   * FACTORY INTERNA: Genera un model d'estudiant buit
   */
  private createNewModel(): StudentModel {
    const emptyComp = () => ({
      performance: 0,
      medal: false,
      retrievalStrength: 0,
      stability: 0,
      lastReviewed: 0,
      attempts: 0 // 👈 Afegit per complir amb la nova interfície
    });

    return {
      global: {
        calculation_global: emptyComp(),
        problem_solving_global: emptyComp()
      },
      areas: {
        arithmetic: {
          mastery: false,
          competences: {
            calculation_specific: emptyComp(),
            problem_solving_specific: emptyComp(),
            conceptual: {}
          }
        },
        statistics: { mastery: false, competences: { calculation_specific: emptyComp(), problem_solving_specific: emptyComp(), conceptual: {} } },
        algebra: { mastery: false, competences: { calculation_specific: emptyComp(), problem_solving_specific: emptyComp(), conceptual: {} } }
      },
      reliability: 1.0
    };
  }
}