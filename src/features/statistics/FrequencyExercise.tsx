/**
 * FREQUENCY EXERCISE COMPONENT
 * Component React amb avaluació conceptual universal.
 * La state machine manté control exclusiu sobre milestones.
 */

import { useEffect, useState } from "react";
import { generateFrequencyTable } from "../../domain/statistics/frequencyTableGenerator";
import { createOracleEngine } from "../../oracle/OracleEngine";
import type { ExerciseState } from "../../oracle/contextBuilder";
import {
  OpenAnswerEvaluationEngine,
  type OpenAnswerEvaluationResult,
} from "../../core/evaluation/OpenAnswerEvaluationEngine";

/**
 * COMPONENT PRINCIPAL
 */
export function FrequencyExercise() {
  // Estats del dataset i exercici
  const [dataset, setDataset] = useState<ReturnType<typeof generateFrequencyTable> | null>(null);
  const [exerciseState, setExerciseState] = useState<ExerciseState | null>(null);
  
  // Inputs controlats de l'alumne
  const [identifiedN, setIdentifiedN] = useState<string>("");
  const [identifiedVariable, setIdentifiedVariable] = useState<string>("");
  const [identifiedType, setIdentifiedType] = useState<string>("");
  
  // Oracle i validació
  const [oracleOutput, setOracleOutput] = useState<string>("");
  const [isConsulting, setIsConsulting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState<string>("");

  // Resultats d'avaluació conceptual
  const [evaluationResults, setEvaluationResults] = useState<{
    variable?: OpenAnswerEvaluationResult;
    type?: OpenAnswerEvaluationResult;
  }>({});

  /**
   * GENERACIÓ INICIAL DEL DATASET
   */
  useEffect(() => {
    const generatedData = generateFrequencyTable({
      type: "qualitative",
      minValues: 20,
      maxValues: 25,
    });

    setDataset(generatedData);

    const initialState: ExerciseState = {
      exerciseId: `freq-${Date.now()}`,
      milestone: "metadata_sync",

      datasetSummary: {
        variableName: generatedData.variableName,
        variableType: generatedData.variableType,
        N: generatedData.N,
        categories: generatedData.categories,
        frequencies: generatedData.frequencies,
      },

      studentInput: {
        identifiedN: null,
        identifiedVariable: null,
        identifiedType: null,
      },

      validationStatus: {
        isCorrect: false,
        errorCount: 0,
      },

      pedagogicalState: {
        autonomyLevel: "medium",
      },

      languageConfig: {
        primaryLanguage: "ca",
        interactionLanguage: "ca",
        glossaryMode: false,
      },
    };

    setExerciseState(initialState);
  }, []);

  /**
   * HANDLER: Validar metadades amb avaluació conceptual universal
   */
  const handleValidateMetadata = async () => {
    if (!exerciseState || !dataset) return;

    setIsValidating(true);
    setValidationFeedback("");

    // Instància motor d'avaluació conceptual
    const evaluator = new OpenAnswerEvaluationEngine({ mockMode: true });

    // 1️⃣ Validació de N (continua sent estricta)
    const studentN = parseInt(identifiedN, 10);
    const isNCorrect = !isNaN(studentN) && studentN === dataset.N;

    // 2️⃣ Avaluació conceptual de variable
    const variableEvaluation = await evaluator.evaluate({
      expectedConcept: dataset.variableName,
      studentAnswer: identifiedVariable,
      interactionLanguage: exerciseState.languageConfig.interactionLanguage,
      canonicalLanguage: exerciseState.languageConfig.primaryLanguage,
    });
    const isVariableCorrect = variableEvaluation.conceptualCorrect;

    // 3️⃣ Avaluació conceptual de tipus
    // Mapa multilingüe de tipus acceptats
    const typeConceptMap: Record<string, string[]> = {
      qualitative: ["qualitativa", "cualitativa", "qualitative"],
      quantitative_discrete: [
        "quantitativa discreta",
        "cuantitativa discreta",
        "quantitative discrete",
        "discreta",
      ],
      quantitative_continuous: [
        "quantitativa contínua",
        "cuantitativa continua",
        "quantitative continuous",
        "contínua",
      ],
    };

    const typeEvaluation = await evaluator.evaluate({
      expectedConcept: typeConceptMap[dataset.variableType] || [dataset.variableType],
      studentAnswer: identifiedType,
      interactionLanguage: exerciseState.languageConfig.interactionLanguage,
      canonicalLanguage: exerciseState.languageConfig.primaryLanguage,
    });
    const isTypeCorrect = typeEvaluation.conceptualCorrect;

    // Guarda resultats d'avaluació
    setEvaluationResults({
      variable: variableEvaluation,
      type: typeEvaluation,
    });

    // 4️⃣ Càlcul de resultats finals
    const allCorrect = isNCorrect && isVariableCorrect && isTypeCorrect;
    const errorCount = [isNCorrect, isVariableCorrect, isTypeCorrect].filter(
      (v) => !v
    ).length;

    // 5️⃣ Feedback utilitzant feedbackSuggestion del motor
    const feedback: string[] = [];

    if (!isNCorrect) {
      feedback.push("❌ N total incorrecte");
    } else {
      feedback.push("✅ N total correcte");
    }

    if (!isVariableCorrect) {
      feedback.push(`❌ Variable: ${variableEvaluation.feedbackSuggestion}`);
    } else {
      feedback.push(`✅ Variable: ${variableEvaluation.feedbackSuggestion}`);
    }

    if (!isTypeCorrect) {
      feedback.push(`❌ Tipus: ${typeEvaluation.feedbackSuggestion}`);
    } else {
      feedback.push(`✅ Tipus: ${typeEvaluation.feedbackSuggestion}`);
    }

    setValidationFeedback(feedback.join("\n"));

    // 6️⃣ Actualitza exerciseState (STATE MACHINE manté control)
    setExerciseState((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        studentInput: {
          identifiedN: studentN,
          identifiedVariable: identifiedVariable,
          identifiedType: identifiedType,
        },
        validationStatus: {
          isCorrect: allCorrect,
          errorCount: errorCount,
        },
        milestone: allCorrect ? "categories_completed" : prev.milestone,
      };
    });

    setIsValidating(false);
  };

  /**
   * HANDLER: Consultar Oracle
   */
  const handleConsultOracle = async () => {
    if (!exerciseState) {
      console.error("Exercise state not initialized");
      return;
    }

    setIsConsulting(true);
    setOracleOutput("");

    try {
      // Oracle rep només resultats finals de validació
      // NO rep detalls d'avaluació conceptual
      const oracle = createOracleEngine({ mockMode: true });
      const message = await oracle.generateOracleMessage(exerciseState);
      setOracleOutput(message);
    } catch (error) {
      console.error("Oracle consultation error:", error);
      setOracleOutput("Error al consultar l'Oracle. Comprova la consola.");
    } finally {
      setIsConsulting(false);
    }
  };

  /**
   * LOADING STATE
   */
  if (!dataset || !exerciseState) {
    return (
      <div style={styles.container}>
        <p>Generant exercici...</p>
      </div>
    );
  }

  /**
   * RENDER PRINCIPAL
   */
  const isMetadataPhase = exerciseState.milestone === "metadata_sync";

  return (
    <div style={styles.container}>
      {/* Header */}
      <h1 style={styles.title}>Exercici: Taula de Freqüències</h1>
      <p style={styles.subtitle}>
        Fase: <strong>{exerciseState.milestone}</strong>
      </p>

      {/* Dataset Information */}
      <div style={styles.datasetBox}>
        <h2 style={styles.sectionTitle}>Dades de l'exercici</h2>
        <div style={styles.infoRow}>
          <strong>Dades originals:</strong>
          <div style={styles.rawDataDisplay}>
            {dataset.rawData.join(", ")}
          </div>
        </div>
      </div>

      {/* Metadata Input Section */}
      {isMetadataPhase && (
        <div style={styles.inputSection}>
          <h2 style={styles.sectionTitle}>Identifica les metadades</h2>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <strong>N (total d'observacions):</strong>
            </label>
            <input
              type="number"
              value={identifiedN}
              onChange={(e) => setIdentifiedN(e.target.value)}
              placeholder="Ex: 25"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <strong>Nom de la variable:</strong>
            </label>
            <input
              type="text"
              value={identifiedVariable}
              onChange={(e) => setIdentifiedVariable(e.target.value)}
              placeholder="Ex: Color preferit"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <strong>Tipus de variable:</strong>
            </label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="variableType"
                  value="qualitative"
                  checked={identifiedType === "qualitative"}
                  onChange={(e) => setIdentifiedType(e.target.value)}
                />
                Qualitativa
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="variableType"
                  value="quantitative_discrete"
                  checked={identifiedType === "quantitative_discrete"}
                  onChange={(e) => setIdentifiedType(e.target.value)}
                />
                Quantitativa discreta
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="variableType"
                  value="quantitative_continuous"
                  checked={identifiedType === "quantitative_continuous"}
                  onChange={(e) => setIdentifiedType(e.target.value)}
                />
                Quantitativa contínua
              </label>
            </div>
          </div>

          <button
            onClick={handleValidateMetadata}
            disabled={
              isValidating ||
              !identifiedN ||
              !identifiedVariable ||
              !identifiedType
            }
            style={{
              ...styles.button,
              ...styles.buttonPrimary,
              ...(isValidating ||
              !identifiedN ||
              !identifiedVariable ||
              !identifiedType
                ? styles.buttonDisabled
                : {}),
            }}
          >
            {isValidating ? "Validant..." : "✓ Validar metadades"}
          </button>

          {validationFeedback && (
            <div
              style={{
                ...styles.feedbackBox,
                ...(exerciseState.validationStatus.isCorrect
                  ? styles.feedbackSuccess
                  : styles.feedbackError),
              }}
            >
              <pre style={styles.feedbackText}>{validationFeedback}</pre>
            </div>
          )}
        </div>
      )}

      {/* Dataset validat */}
      {!isMetadataPhase && (
        <div style={styles.datasetBox}>
          <h2 style={styles.sectionTitle}>Metadades validades</h2>
          <div style={styles.infoRow}>
            <strong>Variable:</strong> {dataset.variableName}
          </div>
          <div style={styles.infoRow}>
            <strong>Tipus:</strong> {dataset.variableType}
          </div>
          <div style={styles.infoRow}>
            <strong>N total:</strong> {dataset.N}
          </div>
          <div style={styles.infoRow}>
            <strong>Categories detectades:</strong>
            <ul style={styles.categoryList}>
              {dataset.categories.map((cat, idx) => (
                <li key={idx}>{cat}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Oracle Consultation */}
      <div style={styles.oracleSection}>
        <button
          onClick={handleConsultOracle}
          disabled={isConsulting}
          style={{
            ...styles.button,
            ...styles.buttonOracle,
            ...(isConsulting ? styles.buttonDisabled : {}),
          }}
        >
          {isConsulting ? "Consultant..." : "🔮 Consultar l'Oracle"}
        </button>

        {oracleOutput && (
          <div style={styles.outputBox}>
            <h3 style={styles.outputTitle}>Resposta de l'Oracle:</h3>
            <pre style={styles.outputText}>{oracleOutput}</pre>
          </div>
        )}
      </div>

      {/* Debug: Evaluation Results */}
      {Object.keys(evaluationResults).length > 0 && (
        <details style={styles.debug}>
          <summary>Debug: Avaluació conceptual</summary>
          <pre style={styles.debugText}>
            {JSON.stringify(evaluationResults, null, 2)}
          </pre>
        </details>
      )}

      {/* Debug: ExerciseState */}
      <details style={styles.debug}>
        <summary>Debug: ExerciseState complet</summary>
        <pre style={styles.debugText}>
          {JSON.stringify(exerciseState, null, 2)}
        </pre>
      </details>
    </div>
  );
}

/**
 * ESTILS INLINE
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "2rem",
    fontFamily: "system-ui, sans-serif",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "0.5rem",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#666",
    marginBottom: "2rem",
  },
  datasetBox: {
    backgroundColor: "#f5f5f5",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    marginBottom: "1rem",
    color: "#333",
  },
  infoRow: {
    marginBottom: "1rem",
    lineHeight: "1.6",
  },
  rawDataDisplay: {
    marginTop: "0.5rem",
    padding: "0.75rem",
    backgroundColor: "#fff",
    borderRadius: "4px",
    border: "1px solid #ddd",
    fontSize: "0.9rem",
    fontFamily: "monospace",
    maxHeight: "150px",
    overflowY: "auto",
  },
  categoryList: {
    marginTop: "0.5rem",
    paddingLeft: "1.5rem",
  },
  inputSection: {
    backgroundColor: "#fff",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "2rem",
    border: "2px solid #4CAF50",
  },
  inputGroup: {
    marginBottom: "1.5rem",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    boxSizing: "border-box",
  },
  radioGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginTop: "0.5rem",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    fontSize: "1rem",
  },
  button: {
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    fontWeight: "500",
  },
  buttonPrimary: {
    backgroundColor: "#4CAF50",
    color: "white",
  },
  buttonOracle: {
    backgroundColor: "#2196F3",
    color: "white",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
    opacity: 0.6,
  },
  feedbackBox: {
    marginTop: "1rem",
    padding: "1rem",
    borderRadius: "6px",
    border: "2px solid",
  },
  feedbackSuccess: {
    backgroundColor: "#d4edda",
    borderColor: "#28a745",
    color: "#155724",
  },
  feedbackError: {
    backgroundColor: "#f8d7da",
    borderColor: "#dc3545",
    color: "#721c24",
  },
  feedbackText: {
    whiteSpace: "pre-wrap",
    fontFamily: "inherit",
    fontSize: "0.95rem",
    margin: 0,
  },
  oracleSection: {
    marginBottom: "2rem",
  },
  outputBox: {
    marginTop: "1.5rem",
    backgroundColor: "#e8f4f8",
    padding: "1.5rem",
    borderRadius: "8px",
    border: "2px solid #2196F3",
  },
  outputTitle: {
    fontSize: "1.1rem",
    marginBottom: "1rem",
    color: "#0d47a1",
  },
  outputText: {
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    fontFamily: "monospace",
    fontSize: "0.9rem",
    lineHeight: "1.5",
    color: "#1a1a1a",
    margin: 0,
  },
  debug: {
    marginTop: "2rem",
    padding: "1rem",
    backgroundColor: "#fff3cd",
    borderRadius: "6px",
    fontSize: "0.85rem",
  },
  debugText: {
    fontSize: "0.8rem",
    overflow: "auto",
    maxHeight: "300px",
  },
};