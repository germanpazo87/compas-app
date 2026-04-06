import { type StudentProfile, normalRandom, clamp } from "../BaseProfile";

export class PlateauLearner implements StudentProfile {
  name = "PlateauLearner";

  getRealAbility(t: number): number {
    // Aprèn ràpid al principi però s'estanca al 60%
    if (t < 40) return clamp(0.3 + (0.3 * (t / 40)), 0, 1);
    return 0.6;
  }

  getProbabilityCorrect(diff: number, t: number): number {
    return clamp(this.getRealAbility(t) / (diff / 2), 0, 0.9);
  }

  getResponseTime(): number {
    // Temps d'esforç consistent (6-10s)
    return normalRandom(6, 10);
  }

  shouldCheat(): boolean { return false; }
}