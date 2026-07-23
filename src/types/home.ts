export type HomeChannel = "follow" | "recommend" | "new-server";

export interface LiveRoom {
  id: string;
  title: string;
  streamerName: string;
  streamerAvatar?: string;
  coverUrl?: string;
  viewers: number;
  gameName: string;
  serverName: string;
  status: "live" | "upcoming" | "replay";
  accent: string;
}

export interface NewServer {
  id: string;
  gameId: string;
  gameName: string;
  imageUrl?: string;
  serverName: string;
  openAt: string;
  status: "opening_soon" | "normal" | "hot" | "full" | "maintenance";
  onlineLabel: string;
  tags: string[];
}

export interface RecommendedGame {
  id: string;
  name: string;
  subtitle: string;
  genre: string;
  playersLabel: string;
  accent: string;
  iconUrl?: string;
  isNew?: boolean;
}

export interface HomeBanner {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  accent: string;
  expiresAt?: string;
}

export interface HomeFeed {
  requestId: string;
  liveRooms: LiveRoom[];
  newServers: NewServer[];
  games: RecommendedGame[];
  banners: HomeBanner[];
  taskUnreadCount: number;
  messageUnreadCount: number;
}
