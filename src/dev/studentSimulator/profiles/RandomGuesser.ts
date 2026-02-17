import { type StudentProfile, normalRandom } from "../BaseProfile";

export class RandomGuesser implements StudentProfile {
  name = "RandomGuesser";

  getRealAbility(): number { 
    return 0.1; // Coneixement mínim
  }

  getProbabilityCorrect(): number {
    return 0.25; // Atzar pur (1 de 4)
  }

  getResponseTime(): number {
    // Resposta impulsiva i molt ràpida (1-3s)
    return normalRandom(1, 3);
  }

  shouldCheat(): boolean { return false; }
}