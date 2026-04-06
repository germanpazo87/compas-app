import type { StudentProfile } from "./BaseProfile";
import { HonestLearner } from "./profiles/HonestLearner";
import { HighAbilityStudent } from "./profiles/HighAbilityStudent";
import { RandomGuesser } from "./profiles/RandomGuesser";
import { ConsistentCheater } from "./profiles/ConsistentCheater";
import { IntermittentCheater } from "./profiles/IntermittentCheater";
import { LuckyLowMastery } from "./profiles/LuckyLowMastery";
import { PlateauLearner } from "./profiles/PlateauLearner";

// Fix: Objecte constant per evitar errors de sintaxi no esborrable
export const ProfileType = {
  HONEST: "HONEST",
  HIGH_ABILITY: "HIGH_ABILITY",
  RANDOM_GUESSER: "RANDOM_GUESSER",
  CONSISTENT_CHEATER: "CONSISTENT_CHEATER",
  INTERMITTENT_CHEATER: "INTERMITTENT_CHEATER",
  LUCKY_LOW: "LUCKY_LOW",
  PLATEAU: "PLATEAU"
} as const;

export type ProfileType = typeof ProfileType[keyof typeof ProfileType];

export class ProfileFactory {
  static createProfile(type: ProfileType): StudentProfile {
    switch (type) {
      case ProfileType.HONEST: return new HonestLearner();
      case ProfileType.HIGH_ABILITY: return new HighAbilityStudent();
      case ProfileType.RANDOM_GUESSER: return new RandomGuesser();
      case ProfileType.CONSISTENT_CHEATER: return new ConsistentCheater();
      case ProfileType.INTERMITTENT_CHEATER: return new IntermittentCheater();
      case ProfileType.LUCKY_LOW: return new LuckyLowMastery();
      case ProfileType.PLATEAU: return new PlateauLearner();
      default:
        const _exhaustiveCheck: never = type;
        throw new Error(`Tipus de perfil no reconegut: ${type}`);
    }
  }
}