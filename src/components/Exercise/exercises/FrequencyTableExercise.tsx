import React, { useEffect, useState } from "react";
import type { ExerciseInstance, AnswerEvaluationResult } from "../../../core/ExerciseEngine";
import { Calculator } from "../../tools/Calculator";
import { Calculator as CalcIcon } from "lucide-react";
import { useAutoValidation } from "../../../hooks/useAutoValidation";

interface Props {
  exercise: ExerciseInstance;
  userAnswer: any;
  onAnswerChange: (ans: any) => void;
  onSubmit: () => void;
  evaluationResult: AnswerEvaluationResult | null;
  loading: boolean;
}

export function FrequencyTableExercise({ exercise, userAnswer, onAnswerChange, onSubmit, evaluationResult, loading }: Props) {
  const [showCalc, setShowCalc] = useState(false);
  const { fieldStatuses, validate } = useAutoValidation(exercise);
  const solutionRows = (exercise.solution as any).rows;
  
  // 1. Inicialització de l'estat (Rows + Totals)
  useEffect(() => {
    if (!userAnswer) {
      const emptyRows = solutionRows.map((r: any) => ({
        value: r.value,
        fi: "", ni: "", pi: ""
      }));
      onAnswerChange({ 
        rows: emptyRows,
        totals: { fi: "", ni: "", pi: "" }
      });
    }
  }, [exercise.id]);

  // 2. Handler per a les files de dades
  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    const newAnswer = { ...userAnswer };
    if (!newAnswer.rows) newAnswer.rows = [];
    newAnswer.rows[rowIndex] = { ...newAnswer.rows[rowIndex], [field]: value };
    onAnswerChange(newAnswer);
    validate(`rows.${rowIndex}.${field}`, value);
  };

  // 3. Handler per a la fila de totals (EL QUE FALTAVA)
  const handleTotalChange = (field: string, value: string) => {
    const newAnswer = { ...userAnswer };
    if (!newAnswer.totals) newAnswer.totals = {};
    newAnswer.totals[field] = value;
    onAnswerChange(newAnswer);
    validate(`totals.${field}`, value);
  };

  // 4. Lògica de colors unificada per a qualsevol "path"
  const getFieldClasses = (fieldPath: string) => {
    const status = fieldStatuses[fieldPath];
    const base = "w-full p-2 border rounded-md focus:ring-2 text-center font-mono transition-all duration-200";
    
    switch (status) {
      case 'valid': return `${base} border-emerald-500 bg-emerald-50 text-emerald-700 focus:ring-emerald-200`;
      case 'invalid': return `${base} border-red-500 bg-red-50 text-red-600 focus:ring-red-200`;
      default: return `${base} border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900`;
    }
  };

  return (
    <div className="relative">
      {/* Enunciat i Dades */}
      <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
        <p className="text-lg text-gray-800 font-medium">{exercise.prompt}</p>
        <button 
          onClick={() => setShowCalc(!showCalc)}
          className={`p-2 rounded-lg transition flex items-center gap-2 text-sm font-bold ${showCalc ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-200'}`}
        >
          <CalcIcon size={16} />
          {showCalc ? 'Amagar' : 'Calculadora'}
        </button>
      </div>

      <div className="flex gap-4 items-start">
        <div className="flex-1 overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dada ($x_i$)</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">$f_i$</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">$n_i$</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">%</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {solutionRows.map((row: any, idx: number) => {
                const uRow = userAnswer?.rows?.[idx] || {};
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-900 bg-gray-50/50">{row.value}</td>
                    <td className="px-6 py-2">
                      <input type="number" className={getFieldClasses(`rows.${idx}.fi`)} value={uRow.fi || ""} onChange={(e) => handleCellChange(idx, "fi", e.target.value)} />
                    </td>
                    <td className="px-6 py-2">
                      <input type="number" className={getFieldClasses(`rows.${idx}.ni`)} value={uRow.ni || ""} onChange={(e) => handleCellChange(idx, "ni", e.target.value)} />
                    </td>
                    <td className="px-6 py-2">
                      <input type="number" className={getFieldClasses(`rows.${idx}.pi`)} value={uRow.pi || ""} onChange={(e) => handleCellChange(idx, "pi", e.target.value)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            
            <tfoot className="bg-indigo-50/50 font-bold border-t-2 border-indigo-100">
              <tr>
                <td className="px-6 py-4 text-indigo-900 uppercase text-xs">Totals ($\sum$)</td>
                <td className="px-6 py-2">
                  <input 
                    type="number" 
                    placeholder="N"
                    className={getFieldClasses('totals.fi')}
                    value={userAnswer?.totals?.fi || ""}
                    onChange={(e) => handleTotalChange("fi", e.target.value)}
                  />
                </td>
                <td className="px-6 py-2">
                  <input 
                    type="number" 
                    placeholder="1.00"
                    className={getFieldClasses('totals.ni')}
                    value={userAnswer?.totals?.ni || ""}
                    onChange={(e) => handleTotalChange("ni", e.target.value)}
                  />
                </td>
                <td className="px-6 py-2 text-center">
                  <div className="flex items-center gap-1">
                    <input 
                      type="number" 
                      placeholder="100"
                      className={getFieldClasses('totals.pi')}
                      value={userAnswer?.totals?.pi || ""}
                      onChange={(e) => handleTotalChange("pi", e.target.value)}
                    />
                    <span className="text-indigo-900">%</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {showCalc && (
          <div className="shrink-0 sticky top-4">
            <Calculator onClose={() => setShowCalc(false)} />
          </div>
        )}
      </div>

      {/* Footer i Botons */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-400 italic">
          * Recorda: $\sum f_i = N$ i $\sum n_i = 1$
        </div>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? "Avaluant..." : "Finalitzar Exercici"}
        </button>
      </div>

      {evaluationResult && (
        <div className={`mt-4 p-4 rounded-xl border ${evaluationResult.correct ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <div className="font-bold flex items-center gap-2">
            {evaluationResult.correct ? "🎉 Molt bé!" : "⚠️ Hi ha errors"}
          </div>
          <p>{evaluationResult.feedback}</p>
        </div>
      )}
    </div>
  );
}