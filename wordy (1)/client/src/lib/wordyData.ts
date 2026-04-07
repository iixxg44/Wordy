// Wordy – Game Data & Types

export interface Avatar {
  icon: string;
  name: string;
  desc: string;
}

export interface QuizItem {
  word: string;
  correct: string;
  options: string[];
}

export interface UserData {
  username: string;
  password: string;
  avatarIndex: number;
  level: number;
  stars: number;
}

export const avatars: Avatar[] = [
  { icon: "🦊", name: "Foxy", desc: "Fast and smart" },
  { icon: "🐼", name: "Panda", desc: "Cute and calm" },
  { icon: "🐯", name: "Tiger", desc: "Brave learner" },
  { icon: "🐵", name: "Momo", desc: "Playful and funny" },
  { icon: "🦁", name: "Leo", desc: "Strong and confident" },
  { icon: "🐰", name: "Bunny", desc: "Sweet and quick" },
  { icon: "🐸", name: "Froggy", desc: "Happy jumper" },
  { icon: "🐻", name: "Bear", desc: "Cozy and kind" },
];

export const quizData: QuizItem[] = [
  { word: "Apple", correct: "تفاح", options: ["تفاح", "كتاب", "سيارة"] },
  { word: "Book", correct: "كتاب", options: ["قلم", "كتاب", "باب"] },
  { word: "Water", correct: "ماء", options: ["خبز", "حليب", "ماء"] },
  { word: "Cat", correct: "قطة", options: ["كلب", "قطة", "شجرة"] },
  { word: "Sun", correct: "شمس", options: ["قمر", "شمس", "نجمة"] },
  { word: "House", correct: "بيت", options: ["مدرسة", "بيت", "طاولة"] },
  { word: "Milk", correct: "حليب", options: ["حليب", "عصير", "زيت"] },
  { word: "Car", correct: "سيارة", options: ["قطار", "دراجة", "سيارة"] },
  { word: "Bird", correct: "طائر", options: ["سمكة", "طائر", "أسد"] },
  { word: "School", correct: "مدرسة", options: ["مستشفى", "مدرسة", "غرفة"] },
];

// ── localStorage helpers ───────────────────────────────────────────

export function getUserKey(username: string): string {
  return "user_" + username.trim().toLowerCase();
}

export function getCurrentUser(): string | null {
  return localStorage.getItem("currentUser");
}

export function setCurrentUser(username: string): void {
  localStorage.setItem("currentUser", username.trim().toLowerCase());
}

export function getUserData(username: string): UserData | null {
  const raw = localStorage.getItem(getUserKey(username));
  return raw ? JSON.parse(raw) : null;
}

export function saveUserData(username: string, data: UserData): void {
  localStorage.setItem(getUserKey(username), JSON.stringify(data));
}

export function logoutUser(): void {
  localStorage.removeItem("currentUser");
}
