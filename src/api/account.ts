import { apiRequest } from "./http";
import { clientApi } from "./routes";
import { getAccessToken } from "../utils/auth";

export interface AccountResponse {
  user?: { account?: string; nickname?: string };
  stats?: Record<string, number>;
}

export function getCurrentAccountInfo() {
  const token = getAccessToken();
  return apiRequest<AccountResponse>(clientApi.account, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : { };
}

export function getAccountStats() {
  return apiRequest<{ stats: { points: number; favoriteGameCount: number; continuousCheckinDays: number; downloadCount: number } }>(`${clientApi.account}/stats`, { headers: authHeaders() });
}

export function getRecentGames() {
  return apiRequest<{ games: Array<{ id: string; name: string; serverName: string; lastPlayedAt: string; iconUrl?: string; coverUrl?: string }> }>(`${clientApi.account}/games/recent`, { headers: authHeaders() });
}

export function getFavoriteGames() {
  return apiRequest<{ list: Array<{ gameId: string; gameName: string; serverName: string; lastPlayedAt?: string; installed: boolean; favorite: boolean }> }>(`${clientApi.account}/games/favorites?page=1&pageSize=20`, { headers: authHeaders() });
}

export function getDownloads() {
  return apiRequest<{ list: Array<{ id: string; gameName: string; version: string; size: string; status: string; progress: number }> }>(`${clientApi.account}/downloads?page=1&pageSize=20`, { headers: authHeaders() });
}

export function getMessages() {
  return apiRequest<{ list: Array<{ id: string; type: string; title: string; content: string; read: boolean; createdAt: string }>; unreadCount: number }>(clientApi.messages, { headers: authHeaders() });
}
