import React, { useState } from "react";

interface ReflectionScreenProps {
  question: string;
  onComplete: (response: string) => void;
}

export function ReflectionScreen({ question, onComplete }: ReflectionScreenProps) {
  const [response, setResponse] = useState("");

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 max-w-xl w-full mx-auto shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">💭</span>
        <h3 className="text-lg font-bold text-indigo-900">Reflexiona un moment</h3>
      </div>
      <p className="text-gray-800 text-base font-medium mb-5 leading-relaxed">{question}</p>
      <textarea
        className="w-full border border-indigo-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        rows={3}
        placeholder="Escriu la teva reflexió aquí..."
        value={response}
        onChange={(e) => setResponse(e.target.value)}
      />
      <div className="flex justify-end mt-4">
        <button
          onClick={() => onComplete(response)}
          className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
