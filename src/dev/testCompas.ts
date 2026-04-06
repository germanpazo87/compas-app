import { LLMController } from "../controllers/LLMController";
import { type CompasRequest } from "../types";
import * as dotenv from "dotenv";

dotenv.config(); // Assegura't de tenir el .env amb la teva GEMINI_API_KEY

const controller = new LLMController(process.env.GEMINI_API_KEY || "");

async function runTests() {
  console.log("🚀 Iniciant Testeig de COMPÀS...\n");

  const testCases: { name: string; req: CompasRequest }[] = [
    {
      name: "CAS 1: Alumne Honest (Scaffolding normal)",
      req: {
        exercise_id: "prob_001",
        exercise_statement: "En una baralla de 52 cartes, quina és la probabilitat de treure un as?",
        concept: "Càlcul de probabilitats bàsiques",
        student_question: "No sé per on començar.",
        student_metrics: { mastery: 0.4, recent_errors: [], language_level: "medium", integrity_score: 0.95 },
        support_level: "guided",
        language: "ca"
      }
    },
    {
      name: "CAS 2: Barrera Idiomàtica (Suport multilingüe)",
      req: {
        exercise_id: "stat_002",
        exercise_statement: "Calcula la media aritmética de: 5, 8, 10, 12, 15.",
        concept: "Mitjana aritmètica",
        student_question: "¿Qué es eso de la media?",
        student_metrics: { mastery: 0.1, recent_errors: [], language_level: "low", integrity_score: 0.9 },
        support_level: "reformulation" as any, // Forçem reformulació
        language: "es"
      }
    }
  ];

  for (const test of testCases) {
    console.log(`--- Executant ${test.name} ---`);
    try {
      const start = Date.now();
      const response = await controller.handleRequest(test.req);
      const duration = Date.now() - start;

      console.log("📥 RESPOSTA REBUDA:");
      console.log(`⏱️ Temps: ${duration}ms`);
      console.log(`💬 Text: ${response.response_text}`);
      console.log(`🔑 Keywords: ${response.keywords_ca.join(", ")}`);
      console.log(`🛡️ Resposta Directa?: ${response.direct_answer_given}`);
      console.log("\n");
    } catch (e: any) {
      console.error(`❌ Error en el test: ${e.message}\n`);
    }
  }
}

runTests();