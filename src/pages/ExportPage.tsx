import React, { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

const CSV_HEADERS = [
  "studentId",
  "group",
  "languageFamily",
  "educationalLevel",
  "preferredLanguage",
  "preTestPythagorean",
  "postTestPythagorean",
  "preTestThales",
  "postTestThales",
  "timestamp",
  "block",
  "exerciseType",
  "exerciseLevel",
  "attemptCount",
  "llmInteractionCount",
  "timeSeconds",
  "masteryBefore",
  "masteryAfter",
  "masteryDelta",
  "evocationScore",
  "condition",
  "global_reliability",
  "global_llmInteractionsTotal",
];

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvRow(studentDoc: any, logDoc: any): string {
  const p = studentDoc.profile ?? {};
  const g = studentDoc.global ?? {};
  const a = studentDoc.assessments ?? {};

  const cells = [
    studentDoc.id ?? studentDoc.studentId ?? "",
    p.group ?? g.group ?? "",
    p.languageFamily ?? "",
    p.educationalLevel ?? "",
    p.preferredLanguage ?? "",
    a.pythagorean?.pre ?? "",
    a.pythagorean?.post ?? "",
    a.thales?.pre ?? "",
    a.thales?.post ?? "",
    logDoc.timestamp ?? "",
    logDoc.block ?? "",
    logDoc.exerciseType ?? "",
    logDoc.exerciseLevel ?? "",
    logDoc.attemptCount ?? "",
    logDoc.llmInteractionCount ?? "",
    logDoc.timeSeconds ?? "",
    logDoc.masteryBefore ?? "",
    logDoc.masteryAfter ?? "",
    logDoc.masteryDelta ?? "",
    logDoc.evocationScore ?? "",
    logDoc.condition ?? "",
    g.reliability ?? "",
    g.llmInteractionsTotal ?? "",
  ];

  return cells.map(escapeCell).join(",");
}

function triggerCsvDownload(csv: string): void {
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `compas_export_${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [rowCount, setRowCount] = useState(0);

  const handleAuth = () => {
    const correct = import.meta.env.VITE_RESEARCHER_PASSWORD;
    if (!correct) {
      setErrorMessage("VITE_RESEARCHER_PASSWORD not set in .env");
      return;
    }
    if (password === correct) {
      setAuthenticated(true);
    } else {
      setErrorMessage("Incorrect password.");
    }
  };

  const handleExport = async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const studentsSnap = await getDocs(collection(db, "students"));
      const rows: string[] = [CSV_HEADERS.join(",")];

      for (const studentDoc of studentsSnap.docs) {
        const studentData = studentDoc.data();
        const logsSnap = await getDocs(
          collection(db, "students", studentDoc.id, "sessionLogs")
        );

        if (logsSnap.empty) {
          // Student exists but has no session logs — emit one row with nulls for log fields
          rows.push(buildCsvRow(studentData, {}));
        } else {
          for (const logDoc of logsSnap.docs) {
            rows.push(buildCsvRow(studentData, logDoc.data()));
          }
        }
      }

      const csv = rows.join("\n");
      triggerCsvDownload(csv);
      setRowCount(rows.length - 1); // subtract header
      setStatus("done");
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Unknown error during export.");
      setStatus("error");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-800 mb-1">Compàs — Researcher Export</h1>
          <p className="text-sm text-gray-500 mb-6">Enter researcher password to continue.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            placeholder="Password"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errorMessage && (
            <p className="text-red-500 text-xs mb-3">{errorMessage}</p>
          )}
          <button
            onClick={handleAuth}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            Authenticate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Compàs — Researcher Export</h1>
        <p className="text-sm text-gray-500 mb-6">
          Exports all student session logs as a flat CSV file. One row per session log entry.
          Students with no logs are included as a single row with empty log fields.
        </p>

        {status === "idle" && (
          <button
            onClick={handleExport}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            Export CSV
          </button>
        )}

        {status === "loading" && (
          <div className="flex items-center gap-3 text-gray-500 text-sm">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            Querying Firestore...
          </div>
        )}

        {status === "done" && (
          <div className="space-y-3">
            <p className="text-green-600 text-sm font-medium">
              Done — {rowCount} data rows exported.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="w-full border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Export again
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <p className="text-red-500 text-sm">{errorMessage}</p>
            <button
              onClick={() => setStatus("idle")}
              className="w-full border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
