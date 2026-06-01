export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const AI_CHAT_URL = import.meta.env.VITE_AI_CHAT_URL || "http://127.0.0.1:8001";

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
export const aiChatUrl = (path: string) => `${AI_CHAT_URL}${path}`;
