/**
 * INTEGRITY ENGINE TYPES
 * Contracts for interaction reliability assessment.
 */

/**
 * Configuration for IntegrityEngine heuristics
 */
export interface IntegrityConfig {
  /**
   * Minimum response time (seconds) to avoid fast-response flag
   * Typical: 2s for calculation, 5s for problem-solving
   */
  fastResponseThreshold: number;

  /**
   * Maximum single-interaction performance jump
   * Typical: 0.3 (30% increase is suspicious)
   */
  jumpThreshold: number;

  /**
   * Consecutive correct answers before streak flag
   * Typical: 8 consecutive with low mastery
   */
  streakThreshold: number;

  /**
   * Minimum expected success probability for consistency
   * Typical: 0.3 (30% chance or lower is suspicious)
   */
  consistencyThreshold: number;

  /**
   * Critical score below which updates are blocked
   * Typical: 0.5 (requires multiple heuristics to block)
   */
  blockThreshold: number;

  /**
   * Reliability penalty multiplier for students with low history
   * Typical: 0.8 (20% harsher scoring)
   */
  reliabilityPenalty: number;
}

/**
 * Input data for integrity evaluation
 */
export interface InteractionData {
  conceptId: string;
  area: "arithmetic" | "statistics" | "algebra";
  competence: string;
  correct: boolean;
  responseTimeSeconds: number;
  timestamp: number;
  focusLostCount?: number;
}

/**
 * Result of integrity assessment
 */
export interface IntegrityResult {
  /**
   * Whether interaction is considered reliable
   * true if score ≥ blockThreshold
   */
  reliable: boolean;

  /**
   * Composite reliability score (0.0 - 1.0)
   * Used as weight multiplier if update proceeds
   */
  score: number;

  /**
   * Human-readable flags explaining score reduction
   */
  flags: string[];

  /**
   * Whether studentModelUpdater should block this update
   * true if score < blockThreshold
   */
  blockUpdate: boolean;
}

/**
 * Interaction history for streak detection
 */
export interface InteractionHistory {
  conceptId: string;
  correct: boolean;
  timestamp: number;
}