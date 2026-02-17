import React from 'react';
import type { ExerciseStatus, ValidationResult } from './types';

interface AnswerAreaProps {
  value: string;
  status: ExerciseStatus;
  validation: ValidationResult | undefined;
  onType: (val: string) => void;
  onValidate: () => void;
}

export const AnswerArea: React.FC<AnswerAreaProps> = ({
  value,
  status,
  validation,
  onType,
  onValidate
}) => {
  
  // Determina l'estat visual de l'input basat en la resposta del motor de validació
  const getFeedbackStyles = () => {
    if (!validation) return "border-gray-300 focus:border-blue-500";
    
    switch (validation.status) {
      case "correct": 
        return "border-green-500 bg-green-50 text-green-700";
      case "partial": 
        return "border-yellow-500 bg-yellow-50 text-yellow-700";
      case "incorrect": 
        return "border-red-500 bg-red-50 text-red-700 animate-shake";
      default: 
        return "border-gray-300";
    }
  };

  const isSuccess = validation?.isCorrect;
  const isLoading = status === "validating";

  return (
    <section className="flex flex-col gap-4 mt-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          disabled={isSuccess || isLoading}
          onChange={(e) => onType(e.target.value)}
          placeholder="Escriu la teva resposta..."
          className={`flex-1 p-3 border-2 rounded-lg outline-none transition-all ${getFeedbackStyles()}`}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && onValidate()}
        />
        
        <button
          onClick={onValidate}
          disabled={isSuccess || isLoading || !value.trim()}
          className={`px-6 py-2 rounded-lg font-bold transition-all shadow-sm ${
            isSuccess 
              ? "bg-green-500 text-white cursor-default" 
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 disabled:bg-gray-300"
          }`}
        >
          {isLoading ? "Validant..." : isSuccess ? "✓" : "Validar"}
        </button>
      </div>

      {/* ZONA DE MICRO-FEEDBACK PROTEGIDA:
          Només es renderitza si existeix 'validation', 'diagnostics' i hi ha almenys un element.
      */}
      {validation?.diagnostics && validation.diagnostics.length > 0 && (
        <div className={`text-sm font-medium p-3 rounded-md flex items-start gap-2 shadow-inner ${getFeedbackStyles()}`}>
          <span className="text-base">
            {validation.isCorrect ? "✨" : "💡"}
          </span>
          <p>
            {/* Accés segur al missatge del primer diagnòstic */}
            {validation.diagnostics[0]?.message || "S'ha processat la resposta, però no s'ha trobat un missatge específic."}
          </p>
        </div>
      )}
    </section>
  );
};