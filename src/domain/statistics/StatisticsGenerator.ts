import {
  type ExerciseGenerator,
  type ExerciseInstance,
  type AnswerEvaluationResult,
  ExerciseErrorType,
  type RNG,
  type StatisticsLevel 
} from "../../core/ExerciseEngine";

import {
  type StatisticsSolution,
  type StatisticsMetadata,
  type StatisticsSubtype,
  VariableTypes,
  type FrequencyRow,
  type FrequencyTableSolution,
  type CentralTendencySolution,
  type DispersionSolution,
  type NormalDistributionSolution,
  type ConceptualSolution
} from "./types";

// ============================================================================
// 1. DOMAIN: PURE MATH & LOGIC
// ============================================================================

export class StatisticsDomain {
  
  static round(value: number, decimals: number = 4): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  static generateFrequencyTable(data: (number | string)[]): FrequencyRow[] {
    const counts = new Map<string | number, number>();
    const totalN = data.length;

    data.forEach(val => {
      counts.set(val, (counts.get(val) || 0) + 1);
    });

    const sortedKeys = Array.from(counts.keys()).sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b));
    });

    const rows: FrequencyRow[] = [];
    let accumulatedFi = 0;
    let accumulatedNi = 0;

    sortedKeys.forEach(key => {
      const fi = counts.get(key) || 0;
      const ni = fi / totalN;
      const pi = ni * 100;

      accumulatedFi += fi;
      accumulatedNi += ni;

      rows.push({
        value: key,
        fi: fi,
        ni: this.round(ni, 4),
        pi: this.round(pi, 2),
        Fi: accumulatedFi,
        Ni: this.round(Math.min(accumulatedNi, 1), 4)
      });
    });

    return rows;
  }

  static calculateTotals(rows: FrequencyRow[]) {
    return {
      fi: rows.reduce((acc, r) => acc + r.fi, 0),
      ni: 1,
      pi: 100
    };
  }

  static calculateMean(data: number[]): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length;
  }

  static calculateMedian(data: number[]): number {
    if (data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      const val1 = sorted[mid - 1] ?? 0;
      const val2 = sorted[mid] ?? 0;
      return (val1 + val2) / 2;
    }
    return sorted[mid] ?? 0;
  }

  static calculateMode(data: number[]): number[] {
    if (data.length === 0) return [];
    const counts = new Map<number, number>();
    let maxFreq = 0;

    data.forEach(val => {
      const freq = (counts.get(val) || 0) + 1;
      counts.set(val, freq);
      if (freq > maxFreq) maxFreq = freq;
    });

    const modes: number[] = [];
    counts.forEach((freq, val) => {
      if (freq === maxFreq) modes.push(val);
    });

    return modes.sort((a, b) => a - b);
  }

  static calculateRange(data: number[]): number {
    if (data.length === 0) return 0;
    const min = Math.min(...data);
    const max = Math.max(...data);
    return max - min;
  }

  static calculateVariance(data: number[], isPopulation: boolean): number {
    if (data.length < 2) return 0;
    const mean = this.calculateMean(data);
    const sumSquaredDiffs = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
    const divisor = isPopulation ? data.length : data.length - 1;
    return sumSquaredDiffs / divisor;
  }

  static calculateStdDev(variance: number): number {
    return Math.sqrt(variance);
  }
}

// ============================================================================
// 2. DOMAIN: NORMAL DISTRIBUTION
// ============================================================================

export class NormalDistributionDomain {
  
  private static erf(x: number): number {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }

  static calculateZScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }

  static cdf(x: number, mean: number, stdDev: number): number {
    return 0.5 * (1 + this.erf((x - mean) / (stdDev * Math.sqrt(2))));
  }
}

// ============================================================================
// 3. FACTORY (Generació d'Exercicis)
// ============================================================================

class StatisticsExerciseFactory {

