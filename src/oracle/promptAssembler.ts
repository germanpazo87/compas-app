/**
 * ORACLE PROMPT ASSEMBLER
 * Construcció de prompts estructurats per IA segons context pedagògic.
 * Aplica regles lingüístiques i limitacions segons milestone.
 */

import type { OracleContext, ExerciseMilestone } from "../types/OracleContext";

/**
 * PROMPT PRINCIPAL
 * Genera prompt complet per al model d'IA
 */
export function assemblePrompt(context: OracleContext): string {
  const {
    milestone,
    datasetSummary,
    studentInput,
    validationStatus,
    pedagogicalState,
    languageConfig,
  } = context;

  // Construeix seccions del prompt
  const sections = [
    buildRoleSection(),
    buildLanguageSection(languageConfig),
    buildMilestoneSection(milestone),
    buildDatasetSection(datasetSummary),
    buildStudentInputSection(studentInput, milestone),
    buildValidationSection(validationStatus),
    buildPedagogicalSection(pedagogicalState),
    buildResponseConstraints(milestone, languageConfig),
  ];

  return sections.join("\n\n");
}

/**
 * Definició de rol i context
 */
function buildRoleSection(): string {
  return `# ROL
Ets un assistent pedagògic expert en estadística descriptiva.
El teu objectiu és guiar l'alumne en l'exercici de Taula de Freqüències sense donar respostes directes.
Fomenta l'autonomia i el pensament crític.`;
}

/**
 * Instruccions lingüístiques
 */
function buildLanguageSection(config: { primaryLanguage: string; interactionLanguage: string; glossaryMode: boolean }): string {
  const { primaryLanguage, interactionLanguage, glossaryMode } = config;

  let section = `# CONFIGURACIÓ LINGÜÍSTICA
- Llengua de resposta: ${interactionLanguage}
- Llengua matemàtica primària: ${primaryLanguage}`;

  if (glossaryMode && interactionLanguage !== primaryLanguage) {
    section += `
- Mode glossari ACTIVAT: Inclou termes matemàtics clau en ${primaryLanguage} entre parèntesis.
  Exemple: "frequency (freqüència)", "category (categoria)"`;
  }

  return section;
}

/**
 * Context del milestone actual
 */
function buildMilestoneSection(milestone: ExerciseMilestone): string {
  const descriptions: Record<ExerciseMilestone, string> = {
    metadata_sync: "L'alumne ha d'identificar N total, nom de variable i tipus de variable",
    categories_completed: "L'alumne ha completat la columna de categories (xi)",
    frequencies_partial: "L'alumne està emplenat les freqüències absolutes (fi)",
    frequencies_completed: "L'alumne ha completat tota la taula de freqüències",
  };

  return `# FASE ACTUAL: ${milestone}
${descriptions[milestone]}`;
}

/**
 * Informació del dataset
 */
function buildDatasetSection(summary: OracleContext["datasetSummary"]): string {
  let section = `# DATASET
- Variable: ${summary.variableName}
- Tipus: ${summary.variableType}
- N total: ${summary.N}
- Categories detectades: ${summary.categories.join(", ")}`;

  if (summary.frequencies) {
    section += `\n- Freqüències correctes: ${JSON.stringify(summary.frequencies)}`;
  }

  return section;
}

/**
 * Entrada de l'alumne
 */
function buildStudentInputSection(input: Record<string, any>, milestone: ExerciseMilestone): string {
  const inputStr = JSON.stringify(input, null, 2);
  return `# RESPOSTA DE L'ALUMNE
${inputStr}`;
}

/**
 * Estat de validació
 */
function buildValidationSection(status: { isCorrect: boolean; errorCount: number }): string {
  return `# VALIDACIÓ
- Resposta correcta: ${status.isCorrect ? "SÍ" : "NO"}
- Errors detectats: ${status.errorCount}`;
}

/**
 * Context pedagògic
 */
function buildPedagogicalSection(state: { autonomyLevel: string }): string {
  const guidance: Record<string, string> = {
    low: "Proporciona pistes més explícites i exemples concrets",
    medium: "Equilibra entre guia i descobriment autònom",
    high: "Fes preguntes socràtiques i promociona reflexió independent",
  };

  return `# ADAPTACIÓ PEDAGÒGICA
- Nivell d'autonomia: ${state.autonomyLevel}
- Estratègia: ${guidance[state.autonomyLevel] || guidance.medium}`;
}

/**
 * Restriccions de resposta segons milestone
 */
function buildResponseConstraints(milestone: ExerciseMilestone, langConfig: { glossaryMode: boolean }): string {
  const constraints: Record<ExerciseMilestone, string> = {
    metadata_sync: `
- Si incorrecte: Guia per revisar el dataset sense donar números
- Si correcte: Valida i anima a començar categories`,
    
    categories_completed: `
- Si incorrecte: Pregunta com ha identificat les categories úniques
- Si correcte: Explica concepte de freqüència absoluta`,
    
    frequencies_partial: `
- Ajuda a comptar sense fer el càlcul
- Suggereix estratègies de recompte`,
    
    frequencies_completed: `
- Genera pregunta conceptual basada en dades reals
- Exemple: "Per què la categoria X té més freqüència que Y?"
- NO demanis calcular percentatges (fora de MVP)`,
  };

  let section = `# RESTRICCIONS DE RESPOSTA
${constraints[milestone]}

**FORMAT DE RESPOSTA:**
- Màxim 3-4 frases
- To motivador i proper
- NO donis respostes numèriques directes`;

  if (langConfig.glossaryMode) {
    section += `\n- Inclou termes tècnics en català entre parèntesis`;
  }

  return section;
}