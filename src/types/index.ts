

export type LanguageLevel = "low" | "medium" | "high";
export type SupportLevel = "normal" | "guided" | "final_help"|"full";
export type ScaffoldingType = "hint" | "socratic" | "reformulation" | "validation"; // 👈 Afegeix validationexport type Language = "ca" | "es" | "en";
export type Language = "ca" | "es" | "en";

export interface StudentMetrics {
  mastery: number; // 0-1
  recent_errors: string[];
  language_level: LanguageLevel;
  integrity_score: number; // 0-1
}

export interface CompasRequest {
  exercise_id: string;
  exercise_statement: string;
  concept: string;
  student_question: string;
  student_metrics: StudentMetrics;
  support_level: SupportLevel;
  language: Language;
}

export interface CompasResponse {
  response_text: string;
  scaffolding_type: ScaffoldingType;
  keywords_ca: string[];
  direct_answer_given: boolean;
  pedagogical_goal: string; // 👈 Afegeix això perquè el contracte el té
}

export interface InteractionLog {
  timestamp: string;
  exercise_id: string;
  mastery: number;
  language_level: LanguageLevel;
  language: Language;
  scaffolding_type: ScaffoldingType;
  response_length: number;
  direct_answer_given: boolean;
  raw_response: string;
  support_level: SupportLevel;
  integrity_score: number;
}

export interface ValidationResult {
  valid: boolean;
  data?: CompasResponse;
  errors?: string[];
}