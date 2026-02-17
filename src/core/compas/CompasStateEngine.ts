// src/core/compas/CompasStateEngine.ts

import { ExerciseErrorType } from "../ExerciseEngine";

export type CompasMode = "EVOCATION" | "SCAFFOLDING" | "CONSOLIDATION" | "DIALOGIC";

interface StateContext {
  isCorrect: boolean;
  attemptNumber: number;
  userMessage?: string | undefined; // Si l'alumne ha escrit alguna cosa al xat
  errorType?: ExerciseErrorType | undefined;
}

export class CompasStateEngine {
  
  static determineMode(context: StateContext): CompasMode {
    // 1. Si l'usuari pregunta explícitament, entrem en mode diàleg socràtic
    if (context.userMessage && context.userMessage.trim().length > 0) {
      return "DIALOGIC";
    }

    // 2. Si la resposta és correcta -> Consolidació / Metacognició
    if (context.isCorrect) {
      return "CONSOLIDATION";
    }

    // 3. Si és el primer intent fallit o no hi ha error greu -> Evocació
    // Volem que l'alumne pensi abans de rebre ajuda directa.
    if (context.attemptNumber <= 1 && context.errorType !== ExerciseErrorType.FORMAT_ERROR) {
      return "EVOCATION";
    }

    // 4. Si ja portem més d'un intent o l'error és específic -> Scaffolding
    return "SCAFFOLDING";
  }
}