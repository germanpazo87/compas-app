You are helping me maintain a complex TypeScript adaptive learning system.
Be precise and respect architecture strictly.

PROJECT STRUCTURE (simplified):

src/
  decisionEngine/
    DecisionEngine.ts  → READ-ONLY pedagogical decisions
  studentModel/
    types.ts           → StudentModel definition
    studentModelUpdater.ts → ONLY module allowed to mutate StudentModel
    selectors.ts       → pure read-only derivations (unlocking, scaffolding)
  pedagogy/
    interactions/
      InteractionPolicy.ts
  oracle/
    contextBuilder.ts
    promptAssembler.ts
    OracleEngine.ts
  core/evaluation/
    OpenAnswerEvaluationEngine.ts
  dev/studentSimulator/

ARCHITECTURAL RULES:

1. DecisionEngine NEVER mutates StudentModel.
2. Only studentModelUpdater.ts modifies StudentModel.
3. selectors.ts contains only pure functions.
4. No UI logic inside engines.
5. No circular dependencies.
6. ES modules, strict TypeScript.

COGNITIVE MODEL:

- Concept-level mastery, stability, retrievalStrength.
- Area-level mastery (boolean).
- Competence: performance (0–1) + medal (boolean).
- Reliability score (0–1).

Never collapse these layers.

Before writing code:
1. State which existing file is affected.
2. State whether a new file is required.
3. Justify placement.
Then implement.
