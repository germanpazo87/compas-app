/**
 * OPEN ANSWER EVALUATION ENGINE
 * Motor universal d'avaluació conceptual per preguntes obertes.
 * Independent del domini, multilingüe, preparat per integració amb LLM.
 */

/**
 * Input per avaluació conceptual
 */
export interface OpenAnswerEvaluationInput {
  expectedConcept: string | string[]; // Concept(s) correcte(s) acceptat(s)
  studentAnswer: string; // Resposta de l'alumne
  interactionLanguage: string; // Llengua de resposta (ca, es, en...)
  canonicalLanguage: string; // Llengua canònica del concepte (ca)
}

/**
 * Resultat estructurat d'avaluació
 */
export interface OpenAnswerEvaluationResult {
  conceptualCorrect: boolean; // És conceptualment correcte?
  confidence: number; // Nivell de confiança (0.0 - 1.0)
  canonicalAnswer: string; // Resposta canònica en llengua original
  linguisticAccuracy: "high" | "medium" | "low"; // Precisió lingüística
  feedbackSuggestion: string; // Suggeriment de feedback pedagògic
}

/**
 * Opcions de configuració del motor
 */
export interface OpenAnswerEvaluationEngineOptions {
  mockMode: boolean; // Si true, usa lògica determinista; si false, crida LLM
  llmEndpoint?: string; // Futur: endpoint de Gemini/Claude
  llmApiKey?: string; // Futur: API key
}

/**
 * OPEN ANSWER EVALUATION ENGINE
 * Motor principal d'avaluació conceptual
 */
export class OpenAnswerEvaluationEngine {
  private options: OpenAnswerEvaluationEngineOptions;

  constructor(options: OpenAnswerEvaluationEngineOptions) {
    this.options = {
      mockMode: options.mockMode ?? true,
      llmEndpoint: options.llmEndpoint,
      llmApiKey: options.llmApiKey,
    };
  }

  /**
   * MÈTODE PRINCIPAL: Avaluar resposta oberta
   */
  public async evaluate(
    input: OpenAnswerEvaluationInput
  ): Promise<OpenAnswerEvaluationResult> {
    // Normalitza expectedConcept a array
    const expectedConcepts = Array.isArray(input.expectedConcept)
      ? input.expectedConcept
      : [input.expectedConcept];

    if (this.options.mockMode) {
      return this.evaluateDeterministic(input, expectedConcepts);
    } else {
      return this.evaluateWithLLM(input, expectedConcepts);
    }
  }

  /**
   * AVALUACIÓ DETERMINISTA (Mock Mode)
   * Lògica basada en comparació lingüística avançada
   */
  private evaluateDeterministic(
    input: OpenAnswerEvaluationInput,
    expectedConcepts: string[]
  ): OpenAnswerEvaluationResult {
    const studentNormalized = this.normalizeText(input.studentAnswer);

    // Prova cada concepte esperat
    let bestMatch: {
      isMatch: boolean;
      confidence: number;
      matchedConcept: string;
      linguisticAccuracy: "high" | "medium" | "low";
    } = {
      isMatch: false,
      confidence: 0.0,
      matchedConcept: expectedConcepts[0],
      linguisticAccuracy: "low",
    };

    for (const concept of expectedConcepts) {
      const conceptNormalized = this.normalizeText(concept);
      const matchResult = this.compareConceptual(
        conceptNormalized,
        studentNormalized
      );

      if (matchResult.confidence > bestMatch.confidence) {
        bestMatch = {
          isMatch: matchResult.isMatch,
          confidence: matchResult.confidence,
          matchedConcept: concept,
          linguisticAccuracy: matchResult.linguisticAccuracy,
        };
      }
    }

    // Genera feedback
    const feedbackSuggestion = this.generateFeedback(
      bestMatch.isMatch,
      bestMatch.confidence,
      bestMatch.linguisticAccuracy,
      input.interactionLanguage
    );

    return {
      conceptualCorrect: bestMatch.isMatch,
      confidence: bestMatch.confidence,
      canonicalAnswer: bestMatch.matchedConcept,
      linguisticAccuracy: bestMatch.linguisticAccuracy,
      feedbackSuggestion,
    };
  }

  /**
   * AVALUACIÓ AMB LLM (Futur)
   * Crida a Gemini/Claude per avaluació semàntica profunda
   */
  private async evaluateWithLLM(
    input: OpenAnswerEvaluationInput,
    expectedConcepts: string[]
  ): Promise<OpenAnswerEvaluationResult> {
    if (!this.options.llmEndpoint || !this.options.llmApiKey) {
      throw new Error("LLM endpoint or API key not configured");
    }

    // Construeix prompt per LLM
    const prompt = this.buildEvaluationPrompt(input, expectedConcepts);

    // TODO: Implementar crida real
    // const response = await fetch(this.options.llmEndpoint, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": `Bearer ${this.options.llmApiKey}`,
    //   },
    //   body: JSON.stringify({ prompt }),
    // });

    // Fallback a mock mentre no està implementat
    console.warn("LLM mode not implemented yet. Falling back to deterministic.");
    return this.evaluateDeterministic(input, expectedConcepts);
  }

