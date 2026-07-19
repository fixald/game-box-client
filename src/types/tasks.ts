export type TaskCategory = "daily" | "newbie" | "game" | "social";
export type TaskStatus = "in_progress" | "claimable" | "claimed" | "expired";

export interface TaskReward {
  type: "points" | "gift" | "vip_exp" | "coupon";
  name: string;
  amount?: number;
  icon: string;
}

export interface UserTask {
  id: string;
  category: TaskCategory;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  status: TaskStatus;
  rewards: TaskReward[];
  actionLabel?: string;
  actionRoute?: string;
  expiresAt?: string;
}

export interface CheckinDay {
  date: string;
  dayOfMonth: number;
  checked: boolean;
  available: boolean;
  reward?: TaskReward;
}

export interface TaskSummary {
  points: number;
  continuousCheckinDays: number;
  totalCompleted: number;
  claimableCount: number;
  checkin: {
    checkedToday: boolean;
    month: string;
    days: CheckinDay[];
  };
}

export interface TasksResponse {
  requestId: string;
  summary: TaskSummary;
  tasks: UserTask[];
}
