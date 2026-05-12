// ─── AUTH SCREEN ──────────────────────────────────────────────
// Login + Signup in one screen. Shown when user is not logged in.

import { useState } from "react";
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from "../firebase/services";

const T = {
  primary: "#1E4D2B", primarySoft: "#E6F0E9", primaryMint: "#4CAF72",
  textDark: "#1A1A1A", textMid: "#444", textMuted: "#888",
  border: "#E8EBE8", inputBg: "#F2F4F2", cardBg: "#fff", gold: "#F5A623",
};

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (mode === "signup" && !name) { setError("Please enter your name."); return; }
    setLoading(true);
    try {
      if (mode === "signup") await signUpWithEmail(email, password, name);
      else await signInWithEmail(email, password);
    } catch (e) {
      const msgs = {
        "auth/email-already-in-use": "This email is already registered. Try logging in.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password. Try again.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password must be at least 6 characters.",
      };
      setError(msgs[e.code] || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    try { await signInWithGoogle(); }
    catch { setError("Google sign-in failed. Please try again."); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F4F6F4", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 390, background: T.cardBg, borderRadius: 32, padding: "40px 32px", boxShadow: "0 24px 60px #00000012" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🥗</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.textDark, fontFamily: "'Lora', serif" }}>Nouri</div>
            <div style={{ fontSize: 11, color: T.textMuted }}>Your AI food coach</div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", background: T.inputBg, borderRadius: 12, padding: 4, marginBottom: 28 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{ flex: 1, padding: "9px 0", background: mode === m ? T.primary : "transparent", border: "none", borderRadius: 9, fontSize: 13, fontWeight: mode === m ? 700 : 500, color: mode === m ? "#fff" : T.textMuted, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", textTransform: "capitalize" }}>
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {mode === "signup" && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your first name"
              style={{ padding: "13px 16px", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 14, color: T.textDark, fontFamily: "inherit", outline: "none" }}
              onFocus={e => e.target.style.borderColor = T.primaryMint} onBlur={e => e.target.style.borderColor = T.border} />
          )}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
            style={{ padding: "13px 16px", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 14, color: T.textDark, fontFamily: "inherit", outline: "none" }}
            onFocus={e => e.target.style.borderColor = T.primaryMint} onBlur={e => e.target.style.borderColor = T.border} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
            style={{ padding: "13px 16px", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 14, color: T.textDark, fontFamily: "inherit", outline: "none" }}
            onFocus={e => e.target.style.borderColor = T.primaryMint} onBlur={e => e.target.style.borderColor = T.border}
            onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#DC2626", marginBottom: 14 }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", background: loading ? "#ccc" : T.primary, border: "none", borderRadius: 14, padding: "15px", fontSize: 14, fontWeight: 700, color: "#fff", cursor: loading ? "default" : "pointer", fontFamily: "inherit", marginBottom: 14, transition: "background 0.2s" }}>
          {loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <span style={{ fontSize: 12, color: T.textMuted }}>or</span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading}
          style={{ width: "100%", background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 600, color: T.textDark, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 1px 4px #0000000A" }}>
          <span style={{ fontSize: 18 }}>🇬</span> Continue with Google
        </button>

        {/* Footer note */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>
          By continuing you agree to our{" "}
          <span style={{ color: T.primary, cursor: "pointer" }}>Terms of Service</span>
          {" "}and{" "}
          <span style={{ color: T.primary, cursor: "pointer" }}>Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}
