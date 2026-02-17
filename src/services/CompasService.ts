import { GoogleGenerativeAI } from "@google/generative-ai";
import { CompasStateEngine } from "../core/compas/CompasStateEngine";
import { PromptBuilder } from "../core/compas/PromptBuilder";
import { type ExerciseInstance, ExerciseErrorType } from "../core/ExerciseEngine";
import { 
  type CompasLLMResponse, 
  type InterventionType, 
  type CognitiveTarget, 
  type ScaffoldingType 
} from "../core/llmContract";
import { type StudentModel, type MathArea } from "../studentModel/types";

// 🧠 IMPORTS DEL CERVELL CENTRAL
import { 
  integrityEngine, 
  decisionEngine, 
  retrievalScheduler, 
  graph 
} from "../core/compas/CompasContext";
import { generateCompasSystemPrompt } from "../studentModel/studentModelUpdater";

// 🌍 MAPA D'IDIOMES PER A GLOSEIG (CLIL)
const LANGUAGE_MAP: Record<string, string> = {
  'ca': 'Catalan',
  'es': 'Spanish',
  'en': 'English',
  'zh': 'Chinese (Simplified)',
  'ur': 'Urdu',
  'pa': 'Punjabi',
  'ar': 'Arabic',
  'rom': 'Romani',
  'ru': 'Russian',
  'pt': 'Portuguese',
  'fr': 'French'
};

// --- INTERFÍCIES DE TRAÇABILITAT (COMPÀS LAB / MATRIX) ---

export interface CompasSystemState {
  exercise: { id: string; competence: string; subtype: string; variableType: string; };
  student: { 
    hasAttempted: boolean; attemptNumber: number; isCorrect: boolean; 
    errorType: string; confidence: number; responseTime: string; 
  };
  mastery: { level: string; recentErrors: string[]; stabilityIndex: number; evidenceCount: number; };
  strategy: { mode: string; strategy: string; cognitiveTarget: string; intensity: string; };
}

export interface CompasDebugData {
  lastPrompt: string; 
  rawResponse: string; 
  mode: string; 
  context: any; 
  systemState: CompasSystemState;
}

export interface CompasServiceResponse {
  response: CompasLLMResponse; 
  debug: CompasDebugData;
}

interface AskParams {
  exercise: ExerciseInstance; 
  userAnswer?: any; 
  errorType?: ExerciseErrorType | undefined;
  attemptNumber: number; 
  studentModel: StudentModel; 
  studentMessage?: string | undefined;
  isCorrect: boolean;
  intent: 'exercise_help' | 'retrieval_trigger' | 'retrieval_evaluation';
  retrievalConcept?: string; // Opcional per quan NO és retrieval
  interactionMetrics?: { 
    timeSpentSeconds: number; 
    focusLostCount: number; 
    hintsOpened: number; 
  };
}

// --- CONFIGURACIÓ ---

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
  model: "gemini-3.0-flash", // ✅ El model correcte del 2026
}, {
  apiVersion: 'v1beta' // 👈 AFEGEIX AIXÒ: Forcem l'ús de l'API estable, on viu el model
});
// 🛡️ HELPER: Crea àrees buides per evitar crash
const createEmptyArea = (): any => ({
  mastery: false,
  competences: {
    calculation_specific: { performance: 0, medal: 'NONE', retrievalStrength: 0, stability: 0, lastReviewed: 0, attempts: 0, reliability: 1 },
    problem_solving_specific: { performance: 0, medal: 'NONE', retrievalStrength: 0, stability: 0, lastReviewed: 0, attempts: 0, reliability: 1 },
    conceptual: {}
  }
});

