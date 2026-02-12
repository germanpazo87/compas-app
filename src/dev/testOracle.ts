import { createOracleEngine } from "../oracle/OracleEngine";
import { generateFrequencyTable } from "../domain/statistics/frequencyTableGenerator";

export async function runTest() {
  console.log("🚀 DIAGNÒSTIC LA MATRIU EN MARXA...");
  
  // 1. Generem un dataset de prova (Fruites, esports, etc.)
  const dataset = generateFrequencyTable({ type: "qualitative" });
  console.log("📊 Dataset de prova generat:", dataset.variableName);

  // 2. Inicialitzem l'Oracle en mode MOCK (no gasta API)
  const oracle = createOracleEngine({ mockMode: true });

  // 3. Simulem un estat d'exercici
  const dummyState = {
    exerciseId: "TEST-001",
    milestone: "metadata_sync" as const,
    datasetSummary: dataset,
    studentInput: {},
    validationStatus: { isCorrect: false, errorCount: 0 },
    pedagogicalState: { autonomyLevel: "medium" as const },
    languageConfig: { 
        primaryLanguage: "ca" as const, 
        interactionLanguage: "es", 
        glossaryMode: true 
    }
  };

  // 4. Demanem a l'Oracle que ens ensenyi què diria
  const prompt = await oracle.generateOracleMessage(dummyState);
  
  console.log("🔮 L'ORACLE HA GENERAT EL PROMPT:");
  console.log("-----------------------------------------");
  console.log(prompt);
  console.log("-----------------------------------------");
}