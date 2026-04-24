import { ExerciseEngine, type ExerciseType, type ExerciseGenerator } from "./ExerciseEngine";
import { FractionsGenerator } from "../domain/statistics/FractionGenerator";
import { StatisticsGenerator } from "../domain/statistics/StatisticsGenerator";
import { ThalesGenerator } from "../exercises/ThalesGenerator";
import { PythagorasGenerator } from "../exercises/PythagorasGenerator";
import { PrerequisiteGenerator } from "../exercises/PrerequisiteGenerator";

const registry = new Map<ExerciseType, ExerciseGenerator>(); // Nota: Usem string com a clau per flexibilitat

// 1. Fraccions
registry.set("fractions", new FractionsGenerator());

// 2. Estadística: Registrem les diferents variants com si fossin "tipus" per al frontend
// Això permet fer engine.generate("statistics_central") o engine.generate("statistics_normal")
registry.set("statistics", new StatisticsGenerator("central_tendency")); // Default
registry.set("statistics_frequencies", new StatisticsGenerator("frequency_table"));
registry.set("statistics_dispersion", new StatisticsGenerator("dispersion"));
registry.set("statistics_normal", new StatisticsGenerator("normal_distribution"));
registry.set("statistics_conceptual", new StatisticsGenerator("conceptual"));

registry.set("thales", new ThalesGenerator());
registry.set("pythagoras", new PythagorasGenerator());
registry.set("prerequisite", new PrerequisiteGenerator());

export const engine = new ExerciseEngine(registry as any, Math.random);