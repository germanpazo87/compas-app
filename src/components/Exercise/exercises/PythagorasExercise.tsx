import React, { useState, useRef, useMemo } from "react";
import type { ExerciseInstance, AnswerEvaluationResult } from "../../../core/ExerciseEngine";
import type { ExerciseStep, StepResult } from "../../../core/ExerciseSteps";
import {
  PythagorasTriangleSVG,
  PythagorasIdentifySVG,
  PythagorasHypotenuseSVG,
} from "../../geometry/PythagorasSVG";
import { Calculator } from "../../tools/Calculator";
import { Calculator as CalcIcon } from "lucide-react";

interface PythagorasExerciseProps {
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
  onStepComplete?: (answer: number | string) => void;
}

/**
 * Renders *(catalan term)* markers as italic inline spans.
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

// ── Stepped UI ────────────────────────────────────────────────────────────────

interface SteppedUIProps {
  level: string;
  steps: ExerciseStep[];
  svgParams: Record<string, any>;
  svgRotation: 0 | 90 | 180 | 270;
  correctAnswer: number;
  statementCatalan: string;
  statementTranslated: string | null;
  onAnswerChange: (answer: unknown) => void;
  onSubmit: () => void;
  evaluationResult: AnswerEvaluationResult | null;
  loadingEvaluation: boolean;
  onStepAttempt?: PythagorasExerciseProps['onStepAttempt'];
  onStepComplete?: PythagorasExerciseProps['onStepComplete'];
}

function SteppedUI({
  level,
  steps,
  svgParams,
  svgRotation,
  correctAnswer,
  statementCatalan,
  statementTranslated,
  onAnswerChange,
  onSubmit,
  evaluationResult,
  loadingEvaluation,
  onStepAttempt,
  onStepComplete,
}: SteppedUIProps) {
  const [stepIndex,     setStepIndex]    = useState(0);
  const [subStepIndex,  setSubStepIndex] = useState(0);
  const [labelAnswers,  setLabelAnswers] = useState<Record<string, string>>({});
  const [stepAnswer,   setStepAnswer]   = useState<string | number | null>(null);
  const [fillVal1,     setFillVal1]     = useState('');
  const [fillVal2,     setFillVal2]     = useState('');
  const [stepAttempts, setStepAttempts] = useState(0);
  const [showHint,     setShowHint]     = useState(false);
  const [stepFeedback, setStepFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [allComplete,  setAllComplete]  = useState(false);
  const [showCalc,     setShowCalc]     = useState(false);

  const collectedResults = useRef<StepResult[]>([]);
  const stepStartTime    = useRef<number>(Date.now());

  const step        = steps[stepIndex];
  const totalSteps  = steps.length;
  const isLabelStep = step.type === 'label_triangle';

  // Inputs are locked only when the current step was just answered correctly
  // (during the auto-advance delay). On wrong answers inputs stay active.
  const isLocked = stepFeedback === 'correct';

  // Shuffle the label_triangle dropdown options once per step (keyed on step.id)
  const shuffledLabelOptions = useMemo(() => {
    if (step.type !== 'label_triangle' || !step.options) return [];
    const arr = [...step.options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  // For click_svg_sequence: use the active sub-step's instruction/hint
  const currentInstruction = step.type === 'click_svg_sequence' && step.subSteps
    ? (step.subSteps[subStepIndex]?.instruction ?? step.instruction)
    : step.instruction;
  const currentHint = step.type === 'click_svg_sequence' && step.subSteps
    ? step.subSteps[subStepIndex]?.hint
    : step.hint;

  // ── Advance to the next main step (or complete) ─────────────────────────

  function advanceMainStep() {
    if (stepIndex + 1 < totalSteps) {
      setStepIndex(i => i + 1);
      setSubStepIndex(0);
      setStepAnswer(null);
      setFillVal1('');
      setFillVal2('');
      setLabelAnswers({});
      setStepAttempts(0);
      setShowHint(false);
      setStepFeedback(null);
      setShowCalc(false);
      stepStartTime.current = Date.now();
    } else {
      setAllComplete(true);
      if (onStepComplete) {
        onStepComplete(correctAnswer);
      } else {
        onAnswerChange(correctAnswer);
        onSubmit();
      }
    }
  }

  // ── Evaluate current step ───────────────────────────────────────────────

  function evaluateStep(): boolean {
    if (!step) return false;
    switch (step.type) {
      case 'click_svg':
      case 'select_option':
        return String(stepAnswer) === String(step.correctAnswer);
      case 'click_svg_sequence': {
        const subStep = step.subSteps?.[subStepIndex];
        if (!subStep) return false;
        return String(stepAnswer) === String(subStep.correctAnswer);
      }
      case 'label_triangle':
        return (step.labelOptions ?? []).every(o => labelAnswers[o.id] === o.correctValue);
      case 'fill_values': {
        const ca = String(step.correctAnswer);
        if (ca.includes(' - ')) {
          // order-fixed: first value is hypotenuse, second is known leg
          const [e1, e2] = ca.split(' - ').map(parseFloat);
          return parseFloat(fillVal1) === e1 && parseFloat(fillVal2) === e2;
        } else {
          // order-independent: '+' operator
          const [e1, e2] = ca.split(' + ').map(parseFloat);
          const v1 = parseFloat(fillVal1), v2 = parseFloat(fillVal2);
          return (v1 === e1 && v2 === e2) || (v1 === e2 && v2 === e1);
        }
      }
      case 'numeric_input':
        return Math.abs(Number(stepAnswer) - Number(step.correctAnswer)) <= 0.01;
    }
  }

  function currentAnswer(): string | number {
    if (step.type === 'fill_values') return `${fillVal1} + ${fillVal2}`;
    if (step.type === 'label_triangle') return JSON.stringify(labelAnswers);
    return stepAnswer ?? '';
  }

  // ── Handle "Comprova aquest pas" ────────────────────────────────────────

  function handleCheckStep() {
    if (isLocked) return;
    const correct = evaluateStep();
    const ans     = currentAnswer();
    const elapsed = Math.round((Date.now() - stepStartTime.current) / 1000);

    // click_svg_sequence: manage sub-step progression separately
    if (step.type === 'click_svg_sequence') {
      if (correct) {
        setStepFeedback('correct');
        const isLastSubStep = subStepIndex >= (step.subSteps?.length ?? 1) - 1;
        setTimeout(() => {
          if (!isLastSubStep) {
            setSubStepIndex(i => i + 1);
            setStepAnswer(null);
            setStepFeedback(null);
            setShowHint(false);
          } else {
            collectedResults.current.push({
              stepId: step.id, attempts: stepAttempts + 1, correct: true,
              studentAnswer: ans, timeSeconds: elapsed,
            });
            onStepAttempt?.({ step, answer: ans, correct: true, attemptsOnStep: stepAttempts });
            advanceMainStep();
          }
        }, 1000);
      } else {
        setStepAttempts(prev => prev + 1);
        setStepFeedback('incorrect');
        setShowHint(true);
      }
      return;
    }

    collectedResults.current.push({
      stepId:        step.id,
      attempts:      stepAttempts + 1,
      correct,
      studentAnswer: ans,
      timeSeconds:   elapsed,
    });

    onStepAttempt?.({ step, answer: ans, correct, attemptsOnStep: stepAttempts });

    if (correct) {
      setStepFeedback('correct');
      setTimeout(() => advanceMainStep(), 1500);
    } else {
      setStepAttempts(prev => prev + 1);
      setStepFeedback('incorrect');
      setShowHint(true);
    }
  }

  // ── Completion / evaluation result screen ───────────────────────────────

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

  // ── Step-specific input ─────────────────────────────────────────────────

  const inputArea = (() => {
    switch (step.type) {

      case 'click_svg':
        return (
          <div className="flex justify-center py-2">
            <PythagorasTriangleSVG
              legA={svgParams.legA}
              legB={svgParams.legB}
              hypotenuse={svgParams.hypotenuse}
              unknownSide={svgParams.unknownSide as 'legA' | 'legB' | 'hypotenuse'}
              rotation={svgRotation}
              showRightAngle={step.id !== 'identify_right_angle'}
              stepMode={step.id === 'identify_right_angle' ? 'click_corner' : 'click_side'}
              onElementClick={isLocked ? undefined : (id) => setStepAnswer(id)}
              selectedElement={stepAnswer as string | null}
              correctElement={isLocked ? String(step.correctAnswer) : null}
            />
          </div>
        );

      case 'click_svg_sequence':
        return (
          <div className="flex justify-center py-2">
            <PythagorasTriangleSVG
              legA={svgParams.legA}
              legB={svgParams.legB}
              hypotenuse={svgParams.hypotenuse}
              unknownSide={svgParams.unknownSide as 'legA' | 'legB' | 'hypotenuse'}
              rotation={svgRotation}
              showRightAngle
              stepMode="click_side"
              onElementClick={isLocked ? undefined : (id) => setStepAnswer(id)}
              selectedElement={stepAnswer as string | null}
              correctElement={isLocked ? String(step.subSteps?.[subStepIndex]?.correctAnswer) : null}
            />
          </div>
        );

      case 'label_triangle': {
        const opts = step.labelOptions ?? [];
        return (
          <div className="space-y-3">
            {opts.map((opt) => {
              const val      = labelAnswers[opt.id] ?? '';
              const isWrong  = stepFeedback === 'incorrect' && val !== '' && val !== opt.correctValue;
              const isRight  = isLocked && val === opt.correctValue;
              return (
                <div key={opt.id} className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-gray-600 w-52 shrink-0">{opt.displayName}:</span>
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
                    {shuffledLabelOptions.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        );
      }

      case 'select_option':
        return (
          <div className="flex flex-wrap gap-2">
            {(step.options ?? []).map((opt) => {
              const isSelected = stepAnswer === opt;
              const isCorrect  = isLocked && isSelected;
              const isWrong    = stepFeedback === 'incorrect' && isSelected;
              return (
                <button
                  key={opt}
                  onClick={() => !isLocked && setStepAnswer(opt)}
                  disabled={isLocked}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                    isCorrect  ? 'bg-green-100 border-green-400 text-green-700'
                    : isWrong  ? 'bg-red-100 border-red-400 text-red-700'
                    : isSelected ? 'bg-indigo-100 border-indigo-400 text-indigo-700 ring-2 ring-indigo-300'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  } disabled:cursor-not-allowed`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );

      case 'fill_values': {
        const fillOp    = String(step.correctAnswer).includes(' - ') ? '-' : '+';
        const fillLabel = step.fillLabel ?? 'c²';
        const inputCls  = (locked: boolean, wrong: boolean) =>
          `w-24 border rounded-lg px-3 py-2 text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
            locked ? 'border-green-400 bg-green-50'
            : wrong ? 'border-red-300 bg-red-50'
            : 'border-gray-300'
          }`;
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-gray-700">{fillLabel} =</span>
            <input
              type="number"
              value={fillVal1}
              onChange={e => !isLocked && setFillVal1(e.target.value)}
              disabled={isLocked}
              placeholder="?"
              className={inputCls(isLocked, stepFeedback === 'incorrect')}
            />
            <span className="text-gray-500 font-bold">² {fillOp}</span>
            <input
              type="number"
              value={fillVal2}
              onChange={e => !isLocked && setFillVal2(e.target.value)}
              disabled={isLocked}
              placeholder="?"
              className={inputCls(isLocked, stepFeedback === 'incorrect')}
            />
            <span className="text-gray-500 font-bold">²</span>
          </div>
        );
      }

      case 'numeric_input':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="decimal"
                value={(stepAnswer as string) ?? ''}
                onChange={e => !isLocked && setStepAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isLocked && stepAnswer !== null && handleCheckStep()}
                disabled={isLocked}
                placeholder="c = ?"
                className={`border rounded-lg px-4 py-2 text-lg w-36 text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${
                  isLocked                  ? 'border-green-400 bg-green-50'
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
                variant="scientific"
                onResultReady={v => setStepAnswer(parseFloat(v))}
                onClose={() => setShowCalc(false)}
              />
            )}
          </div>
        );
    }
  })();

  // ── Can the student submit this step? ───────────────────────────────────

  const canCheck = (() => {
    if (isLocked) return false;
    switch (step.type) {
      case 'click_svg':
      case 'click_svg_sequence':
      case 'select_option': return stepAnswer !== null;
      case 'fill_values':   return fillVal1 !== '' && fillVal2 !== '';
      case 'numeric_input': return stepAnswer !== null && stepAnswer !== '';
      case 'label_triangle': {
        const opts = step.labelOptions ?? [];
        return opts.length > 0 && opts.every(o => (labelAnswers[o.id] ?? '') !== '');
      }
    }
  })();

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

      {/* ── TOP PANEL: statement + reference SVG ─────────────────────────── */}
      <div className="p-6 border-b border-gray-100">

        {/* Header badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Teorema de Pitàgores
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {level.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Statement (only when non-empty) */}
        {(statementCatalan || statementTranslated) && (
          <div className="mb-4">
            {statementCatalan && (
              <p className="text-base text-gray-800 leading-relaxed mb-2">
                {statementCatalan}
              </p>
            )}
            {statementTranslated && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-sm text-gray-700 leading-relaxed">
                {renderGlossed(statementTranslated)}
              </div>
            )}
          </div>
        )}

        {/* Reference SVG — informational, always visible, no stepMode */}
        <div className="flex justify-center">
          <PythagorasTriangleSVG
            legA={svgParams.legA}
            legB={svgParams.legB}
            hypotenuse={svgParams.hypotenuse}
            unknownSide={svgParams.unknownSide as 'legA' | 'legB' | 'hypotenuse'}
            rotation={svgRotation}
            showRightAngle
            showLabels={!isLabelStep}
          />
        </div>
      </div>

      {/* ── PROGRESS BAR ─────────────────────────────────────────────────── */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider whitespace-nowrap">
            Pas {stepIndex + 1} de {totalSteps}
          </span>
          <div className="flex-1 flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i < stepIndex  ? 'bg-green-400'
                  : i === stepIndex ? 'bg-indigo-500'
                  : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM PANEL: interactive step ───────────────────────────────── */}
      <div className="p-6">

        {/* Step instruction */}
        <p className="text-base font-semibold text-gray-800 mb-4 whitespace-pre-line">
          {currentInstruction}
        </p>

        {/* Step-specific input */}
        {inputArea}

        {/* Hint — always shown after first wrong, stays visible on retries */}
        {showHint && currentHint && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            💡 {currentHint}
          </div>
        )}

        {/* Feedback */}
        {stepFeedback && (
          <div className={`mt-3 text-sm font-medium flex items-center gap-2 ${
            stepFeedback === 'correct' ? 'text-green-600' : 'text-red-600'
          }`}>
            {stepFeedback === 'correct' ? '✓ Correcte!' : '✗ Incorrecte. Torna-ho a intentar.'}
          </div>
        )}

        {/* Comprova button */}
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

