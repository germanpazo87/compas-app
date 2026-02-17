import type { ValidationResult, SupportLevel } from "../types";
import type { CompasLLMResponse } from "../core/llmContract";

export class ResponseValidator {
  private readonly REQUIRED_FIELDS = [
    "response_text",
    "scaffolding_type",
    "keywords_ca",
    "direct_answer_given",
  ];

  private readonly VALID_SCAFFOLDING_TYPES = ["hint", "socratic", "reformulation"];

  /**
   * Valida la resposta bruta de l'LLM i l'extreu en format JSON.
   */
  validate(
    rawResponse: string,
    supportLevel: SupportLevel
  ): ValidationResult {
    const errors: string[] = [];

    // 1. EXTRACCIÓ ROBUSTA AMB REGEX
    // Busquem el contingut des de la primera '{' fins a l'última '}'
    // Això descarta Markdown (```json), salutacions inicials o comentaris finals.
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return { 
        valid: false, 
        errors: ["No s'ha trobat cap estructura JSON vàlida en la resposta de l'IA."] 
      };
    }

    const cleanedResponse = jsonMatch[0];

    // 2. PARSING JSON
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch (e) {
      return { 
        valid: false, 
        errors: ["Error de format JSON. El bloc detectat no és un JSON vàlid."] 
      };
    }

    // 3. COMPROVACIÓ DE CAMPS REQUERITS
    for (const field of this.REQUIRED_FIELDS) {
      if (!(field in parsed)) {
        errors.push(`Falta el camp requerit: ${field}`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // 4. VALIDACIÓ DE TIPUS I VALORS
    if (typeof parsed.response_text !== "string" || parsed.response_text.length === 0) {
      errors.push("response_text ha de ser una cadena de text no buida");
    }

    if (!this.VALID_SCAFFOLDING_TYPES.includes(parsed.scaffolding_type)) {
      errors.push(`scaffolding_type ha de ser un de: ${this.VALID_SCAFFOLDING_TYPES.join(", ")}`);
    }

    if (!Array.isArray(parsed.keywords_ca)) {
      errors.push("keywords_ca ha de ser un array");
    } else if (parsed.keywords_ca.some((k: any) => typeof k !== "string")) {
      errors.push("Tots els elements de keywords_ca han de ser cadenes de text");
    }

    if (typeof parsed.direct_answer_given !== "boolean") {
      errors.push("direct_answer_given ha de ser un valor booleà");
    }

    // 5. DETECCIÓ DE CAMPS "AL·LUCINATS" (No permesos)
    const allowedFields = new Set(this.REQUIRED_FIELDS);
    const extraFields = Object.keys(parsed).filter((k) => !allowedFields.has(k));
    if (extraFields.length > 0) {
      errors.push(`Camps inesperats detectats: ${extraFields.join(", ")}`);
    }

    // 6. REGLA DE NEGOCI: CONTROL DE RESPOSTA DIRECTA
    // Si l'IA diu que ha donat la resposta però el nivell no és "full", bloquegem.
    if (
      parsed.direct_answer_given === true &&
      supportLevel !== "full"
    ) {
      errors.push(
        "Seguretat Pedagògica: No es permet donar la resposta directa (direct_answer_given=true) si el nivell de suport no és 'full'."
      );
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      data: parsed as CompasLLMResponse,
    };
  }

  /**
   * Resposta de contingència en cas de fallada crítica del motor o del validador.
   */
 /**
   * Resposta de contingència en cas de fallada crítica.
   * El casting 'as string' i el default final asseguren que mai sigui undefined.
   */
  fallback(language: string): CompasLLMResponse {
    const text = language === "ca" 
      ? "Ho sento, he tingut un problema tècnic. Pots tornar a intentar-ho?" 
      : "Lo siento, he tenido un problema técnico. ¿Puedes volver a intentarlo?";

    return {
      // 1. Camps nous (Obligatoris)
      message: text,
      interventionType: "scaffolding",
      cognitiveTarget: "procedural",
      timestamp: Date.now(),
      pedagogical_goal: "fallback_response",

      // 2. Camps antics/compatibilitat (Obligatoris)
      response_text: text,
      scaffolding_type: "reformulation",
      keywords_ca: [],
      direct_answer_given: false,
    };
  } 
}