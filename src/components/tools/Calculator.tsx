import React, { useState } from "react";
import { X, Delete, Equal } from "lucide-react";

interface CalculatorProps {
  onClose: () => void;
  variant?: 'basic' | 'scientific';
  onResultReady?: (value: string) => void;
}

export function Calculator({ onClose, variant = 'basic', onResultReady }: CalculatorProps) {
  // ── Basic mode state ─────────────────────────────────────────────────────
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [newNumber, setNewNumber] = useState(true);
  const [exprClosed, setExprClosed] = useState(false);

  // ── Scientific mode extra state ──────────────────────────────────────────
  const [afterResult, setAfterResult] = useState(false);

  // ── Basic handlers (unchanged) ───────────────────────────────────────────
  const handleNum = (num: string) => {
    if (variant === 'scientific') {
      if (afterResult) {
        setDisplay(num);
        setAfterResult(false);
      } else {
        setDisplay(d => d === "0" ? num : d + num);
      }
      return;
    }
    // basic
    setExprClosed(false);
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(d => d === "0" ? num : d + num);
    }
  };

  const handleOp = (op: string) => {
    if (variant === 'scientific') {
      setDisplay(d => d + " " + op + " ");
      setAfterResult(false);
      return;
    }
    // basic
    setExprClosed(false);
    setEquation(`${display} ${op} `);
    setNewNumber(true);
  };

  const handleDot = () => {
    if (variant === 'scientific') {
      setDisplay(d => afterResult ? "0." : d + ".");
      setAfterResult(false);
      return;
    }
    // basic
    if (!display.includes(".")) {
      setDisplay(d => d + ".");
    }
  };

  const calculate = () => {
    try {
      let rawExpr: string;
      if (variant === 'scientific') {
        rawExpr = display;
      } else {
        rawExpr = exprClosed ? equation : `${equation}${display}`;
      }

      let finalEq = rawExpr
        .replace(/\^/g, "**")
        .replace(/sqrt\(/g, "Math.sqrt(")
        .replace(/×/g, "*")
        .replace(/÷/g, "/");

      // Auto-close unclosed parentheses
      const opens = (finalEq.match(/\(/g) || []).length;
      const closes = (finalEq.match(/\)/g) || []).length;
      if (opens > closes) finalEq += ")".repeat(opens - closes);

      if (!finalEq.trim()) return;

      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${finalEq}`)();
      const formatted = String(Math.round(result * 10000) / 10000);

      setDisplay(formatted);
      if (variant === 'scientific') {
        setAfterResult(true);
      } else {
        setEquation("");
        setNewNumber(true);
        setExprClosed(false);
      }
      onResultReady?.(formatted);
    } catch {
      setDisplay("Error");
      if (variant === 'scientific') {
        setAfterResult(true);
      } else {
        setNewNumber(true);
      }
    }
  };

  const clear = () => {
    setDisplay("0");
    setEquation("");
    setNewNumber(true);
    setExprClosed(false);
    setAfterResult(false);
  };

  const backspace = () => {
    if (variant === 'scientific') {
      setDisplay(d => d.length > 1 ? d.slice(0, -1) : "0");
      setAfterResult(false);
      return;
    }
    setDisplay(d => d.length > 1 ? d.slice(0, -1) : "0");
  };

  // ── Scientific expression-builder handlers ───────────────────────────────
  const handleSqrt = () => {
    setDisplay(d => (afterResult ? "" : d) + "sqrt(");
    setAfterResult(false);
  };

  const handleSquare = () => {
    setDisplay(d => (afterResult ? "0" : d) + "^2");
    setAfterResult(false);
  };

  const handleOpenParen = () => {
    setDisplay(d => afterResult ? "(" : d + "(");
    setAfterResult(false);
  };

  const handleCloseParen = () => {
    setDisplay(d => (afterResult ? "0" : d) + ")");
    setAfterResult(false);
  };

  // ── Styles ───────────────────────────────────────────────────────────────
  const btnClass = "h-10 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition text-gray-700 active:scale-95";
  const opClass  = "h-10 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-bold transition active:scale-95";
  const sciClass = "h-10 bg-gray-100 hover:bg-gray-200 text-indigo-700 rounded-lg font-bold transition active:scale-95 text-sm";

  return (
    <div className="w-64 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="bg-indigo-600 p-2 flex justify-between items-center text-white">
        <span className="text-xs font-bold px-2">
          {variant === 'scientific' ? 'CALC. CIENTÍFICA' : 'CALCULADORA'}
        </span>
        <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded">
          <X size={14} />
        </button>
      </div>

      {/* Screen */}
      <div className="p-4 bg-gray-50 border-b text-right">
        {variant === 'basic' && (
          <div className="text-xs text-gray-500 h-4 truncate">{equation}</div>
        )}
        {variant === 'scientific' && (
          <div className="text-xs text-gray-400 h-4 truncate">
            {afterResult ? 'ans' : ''}
          </div>
        )}
        <div className={`font-mono text-gray-800 truncate ${variant === 'scientific' ? 'text-base' : 'text-2xl'}`}>
          {display}
        </div>
      </div>

      {/* Keypad */}
      <div className="p-3 grid grid-cols-4 gap-2">

        {/* Scientific row */}
        {variant === 'scientific' && (
          <>
            <button onClick={handleSqrt}       className={sciClass}>√</button>
            <button onClick={handleSquare}     className={sciClass}>x²</button>
            <button onClick={handleOpenParen}  className={sciClass}>(</button>
            <button onClick={handleCloseParen} className={sciClass}>)</button>
          </>
        )}

        <button onClick={clear}     className="col-span-2 h-10 bg-red-50 text-red-600 rounded-lg font-bold text-xs hover:bg-red-100">AC</button>
        <button onClick={backspace} className={btnClass}><Delete size={16} className="mx-auto" /></button>
        <button onClick={() => handleOp("÷")} className={opClass}>÷</button>

        {[7, 8, 9].map(n => <button key={n} onClick={() => handleNum(String(n))} className={btnClass}>{n}</button>)}
        <button onClick={() => handleOp("×")} className={opClass}>×</button>

        {[4, 5, 6].map(n => <button key={n} onClick={() => handleNum(String(n))} className={btnClass}>{n}</button>)}
        <button onClick={() => handleOp("-")} className={opClass}>-</button>

        {[1, 2, 3].map(n => <button key={n} onClick={() => handleNum(String(n))} className={btnClass}>{n}</button>)}
        <button onClick={() => handleOp("+")} className={opClass}>+</button>

        <button onClick={() => handleNum("0")} className={`${btnClass} col-span-2`}>0</button>
        <button onClick={handleDot} className={btnClass}>.</button>
        <button onClick={calculate} className="h-10 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm flex items-center justify-center">
          <Equal size={18} />
        </button>

      </div>
    </div>
  );
}