  /**
   * NORMALITZACIÓ MULTILINGÜE
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD") // Descompon accents
      .replace(/[\u0300-\u036f]/g, "") // Elimina diacrítics
      .replace(/[^\w\s]/g, " ") // Converteix puntuació a espais
      .trim()
      .replace(/\s+/g, " "); // Unifica espais
  }

  /**
   * COMPARACIÓ CONCEPTUAL
   * Estratègia multi-nivell: exacta → inclusió → tokens → similitud
   */
  private compareConceptual(
    expected: string,
    student: string
  ): {
    isMatch: boolean;
    confidence: number;
    linguisticAccuracy: "high" | "medium" | "low";
  } {
    // Nivell 1: Coincidència exacta
    if (expected === student) {
      return { isMatch: true, confidence: 1.0, linguisticAccuracy: "high" };
    }

    // Nivell 2: Inclusió bidireccional
    if (expected.includes(student) && student.length >= 3) {
      const coverage = student.length / expected.length;
      return {
        isMatch: true,
        confidence: Math.min(0.95, 0.75 + coverage * 0.2),
        linguisticAccuracy: coverage > 0.8 ? "high" : "medium",
      };
    }

    if (student.includes(expected) && expected.length >= 3) {
      const coverage = expected.length / student.length;
      return {
        isMatch: true,
        confidence: Math.min(0.95, 0.75 + coverage * 0.2),
        linguisticAccuracy: coverage > 0.8 ? "high" : "medium",
      };
    }

    // Nivell 3: Tokens significatius compartits
    const tokenMatch = this.compareTokens(expected, student);
    if (tokenMatch.coverage >= 0.6) {
      return {
        isMatch: true,
        confidence: Math.min(0.9, 0.5 + tokenMatch.coverage * 0.4),
        linguisticAccuracy: tokenMatch.coverage > 0.8 ? "medium" : "low",
      };
    }

    // Nivell 4: Similitud Levenshtein (errors tipogràfics)
    const similarity = this.calculateSimilarity(expected, student);
    if (similarity >= 0.75) {
      return {
        isMatch: true,
        confidence: Math.min(0.85, similarity),
        linguisticAccuracy: similarity > 0.9 ? "medium" : "low",
      };
    }

    // No hi ha match
    return { isMatch: false, confidence: 0.0, linguisticAccuracy: "low" };
  }

  /**
   * COMPARACIÓ PER TOKENS
   */
  private compareTokens(
    expected: string,
    student: string
  ): { coverage: number } {
    const stopWords = new Set([
      "el", "la", "de", "del", "a", "per", "amb", "en", "un", "una",
      "els", "les", "al", "i", "o", "es", "lo", "los", "las",
      "the", "of", "to", "a", "in", "for", "with", "and", "or", "is",
    ]);

    const expectedTokens = expected
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !stopWords.has(t));

    const studentTokens = student
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !stopWords.has(t));

    if (expectedTokens.length === 0 || studentTokens.length === 0) {
      return { coverage: 0.0 };
    }

    const intersection = expectedTokens.filter((token) =>
      studentTokens.includes(token)
    );

    const coverage =
      intersection.length /
      Math.max(expectedTokens.length, studentTokens.length);

    return { coverage };
  }

  /**
   * SIMILITUD LEVENSHTEIN
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    if (maxLength === 0) return 0.0;

    return 1 - distance / maxLength;
  }

  /**
   * DISTÀNCIA LEVENSHTEIN
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    const matrix: number[][] = Array.from({ length: len1 + 1 }, () =>
      Array(len2 + 1).fill(0)
    );

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * GENERACIÓ DE FEEDBACK
   */
  private generateFeedback(
    isCorrect: boolean,
    confidence: number,
    linguisticAccuracy: "high" | "medium" | "low",
    language: string
  ): string {
    if (!isCorrect) {
      return language === "ca"
        ? "La resposta no és conceptualment correcta."
        : language === "es"
        ? "La respuesta no es conceptualmente correcta."
        : "The answer is not conceptually correct.";
    }

    if (linguisticAccuracy === "high") {
      return language === "ca"
        ? "Resposta correcta i precisa!"
        : language === "es"
        ? "¡Respuesta correcta y precisa!"
        : "Correct and precise answer!";
    }

    if (linguisticAccuracy === "medium") {
      return language === "ca"
        ? "Resposta conceptualment correcta, però amb imprecisions lingüístiques."
        : language === "es"
        ? "Respuesta conceptualmente correcta, pero con imprecisiones lingüísticas."
        : "Conceptually correct answer, but with linguistic imprecisions.";
    }

    // low accuracy
    return language === "ca"
      ? "Resposta acceptada, però recomanem revisar la formulació."
      : language === "es"
      ? "Respuesta aceptada, pero recomendamos revisar la formulación."
      : "Answer accepted, but we recommend reviewing the formulation.";
  }

  /**
   * CONSTRUCCIÓ DE PROMPT PER LLM (Futur)
   */
  private buildEvaluationPrompt(
    input: OpenAnswerEvaluationInput,
    expectedConcepts: string[]
  ): string {
    return `# ROL
Ets un avaluador conceptual expert en educació.

# TASCA
Avalua si la resposta de l'alumne és conceptualment equivalent als conceptes esperats.

# CONTEXT
- Conceptes esperats: ${expectedConcepts.join(", ")}
- Resposta de l'alumne: "${input.studentAnswer}"
- Llengua d'interacció: ${input.interactionLanguage}
- Llengua canònica: ${input.canonicalLanguage}

# INSTRUCCIONS
1. Determina si la resposta és conceptualment correcta (ignora errors ortogràfics menors)
2. Avalua la precisió lingüística (high/medium/low)
3. Calcula confiança (0.0 - 1.0)
4. Genera feedback breu en ${input.interactionLanguage}

# FORMAT DE RESPOSTA (JSON)
{
  "conceptualCorrect": boolean,
  "confidence": number,
  "linguisticAccuracy": "high" | "medium" | "low",
  "feedbackSuggestion": string
}`;
  }
}