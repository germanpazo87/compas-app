import { ResponseValidator } from "../services/ResponseValidator";

describe("ResponseValidator", () => {
  const validator = new ResponseValidator();

  test("Valid response passes", () => {
    const raw = JSON.stringify({
      response_text: "Pensa en la fórmula de la mitjana.",
      scaffolding_type: "hint",
      keywords_ca: ["mitjana", "suma"],
      direct_answer_given: false,
    });

    const result = validator.validate(raw, "minimal");
    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
  });

  test("Missing field rejected", () => {
    const raw = JSON.stringify({
      response_text: "Test",
      scaffolding_type: "hint",
      keywords_ca: [],
    });

    const result = validator.validate(raw, "minimal");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing required field: direct_answer_given");
  });

  test("Direct answer blocked on non-full support", () => {
    const raw = JSON.stringify({
      response_text: "La resposta és 42",
      scaffolding_type: "hint",
      keywords_ca: [],
      direct_answer_given: true,
    });

    const result = validator.validate(raw, "guided");
    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toContain("only allowed when support_level=full");
  });

  test("Hallucinated fields rejected", () => {
    const raw = JSON.stringify({
      response_text: "Test",
      scaffolding_type: "hint",
      keywords_ca: [],
      direct_answer_given: false,
      extra_field: "not allowed",
    });

    const result = validator.validate(raw, "minimal");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Unexpected fields: extra_field");
  });

  test("Markdown backticks stripped", () => {
    const raw = "```json\n" + JSON.stringify({
      response_text: "Test",
      scaffolding_type: "socratic",
      keywords_ca: ["test"],
      direct_answer_given: false,
    }) + "\n```";

    const result = validator.validate(raw, "socratic");
    expect(result.valid).toBe(true);
  });
});
