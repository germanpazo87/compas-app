import React, { useState, useEffect } from "react";
import { ExerciseContainer } from "./components/Exercise/ExerciseContainer";
import { LoginScreen } from "./components/LoginScreen";
import { AuthService, getLanguageFamily } from "./services/AuthService";
import { ProfileOnboarding } from "./components/profile/ProfileOnboarding";
import type { StudentModel, EducationalLevel, AppLanguage } from "./studentModel/types";

function App() {
  const [currentUser, setCurrentUser] = useState<StudentModel | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // 1️⃣ MONITOR DE SESSIÓ
  useEffect(() => {
    const unsubscribe = AuthService.subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await AuthService.getStudentProfile(firebaseUser.uid);
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // 🆕 2️⃣ GESTIÓ DE L'ACTUALITZACIÓ DEL PERFIL (Onboarding)
  const handleSaveProfile = async (data: { educationalLevel: EducationalLevel; preferredLanguage: AppLanguage }) => {
    if (!currentUser) return;

    // Creem el nou model fusionant les dades de l'onboarding
    const updatedUser: StudentModel = {
      ...currentUser,
      profile: {
        ...currentUser.profile,
        educationalLevel: data.educationalLevel,
        preferredLanguage: data.preferredLanguage,
        languageFamily: getLanguageFamily(data.preferredLanguage)
      }
    };

    // Actualitzem l'estat local immediatament (Optimistic UI)
    setCurrentUser(updatedUser);

    // Persistim a la base de dades a través de l'AuthService
    try {
      await AuthService.updateStudentProfile(currentUser.id, {
        educationalLevel: data.educationalLevel,
        preferredLanguage: data.preferredLanguage
      });
    } catch (error) {
      console.error("Error guardant el perfil:", error);
      // Opcional: Mostrar notificació d'error
    }
  };

  // 3️⃣ ESTAT DE CÀRREGA
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Sincronitzant...</p>
      </div>
    );
  }

  // 4️⃣ SI NO HI HA USUARI: Login
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(student) => setCurrentUser(student)} />;
  }

  // 🆕 5️⃣ INTERCEPTOR D'ONBOARDING
  // Si l'usuari existeix però no ha definit el seu nivell educatiu, 
  // bloquegem la interfície amb la modal de configuració.
  if (!currentUser.profile.educationalLevel) {
    return <ProfileOnboarding onSave={handleSaveProfile} />;
  }

  // 6️⃣ SI HI HA USUARI I PERFIL COMPLET: Retornem el contenidor
  return <ExerciseContainer student={currentUser} />;
}

export default App;