// ── Main component ────────────────────────────────────────────────────────────

export function PythagorasExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  onSubmit,
  evaluationResult,
  loadingEvaluation,
  onStepAttempt,
  onStepComplete,
}: PythagorasExerciseProps) {
  const meta = exercise.metadata as {
    level: string;
    diagramType: 'triangle' | 'identify' | 'hypotenuse_id' | null;
    svgParams: Record<string, any>;
    statementCatalan: string;
    statementTranslated: string | null;
    tolerance: number;
    steps?: ExerciseStep[];
  };

  const [showDiagram, setShowDiagram] = useState(true);
  const [showCalc,    setShowCalc]    = useState(false);

  // ── Stepped mode ─────────────────────────────────────────────────────────

  const hasSteps = Array.isArray(meta.steps) && meta.steps.length > 0;

  if (hasSteps) {
    const rawRotation = (exercise.metadata as any).svgRotation;
    const svgRotation: 0 | 90 | 180 | 270 =
      rawRotation === 90 ? 90 : rawRotation === 180 ? 180 : rawRotation === 270 ? 270 : 0;
    return (
      <SteppedUI
        level={meta.level}
        steps={meta.steps!}
        svgParams={meta.svgParams}
        svgRotation={svgRotation}
        correctAnswer={(exercise.solution as { correct: number }).correct}
        statementCatalan={meta.statementCatalan ?? ''}
        statementTranslated={meta.statementTranslated ?? null}
        onAnswerChange={onAnswerChange}
        onSubmit={onSubmit}
        evaluationResult={evaluationResult}
        loadingEvaluation={loadingEvaluation}
        onStepAttempt={onStepAttempt}
        onStepComplete={onStepComplete}
      />
    );
  }

  // ── Single-answer mode (all other levels — unchanged) ─────────────────────

  const selectedTriangleIndex: number | null =
    typeof userAnswer === 'number' ? userAnswer : null;

  const selectedSide: 1 | 2 | 3 | null =
    userAnswer === 1 ? 1 : userAnswer === 2 ? 2 : userAnswer === 3 ? 3 : null;

  const verifyAnswer: 1 | 0 | null =
    userAnswer === 1 ? 1 : userAnswer === 0 ? 0 : null;

  const isIdentify = meta.level === 'RIGHT_TRIANGLE_ID' || meta.level === 'HYPOTENUSE_ID';
  const isVerify   = meta.level === 'PYTH_VERIFY';
  const hasDiagram =
    meta.diagramType === 'triangle' &&
    meta.svgParams != null &&
    Object.keys(meta.svgParams).length > 0;

  const evaluated = evaluationResult !== null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

      {/* ── Statement ── */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Teorema de Pitàgores
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {meta.level?.replace(/_/g, ' ')}
          </span>
        </div>

        <p className="text-base text-gray-800 leading-relaxed mb-3">
          {meta.statementCatalan || exercise.prompt}
        </p>

        {meta.statementTranslated && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-sm text-gray-700 leading-relaxed">
            {renderGlossed(meta.statementTranslated)}
          </div>
        )}
      </div>

      {/* ── RIGHT_TRIANGLE_ID ── */}
      {meta.level === 'RIGHT_TRIANGLE_ID' && meta.svgParams?.triangles && (
        <div className="border-t border-gray-100 px-6 py-4 flex justify-center">
          <PythagorasIdentifySVG
            triangles={meta.svgParams.triangles.map((t: any, i: number) => ({
              ...t,
              rotation: Number(
                ([meta.svgParams.t1rot, meta.svgParams.t2rot, meta.svgParams.t3rot] as number[])[i] ?? 0
              ),
            }))}
            selectedIndex={selectedTriangleIndex}
            showAnswer={evaluated}
            correctIndex={meta.svgParams.correctIndex}
            onSelect={(i) => onAnswerChange(i)}
          />
        </div>
      )}

      {/* ── HYPOTENUSE_ID ── */}
      {meta.level === 'HYPOTENUSE_ID' && meta.svgParams?.sideA !== undefined && (
        <div className="border-t border-gray-100 px-6 py-4 flex justify-center">
          <PythagorasHypotenuseSVG
            sideA={meta.svgParams.sideA}
            sideB={meta.svgParams.sideB}
            sideC={meta.svgParams.sideC}
            rotation={meta.svgParams.rotation ?? 0}
            hypotenuse={meta.svgParams.hypotenuse as 1 | 2 | 3}
            selectedSide={selectedSide}
            showAnswer={evaluated}
            onSelect={(s) => onAnswerChange(s)}
          />
        </div>
      )}

      {/* ── Optional diagram ── */}
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
          {showDiagram && (
            <div className="px-6 py-4 flex justify-center">
              <PythagorasTriangleSVG
                legA={meta.svgParams.legA}
                legB={meta.svgParams.legB}
                hypotenuse={meta.svgParams.hypotenuse}
                unknownSide={meta.svgParams.unknownSide}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Answer section ── */}
      <div className="p-6 border-t border-gray-100">

        {isVerify ? (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              És un triangle rectangle?
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {([1, 0] as const).map(val => {
                const isSelected = verifyAnswer === val;
                const buttonClass = evaluated && isSelected
                  ? evaluationResult!.correct
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'bg-red-100 text-red-700 border-red-300'
                  : isSelected
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300 ring-2 ring-indigo-400 ring-offset-1'
                    : val === 1
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
                return (
                  <button
                    key={val}
                    onClick={() => onAnswerChange(val)}
                    disabled={loadingEvaluation || evaluated}
                    className={`px-6 py-2.5 text-sm font-semibold rounded-lg border transition disabled:opacity-60 disabled:cursor-not-allowed ${buttonClass}`}
                  >
                    {val === 1 ? 'Sí' : 'No'}
                  </button>
                );
              })}
              <button
                onClick={() => onAnswerChange(null)}
                disabled={loadingEvaluation || evaluated}
                className="px-6 py-2.5 text-sm font-semibold rounded-lg border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                No ho sé
              </button>
            </div>
            <button
              onClick={onSubmit}
              disabled={loadingEvaluation || verifyAnswer === null || evaluated}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loadingEvaluation ? 'Comprovant...' : 'Comprova'}
            </button>
          </>

        ) : isIdentify ? (
          <button
            onClick={onSubmit}
            disabled={loadingEvaluation || userAnswer === null || evaluated}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loadingEvaluation ? 'Comprovant...' : 'Comprova'}
          </button>

        ) : (
          <>
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
                  variant="scientific"
                  onResultReady={(v) => onAnswerChange(parseFloat(v))}
                  onClose={() => setShowCalc(false)}
                />
              </div>
            )}
          </>
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
