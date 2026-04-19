import React, { useState, useRef, useMemo } from "react";
import type { ExerciseInstance, AnswerEvaluationResult } from "../../../core/ExerciseEngine";
import { TalesDiagram } from "../../geometry/TalesSVG";
import type { TalesDiagramType } from "../../geometry/TalesSVG";
import type { ExerciseStep, StepResult } from "../../../core/ExerciseSteps";
import { Calculator } from "../../tools/Calculator";
import { Calculator as CalcIcon } from "lucide-react";

interface ThalesExerciseProps {
  exercise: ExerciseInstance;
  userAnswer: unknown;
  onAnswerChange: (answer: unknown) => void;
  onSubmit: () => void;
  evaluationResult: AnswerEvaluationResult | null;
  loadingEvaluation: boolean;
  onStepAttempt?: (data: {
    step: ExerciseStep;
    answer: string | number;
    correct: boolean;
    attemptsOnStep: number;
  }) => void;
}

// ── Stepped UI (TALES_BASIC) ───────────────────────────────────────────────────

interface TalesSteppedUIProps {
  steps: ExerciseStep[];
  svgParams: Record<string, any>;
  diagramType: string | null;
  statementCatalan: string;
  statementTranslated: string | null;
  correctAnswer: number;
  onAnswerChange: (answer: unknown) => void;
  onSubmit: () => void;
  evaluationResult: AnswerEvaluationResult | null;
  loadingEvaluation: boolean;
  onStepAttempt?: ThalesExerciseProps['onStepAttempt'];
}

