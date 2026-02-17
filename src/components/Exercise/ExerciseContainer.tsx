import React, { useState, useEffect } from "react";
import { 
  ExerciseErrorType, 
  type ExerciseInstance, 
  type AnswerEvaluationResult, 
  type ExerciseType 
} from "../../core/ExerciseEngine";
import type { CompasLLMResponse as CompasResponse } from "../../core/llmContract";
import type { StudentModel } from "../../studentModel/types";

// 🛡️ INTEGRACIÓ DE MÈTRIQUES I MODEL
import { useInteractionTracking } from "../../hooks/useInteractionTracking"; 
import { updateStudentState } from "../../studentModel/studentModelUpdater";
import { createNewStudentModel } from "../../studentModel/utils"; 
import { AuthService } from "../../services/AuthService";

// 🧠 INTEGRACIÓ DEL SCHEDULER
import { retrievalScheduler } from "../../core/compas/CompasContext";

// 1. Serveis
import { ExerciseService } from "../../services/ExerciseService";
import { CompasService } from "../../services/CompasService";

// 2. Components visuals
import { ExerciseRenderer } from "./ExerciseRenderer";
import { CompasSidebar } from "./CompasSidebar";

// 🛠️ IMPORTS DE LAYOUT
import { AppShell } from "../Layout/AppShell";
import { CompasLabLayout } from "../Debug/CompasLabLayout"; 

interface ExerciseContainerProps {
  student: StudentModel;
}

