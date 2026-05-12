// ─── AUTH CONTEXT ─────────────────────────────────────────────
// Wraps the entire app. Every screen can call useAuth() to get
// the current user without prop drilling.

import { createContext, useContext, useEffect, useState } from "react";
import { listenToAuth } from "../firebase/services";
import { getUserProfile } from "../firebase/services";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase auth user
  const [profile, setProfile] = useState(null); // Firestore user document
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsub = listenToAuth(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Load their Firestore profile
        const prof = await getUserProfile(firebaseUser.uid);
        setProfile(prof);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsub; // cleanup on unmount
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const prof = await getUserProfile(user.uid);
      setProfile(prof);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook — use this in any component
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
