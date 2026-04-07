export interface ExerciseStep {
  id: string;           // e.g. 'identify_right_angle'
  order: number;        // 1, 2, 3...
  type: 'click_svg'          // student clicks on SVG element
      | 'select_option'      // student selects from buttons
      | 'fill_values'        // student fills in blanks
      | 'numeric_input'      // student types a number
      | 'click_svg_sequence' // student makes multiple sequential SVG clicks
      | 'label_triangle';    // student assigns values to triangle sides via dropdowns
  instruction: string;  // shown to student in Catalan (main step; for click_svg_sequence the active sub-step instruction overrides this)
  hint?: string;        // optional hint (for click_svg_sequence, use subSteps[i].hint instead)
  correctAnswer: string | number; // what constitutes a correct answer
  svgHighlight?: string; // which SVG element to highlight for this step
  options?: string[];   // choices for select_option steps
  fillLabel?: string;   // left-hand label for fill_values display, e.g. 'c²', 'b²', 'a²'
  subSteps?: Array<{    // sequential sub-steps for click_svg_sequence
    instruction: string;
    correctAnswer: string;
    hint: string;
  }>;
  labelOptions?: Array<{   // side-assignment options for label_triangle
    id: string;            // 'hypotenuse' | 'legA' | 'legB'
    displayName: string;   // e.g. 'Hipotenusa (escala)'
    correctValue: string;  // e.g. '5m' or 'x'
  }>;
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