export function ExerciseContainer({ student }: ExerciseContainerProps) {
  
  // 🎛️ FEATURE FLAG
  const USE_LEGACY_LAYOUT = false; 

  const { metrics, recordInteraction } = useInteractionTracking(); 

  // 🆕 ESTAT DE L'ESTUDIANT
  const [studentState, setStudentState] = useState<StudentModel>(() => {
    return student || createNewStudentModel("temp_user");
  });

  const [exercise, setExercise] = useState<ExerciseInstance | null>(null);
  const [userAnswer, setUserAnswer] = useState<unknown>(null);
  const [evaluationResult, setEvaluationResult] = useState<AnswerEvaluationResult | null>(null);
  const [compasResponse, setCompasResponse] = useState<CompasResponse | null>(null);
  const [debugData, setDebugData] = useState<any>(null);

  // Estat local per al concepte actiu del Retrieval Scheduler
  const [activeRetrievalConcept, setActiveRetrievalConcept] = useState<string>("counting");

  const [loadingExercise, setLoadingExercise] = useState(false);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [loadingCompas, setLoadingCompas] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(0);

  const [currentTopic, setCurrentTopic] = useState("Estadística");
  const [currentLevelName, setCurrentLevelName] = useState("Selecció Inicial");

  // 🧠 ESTAT DE BLOQUEIG D'EVOCACIÓ
  const [isEvocationRequired, setIsEvocationRequired] = useState(false);

  // Sincronització amb el pare
  useEffect(() => {
    if (student) {
      setStudentState(prev => ({
        ...prev,
        ...student,
        global: { ...prev.global, ...student.global },
        areas: { ...prev.areas, ...student.areas }
      }));
    }
  }, [student]);

  // Neteja de xat en canvi d'exercici
  useEffect(() => {
    if (exercise) {
      if (!isEvocationRequired) {
        setCompasResponse(null); 
      }
    }
  }, [exercise?.id, isEvocationRequired]);

  /**
   * 🧠 TRIGGER PROACTIU: Genera la pregunta d'evocació sobre el concepte objectiu
   */
  const handleTriggerEvocationQuestion = async (conceptToRetrieve: string) => {
    setLoadingCompas(true);
    setActiveRetrievalConcept(conceptToRetrieve); // Guardem el concepte actiu
    
    try {
      const { response, debug } = await CompasService.ask({
        intent: 'retrieval_trigger', // 👈 INTENT: DISPARADOR
        retrievalConcept: conceptToRetrieve,
        exercise: { type: 'statistics', prompt: "Activació Cognitiva", id: "evocation", solution: {} } as any,
        userAnswer: null,
        attemptNumber: 0,
        isCorrect: false,
        studentModel: studentState,
        studentMessage: `[SYSTEM: L'alumne vol començar. ESTÀ BLOQUEJAT. Fes-li UNA pregunta conceptual breu d'evocació sobre: ${conceptToRetrieve}.]`,
        interactionMetrics: { timeSpentSeconds: 0, focusLostCount: 0, hintsOpened: 0 }
      });
      setCompasResponse(response);
      setDebugData(debug);
    } catch (error) {
      console.error("Error generant evocació:", error);
    } finally {
      setLoadingCompas(false);
    }
  };

  /**
   * 🗣️ HANDLER DE CONVERSA (XAT)
   * 🎯 GESTIONA TANT AJUDA D'EXERCICI COM AVALUACIÓ DE RETRIEVAL
   */
  const handleStudentReply = async (message: string) => {
    if (!exercise && !isEvocationRequired) return;
    
    setLoadingCompas(true);
    try {
      // 1. Tipat explícit per calmar a TypeScript
      const currentIntent: 'retrieval_evaluation' | 'exercise_help' = isEvocationRequired 
        ? 'retrieval_evaluation' 
        : 'exercise_help';
      
      // 2. Fallback a string buit ("") en lloc d'undefined per evitar l'error "exactOptionalPropertyTypes"
      const concept = isEvocationRequired ? activeRetrievalConcept : "";

      const { response, debug } = await CompasService.ask({
        intent: currentIntent, 
        retrievalConcept: concept, // 👈 ARA ÉS SEMPRE UN STRING
        exercise: exercise || ({ type: 'statistics', prompt: "Evocation Context", id: "evo", solution: {} } as any),
        userAnswer: userAnswer,
        attemptNumber: attemptNumber,
        isCorrect: false,
        errorType: evaluationResult?.error_type,
        studentModel: studentState,
        studentMessage: message,
        interactionMetrics: {
          timeSpentSeconds: metrics.latencyMs / 1000,
          focusLostCount: metrics.focusLostCount,
          hintsOpened: metrics.hintsOpened
        }
      });
      setCompasResponse(response);
      setDebugData(debug);

      // 🔓 LÒGICA DE DESBLOQUEIG (Només si estàvem bloquejats)
      if (isEvocationRequired) {
        console.log("🔓 Evocació realitzada. Analitzant qualitat...");
        
        // 1. Registrem l'èxit al Scheduler
        const unlockedStudent = retrievalScheduler.registerSuccessfulEvocation(studentState);
        
        // 2. Capturem la Qualitat Conceptual (Scoring)
        const quality = (response as any).evocationQualityScore ?? 0.0;
        
        // 3. Actualitzem el model global amb la nova nota
        if (!unlockedStudent.global) unlockedStudent.global = {} as any;
        unlockedStudent.global.lastEvocationScore = quality;
        
        console.log(`📊 Qualitat d'activació capturada per al motor: ${quality}`);

        setStudentState(unlockedStudent);
        setIsEvocationRequired(false); // Desbloquegem la UI
        await AuthService.saveProgress(unlockedStudent);
      }

    } catch (error) {
      console.error("Error en el xat:", error);
    } finally {
      setLoadingCompas(false);
    }
  };
  
  const handleUserInteraction = (val: any) => {
    if (isEvocationRequired) return; 
    recordInteraction();
    setUserAnswer(val);
  };

  /**
   * 🏗️ CÀRREGA D'EXERCICI AMB GATEKEEPER
   */
  async function loadExercise(type: ExerciseType, options?: any) {
    setLoadingExercise(true);
    setExercise(null);
    setUserAnswer(null);
    setEvaluationResult(null);
    setCompasResponse(null);
    setDebugData(null); 
    setAttemptNumber(0);

    // Breadcrumbs i Topic Labeling
    let topicLabel = "Estadística";
    if (type === "fractions") {
      setCurrentTopic("Aritmètica");
      topicLabel = "Aritmètica";
      setCurrentLevelName("Fraccions Bàsiques");
    } else if (type === "statistics") {
      setCurrentTopic("Estadística");
      const names: any = {
          "CONCEPTUAL": "Conceptes Clau",
          "BASIC_CALC": "Càlcul de Paràmetres",
          "MEDIAN_PRACTICE": "Practicar Mediana", // 🆕 Nom nou
          "FREQ_TABLE": "Taules de Freqüència",
          "CRITICAL_THINKING": "Anàlisi Crític"
      };
      setCurrentLevelName(names[options?.level] || "Entrenament General");
    }

    // 🧠 1. DETERMINEM EL CONCEPTE ACTUAL PER AL SCHEDULER
    const conceptId = type === 'statistics' ? 'mean' : 'frequency_absolute';

    // 🧠 2. CONSULTEM AL PORTER
    const decision = retrievalScheduler.shouldBlockForEvocation(studentState, conceptId);
    
    if (decision.shouldTrigger) {
      console.log(`🔒 BLOQUEIG ACTIU: ${decision.reason}`);
      setIsEvocationRequired(true);
      // Guardem el concepte que ha disparat el bloqueig
      handleTriggerEvocationQuestion(decision.conceptToRetrieve);
    } else {
      setIsEvocationRequired(false);
    }

    try {
      const ex = await ExerciseService.generate(type, options);
      setExercise(ex);
    } catch (error) {
      console.error("Error carregant exercici:", error);
    } finally {
      setLoadingExercise(false);
    }
  }

  /**
   * 🏗️ SUBMIT ANSWER: El punt on tota la matemàtica del model convergeix
   */
  async function submitAnswer() {
    if (!exercise || userAnswer === null) return;
    setLoadingEvaluation(true);
    try {
      const result = await ExerciseService.evaluate(exercise, userAnswer);
      setEvaluationResult(result);
      const newAttempt = attemptNumber + 1;
      setAttemptNumber(newAttempt);

      // Reliability Score
      const integrityScore = Math.max(0.1, Math.min(1, 1 - (metrics.focusLostCount * 0.2))); 
      
      const updatedModel = JSON.parse(JSON.stringify(studentState));
      const areaKey = exercise.type === 'statistics' ? 'statistics' : 'arithmetic'; 
      
      // 🎯 PIPELINE D'ACTUALITZACIÓ EN CASCADA
      updateStudentState(
        updatedModel, 
        areaKey, 
        'calculation_specific', 
        result.correct, 
        integrityScore 
      );
      
      // 🧠 INCREMENTEM COMPTADOR PER A LA SEGÜENT EVOCACIÓ
      const studentWithCounter = retrievalScheduler.incrementExerciseCount(updatedModel);
      
      setStudentState(studentWithCounter);
      await AuthService.saveProgress(studentWithCounter);
      
      console.log("💾 Progrés guardat. Mastery Actual:", studentWithCounter.areas[areaKey].competences.calculation_specific.performance);

      // 🆘 CRIDA AUTOMÀTICA AL TUTOR EN CAS D'ERROR
      if (!result.correct) {
        setLoadingCompas(true);
        try {
          const { response, debug } = await CompasService.ask({
            intent: 'exercise_help', // 👈 INTENT: AJUDA D'EXERCICI
            exercise: exercise, 
            userAnswer: userAnswer,
            errorType: (result.error_type ?? ExerciseErrorType.WRONG_RESULT),
            attemptNumber: newAttempt,
            isCorrect: result.correct,
            studentModel: studentWithCounter, 
            studentMessage: "Sense missatge",
            interactionMetrics: {
              timeSpentSeconds: metrics.latencyMs / 1000, 
              focusLostCount: metrics.focusLostCount,     
              hintsOpened: metrics.hintsOpened            
            }
          });
          setCompasResponse(response);
          setDebugData(debug);
        } catch (error) {
          console.error("Error en el flux del COMPÀS:", error);
        } finally {
          setLoadingCompas(false);
        }
      }
    } catch (error) {
      console.error("Error avaluant resposta:", error);
    } finally {
      setLoadingEvaluation(false);
    }
  }

  // ==================================================================================
  // 🚀 RENDERITZAT (GATEKEEPER UI)
  // ==================================================================================
  
  const renderExerciseArea = () => (
    <div className="relative">
       {/* 🔒 CAPA DE BLOQUEIG VISUAL */}
       {isEvocationRequired && (
         <div className="absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm bg-white/60 rounded-xl transition-all duration-500">
            <div className="bg-white p-6 rounded-2xl shadow-2xl border-2 border-indigo-500 max-w-md text-center transform scale-105">
               <div className="flex justify-center mb-4">
                 <div className="bg-indigo-100 p-3 rounded-full animate-bounce">
                   <span className="text-3xl">🧠</span>
                 </div>
               </div>
               <h3 className="text-xl font-bold text-indigo-900 mb-2">Activació Neuronal</h3>
               <p className="text-gray-600 mb-6">
                  El "Compàs" t'ha fet una pregunta al xat. <br/>
                  <span className="font-medium text-indigo-600">Respon-la per desbloquejar l'exercici.</span>
               </p>
               <div className="text-xs text-slate-400 font-mono bg-slate-100 py-2 px-4 rounded-full inline-block animate-pulse">
                  Esperant resposta al xat...
               </div>
            </div>
         </div>
       )}

       {/* ÀREA DE L'EXERCICI (Amb blur si està bloquejat) */}
       <div className={`transition-all duration-500 ${isEvocationRequired ? 'opacity-20 pointer-events-none filter blur-sm' : 'opacity-100'}`}>
          {!loadingExercise && exercise && (
             <ExerciseRenderer
               exercise={exercise}
               userAnswer={userAnswer}
               onAnswerChange={handleUserInteraction}
               onSubmit={submitAnswer}
               evaluationResult={evaluationResult}
               loadingEvaluation={loadingEvaluation}
             />
          )}
          
          {loadingExercise && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-pulse">
               <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
               <p>Dissenyant exercici a mida...</p>
            </div>
          )}

          {!loadingExercise && !exercise && (
             <div className="text-center py-32 text-gray-400">
                <p className="text-lg">Selecciona un mòdul o nivell per començar.</p>
             </div>
          )}
       </div>
    </div>
  );

  // Layout Legacy (Laboratori Matrix)
  if (USE_LEGACY_LAYOUT) {
    return (
      <CompasLabLayout debugData={debugData} exerciseState={exercise} studentState={studentState}>
        <div className="p-8 max-w-5xl mx-auto flex gap-6 min-h-screen items-start">
          <div className="flex-1 space-y-6">
            <div className="p-4 bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700">
               <div className="text-xs font-bold text-slate-400 mb-3 uppercase">Mode Laboratori</div>
               <div className="flex gap-2">
                 <button onClick={() => loadExercise("statistics")} className="bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-500 transition">Stats Random</button>
                 <button onClick={() => loadExercise("statistics", { level: "FREQ_TABLE" })} className="bg-emerald-600 px-3 py-1 rounded hover:bg-emerald-500 transition">Force Table</button>
               </div>
            </div>
            {renderExerciseArea()}
          </div>
          <div className="w-80 sticky top-4">
             <CompasSidebar 
               response={compasResponse} 
               loading={loadingCompas} 
               onClose={() => setCompasResponse(null)}
               onReply={handleStudentReply}
             />
          </div>
        </div>
      </CompasLabLayout>
    );
  }

  // Layout de Producció (AppShell)
  return (
    <AppShell 
      student={studentState} 
      breadcrumbs={[currentTopic, currentLevelName]} 
      onLogout={() => console.log("Logout placeholder")}
      sidebar={
        <CompasSidebar 
          response={compasResponse} 
          loading={loadingCompas} 
          onClose={() => setCompasResponse(null)}
          onReply={handleStudentReply}
        />
      }
    >
      <div className="mb-6 bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mòduls:</span>
           <button onClick={() => loadExercise("fractions")} className="px-3 py-1.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 border border-gray-200 transition">🍰 Fraccions</button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Nivells Estadística:</span>
           
           {/* ✅ 1. Conceptes (General) */}
           <button onClick={() => loadExercise("statistics", { level: "CONCEPTUAL" })} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 border border-indigo-200 transition whitespace-nowrap">1. Conceptes</button>
           
           {/* ✅ 2. Càlcul (Amb 50% de mediana) */}
           <button onClick={() => loadExercise("statistics", { level: "BASIC_CALC" })} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 border border-blue-200 transition whitespace-nowrap">2. Càlcul General</button>
           
           {/* 🔥 3. MEDIANA ESPECÍFICA (EL TEU NOU BOTÓ) */}
           <button onClick={() => loadExercise("statistics", { level: "MEDIAN_PRACTICE" })} className="px-3 py-1.5 bg-fuchsia-50 text-fuchsia-700 text-xs font-bold rounded-lg hover:bg-fuchsia-100 border border-fuchsia-200 ring-1 ring-fuchsia-300 transition whitespace-nowrap">🎯 Pràctica Mediana</button>
           
           {/* ✅ 4. Taules */}
           <button onClick={() => loadExercise("statistics", { level: "FREQ_TABLE" })} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 border border-emerald-200 transition whitespace-nowrap">4. Taules</button>
           
           {/* ✅ 5. Crítica */}
           <button onClick={() => loadExercise("statistics", { level: "CRITICAL_THINKING" })} className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg hover:bg-purple-100 border border-purple-200 transition whitespace-nowrap">5. Crítica</button>
        </div>
      </div>

      {/* RENDER DE L'ÀREA PRINCIPAL */}
      {renderExerciseArea()}

    </AppShell>
  );
}