import React, { useState } from "react";
import { AuthService } from "../services/AuthService";
import type { StudentModel } from "../studentModel/types";
import { Compass, Sparkles, AlertCircle } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (student: StudentModel) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Cridem al servei que hem creat abans
      const student = await AuthService.login();
      
      // 2. Si tot va bé, passem l'estudiant al component pare (App)
      onLoginSuccess(student);
    } catch (err) {
      console.error(err);
      setError("No s'ha pogut iniciar sessió amb Google. Torna-ho a provar.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      
      {/* Targeta Principal */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-indigo-50">
        
        {/* Capçalera Decorativa */}
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
          
          <div className="relative z-10 flex justify-center mb-4">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <Compass size={48} className="text-indigo-600 animate-pulse-slow" />
            </div>
          </div>
          
          <h1 className="relative z-10 text-3xl font-bold text-white mb-2 tracking-tight">
            COMPÀS
          </h1>
          <p className="relative z-10 text-indigo-100 text-sm font-medium">
            Sistema Tutor Intel·ligent Adaptatiu
          </p>
        </div>

        {/* Cos del Login */}
        <div className="p-8">
          <div className="text-center mb-8 space-y-2">
            <h2 className="text-xl font-semibold text-gray-800">
              Benvingut/da al teu espai d'aprenentatge
            </h2>
            <p className="text-gray-500 text-sm">
              Accedeix amb el teu compte per guardar el teu progrés, medalles i estadístiques.
            </p>
          </div>

          {/* Missatge d'Error */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Botó de Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`
              w-full flex items-center justify-center gap-3 
              bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400
              text-gray-700 font-medium py-3 px-4 rounded-xl shadow-sm transition-all
              active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait
            `}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Connectant...</span>
              </div>
            ) : (
              <>
                {/* SVG del Logo de Google */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continua amb Google</span>
              </>
            )}
          </button>

          {/* Footer TFM */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-yellow-400" />
              Treball Final de Màster
            </span>
            <span>Germán Pazó &copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}