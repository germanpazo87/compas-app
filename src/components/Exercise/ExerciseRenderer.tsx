import React from "react";
import type { ExerciseInstance, AnswerEvaluationResult } from "../../core/ExerciseEngine";
import { FractionsExercise } from "./exercises/FractionsExercise";
import { CentralTendencyExercise } from "./exercises/CentralTendencyExercise";
import { FrequencyTableExercise } from "./exercises/FrequencyTableExercise";
import { MedianExercise } from "./exercises/MedianExercise"; 

interface ExerciseRendererProps {
  exercise: ExerciseInstance;
  userAnswer: unknown;
  onAnswerChange: (answer: unknown) => void;
  onSubmit: () => void;
  evaluationResult: AnswerEvaluationResult | null;
  loadingEvaluation: boolean;
}

export function ExerciseRenderer(props: ExerciseRendererProps) {
  
  // 1. FRACCIONS
  if (props.exercise.type === "fractions") {
    return <FractionsExercise {...props} />;
  }

  // 2. ESTADÍSTICA
  if (props.exercise.type === "statistics") {
    const subtype = (props.exercise.solution as any).subtype;

    switch (subtype) {
      
      // A. Tendència Central
      case "central_tendency":
        return (
          <CentralTendencyExercise 
            {...props} 
            loading={props.loadingEvaluation} 
            exercise={props.exercise as any} 
          />
        );
      
      // B. Taula de Freqüències
      case "frequency_table":
        return (
          <FrequencyTableExercise 
            exercise={props.exercise}
            userAnswer={props.userAnswer}
            onAnswerChange={props.onAnswerChange}
            onSubmit={props.onSubmit}
            evaluationResult={props.evaluationResult}
            loading={props.loadingEvaluation}
          />
        );

      // ✅ C. MEDIANA PAS A PAS (CORREGIT)
      // Ara passem explícitament 'loading' perquè el component fill ho rebi amb el nom que espera
      case "median_step_by_step":
        return (
          <MedianExercise 
            {...props} 
            loading={props.loadingEvaluation} 
            exercise={props.exercise as any} 
          />
        );

      // D. Conceptual
      case "conceptual":
        return (
          <div className="p-4 border rounded bg-white">
              <h3 className="font-bold mb-2">Pregunta Conceptual (Nivell 1)</h3>
              <p className="text-lg mb-4">{props.exercise.prompt}</p>
              <div className="flex flex-col gap-2">
                <input 
                  type="text" 
                  placeholder="Escriu la teva resposta..." 
                  className="p-2 border rounded"
                  onChange={(e) => props.onAnswerChange({ correctOptionId: e.target.value })}
                />
              </div>
              <button onClick={props.onSubmit} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded">Validar</button>
          </div>
        );

      // E. Dispersió
      case "dispersion":
          return <div>Exercici de Dispersió (Pendent d'implementar UI)</div>;

      default:
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
                Subtipus d'estadística no suportat encara: <strong>{subtype}</strong>
            </div>
        );
    }
  }

  return <div>Tipus d'exercici desconegut: {props.exercise.type}</div>;
}