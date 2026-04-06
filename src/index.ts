import 'dotenv/config';
import express from "express";
import cors from "cors";
import { createCompasRouter } from "./api/compas.routes";

const app = express();
const PORT = process.env.PORT || 3000;

// 🛡️ PROTECCIÓ: Declarem la clau i ens assegurem que no sigui undefined
// Fem servir || "" per evitar l'error de tipus 'string | undefined'
const GEMINI_API_KEY: string = process.env.GEMINI_API_KEY || "";

// Comprovació de seguretat abans d'arrencar les rutes
if (!GEMINI_API_KEY || GEMINI_API_KEY === "") {
  console.error("❌ ERROR CRÍTIC: La variable GEMINI_API_KEY no està definida al fitxer .env");
  process.exit(1); // Aturem el procés si no hi ha clau
}

app.use(cors());
app.use(express.json());

// 🧭 Aquí és on tenies l'error. Ara GEMINI_API_KEY és segurament un string.
app.use("/api/compas", createCompasRouter(GEMINI_API_KEY));

app.listen(PORT, () => {
  console.log(`🧭 COMPÀS backend running on port ${PORT}`);
});