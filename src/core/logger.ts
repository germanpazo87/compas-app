// src/core/logger.ts
import type { 
  AttemptRecord, 
  InteractionTrace, 
  ValidationResult, 
  ExerciseType, 
  InteractionEvent 
} from './types';

export interface InteractionLogger {
  startTrace(exerciseId: string, type: ExerciseType, sessionId: string): string;
  logAttempt(traceId: string, attempt: AttemptRecord): Promise<void>;
  logEvent(traceId: string, event: InteractionEvent): Promise<void>;
  completeTrace(traceId: string, result: ValidationResult): Promise<void>;
  getTrace(traceId: string): Promise<InteractionTrace | null>;
}

export class InMemoryLogger implements InteractionLogger {
  private traces: Map<string, InteractionTrace> = new Map();

  startTrace(exerciseId: string, type: ExerciseType, sessionId: string): string {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.traces.set(traceId, {
      traceId,
      exerciseId,
      exerciseType: type,
      sessionId,
      startedAt: new Date().toISOString(),
      attempts: [],
      events: [],
    });
    return traceId;
  }

  async logAttempt(traceId: string, attempt: AttemptRecord): Promise<void> {
    const trace = this.traces.get(traceId);
    if (!trace) throw new Error(`Trace no trobada: ${traceId}`);
    trace.attempts.push(attempt);
  }

  async logEvent(traceId: string, event: InteractionEvent): Promise<void> {
    const trace = this.traces.get(traceId);
    if (trace) trace.events.push(event);
  }

  async completeTrace(traceId: string, finalResult: ValidationResult): Promise<void> {
    const trace = this.traces.get(traceId);
    if (trace) {
      trace.completedAt = new Date().toISOString();
      trace.finalResult = finalResult;
    }
  }

  async getTrace(traceId: string): Promise<InteractionTrace | null> {
    return this.traces.get(traceId) || null;
  }
}