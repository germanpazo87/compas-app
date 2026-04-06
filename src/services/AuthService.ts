import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  type User 
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { auth, googleProvider, db } from "../lib/firebase";
import type { 
  StudentModel, 
  MathArea, 
  EducationalLevel, 
  AppLanguage 
} from "../studentModel/types";

// --- HELPERS DE RECERCA ---

const ROMANTIC_LANGUAGES = new Set(['ca', 'es', 'fr', 'pt', 'it', 'ro']);

export function getLanguageFamily(lang?: string | null): 'romantic' | 'non-romantic' | null {
  if (!lang) return null;
  return ROMANTIC_LANGUAGES.has(lang) ? 'romantic' : 'non-romantic';
}

// 1. Mantenim la utilitat fora de la classe
const createEmptyArea = (): MathArea => ({
  mastery: false,
  competences: {
    calculation_specific: { performance: 0, medal: false, retrievalStrength: 0, stability: 0, lastReviewed: 0, attempts: 0 },
    problem_solving_specific: { performance: 0, medal: false, retrievalStrength: 0, stability: 0, lastReviewed: 0, attempts: 0 },
    conceptual: {}
  }
});

// 2. CLASSE AuthServiceImpl
class AuthServiceImpl {
  
  async login(): Promise<StudentModel> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const existingProfile = await this.getStudentProfile(user.uid);

      if (existingProfile) {
        return existingProfile;
      } else {
        return await this.createInitialProfile(user);
      }
    } catch (error) {
      console.error("❌ Error en el login:", error);
      throw error;
    }
  }

  async getStudentProfile(uid: string): Promise<StudentModel | null> {
    const docRef = doc(db, "students", uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as StudentModel) : null;
  }

  /**
   * 🆕 ACTUALITZA EL PERFIL DE L'ESTUDIANT
   * S'utilitza després de l'Onboarding per persistir nivell i idioma.
   */
  async updateStudentProfile(
    uid: string, 
    data: { educationalLevel: EducationalLevel; preferredLanguage: AppLanguage }
  ): Promise<void> {
    const docRef = doc(db, "students", uid);
    try {
      // Usem la notació de punts per actualitzar camps niats sense esborrar la resta del perfil
      await updateDoc(docRef, {
        "profile.educationalLevel": data.educationalLevel,
        "profile.preferredLanguage": data.preferredLanguage,
        "profile.languageFamily": getLanguageFamily(data.preferredLanguage)
      });
    } catch (error) {
      console.error("❌ Error actualitzant perfil a Firestore:", error);
      throw error;
    }
  }

  private async createInitialProfile(user: User): Promise<StudentModel> {
    const newStudent: StudentModel = {
      id: user.uid,
      profile: {
        name: user.displayName || "Estudiant",
        email: user.email || "",
        languageLevel: "medium",
        preferredLanguage: "ca",
        languageFamily: getLanguageFamily("ca")
      },
      global: {
        reliability: 1.0,
        stability: 0,
        attempts: 0,
        llmInteractionsTotal: 0,
        calculation_global: { performance: 0, medal: false, retrievalStrength: 0, stability: 0, lastReviewed: 0, attempts: 0 },
        problem_solving_global: { performance: 0, medal: false, retrievalStrength: 0, stability: 0, lastReviewed: 0, attempts: 0 }
      },
      areas: {
        statistics: createEmptyArea(),
        arithmetic: createEmptyArea(),
        algebra: createEmptyArea(),
        geometry: createEmptyArea(),
      }
    };

    await setDoc(doc(db, "students", user.uid), newStudent);
    return newStudent;
  }

  async saveProgress(student: StudentModel) {
    if (!student.id) return;
    await setDoc(doc(db, "students", student.id), student, { merge: true });
  }

  async writeSessionLog(studentId: string, log: object): Promise<void> {
    await addDoc(collection(db, "students", studentId, "sessionLogs"), log);
  }

  subscribeToAuthChanges(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  async logout() {
    await signOut(auth);
    window.location.reload();
  }
}

// 3. Exportem el Singleton
export const AuthService = new AuthServiceImpl();