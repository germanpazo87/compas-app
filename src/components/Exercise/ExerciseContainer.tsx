import React, { useState, useEffect, useRef } from "react";
import {
  ExerciseErrorType,
  type ExerciseInstance,
  type AnswerEvaluationResult,
  type ExerciseType
} from "../../core/ExerciseEngine";
import type { ExerciseStep, StepResult } from "../../core/ExerciseSteps";
import type { CompasLLMResponse as CompasResponse } from "../../core/llmContract";
import type { StudentModel } from "../../studentModel/types";
import { selectNextExercise, type GuidedTopic } from "../../pedagogy/GuidedModeEngine";
import { unifiedConceptGraph } from "../../pedagogy/conceptGraph";

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
  if (exercise.type === 'thales') {
    const level = (exercise.metadata as any)?.level as string | undefined;
    if (level === 'SIMILAR_ID') return 'statistics_conceptual'; // temporary; will be geometry_conceptual
    return 'problem_solving_specific';
  }
  if (exercise.type === 'pythagoras') {
    const level = (exercise.metadata as any)?.level as string | undefined;
    if (level === 'RIGHT_TRIANGLE_ID' || level === 'HYPOTENUSE_ID')
      return 'statistics_conceptual'; // temporary; will be geometry_conceptual
    if (level === 'PYTH_VERIFY') return 'problem_solving_specific';
    return 'calculation_specific';
  }
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

/**
 * Returns the concept graph node ID that corresponds to an exercise type + level.
 * Used by:
 *   - RetrievalScheduler.shouldBlockForEvocation() — which concept mastery to check
 *   - handleTriggerEvocationQuestion()             — what to ask about
 *
 * IDs must match nodes defined in src/pedagogy/conceptGraph/.
 */
