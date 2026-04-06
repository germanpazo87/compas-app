# Fix 02 — Oracle (LLM) prompt lacks student competence context

## Severity
**High.** Gemini receives only three fields from the student model — level, language,
and global reliability. The full `areas` object (per-competence mastery, stability,
medals) is assembled, sanitised, and then silently discarded before the prompt is
built. The Oracle cannot tailor scaffolding to a student's actual weak spots.

---

## Affected File
`src/services/CompasService.ts`

---

## Root Cause

### Lines 183–188 — only 3 fields extracted from studentModel

```typescript
// CURRENT (lines 183–188)
// 🔥 PAS 3: DIETA DE L'ESTUDIANT
const contextLleuger = {
  nivell: safeStudentModel.profile.educationalLevel,
  idioma: safeStudentModel.profile.preferredLanguage,
  fiabilitat: safeStudentModel.global.reliability
};
```

The comment calls this a "student diet" — the intent was to keep the prompt compact.
That is a reasonable goal. The problem is that **zero competence data** survived the
diet, so the LLM is blind to whether the student has 0.1 or 0.9 mastery on any topic.

### Lines 238–260 — the prompt template has no competence section

```typescript
// CURRENT (lines 238–260)
const finalPrompt = `
  ${systemInstruction}

  --- PERFIL ALUMNE (RESUM) ---
  Nivell: ${contextLleuger.nivell} | Idioma: ${contextLleuger.idioma} | Fiabilitat: ${contextLleuger.fiabilitat}

  ${contextEspecífic}

  --- CONTEXT LINGÜÍSTIC ---
  ${clilInstruction}
  ...
`.trim();
```

There is no section between `PERFIL ALUMNE` and the exercise context where competence
data could appear.

---

## The Fix

### Step 1 — Add a `buildCompetenceSummary` helper function

Add this function at the **module level** in `CompasService.ts`, immediately before
the `export const CompasService = {` line (currently line 98).

```typescript
// Add before: export const CompasService = {

/**
 * Builds a compact, human-readable competence summary for the LLM prompt.
 * Intentionally terse — the goal is to give the model directional signal,
 * not a full data dump.
 *
 * Example output:
 *   Estadística: càlcul=0.42(BRONZE) | resolució=0.18(NONE) | conceptes: statistics_conceptual=0.65(SILVER)
 *   Aritmètica: càlcul=0.30(BRONZE) | resolució=0.00(NONE)
 *   Àrees dominades: cap
 */
function buildCompetenceSummary(areas: StudentModel['areas']): string {
  const areaLabels: Record<string, string> = {
    statistics: 'Estadística',
    arithmetic: 'Aritmètica',
    algebra:    'Àlgebra',
  };

  const lines: string[] = [];
  const masteredAreas: string[] = [];

  for (const [key, area] of Object.entries(areas)) {
    if (!area) continue;
    const label = areaLabels[key] ?? key;
    const c = area.competences;

    const calcStr   = `càlcul=${c.calculation_specific?.performance?.toFixed(2) ?? '?'}(${c.calculation_specific?.medal ?? '?'})`;
    const solveStr  = `resolució=${c.problem_solving_specific?.performance?.toFixed(2) ?? '?'}(${c.problem_solving_specific?.medal ?? '?'})`;

    const conceptEntries = Object.entries(c.conceptual ?? {})
      .filter(([, v]) => v && v.attempts > 0)
      .map(([id, v]) => `${id}=${v!.performance.toFixed(2)}(${v!.medal})`)
      .join(', ');

    const conceptStr = conceptEntries ? ` | conceptes: ${conceptEntries}` : '';

    lines.push(`${label}: ${calcStr} | ${solveStr}${conceptStr}`);

    if (area.mastery) masteredAreas.push(label);
  }

  lines.push(`Àrees dominades: ${masteredAreas.length > 0 ? masteredAreas.join(', ') : 'cap'}`);
  return lines.join('\n');
}
```

> **Why filter `attempts > 0` on conceptual entries?** A freshly-created student
> model pre-initialises all area objects. Sending zero-attempt placeholder entries
> to the LLM adds noise without signal. Only entries that have been exercised are
> meaningful.

