import { 
  type ExerciseInstance, 
  type AnswerEvaluationResult, 
  type ExerciseType 
} from "../core/ExerciseEngine";

// ⚠️ Importem la instància des del context del Compàs
import { exerciseEngine } from "../core/compas/CompasContext";

export const ExerciseService = {
  
  /**
   * Genera un exercici real usant la lògica matemàtica del domini.
   */
  generate: async (type: ExerciseType, options?: any): Promise<ExerciseInstance> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const ex = exerciseEngine.generate(type, options);
          resolve(ex);
        } catch (error) {
          console.error("Error en ExerciseService.generate:", error);
          reject(error);
        }
      }, 300);
    });
  },

  /**
   * Avalua la resposta completa usant l'evaluador del domini.
   */
  evaluate: async (
    exercise: ExerciseInstance,
    answer: unknown
  ): Promise<AnswerEvaluationResult> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const result = exerciseEngine.evaluate(exercise, answer);
          resolve(result);
        } catch (error) {
          console.error("Error en ExerciseService.evaluate:", error);
          reject(error);
        }
      }, 300);
    });
  },

  /**
   * ✅ VALIDACIÓ INDIVIDUAL DE CAMP (Autovalidació)
   * Comprova si un valor concret és correcte comparant-lo amb la solució.
   * Aquest mètode és síncron perquè s'executa en cada pulsació de tecla o 'onBlur'.
   */
  /**
   * ✅ VALIDACIÓ INDIVIDUAL DE CAMP (Autovalidació)
   * Comprova si un valor concret és correcte comparant-lo amb la solució.
   */
  validateField: (exercise: ExerciseInstance, fieldKey: string, value: any): boolean => {
    // 1. CERCA ROBUSTA DE LA SOLUCIÓ
    // Intentem trobar l'objecte solució a l'arrel (exercise.solution)
    // o dins de data (exercise.data.solution) per compatibilitat.
    const solutionObj = (exercise as any).solution || (exercise as any).data?.solution;

    // Si no trobem l'estructura de solució, assumim que és correcte per no bloquejar
    if (!solutionObj) {
        console.warn("No s'ha trobat l'objecte solució a l'exercici per validar.");
        return true;
    }

    // 2. OBTENIR EL VALOR CORRECTE
    // Usem la clau (ex: "rows.0.fi") per navegar dins l'objecte solució
    const solutionValue = getNestedValue(solutionObj, fieldKey);
    
    // Si la clau no existeix a la solució, no podem validar
    if (solutionValue === undefined) return true;

    // 3. COMPARACIÓ
    if (value === null || value === undefined || value === "") return true; // No validem camps buits mentre s'escriu

    // Convertim a string, treiem espais i normalitzem comes/punts per a decimals
    const inputStr = value.toString().trim().replace(',', '.');
    const solutionStr = solutionValue.toString().trim().replace(',', '.');

    // Per a freqüències relatives (decimals), potser caldria una petita tolerància,
    // però per ara fem comparació directa d'strings normalitzats.
    return inputStr === solutionStr;
  }
};
/**
 * 🔍 FUNCIÓ AUXILIAR (Helper)
 * Permet accedir a valors niats mitjançant strings com "0.absFreq" o "result.final"
 */
function getNestedValue(obj: any, path: string) {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj);
}