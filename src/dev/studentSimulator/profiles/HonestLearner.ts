// src/dev/studentSimulator/profiles/HonestLearner.ts
import  { type StudentProfile, normalRandom, clamp } from "../BaseProfile";

export class HonestLearner implements StudentProfile {
  name = "HonestLearner";
  getRealAbility(t: number): number {
    return clamp(0.2 + (0.6 * (t / 100)), 0, 1);
  }
  getProbabilityCorrect(diff: number, t: number): number {
    return clamp(this.getRealAbility(t) / (diff / 2), 0, 0.95);
  }
  getResponseTime(): number {
    return normalRandom(5, 15);
  }
  shouldCheat(): boolean { return false; }
}