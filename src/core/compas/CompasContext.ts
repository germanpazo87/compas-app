/* src/core/compas/CompasContext.ts */
import { statisticsConceptGraph } from "../../pedagogy/conceptGraph/statistics";
import { createIntegrityEngine } from "../../pedagogy/integrity/IntegrityEngine";
import { createDecisionEngine } from "../../decisionEngine/DecisionEngine";
// Importem la instància des del fitxer on l'hem creat (Pas anterior) o la creem aquí
import { createRetrievalScheduler } from "../../pedagogy/retrieval/RetrievalScheduler"; 

// 🆕 IMPORTS PER AL MOTOR D'EXERCICIS
import { ExerciseEngine } from "../ExerciseEngine";
import { StatisticsGenerator } from "../../domain/statistics/StatisticsGenerator";

// 1️⃣ GRAF DE CONCEPTES (La base de coneixement estàtica)
export const graph = statisticsConceptGraph;

/**
 * 2️⃣ CONFIGURACIÓ DEL MOTOR D'EXERCICIS
 */
const exerciseRegistry = new Map();
exerciseRegistry.set("statistics", new StatisticsGenerator());
// Aquí pots afegir fraccions, etc.

export const exerciseEngine = new ExerciseEngine(exerciseRegistry, Math.random);

/**
 * 3️⃣ MOTORS PEDAGÒGICS (STATELESS)
 * Aquests motors són "funcions pures" o serveis. No guarden dades.
 * Reben l'alumne, processen i retornen decisions.
 */

// Motor d'Integritat (Detecta focus, velocitat...)
export const integrityEngine = createIntegrityEngine(graph);

// Motor de Decisions (Decideix estratègia: Scaffolding, Remediate...)
export const decisionEngine = createDecisionEngine();

// Motor d'Evocació (El Porter)
// Creem la instància aquí per evitar dependències circulars
export const retrievalScheduler = createRetrievalScheduler(graph, {
  interval: 3,                 // Cada 3 exercicis
  masteryThreshold: 0.4,       // O si el domini és baix
  usePrerequisites: true,      // Mirem enrere
  timeThresholdMs: 1000 * 60 * 60 * 4, // 4 hores
  debugMode: true
});

// 🗑️ ELIMINAT: export const currentStudent = ... 
// (Les dades reals venen de Firebase a través de l'AppShell -> ExerciseContainer)