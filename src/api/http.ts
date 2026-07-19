export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body || body.code !== 0) {
    throw new Error(body?.message || "网络请求失败");
  }
  return body.data as T;
}
