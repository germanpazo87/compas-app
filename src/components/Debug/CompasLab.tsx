// src/components/Debug/CompasLab.tsx
import React from 'react';

export const CompasLab = ({ debugData }: { debugData: any, exerciseState?: any }) => {
  if (!debugData || !debugData.systemState) return (
    <div className="flex flex-col items-center justify-center h-full text-green-900/40 font-mono text-xs animate-pulse">
      <p>WAITING_FOR_DATA_STREAM...</p>
    </div>
  );

  const { systemState } = debugData;

  // Components d'estil "Matrix"
  const Section = ({ title, children, num }: any) => (
    <div className="mb-6 border-l-2 border-green-900/50 pl-3">
      <h3 className="text-green-600 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
        <span className="bg-green-900/20 px-1 text-green-500">{num}</span> {title}
      </h3>
      <div className="grid grid-cols-1 gap-1">
        {children}
      </div>
    </div>
  );

  const Row = ({ label, value, highlight = false }: any) => (
    <div className="flex justify-between items-baseline text-xs font-mono border-b border-green-900/10 pb-1">
      <span className="text-gray-500">{label}:</span>
      <span className={`${highlight ? 'text-yellow-400 font-bold' : 'text-green-400'} text-right truncate ml-2`}>
        {typeof value === 'boolean' ? (value ? 'TRUE' : 'FALSE') : value}
      </span>
    </div>
  );

  return (
    <div className="pb-20">
      
      {/* 1️⃣ ESTAT DE L'EXERCICI */}
      <Section title="Exercise Context" num="01">
        <Row label="ID" value={systemState.exercise.id} />
        <Row label="Competence" value={systemState.exercise.competence} />
        <Row label="Subtype" value={systemState.exercise.subtype} />
        <Row label="Variable Type" value={systemState.exercise.variableType} />
      </Section>

      {/* 2️⃣ ESTAT ALUMNE */}
      <Section title="Student Profile" num="02">
        <Row label="Has Attempted" value={systemState.student.hasAttempted} />
        <Row label="Attempt #" value={systemState.student.attemptNumber} />
        <Row label="Is Correct" value={systemState.student.isCorrect} />
        <Row label="Error Detected" value={systemState.student.errorType} highlight />
        <Row label="Confidence (Est)" value={systemState.student.confidence} />
        <Row label="Response Time" value={systemState.student.responseTime} />
      </Section>

      {/* 3️⃣ MASTERY ENGINE */}
      <Section title="Mastery Engine" num="03">
        <div className="p-2 bg-green-900/10 rounded border border-green-900/30 mb-2">
           <Row label="Current Level" value={systemState.mastery.level.toUpperCase()} highlight />
           <div className="w-full bg-gray-800 h-1 mt-1 rounded overflow-hidden">
             <div className="bg-yellow-500 h-full" style={{ width: '35%' }}></div>
           </div>
        </div>
        <Row label="Stability Index" value={systemState.mastery.stabilityIndex} />
        <Row label="Evidence Count" value={systemState.mastery.evidenceCount} />
        <div className="text-[10px] text-gray-500 mt-1">
          Recent Errors: <span className="text-red-400">[{systemState.mastery.recentErrors.join(", ")}]</span>
        </div>
      </Section>

      {/* 4️⃣ ESTRATÈGIA PEDAGÒGICA */}
      <Section title="Pedagogical Strategy" num="04">
        <Row label="Active Mode" value={systemState.strategy.mode} highlight />
        <Row label="Strategy" value={systemState.strategy.strategy} />
        <Row label="Cognitive Target" value={systemState.strategy.cognitiveTarget} />
        <Row label="Intensity" value={systemState.strategy.intensity} />
      </Section>

      {/* 5️⃣ SISTEMA (PROMPT & RAW) */}
      <div className="mt-8 pt-4 border-t border-gray-800">
        <details className="group">
          <summary className="cursor-pointer text-[10px] text-gray-600 hover:text-green-500 uppercase tracking-widest mb-2">
            [+] EXPAND_SYSTEM_LOGS
          </summary>
          <div className="space-y-4 mt-2">
            <div>
              <p className="text-[9px] text-blue-500 mb-1">SENT_PAYLOAD (PROMPT)</p>
              <pre className="text-[9px] text-gray-500 whitespace-pre-wrap bg-black border border-gray-800 p-2 rounded">
                {debugData.lastPrompt}
              </pre>
            </div>
            <div>
              <p className="text-[9px] text-green-500 mb-1">RECEIVED_PAYLOAD (RAW)</p>
              <pre className="text-[9px] text-green-800 whitespace-pre-wrap bg-black border border-gray-800 p-2 rounded">
                {debugData.rawResponse}
              </pre>
            </div>
          </div>
        </details>
      </div>

    </div>
  );
};