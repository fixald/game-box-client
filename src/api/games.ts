import { apiRequest } from "./http";
import { clientApi } from "./routes";

export interface ClientGame {
  id: string | number;
  name: string;
  description?: string;
  iconUrl?: string;
  category?: string;
  gameType?: string;
  rating?: number;
  downloadCount?: number;
  versionTags?: string;
}

export type GameListResponse = { list?: ClientGame[]; rows?: ClientGame[] } | ClientGame[];

export function getPopularGames(page = 1, pageSize = 6, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort: "downloads" });
  return apiRequest<GameListResponse>(`${clientApi.games}?${params}`, { signal });
}

export function getGames(page = 1, pageSize = 20, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort: "name" });
  return apiRequest<GameListResponse>(`${clientApi.games}?${params}`, { signal });
}

export function normalizeGameList(response: GameListResponse) {
  if (Array.isArray(response)) return response;
  return response.list ?? response.rows ?? [];
}
