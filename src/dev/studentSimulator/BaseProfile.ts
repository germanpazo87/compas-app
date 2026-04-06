export interface StudentProfile {
  name: string;
  getRealAbility(t: number): number;
  getProbabilityCorrect(difficulty: number, t: number): number;
  // 🛡️ Afegim 't' aquí per permetre comportaments banyuts segons el temps
  getResponseTime(difficulty: number, correct: boolean, t: number): number;
  shouldCheat(t: number): boolean;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function normalRandom(min: number, max: number): number {
  const u = 1 - Math.random();
  const v = 1 - Math.random();
  const s = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  const mean = (max + min) / 2;
  const dev = (max - min) / 6; 
  return clamp(s * dev + mean, min, max);
}