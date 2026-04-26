import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

// Geometry competence definitions for the mastery section
const GEOMETRY_CONCEPTUAL: { id: string; label: string }[] = [
  { id: "right_triangle_id",   label: "Identifica △ rectangle" },
  { id: "hypotenuse_id",       label: "Identifica hipotenusa" },
  { id: "pythagorean_basic",   label: "Pitàgores bàsic" },
  { id: "pythagorean_leg",     label: "Pitàgores catet" },
  { id: "pythagorean_verify",  label: "Comprova rectangle" },
  { id: "pythagorean_context", label: "Pitàgores aplicat" },
  { id: "proportion",          label: "Proporcions (Tales)" },
  { id: "similar_figures",     label: "Figures semblants" },
  { id: "tales_basic",         label: "Tales bàsic" },
  { id: "tales_shadows",       label: "Ombres i alçades" },
  { id: "tales_scale",         label: "Escales i plànols" },
  { id: "tales_context",       label: "Tales aplicat" },
];

function formatTimestamp(ts: number | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("ca-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function MasteryBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.7 ? "bg-green-500" :
    value >= 0.3 ? "bg-amber-400" :
    "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

function MasterySection({ student }: { student: any }) {
  const geo = student.areas?.geometry?.competences;
  const conceptual = geo?.conceptual ?? {};

  return (
    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
        {/* Named conceptual competences */}
        {GEOMETRY_CONCEPTUAL.map(({ id, label }) => (
          <div key={id} className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">{label}</span>
            <MasteryBar value={conceptual[id]?.performance ?? 0} />
          </div>
        ))}
        {/* Procedural */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-500">Càlcul específic</span>
          <MasteryBar value={geo?.calculation_specific?.performance ?? 0} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-500">Resolució problemes</span>
          <MasteryBar value={geo?.problem_solving_specific?.performance ?? 0} />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [students, setStudents] = useState<any[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [fetchError, setFetchError] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleAuth = () => {
    const correct = import.meta.env.VITE_RESEARCHER_PASSWORD;
    if (!correct) {
      setErrorMessage("VITE_RESEARCHER_PASSWORD not set in .env");
      return;
    }
    if (password === correct) {
      setAuthenticated(true);
    } else {
      setErrorMessage("Contrasenya incorrecta.");
    }
  };

  useEffect(() => {
    if (authenticated) fetchStudents();
  }, [authenticated]);

  async function fetchStudents() {
    setStatus("loading");
    setFetchError("");
    try {
      const snap = await getDocs(collection(db, "students"));
      const data = snap.docs
        .map(d => ({ _docId: d.id, ...d.data() }))
        .sort((a, b) =>
          (a.profile?.name ?? "").localeCompare(b.profile?.name ?? "", "ca")
        );
      setStudents(data);
      setLastUpdated(new Date());
      setStatus("done");
    } catch (err: any) {
      setFetchError(err?.message ?? "Error desconegut.");
      setStatus("error");
    }
  }

  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Password gate ──────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-800 mb-1">Compàs — Dashboard Docent</h1>
          <p className="text-sm text-gray-500 mb-6">Introdueix la contrasenya per continuar.</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAuth()}
            placeholder="Contrasenya"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errorMessage && (
            <p className="text-red-500 text-xs mb-3">{errorMessage}</p>
          )}
          <button
            onClick={handleAuth}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            Accedir
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Dashboard Docent — Compàs</h1>
        <button
          onClick={() => { setAuthenticated(false); setPassword(""); }}
          className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 transition"
        >
          Tancar sessió
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {status === "loading" && (
          <div className="flex items-center gap-3 text-gray-500 text-sm py-12 justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
            Carregant dades de Firestore...
          </div>
        )}

        {status === "error" && (
          <div className="text-red-500 text-sm py-8 text-center">
            {fetchError}
            <button onClick={fetchStudents} className="ml-3 underline">Reintentar</button>
          </div>
        )}

        {status === "done" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Grup</th>
                  <th className="px-4 py-3">Llengua</th>
                  <th className="px-4 py-3">Família ling.</th>
                  <th className="px-4 py-3">Nivell educatiu</th>
                  <th className="px-4 py-3">Última sessió</th>
                  <th className="px-4 py-3 text-right">Exercicis</th>
                  <th className="px-4 py-3 text-right">LLM</th>
                  <th className="px-4 py-3 text-right">Fiabilitat</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(s => {
                  const id = s._docId;
                  const p = s.profile ?? {};
                  const g = s.global ?? {};
                  const isExpanded = expandedIds.has(id);
                  const reliability = typeof g.reliability === "number"
                    ? `${Math.round(g.reliability * 100)}%`
                    : "—";

                  return (
                    <React.Fragment key={id}>
                      <tr
                        className="hover:bg-gray-50 cursor-pointer transition"
                        onClick={() => toggleExpanded(id)}
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">{p.name ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{p.group ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{p.preferredLanguage ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{p.languageFamily ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{p.educationalLevel ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{formatTimestamp(g.lastEvocationTimestamp)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{g.attempts ?? 0}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{g.llmInteractionsTotal ?? 0}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{reliability}</td>
                        <td className="px-4 py-3 text-right text-gray-400 text-xs">
                          {isExpanded ? "▲" : "▼"}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className="p-0">
                            <MasterySection student={s} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {status === "done" && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
            <span>
              {students.length} estudiant{students.length !== 1 ? "s" : ""} ·{" "}
              Actualitzat: {lastUpdated?.toLocaleTimeString("ca-ES") ?? "—"}
            </span>
            <a
              href="/export"
              className="text-indigo-600 hover:text-indigo-800 font-medium transition"
            >
              Exportar CSV →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
