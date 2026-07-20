import { apiRequest } from "./http";
import { clientApi } from "./routes";
import { getAccessToken } from "../utils/auth";

export type SearchType = "all" | "game" | "live" | "server" | "gift" | "article";
export interface SearchResultItem { id: string; type: SearchType; title: string; subtitle: string; description?: string; iconUrl?: string; coverUrl?: string; tags?: string[]; target?: Record<string, unknown>; score?: number; }
export interface SearchResponse { query: string; type: SearchType; page: number; pageSize: number; total: number; hasMore: boolean; items: SearchResultItem[]; facets: Array<{ type: SearchType; label: string; count: number }>; }
export interface SearchSuggestion { text: string; type: SearchType; highlight?: string; }
export interface SearchHistoryItem { id: string; keyword: string; searchedAt: string; }

function authHeaders(): Record<string, string> { const token = getAccessToken(); return token ? { Authorization: `Bearer ${token}` } : {}; }
function query(params: Record<string, string | number>) { return new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString(); }

export function search(queryText: string, type: SearchType = "all", page = 1, pageSize = 20, signal?: AbortSignal) {
  return apiRequest<SearchResponse>(`${clientApi.search}?${query({ q: queryText, type, page, pageSize })}`, { signal, headers: authHeaders() });
}
export function getSuggestions(queryText: string, limit = 8, signal?: AbortSignal) {
  return apiRequest<{ query: string; suggestions: SearchSuggestion[] }>(`${clientApi.searchSuggestions}?${query({ q: queryText, limit })}`, { signal, headers: authHeaders() });
}
export function getHotSearches(limit = 10) { return apiRequest<{ items: Array<{ keyword: string; rank: number; trend: "up" | "down" | "stable"; count: number }> }>(`${clientApi.searchHot}?${query({ limit })}`, { headers: authHeaders() }); }
export function getSearchHistory(limit = 10) { return apiRequest<{ items: SearchHistoryItem[] }>(`${clientApi.searchHistory}?${query({ limit })}`, { headers: authHeaders() }); }
export function saveSearchHistoryRemote(keyword: string) { return apiRequest<{ item: SearchHistoryItem }>(clientApi.searchHistory, { method: "POST", headers: authHeaders(), body: JSON.stringify({ keyword }) }); }
export function clearSearchHistoryRemote() { return apiRequest<null>(clientApi.searchHistory, { method: "DELETE", headers: authHeaders() }); }
export function reportSearchEvent(payload: { eventType: string; query: string; resultType?: SearchType; resourceId?: string; position?: number; requestId?: string; occurredAt: string }) { return apiRequest<null>(clientApi.searchEvents, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) }); }
