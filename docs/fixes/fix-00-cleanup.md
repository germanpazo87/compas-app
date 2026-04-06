# Fix 00 — Dead Code, Naming Residues, and Dependency Cleanup

## Summary

The codebase evolved from a backend-served prototype ("La Matriu" / "Oracle") through
several refactoring cycles into the current client-only architecture (Compàs / Gemini
API called directly from the browser). The transition left behind a complete parallel
backend architecture that is fully disconnected from the Vite app, plus one
Oracle-era component that references modules that no longer exist. Nothing in this
file should be deleted until you have reviewed each item.

**Risk level: LOW.** Every item in the "safe to delete" section has been verified to
have zero live import paths from production code (`App.tsx` → `ExerciseContainer.tsx`
→ live components). The dev simulator files have independent value and are noted
separately.

---

## Section 1 — Old Backend Cluster (safe to delete as a unit)

This is the most significant dead-code cluster. It represents the old architecture
where Gemini was called from an Express server. The current architecture calls Gemini
directly from `CompasService.ts` in the browser via `@google/generative-ai`.

None of these files are imported by any component in the Vite render tree.

### Files to delete

| File | Why dead | Notes |
|------|----------|-------|
| `src/index.ts` | Express server entry point. Never imported by Vite. Only entry point is `src/main.tsx`. | Calls `createCompasRouter` which is also dead |
| `src/api/compas.routes.ts` | Only imported by `src/index.ts`. Defines `/api/compas/ask` endpoint that was superseded by direct Gemini calls. | Imports `LLMController` (also dead) |
| `src/controllers/LLMController.ts` | Only imported by `compas.routes.ts` and `src/dev/testCompas.ts`. Both are dead in production. | Contains a full Gemini → validate → log pipeline, now entirely replicated inside `CompasService.ts` |
| `src/services/GeminiClient.ts` | Only imported by `LLMController.ts`. | Wraps `@google/generative-ai` — same library now used directly in `CompasService.ts` |
| `src/services/ResponseValidator.ts` | Only imported by `LLMController.ts` and `src/tests/ResponseValidator.test.ts`. | The validation logic it provides is now handled by inline parsing in `CompasService.ts` lines 272–296 |
| `src/services/InteractionLogger.ts` | Only imported by `LLMController.ts`. | Wrote to `logs/interactions/*.jsonl`. This path never fires in production. |

**Verification before deleting:** Run `grep -r "LLMController\|compas\.routes\|GeminiClient\|ResponseValidator\|InteractionLogger" src/ --include="*.tsx" --include="*.ts"` and confirm only the files listed above appear in the results.

---

## Section 2 — Oracle-Era Component Cluster (safe to delete as a unit)

This cluster originates from the "Oracle" UI prototype and imports from `src/oracle/`
which **no longer exists**. The file would cause a compile error if ever imported.

### Files to delete

| File | Why dead | Notes |
|------|----------|-------|
| `src/features/statistics/FrequencyExercise.tsx` | Never imported anywhere. References `../../oracle/OracleEngine` and `../../oracle/contextBuilder` — both paths resolve to nothing. Has a name collision with `src/components/Exercise/exercises/FrequencyExercise.tsx`. | This is the old Oracle-era exercise UI. The current frequency table UI is `src/components/Exercise/exercises/FrequencyExercise.tsx` |
| `src/core/evaluation/OpenAnswerEvaluationEngine.ts` | Only imported by `features/statistics/FrequencyExercise.tsx` (dead). Used nowhere else. | Old open-answer semantic evaluator — superseded by LLM-based evocation scoring |
| `src/domain/statistics/frequencyTableGenerator.ts` | Only imported by `features/statistics/FrequencyExercise.tsx` (dead). Also imports from `../../types/OracleContext` which doesn't exist. | Frequency table generation is now done inside `StatisticsGenerator.ts` |

**Note on naming collision:** Both `src/features/statistics/FrequencyExercise.tsx`
(dead) and `src/components/Exercise/exercises/FrequencyExercise.tsx` (live) export
a function named `FrequencyExercise`. Once the dead one is deleted, there is no
collision. Do not rename the live one.

---

## Section 3 — Old Type Definitions (safe to delete)

These are Oracle-era type files. Their types (`CompasRequest`, `CompasResponse`,
`ValidationResult`) were the old request/response contract for the Express backend.
They have been superseded by the new contract in `src/core/llmContract.ts` and
`src/studentModel/types.ts`.

### Files to delete

