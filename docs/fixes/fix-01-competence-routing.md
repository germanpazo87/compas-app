# Fix 01 — Hardcoded `competenceId` breaks mastery differentiation

## Severity
**High.** Every exercise, regardless of type or cognitive target, updates the same
`calculation_specific` bucket in the student model. `problem_solving_specific` and
all conceptual entries are never written during normal use.

---

## Affected File
`src/components/Exercise/ExerciseContainer.tsx`

---

## Root Cause

### Line 264 — hardcoded competence key
```typescript
// CURRENT (lines 261–267)
updateStudentState(
  updatedModel,
  areaKey,
  'calculation_specific',   // ← always this, for every exercise type
  result.correct,
  integrityScore
);
```

`updateStudentState` (in `studentModelUpdater.ts`) supports three routing paths:

| `competenceId` value         | Updates                                    |
|------------------------------|--------------------------------------------|
| `'calculation_specific'`     | `area.competences.calculation_specific`    |
| `'problem_solving_specific'` | `area.competences.problem_solving_specific`|
| any other string             | `area.competences.conceptual[id]`          |

Only the first path is ever reached today.

### Line 218 — same hardcoding in the evocation scheduler call
```typescript
// CURRENT (lines 217–218)
// 🧠 1. DETERMINEM EL CONCEPTE ACTUAL PER AL SCHEDULER
const conceptId = type === 'statistics' ? 'mean' : 'frequency_absolute';
```

The scheduler (`retrievalScheduler.shouldBlockForEvocation`) also receives a fixed
concept regardless of which statistics level is selected. A student doing frequency
tables will trigger an evocation question about `'mean'`.

### Line 275 — debug log hard-references the same key
```typescript
// CURRENT (line 275)
console.log("💾 Progrés guardat. Mastery Actual:",
  studentWithCounter.areas[areaKey].competences.calculation_specific.performance);
```

This log will show the wrong competence after the fix is applied.

---

## The Fix

### Step 1 — Add a `getCompetenceId` helper (insert before `ExerciseContainer`)

Add this pure function immediately before the `export function ExerciseContainer` line
(currently line 36). It maps exercise type + level to the correct competence key.

```typescript
// Add before: export function ExerciseContainer({ student }: ExerciseContainerProps) {

/**
 * Maps an exercise to the correct competenceId for studentModelUpdater.
 *
 * Routing logic:
 *  - Conceptual MC questions  → conceptual['statistics_conceptual']
 *  - Basic calculation        → calculation_specific
 *  - Median practice          → calculation_specific
 *  - Frequency tables         → problem_solving_specific  (multi-step)
 *  - Critical thinking        → problem_solving_specific  (analytical)
 *  - Fractions                → calculation_specific
 */
function getCompetenceId(exercise: ExerciseInstance): string {
  if (exercise.type === 'fractions') return 'calculation_specific';
  const level = (exercise.metadata as any)?.level as string | undefined;
  switch (level) {
    case 'CONCEPTUAL':        return 'statistics_conceptual';
    case 'BASIC_CALC':        return 'calculation_specific';
    case 'MEDIAN_PRACTICE':   return 'calculation_specific';
    case 'FREQ_TABLE':        return 'problem_solving_specific';
    case 'CRITICAL_THINKING': return 'problem_solving_specific';
    default:                  return 'calculation_specific';
  }
}
```

> **Note on `'statistics_conceptual'`:** this string is not a reserved key in
> `studentModelUpdater`. It will be routed to the `else` branch (lines 185–192 of
> `studentModelUpdater.ts`) and create/update `area.competences.conceptual['statistics_conceptual']`.
> That is the intended behaviour — conceptual exercises build the conceptual map, not
> the procedural buckets.

---

### Step 2 — Replace the hardcoded `competenceId` (lines 261–267)

```typescript
// REMOVE (lines 261–267):
updateStudentState(
  updatedModel,
  areaKey,
  'calculation_specific',
  result.correct,
  integrityScore
);

// REPLACE WITH:
const competenceId = getCompetenceId(exercise);
updateStudentState(
  updatedModel,
  areaKey,
  competenceId,
  result.correct,
  integrityScore
);
```

---

### Step 3 — Replace the hardcoded `conceptId` in the scheduler call (lines 217–218)

```typescript
// REMOVE (lines 217–218):
// 🧠 1. DETERMINEM EL CONCEPTE ACTUAL PER AL SCHEDULER
const conceptId = type === 'statistics' ? 'mean' : 'frequency_absolute';

// REPLACE WITH:
// 🧠 1. DETERMINEM EL CONCEPTE ACTUAL PER AL SCHEDULER
const conceptIdMap: Partial<Record<string, string>> = {
  CONCEPTUAL:        'descriptive_statistics',
  BASIC_CALC:        'mean',
  MEDIAN_PRACTICE:   'median',
  FREQ_TABLE:        'frequency_absolute',
  CRITICAL_THINKING: 'dispersion',
};
const conceptId = type === 'statistics'
  ? (conceptIdMap[options?.level] ?? 'mean')
  : 'fraction_simplification';
```

