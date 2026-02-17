import { ExerciseErrorType } from "../../core/ExerciseEngine";
import type {
  AnswerEvaluationResult,
  ExerciseGenerator,
  ExerciseInstance,
  RNG,
} from "../../core/ExerciseEngine";

export interface Fraction {
  numerator: number;
  denominator: number;
}

export class FractionsDomain {
  static gcd(a: number, b: number): number {
    const absA = Math.abs(a);
    const absB = Math.abs(b);
    return absB === 0 ? absA : this.gcd(absB, absA % absB);
  }

  static simplify(f: Fraction): Fraction {
    if (f.denominator === 0) {
      throw new Error("DivisionByZero");
    }

    const common = this.gcd(f.numerator, f.denominator) || 1;
    const numerator = f.numerator / common;
    const denominator = f.denominator / common;

    // Keep denominator positive for canonical comparisons.
    if (denominator < 0) {
      return { numerator: -numerator, denominator: -denominator };
    }

    return { numerator, denominator };
  }

  static areEqual(f1: Fraction, f2: Fraction): boolean {
    const s1 = this.simplify(f1);
    const s2 = this.simplify(f2);
    return s1.numerator === s2.numerator && s1.denominator === s2.denominator;
  }
}

export class FractionGenerator
  implements ExerciseGenerator<Fraction, { operands: Fraction[] }>
{
  generate(rng: RNG): ExerciseInstance<Fraction, { operands: Fraction[] }> {
    const genNum = () => Math.floor(rng() * 9) + 1;

    const f1: Fraction = { numerator: genNum(), denominator: genNum() };
    const f2: Fraction = { numerator: genNum(), denominator: genNum() };

    const rawSolution: Fraction = {
      numerator: f1.numerator * f2.denominator + f2.numerator * f1.denominator,
      denominator: f1.denominator * f2.denominator,
    };

    return {
      id: `frac_${Date.now()}`,
      type: "fractions",
      prompt: `Calcula: ${f1.numerator}/${f1.denominator} + ${f2.numerator}/${f2.denominator}`,
      solution: FractionsDomain.simplify(rawSolution),
      metadata: { operands: [f1, f2] },
    };
  }

  evaluate(
    exercise: ExerciseInstance<Fraction, { operands: Fraction[] }>,
    answer: Fraction
  ): AnswerEvaluationResult {
    if (FractionsDomain.areEqual(answer, exercise.solution)) {
      const simplifiedAnswer = FractionsDomain.simplify(answer);
      const isSimplified =
        simplifiedAnswer.numerator === exercise.solution.numerator &&
        simplifiedAnswer.denominator === exercise.solution.denominator;

      if (!isSimplified) {
        return {
          correct: false,
          feedback:
            "El valor es correcte, pero has de simplificar la fraccio al maxim.",
          error_type: ExerciseErrorType.NOT_SIMPLIFIED,
        };
      }

      return {
        correct: true,
        feedback: "Molt be! Resposta correcta i simplificada.",
      };
    }

    return {
      correct: false,
      feedback: "El resultat no es correcte. Revisa la suma.",
      error_type: ExerciseErrorType.WRONG_RESULT,
    };
  }
}

// Backward-compatible name.
export { FractionGenerator as FractionsGenerator };
