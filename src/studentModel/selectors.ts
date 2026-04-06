/**
 * LÒGICA DE DESBLOQUEIG
 * 
 * Regla: Una àrea es desbloqueja quan l'anterior té mastery = true
 */
import type { StudentModel } from "./types";

function getUnlockedAreas(model: StudentModel): string[] {
  const unlocked: string[] = [];
  
  // Arithmetic sempre disponible (àrea inicial)
  unlocked.push("arithmetic");
  
  // Statistics es desbloqueja si arithmetic.mastery = true
  if (model.areas.arithmetic.mastery) {
    unlocked.push("statistics");
  }
  
  // Algebra es desbloqueja si statistics.mastery = true
  if (model.areas.statistics.mastery) {
    unlocked.push("algebra");
  }
  
  return unlocked;
}

/**
 * Exemple d'ús en UI:
 * 
 * const areas = getUnlockedAreas(studentModel);
 * // ["arithmetic", "statistics"] → Algebra encara bloquejada
 * 
 * render(
 *   areas.includes("algebra") 
 *     ? <AlgebraButton enabled /> 
 *     : <AlgebraButton locked message="Completa Statistics primer" />
 * );
 */
/**
 * ADAPTACIÓ DE SCAFFOLDING
 * 
 * El mastery d'àrea influeix en el nivell de suport proporcionat:
 * - Àrea NO dominada → Scaffold ALT (pistes explícites, descomposició)
 * - Àrea dominada → Scaffold BAIX (autonomia, reflexió)
 */

import type { AreaCompetences } from "./types";

/**
 * Calcula el nivell de suport necessari.
 * Hem corregit l'accés indexat per satisfer l'strict mode.
 */
export function getScaffoldingLevel(
  model: StudentModel,
  areaId: keyof StudentModel["areas"],
  competenceId: string
): "high" | "medium" | "low" {
  
  const area = model.areas[areaId];
  
  // 1. Si l'àrea ja està dominada, autonomia total.
  if (area.mastery) return "low";

  let medal = false;

  // 2. 🛡️ FIX TS(7053): Comprovem si la clau és una de les fixes
  if (competenceId === "calculation_specific") {
    medal = area.competences.calculation_specific.medal;
  } else if (competenceId === "problem_solving_specific") {
    medal = area.competences.problem_solving_specific.medal;
  } else {
    // 3. Si no és cap de les anteriors, busquem al Record de conceptuals
    // Aquí el 'string' sí que és vàlid perquè 'conceptual' és un Record<string, Competence>
    medal = area.competences.conceptual[competenceId]?.medal ?? false;
  }

  return medal ? "medium" : "high";
}

/**
 * Exemple d'aplicació en Oracle:
 * 
 * const scaffoldLevel = getScaffoldingLevel(studentModel, "statistics", "frequency_table");
 * 
 * if (scaffoldLevel === "high") {
 *   prompt += "\nProporciona descomposició pas a pas amb exemples concrets.";
 * } else if (scaffoldLevel === "medium") {
 *   prompt += "\nProporciona pistes generals sense donar la solució.";
 * } else {
 *   prompt += "\nFes preguntes socràtiques per fomentar reflexió autònoma.";
 * }
 */
/**
 * INDICADORS VISUALS SEGONS MASTERY
 */

/**
 * Genera el Badge visual d'un àrea.
 * Hem canviat 'string' per 'keyof StudentModel["areas"]' per seguretat.
 */
export function getAreaBadge(
  model: StudentModel, 
  areaId: keyof StudentModel["areas"] // 🛡️ Fix: Ara només accepta claus vàlides
): string {
  const area = model.areas[areaId];

  if (area.mastery) {
    return "🏆 Àrea Dominada"; // Badge daurat
  }
  
  const competences = area.competences;
  const medals = [
    competences.calculation_specific.medal,
    competences.problem_solving_specific.medal,
    Object.values(competences.conceptual).some(c => c.medal)
  ];
  
  const count = medals.filter(Boolean).length;
  
  if (count === 2) return "⭐⭐ Quasi dominada";
  if (count === 1) return "⭐ En progrés";
  return "🔓 Accessible";
}