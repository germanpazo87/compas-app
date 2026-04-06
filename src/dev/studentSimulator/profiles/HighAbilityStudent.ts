import { type StudentProfile, normalRandom, clamp } from "../BaseProfile";

export class HighAbilityStudent implements StudentProfile {
  name = "HighAbilityStudent";

  getRealAbility(): number { 
    return 0.9; // Constantment alta
  }

  getProbabilityCorrect(diff: number): number {
    // Probabilitat molt alta, fins i tot en dificultats altes
    return clamp(0.9 / (diff / 3), 0, 0.98);
  }

  getResponseTime(): number {
    // Ràpid perquè sap la resposta, però no instantani (3-8s)
    return normalRandom(3, 8);
  }

  shouldCheat(): boolean { return false; }
}