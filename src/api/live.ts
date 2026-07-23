import { apiRequest } from "./http";
import { clientApi } from "./routes";
import type { LiveRoom } from "../types/home";
import { getAccessToken } from "../utils/auth";

export interface LiveRoomResponse {
  id: string | number;
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
}

export interface LiveRoomsResponse {
  requestId?: string;
  list: LiveRoomResponse[];
  page?: number;
  pageSize?: number;
  total?: number;
  hasMore?: boolean;
}

export function normalizeLiveRooms(response: LiveRoomsResponse): LiveRoom[] {
  return response.list
    .filter((room) => room.status !== "offline")
    .map((room, index) => ({
      id: String(room.id),
      gameId: room.gameId == null ? undefined : String(room.gameId),
      serverId: room.serverId == null ? undefined : String(room.serverId),
      title: room.title,
      streamerName: room.streamerName,
      streamerAvatar: room.streamerAvatar,
      coverUrl: room.coverUrl,
      viewers: Number(room.viewers) || 0,
      gameName: room.gameName,
      serverName: room.serverName ?? "",
      status: room.status === "offline" ? "replay" : room.status,
      roomUrl: room.roomUrl,
      startedAt: room.startedAt,
      endedAt: room.endedAt,
      accent: ["#4d7cff", "#a855f7", "#e06b35", "#39a97b"][index % 4],
    }));
}

export function getLiveRooms(page = 1, pageSize = 6, signal?: AbortSignal) {
  const token = getAccessToken();
  return apiRequest<LiveRoomsResponse>(`${clientApi.liveRooms}?page=${page}&pageSize=${pageSize}`, {
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
