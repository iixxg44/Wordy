/*
 * Home – Wordy root page
 * Decides whether to show AuthPage or GameMap based on localStorage session
 */
import { useState, useEffect } from "react";
import AuthPage from "./AuthPage";
import GameMap from "./GameMap";
import { getCurrentUser, getUserData } from "@/lib/wordyData";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const cu = getCurrentUser();
    if (cu && getUserData(cu)) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  }, []);

  if (loggedIn === null) {
    // Brief loading state while checking localStorage
    return (
      <div className="wordy-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 48 }}>🌿</div>
      </div>
    );
  }

  if (!loggedIn) {
    return <AuthPage onLogin={() => setLoggedIn(true)} />;
  }

  return <GameMap onLogout={() => setLoggedIn(false)} />;
}
