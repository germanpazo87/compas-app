import { type ExerciseInstance, ExerciseErrorType } from "../ExerciseEngine";
import { type StudentProfile, type EducationalLevel } from "../../studentModel/types";

/**
 * Paràmetres necessaris per construir un prompt pedagògic complet.
 * Hem afegit '| undefined' explícit per complir amb 'exactOptionalPropertyTypes'.
 */
export interface PromptParams {
  exercise: ExerciseInstance;
  mode: "scaffolding" | "remediate_current" | "reinforce_mastery" | "challenge";
  userAnswer?: any | undefined;
  errorType?: ExerciseErrorType | string | undefined;
  studentMessage?: string | undefined;
  studentProfile: StudentProfile; 
}

export class PromptBuilder {

  static build(params: PromptParams): string {
    const { exercise, mode, studentProfile, userAnswer, errorType, studentMessage } = params;

    // 🛡️ Definim valors per defecte si el perfil o les dades estan incomplets
    const preferredLanguage = studentProfile.preferredLanguage || "ca";
    const educationalLevel = studentProfile.educationalLevel || "ESO1";

    const levelContext = this.getLevelContext(educationalLevel);
    const pedagogicalStrategy = this.getModeStrategy(mode);

    return `
      ROLAND: Ets el "Compàs", un tutor socràtic expert en estadística i matemàtiques.
      
      --- 1. EL TEU ALUMNE (Context) ---
      - Nivell Acadèmic: ${educationalLevel} (${levelContext.tone})
      - Idioma Preferit: ${preferredLanguage}
      
      --- 2. DIRECTIVA GLOSEIG (CLIL) ---
      - Utilitza **${preferredLanguage}** com a llengua principal.
      - Introdueix SEMPRE els termes tècnics en **ANGLÈS** entre parèntesis.
        * Exemple: "Calcula la **mitjana (mean)**."

      --- 3. L'EXERCICI ---
      - Enunciat: "${exercise.prompt}"
      - SOLUCIÓ: ${JSON.stringify(exercise.solution)}

      --- 4. ESTAT ACTUAL ---
      - Resposta alumne: ${JSON.stringify(userAnswer || "Cap")}
      - Error: ${errorType || "Cap"}
      - Missatge alumne: "${studentMessage || "Sense missatge"}"

      --- 5. MISSIÓ ---
      - Objectiu: ${mode.toUpperCase()}
      - Estratègia: ${pedagogicalStrategy}
      - Adaptació: ${levelContext.instruction}
      
      --- 6. FORMAT JSON OBLIGATORI ---
      {
        "message": "Text aplicant GLOSEIG.",
        "interventionType": "${mode}",
        "cognitiveTarget": "procedural",
        "scaffolding_type": "hint",
        "keywords_ca": []
      }
    `;
  }

  private static getLevelContext(level: EducationalLevel): { tone: string; instruction: string } {
    const contexts: Record<EducationalLevel, { tone: string; instruction: string }> = {
      'ESO1': { tone: "Visual", instruction: "Usa metàfores." },
      'ESO2': { tone: "Visual", instruction: "Usa metàfores." },
      'ESO3': { tone: "Intermedi", instruction: "Introdueix notació." },
      'ESO4': { tone: "Intermedi", instruction: "Introdueix notació." },
      'GES1': { tone: "Visual", instruction: "Usa metàfores." },
      'GES2': { tone: "Visual", instruction: "Usa metàfores." },
      'BAT1': { tone: "Acadèmic", instruction: "Rigor matemàtic." },
      'BAT2': { tone: "Acadèmic", instruction: "Rigor matemàtic." },
      'PPA+25': { tone: "Acadèmic", instruction: "Rigor matemàtic." },

      'UNIVERSITAT': { tone: "Avançat", instruction: "Rigor total." }
    };
    return contexts[level] || { tone: "Clar", instruction: "Didàctic" };
  }

  private static getModeStrategy(mode: PromptParams["mode"]): string {
    const strategies: Record<string, string> = {
      scaffolding: "Dona una pista sobre el següent pas.",
      remediate_current: "Explica la teoria darrere l'error.",
      reinforce_mastery: "Proposa una reflexió.",
      challenge: "Planteja un repte."
    };
    return strategies[mode] || "Guia l'alumne.";
  }
}