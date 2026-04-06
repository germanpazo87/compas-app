import React, { useState } from "react";
import type { ExerciseInstance, AnswerEvaluationResult } from "../../../core/ExerciseEngine";

interface MedianSolution {
  sortedSeries: number[];
  median: number;
}

interface Props {
  exercise: ExerciseInstance<MedianSolution, any>;
  onAnswerChange: (ans: unknown) => void;
  onSubmit: () => void;
  evaluationResult: AnswerEvaluationResult | null;
  loading: boolean;
}

export function MedianExercise({ exercise, onAnswerChange, onSubmit, evaluationResult, loading }: Props) {
  const [sortedInput, setSortedInput] = useState("");
  const [medianInput, setMedianInput] = useState("");

  const rawData = exercise.metadata.rawData as number[];

  const handleUpdate = (field: "sorted" | "median", value: string) => {
    let currentSortedStr = field === "sorted" ? value : sortedInput;
    let currentMedianStr = field === "median" ? value : medianInput;

    if (field === "sorted") setSortedInput(value);
    else setMedianInput(value);

    // Lògica de parseig corregida
    const parsedSorted = currentSortedStr
      .split(/[ ,\-]+/)
      .filter(part => part.trim() !== "")
      .map(part => Number(part.trim()))
      .filter(n => !isNaN(n));

    onAnswerChange({
      sortedSeries: parsedSorted,
      median: currentMedianStr === "" ? 0 : Number(currentMedianStr)
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 p-5 rounded-xl border border-purple-200 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-purple-800">Càlcul de la Mediana</h3>
          <span className="bg-purple-200 text-purple-800 text-xs font-bold px-2 py-1 rounded">SÈRIE SENAR</span>
        </div>
        <p className="text-gray-700 mb-4">{exercise.prompt}</p>
        
        <div className="flex flex-wrap gap-2 justify-center bg-white p-4 rounded-lg border border-purple-100 shadow-inner">
          {rawData.map((num, idx) => (
            <div key={idx} className="w-10 h-10 flex items-center justify-center bg-gray-50 border rounded-md font-mono text-lg font-bold text-gray-700">
              {num}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <span className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-xs">1</span>
          Ordena la sèrie de menor a major:
        </label>
        <input
          type="text"
          className="w-full border-2 border-gray-100 p-3 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all font-mono text-lg"
          placeholder="Ex: 1, 2, 5, 8, 11..."
          value={sortedInput}
          onChange={(e) => handleUpdate("sorted", e.target.value)}
        />
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <span className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-xs">2</span>
          Quin és el valor de la mediana?
        </label>
        <div className="flex justify-center">
          <input
            type="number"
            className="w-32 border-2 border-gray-100 p-4 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-center text-3xl font-bold text-purple-700"
            placeholder="?"
            value={medianInput}
            onChange={(e) => handleUpdate("median", e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:bg-gray-400"
      >
        {loading ? "Verificant..." : "Comprovar Mediana"}
      </button>

      {evaluationResult && (
        <div className={`p-4 rounded-xl border-2 flex items-start gap-4 ${
          evaluationResult.correct ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <div className="text-3xl">{evaluationResult.correct ? "🎯" : "🧐"}</div>
          <div className="flex-1">
            <h4 className="font-black uppercase tracking-wide text-sm mb-1">
              {evaluationResult.correct ? "Molt bé!" : "Cal revisar"}
            </h4>
            <p className="text-sm leading-relaxed">{evaluationResult.feedback}</p>
          </div>
        </div>
      )}
    </div>
  );
}