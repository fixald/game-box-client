import { apiRequestEnvelope } from "./http";
import { clientApi } from "./routes";
import { getAccessToken } from "../utils/auth";

export interface VipLevel {
  name: string;
  requirement: string;
  growth: number;
  desc: string;
}

export interface VipLevelsResponse {
  levels: VipLevel[];
}

export function getVipLevels(signal?: AbortSignal) {
  const token = getAccessToken();
  return apiRequestEnvelope<VipLevelsResponse>(clientApi.vipLevels, {
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