| File | Why dead | Caution |
|------|----------|---------|
| `src/types/index.ts` | Only imported by dead backend files (`ResponseValidator`, `InteractionLogger`, `LLMController`, `compas.routes`, `dev/testCompas`). | Contains `ValidationResult` — verify the live `src/components/Exercise/AnswerArea.tsx` and `src/components/Exercise/index.tsx` import from their local `./types`, **not** from `src/types/index.ts` before deleting. ✅ Confirmed: their imports use `from './types'` (local). |
| `src/types/compas.ts` | Not imported anywhere. Duplicate of `src/types/index.ts` with slightly different `SupportLevel` values (`"minimal"` vs `"normal"`). Appears to be an earlier draft. | Zero importers. Safe. |

---

## Section 4 — Orphaned Utility Files (safe to delete)

| File | Why dead |
|------|----------|
| `src/core/logger.ts` | Defines `InMemoryLogger` and an `InteractionLogger` interface. Neither is imported anywhere in production code. Not the same as `src/services/InteractionLogger.ts`. |
| `src/tests/ResponseValidator.test.ts` | Tests `ResponseValidator` which is being deleted (Section 1). No test runner is configured in `package.json` scripts (no `"test"` script, no vitest or jest binary in deps). |

---

## Section 5 — Dead Code Inside Live Files (do not delete files, fix in place)

### `vite.config.ts`

| Lines | Issue | Action |
|-------|-------|--------|
| 6–14 | `server.proxy` block routes `/api/*` → `http://localhost:3000`. This proxy was wired to the old Express backend (`src/index.ts`). With the backend deleted, no code in the app calls `/api/...` — Gemini is called directly via `@google/generative-ai`. The proxy is harmless but it is a misleading artefact that suggests a backend still exists. | Remove the entire `server` block from `vite.config.ts`. |

```typescript
// REMOVE (vite.config.ts lines 6–14):
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      secure: false,
    }
  }
}

// RESULT — vite.config.ts becomes:
export default defineConfig({
  plugins: [react()],
})
```

---

### `src/components/Exercise/ExerciseContainer.tsx`

| Line | Issue | Action |
|------|-------|--------|
| 30 | `import { CompasLabLayout } from "../Debug/CompasLabLayout";` | Used only when `USE_LEGACY_LAYOUT = true` (line 39), which is hardcoded `false`. Safe to remove the import and the entire `if (USE_LEGACY_LAYOUT)` block (lines 368–393) when you are certain the lab layout is no longer needed. For now, leave with a `// TODO: remove legacy layout` comment. |
| 52 | `const [debugData, setDebugData] = useState<any>(null);` | Only used in the legacy layout branch (line 370). Dead in production AppShell path. Remove alongside the legacy layout block. |

### `src/services/CompasService.ts`

| Line | Issue | Action |
|------|-------|--------|
| 2 | `import { CompasStateEngine } from "../core/compas/CompasStateEngine";` | `CompasStateEngine` is imported but **never used** anywhere in `CompasService.ts`. The file uses `CompasContext`, `PromptBuilder`, `integrityEngine`, `decisionEngine`, and `retrievalScheduler` — but not `CompasStateEngine` directly. Remove this import. |
| 11 | `import { type StudentModel, type MathArea } from "../studentModel/types";` | `MathArea` is imported but never referenced in the file. The `createEmptyArea()` helper (line 89) returns `any`, not `MathArea`. Remove `type MathArea` from this import. |

> **Note:** `InterventionType`, `CognitiveTarget`, and `ScaffoldingType` (lines 7–9)
> ARE used — they appear as type casts on lines 288–290 (`parsed.x as InterventionType`,
> etc.). Do not remove these.

### `src/components/Exercise/index.tsx`

This file imports `ExerciseUIState`, `TFMExerciseContract`, and `ValidationResult`
from a local `./types`. It is not imported by any other file. Investigate whether
this barrel export file is still needed or is itself orphaned.

---

## Section 6 — Dev Simulator (keep, but do not ship)

The `src/dev/` folder contains 10+ files with a complete student behaviour simulator
(HonestLearner, ConsistentCheater, PlateauLearner, etc.). These are not imported in
production, but they have genuine value for integration testing and TFM validation.

**Recommendation:** Keep `src/dev/` entirely. Ensure Vite's build excludes it (verify
`vite.config.ts`). When you set up a proper test runner (see Section 8), these
simulators can be wired to an automated test suite.

---

## Section 7 — Naming Inconsistencies

### `src/studentModel/selectors.ts` line 81

