import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type { InteractionLog, CompasRequest, CompasResponse } from "../types";

export class InteractionLogger {
  private logsDir: string;

  constructor(logsDir = "./logs/interactions") {
    this.logsDir = logsDir;
  }

  async log(
    request: CompasRequest,
    response: CompasResponse,
    rawResponse: string
  ): Promise<void> {
    const logEntry: InteractionLog = {
      timestamp: new Date().toISOString(),
      exercise_id: request.exercise_id,
      mastery: request.student_metrics.mastery,
      language_level: request.student_metrics.language_level,
      language: request.language,
      scaffolding_type: response.scaffolding_type,
      response_length: response.response_text.length,
      direct_answer_given: response.direct_answer_given,
      raw_response: rawResponse,
      support_level: request.support_level,
      integrity_score: request.student_metrics.integrity_score,
    };

    await this.ensureLogsDir();

    const filename = `${new Date().toISOString().split("T")[0]}.jsonl`;
    const filepath = join(this.logsDir, filename);

    await writeFile(filepath, JSON.stringify(logEntry) + "\n", {
      flag: "a",
    });
  }

  private async ensureLogsDir(): Promise<void> {
    try {
      await mkdir(this.logsDir, { recursive: true });
    } catch (e) {
      // Directory already exists
    }
  }
}