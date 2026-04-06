/**
 * INTERACTION TYPES
 * Tipologia d'interaccions pedagògiques amb l'alumne.
 * 
 * Fonamentació:
 * - practice: Aprenentatge actiu amb feedback immediat
 * - retrieval: Evocació sense suport (Testing Effect)
 * - remedial: Reforç intensiu de conceptes dèbils
 * - assessment: Avaluació formal sense aprenentatge actiu
 */

/**
 * Tipus d'interacció pedagògica
 */
export type InteractionType =
  | "practice"    // Pràctica estàndard amb scaffold
  | "retrieval"   // Evocació distribuïda (baix impacte, alt efecte memòria)
  | "remedial"    // Reforç intensiu (alt impacte)
  | "assessment"; // Avaluació formal (impacte moderat)