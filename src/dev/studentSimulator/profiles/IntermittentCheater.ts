import { type StudentProfile, normalRandom, clamp } from "../BaseProfile";

export class IntermittentCheater implements StudentProfile {
  name = "IntermittentCheater";

  getRealAbility(t: number): number {
    // Aprèn una mica de forma honesta, però lentament
    return clamp(0.3 + (0.2 * (t / 100)), 0, 1);
  }

  shouldCheat(t: number): boolean {
    // Fa trampes de forma bimodal (pals d'encert artificial)
    // Usem una funció sinusoïdal per crear onades de trampes
    return (Math.sin(t * 0.5) > 0.5); 
  }

  getProbabilityCorrect(diff: number, t: number): number {
    if (this.shouldCheat(t)) return 0.95;
    return clamp(this.getRealAbility(t) / (diff / 2), 0, 1);
  }

  getResponseTime(diff: number, correct: boolean, t: number): number {
    // Si fa trampes, temps baix; si és honest, temps normal (8-12s)
    return this.shouldCheat(t) ? normalRandom(1, 2) : normalRandom(8, 12);
  }
}