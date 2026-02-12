/**
 * FREQUENCY TABLE GENERATOR
 * Generador de datasets per exercicis de Taula de Freqüències.
 * Funció pura sense dependències externes.
 */

import type { VariableType } from "../../types/OracleContext";

/**
 * Dataset generat amb dades computades
 */
export interface GeneratedFrequencyTable {
  variableName: string;
  variableType: VariableType;
  rawData: string[]; // Dades originals (15-30 valors)
  categories: string[]; // xi úniques ordenades
  frequencies: Record<string, number>; // fi calculades
  N: number; // Total observacions
}

/**
 * Configuració per generació
 */
interface GeneratorConfig {
  type: VariableType;
  minValues?: number; // Default: 15
  maxValues?: number; // Default: 30
}

/**
 * Catàlegs de variables predefinides
 */
const QUALITATIVE_VARIABLES = [
  { name: "Color preferit", categories: ["Vermell", "Blau", "Verd", "Groc", "Taronja"] },
  { name: "Esport practicat", categories: ["Futbol", "Bàsquet", "Natació", "Tennis", "Atletisme"] },
  { name: "Tipus de transport", categories: ["Cotxe", "Bus", "Metro", "Bicicleta", "A peu"] },
  { name: "Gènere musical", categories: ["Pop", "Rock", "Clàssica", "Electrònica", "Jazz"] },
];

const QUANTITATIVE_VARIABLES = [
  { name: "Nombre de germà/na", categories: [0, 1, 2, 3, 4] },
  { name: "Hores d'estudi setmanal", categories: [0, 1, 2, 3, 4, 5, 6] },
  { name: "Llibres llegits al mes", categories: [0, 1, 2, 3, 4, 5] },
  { name: "Dispositius electrònics a casa", categories: [1, 2, 3, 4, 5, 6] },
];

/**
 * GENERADOR PRINCIPAL
 * Crea un dataset aleatori amb freqüències realistes
 */
export function generateFrequencyTable(config: GeneratorConfig): GeneratedFrequencyTable {
  const { type, minValues = 15, maxValues = 30 } = config;

  // Selecciona variable segons tipus
  const variable = type === "qualitative"
    ? QUALITATIVE_VARIABLES[Math.floor(Math.random() * QUALITATIVE_VARIABLES.length)]
    : QUANTITATIVE_VARIABLES[Math.floor(Math.random() * QUANTITATIVE_VARIABLES.length)];

  // Determina N aleatori
  const N = Math.floor(Math.random() * (maxValues - minValues + 1)) + minValues;

  // Genera dades amb distribució realista (no uniforme)
  const rawData: string[] = [];
  const weights = generateRealisticWeights(variable.categories.length);

  for (let i = 0; i < N; i++) {
    const category = weightedRandomChoice(variable.categories as any[], weights);
    rawData.push(String(category));
  }

  // Calcula freqüències
  const frequencies: Record<string, number> = {};
  const categories = [...new Set(rawData)].sort((a, b) => {
    // Ordena numèricament si quantitativa
    if (type === "quantitative_discrete") {
      return Number(a) - Number(b);
    }
    // Ordena alfabèticament si qualitativa
    return a.localeCompare(b, "ca");
  });

  categories.forEach((cat) => {
    frequencies[cat] = rawData.filter((val) => val === cat).length;
  });

  return {
    variableName: variable.name,
    variableType: type,
    rawData,
    categories,
    frequencies,
    N,
  };
}

/**
 * Genera pesos realistes (algunes categories més probables que altres)
 */
function generateRealisticWeights(numCategories: number): number[] {
  const weights: number[] = [];
  let sum = 0;

  for (let i = 0; i < numCategories; i++) {
    const weight = Math.random() * 0.5 + 0.3; // Entre 0.3 i 0.8
    weights.push(weight);
    sum += weight;
  }

  // Normalitza a 1
  return weights.map((w) => w / sum);
}

/**
 * Tria element segons pesos
 */
function weightedRandomChoice<T>(items: T[], weights: number[]): T {
  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      return items[i];
    }
  }

  return items[items.length - 1]; // Fallback
}