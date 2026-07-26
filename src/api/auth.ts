import { clientApi } from "./routes";
import { apiRequest } from "./http";

export interface RegisterResult {
  accessToken: string;
  refreshToken?: string;
  user?: { account?: string; nickname?: string };
}

export interface LoginResult {
  accessToken: string;
  refreshToken?: string;
  user?: { account?: string; nickname?: string };
}

function createDeviceId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // HTTP 非安全上下文没有 randomUUID，用兼容生成
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId() {
  const key = "gamebox_device_id";
  let value = localStorage.getItem(key);
  if (!value) {
    value = createDeviceId();
    localStorage.setItem(key, value);
  }
  return value;
}

export function registerAccount(account: string, password: string, passwordConfirmation: string) {
  return apiRequest<RegisterResult>(clientApi.auth.register, {
    method: "POST",
    body: JSON.stringify({
      account,
      password,
      passwordConfirmation,
      deviceId: getDeviceId(),
    }),
  });
}

export function loginAccount(account: string, password: string, rememberAccount: boolean) {
  return apiRequest<LoginResult>(clientApi.auth.login, {
    method: "POST",
    body: JSON.stringify({
      account,
      password,
      rememberAccount,
      deviceId: getDeviceId(),
    }),
  });
}

export function requestPasswordReset(account: string) {
  return apiRequest<{ accountMasked: string; expireIn: number }>(`${clientApi.auth.passwordResetRequest}`, {
    method: "POST",
    body: JSON.stringify({ account, deviceId: getDeviceId() }),
  });
}

export function confirmPasswordReset(account: string, code: string, newPassword: string) {
  return apiRequest<{ accessToken?: string; user?: { account?: string } }>(`${clientApi.auth.passwordResetConfirm}`, {
    method: "POST",
    body: JSON.stringify({ account, code, newPassword, deviceId: getDeviceId() }),
  });
}
