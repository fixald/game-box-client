import { apiRequest } from "./http";
import { clientApi } from "./routes";
import type { LiveRoom } from "../types/home";
import { getAccessToken } from "../utils/auth";

export interface LiveRoomResponse {
  id: string | number;
  streamerId?: string;
  title: string;
  streamerName: string;
  streamerAvatar?: string;
  coverUrl?: string;
  viewers: number;
  gameId?: string | number;
  gameName: string;
  serverId?: string | number;
  serverName?: string;
  status: "live" | "upcoming" | "replay" | "offline";
  roomUrl?: string;
  startedAt?: string;
  endedAt?: string | null;
  announcement?: string;
  categoryId?: string;
  categoryName?: string;
  streamerFans?: number;
  isFollowed?: boolean;
}

export interface LiveRoomsResponse {
  requestId?: string;
  list: LiveRoomResponse[];
  page?: number;
  pageSize?: number;
  total?: number;
  hasMore?: boolean;
}

export interface LiveCategory {
  id: string;
  name: string;
  type?: string;
  sort?: number;
  enabled?: boolean;
}

export interface LiveCategoriesResponse {
  list: LiveCategory[];
}

export interface LiveRoomDetailResponse {
  id: string;
  title: string;
  announcement?: string;
  streamer?: { id: string; name: string; avatarUrl?: string; fans?: number; isFollowed?: boolean };
  stream?: { playUrl?: string; protocol?: string; expiresAt?: string; qualities?: Array<{ name: string; url: string }> };
  game?: { id?: string; name?: string } | null;
  server?: { id?: string; name?: string; status?: string } | null;
  viewers?: number;
  status: LiveRoom["status"];
  startedAt?: string;
  endedAt?: string | null;
}

export function getLiveCategories(signal?: AbortSignal) {
  const token = getAccessToken();
  return apiRequest<LiveCategoriesResponse>(clientApi.liveCategories, {
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function normalizeLiveRooms(response: LiveRoomsResponse): LiveRoom[] {
  const list = response?.list ?? [];
  return list
    .filter((room) => room.status !== "offline")
    .map((room, index) => ({
      streamerId: room.streamerId,
      id: String(room.id ?? `live_${index}`),
      gameId: room.gameId == null ? undefined : String(room.gameId),
      serverId: room.serverId == null ? undefined : String(room.serverId),
      title: room.title ?? "未命名直播",
      streamerName: room.streamerName ?? "匿名主播",
      streamerAvatar: room.streamerAvatar,
      coverUrl: room.coverUrl,
      viewers: Number(room.viewers) || 0,
      gameName: room.gameName ?? "",
      serverName: room.serverName ?? "",
      status: room.status === "offline" ? "replay" : (room.status ?? "upcoming"),
      roomUrl: room.roomUrl,
      startedAt: room.startedAt,
      endedAt: room.endedAt,
      announcement: room.announcement,
      isFollowed: room.isFollowed,
      categoryId: room.categoryId,
      categoryName: room.categoryName,
      accent: ["#4d7cff", "#a855f7", "#e06b35", "#39a97b"][index % 4],
    }));
}

export function getLiveRooms(page = 1, pageSize = 6, signal?: AbortSignal, filters: { categoryId?: string; keyword?: string; sort?: string } = {}) {
  const token = getAccessToken();
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.keyword) params.set("keyword", filters.keyword);
  if (filters.sort) params.set("sort", filters.sort);
  return apiRequest<LiveRoomsResponse>(`${clientApi.liveRooms}?${params.toString()}`, {
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function getLiveRoom(id: string, signal?: AbortSignal) {
  const token = getAccessToken();
  return apiRequest<LiveRoomDetailResponse>(`${clientApi.liveRooms}/${encodeURIComponent(id)}`, {
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function followStreamer(streamerId: string, following: boolean) {
  const token = getAccessToken();
  return apiRequest<{ following: boolean; fans: number }>(`${clientApi.liveStreamers}/${encodeURIComponent(streamerId)}/follow`, {
    method: following ? "POST" : "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function reportLiveRoom(roomId: string, reason: string, detail = "") {
  const token = getAccessToken();
  return apiRequest<{ reportId: string; status: string }>(clientApi.reports, {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ targetType: "live_room", targetId: roomId, reason, detail }),
  });
}

export function reportLiveEvent(payload: { eventType: string; resourceId: string; source?: string }) {
  const token = getAccessToken();
  return apiRequest<null>(clientApi.liveEvents, {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ resourceType: "live_room", ...payload }),
  });
}

export interface CreateRoomRequest {
  title: string;
  streamerName: string;
  streamerAvatar?: string;
  coverUrl?: string;
  gameId?: number;
  gameName?: string;
  serverId?: number;
  serverName?: string;
}

export interface CreateRoomResponse {
  room: {
    id: string | number;
    title: string;
    streamerName: string;
    pushUrl: string;
    roomUrl: string;
  };
}

export interface MyLiveRoomResponse {
  room: LiveRoomResponse & { pushUrl?: string; roomUrl?: string };
}

export async function createLiveRoom(data: CreateRoomRequest): Promise<CreateRoomResponse> {
  const token = getAccessToken();
  return apiRequest<CreateRoomResponse>(clientApi.liveRoom, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
      'Idempotency-Key': `live_room_create_${data.title.trim()}_${data.gameName || ''}_${data.serverName || ''}`,
    },
    body: JSON.stringify(data),
  });
}

export function getMyLiveRoom(signal?: AbortSignal) {
  const token = getAccessToken();
  return apiRequest<MyLiveRoomResponse>(clientApi.liveRoom, {
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function endMyLiveRoom() {
  const token = getAccessToken();
  return apiRequest<null>(clientApi.liveRoom, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
