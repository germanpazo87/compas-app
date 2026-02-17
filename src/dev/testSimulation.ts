import { SimulatorRunner } from "./studentSimulator/simulationRunner";
import { ProfileType } from "./studentSimulator/ProfileFactory";
import { createDecisionEngine } from "../decisionEngine/DecisionEngine";
import { createIntegrityEngine } from "../pedagogy/integrity/IntegrityEngine";
import type { ConceptGraph } from "../pedagogy/conceptGraph/types";

/**
 * 📊 CONFIGURACIÓ DE L'EXPERIMENT
 */
const ITERATIONS_PER_PROFILE = 100;

// 1. Creem un graf de conceptes de prova amb diferents dificultats
// 1. Creem un graf de conceptes de prova amb un "Type Assertion" per evitar errors de tipus
const mockGraph = {
  "level_1": { id: "level_1", difficulty: 1, prerequisites: [] },
  "level_2": { id: "level_2", difficulty: 2, prerequisites: ["level_1"] },
  "level_3": { id: "level_3", difficulty: 3, prerequisites: ["level_2"] },
  "level_4": { id: "level_4", difficulty: 4, prerequisites: ["level_3"] },
  "level_5": { id: "level_5", difficulty: 5, prerequisites: ["level_4"] },
} as unknown as ConceptGraph;

// 2. Instanciem els motors reals del sistema
const decisionEngine = createDecisionEngine();
const integrityEngine = createIntegrityEngine(mockGraph);
const runner = new SimulatorRunner(mockGraph, decisionEngine, integrityEngine);

/**
 * 🚀 FUNCIÓ PRINCIPAL D'EXECUCIÓ
 */
async function runFullTFMExperiment() {
  console.log("====================================================");
  console.log("🔬 SISTEMA D'INTEGRITAT PEDAGÒGICA - EXPERIMENTS");
  console.log(`📊 Iteracions per perfil: ${ITERATIONS_PER_PROFILE}`);
  console.log("====================================================\n");

  const allProfiles = Object.values(ProfileType);
  const summaryResults: any[] = [];

  for (const type of allProfiles) {
    // Hem canviat el process.stdout.write per un console.log simple
    console.log(`🧪 Simulant perfil: ${type}...`);
    
    try {
      const result = await runner.runExperiment(type, ITERATIONS_PER_PROFILE);
      
      summaryResults.push({
        Profile: type,
        "MAE (No Integrity)": result.metrics.conditionA.MAE,
        "MAE (With Integrity)": result.metrics.conditionB.MAE,
        "Improvement %": calculateImprovement(result.metrics.conditionA.MAE, result.metrics.conditionB.MAE),
        "Mean Integrity": result.metrics.conditionB.meanIntegrityScore,
        "Decision Drift": result.metrics.comparison.decisionDrift
      });
      
    } catch (error) {
      console.error(`❌ Error en el perfil ${type}:`, error);
    }
  }

  // 3. Imprimim la gran taula de resultats
  console.log("\n📊 RESULTATS COMPARATIUS (Fase B vs Fase A)");
  console.table(summaryResults);

  console.log("\n💡 INTERPRETACIÓ:");
  console.log("- MAE: Error del model (més baix = millor precision).");
  console.log("- Improvement %: Reducció de l'error gràcies a l'IntegrityEngine.");
  console.log("- Decision Drift: Diferència en la ruta pedagògica seguida.\n");
}

/**
 * Utilitat per calcular el percentatge de millora del MAE
 */
function calculateImprovement(oldMAE: string, newMAE: string): string {
  const v1 = parseFloat(oldMAE);
  const v2 = parseFloat(newMAE);
  if (v1 === 0) return "0%";
  const imp = ((v1 - v2) / v1) * 100;
  return `${imp.toFixed(1)}%`;
}

// Execució del script
runFullTFMExperiment().catch(console.error);