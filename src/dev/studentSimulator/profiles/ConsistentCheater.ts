import { type StudentProfile, normalRandom } from "../BaseProfile";

export class ConsistentCheater implements StudentProfile {
  name = "ConsistentCheater";

  getRealAbility(): number { 
    return 0.2; // Realment no sap gaire
  }

  getProbabilityCorrect(): number {
    return 0.95; // Èxit artificial gairebé total
  }

  getResponseTime(): number {
    // Temps de "copy-paste" o eina externa (0.5-2s)
    return normalRandom(0.5, 2);
  }

  shouldCheat(): boolean { return true; }
}