import React, { useState } from "react";
import type { ExerciseInstance, AnswerEvaluationResult } from "../../../core/ExerciseEngine";
import { Calculator } from "../../tools/Calculator";
import { Calculator as CalcIcon } from "lucide-react";

interface PrerequisiteExerciseProps {
  exercise: ExerciseInstance;
  userAnswer: unknown;
  onAnswerChange: (answer: unknown) => void;
  onSubmit: () => void;
  evaluationResult: AnswerEvaluationResult | null;
  loadingEvaluation: boolean;
}

const HINT: Record<string, string> = {
  POWERS:     'Recorda: a² = a × a',
  SQRT:       'Recorda: √a és el nombre que multiplicat per ell mateix dóna a',
  PROPORTION: 'Recorda: producte en creu — a·d = b·c',
};

const CALC_VARIANT: Record<string, 'basic' | 'scientific'> = {
  POWERS:     'scientific',
  SQRT:       'scientific',
  PROPORTION: 'basic',
};

export function PrerequisiteExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  onSubmit,
  evaluationResult,
  loadingEvaluation,
}: PrerequisiteExerciseProps) {
  const meta = exercise.metadata as { level: string; statement: string };
  const [showCalc, setShowCalc] = useState(false);

  const hint        = HINT[meta.level] ?? '';
  const calcVariant = CALC_VARIANT[meta.level] ?? 'basic';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

      {/* ── Header + statement ── */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
            Prerequisit
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {meta.level}
          </span>
        </div>

        <p className="text-xl font-semibold text-gray-800 mb-4">{meta.statement}</p>

        {hint && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800">
            {hint}
          </div>
        )}
      </div>

      {/* ── Answer input ── */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700">
            La teva resposta:
          </label>
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

        <div className="flex gap-3 items-center">
          <input
            type="text"
            inputMode="decimal"
            value={(userAnswer as string) ?? ''}
            onChange={e => onAnswerChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loadingEvaluation && onSubmit()}
            placeholder="x = ?"
            disabled={loadingEvaluation}
            className={`border rounded-lg px-4 py-2 text-lg w-36 text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${
              evaluationResult
                ? evaluationResult.correct
                  ? 'border-green-400 bg-green-50'
                  : 'border-red-400 bg-red-50'
                : 'border-gray-300'
            }`}
          />
          <button
            onClick={onSubmit}
            disabled={loadingEvaluation || userAnswer === null || userAnswer === ''}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loadingEvaluation ? 'Comprovant...' : 'Comprova'}
          </button>
        </div>

        {showCalc && (
          <div className="mt-4">
            <Calculator
              variant={calcVariant}
              onResultReady={v => onAnswerChange(parseFloat(v))}
              onClose={() => setShowCalc(false)}
            />
          </div>
        )}

        {evaluationResult && (
          <div className={`mt-3 text-sm font-medium ${
            evaluationResult.correct ? 'text-green-600' : 'text-red-600'
          }`}>
            {evaluationResult.feedback}
          </div>
        )}
      </div>
    </div>
  );
}
