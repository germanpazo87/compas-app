export interface SimulationLog {
  mastery: number;
  realAbility: number;
  difficulty: number;
}

/**
 * Càlcul de l'error mitjà absolut (MAE)
 */
export function computeMAE(logs: SimulationLog[]): number {
  if (logs.length === 0) return 0; // 🛡️ Guard: evita divisió per zero

  const sum = logs.reduce((acc, log) => {
    // Si per algun motiu un log és undefined, sumem 0
    if (!log) return acc;
    return acc + Math.abs(log.mastery - log.realAbility);
  }, 0);

  return sum / logs.length;
}

/**
 * Càlcul de l'índex d'inflació
 */
export function computeInflationIndex(logs: SimulationLog[]): number {
  if (logs.length === 0) return 0;
  
  const last = logs.at(-1); // Ús de .at(-1) per seguretat
  if (!last) return 0;

  return (last.mastery - last.realAbility) / logs.length;
}

/**
 * Càlcul de la deriva de decisió (Drift)
 */
export function computeDecisionDrift(logsA: SimulationLog[], logsB: SimulationLog[]): number {
  // 🛡️ Guard: si un dels dos arrays està buit, no hi ha deriva possible
  if (logsA.length === 0 || logsB.length === 0) return 0;

  let drift = 0;
  const len = Math.min(logsA.length, logsB.length);
  let validCount = 0;

  for (let i = 0; i < len; i++) {
    const logA = logsA[i];
    const logB = logsB[i];

    // 🛡️ Verifiquem que els dos objectes existeixin abans de llegir 'difficulty'
    if (logA && logB) {
      drift += Math.abs(logA.difficulty - logB.difficulty);
      validCount++;
    }
  }

  return validCount > 0 ? drift / validCount : 0;
}