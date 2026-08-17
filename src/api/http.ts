import { clearSession } from "../utils/auth";

const AUTH_PATH_PARTS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/password/"];

/** Header values are byte strings in fetch; keep generated opaque keys ASCII-safe. */
export function encodeHeaderValue(value: string): string {
  return encodeURIComponent(value);
}

function isAuthRequest(url: string) {
  return AUTH_PATH_PARTS.some((part) => url.includes(part));
}

function redirectToLogin(url: string, body: unknown, status: number) {
  if (isAuthRequest(url) || typeof window === "undefined") return false;
  const payload = body as { code?: number | string } | null;
  const code = Number(payload?.code);
  const tokenExpired = status === 401 || code === 10005 || code === 401;
  if (!tokenExpired) return false;
  clearSession();
  if (window.location.hash !== "#/login") window.location.hash = "#/login";
  return true;
}

export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => null);
  const redirected = redirectToLogin(url, body, response.status);
  const code = body?.code;
  const codeNum = typeof code === "number" ? code : Number(code);
  if (!response.ok || !body || ![0, 200].includes(codeNum)) {
    const error = new Error(redirected ? "登录状态已失效，请重新登录" : body?.message || body?.msg || "网络请求失败") as Error & { status?: number; code?: number };
    error.status = response.status;
    error.code = codeNum;
    throw error;
  }
  return body.data as T;
}

export async function apiRequestEnvelope<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => null);
  const redirected = redirectToLogin(url, body, response.status);
  const code = body?.code;
  const codeNum = typeof code === "number" ? code : Number(code);
  if (!response.ok || !body || ![0, 200].includes(codeNum)) throw new Error(redirected ? "登录状态已失效，请重新登录" : body?.message || body?.msg || "网络请求失败");
  return body as T;
}
