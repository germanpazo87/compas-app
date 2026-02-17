export type LanguageLevel = "low" | "medium" | "high";
export type SupportLevel = "minimal" | "guided" | "socratic" | "full";
export type ScaffoldingType = "hint" | "socratic" | "reformulation";
export type Language = "ca" | "es" | "en";

export interface StudentMetrics {
  mastery: number;
  recent_errors: string[];
  language_level: LanguageLevel;
  integrity_score: number;
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
}

export interface ChatMessage {
  role: 'user' | 'ia';
  text: string;
  timestamp: number;
}