  private static generateInt(rng: RNG, min: number, max: number): number {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  private static generateDataset(rng: RNG, size: number, min: number, max: number): number[] {
    const data: number[] = [];
    for (let i = 0; i < size; i++) {
      data.push(this.generateInt(rng, min, max));
    }
    return data;
  }

  /**
   * 🆕 NOU: Exercici de Mediana Pas a Pas (Sèrie Senar)
   * Aquest mètode permet crear exercicis "infinits" però amb estructura fixa.
   */
  static createMedianStepByStepExercise(rng: RNG): ExerciseInstance<StatisticsMetadata, any, StatisticsMetadata> {
    // Forcem mida senar per facilitar l'aprenentatge (5, 7, 9 o 11)
    const sizes = [5, 7, 9, 11];
    const sizeIndex = this.generateInt(rng, 0, sizes.length - 1);
    const size = sizes[sizeIndex] ?? 7; 
    
    // Generem dades aleatòries
    const dataSet = this.generateDataset(rng, size, 1, 30);
    const metadata: StatisticsMetadata = { level: "BASIC_CALC", rawData: dataSet, precision: 1, difficulty: 1 };
    
    // Pre-calculem la solució
    const sorted = [...dataSet].sort((a, b) => a - b);
    const medianVal = StatisticsDomain.calculateMedian(dataSet);

    return {
      id: `stats_med_step_${Date.now()}`,
      type: "statistics",
      prompt: `Calcula la mediana de la següent sèrie. Recorda que primer has d'ordenar les dades de menor a major.`,
      data: metadata,
      solution: {
        subtype: "median_step_by_step",
        sortedSeries: sorted,
        median: medianVal
      },
      metadata: metadata
    };
  }

  static createFrequencyExercise(rng: RNG): ExerciseInstance<StatisticsMetadata, FrequencyTableSolution, StatisticsMetadata> {
    const size = this.generateInt(rng, 10, 20);
    const dataSet = this.generateDataset(rng, size, 1, 5); 
    const rows = StatisticsDomain.generateFrequencyTable(dataSet);
    
    const metadata: StatisticsMetadata = { level: "FREQ_TABLE", rawData: dataSet, precision: 4, difficulty: 2 };

    const solution: any = {
      subtype: "frequency_table",
      variableType: VariableTypes.QUANTITATIVE_DISCRETE,
      rows: rows,
      totals: StatisticsDomain.calculateTotals(rows),
      totalN: size
    };

    return {
      id: `stats_freq_${Date.now()}`,
      type: "statistics",
      prompt: `Donades les següents dades: [${dataSet.join(", ")}]. Completa la taula i els totals.`,
      data: metadata,
      solution: solution,
      metadata: metadata
    };
  }

  static createCentralTendencyExercise(rng: RNG): ExerciseInstance<StatisticsMetadata, CentralTendencySolution, StatisticsMetadata> {
    const size = this.generateInt(rng, 5, 12);
    const dataSet = this.generateDataset(rng, size, 0, 20);
    const metadata: StatisticsMetadata = { level: "BASIC_CALC", rawData: dataSet, precision: 2, difficulty: 1 };

    const solution: CentralTendencySolution = {
      subtype: "central_tendency",
      mean: StatisticsDomain.round(StatisticsDomain.calculateMean(dataSet), 2),
      median: StatisticsDomain.calculateMedian(dataSet),
      mode: StatisticsDomain.calculateMode(dataSet)
    };

    return {
      id: `stats_ct_${Date.now()}`,
      type: "statistics",
      prompt: `Calcula mitjana, mediana i moda de: [${dataSet.join(", ")}]`,
      data: metadata,
      solution: solution,
      metadata: metadata
    };
  }

  static createDispersionExercise(rng: RNG): ExerciseInstance<StatisticsMetadata, DispersionSolution, StatisticsMetadata> {
    const size = this.generateInt(rng, 5, 10);
    const dataSet = this.generateDataset(rng, size, 0, 50);
    const varPop = StatisticsDomain.calculateVariance(dataSet, true);
    const metadata: StatisticsMetadata = { level: "CRITICAL_THINKING", rawData: dataSet, precision: 2, difficulty: 2 };

    const solution: DispersionSolution = {
      subtype: "dispersion",
      range: StatisticsDomain.calculateRange(dataSet),
      variancePopulation: StatisticsDomain.round(varPop, 2),
      varianceSample: StatisticsDomain.round(StatisticsDomain.calculateVariance(dataSet, false), 2),
      stdDevPopulation: StatisticsDomain.round(StatisticsDomain.calculateStdDev(varPop), 2),
      stdDevSample: StatisticsDomain.round(StatisticsDomain.calculateStdDev(StatisticsDomain.calculateVariance(dataSet, false)), 2)
    };

    return {
      id: `stats_disp_${Date.now()}`,
      type: "statistics",
      prompt: `Calcula rang, variància i desviació típica de: [${dataSet.join(", ")}]`,
      data: metadata,
      solution: solution,
      metadata: metadata
    };
  }

  static createNormalDistributionExercise(rng: RNG): ExerciseInstance<StatisticsMetadata, NormalDistributionSolution, StatisticsMetadata> {
    const mean = this.generateInt(rng, 50, 100);
    const stdDev = this.generateInt(rng, 5, 20);
    const targetValue = mean + Math.floor((rng() - 0.5) * 3 * stdDev); 
    const askGreater = rng() > 0.5;
    const probLess = NormalDistributionDomain.cdf(targetValue, mean, stdDev);
    const metadata: StatisticsMetadata = { level: "CRITICAL_THINKING", precision: 4, difficulty: 3 };

    const solution: NormalDistributionSolution = {
      subtype: "normal_distribution",
      mean, stdDev, targetValue,
      zScore: StatisticsDomain.round(NormalDistributionDomain.calculateZScore(targetValue, mean, stdDev), 2),
      probability: StatisticsDomain.round(askGreater ? 1 - probLess : probLess, 4),
      questionType: askGreater ? "probability_greater" : "probability_less"
    };

    return {
      id: `stats_norm_${Date.now()}`,
      type: "statistics",
      prompt: `Distribució N(${mean}, ${stdDev}). Calcula P(X ${askGreater ? '>' : '<'} ${targetValue}).`,
      data: metadata,
      solution: solution,
      metadata: metadata
    };
  }

  static createConceptualExercise(_rng: RNG): ExerciseInstance<StatisticsMetadata, ConceptualSolution, StatisticsMetadata> {
    const metadata: StatisticsMetadata = { level: "CONCEPTUAL", precision: 0, difficulty: 1 };
    return {
      id: `stats_conc_${Date.now()}`,
      type: "statistics", 
      prompt: "Quina mesura és més robusta davant de valors extrems?",
      data: metadata,
      solution: {
        subtype: "conceptual",
        topic: "outliers" as any,
        correctOptionId: "mediana",
        explanation: "La mediana no es veu afectada pels extrems."
      },
      metadata: metadata
    };
  }
}

// ============================================================================
// 4. EVALUATOR (Diagnòstic d'Errors)
// ============================================================================

class StatisticsEvaluator {

