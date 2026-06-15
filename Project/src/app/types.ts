// types.ts 파일 내부의 Screen 타입
export type Screen = "home" | "login" | "register" | "dashboard" | "admin" | "discomfort" | "mental" | "ai" | "mission" | "info" | "medical-chat" | "benefits" | "community" | "smalltalk" | "diary" | "profile" | "settings" | "appliance";

export type Role = "pregnant" | "guardian" | "admin";

export interface AppUser {
  name: string;
  email: string;
  role: Role;
  pregnancyWeek: number;
  inviteCode?: string;
  partnerEmail?: string;
  nickname?: string;
  babyNickname?: string;
  baby_nickname?: string;
  pregnancy_start_date?: string;
  user_id?: number;
  parent_user_id?: number | null;
  connected_pregnant?: {
    name: string;
    baby_nickname: string | null;
    pregnancy_start_date: string;
  } | null;
}

export interface PartnerStatus {
  symptoms: string[];
  emotions: string[];
  stress: number;
  timestamp: string;
}
