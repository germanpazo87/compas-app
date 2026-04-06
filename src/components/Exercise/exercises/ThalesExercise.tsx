import React, { useState } from "react";
import type { ExerciseInstance, AnswerEvaluationResult } from "../../../core/ExerciseEngine";
import { TalesDiagram } from "../../geometry/TalesSVG";
import type { TalesDiagramType } from "../../geometry/TalesSVG";
import { Calculator } from "../../tools/Calculator";
import { Calculator as CalcIcon } from "lucide-react";

interface ThalesExerciseProps {
  exercise: ExerciseInstance;
  userAnswer: unknown;
  onAnswerChange: (answer: unknown) => void;
  onSubmit: () => void;
  evaluationResult: AnswerEvaluationResult | null;
  loadingEvaluation: boolean;
}

/**
 * Renders *(catalan term)* markers as italic inline spans.
 * Input: "Three lines *(rectes paral·leles)* cut by..."
 */
function renderGlossed(text: string): React.ReactNode {
  const parts = text.split(/(\*\([^)]+\)\*)/g);
  return parts.map((part, i) => {
    const match = part.match(/^\*\(([^)]+)\)\*$/);
    if (match) {
      return <em key={i} className="text-indigo-600 not-italic font-medium">({match[1]})</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function ThalesExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  onSubmit,
  evaluationResult,
  loadingEvaluation,
}: ThalesExerciseProps) {
  const meta = exercise.metadata as {
    level: string;
    diagramType: TalesDiagramType | null;
    svgParams: Record<string, any>;
    statementCatalan: string;
    statementTranslated: string | null;
    tolerance: number;
  };

  const [showDiagram, setShowDiagram] = useState(true);
  const [showCalc, setShowCalc] = useState(false);

  const hasDiagram = meta.diagramType !== null && Object.keys(meta.svgParams ?? {}).length > 0;

  // Build TalesDiagram props from svgParams + diagramType
  function buildDiagramProps() {
    if (!meta.diagramType || !meta.svgParams) return null;
    return { type: meta.diagramType, ...meta.svgParams } as any;
  }

  const diagramProps = buildDiagramProps();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* ── Statement ── */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Teorema de Tales
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {meta.level?.replace('_', ' ')}
          </span>
        </div>

        {/* Catalan statement */}
        <p className="text-base text-gray-800 leading-relaxed mb-3">
          {meta.statementCatalan || exercise.prompt}
        </p>

        {/* Translated statement (if present) */}
        {meta.statementTranslated && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-sm text-gray-700 leading-relaxed">
            {renderGlossed(meta.statementTranslated)}
          </div>
        )}
      </div>

      {/* ── Diagram ── */}
      {hasDiagram && (
        <div className="border-t border-gray-100">
          <div className="flex items-center justify-between px-6 py-2 bg-gray-50">
            <span className="text-xs text-gray-500 font-medium">Diagrama</span>
            <button
              onClick={() => setShowDiagram(v => !v)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
            >
              {showDiagram ? 'Amaga el diagrama' : 'Mostra el diagrama'}
            </button>
          </div>
          {showDiagram && diagramProps && (
            <div className="px-6 py-4 flex justify-center">
              <TalesDiagram {...diagramProps} />
            </div>
          )}
        </div>
      )}

      {/* ── Answer input ── */}
      <div className="p-6 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
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
            className={`border rounded-lg px-4 py-2 text-lg w-36 text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${
              evaluationResult
                ? evaluationResult.correct
                  ? 'border-green-400 bg-green-50'
                  : 'border-red-400 bg-red-50'
                : 'border-gray-300'
            }`}
            value={(userAnswer as string) ?? ''}
            onChange={e => onAnswerChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loadingEvaluation && onSubmit()}
            placeholder="x = ?"
            disabled={loadingEvaluation}
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
              variant="basic"
              onResultReady={(v) => onAnswerChange(parseFloat(v))}
              onClose={() => setShowCalc(false)}
            />
          </div>
        )}

        {/* Feedback */}
        {evaluationResult && (
          <div className={`mt-3 text-sm font-medium ${evaluationResult.correct ? 'text-green-600' : 'text-red-600'}`}>
            {evaluationResult.feedback}
          </div>
        )}
      </div>
    </div>
  );
}
