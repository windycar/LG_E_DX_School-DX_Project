/// <reference types="vite/client" />

const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? "https://pregnancy-care-backend-smo8.onrender.com"
  : "http://localhost:8000";
const DEFAULT_AI_CHAT_URL = import.meta.env.PROD
  ? "https://pregnancy-care-ai-chat.onrender.com"
  : "http://127.0.0.1:8001";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");
export const AI_CHAT_URL = (import.meta.env.VITE_AI_CHAT_URL || DEFAULT_AI_CHAT_URL).replace(/\/$/, "");

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
export const aiChatUrl = (path: string) => `${AI_CHAT_URL}${path}`;