  private static checkNumber(actual: number, expected: number, tolerance: number = 0.05): boolean {
    return Math.abs(actual - expected) <= tolerance;
  }

  static evaluate(exercise: ExerciseInstance<StatisticsMetadata, StatisticsSolution, StatisticsMetadata>, answer: unknown): AnswerEvaluationResult {
    if (!answer || typeof answer !== 'object') return { correct: false, feedback: "Format invàlid.", error_type: ExerciseErrorType.FORMAT_ERROR };
    
    const sol = (exercise as any).solution as any; 
    if (!sol) return { correct: false, feedback: "Solució no trobada.", error_type: ExerciseErrorType.FORMAT_ERROR };

    // --- 🆕 MEDIAN STEP BY STEP ---
    if (sol.subtype === "median_step_by_step") {
      const userAns = answer as any;
      const expectedSorted = sol.sortedSeries as number[];
      const expectedMedian = sol.median as number;

      // 1. Validar l'ordenació
      if (!userAns.sortedSeries || !Array.isArray(userAns.sortedSeries)) {
        return { correct: false, feedback: "No has proporcionat la sèrie ordenada.", error_type: ExerciseErrorType.INCOMPLETE };
      }
      if (userAns.sortedSeries.length !== expectedSorted.length) {
        return { correct: false, feedback: `La sèrie ha de tenir exactament ${expectedSorted.length} elements.`, error_type: ExerciseErrorType.WRONG_RESULT };
      }
      for (let i = 0; i < expectedSorted.length; i++) {
        if (userAns.sortedSeries[i] !== expectedSorted[i]) {
            return { correct: false, feedback: "L'ordenació és incorrecta.", error_type: ExerciseErrorType.WRONG_RESULT };
        }
      }

      // 2. Validar la mediana final
      if (!this.checkNumber(Number(userAns.median), expectedMedian)) {
        return { correct: false, feedback: "El valor de la mediana és incorrecte.", error_type: ExerciseErrorType.CALCULATION_ERROR };
      }

      return { correct: true, feedback: "Perfecte! Has ordenat bé i trobat el centre de la sèrie. 🎉" };
    }

    // --- FREQUENCY TABLE ---
    if (sol.subtype === "frequency_table") {
      const userAns = answer as any;
      const sRows = sol.rows;
      const userRows = userAns.rows;

      if (!userRows || !Array.isArray(userRows) || userRows.length !== sRows.length) {
        return { correct: false, feedback: "Taula incompleta.", error_type: ExerciseErrorType.INCOMPLETE };
      }

      for (let i = 0; i < sRows.length; i++) {
        const sRow = sRows[i];
        const uRow = userRows[i];
        if (sRow && uRow) {
            if (Number(sRow.fi) !== Number(uRow.fi)) {
                return { correct: false, feedback: `Error en fi del valor ${sRow.value}.`, error_type: ExerciseErrorType.WRONG_RESULT };
            }
        }
      }

      if (!userAns.totals || Number(userAns.totals.fi) !== sol.totals?.fi) {
        return { correct: false, feedback: "El total N és incorrecte.", error_type: ExerciseErrorType.WRONG_RESULT };
      }
      if (Math.abs(Number(userAns.totals.ni) - 1) > 0.01) {
        return { correct: false, feedback: "El sumatori de ni ha de ser 1.", error_type: ExerciseErrorType.WRONG_RESULT };
      }

      return { correct: true, feedback: "Perfecte! 🎉" };
    }

    // --- CENTRAL TENDENCY ---
    if (sol.subtype === "central_tendency") {
      const ans = answer as any;
      if (!this.checkNumber(Number(ans.mean), sol.mean)) return { correct: false, feedback: "Mitjana incorrecta.", error_type: ExerciseErrorType.CALCULATION_ERROR };
      return { correct: true, feedback: "Molt bé!" };
    }

    return { correct: false, feedback: "Exercici completat.", error_type: ExerciseErrorType.FORMAT_ERROR };
  }
}

// ============================================================================
// 5. MAIN GENERATOR CLASS
// ============================================================================

export class StatisticsGenerator implements ExerciseGenerator<StatisticsMetadata, StatisticsSolution> {
  // Eliminat el constructor amb paràmetres no usats
  constructor() { }

