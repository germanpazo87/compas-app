import React, { useState, useEffect, useRef } from 'react';
import  { type ExerciseUIState, type TFMExerciseContract, type ValidationResult } from './types';
import { StatementRenderer } from './StatementRenderer';
import { AnswerArea } from './AnswerArea';

// Serveis i Hooks
import { ExerciseService } from '../../services/ExerciseService';
import { useInteractionTracking } from '../../hooks/useInteractionTracking';

export const ExerciseScreen = ({ exerciseData }: { exerciseData: TFMExerciseContract }) => {
  // 1. Inicialització del Tracker i l'Estat
  const { metrics, recordInteraction } = useInteractionTracking();
  const firstInteraction = useRef<boolean>(false);

const [state, setState] = useState<ExerciseUIState>({
    inputValue: "",
    attempts: 0,
    status: "idle",
    metrics: metrics 
  });

  // 2. SENSORS DE TELEMETRIA (Dins del component)

  // Integrity tracking: Detecció de pèrdua de focus
  useEffect(() => {
    const handleBlur = () => {
      setState(prev => ({
        ...prev,
        metrics: { 
          ...prev.metrics, 
          focusLostCount: prev.metrics.focusLostCount + 1 
        }
      }));
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  // Latència cognitiva: Temps fins a la primera interacció
  const trackInteraction = () => {
    if (!firstInteraction.current) {
      const latency = Date.now() - state.metrics.startTime;
      setState(prev => ({
        ...prev,
        metrics: { ...prev.metrics, latencyMs: latency }
      }));
      firstInteraction.current = true;
      recordInteraction(); // Avisem al hook original
    }
  };

  // 3. LOGICA DE NEGOCI

  const handleType = (val: string) => {
    trackInteraction();
    setState(prev => ({ ...prev, inputValue: val, status: "typing" }));
  };

  const onValidate = async () => {
    if (!state.inputValue.trim() || state.status === "validating") return;

    // Preparem telemetria per a l'intent
    const currentMetrics = {
      ...state.metrics,
      totalTimeMs: Date.now() - state.metrics.startTime,
      attempts: state.attempts + 1
    };

    setState(prev => ({ ...prev, status: "validating" }));

    try {
      // Trucada al backend (Determinisme)
      const result: ValidationResult = await ExerciseService.validate({
        exerciseId: exerciseData.exerciseId,
        answer: state.inputValue,
        metrics: currentMetrics
      });

      // Actualitzem segons la teva nova taxonomia (isCorrect / status)
      setState(prev => ({
        ...prev,
        status: result.isCorrect ? "success" : "error",
        attempts: prev.attempts + 1,
        lastValidation: result,
        metrics: currentMetrics
      }));

    } catch (error) {
      console.error("Critical API Error:", error);
      setState(prev => ({ 
        ...prev, 
        status: "error",
        lastValidation: { 
          isCorrect: false,
          status: "incorrect",
          diagnostics: [{
            category: "UNKNOWN",
            severity: "error",
            message: "Error de connexió. Torna-ho a provar."
          }]
        }
      }));
    }
  };

  // 4. RENDERITZAT
  return (
    <div className="exercise-layout flex flex-col gap-6 p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      {/* Header d'estat per a recerca (Debug) */}
      <div className="flex justify-between text-xs font-mono text-gray-400 border-b pb-2">
        <span>ID: {exerciseData.exerciseId}</span>
        <span>Latència: {state.metrics.latencyMs}ms | Focus Perdut: {state.metrics.focusLostCount}</span>
      </div>

      <StatementRenderer content={exerciseData.statement} />

      <AnswerArea 
        value={state.inputValue}
        status={state.status}
        validation={state.lastValidation}
        onType={handleType}
        onValidate={onValidate}
      />

      {/* Condició per al botó del COMPÀS (IA) */}
      {state.attempts >= 2 && (
        <div className="compas-trigger mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in">
          <p className="text-sm text-blue-700 mb-2">Sembla que aquest exercici es resisteix...</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Demanar pista al COMPÀS 🧭
          </button>
        </div>
      )}
    </div>
  );
};