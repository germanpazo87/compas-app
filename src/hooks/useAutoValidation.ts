import { useState } from 'react';
import { ExerciseService } from '../services/ExerciseService';
import type { ExerciseInstance } from '../core/ExerciseEngine';

// Definim els tipus d'estat possibles
export type FieldStatus = 'valid' | 'invalid' | 'undefined';

export function useAutoValidation(exercise: ExerciseInstance) {
  // Guardem l'estat de cada camp: Record<nom_del_camp, estat>
  const [fieldStatuses, setFieldStatuses] = useState<Record<string, FieldStatus>>({});

  const validate = (fieldId: string, value: any) => {
    // 1. Si el camp està buit, estat neutre
    if (value === "" || value === undefined || value === null) {
      setFieldStatuses(prev => ({ ...prev, [fieldId]: 'undefined' }));
      return;
    }

    // 2. Consultem al servei si és correcte
    const isValid = ExerciseService.validateField(exercise, fieldId, value);

    // 3. Guardem l'estat segons el resultat
    setFieldStatuses(prev => ({
      ...prev,
      [fieldId]: isValid ? 'valid' : 'invalid'
    }));
  };

  return { fieldStatuses, validate };
}