> This makes the evocation question semantically relevant to what the student is
> actually about to practise.

---

### Step 4 — Fix the debug log (line 275)

```typescript
// REMOVE (line 275):
console.log("💾 Progrés guardat. Mastery Actual:",
  studentWithCounter.areas[areaKey].competences.calculation_specific.performance);

// REPLACE WITH:
const updatedCompetenceId = getCompetenceId(exercise);
const updatedComp = updatedCompetenceId === 'calculation_specific' || updatedCompetenceId === 'problem_solving_specific'
  ? studentWithCounter.areas[areaKey].competences[updatedCompetenceId as 'calculation_specific' | 'problem_solving_specific']
  : studentWithCounter.areas[areaKey].competences.conceptual[updatedCompetenceId];
console.log(`💾 Progrés guardat [${updatedCompetenceId}]. Mastery: ${updatedComp?.performance?.toFixed(3)}`);
```

---

## Verification

After the fix, do the following manual test:

1. Load a **Conceptes** exercise → answer it → open Firebase Firestore →
   confirm `areas.statistics.competences.conceptual.statistics_conceptual` was updated
   and `calculation_specific` was **not** touched.
2. Load a **Taules** exercise → confirm `problem_solving_specific` increments.
3. Load a **Càlcul General** exercise → confirm `calculation_specific` increments.
4. Load a **Mediana Pràctica** exercise → confirm `calculation_specific` increments.

---

## No other files need changes for this fix.

`studentModelUpdater.ts` already handles all three routing branches correctly at lines
177–192. The entire fix is contained in `ExerciseContainer.tsx`.

---

## Pedagogical Context — MVP Geometry Modules

The MVP adds two new exercise modules that are not yet built: **Teorema de Pitàgores**
and **Teorema de Tales**. When those modules are implemented, the `getCompetenceId`
helper and the concept map in `loadExercise` must be extended. Document the intended
mappings here so they can be added atomically when the generators are built.

### Pythagorean Theorem — competence routing

The Pythagorean module involves three cognitive levels:
- **Conceptual** (What does a² + b² = c² mean? What is a right triangle?):
  route to `'pythagorean_conceptual'` → lands in `conceptual['pythagorean_conceptual']`
- **Procedural / find the hypotenuse or a leg** (numerical, one-step):
  route to `'calculation_specific'`
- **Applied / multi-step** (word problems, grid distances, 3D):
  route to `'problem_solving_specific'`

### Thales Theorem — competence routing

The Thales module involves:
- **Conceptual** (What is proportionality? What are similar triangles?):
  route to `'thales_conceptual'` → lands in `conceptual['thales_conceptual']`
- **Procedural** (find missing side given two similar triangles, cross-multiply):
  route to `'calculation_specific'`
- **Applied** (shadow problems, map scale, nested triangles):
  route to `'problem_solving_specific'`

### Extended `getCompetenceId` switch (do not implement until generators exist)

```typescript
// Future extension — add these cases when geometry generators are built:
case 'PYTHAGOREAN_CONCEPTUAL':  return 'pythagorean_conceptual';
case 'PYTHAGOREAN_CALC':        return 'calculation_specific';
case 'PYTHAGOREAN_APPLIED':     return 'problem_solving_specific';
case 'THALES_CONCEPTUAL':       return 'thales_conceptual';
case 'THALES_CALC':             return 'calculation_specific';
case 'THALES_APPLIED':          return 'problem_solving_specific';
```

### Prerequisite awareness

The student model's mastery of these competences is meaningful only once the prerequisite
chain is also tracked. Pythagorean exercises should check (and potentially evoke)
`'square_root'` and `'power'` mastery before loading. Thales exercises should check
`'fraction'` and `'ratio'` mastery. This is handled by Fix 03 (evocation concept) and
the concept graph — but the competence IDs here must match the concept IDs defined there.

### `areaKey` for geometry exercises

When the geometry generator is built, `ExerciseContainer.tsx` line 258 must be extended:

```typescript
// CURRENT (line 258):
const areaKey = exercise.type === 'statistics' ? 'statistics' : 'arithmetic';

// FUTURE (once geometry area is added to StudentModel and AuthService):
const areaKey =
  exercise.type === 'statistics' ? 'statistics' :
  exercise.type === 'geometry'   ? 'geometry'   :
  'arithmetic';
```

This also requires uncommenting `geometry: MathArea` in `studentModel/types.ts:126`
and initialising the geometry area in `AuthService.ts` `createInitialProfile()`.