function TalesSteppedUI({
  steps,
  svgParams,
  diagramType,
  statementCatalan,
  statementTranslated,
  correctAnswer,
  onAnswerChange,
  onSubmit,
  evaluationResult,
  loadingEvaluation,
  onStepAttempt,
}: TalesSteppedUIProps) {
  const [stepIndex,          setStepIndex]          = useState(0);
  const [stepAnswer,         setStepAnswer]         = useState<string>('');
  const [crossAnswers,       setCrossAnswers]       = useState<Record<string, string>>({});
  const [labelAnswers,       setLabelAnswers]       = useState<Record<string, string>>({});
  const [selectedProportion, setSelectedProportion] = useState('');
  const [stepAttempts, setStepAttempts] = useState(0);
  const [showHint,     setShowHint]     = useState(false);
  const [stepFeedback, setStepFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [allComplete,  setAllComplete]  = useState(false);
  const [showCalc,     setShowCalc]     = useState(false);

  const collectedResults = useRef<StepResult[]>([]);
  const stepStartTime    = useRef<number>(Date.now());

  const step       = steps[stepIndex];
  const totalSteps = steps.length;
  const isLocked   = stepFeedback === 'correct';

  // Reveal the unknown value in the SVG from step 3 (proportion) onwards.
  // For shadow and inaccessible: steps 1-2 are identification/labelling —
  // keep 'x' hidden until step 3 (index 2). For classic: always reveal.
  const revealThreshold = (diagramType === 'shadow' || diagramType === 'inaccessible') ? 2 : 0;
  const showActualValues = stepIndex >= revealThreshold;
  const displaySvgParams = showActualValues
    ? {
        ...svgParams,
        segmentA: svgParams.segmentA === 'x' ? correctAnswer : svgParams.segmentA,
        segmentB: svgParams.segmentB === 'x' ? correctAnswer : svgParams.segmentB,
        segmentC: svgParams.segmentC === 'x' ? correctAnswer : svgParams.segmentC,
        segmentD: svgParams.segmentD === 'x' ? correctAnswer : svgParams.segmentD,
        seg1: svgParams.seg1 === 'x' ? correctAnswer : svgParams.seg1,
        seg2: svgParams.seg2 === 'x' ? correctAnswer : svgParams.seg2,
        seg3: svgParams.seg3 === 'x' ? correctAnswer : svgParams.seg3,
        seg4: svgParams.seg4 === 'x' ? correctAnswer : svgParams.seg4,
      }
    : svgParams;

  // Shuffle segment option values once per step (for label_segments dropdowns)
  const shuffledSegmentValues = useMemo(() => {
    const opts = step.segmentOptions ?? [];
    const vals = opts.map(o => o.correctValue);
    for (let i = vals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [vals[i], vals[j]] = [vals[j], vals[i]];
    }
    return vals;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  function advanceMainStep() {
    if (stepIndex + 1 < totalSteps) {
      setStepIndex(i => i + 1);
      setStepAnswer('');
      setCrossAnswers({});
      setLabelAnswers({});
      setStepAttempts(0);
      setShowHint(false);
      setStepFeedback(null);
      setShowCalc(false);
      stepStartTime.current = Date.now();
    } else {
      setAllComplete(true);
      onAnswerChange(correctAnswer);
      onSubmit();
    }
  }

  function evaluateStep(): boolean {
    switch (step.type) {
      case 'select_option': {
        const valid = step.correctAnswers ?? [String(step.correctAnswer)];
        return valid.includes(stepAnswer);
      }
      case 'label_segments': {
        const opts = step.segmentOptions ?? [];
        return opts.length > 0 && opts.every(o => labelAnswers[o.id] === o.correctValue);
      }
      case 'cross_product': {
        const [ca, cb, cc, cd] = String(step.correctAnswer).split('|').map(s => s.trim());
        const sL0 = crossAnswers.lhs1?.trim() ?? '';
        const sL1 = crossAnswers.lhs2?.trim() ?? '';
        const sR0 = crossAnswers.rhs1?.trim() ?? '';
        const sR1 = crossAnswers.rhs2?.trim() ?? '';
        const leftOk  = (sL0 === ca && sL1 === cb) || (sL0 === cb && sL1 === ca);
        const rightOk = (sR0 === cc && sR1 === cd) || (sR0 === cd && sR1 === cc);
        const swapLeftOk  = (sL0 === cc && sL1 === cd) || (sL0 === cd && sL1 === cc);
        const swapRightOk = (sR0 === ca && sR1 === cb) || (sR0 === cb && sR1 === ca);
        return (leftOk && rightOk) || (swapLeftOk && swapRightOk);
      }
      case 'numeric_input': {
        const studentVal = Math.round(parseFloat(String(stepAnswer).replace(',', '.')) * 100) / 100;
        const correctVal = Math.round(Number(step.correctAnswer) * 100) / 100;
        return Math.abs(studentVal - correctVal) <= 0.1;
      }
      default:
        return false;
    }
  }

  function currentAnswer(): string | number {
    if (step.type === 'label_segments') return JSON.stringify(labelAnswers);
    if (step.type === 'cross_product')  return JSON.stringify(crossAnswers);
    return stepAnswer;
  }

  function handleCheckStep() {
    if (isLocked) return;
    const correct = evaluateStep();
    const ans     = currentAnswer();
    const elapsed = Math.round((Date.now() - stepStartTime.current) / 1000);

    collectedResults.current.push({
      stepId: step.id, attempts: stepAttempts + 1, correct,
      studentAnswer: ans, timeSeconds: elapsed,
    });
    onStepAttempt?.({ step, answer: ans, correct, attemptsOnStep: stepAttempts });

    if (correct) {
      if (step.type === 'select_option') setSelectedProportion(stepAnswer);
      setStepFeedback('correct');
      setTimeout(() => advanceMainStep(), 1500);
    } else {
      setStepAttempts(prev => prev + 1);
      setStepFeedback('incorrect');
      setShowHint(true);
    }
  }

  const canCheck = (() => {
    if (isLocked) return false;
    switch (step.type) {
      case 'select_option':
        return stepAnswer !== '';
      case 'label_segments': {
        const opts = step.segmentOptions ?? [];
        return opts.length > 0 && opts.every(o => (labelAnswers[o.id] ?? '') !== '');
      }
      case 'cross_product':
        return ['lhs1', 'lhs2', 'rhs1', 'rhs2'].every(k => (crossAnswers[k]?.trim() ?? '') !== '');
      case 'numeric_input':
        return stepAnswer !== '';
      default:
        return false;
    }
  })();

  const inputCls = (locked: boolean, wrong: boolean) =>
    `border rounded-lg px-3 py-2 text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${
      locked ? 'border-green-400 bg-green-50'
      : wrong ? 'border-red-400 bg-red-50'
      : 'border-gray-300'
    } disabled:cursor-not-allowed`;

  const inputArea = (() => {
    switch (step.type) {

      case 'select_option': {
        const opts = step.options ?? [];
        return (
          <div className="flex flex-col gap-2">
            {opts.map(opt => {
              const isSelected = stepAnswer === opt;
              const isWrong    = stepFeedback === 'incorrect' && isSelected;
              const isRight    = isLocked && isSelected;
              return (
                <button
                  key={opt}
                  onClick={() => !isLocked && setStepAnswer(opt)}
                  disabled={isLocked}
                  className={`px-4 py-2 rounded-lg border text-sm font-mono text-left transition ${
                    isRight  ? 'border-green-400 bg-green-50 text-green-800'
                    : isWrong ? 'border-red-400 bg-red-50 text-red-800'
                    : isSelected ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                  } disabled:cursor-not-allowed`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );
      }

      case 'label_segments': {
        const opts = step.segmentOptions ?? [];
        return (
          <div className="space-y-3">
            {opts.map(opt => {
              const val     = labelAnswers[opt.id] ?? '';
              const isWrong = stepFeedback === 'incorrect' && val !== '' && val !== opt.correctValue;
              const isRight = isLocked && val === opt.correctValue;
              return (
                <div key={opt.id} className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-gray-600 w-56 shrink-0">{opt.displayName}:</span>
                  <select
                    value={val}
                    onChange={e => !isLocked && setLabelAnswers(prev => ({ ...prev, [opt.id]: e.target.value }))}
                    disabled={isLocked}
                    className={`border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${
                      isRight  ? 'border-green-400 bg-green-50'
                      : isWrong ? 'border-red-400 bg-red-50'
                      : 'border-gray-300 bg-white'
                    } disabled:cursor-not-allowed`}
                  >
                    <option value="">Selecciona...</option>
                    {shuffledSegmentValues.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        );
      }

      case 'cross_product': {
        const wrong = stepFeedback === 'incorrect';
        const t     = step.crossProductTemplate;
        const setCross = (key: string, val: string) =>
          !isLocked && setCrossAnswers(prev => ({ ...prev, [key]: val }));
        return (
          <div className="space-y-3">
            {selectedProportion && (
              <p className="text-sm text-indigo-700 font-mono bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                A partir de: <strong>{selectedProportion}</strong>
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap font-mono text-lg">
            <input
              type="text" value={crossAnswers.lhs1 ?? ''} placeholder="?"
              onChange={e => setCross('lhs1', e.target.value)} disabled={isLocked}
              className={`w-16 ${inputCls(isLocked && crossAnswers.lhs1?.trim() === t?.lhs1, wrong && crossAnswers.lhs1?.trim() !== t?.lhs1)}`}
            />
            <span className="text-gray-500 font-bold">·</span>
            <input
              type="text" value={crossAnswers.lhs2 ?? ''} placeholder="?"
              onChange={e => setCross('lhs2', e.target.value)} disabled={isLocked}
              className={`w-16 ${inputCls(isLocked && (crossAnswers.lhs2?.trim() ?? '') !== '', wrong && (crossAnswers.lhs2?.trim() ?? '') === '')}`}
            />
            <span className="text-gray-500 font-bold">=</span>
            <input
              type="text" value={crossAnswers.rhs1 ?? ''} placeholder="?"
              onChange={e => setCross('rhs1', e.target.value)} disabled={isLocked}
              className={`w-16 ${inputCls(isLocked && crossAnswers.rhs1?.trim() === t?.rhs1, wrong && crossAnswers.rhs1?.trim() !== t?.rhs1)}`}
            />
            <span className="text-gray-500 font-bold">·</span>
            <input
              type="text" value={crossAnswers.rhs2 ?? ''} placeholder="?"
              onChange={e => setCross('rhs2', e.target.value)} disabled={isLocked}
              className={`w-16 ${inputCls(isLocked && crossAnswers.rhs2?.trim() === t?.rhs2, wrong && crossAnswers.rhs2?.trim() !== t?.rhs2)}`}
            />
            </div>
          </div>
        );
      }

      case 'numeric_input':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="text" inputMode="decimal"
                value={stepAnswer}
                onChange={e => !isLocked && setStepAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isLocked && stepAnswer !== '' && handleCheckStep()}
                disabled={isLocked}
                placeholder="x = ?"
                className={`border rounded-lg px-4 py-2 text-lg w-36 text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${
                  isLocked ? 'border-green-400 bg-green-50'
                  : stepFeedback === 'incorrect' ? 'border-red-400 bg-red-50'
                  : 'border-gray-300'
                }`}
              />
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
            {showCalc && (
              <Calculator
                variant="basic"
                onResultReady={v => setStepAnswer(String(parseFloat(v)))}
                onClose={() => setShowCalc(false)}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  })();

  if (allComplete) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        {loadingEvaluation ? (
          <div className="text-gray-400 animate-pulse">Guardant resultats...</div>
        ) : evaluationResult ? (
          <div className={`space-y-2 ${evaluationResult.correct ? 'text-green-700' : 'text-red-700'}`}>
            <div className="text-3xl">{evaluationResult.correct ? '🎉' : '⚠️'}</div>
            <p className="font-bold text-lg">
              {evaluationResult.correct ? 'Molt bé! Has completat tots els passos.' : 'Hi ha algun error.'}
            </p>
            <p className="text-sm">{evaluationResult.feedback}</p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

      {/* ── TOP PANEL: statement + reference SVG ─────────────────────────── */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Teorema de Tales
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            TALES BASIC
          </span>
        </div>

        {(statementCatalan || statementTranslated) && (
          <div className="mb-4">
            {statementCatalan && (
              <p className="text-base text-gray-800 leading-relaxed mb-2">{statementCatalan}</p>
            )}
            {statementTranslated && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-sm text-gray-700 leading-relaxed">
                {renderGlossed(statementTranslated)}
              </div>
            )}
          </div>
        )}

        {/* Reference SVG — only rendered when a diagram type is defined */}
        {diagramType && (
          <div className="flex justify-center">
            <TalesDiagram {...({
              type: diagramType,
              ...displaySvgParams,
              ...(diagramType === 'inaccessible' ? { showLabels: showActualValues } : {}),
            } as any)} />
          </div>
        )}
      </div>

      {/* ── PROGRESS BAR ─────────────────────────────────────────────────── */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider whitespace-nowrap">
            Pas {stepIndex + 1} de {totalSteps}
          </span>
          <div className="flex-1 flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full transition-colors ${
                i < stepIndex    ? 'bg-green-400'
                : i === stepIndex ? 'bg-indigo-500'
                : 'bg-gray-200'
              }`} />
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM PANEL: interactive step ───────────────────────────────── */}
      <div className="p-6">
        <p className="text-base font-semibold text-gray-800 mb-4 whitespace-pre-line">
          {step.instruction}
        </p>

        {inputArea}

        {showHint && step.hint && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            💡 {step.hint}
          </div>
        )}

        {stepFeedback && (
          <div className={`mt-3 text-sm font-medium flex items-center gap-2 ${
            stepFeedback === 'correct' ? 'text-green-600' : 'text-red-600'
          }`}>
            {stepFeedback === 'correct' ? '✓ Correcte!' : '✗ Incorrecte. Torna-ho a intentar.'}
          </div>
        )}

        <button
          onClick={handleCheckStep}
          disabled={!canCheck}
          className="mt-5 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Comprova aquest pas
        </button>
      </div>
    </div>
  );
}

// ── Shared glossed-text renderer ──────────────────────────────────────────────

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
  onStepAttempt,
}: ThalesExerciseProps) {
  const meta = exercise.metadata as {
    level: string;
    diagramType: TalesDiagramType | null;
    svgParams: Record<string, any>;
    statementCatalan: string;
    statementTranslated: string | null;
    tolerance: number;
    steps?: ExerciseStep[];
  };

  const [showDiagram, setShowDiagram] = useState(true);
  const [showCalc, setShowCalc] = useState(false);

  // ── Stepped mode (TALES_BASIC) ────────────────────────────────────────────

  const hasSteps = Array.isArray(meta.steps) && meta.steps.length > 0;

  if (hasSteps) {
    return (
      <TalesSteppedUI
        steps={meta.steps!}
        svgParams={meta.svgParams}
        diagramType={meta.diagramType}
        correctAnswer={(exercise.solution as { correct: number }).correct}
        statementCatalan={meta.statementCatalan ?? ''}
        statementTranslated={meta.statementTranslated ?? null}
        onAnswerChange={onAnswerChange}
        onSubmit={onSubmit}
        evaluationResult={evaluationResult}
        loadingEvaluation={loadingEvaluation}
        onStepAttempt={onStepAttempt}
      />
    );
  }

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
