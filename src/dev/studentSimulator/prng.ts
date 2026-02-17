/**
 * PSEUDO-RANDOM NUMBER GENERATOR (PRNG)
 * Implementació de Mulberry32 per RNG determinista.
 * Crític per reproducibilitat en testing pedagògic.
 */

/**
 * PRNG basat en Mulberry32
 * Algorithm from https://github.com/bryc/code/blob/master/jshash/PRNGs.md
 * 
 * Característiques:
 * - Període llarg (2^32)
 * - Ràpid i simple
 * - Determinista amb seed
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number = Date.now()) {
    // Garanteix seed positiu
    this.state = Math.abs(seed) >>> 0;
    
    // Warm-up per evitar patrons inicials
    for (let i = 0; i < 10; i++) {
      this.next();
    }
  }

  /**
   * Genera següent número aleatori (0.0 - 1.0)
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Genera número aleatori entre min i max
   */
  public nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Genera booleà amb probabilitat especificada
   */
  public nextBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Reseteja l'estat amb nova seed
   */
  public reset(seed: number): void {
    this.state = Math.abs(seed) >>> 0;
    for (let i = 0; i < 10; i++) {
      this.next();
    }
  }
}