```typescript
// CURRENT (line 81, inside a JSDoc comment):
* Exemple d'aplicació en Oracle:

// SHOULD BE:
* Exemple d'aplicació a Compàs:
```

A single-word change. Low priority but keeps the codebase internally consistent.

---

### `package.json` line 2

```json
// CURRENT:
"name": "la-matriu",

// SHOULD BE:
"name": "compas",
```

This is cosmetic for an npm package but affects any tooling that reads `package.json`
for the project name (CI display names, error reporters, etc.).

### Comment and string residues in live files

No live `.tsx`/`.ts` files outside the dead cluster use "Oracle" or "La Matriu"
as variable or component names. The only appearances are in the dead
`src/features/statistics/FrequencyExercise.tsx` (which is being deleted).

Remaining "Oracle" text in live files is limited to UI-facing strings in Catalan
(`"l'Oracle"` as a student-facing name). **These should be reviewed with the
pedagogy team.** If the product name for the AI tutor has officially changed from
"Oracle" to "Compàs" in the UI, update:

- `src/components/Exercise/CompasSidebar.tsx` — check all user-visible strings
  for "Oracle" references and replace with "Compàs" or "el teu tutor"

---

## Section 8 — Package.json Dependency Cleanup

### Runtime dependencies to remove

| Package | Reason |
|---------|--------|
| `express` | Only used by dead `src/index.ts` |
| `cors` | Only used by dead `src/index.ts` |
| `dotenv` | Only used by dead `src/index.ts` and `src/dev/testCompas.ts`. Vite handles `.env` files natively via `import.meta.env`. |

### Dev dependencies to remove or replace

| Package | Reason |
|---------|--------|
| `@types/cors` | Type definitions for removed `cors` package |
| `@types/express` | Type definitions for removed `express` package |
| `@types/jest` | Jest types installed but no jest/vitest binary, no `"test"` script. Either add vitest and wire it, or remove this. |

### Packages confirmed in use (do not remove)

`@google/generative-ai`, `firebase`, `react`, `react-dom`, `katex` (used in
`StatementRenderer.tsx`), `react-markdown` (used in `CompasSidebar.tsx`),
`lucide-react` (icon library — verify active usage before removing).

### Note on `@vitejs/plugin-react` vs `@vitejs/plugin-react-swc`

Both are listed as devDependencies. Only one should be active in `vite.config.ts`.
Check which plugin is actually used and remove the other.

---

## Deletion Order (if you proceed)

Delete in this order to avoid cascading TypeScript errors mid-cleanup:

1. Delete `src/features/statistics/FrequencyExercise.tsx` first (breaks no live imports)
2. Delete `src/core/evaluation/OpenAnswerEvaluationEngine.ts`
3. Delete `src/domain/statistics/frequencyTableGenerator.ts`
4. Delete `src/services/ResponseValidator.ts`, `src/services/InteractionLogger.ts`, `src/services/GeminiClient.ts`
5. Delete `src/controllers/LLMController.ts`
6. Delete `src/api/compas.routes.ts`
7. Delete `src/index.ts`
8. Delete `src/types/index.ts`, `src/types/compas.ts`
9. Delete `src/core/logger.ts`
10. Delete `src/tests/ResponseValidator.test.ts`
11. Run `tsc --noEmit` to confirm zero type errors
12. Remove unused imports in live files (Section 5):
    - `CompasService.ts`: remove `CompasStateEngine` import (line 2) and `type MathArea` (line 11)
    - `ExerciseContainer.tsx`: remove `CompasLabLayout` import and legacy layout block when ready
13. Remove `server.proxy` block from `vite.config.ts`
14. Update `package.json`: rename `"la-matriu"` → `"compas"`, remove `express`/`cors`/`dotenv` and their `@types/*`
15. Fix `selectors.ts:81` comment ("Oracle" → "Compàs")
16. Run `npm install` and `vite build` to confirm clean build

---

## Total Reduction

| Category | Files | Approximate lines |
|----------|-------|------------------|
| Old backend cluster | 6 files | ~400 lines |
| Oracle-era component cluster | 3 files | ~600 lines |
| Old type definitions | 2 files | ~100 lines |
| Orphaned utilities | 2 files | ~80 lines |
| Dead code inside live files | — | ~30 lines |
| **Total** | **13 files** | **~1 200 lines** |

The codebase shrinks by roughly 15–20% in line count. More importantly, the
`src/oracle/` import error in `FrequencyExercise.tsx` is a latent compile bomb —
if TypeScript strict mode is ever tightened or that file is accidentally imported,
the build will fail.
