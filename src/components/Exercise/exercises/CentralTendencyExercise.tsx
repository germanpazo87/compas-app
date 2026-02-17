import React, { useState } from "react";
import type { ExerciseInstance, AnswerEvaluationResult } from "../../../core/ExerciseEngine";
import type { CentralTendencySolution } from "../../../domain/statistics/types";

interface Props {
  exercise: ExerciseInstance<CentralTendencySolution, any>;
  onAnswerChange: (ans: unknown) => void;
  onSubmit: () => void;
  evaluationResult: AnswerEvaluationResult | null;
  loading: boolean;
}

export function CentralTendencyExercise({ exercise, onAnswerChange, onSubmit, evaluationResult, loading }: Props) {
  // 1. Estat local per als inputs
  const [mean, setMean] = useState("");
  const [median, setMedian] = useState("");
  const [mode, setMode] = useState("");

  // 2. Extraiem les dades "raw" per mostrar-les
  const rawData = exercise.metadata.rawData as number[];

  // 3. Funció per actualitzar l'estat global quan l'usuari escriu
  const handleInputChange = (field: string, value: string) => {
    if (field === "mean") setMean(value);
    if (field === "median") setMedian(value);
    if (field === "mode") setMode(value);

    // Construïm l'objecte resposta que espera el backend
    // Nota: La moda pot ser múltiple, aquí assumim que l'usuari en posa una o separades per comes
    const modeArray = value.split(",").map(s => Number(s.trim())).filter(n => !isNaN(n));
    
    // Si estem tocant mode, usem modeArray, sinó el valor actual de mode
    const finalMode = field === "mode" ? modeArray : mode.split(",").map(s => Number(s.trim())).filter(n => !isNaN(n));

    onAnswerChange({
      mean: field === "mean" ? Number(value) : Number(mean),
      median: field === "median" ? Number(value) : Number(median),
      mode: finalMode
    });
  };

  return (
    <div className="space-y-6">
      {/* ENUNCIAT */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-bold text-blue-800 mb-2">Exercici de Centralització</h3>
        <p className="text-gray-700 mb-4">{exercise.prompt}</p>
        <div className="bg-white p-3 rounded border border-gray-300 font-mono text-lg tracking-wider text-center">
          [ {rawData.join(", ")} ]
        </div>
      </div>

      {/* FORMULARI RESPOSTA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Mitjana (Mean)</label>
          <input
            type="number"
            step="0.01"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ex: 5.4"
            value={mean}
            onChange={(e) => handleInputChange("mean", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Mediana</label>
          <input
            type="number"
            step="0.01"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ex: 5"
            value={median}
            onChange={(e) => handleInputChange("median", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Moda</label>
          <input
            type="text"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ex: 4 (o 4, 5)"
            value={mode}
            onChange={(e) => handleInputChange("mode", e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">Si n'hi ha més d'una, separa-les per comes.</p>
        </div>
      </div>

      {/* BOTÓ D'ACCIÓ */}
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:bg-gray-400"
      >
        {loading ? "Corregint..." : "Comprovar Resultats"}
      </button>

      {/* RESULTAT DE L'AVALUACIÓ */}
      {evaluationResult && (
        <div className={`p-4 rounded-lg border flex items-start gap-3 animate-fade-in ${
          evaluationResult.correct ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <div className="text-2xl">{evaluationResult.correct ? "🎉" : "⚠️"}</div>
          <div>
            <h4 className="font-bold">{evaluationResult.correct ? "Molt bé!" : "Hi ha errors"}</h4>
            <p>{evaluationResult.feedback}</p>
            {!evaluationResult.correct && evaluationResult.error_type && (
              <div className="text-xs font-mono mt-2 bg-white/50 p-1 rounded inline-block">
                Error Code: {evaluationResult.error_type}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}