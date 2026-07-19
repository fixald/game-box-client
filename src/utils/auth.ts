const AUTH_TOKEN_KEY = "gamebox_access_token";
const AUTH_ACCOUNT_KEY = "gamebox_account";

export function isAuthenticated() {
  return Boolean(sessionStorage.getItem(AUTH_TOKEN_KEY));
}

export function saveMockSession(account: string) {
  sessionStorage.setItem(AUTH_TOKEN_KEY, `mock-token-${account}-${Date.now()}`);
  sessionStorage.setItem(AUTH_ACCOUNT_KEY, account);
  window.dispatchEvent(new Event("auth-change"));
}

export function clearSession() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_ACCOUNT_KEY);
  window.dispatchEvent(new Event("auth-change"));
}

export function getCurrentAccount() {
  return sessionStorage.getItem(AUTH_ACCOUNT_KEY) || "玩家";
}
