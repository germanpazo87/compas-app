/**
 * CONCEPT GRAPH INDEX
 * Punt d'entrada unificat per tots els grafs de conceptes.
 */

import type { ConceptGraph } from "./types";
import { arithmeticConceptGraph } from "./arithmetic";
import { statisticsConceptGraph } from "./statistics";

/**
 * Graf unificat de tots els conceptes
 */
export const unifiedConceptGraph: ConceptGraph = {
  ...arithmeticConceptGraph,
  ...statisticsConceptGraph,
};

/**
 * Exports individuals per ús granular
 */
export { arithmeticConceptGraph } from "./arithmetic";
export { statisticsConceptGraph } from "./statistics";
export type { ConceptGraph, ConceptNode, ConceptDomain } from "./types";

/**
 * Utilitat: Obtenir node conceptual per ID
 */
export function getConceptNode(conceptId: string): ConceptGraph[string] | undefined {
  return unifiedConceptGraph[conceptId];
}

/**
 * Utilitat: Validar si un concepte existeix
 */
export function conceptExists(conceptId: string): boolean {
  return conceptId in unifiedConceptGraph;
}

/**
 * Utilitat: Obtenir prerequisits d'un concepte
 */
export function getPrerequisites(conceptId: string): string[] {
  const node = unifiedConceptGraph[conceptId];
  return node ? node.prerequisites : [];
}

/**
 * Utilitat: Obtenir conceptes relacionats
 */
export function getRelatedConcepts(conceptId: string): string[] {
  const node = unifiedConceptGraph[conceptId];
  return node ? node.relatedConcepts : [];
}