---

### Step 2 — Inject the summary into the prompt (lines 238–260)

```typescript
// REMOVE (lines 238–260):
const finalPrompt = `
  ${systemInstruction}

  --- PERFIL ALUMNE (RESUM) ---
  Nivell: ${contextLleuger.nivell} | Idioma: ${contextLleuger.idioma} | Fiabilitat: ${contextLleuger.fiabilitat}

  ${contextEspecífic}

  --- CONTEXT LINGÜÍSTIC ---
  ${clilInstruction}

  ${missionInstructions}

  --- FORMAT JSON OBLIGATORI ---
  {
    "message": "Text en ${langName} aplicant GLOSEIG si cal.",
    "interventionType": "scaffold_current",
    "cognitiveTarget": "procedural",
    "scaffolding_type": "hint",
    "keywords_ca": [],
    "evocationQualityScore": 0.0 (o null)
  }
`.trim();

// REPLACE WITH:
const competenceSummary = buildCompetenceSummary(safeStudentModel.areas);

const finalPrompt = `
  ${systemInstruction}

  --- PERFIL ALUMNE (RESUM) ---
  Nivell: ${contextLleuger.nivell} | Idioma: ${contextLleuger.idioma} | Fiabilitat: ${contextLleuger.fiabilitat}

  --- COMPETÈNCIES ACTUALS DE L'ALUMNE ---
  ${competenceSummary}

  ${contextEspecífic}

  --- CONTEXT LINGÜÍSTIC ---
  ${clilInstruction}

  ${missionInstructions}

  --- FORMAT JSON OBLIGATORI ---
  {
    "message": "Text en ${langName} aplicant GLOSEIG si cal.",
    "interventionType": "scaffold_current",
    "cognitiveTarget": "procedural",
    "scaffolding_type": "hint",
    "keywords_ca": [],
    "evocationQualityScore": 0.0 (o null)
  }
`.trim();
```

---

## What the LLM will now see (example for a real student)

```
Ets el tutor IA "Compàs".
Nivell de l'alumne: ESO4.
Idioma base: ca.
Fiabilitat de l'alumne: 0.91.

--- PERFIL ALUMNE (RESUM) ---
Nivell: ESO4 | Idioma: ca | Fiabilitat: 0.91

--- COMPETÈNCIES ACTUALS DE L'ALUMNE ---
Estadística: càlcul=0.42(BRONZE) | resolució=0.18(NONE) | conceptes: statistics_conceptual=0.65(SILVER)
Aritmètica: càlcul=0.55(SILVER) | resolució=0.30(BRONZE)
Àlgebra: càlcul=0.00(NONE) | resolució=0.00(NONE)
Àrees dominades: cap

--- CONTEXT: EXERCICI ---
...
```

With this context the model can:
- Avoid re-explaining concepts already at SILVER/GOLD level.
- Intensify scaffolding when `problem_solving_specific` is near zero.
- Acknowledge progress ("Ja domines el càlcul bàsic, anem a la resolució de problemes").

---

## Token cost

The competence summary adds approximately 80–120 tokens to each prompt (depending on
how many conceptual entries exist). The model is currently configured with
`maxOutputTokens: 1500` on a 1 500-token cap output. Input tokens are not capped.
This addition is safe.

---

## No other files need changes for this fix.

`buildCompetenceSummary` is self-contained. The `StudentModel` type is already
imported at line 11 of `CompasService.ts`.

---

## Pedagogical Context — What the Oracle must prioritise

The Oracle (Compàs sidebar LLM) is a Socratic tutor, not a solution provider. The
competence context injected by this fix must serve that role. Below are the
pedagogical constraints and ordering priorities that should guide how
`buildCompetenceSummary` is refined and how the prompt section is worded.

### Priority ordering of context fields

When the Oracle receives the competence summary, the following information is highest
value and should appear first (or be surfaced separately from the full area dump):

