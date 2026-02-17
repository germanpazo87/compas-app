import { Router, type Request, type Response } from "express";
import { LLMController } from "../controllers/LLMController";
import type { CompasRequest } from "../types";

export function createCompasRouter(apiKey: string): Router {
  const router = Router();
  const controller = new LLMController(apiKey);

  router.post("/ask", async (req: Request, res: Response) => {
    try {
      const request: CompasRequest = req.body;

      // Basic validation
      if (!request.exercise_id || !request.student_question) {
        return res.status(400).json({
          error: "Missing required fields: exercise_id, student_question",
        });
      }

      const response = await controller.handleRequest(request);

      res.json(response);
    } catch (error: any) {
      console.error("Controller error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}