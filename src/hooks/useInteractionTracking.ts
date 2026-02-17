// src/hooks/useInteractionTracking.ts
import { useState, useEffect, useRef } from 'react';

export interface InteractionMetrics {
  latencyMs: number;
  focusLostCount: number;
  startTime: number;
  firstInteractionTime: number | null;
  hintsOpened: number; // <--- LA PEÇA QUE FALTAVA
}

export const useInteractionTracking = () => {
  const [metrics, setMetrics] = useState<InteractionMetrics>({
    latencyMs: 0,
    focusLostCount: 0,
    startTime: Date.now(),
    firstInteractionTime: null,
    hintsOpened: 0, // <--- INICIALITZA A ZERO
  });

  const isFirstInteraction = useRef(true);

  useEffect(() => {
    // 1. Detecció de pèrdua de focus (Tab switching / ChatGPT hunting)
    const handleBlur = () => {
      setMetrics(prev => ({
        ...prev,
        focusLostCount: prev.focusLostCount + 1
      }));
    };

    // 2. Detecció de visibilitat (Més precís en mòbils)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBlur();
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Funció per registrar el primer keystroke o click
  const recordInteraction = () => {
    if (isFirstInteraction.current) {
      const now = Date.now();
      const latency = now - metrics.startTime;
      
      setMetrics(prev => ({
        ...prev,
        firstInteractionTime: now,
        latencyMs: latency
      }));
      
      isFirstInteraction.current = false;
      console.log(`[Metrics] Latència detectada: ${latency}ms`);
    }
  };

  return { metrics, recordInteraction };
};