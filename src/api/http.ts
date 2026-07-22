export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body || ![0, 200].includes(body.code)) {
    throw new Error(body?.message || body?.msg || "网络请求失败");
  }
  return body.data as T;
}

export async function apiRequestEnvelope<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body || ![0, 200].includes(body.code)) throw new Error(body?.message || body?.msg || "网络请求失败");
  return body as T;
}
