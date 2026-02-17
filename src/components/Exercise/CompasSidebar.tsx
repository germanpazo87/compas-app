import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, Sparkles, User, X, BrainCircuit } from "lucide-react";
import type { CompasLLMResponse } from "../../core/llmContract";
import ReactMarkdown from 'react-markdown';

interface CompasSidebarProps {
  response: CompasLLMResponse | null;
  loading: boolean;
  onClose: () => void;
  onReply: (message: string) => void;
}

// Tipus estès per incloure la mètrica científica a l'historial
type ChatMessage = { 
  role: 'user' | 'ai'; 
  text: string; 
  keywords?: string[];
  score?: number | null; // 🆕 Mètrica TFM
};

export function CompasSidebar({ response, loading, onClose, onReply }: CompasSidebarProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Quan arriba una nova resposta de la IA, l'afegim a l'historial
  useEffect(() => {
    if (response) {
      setHistory(prev => [...prev, { 
        role: 'ai', 
        // 🛡️ Compatibilitat: Prioritzem 'message', fallback a 'response_text'
        text: response.message || (response as any).response_text || "...", 
        keywords: response.keywords_ca,
        score: response.evocationQualityScore // 🆕 Capturem la nota
      }]);
    }
  }, [response]);

  // 2. Scroll automàtic al fons
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");
    onReply(userMsg);
  };

  // 🎨 Helper per renderitzar el Badge de Qualitat (TFM)
  const renderScoreBadge = (score: number | null | undefined) => {
    if (score === null || score === undefined) return null;
    
    let colorClass = "bg-gray-100 text-gray-600 border-gray-200";
    let label = "Neutre";
    
    if (score >= 0.8) { 
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200"; 
      label = "Connexió Forta"; 
    } else if (score >= 0.5) { 
      colorClass = "bg-blue-50 text-blue-700 border-blue-200"; 
      label = "Correcte"; 
    } else { 
      colorClass = "bg-amber-50 text-amber-700 border-amber-200"; 
      label = "Difús"; 
    }

    return (
      <div className={`mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colorClass} w-fit`}>
        <BrainCircuit size={14} />
        <div className="flex flex-col leading-none">
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Activació Neural</span>
          <span className="text-xs font-mono font-bold">
            {score.toFixed(2)} <span className="font-sans font-normal opacity-75">- {label}</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-indigo-100 flex flex-col h-[calc(100vh-140px)] sticky top-4 overflow-hidden animate-in fade-in slide-in-from-right-4">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-sm">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Tutor IA</h3>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></span>
              <span className="text-[10px] opacity-90 uppercase tracking-wide font-medium">
                {loading ? 'Pensant...' : 'Connectat'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth">
        
        {/* ESTAT BUIT */}
        {history.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-4 opacity-70">
            <Sparkles size={48} className="mb-3 text-indigo-300" />
            <p className="text-sm font-medium">Hola! Sóc el teu assistent.</p>
            <p className="text-xs mt-1">
              Comença l'exercici i si t'encalles, estaré aquí per ajudar-te.
            </p>
          </div>
        )}

        {/* HISTORIAL DE MISSATGES */}
        {history.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* AVATAR */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
              msg.role === 'ai' 
                ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' 
                : 'bg-gray-200 text-gray-600 border border-gray-300'
            }`}>
              {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
            </div>
            
            {/* BOMBOLLES */}
            <div className={`max-w-[85%] text-sm leading-relaxed shadow-sm ${
               msg.role === 'ai' 
                 ? 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none p-4' 
                 : 'bg-indigo-600 text-white rounded-2xl rounded-tr-none p-3 px-4'
            }`}>
              {msg.role === 'ai' ? (
                <div className="prose prose-sm prose-indigo max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                  
                  {/* KEYWORDS DE GLOSEIG (CLIL) */}
                  {msg.keywords && msg.keywords.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                      {msg.keywords.map((k, i) => (
                        <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full border border-indigo-100 font-medium">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 🆕 VISUALITZACIÓ DE LA NOTA DE RETRIEVAL (TFM) */}
                  {renderScoreBadge(msg.score)}
                  
                </div>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {/* ESTAT DE CÀRREGA (Typing...) */}
        {loading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
               <Bot size={16} className="text-indigo-400" />
             </div>
             <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm w-fit">
                <div className="flex gap-1.5 items-center h-4">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-3 bg-white border-t border-gray-100">
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escriu al tutor..."
            className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:opacity-50"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition shadow-md active:scale-95 flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}