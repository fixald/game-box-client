const AUTH_TOKEN_KEY = "gamebox_access_token";
const AUTH_ACCOUNT_KEY = "gamebox_account";

export function isAuthenticated() {
  return Boolean(sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY));
}

export function saveMockSession(account: string) {
  saveSession(`mock-token-${account}-${Date.now()}`, account);
}

export function saveSession(token: string, account: string, remember = false) {
  const storage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;
  otherStorage.removeItem(AUTH_TOKEN_KEY);
  otherStorage.removeItem(AUTH_ACCOUNT_KEY);
  storage.setItem(AUTH_TOKEN_KEY, token);
  storage.setItem(AUTH_ACCOUNT_KEY, account);
  window.dispatchEvent(new Event("auth-change"));
}

export function clearSession() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_ACCOUNT_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_ACCOUNT_KEY);
  window.dispatchEvent(new Event("auth-change"));
}

export function getCurrentAccount() {
  return sessionStorage.getItem(AUTH_ACCOUNT_KEY) || localStorage.getItem(AUTH_ACCOUNT_KEY) || "玩家";
}

export function getAccessToken() {
  return sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY) || "";
}
