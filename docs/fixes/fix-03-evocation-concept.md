# Fix 03 — Evocation concept is hardcoded and disconnected from the active exercise

## Severity
**Medium.** The evocation layer works mechanically (the modal fires, the LLM generates
a question, the quality score is captured). But the *concept being evoked* has no
relationship to what the student is about to practise. Two hardcoded strings are
responsible.

---

## Affected Files
1. `src/components/Exercise/ExerciseContainer.tsx` (primary)
2. `src/services/CompasService.ts` (secondary — same pattern, different location)

---

## Root Cause

### ExerciseContainer.tsx, line 218 — concept passed to the scheduler is hardcoded

```typescript
// CURRENT (lines 217–218)
// 🧠 1. DETERMINEM EL CONCEPTE ACTUAL PER AL SCHEDULER
const conceptId = type === 'statistics' ? 'mean' : 'frequency_absolute';
```

This `conceptId` does two jobs:

1. It tells `retrievalScheduler.shouldBlockForEvocation()` which concept to check
   mastery for (used when the `MASTERY` trigger fires — "block if mastery of *this
   concept* drops below threshold").
2. `decision.conceptToRetrieve` (returned by the scheduler) is derived from this
   value and is what eventually becomes the evocation question topic.

A student loading a **Taules de Freqüència** exercise will receive an evocation
question about `'mean'`, not about frequency tables.

### ExerciseContainer.tsx, line 55 — default state value is an unrelated concept

```typescript
// CURRENT (line 55)
const [activeRetrievalConcept, setActiveRetrievalConcept] = useState<string>("counting");
```

`"counting"` is the default if `setActiveRetrievalConcept` hasn't fired yet.
In practice this default is overwritten correctly at line 94 during
`handleTriggerEvocationQuestion()`, so it is only a latent bug. It would surface if
`handleStudentReply()` were called before any evocation had been triggered (e.g.,
rapid user input). Worth correcting for clarity.

### CompasService.ts, line 149 — same hardcoding exists in the service layer

```typescript
// CURRENT (line 149)
const currentConceptId = params.exercise.type === "statistics" ? "mean" : "frequency_absolute";
```

This value is passed into both `IntegrityEngine.evaluate()` and
`DecisionEngine.decide()`. The decision engine uses it to look up concept graph
neighbours when choosing a pedagogical strategy. A hardcoded `'mean'` means the
decision engine always navigates the concept graph from the `mean` node, regardless
of whether the exercise is about dispersion or frequency tables.

---

## The Fix

### Step 1 — Add a `getConceptIdForExercise` helper in `ExerciseContainer.tsx`

Add this function immediately before the `export function ExerciseContainer` line
(line 36), alongside the `getCompetenceId` helper introduced in Fix 01.

```typescript
// Add before: export function ExerciseContainer({ student }: ExerciseContainerProps) {

/**
 * Returns the concept graph node ID that corresponds to an exercise type + level.
 * Used by:
 *   - RetrievalScheduler.shouldBlockForEvocation() — which concept mastery to check
 *   - handleTriggerEvocationQuestion()             — what to ask about
 *
 * IDs must match nodes defined in src/pedagogy/conceptGraph/.
 */
function getConceptIdForExercise(type: ExerciseType, options?: any): string {
  if (type === 'fractions') return 'fraction_simplification';
  const level: string | undefined = options?.level;
  switch (level) {
    case 'CONCEPTUAL':        return 'descriptive_statistics';
    case 'BASIC_CALC':        return 'mean';
    case 'MEDIAN_PRACTICE':   return 'median';
    case 'FREQ_TABLE':        return 'frequency_absolute';
    case 'CRITICAL_THINKING': return 'dispersion';
    default:                  return 'mean';
  }
}
```

> **Important:** The concept IDs used here (`'descriptive_statistics'`, `'mean'`,
> `'median'`, `'frequency_absolute'`, `'dispersion'`, `'fraction_simplification'`)
> must exist as nodes in your concept graph
> (`src/pedagogy/conceptGraph/`). Verify that all six IDs are defined there before
> applying this fix. If any are missing, add them first — the scheduler and decision
> engine both traverse the graph from the returned node.

---

### Step 2 — Replace the hardcoded `conceptId` in `loadExercise()` (lines 217–218)

```typescript
// REMOVE (lines 217–218):
// 🧠 1. DETERMINEM EL CONCEPTE ACTUAL PER AL SCHEDULER
const conceptId = type === 'statistics' ? 'mean' : 'frequency_absolute';

// REPLACE WITH:
// 🧠 1. DETERMINEM EL CONCEPTE ACTUAL PER AL SCHEDULER
const conceptId = getConceptIdForExercise(type, options);
```

The rest of `loadExercise()` (lines 221–230) does not need to change — `decision`
and `decision.conceptToRetrieve` flow correctly from this point.

---

### Step 3 — Fix the default value of `activeRetrievalConcept` (line 55)

```typescript
// REMOVE (line 55):
const [activeRetrievalConcept, setActiveRetrievalConcept] = useState<string>("counting");

// REPLACE WITH:
const [activeRetrievalConcept, setActiveRetrievalConcept] = useState<string>("mean");
```

`"mean"` is a valid concept graph node and a reasonable fallback if the state is
ever read before an evocation cycle completes. `"counting"` is not a registered
concept in this codebase.

---

### Step 4 — Fix the hardcoded concept in `CompasService.ts` (line 149)

This is a separate occurrence of the same pattern inside the service layer.

```typescript
// REMOVE (line 149):
const currentConceptId = params.exercise.type === "statistics" ? "mean" : "frequency_absolute";

// REPLACE WITH:
const levelHint: string | undefined = (params.exercise.metadata as any)?.level;
const conceptIdMap: Record<string, string> = {
  CONCEPTUAL:        'descriptive_statistics',
  BASIC_CALC:        'mean',
  MEDIAN_PRACTICE:   'median',
  FREQ_TABLE:        'frequency_absolute',
  CRITICAL_THINKING: 'dispersion',
};
const currentConceptId = params.exercise.type === 'statistics'
  ? (conceptIdMap[levelHint ?? ''] ?? 'mean')
  : 'fraction_simplification';
```

This ensures that `IntegrityEngine` and `DecisionEngine` both operate on the correct
node when evaluating a student's answer.

---

## End-to-end flow after the fix

```
User clicks "4. Taules"
  → loadExercise("statistics", { level: "FREQ_TABLE" })
  → getConceptIdForExercise("statistics", { level: "FREQ_TABLE" })
      returns 'frequency_absolute'
  → retrievalScheduler.shouldBlockForEvocation(student, 'frequency_absolute')
      checks mastery of 'frequency_absolute' specifically
  → if blocked: handleTriggerEvocationQuestion('frequency_absolute')
      LLM asked: "Quina és la idea darrere de la freqüència absoluta?"
  → Student answers → evocationQualityScore captured
  → Exercise loads
  → Student submits answer
  → CompasService receives exercise with metadata.level = 'FREQ_TABLE'
  → currentConceptId = 'frequency_absolute'
  → IntegrityEngine evaluates against 'frequency_absolute' context
  → DecisionEngine navigates graph from 'frequency_absolute' node
```

---

## Dependency on Fix 01

This fix overlaps with Fix 01 in one place: both introduce a concept-from-exercise
mapping. If you apply both fixes, **check that the two maps are consistent**:

| exercise level     | Fix 01 `getCompetenceId()` | Fix 03 `getConceptIdForExercise()` |
|--------------------|----------------------------|------------------------------------|
| CONCEPTUAL         | `statistics_conceptual`    | `descriptive_statistics`           |
| BASIC_CALC         | `calculation_specific`     | `mean`                             |
| MEDIAN_PRACTICE    | `calculation_specific`     | `median`                           |
| FREQ_TABLE         | `problem_solving_specific` | `frequency_absolute`               |
| CRITICAL_THINKING  | `problem_solving_specific` | `dispersion`                       |
| fractions          | `calculation_specific`     | `fraction_simplification`          |

These serve different systems (`studentModelUpdater` vs `conceptGraph`/`scheduler`)
and use different ID namespaces — no collision is expected, but keep them in sync
if you add new exercise types.

---

## Pedagogical Context — Geometry Concept Graph for MVP Modules

The two MVP exercise modules (Teorema de Pitàgores and Teorema de Tales) require new
concept graph nodes. These nodes must exist in `src/pedagogy/conceptGraph/` before
`getConceptIdForExercise` can safely return geometry concept IDs, because the
`RetrievalScheduler` and `DecisionEngine` both traverse the graph from the returned
node to find prerequisite chains.

### Minimum required nodes — Pythagorean Theorem

These nodes must be added to the concept graph with the edges listed:

| Node ID         | Label (ca)             | Prerequisite of        | Requires              |
|-----------------|------------------------|------------------------|-----------------------|
| `right_triangle`| Triangle rectangle     | `hypotenuse`, `leg`    | *(root concept)*      |
| `hypotenuse`    | Hipotenusa             | `pythagorean_theorem`  | `right_triangle`      |
| `leg`           | Catet                  | `pythagorean_theorem`  | `right_triangle`      |
| `power`         | Potència (quadrat)     | `pythagorean_theorem`  | *(arithmetic)*        |
| `square_root`   | Arrel quadrada         | `pythagorean_theorem`  | `power`               |

The `RetrievalScheduler` will gate Pythagorean exercises and ask the student about
`square_root` or `power` if their mastery of those nodes is below threshold —
exactly the prerequisite activation this pedagogy is designed to produce.

### Minimum required nodes — Thales Theorem

| Node ID           | Label (ca)              | Prerequisite of      | Requires                       |
|-------------------|-------------------------|----------------------|--------------------------------|
| `ratio`           | Raó / quocient          | `proportionality`    | *(arithmetic)*                 |
| `fraction`        | Fracció                 | `proportionality`    | *(arithmetic — already exists)*|
| `proportionality` | Proporcionalitat        | `similar_triangles`  | `ratio`, `fraction`            |
| `similar_triangles`| Triangles semblants    | `thales_theorem`     | `proportionality`, `right_triangle` |

Note that `fraction` likely already exists as a concept in the graph (the fractions
exercise module exists). Check before creating a duplicate node — the Thales chain
should reuse it.

### `getConceptIdForExercise` — full extension for geometry

Once the graph nodes above are defined, extend the helper with these cases:

```typescript
// Add to getConceptIdForExercise() when geometry generators are built:
if (type === 'geometry') {
  const levelMap: Record<string, string> = {
    PYTHAGOREAN_CONCEPTUAL: 'right_triangle',     // evoke: "what is a right triangle?"
    PYTHAGOREAN_CALC:       'square_root',         // evoke: "how do you take a root?"
    PYTHAGOREAN_APPLIED:    'pythagorean_theorem', // evoke: "when do we use Pythagoras?"
    THALES_CONCEPTUAL:      'similar_triangles',   // evoke: "what makes two triangles similar?"
    THALES_CALC:            'proportionality',     // evoke: "what does proportional mean?"
    THALES_APPLIED:         'thales_theorem',      // evoke: "when does Thales apply?"
  };
  return levelMap[options?.level] ?? 'right_triangle';
}
```

### Evocation question intent by concept

When the scheduler fires an evocation question before a geometry exercise, the LLM
receives the `conceptToRetrieve` value. These are the intended evocation question
styles per concept (for the Oracle's `retrieval_trigger` prompt):

| `conceptToRetrieve`  | Intended evocation question style                                      |
|----------------------|------------------------------------------------------------------------|
| `right_triangle`     | "Quin tipus d'angle té un triangle rectangle? Com el reconeixeries?"   |
| `square_root`        | "Si 3² = 9, com trobaríem el costat si sabem que el quadrat val 25?"  |
| `proportionality`    | "Si una recepta per 4 persones necessita 200g, quant cal per 6?"      |
| `similar_triangles`  | "Quan diem que dos triangles són 'semblants'? Quines propietats comparteixen?" |
| `fraction`           | "Quina fracció és equivalent a 3/6? Com ho simplifiques?"              |

These are Socratic, context-free questions — no numbers from the exercise leak in,
and no answer is implied. This matches the `retrieval_trigger` prompt constraint in
`CompasService.ts` ("NO parlis de números ni taules").

### Connection between Thales and the existing Fractions module

Thales theorem and the existing fractions exercises share the `fraction` and `ratio`
concept nodes. A student with high mastery in fractions (`calculation_specific` in
`arithmetic` area) will receive a shorter evocation cycle before Thales exercises —
the scheduler's mastery threshold check will pass for `fraction`, and the evocation
will target `proportionality` instead. This cross-domain connection is architecturally
already supported; it only requires the concept graph edges to be defined correctly.
