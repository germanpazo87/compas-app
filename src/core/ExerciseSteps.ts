export interface ExerciseStep {
  id: string;           // e.g. 'identify_right_angle'
  order: number;        // 1, 2, 3...
  type: 'click_svg'     // student clicks on SVG element
      | 'select_option' // student selects from buttons
      | 'fill_values'   // student fills in blanks
      | 'numeric_input'; // student types a number
  instruction: string;  // shown to student in Catalan
  hint?: string;        // optional hint shown after first wrong attempt
  correctAnswer: string | number; // what constitutes a correct answer
  svgHighlight?: string; // which SVG element to highlight for this step
  options?: string[];   // choices for select_option steps
}

export interface StepResult {
  stepId: string;
  attempts: number;
  correct: boolean;
  studentAnswer: string | number;
  timeSeconds: number;
}

export interface SteppedExercise {
  steps: ExerciseStep[];
  currentStepIndex: number;
  stepResults: StepResult[];
  completedSteps: string[]; // ids of completed steps
}