1. **Current exercise concept** — the specific concept the student is working on right
   now (e.g., `'median'`, `'frequency_absolute'`). This is already present in
   `contextEspecífic` via `PromptBuilder.build()`, but it should also appear at the
   top of the competence summary so the model can cross-reference it with mastery.

2. **Mastery score for that concept** — the `performance` and `medal` for the specific
   competence being exercised. If mastery is low (< 0.35, NONE/BRONZE), the Oracle
   should scaffold more heavily. If high (> 0.65, SILVER/GOLD), it should compress
   explanations and push for metacognition.

3. **Top 2 weakest prerequisite concepts** — the two prerequisite concepts (as defined
   in the concept graph) with the lowest `performance` scores. These are the most
   likely cause of the student's errors. The Oracle should address these before
   procedural mechanics.

4. **Current scaffolding level** — derived from `finalMode` (the `DecisionEngine`
   output, available at line 178 of `CompasService.ts`). This tells the Oracle how
   directive to be: `scaffold_current` → guided hints only; `remediate_current` →
   go back to basics; `advance_to_next` → challenge with extensions.

5. **Number of LLM interactions this session** — `params.attemptNumber` is a proxy
   for this. If `attemptNumber >= 3` on the same exercise, the Oracle should shift
   from hints to a worked example (but still without giving the final answer).

### Revised `buildCompetenceSummary` signature (do not implement yet)

The current proposed helper takes only `areas`. To support priorities 1–5, the full
implementation should accept additional parameters:

```typescript
// Target signature (revise when implementing):
function buildCompetenceSummary(
  areas: StudentModel['areas'],
  currentConceptId: string,          // from getConceptIdForExercise()
  conceptGraph: ConceptGraph,        // to look up prerequisite nodes
  finalMode: string,                 // from DecisionEngine
  attemptNumber: number              // from params.attemptNumber
): string
```

The output string should lead with the current concept and its mastery, then the
prerequisite alerts, then the full area table. Example target output:

```
--- COMPETÈNCIES ACTUALS DE L'ALUMNE ---
Concepte actiu: frequency_absolute | Mastery: 0.18 (NONE) → Scaffolding INTENSIU
Prerequisits febles: fraction=0.22(NONE) | ratio=0.31(BRONZE)
Sessió actual: intent #3 → considera exemple guiat si el pròxim intent falla

Estadística: càlcul=0.42(BRONZE) | resolució=0.18(NONE) | conceptes: statistics_conceptual=0.65(SILVER)
Aritmètica: càlcul=0.55(SILVER) | resolució=0.30(BRONZE)
Àrees dominades: cap
```

### Hard constraints for the Oracle (must appear in `missionInstructions`)

These constraints apply regardless of scaffolding level, attempt number, or student
request. Add them as a non-negotiable section to `missionInstructions` in the prompt:

```
🚫 RESTRICCIONS ABSOLUTES:
- MAI donis la resposta final a l'exercici, independentment de quantes vegades
  l'alumne demani. Guia, no resolguis.
- SEMPRE respon en l'idioma de l'alumne (${langName}). Mai canviïs d'idioma
  sense una instrucció explícita del sistema.
- Si l'alumne et demana la resposta directament, reformula la pregunta com a
  pista: "Pensa en... Quina operació et portaria a...?"
```

These constraints should be appended to the existing `missionInstructions` block for
both the `retrieval` and `exercise_help` cases (lines 209–234 of `CompasService.ts`).

### Geometry-specific context (for MVP modules)

When Pythagorean and Thales exercises are added, the concept IDs that should appear as
"prerequisits febles" are:

**Pythagorean prerequisites** (weakest first, query from concept graph):
- `power` — squaring numbers (a², b²)
- `square_root` — taking roots (√c²)
- `right_triangle` — identifying legs vs hypotenuse

**Thales prerequisites** (weakest first):
- `fraction` — fraction simplification (cross-multiplication)
- `ratio` — ratios and proportional reasoning
- `similar_triangles` — recognising similar triangle pairs

If a student's mastery of any prerequisite is below 0.35, the Oracle should address
that concept before engaging with the theorem itself. This is the core pedagogical
design of the evocation layer working in tandem with the Oracle.
