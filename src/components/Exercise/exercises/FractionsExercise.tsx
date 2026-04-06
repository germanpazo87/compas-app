import React, { useState } from "react";
import type { ExerciseInstance, AnswerEvaluationResult } from "../../../core/ExerciseEngine";
import { Calculator } from "../../tools/Calculator";
import { Calculator as CalcIcon } from "lucide-react";

interface FractionsExerciseProps {
  exercise: ExerciseInstance;
  userAnswer: unknown;
  onAnswerChange: (answer: unknown) => void;
  onSubmit: () => void;
  evaluationResult: AnswerEvaluationResult | null;
  loadingEvaluation: boolean;
}

export function FractionsExercise(props: FractionsExerciseProps) {
  const [showCalc, setShowCalc] = useState(false);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-blue-600">Exercici de Fraccions</h2>
        <button
          onClick={() => setShowCalc(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition border ${
            showCalc
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
          }`}
        >
          <CalcIcon size={13} />
          {showCalc ? 'Amagar' : 'Calculadora'}
        </button>
      </div>

      <p className="text-lg mb-6 font-medium">{props.exercise.prompt}</p>

      <div className="flex gap-4 items-center mb-4">
        <input
          type="text"
          className="border p-2 rounded w-40 text-center text-lg"
          value={(props.userAnswer as string) || ""}
          onChange={(e) => props.onAnswerChange(e.target.value)}
          placeholder="ex: 3/4"
        />
        <button 
          onClick={props.onSubmit} 
          disabled={props.loadingEvaluation}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {props.loadingEvaluation ? "Corregint..." : "Enviar"}
        </button>
      </div>

      {props.evaluationResult && (
        <div className={`p-4 rounded ${props.evaluationResult.correct ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {props.evaluationResult.feedback}
        </div>
      )}

      {showCalc && (
        <div className="mt-4">
          <Calculator variant="basic" onClose={() => setShowCalc(false)} />
        </div>
      )}
    </div>
  );
}