export const CompasService = {
  
  ask: async (params: AskParams): Promise<CompasServiceResponse> => {
    // 🕵️ DEBUG: INICI TRACE (Pas 1: Consola Neta)
    console.groupCollapsed(`🧭 COMPÀS SERVICE: ${params.intent.toUpperCase()}`);
    console.time("⏱️ Latencia total");

    // 🛡️ 1. CONTROL DE SEGURETAT BÀSIC
    if (!params || !params.exercise) {
      console.error("❌ Error CRÍTIC: Paràmetres undefined");
      console.groupEnd();
      return createFallbackResponse("Error intern: No he rebut dades.", "ERROR", params);
    }

    try { 

      // 🛡️ 2. SANITITZACIÓ PROFUNDA
      console.log("🛠️ Sanititzant model d'estudiant...");
      const safeStudentModel = params.studentModel ? { ...params.studentModel } : {} as StudentModel;
      
      if (!safeStudentModel.global) { (safeStudentModel as any).global = { reliability: 1, stability: 0, attempts: 0, lastEvocationScore: 0.5 }; }
      if (!safeStudentModel.profile) { (safeStudentModel as any).profile = { educationalLevel: "ESO1", preferredLanguage: "ca" }; }
      if (!safeStudentModel.areas) { (safeStudentModel as any).areas = { statistics: createEmptyArea(), arithmetic: createEmptyArea(), algebra: createEmptyArea() }; } 
      else {
        const areaKey = params.exercise.type === "statistics" ? "statistics" : "arithmetic";
        if (!(safeStudentModel.areas as any)[areaKey]) { (safeStudentModel.areas as any)[areaKey] = createEmptyArea(); }
      }

      // 🆕 LÒGICA D'IDIOMA I GLOSEIG (CLIL)
      const langCode = safeStudentModel.profile?.preferredLanguage || 'ca';
      const langName = LANGUAGE_MAP[langCode] || 'Catalan';
      
      let clilInstruction = "";
      if (langCode === 'ca') {
        clilInstruction = "- Idioma d'interacció: Català. Respon naturalment sense traduccions extres.";
      } else {
        clilInstruction = `
          - Idioma d'interacció: ${langName}. 
          - DIRECTIVA GLOSEIG (CLIL): L'alumne està en un entorn català. Respon en ${langName}, però quan utilitzis un TERME TÈCNIC (ex: average, frequency), posa el terme en ${langName} i, immediatament després, el terme equivalent en CATALÀ entre parèntesis.
        `;
      }

      // 🔍 DEBUG: MOSTRAR PERFIL
      console.groupCollapsed("👤 Estat de l'Estudiant i Evocació");
      console.log("Global:", safeStudentModel.global);
      console.log(`   - Última Evocació: ${safeStudentModel.global.lastEvocationTimestamp ? new Date(safeStudentModel.global.lastEvocationTimestamp).toLocaleString() : "MAI"}`);
      console.groupEnd();

      // --- FASE 1: ANÀLISI PEDAGÒGICA ---
      console.time("⏱️ Motors Pedagògics");
      
      const currentConceptId = params.exercise.type === "statistics" ? "mean" : "frequency_absolute";
      
      // A. INTEGRITY CHECK
      const integrityResult = integrityEngine.evaluate({
        conceptId: currentConceptId,
        correct: params.isCorrect,
        responseTimeSeconds: params.interactionMetrics?.timeSpentSeconds || 10, 
        focusLostCount: params.interactionMetrics?.focusLostCount || 0,
        area: params.exercise.type as any,
        competence: "calculation_specific",
        timestamp: Date.now()
      }, safeStudentModel);

      // B. DECISION ENGINE
      const decision = decisionEngine.decide({
        currentConceptId: currentConceptId,
        studentModel: safeStudentModel,
        conceptGraph: graph,
        lastPerformanceScore: params.isCorrect ? 1.0 : 0.0,
        currentTime: Date.now(),
        lastEvocationScore: safeStudentModel.global.lastEvocationScore || 0.5,
        config: { masteryThresholdHigh: 0.8, masteryThresholdLow: 0.3, retrievalThresholdLow: 0.4, stabilityThresholdLow: 0.5, spacedReviewIntervalMs: 86400000 }
      });

      console.groupCollapsed("🧠 Raonament del Motor");
      console.log("Mode:", decision.decision);
      console.groupEnd();

      console.timeEnd("⏱️ Motors Pedagògics");
      const finalMode = decision.decision;

      // --- FASE 2: EXECUCIÓ LLM ---
      console.log("🏗️ Construint Prompt...");

      // 🔥 PAS 3: DIETA DE L'ESTUDIANT
      const contextLleuger = {
        nivell: safeStudentModel.profile.educationalLevel,
        idioma: safeStudentModel.profile.preferredLanguage,
        fiabilitat: safeStudentModel.global.reliability
      };

      const systemInstruction = generateCompasSystemPrompt(safeStudentModel);

      // 🔥 PAS 2 + PAS 4: CONTEXT I INSTRUCCIONS DINÀMIQUES
      // Aquí definim QUÈ veu la IA i COM ha de comportar-se segons l'intent.
      
      let contextEspecífic = "";
      let missionInstructions = "";

      if (params.intent.startsWith('retrieval')) {
        // --- CAS A: RETRIEVAL (Activació) ---
        // 1. Amaguem l'exercici (Dieta de context)
        contextEspecífic = `
        --- 🛑 CONTEXT: MODE ACTIVACIÓ (RETRIEVAL) 🛑 ---
        * SITUACIÓ: L'alumne està fora de l'exercici. NO parlis de números ni taules.
        * OBJECTIU: Activar el concepte previ: "${params.retrievalConcept || 'Concepte General'}".
        * INPUT ALUMNE: "${params.studentMessage || 'Indicat pel sistema'}"
        `;

        // 2. Instruccions específiques (Pas 4)
        missionInstructions = `
        🎯 MISSIÓ (RETRIEVAL):
        - Sigues molt BREU i SOCRÀTIC.
        - Utilitza una metàfora simple si cal explicar el concepte.
        - 📊 SCORING: Avalua la qualitat conceptual de la resposta (0.0 a 1.0) al camp 'evocationQualityScore'.
        `;

      } else {
        // --- CAS B: EXERCICI (Ajuda) ---
        // 1. Enviem l'exercici complet
        contextEspecífic = PromptBuilder.build({
          exercise: params.exercise,
          mode: finalMode as any, 
          userAnswer: params.userAnswer,
          errorType: params.errorType,
          studentMessage: params.studentMessage,
          studentProfile: safeStudentModel.profile
        });

        // 2. Instruccions específiques (Pas 4)
        missionInstructions = `
        🎯 MISSIÓ (EXERCICI):
        - Fes SCAFFOLDING (bastida) pas a pas.
        - NO donis la solució directa. Guia l'alumne.
        - 📊 SCORING: Deixa el camp 'evocationQualityScore' a null. NO puntuis ara.
        `;
      }

      // 📝 PROMPT FINAL DINÀMIC
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

      console.groupCollapsed("📝 PROMPT FINAL ENVIAT");
      console.log(finalPrompt);
      console.groupEnd();

      console.time("⏱️ Latència Gemini API");
      const result = await model.generateContent(finalPrompt);
      const rawText = result.response.text();
      console.timeEnd("⏱️ Latència Gemini API");

      // --- PARSING & NORMALITZACIÓ ---
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : rawText;
      let parsed;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (e) {
        console.warn("⚠️ JSON invàlid de Gemini, usant fallback.");
        parsed = { message: rawText };
      }

      console.groupCollapsed("📩 Resposta Gemini (Parsed)");
      console.log(parsed);
      console.groupEnd();

      const finalResponse: CompasLLMResponse = {
        message: parsed.message || parsed.response_text || "Continua treballant.",
        interventionType: (parsed.interventionType as InterventionType) || finalMode,
        cognitiveTarget: (parsed.cognitiveTarget as CognitiveTarget) || "procedural",
        scaffolding_type: (parsed.scaffolding_type as ScaffoldingType) || "hint",
        keywords_ca: parsed.keywords_ca || [],
        evocationQualityScore: parsed.evocationQualityScore ?? null,
        timestamp: Date.now(),
        direct_answer_given: parsed.direct_answer_given || false,
        pedagogical_goal: parsed.pedagogical_goal || decision.reasoning
      };

      // --- FASE 3: TRAÇABILITAT (SNAPSHOT) ---
      
      const systemSnapshot: CompasSystemState = {
        exercise: {
          id: params.exercise.id || "unknown",
          competence: "calculation_specific",
          subtype: (params.exercise.solution as any)?.subtype || "unknown",
          variableType: "quantitative"
        },
        student: {
          hasAttempted: true,
          attemptNumber: params.attemptNumber,
          isCorrect: params.isCorrect,
          errorType: params.errorType || "NONE",
          confidence: parseFloat(integrityResult.score.toFixed(2)), 
          responseTime: `${params.interactionMetrics?.timeSpentSeconds.toFixed(1)}s`
        },
        mastery: {
          level: finalMode.includes("remediate") ? "CRITICAL" : "STABLE",
          recentErrors: integrityResult.flags,
          stabilityIndex: safeStudentModel.global?.stability || 0,
          evidenceCount: safeStudentModel.global?.attempts || 0
        },
        strategy: {
          mode: finalMode,
          strategy: decision.reasoning || "Automated decision",
          cognitiveTarget: finalResponse.cognitiveTarget,
          intensity: integrityResult.reliable ? "HIGH" : "LOW_TRUST"
        }
      };

      console.timeEnd("⏱️ Temps Total Servei");
      console.log("🎉 Petició completada.");

      return {
        response: finalResponse,
        debug: {
          lastPrompt: finalPrompt,
          rawResponse: rawText,
          mode: finalMode,
          context: params,
          systemState: systemSnapshot
        }
      };

    } catch (error: any) {
      console.error("🔥 EXCEPCIÓ al Compàs:", error);
      return createFallbackResponse(
        "S'ha produït un error de connexió.",
        "ERROR",
        params,
        "",
        `❌ ERROR API: ${error?.message || "Unknown"}`
      );
    } finally {
      // 🕵️ PAS 5: TANCAMENT DE SEGURETAT DE LA CONSOLA
      // Això s'executa sempre, tant si va bé com si falla.
      console.timeEnd("⏱️ Latencia total");
      console.groupEnd();
    }
  }
};

function createFallbackResponse(
  msg: string, 
  mode: any, 
  params: any, 
  prompt: string = "", 
  raw: string = ""
): CompasServiceResponse {
  return {
    response: {
      message: msg, interventionType: "scaffold_current", cognitiveTarget: "procedural",
      timestamp: Date.now(), scaffolding_type: "hint",
      keywords_ca: [], direct_answer_given: false, pedagogical_goal: "error_recovery",
      evocationQualityScore: null
    },
    debug: { lastPrompt: prompt, rawResponse: raw || "Error", mode: mode, context: params, systemState: {} as any }
  };
}