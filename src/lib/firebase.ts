// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, 
  authDomain: "gen-lang-client-0942408956.firebaseapp.com",
  projectId: "gen-lang-client-0942408956",
  storageBucket: "gen-lang-client-0942408956.firebasestorage.app",
  messagingSenderId: "274018548463",
  appId: "1:274018548463:web:ababa50abbad1bac7c791a",
  measurementId: "G-JWC4MPWWQX"
};

// 1. Inicialitzem Firebase
const app = initializeApp(firebaseConfig);

// 2. Exportem els serveis que farem servir al TFM
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Opcional: Configuració addicional del provider de Google
googleProvider.setCustomParameters({
  prompt: 'select_account' // Força a triar compte si n'hi ha diversos
});