  /**
   * Genera exercicis infinits.
   * ✅ NOU: Accepta "MEDIAN_PRACTICE" com a string per generar el nou tipus.
   */
  generate(rng: RNG, options?: { level?: string }): ExerciseInstance<StatisticsMetadata, StatisticsSolution, StatisticsMetadata> {
    const level = options?.level || "FREQ_TABLE";

    switch (level) {
      // 🟢 EXERCICI ESPECÍFIC DE MEDIANA (INFINIT)
      case "MEDIAN_PRACTICE": 
        return StatisticsExerciseFactory.createMedianStepByStepExercise(rng);

      // CASOS PREVIS
      case "CONCEPTUAL": 
        return StatisticsExerciseFactory.createConceptualExercise(rng);
      
      case "BASIC_CALC": 
         return rng() > 0.5 
           ? StatisticsExerciseFactory.createMedianStepByStepExercise(rng)
           : StatisticsExerciseFactory.createCentralTendencyExercise(rng);
      
      case "FREQ_TABLE": 
        return StatisticsExerciseFactory.createFrequencyExercise(rng);
      
      case "CRITICAL_THINKING": 
        return StatisticsExerciseFactory.createDispersionExercise(rng);
        
      default:
        return StatisticsExerciseFactory.createFrequencyExercise(rng);
    }
  }

  evaluate(exercise: ExerciseInstance<StatisticsMetadata, StatisticsSolution, StatisticsMetadata>, answer: unknown): AnswerEvaluationResult {
    return StatisticsEvaluator.evaluate(exercise, answer);
  }
}