import { type StudentProfile, normalRandom, clamp } from "../BaseProfile";

export class LuckyLowMastery implements StudentProfile {
  name = "LuckyLowMastery";

  getRealAbility(): number { 
    return 0.25; 
  }

  getProbabilityCorrect(diff: number): number {
    const baseProb = 0.25 / (diff / 2);
    // 10% de probabilitat de tenir un "cop de sort" (outlier)
    return Math.random() < 0.1 ? clamp(baseProb + 0.3, 0, 0.9) : clamp(baseProb, 0, 1);
  }

  getResponseTime(): number {
    // Molt lent, ho intenta de debò (10-20s)
    return normalRandom(10, 20);
  }

  shouldCheat(): boolean { return false; }
}