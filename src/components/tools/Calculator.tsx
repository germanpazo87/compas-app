import React, { useState } from "react";
import { X, Delete, Equal } from "lucide-react";

interface CalculatorProps {
  onClose: () => void;
}

export function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [newNumber, setNewNumber] = useState(true);

  const handleNum = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleOp = (op: string) => {
    setEquation(`${display} ${op} `);
    setNewNumber(true);
  };

  const calculate = () => {
    try {
      // Nota: En un entorn real usariem mathjs, però per TFM això val
      // Reemplacem 'x' per '*' per a l'evaluació
      const finalEq = `${equation}${display}`.replace(/×/g, "*").replace(/÷/g, "/");
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${finalEq}`)();
      
      const formatted = String(Math.round(result * 10000) / 10000); // Max 4 decimals
      setDisplay(formatted);
      setEquation("");
      setNewNumber(true);
    } catch (e) {
      setDisplay("Error");
      setNewNumber(true);
    }
  };

  const clear = () => {
    setDisplay("0");
    setEquation("");
    setNewNumber(true);
  };

  const btnClass = "h-10 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition text-gray-700 active:scale-95";
  const opClass = "h-10 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-bold transition active:scale-95";

  return (
    <div className="w-64 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="bg-indigo-600 p-2 flex justify-between items-center text-white">
        <span className="text-xs font-bold px-2">CALCULADORA</span>
        <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded">
          <X size={14} />
        </button>
      </div>

      {/* Screen */}
      <div className="p-4 bg-gray-50 border-b text-right">
        <div className="text-xs text-gray-400 h-4">{equation}</div>
        <div className="text-2xl font-mono text-gray-800 truncate">{display}</div>
      </div>

      {/* Keypad */}
      <div className="p-3 grid grid-cols-4 gap-2">
        <button onClick={clear} className="col-span-2 h-10 bg-red-50 text-red-600 rounded-lg font-bold text-xs hover:bg-red-100">AC</button>
        <button onClick={() => setDisplay(d => d.slice(0, -1) || "0")} className={btnClass}><Delete size={16} className="mx-auto"/></button>
        <button onClick={() => handleOp("÷")} className={opClass}>÷</button>

        {[7, 8, 9].map(n => <button key={n} onClick={() => handleNum(String(n))} className={btnClass}>{n}</button>)}
        <button onClick={() => handleOp("×")} className={opClass}>×</button>

        {[4, 5, 6].map(n => <button key={n} onClick={() => handleNum(String(n))} className={btnClass}>{n}</button>)}
        <button onClick={() => handleOp("-")} className={opClass}>-</button>

        {[1, 2, 3].map(n => <button key={n} onClick={() => handleNum(String(n))} className={btnClass}>{n}</button>)}
        <button onClick={() => handleOp("+")} className={opClass}>+</button>

        <button onClick={() => handleNum("0")} className={`${btnClass} col-span-2`}>0</button>
        <button onClick={() => handleNum(".")} className={btnClass}>.</button>
        <button onClick={calculate} className="h-10 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm flex items-center justify-center"><Equal size={18}/></button>
      </div>
    </div>
  );
}