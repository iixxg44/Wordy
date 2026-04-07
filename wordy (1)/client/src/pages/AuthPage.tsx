/*
 * AuthPage – Wordy "Organic Garden" design
 * Frosted-glass card, green gradient background, avatar picker
 */
import { useState } from "react";
import {
  avatars,
  getUserKey,
  getUserData,
  setCurrentUser,
  saveUserData,
} from "@/lib/wordyData";

interface AuthPageProps {
  onLogin: () => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [hint, setHint] = useState("");

  const currentAvatar = avatars[avatarIndex];

  function changeAvatar(dir: number) {
    setAvatarIndex((prev) => {
      let next = prev + dir;
      if (next < 0) next = avatars.length - 1;
      if (next >= avatars.length) next = 0;
      return next;
    });
  }

  function handleSignup() {
    const uname = username.trim();
    if (uname.length < 3) { setHint("Username must be at least 3 letters."); return; }
    if (password.length < 3) { setHint("Password must be at least 3 letters."); return; }
    const key = getUserKey(uname);
    if (localStorage.getItem(key)) { setHint("This username is already taken."); return; }
    const data = { username: uname, password, avatarIndex, level: 1, stars: 0 };
    localStorage.setItem(key, JSON.stringify(data));
    setCurrentUser(uname);
    onLogin();
  }

  function handleLogin() {
    const uname = username.trim();
    const user = getUserData(uname);
    if (!user) { setHint("This account does not exist."); return; }
    if (user.password !== password) { setHint("Wrong password."); return; }
    setCurrentUser(uname);
    onLogin();
  }

  function switchMode(m: "signup" | "login") {
    setMode(m);
    setHint("");
  }

  return (
    <div className="wordy-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="auth-card">
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div className="brand-badge">W</div>
          <h1 style={{ margin: 0, fontSize: 38, letterSpacing: "0.5px", fontWeight: 900 }}>Wordy</h1>
          <p style={{ margin: "8px 0 0", color: "#6b7a72", fontSize: 15, fontWeight: 600 }}>English Made Fun</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`tab-btn${mode === "signup" ? " active" : ""}`} onClick={() => switchMode("signup")}>Sign Up</button>
          <button className={`tab-btn${mode === "login" ? " active" : ""}`} onClick={() => switchMode("login")}>Login</button>
        </div>

        {/* Username */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 7, fontSize: 14, color: "#4f6659", fontWeight: "bold" }}>Username</label>
          <input
            className="wordy-input"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (mode === "signup" ? handleSignup() : handleLogin())}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 7, fontSize: 14, color: "#4f6659", fontWeight: "bold" }}>Password</label>
          <input
            className="wordy-input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (mode === "signup" ? handleSignup() : handleLogin())}
          />
        </div>

        {/* Avatar picker (signup only) */}
        {mode === "signup" && (
          <div className="avatar-card">
            <div style={{ fontSize: 14, fontWeight: "bold", color: "#547060", marginBottom: 12 }}>Choose your character</div>
            <div className="avatar-picker">
              <button className="arrow-btn" onClick={() => changeAvatar(-1)}>‹</button>
              <div className="avatar-preview">
                <div className="avatar-big">{currentAvatar.icon}</div>
                <div style={{ fontSize: 17, fontWeight: "bold", marginBottom: 4 }}>{currentAvatar.name}</div>
                <div style={{ fontSize: 13, color: "#6b7a72", minHeight: 18 }}>{currentAvatar.desc}</div>
              </div>
              <button className="arrow-btn" onClick={() => changeAvatar(1)}>›</button>
            </div>
          </div>
        )}

        {/* Action button */}
        <button className="action-btn" onClick={mode === "signup" ? handleSignup : handleLogin}>
          {mode === "signup" ? "Create account" : "Login"}
        </button>

        {/* Hint */}
        <div style={{ marginTop: 12, textAlign: "center", color: "#607167", fontSize: 13, minHeight: 18 }}>{hint}</div>
      </div>
    </div>
  );
}
