import { apiRequest } from "./http";
import { clientApi } from "./routes";
import { getAccessToken } from "../utils/auth";

export interface ClientServer {
  id: string | number;
  gameId: string | number;
  gameName?: string;
  imageUrl?: string;
  iconUrl?: string;
  name: string;
  openTime: string;
  status: "preview" | "opening_soon" | "normal" | "hot" | "full" | "maintenance" | "closed";
  isRecommended: boolean;
  recommendationWeight?: number;
  onlineLabel?: string;
  tags?: string[];
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type ServerListResponse = { list?: ClientServer[]; rows?: ClientServer[] } | ClientServer[];

export function getRecommendedServers(page = 1, pageSize = 6, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), recommended: "true" });
  return apiRequest<ServerListResponse>(`${clientApi.servers}?${params}`, { signal, headers: authHeaders() });
}

export function normalizeServerList(response: ServerListResponse) {
  if (Array.isArray(response)) return response;
  return response.list ?? response.rows ?? [];
}
