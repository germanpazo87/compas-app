import React, { useState } from "react";
import type { EducationalLevel, AppLanguage } from "../../studentModel/types";

interface Props {
  onSave: (data: { educationalLevel: EducationalLevel; preferredLanguage: AppLanguage }) => void;
}

export function ProfileOnboarding({ onSave }: Props) {
  const [level, setLevel] = useState<EducationalLevel>('ESO1');
  const [lang, setLang] = useState<AppLanguage>('ca');

  return (
    <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-md flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-indigo-50">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-indigo-50 rounded-2xl mb-4">
            <span className="text-3xl">🧭</span>
          </div>
          <h2 className="text-2xl font-black text-indigo-950">Personalitza la teva experiència</h2>
          <p className="text-gray-500 text-sm mt-2">Configura el Compàs per adaptar-lo al teu curs</p>
        </div>

        <div className="space-y-6">
          {/* Selecció de Nivell */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-indigo-900 ml-1">Quin curs estàs fent?</label>
            <select 
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
              value={level}
              onChange={(e) => setLevel(e.target.value as EducationalLevel)}
            >
              <option value="ESO1">1r d'ESO</option>
              <option value="ESO2">2n d'ESO</option>
              <option value="ESO3">3r d'ESO</option>
              <option value="ESO4">4t d'ESO</option>
              <option value="BAT1">1r de Batxillerat</option>
              <option value="BAT2">2n de Batxillerat</option>
              <option value="UNIVERSITAT">Universitat</option>
            </select>
          </div>

          {/* Selecció d'Idioma */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-indigo-900 ml-1">Idioma del Tutor IA</label>
            <div className="grid grid-cols-3 gap-3">
              {(['ca', 'es', 'en'] as AppLanguage[]).map(l => (
                <button 
                  key={l} 
                  onClick={() => setLang(l)}
                  className={`p-3 rounded-xl border-2 font-bold transition-all ${
                    lang === l 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                    : 'border-gray-100 text-gray-400 hover:border-indigo-200'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onSave({ educationalLevel: level, preferredLanguage: lang })}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl font-black text-lg shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] mt-4"
          >
            Començar l'aventura
          </button>
        </div>
      </div>
    </div>
  );
}