function getConceptIdForExercise(type: ExerciseType, options?: any): string {
  if (type === 'fractions') return 'fractions';
  if (type === 'thales') {
    const level: string | undefined = options?.level;
    switch (level) {
      case 'TALES_BASIC':    return 'tales_basic';
      case 'TALES_SHADOWS':  return 'tales_shadows';
      case 'TALES_SCALE':    return 'tales_scale';
      case 'TALES_CONTEXT':  return 'tales_context';
      default:               return 'proportion';
    }
  }
  if (type === 'pythagoras') {
    const level: string | undefined = options?.level;
    switch (level) {
      case 'RIGHT_TRIANGLE_ID': return 'right_triangle_id';
      case 'HYPOTENUSE_ID':     return 'hypotenuse_id';
      case 'PYTH_HYPOTENUSE':   return 'pythagorean_basic';
      case 'PYTH_LEG':          return 'pythagorean_leg';
      case 'PYTH_VERIFY':       return 'pythagorean_verify';
      case 'PYTH_CONTEXT':      return 'pythagorean_context';
      default:                  return 'pythagorean_basic';
    }
  }
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
  const [activeRetrievalConcept, setActiveRetrievalConcept] = useState<string>("mean");

  const [loadingExercise, setLoadingExercise] = useState(false);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [loadingCompas, setLoadingCompas] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [llmInteractionCount, setLlmInteractionCount] = useState(0);

  const [currentTopic, setCurrentTopic] = useState("Estadística");
  const [currentLevelName, setCurrentLevelName] = useState("Selecció Inicial");

  // Step results accumulator — reset on each new exercise load
  const stepResultsRef = useRef<StepResult[]>([]);

  // 🧭 ESTAT DEL MODE (guiat vs lliure)
  const [exerciseMode, setExerciseMode] = useState<'guided' | 'free'>('free');

  // 🧠 ESTAT DE BLOQUEIG D'EVOCACIÓ
  const [isEvocationRequired, setIsEvocationRequired] = useState(false);

  // 🔬 DEV: bypass the evocation gate so exercises load immediately
  const [bypassEvocation, setBypassEvocation] = useState(false);

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
      setLlmInteractionCount(prev => prev + 1);
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
      setLlmInteractionCount(prev => prev + 1);

      // 🔓 LÒGICA DE DESBLOQUEIG (Només si estàvem bloquejats)
      if (isEvocationRequired) {
        console.log("🔓 Evocació realitzada. Analitzant qualitat...");

        // 1. Registrem l'èxit al Scheduler
        const unlockedStudent = retrievalScheduler.registerSuccessfulEvocation(studentState);

        // 2. Capturem la Qualitat Conceptual (Scoring)
        const quality = (response as any).evocationQualityScore ?? 0.0;

        // 3. Actualitzem el model global amb la nova nota i el comptador LLM
        if (!unlockedStudent.global) unlockedStudent.global = {} as any;
        unlockedStudent.global.lastEvocationScore = quality;
        unlockedStudent.global.llmInteractionsTotal =
          (unlockedStudent.global.llmInteractionsTotal || 0) + 1;

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
   * 📋 STEP ATTEMPT HANDLER
   * Called by PythagorasExercise on each step check.
   * Accumulates StepResults and triggers the Oracle on wrong answers.
   */
  const handleStepAttempt = async (data: {
    step: ExerciseStep;
    answer: string | number;
    correct: boolean;
    attemptsOnStep: number;
  }) => {
    stepResultsRef.current = [
      ...stepResultsRef.current,
      {
        stepId:        data.step.id,
        attempts:      data.attemptsOnStep + 1,
        correct:       data.correct,
        studentAnswer: data.answer,
        timeSeconds:   0,
      },
    ];

    if (!data.correct && exercise) {
      setLoadingCompas(true);
      try {
        const totalSteps = (exercise.metadata as any)?.steps?.length ?? 1;
        const { response, debug } = await CompasService.ask({
          intent: 'exercise_help',
          exercise,
          userAnswer: data.answer,
          errorType: ExerciseErrorType.WRONG_RESULT,
          attemptNumber: data.attemptsOnStep + 1,
          isCorrect: false,
          studentModel: studentState,
          studentMessage: "Sense missatge",
          currentStep: {
            stepId:         data.step.id,
            stepOrder:      data.step.order,
            totalSteps,
            instruction:    data.step.instruction,
            studentAnswer:  data.answer,
            attemptsOnStep: data.attemptsOnStep,
          },
          interactionMetrics: {
            timeSpentSeconds: metrics.latencyMs / 1000,
            focusLostCount:   metrics.focusLostCount,
            hintsOpened:      metrics.hintsOpened,
          },
        });
        setCompasResponse(response);
        setDebugData(debug);
        setLlmInteractionCount(prev => prev + 1);
      } catch (error) {
        console.error("Error en el flux del COMPÀS (step):", error);
      } finally {
        setLoadingCompas(false);
      }
    }
  };

  /**
   * 🏗️ CÀRREGA D'EXERCICI AMB GATEKEEPER
   */
  async function loadExercise(type: ExerciseType, options?: any, _mode: 'guided' | 'free' = 'free') {
    setExerciseMode(_mode);
    setLoadingExercise(true);
    setExercise(null);
    setUserAnswer(null);
    setEvaluationResult(null);
    setCompasResponse(null);
    setDebugData(null);
    setAttemptNumber(0);
    setLlmInteractionCount(0);
    stepResultsRef.current = [];

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
          "MEDIAN_PRACTICE": "Practicar Mediana",
          "FREQ_TABLE": "Taules de Freqüència",
          "CRITICAL_THINKING": "Anàlisi Crític"
      };
      setCurrentLevelName(names[options?.level] || "Entrenament General");
    } else if (type === "thales") {
      topicLabel = "Geometria";
      setCurrentTopic("Geometria");
      const levelNames: Record<string, string> = {
        PROPORTION_BASIC: "Proporcions bàsiques",
        TALES_BASIC:    "Tales bàsic",
        TALES_SHADOWS:  "Ombres i alçades",
        TALES_SCALE:    "Escales i plànols",
        TALES_CONTEXT:  "Aplicacions",
        SIMILAR_ID:     "Figures semblants",
      };
      setCurrentLevelName(levelNames[options?.level] ?? "Tales");
    } else if (type === "pythagoras") {
      topicLabel = "Geometria";
      setCurrentTopic("Geometria");
      const levelNames: Record<string, string> = {
        RIGHT_TRIANGLE_ID: "Identifica el triangle rectangle",
        HYPOTENUSE_ID:     "Identifica la hipotenusa",
        PYTH_HYPOTENUSE:   "Calcula la hipotenusa",
        PYTH_LEG:          "Calcula un catet",
        PYTH_VERIFY:       "Comprova si és rectangle",
        PYTH_CONTEXT:      "Aplicacions",
      };
      setCurrentLevelName(levelNames[options?.level] ?? "Pitàgores");
    }

    // 🧠 1. DETERMINEM EL CONCEPTE ACTUAL PER AL SCHEDULER
    const conceptId = getConceptIdForExercise(type, options);

    // 🧠 2. CONSULTEM AL PORTER (omès si el bypass de dev és actiu)
    if (bypassEvocation) {
      setIsEvocationRequired(false);
    } else {
      const decision = retrievalScheduler.shouldBlockForEvocation(studentState, conceptId);
      if (decision.shouldTrigger) {
        console.log(`🔒 BLOQUEIG ACTIU: ${decision.reason}`);
        setIsEvocationRequired(true);
        handleTriggerEvocationQuestion(decision.conceptToRetrieve);
      } else {
        setIsEvocationRequired(false);
      }
    }

    // Enrich options with student profile so generators can personalise output
    const enrichedOptions = {
      ...options,
      preferredLanguage: studentState.profile.preferredLanguage ?? 'ca',
      educationalLevel:  studentState.profile.educationalLevel  ?? 'GES1',
    };

    try {
      const ex = await ExerciseService.generate(type, enrichedOptions);
      setExercise(ex);
    } catch (error) {
      console.error("Error carregant exercici:", error);
    } finally {
      setLoadingExercise(false);
    }
  }

  /**
   * 🧭 MODE GUIAT: Selecciona el nivell òptim basat en el model de l'alumne
   */
  function loadGuidedExercise(topic: GuidedTopic) {
    const selection = selectNextExercise(topic, studentState, unifiedConceptGraph);
    console.log(`🧭 Mode guiat → ${selection.conceptId} (reason: ${selection.reason})`);
    loadExercise(selection.exerciseType, { level: selection.level }, 'guided');
  }

  /**
   * 🏗️ SUBMIT ANSWER: El punt on tota la matemàtica del model convergeix
   */
  async function submitAnswer() {
    if (!exercise || userAnswer === null) return;
    setLoadingEvaluation(true);

    // Captura el comptador LLM actual com a valor local per evitar problemes d'estat async
    let llmCountThisExercise = llmInteractionCount;

    try {
      const result = await ExerciseService.evaluate(exercise, userAnswer);
      setEvaluationResult(result);
      const newAttempt = attemptNumber + 1;
      setAttemptNumber(newAttempt);

      // Reliability Score
      const integrityScore = Math.max(0.1, Math.min(1, 1 - (metrics.focusLostCount * 0.2)));

      const updatedModel = JSON.parse(JSON.stringify(studentState));
      const areaKey = exercise.type === 'statistics'  ? 'statistics'
                    : exercise.type === 'thales'       ? 'geometry'
                    : exercise.type === 'pythagoras'   ? 'geometry'
                    : 'arithmetic';

      // 📊 CAPTURA MASTERY BEFORE (abans d'actualitzar el model)
      const competenceId = getCompetenceId(exercise);
      const masteryBefore: number | null = (() => {
        const area = updatedModel.areas[areaKey];
        if (!area) return null;
        if (competenceId === 'calculation_specific' || competenceId === 'problem_solving_specific') {
          return area.competences[competenceId]?.performance ?? null;
        }
        return area.competences.conceptual[competenceId]?.performance ?? null;
      })();

      // 🎯 PIPELINE D'ACTUALITZACIÓ EN CASCADA
      updateStudentState(updatedModel, areaKey, competenceId, result.correct, integrityScore);

      // 🧠 INCREMENTEM COMPTADOR PER A LA SEGÜENT EVOCACIÓ
      const studentWithCounter = retrievalScheduler.incrementExerciseCount(updatedModel);

      // 📊 CAPTURA MASTERY AFTER
      const masteryAfter: number | null = (() => {
        const area = studentWithCounter.areas[areaKey];
        if (!area) return null;
        if (competenceId === 'calculation_specific' || competenceId === 'problem_solving_specific') {
          return area.competences[competenceId]?.performance ?? null;
        }
        return area.competences.conceptual[competenceId]?.performance ?? null;
      })();

      // 🆘 CRIDA AUTOMÀTICA AL TUTOR EN CAS D'ERROR
      if (!result.correct) {
        setLoadingCompas(true);
        try {
          const { response, debug } = await CompasService.ask({
            intent: 'exercise_help',
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
          llmCountThisExercise += 1;
          setLlmInteractionCount(prev => prev + 1);
        } catch (error) {
          console.error("Error en el flux del COMPÀS:", error);
        } finally {
          setLoadingCompas(false);
        }
      }

      // Actualitzem el comptador global LLM acumulat al model
      studentWithCounter.global.llmInteractionsTotal =
        (studentWithCounter.global.llmInteractionsTotal || 0) + llmCountThisExercise;

      setStudentState(studentWithCounter);
      await AuthService.saveProgress(studentWithCounter);

      const updatedComp = competenceId === 'calculation_specific' || competenceId === 'problem_solving_specific'
        ? studentWithCounter.areas[areaKey].competences[competenceId as 'calculation_specific' | 'problem_solving_specific']
        : studentWithCounter.areas[areaKey].competences.conceptual[competenceId];
      console.log(`💾 Progrés guardat [${competenceId}]. Mastery: ${updatedComp?.performance?.toFixed(3)}`);

      // 📝 SESSION LOG (aïllat: un error aquí no trenca el flux principal)
      try {
        const hasSteps = Array.isArray((exercise.metadata as any)?.steps) &&
          (exercise.metadata as any).steps.length > 0;

        await AuthService.writeSessionLog(studentWithCounter.id, {
          studentId: studentWithCounter.id,
          timestamp: Date.now(),
          block: exercise.type === 'statistics'  ? 'statistics'
               : exercise.type === 'thales'      ? 'thales'
               : exercise.type === 'pythagoras'  ? 'pythagoras'
               : 'arithmetic',
          exerciseType: exercise.type,
          exerciseLevel: (exercise.metadata as any)?.level ?? null,
          attemptCount: newAttempt,
          llmInteractionCount: llmCountThisExercise,
          timeSeconds: metrics.latencyMs > 0 ? metrics.latencyMs / 1000 : null,
          masteryBefore,
          masteryAfter,
          masteryDelta: masteryAfter !== null && masteryBefore !== null
            ? parseFloat((masteryAfter - masteryBefore).toFixed(4))
            : null,
          evocationScore: studentWithCounter.global.lastEvocationScore ?? null,
          condition: null,
          ...(hasSteps ? {
            stepsCompleted:    stepResultsRef.current.filter(r => r.correct).length,
            stepResults:       stepResultsRef.current,
            totalStepAttempts: stepResultsRef.current.reduce((s, r) => s + r.attempts, 0),
          } : {}),
        });
      } catch (logError) {
        console.warn("⚠️ Session log write failed (non-critical):", logError);
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
               onStepAttempt={handleStepAttempt}
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
      <div className="mb-6 bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-center gap-4">
        {/* Mode adaptatiu (guiat) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Adaptatiu:</span>
          <button onClick={() => loadGuidedExercise('thales')} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition whitespace-nowrap">🎯 Tales (guiat)</button>
          <button onClick={() => loadGuidedExercise('pythagoras')} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition whitespace-nowrap">🎯 Pitàgores (guiat)</button>
        </div>
        <span className="text-xs text-gray-300">|</span>

        {/* Fraccions */}
        <div className="flex items-center gap-3">
           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mòduls:</span>
           <button onClick={() => loadExercise("fractions")} className="px-3 py-1.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 border border-gray-200 transition">🍰 Fraccions</button>
        </div>

        {/* Estadística */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Estadística:</span>
           <button onClick={() => loadExercise("statistics", { level: "CONCEPTUAL" })} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 border border-indigo-200 transition whitespace-nowrap">1. Conceptes</button>
           <button onClick={() => loadExercise("statistics", { level: "BASIC_CALC" })} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 border border-blue-200 transition whitespace-nowrap">2. Càlcul General</button>
           <button onClick={() => loadExercise("statistics", { level: "MEDIAN_PRACTICE" })} className="px-3 py-1.5 bg-fuchsia-50 text-fuchsia-700 text-xs font-bold rounded-lg hover:bg-fuchsia-100 border border-fuchsia-200 ring-1 ring-fuchsia-300 transition whitespace-nowrap">🎯 Pràctica Mediana</button>
           <button onClick={() => loadExercise("statistics", { level: "FREQ_TABLE" })} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 border border-emerald-200 transition whitespace-nowrap">4. Taules</button>
           <button onClick={() => loadExercise("statistics", { level: "CRITICAL_THINKING" })} className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg hover:bg-purple-100 border border-purple-200 transition whitespace-nowrap">5. Crítica</button>
        </div>

        {/* Geometria — Tales */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Geometria:</span>
           <button onClick={() => loadExercise("thales", { level: "TALES_BASIC" })} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 border border-amber-200 transition whitespace-nowrap">📐 Tales bàsic</button>
           <button onClick={() => loadExercise("thales", { level: "TALES_SHADOWS" })} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 border border-amber-200 transition whitespace-nowrap">🌤 Ombres</button>
           <button onClick={() => loadExercise("thales", { level: "TALES_SCALE" })} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 border border-amber-200 transition whitespace-nowrap">🗺 Escales</button>
        </div>

        {/* Geometria — Pitàgores */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Pitàgores:</span>
           <button onClick={() => loadExercise("pythagoras", { level: "RIGHT_TRIANGLE_ID" })} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 border border-green-200 transition whitespace-nowrap">🔺 Identifica</button>
           <button onClick={() => loadExercise("pythagoras", { level: "HYPOTENUSE_ID" })} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 border border-green-200 transition whitespace-nowrap">📐 Hipotenusa ID</button>
           <button onClick={() => loadExercise("pythagoras", { level: "PYTH_HYPOTENUSE" })} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 border border-green-200 transition whitespace-nowrap">📐 Hipotenusa</button>
           <button onClick={() => loadExercise("pythagoras", { level: "PYTH_LEG" })} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 border border-green-200 transition whitespace-nowrap">📏 Catet</button>
           <button onClick={() => loadExercise("pythagoras", { level: "PYTH_VERIFY" })} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 border border-green-200 transition whitespace-nowrap">✓ Comprova</button>
           <button onClick={() => loadExercise("pythagoras", { level: "PYTH_CONTEXT" })} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 border border-green-200 transition whitespace-nowrap">🏙 Aplicació</button>
        </div>

        {/* 🔬 DEV: bypass evocation gate */}
        <div className="ml-auto">
          <button
            onClick={() => setBypassEvocation(v => !v)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${
              bypassEvocation
                ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                : 'bg-white text-amber-700 border-amber-400 hover:bg-amber-50'
            }`}
          >
            {bypassEvocation ? '🔬 Desactiva evocació' : '🔬 Mode test'}
          </button>
        </div>
      </div>

      {/* 🧭 MODE CHIP */}
      {exercise && (
        <div className="mb-3">
          {exerciseMode === 'guided'
            ? <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">🧭 Mode adaptatiu</span>
            : <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-medium">🔓 Mode lliure</span>
          }
        </div>
      )}

      {/* RENDER DE L'ÀREA PRINCIPAL */}
      {renderExerciseArea()}

    </AppShell>
  );
}