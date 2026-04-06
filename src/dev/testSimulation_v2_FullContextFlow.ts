/**
 * ============================================================
 * TEST SIMULATION V2 — FULL CONTEXT FLOW
 * ============================================================
 * 
 * Objectiu:
 * Validar comportament contextual del sistema pedagògic.
 * 
 * Demostra:
 * 1️⃣ Mateix mastery → decisions diferents segons InteractionType
 * 2️⃣ Mateix encert → pesos d’actualització diferents
 * 3️⃣ Traçabilitat explícita de thresholds i weights utilitzats
 * 
 * Aquest fitxer NO forma part del runtime principal.
 * És un banc de proves científic per validació del model.
 * ============================================================
 */

import { createDecisionEngine } from "../decisionEngine/DecisionEngine";
import { updateMastery, createInitialConceptState } from "../studentModel/types";
import { unifiedConceptGraph } from "../pedagogy/conceptGraph";
import { getInteractionPolicy } from "../pedagogy/interactions/InteractionPolicy";

import type { StudentModel } from "../studentModel/types";
import type { InteractionType } from "../pedagogy/interactions/types";


// ============================================================
// SETUP
// ============================================================

const decisionEngine = createDecisionEngine();
const interactionPolicy = getInteractionPolicy();

const contexts: InteractionType[] = [
  "practice",
  "retrieval",
  "remedial",
  "assessment",
];

// ============================================================
// EXPERIMENT 1 — CONTEXTUAL DECISION DIFFERENTIATION
// ============================================================

function runDecisionExperiment() {
  console.log("\n==================================================");
  console.log("EXPERIMENT 1 — Contextual Decision Differentiation");
  console.log("==================================================\n");

  const testMastery = 0.52;
  const studentModel: StudentModel = {
    frequency_relative: {
      ...createInitialConceptState("frequency_relative"),
      mastery: testMastery
    },
  };

  console.log(`Base mastery: ${testMastery}\n`);

  for (const context of contexts) {
    const thresholds = interactionPolicy.getThresholds(context);

    const decision = decisionEngine.decide(
      {
        currentConceptId: "frequency_relative",
        studentModel,
        conceptGraph: unifiedConceptGraph,
        lastPerformanceScore: 0.6,
        currentTime: Date.now(),
        // 🛡️ BUG FIX: Cal passar la config del motor
        config: (decisionEngine as any).config, 
      },
      context
    );

    console.log(`Context: ${context}`);
    // 🛡️ BUG FIX: Propietats correctes de InteractionThresholds
    console.log(`  Thresholds: Scaffold < ${thresholds.scaffoldThreshold} | Reduce > ${thresholds.reduceThreshold}`);
    console.log(`  Decision: ${decision.decision}`);
    console.log(`  Reasoning: ${decision.reasoning}`);
    console.log("--------------------------------------------------");
  }
}

// ============================================================
// EXPERIMENT 2 — CONTEXTUAL MASTERY UPDATE WEIGHTS
// ============================================================

function runUpdateExperiment() {
  console.log("\n==================================================");
  console.log("EXPERIMENT 2 — Contextual Mastery Update Weights");
  console.log("==================================================\n");

  const initialMastery = 0.4;
  const correct = true;

  console.log(`Initial mastery: ${initialMastery}`);
  console.log(`Performance: correct = ${correct}\n`);

  for (const context of contexts) {
    const testModel: StudentModel = {
      test_concept: {
        ...createInitialConceptState("test_concept"),
        mastery: initialMastery,
      },
    };

    // 🛡️ BUG FIX: Nom del mètode correcte
    const weights = interactionPolicy.getWeights(context);

    updateMastery(testModel, "test_concept", correct, context);

    const finalMastery = testModel.test_concept!.mastery;
    const delta = finalMastery - initialMastery;

    console.log(`Context: ${context}`);
    // 🛡️ BUG FIX: Propietat correcta masteryWeight
    console.log(`  Weight applied: ${weights.masteryWeight}`);
    console.log(`  Δ Mastery: +${delta.toFixed(4)}`);
    console.log(`  Final mastery: ${finalMastery.toFixed(4)}`);
    console.log("--------------------------------------------------");
  }
}

function runFullSimulation() {
  console.log("\n🧪 STARTING TEST SIMULATION V2 — FULL CONTEXT FLOW\n");
  runDecisionExperiment();
  runUpdateExperiment();
  console.log("\n✅ SIMULATION COMPLETE\n");
}

runFullSimulation();