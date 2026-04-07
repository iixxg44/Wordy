/*
 * GameMap – Wordy "Organic Garden" design
 * Scrollable level map, player avatar, quiz modals, world transitions
 */
import { useEffect, useRef, useState, useCallback } from "react";
import {
  avatars,
  quizData,
  getCurrentUser,
  getUserData,
  saveUserData,
  logoutUser,
  UserData,
} from "@/lib/wordyData";

interface GameMapProps {
  onLogout: () => void;
}

// ── Popup toast (imperative, DOM-based) ────────────────────────────
let popupTimer: ReturnType<typeof setTimeout> | null = null;
function showPopup(text: string, isError = false) {
  const popup = document.getElementById("wordy-popup");
  if (!popup) return;
  popup.textContent = text;
  popup.className = isError ? "popup error" : "popup success";
  popup.classList.add("show");
  if (popupTimer) clearTimeout(popupTimer);
  popupTimer = setTimeout(() => popup.classList.remove("show"), 2200);
}

// ── World transition overlay ───────────────────────────────────────
function showWorldTransition(worldNumber: number) {
  const old = document.getElementById("worldTransition");
  if (old) old.remove();
  const worldEmoji = worldNumber === 2 ? "🌙" : "🌿";
  const worldText = worldNumber === 2 ? "Welcome to World 2" : "Welcome to World 1";
  const subText = worldNumber === 2
    ? "A magical night world is waiting for you"
    : "Your learning adventure begins now";
  const overlay = document.createElement("div");
  overlay.className = "world-transition";
  overlay.id = "worldTransition";
  overlay.innerHTML = `
    <div class="world-transition-card">
      <div class="world-transition-emoji">${worldEmoji}</div>
      <div class="world-transition-title">${worldText}</div>
      <div class="world-transition-text">${subText}</div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("show"));
  setTimeout(() => {
    overlay.classList.remove("show");
    setTimeout(() => overlay.remove(), 650);
  }, 1800);
}

// ── Level positions ────────────────────────────────────────────────
const TOTAL_LEVELS = 20;
const Y_START = 1560;
const STEP_Y = 120;
const OFFSETS = [0, 170, -170, 110, -110, 180, -180, 90, -90, 0];

function buildPositions(mapWidth: number) {
  const center = mapWidth / 2;
  return Array.from({ length: TOTAL_LEVELS }, (_, i) => ({
    x: center + OFFSETS[i % OFFSETS.length],
    y: Y_START - i * STEP_Y,
  }));
}

// ── Quiz Modal ─────────────────────────────────────────────────────
interface QuizModalProps {
  levelNum: number;
  onClose: () => void;
  onAnswer: (levelNum: number, correct: string, chosen: string) => void;
}

function QuizModal({ levelNum, onClose, onAnswer }: QuizModalProps) {
  const question = quizData[(levelNum - 1) % quizData.length];
  const [shuffled] = useState(() => [...question.options].sort(() => Math.random() - 0.5));
  const [answered, setAnswered] = useState<string | null>(null);

  function handleAnswer(opt: string) {
    if (answered) return;
    setAnswered(opt);
    setTimeout(() => {
      onAnswer(levelNum, question.correct, opt);
    }, 500);
  }

  function getBtnClass(opt: string) {
    if (!answered) return "option-btn";
    if (opt === question.correct) return "option-btn correct";
    if (opt === answered && opt !== question.correct) return "option-btn wrong";
    return "option-btn";
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h3 style={{ margin: "0 0 8px", fontSize: 25 }}>Level {levelNum}</h3>
        <p style={{ margin: "0 0 16px", color: "#6b7a72", lineHeight: 1.5 }}>
          What is the Arabic translation of:
        </p>
        <div className="quiz-word">{question.word}</div>
        <div>
          {shuffled.map((opt) => (
            <button
              key={opt}
              className={getBtnClass(opt)}
              onClick={() => handleAnswer(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
        <button className="secondary-btn" style={{ background: "#edf7f0", color: "#355646", boxShadow: "none" }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

// ── Avatar Editor Modal ────────────────────────────────────────────
interface AvatarModalProps {
  currentAvatarIndex: number;
  onSave: (index: number) => void;
  onClose: () => void;
}

function AvatarModal({ currentAvatarIndex, onSave, onClose }: AvatarModalProps) {
  const [idx, setIdx] = useState(currentAvatarIndex);
  const av = avatars[idx];

  function change(dir: number) {
    setIdx((prev) => {
      let next = prev + dir;
      if (next < 0) next = avatars.length - 1;
      if (next >= avatars.length) next = 0;
      return next;
    });
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h3 style={{ margin: "0 0 8px", fontSize: 25 }}>Choose your character</h3>
        <p style={{ margin: "0 0 16px", color: "#6b7a72", lineHeight: 1.5 }}>
          Pick the one you want to play with.
        </p>
        <div className="avatar-card">
          <div className="avatar-picker">
            <button className="arrow-btn" onClick={() => change(-1)}>‹</button>
            <div className="avatar-preview">
              <div className="avatar-big">{av.icon}</div>
              <div style={{ fontSize: 17, fontWeight: "bold", marginBottom: 4 }}>{av.name}</div>
              <div style={{ fontSize: 13, color: "#6b7a72" }}>{av.desc}</div>
            </div>
            <button className="arrow-btn" onClick={() => change(1)}>›</button>
          </div>
        </div>
        <button className="action-btn" onClick={() => onSave(idx)}>Save character</button>
        <button className="secondary-btn" style={{ background: "#edf7f0", color: "#355646", boxShadow: "none" }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

// ── GameMap ────────────────────────────────────────────────────────
export default function GameMap({ onLogout }: GameMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [quizLevel, setQuizLevel] = useState<number | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [, forceUpdate] = useState(0);

  // Load user
  useEffect(() => {
    const cu = getCurrentUser();
    if (!cu) { onLogout(); return; }
    const u = getUserData(cu);
    if (!u) { onLogout(); return; }
    setUser(u);
  }, [onLogout]);

  // Build map whenever user changes
  const buildMap = useCallback(() => {
    const map = mapRef.current;
    if (!map || !user) return;

    // Clear previous content except map-title
    const titleEl = map.querySelector(".map-title");
    map.innerHTML = "";
    if (titleEl) map.appendChild(titleEl);

    const mapWidth = map.clientWidth || 920;
    const positions = buildPositions(mapWidth);
    const currentWorld = Math.ceil(user.level / 10);

    // Update map class
    map.className = `map world-${currentWorld}`;

    // Re-add title
    const title = document.createElement("div");
    title.className = "map-title";
    title.textContent = currentWorld === 1 ? "Learning Journey" : "Moonlight Journey";
    map.appendChild(title);

    // Bubbles
    const bubbles = [
      { x: 70, y: 120, s: 60 },
      { x: mapWidth - 120, y: 240, s: 88 },
      { x: 120, y: 610, s: 76 },
      { x: mapWidth - 170, y: 980, s: 66 },
      { x: 200, y: 1330, s: 54 },
    ];
    bubbles.forEach((b) => {
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.style.cssText = `left:${b.x}px;top:${b.y}px;width:${b.s}px;height:${b.s}px;`;
      map.appendChild(bubble);
    });

    // Path lines
    for (let i = 0; i < positions.length - 1; i++) {
      const p1 = positions[i];
      const p2 = positions[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const line = document.createElement("div");
      line.className = "path-line";
      line.style.cssText = `width:${dist}px;left:${p1.x}px;top:${p1.y}px;transform:rotate(${angle}deg);`;
      map.appendChild(line);
    }

    // Level nodes
    positions.forEach((pos, index) => {
      const levelNum = index + 1;
      const btn = document.createElement("button");
      btn.className = "level";
      btn.style.cssText = `left:${pos.x - 39}px;top:${pos.y - 39}px;`;

      const label = document.createElement("div");
      label.className = "level-label";
      label.textContent = levelNum <= 10 ? "World 1" : "World 2";

      if (levelNum < user.level) {
        btn.classList.add("done");
        btn.innerHTML = `✓`;
        btn.appendChild(label);
        btn.onclick = () => setQuizLevel(levelNum);
      } else if (levelNum === user.level) {
        btn.classList.add("open", "current");
        btn.textContent = String(levelNum);
        btn.appendChild(label);
        btn.onclick = () => setQuizLevel(levelNum);
      } else {
        btn.classList.add("locked");
        btn.textContent = "🔒";
        btn.appendChild(label);
      }
      map.appendChild(btn);
    });

    // Player
    const avatar = avatars[user.avatarIndex] || avatars[0];
    const player = document.createElement("div");
    player.className = "player";
    player.id = "wordy-player";
    player.textContent = avatar.icon;
    map.appendChild(player);

    // Position player
    const currentPos = positions[Math.max(0, Math.min(user.level - 1, positions.length - 1))];
    player.style.left = currentPos.x - 36 + "px";
    player.style.top = currentPos.y - 98 + "px";
    player.classList.add("bounce");
    setTimeout(() => player.classList.remove("bounce"), 220);

    // Scroll to player
    setTimeout(() => {
      const targetScroll = Math.max(0, currentPos.y - window.innerHeight / 2);
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
    }, 100);
  }, [user]);

  useEffect(() => {
    if (user) buildMap();
  }, [user, buildMap, forceUpdate]);

  // Rebuild on resize
  useEffect(() => {
    const handler = () => { if (user) buildMap(); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [user, buildMap]);

  function handleAnswer(levelNum: number, correct: string, chosen: string) {
    if (chosen !== correct) {
      showPopup("Wrong answer. Try again.", true);
      setQuizLevel(null);
      return;
    }
    const cu = getCurrentUser();
    if (!cu) return;
    const u = getUserData(cu);
    if (!u) return;

    const oldLevel = u.level;
    const oldWorld = Math.ceil(oldLevel / 10);

    if (levelNum === u.level) {
      u.level = Math.min(u.level + 1, 20);
      u.stars = (u.stars || 0) + 1;
      saveUserData(cu, u);
    }

    const newWorld = Math.ceil(u.level / 10);
    setQuizLevel(null);
    setUser({ ...u });

    setTimeout(() => {
      if (newWorld > oldWorld) {
        showWorldTransition(newWorld);
        setTimeout(() => showPopup(`Amazing! You unlocked World ${newWorld}.`), 800);
      } else if (u.level !== oldLevel) {
        showPopup("Great job! You passed the level.");
      } else {
        showPopup("Nice! You already finished this level before.");
      }
    }, 200);
  }

  function handleSaveAvatar(index: number) {
    const cu = getCurrentUser();
    if (!cu) return;
    const u = getUserData(cu);
    if (!u) return;
    u.avatarIndex = index;
    saveUserData(cu, u);
    setShowAvatarModal(false);
    setUser({ ...u });
  }

  function handleLogout() {
    logoutUser();
    onLogout();
  }

  if (!user) return null;

  const avatar = avatars[user.avatarIndex] || avatars[0];
  const currentWorld = Math.ceil(user.level / 10);

  return (
    <div className="wordy-bg" style={{ minHeight: "100vh" }}>
      {/* Topbar */}
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div className="mini-avatar">{avatar.icon}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.username}
            </div>
            <div style={{ marginTop: 3, color: "#6b7a72", fontSize: 13 }}>
              Level {user.level} · {user.stars || 0} stars
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button className="pill-btn" onClick={() => setShowAvatarModal(true)}>Change character</button>
          <button className="pill-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Map area */}
      <div className="map-wrap">
        <div className="world-card">
          <div>
            <div style={{ fontSize: 20, fontWeight: "bold" }}>
              {currentWorld === 1 ? "World 1 · Green Fields" : "World 2 · Moon Sky"}
            </div>
            <div style={{ color: "#6b7a72", fontSize: 14, marginTop: 5 }}>
              Every 10 levels opens a new world
            </div>
          </div>
          <div style={{ color: "#6b7a72", fontSize: 14 }}>Complete levels to move upward</div>
        </div>

        {/* The map canvas – built imperatively in buildMap() */}
        <div
          ref={mapRef}
          className={`map world-${currentWorld}`}
          id="wordy-map"
        >
          <div className="map-title">
            {currentWorld === 1 ? "Learning Journey" : "Moonlight Journey"}
          </div>
        </div>
      </div>

      {/* Quiz modal */}
      {quizLevel !== null && (
        <QuizModal
          levelNum={quizLevel}
          onClose={() => setQuizLevel(null)}
          onAnswer={handleAnswer}
        />
      )}

      {/* Avatar modal */}
      {showAvatarModal && (
        <AvatarModal
          currentAvatarIndex={user.avatarIndex}
          onSave={handleSaveAvatar}
          onClose={() => setShowAvatarModal(false)}
        />
      )}
    </div>
  );
}
