/* src/core/llmContract.ts */

export type SupportLevel = "normal" | "guided" | "final_help";

// 🆕 Enums específics per al motor pedagògic del TFM
export type InterventionType = 
  | 'scaffold_current' 
  | 'remediate_current' 
  | 'advance_to_next' 
  | 'reduce_scaffold_current' 
  | 'spaced_review' 
  | 'evoke_prerequisite' 
  | 'none';

export type CognitiveTarget = 'conceptual' | 'procedural' | 'strategic';

export type ScaffoldingType = 
  | 'hint' 
  | 'worked_example' 
  | 'decomposition' 
  | 'analogy' 
  | 'error_flag' 
  | 'none';

export interface CompasLLMResponse {
  message: string;             // El text que l'alumne llegirà (abans response_text)
  interventionType: InterventionType;
  cognitiveTarget: CognitiveTarget;
  scaffolding_type: ScaffoldingType;
  keywords_ca: string[];
  timestamp: number;
  direct_answer_given: boolean; 
  pedagogical_goal: string;
  
  // 🆕 VARIABLE CIENTÍFICA: Qualitat de l'activació conceptual (0.0 a 1.0)
  evocationQualityScore: number | null; 
}

/**
 * Claus obligatòries per a la validació
 */
const REQUIRED_KEYS: Array<keyof CompasLLMResponse> = [
  "message",
  "interventionType",
  "cognitiveTarget",
  "scaffolding_type",
  "keywords_ca",
  "evocationQualityScore",
  "timestamp",
  "direct_answer_given",
  "pedagogical_goal"
];

const VALID_INTERVENTIONS: InterventionType[] = [
  'scaffold_current', 'remediate_current', 'advance_to_next', 
  'reduce_scaffold_current', 'spaced_review', 'evoke_prerequisite', 'none'
];

const VALID_COGNITIVE_TARGETS: CognitiveTarget[] = ['conceptual', 'procedural', 'strategic'];

const VALID_SCAFFOLDING_TYPES: ScaffoldingType[] = [
  'hint', 'worked_example', 'decomposition', 'analogy', 'error_flag', 'none'
];

/**
 * Validador estricte del contracte amb la IA
 */
export function validateCompasLLMResponse(data: unknown): CompasLLMResponse {
  if (data === null || typeof data !== "object") {
    throw new Error("InvalidLLMContract: Data is not an object");
  }

  const obj = data as Record<string, unknown>;

  // 1. Validar que totes les claus requerides existeixen
  for (const key of REQUIRED_KEYS) {
    if (!(key in obj)) {
      throw new Error(`InvalidLLMContract: Missing key "${key}"`);
    }
  }

  // 2. Validar tipus de dades bàsics
  if (typeof obj.message !== "string") throw new Error("InvalidLLMContract: message must be string");
  
  // 3. Validar Enums
  if (!VALID_INTERVENTIONS.includes(obj.interventionType as InterventionType)) {
    throw new Error(`InvalidLLMContract: Invalid interventionType "${obj.interventionType}"`);
  }
  if (typeof obj.timestamp !== "number") {
  throw new Error("InvalidLLMContract: timestamp must be a number");
}
  if (!VALID_COGNITIVE_TARGETS.includes(obj.cognitiveTarget as CognitiveTarget)) {
    throw new Error(`InvalidLLMContract: Invalid cognitiveTarget "${obj.cognitiveTarget}"`);
  }
  
  if (!VALID_SCAFFOLDING_TYPES.includes(obj.scaffolding_type as ScaffoldingType)) {
    throw new Error(`InvalidLLMContract: Invalid scaffolding_type "${obj.scaffolding_type}"`);
  }

  // 4. Validar Score d'evocació (Pot ser número o null)
  if (obj.evocationQualityScore !== null && typeof obj.evocationQualityScore !== "number") {
    throw new Error("InvalidLLMContract: evocationQualityScore must be number or null");
  }

  // 5. Validar Keywords
  if (!Array.isArray(obj.keywords_ca)) {
    throw new Error("InvalidLLMContract: keywords_ca must be an array");
  }

  return obj as unknown as CompasLLMResponse;
}