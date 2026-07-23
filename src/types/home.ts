export type HomeChannel = "follow" | "recommend" | "new-server";

export interface LiveRoom {
  id: string;
  gameId?: string;
  serverId?: string;
  title: string;
  streamerName: string;
  streamerAvatar?: string;
  coverUrl?: string;
  viewers: number;
  gameName: string;
  serverName: string;
  status: "live" | "upcoming" | "replay";
  roomUrl?: string;
  startedAt?: string;
  endedAt?: string | null;
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
  imageUrl?: string;
  linkType?: string;
  linkValue?: string;
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
