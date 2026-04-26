const DEBUG = import.meta.env.VITE_DEBUG_MODE === 'true';

export const debugLog = {
  adaptive: (msg: string, data?: any) => {
    if (!DEBUG) return;
    console.log(`🎯 [ADAPTIVE] ${msg}`, data ?? '');
  },
  mastery: (area: string, competence: string, before: number, after: number) => {
    if (!DEBUG) return;
    const delta = after - before;
    const sign = delta >= 0 ? '+' : '';
    console.log(
      `📊 [MASTERY] ${area}.${competence}: ` +
      `${before.toFixed(3)} → ${after.toFixed(3)} ` +
      `(${sign}${delta.toFixed(3)})`
    );
  },
  llm: (type: string, level: string, timeMs: number, preview?: string) => {
    if (!DEBUG) return;
    console.log(
      `🧠 [LLM] ${type}/${level} in ${(timeMs / 1000).toFixed(1)}s` +
      (preview ? `\n   → ${preview.substring(0, 80)}...` : '')
    );
  },
  prereq: (failedConcept: string, prereqId: string, mastery: number, action: string) => {
    if (!DEBUG) return;
    console.log(
      `⚡ [PREREQ] Failed ${failedConcept}` +
      `\n   → ${prereqId} mastery: ${mastery.toFixed(2)} ${action}`
    );
  },
  engine: (msg: string, data?: any) => {
    if (!DEBUG) return;
    console.log(`⚙️ [ENGINE] ${msg}`, data ?? '');
  },
  session: (msg: string, data?: any) => {
    if (!DEBUG) return;
    console.log(`💾 [SESSION] ${msg}`, data ?? '');
  },
};
