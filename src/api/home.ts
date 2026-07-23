import { apiRequest } from "./http";
import { clientApi } from "./routes";
import type { HomeBanner } from "../types/home";

export interface ClientBanner {
  id: number | string;
  title: string;
  imageUrl: string;
  linkType?: string;
  linkValue?: string;
  position: string;
  gameId?: number | null;
  startAt: string;
  endAt: string;
}

export interface BannersResponse {
  list?: ClientBanner[];
  rows?: ClientBanner[];
  items?: ClientBanner[];
}

function actionLabel(linkType?: string) {
  if (linkType === "game") return "进入游戏";
  if (linkType === "server") return "查看新服";
  if (linkType === "live") return "进入直播";
  if (linkType === "vip") return "查看权益";
  return "查看详情";
}

export function normalizeHomeBanners(response: BannersResponse | ClientBanner[]): HomeBanner[] {
  const rows = Array.isArray(response) ? response : response.list ?? response.rows ?? response.items ?? [];
  return rows.map((banner) => ({
    id: String(banner.id),
    eyebrow: "平台活动",
    title: banner.title,
    description: "登录盒子，查看最新活动与福利",
    actionLabel: actionLabel(banner.linkType),
    accent: "#7c3aed",
    imageUrl: banner.imageUrl,
    linkType: banner.linkType,
    linkValue: banner.linkValue,
    expiresAt: banner.endAt,
  }));
}

export function getHomeBanners() {
  return apiRequest<ClientBanner[] | BannersResponse>(`${clientApi.banners}?position=home_top`);
}
