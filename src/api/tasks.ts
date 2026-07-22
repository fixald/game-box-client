import { apiRequest, apiRequestEnvelope } from "./http";
import { clientApi } from "./routes";
import { getAccessToken } from "../utils/auth";
import type { TasksResponse, UserTask } from "../types/tasks";

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function requestId() { return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}`; }

export function getTasks(category = "all", date = new Date().toISOString().slice(0, 10), signal?: AbortSignal) {
  const query = new URLSearchParams({ category, date });
  return apiRequest<{ summary: TasksResponse["summary"]; tasks: UserTask[] }>(`${clientApi.tasks}info?${query}`, { signal, headers: { ...authHeaders(), "X-Request-Id": requestId() } });
}

export function getTaskList(signal?: AbortSignal) {
  return apiRequest<UserTask[]>(clientApi.tasks, { signal, headers: { ...authHeaders(), "X-Request-Id": requestId() } });
}

export interface CheckinReward { level: number; name: string; reward: string; icon: string; status: "claimable" | "claimed" | "locked"; }

export function getCheckinRewards(month: string, signal?: AbortSignal) {
  return apiRequestEnvelope<{ rewards: CheckinReward[] }>(`${clientApi.tasks.replace("/tasks", "/checkin-rewards")}?month=${encodeURIComponent(month)}`, { signal, headers: { ...authHeaders(), "X-Request-Id": requestId() } });
}

export function submitCheckin(date: string) {
  return apiRequest<{ date: string; points: number }>(`${clientApi.tasks.replace("/tasks", "/checkin")}`, { method: "POST", headers: { ...authHeaders(), "X-Request-Id": requestId(), "Idempotency-Key": `checkin_${date}` }, body: JSON.stringify({ date }) });
}

export function claimCheckinReward(level: number) {
  return apiRequest<null>(`${clientApi.tasks.replace("/tasks", "/checkin-rewards")}/claim`, { method: "POST", headers: { ...authHeaders(), "X-Request-Id": requestId(), "Idempotency-Key": `checkin_reward_${level}` }, body: JSON.stringify({ level }) });
}

export function claimTask(taskId: string) {
  return apiRequest<{ taskId: string; points: number }>(`${clientApi.tasks}/claim`, { method: "POST", headers: { ...authHeaders(), "X-Request-Id": requestId(), "Idempotency-Key": `task_claim_${taskId}` }, body: JSON.stringify({ taskId }) });
}
