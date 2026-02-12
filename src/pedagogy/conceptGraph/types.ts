/**
 * CONCEPT GRAPH TYPES
 * Defineix l'estructura del graf de coneixement pedagògic.
 */

/**
 * Dominis conceptuals disponibles
 */
export type ConceptDomain =
  | "arithmetic"
  | "statistics"
  | "algebra"
  | "geometry";

/**
 * Node individual del graf de conceptes
 */
export interface ConceptNode {
  id: string;
  domain: ConceptDomain;

  difficulty: number; // 1–5 (1=bàsic, 5=avançat)

  prerequisites: string[]; // IDs de conceptes prerequisits
  relatedConcepts: string[]; // IDs de conceptes relacionats

  tags?: string[]; // Etiquetes opcionals per categorització
}

/**
 * Graf complet de conceptes
 */
export type ConceptGraph = Record<string, ConceptNode>;