const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? "https://pregnancy-care-backend-smo8.onrender.com"
  : "http://localhost:8000";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");
export const AI_CHAT_URL = (import.meta.env.VITE_AI_CHAT_URL || "http://127.0.0.1:8001").replace(/\/$/, "");

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
export const aiChatUrl = (path: string) => `${AI_CHAT_URL}${path}`;
