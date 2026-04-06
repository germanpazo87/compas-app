import React, { useState, useEffect } from "react";
import type { ExerciseInstance, AnswerEvaluationResult } from "../../../core/ExerciseEngine";
// Assegura't d'importar els tipus del domini estadístic
import type { CentralTendencySolution } from "../../../domain/statistics/types";

interface FrequencyExerciseProps {
  exercise: ExerciseInstance;
  userAnswer: unknown;
  onAnswerChange: (answer: unknown) => void;
  onSubmit: () => void;
  evaluationResult: AnswerEvaluationResult | null;
  loadingEvaluation: boolean;
}

export function FrequencyExercise(props: FrequencyExerciseProps) {
  // Estat local per gestionar els 3 camps abans d'enviar-ho al pare
  const [inputs, setInputs] = useState({
    mean: "",
    median: "",
    mode: ""
  });

  // Quan canviem els inputs locals, actualitzem l'estat global "userAnswer"
  useEffect(() => {
    props.onAnswerChange({
      mean: parseFloat(inputs.mean), // Convertim a número
      median: parseFloat(inputs.median),
      mode: [parseFloat(inputs.mode)] // Assumim una sola moda per simplificar UI
    });
  }, [inputs]);

  const handleChange = (field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  // Recuperem les dades raw (els números de l'enunciat)
  const rawData = (props.exercise.metadata as any).rawData || [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-green-200">
      <h2 className="text-xl font-bold mb-4 text-green-700">Estadística: Centralització</h2>
      
      <div className="bg-gray-50 p-4 rounded mb-6 border border-gray-200">
        <p className="text-sm text-gray-500 mb-2">Dades observades:</p>
        <div className="font-mono text-lg tracking-wider">
          [{rawData.join(", ")}]
        </div>
        <p className="mt-4 text-gray-800">{props.exercise.prompt}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mitjana (Mean)</label>
          <input
            type="number"
            step="0.01"
            className="border p-2 rounded w-full"
            value={inputs.mean}
            onChange={(e) => handleChange("mean", e.target.value)}
            placeholder="Ex: 5.5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mediana</label>
          <input
            type="number"
            step="0.01"
            className="border p-2 rounded w-full"
            value={inputs.median}
            onChange={(e) => handleChange("median", e.target.value)}
            placeholder="Ex: 5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Moda</label>
          <input
            type="number"
            className="border p-2 rounded w-full"
            value={inputs.mode}
            onChange={(e) => handleChange("mode", e.target.value)}
            placeholder="Ex: 4"
          />
        </div>
      </div>
      
      <button 
        onClick={props.onSubmit} 
        disabled={props.loadingEvaluation}
        className="w-full bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:bg-gray-400 font-semibold transition-colors"
      >
        {props.loadingEvaluation ? "Verificant càlculs..." : "Enviar Respostes"}
      </button>

      {props.evaluationResult && (
        <div className={`mt-4 p-4 rounded border ${props.evaluationResult.correct ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <div className="font-bold">{props.evaluationResult.correct ? "✅ Correcte!" : "❌ Incorrecte"}</div>
          <div>{props.evaluationResult.feedback}</div>
        </div>
      )}
    </div>
  );
}