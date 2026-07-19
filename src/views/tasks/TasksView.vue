<script setup lang="ts">
import { computed, ref } from "vue";
import type { TaskCategory, TasksResponse, UserTask } from "../../types/tasks";

const categories: Array<{ key: "all" | TaskCategory; label: string }> = [
  { key: "all", label: "全部任务" },
  { key: "daily", label: "每日任务" },
  { key: "newbie", label: "新手任务" },
  { key: "game", label: "游戏任务" },
  { key: "social", label: "互动任务" },
];

const data = ref<TasksResponse>({
  requestId: "mock_tasks_001",
  summary: {
    points: 1280,
    continuousCheckinDays: 6,
    totalCompleted: 18,
    claimableCount: 2,
    checkin: {
      checkedToday: false,
      month: "2026年7月",
      days: [
        { date: "2026-07-01", dayOfMonth: 1, checked: true, available: true, reward: { type: "points", name: "积分", amount: 10, icon: "✦" } },
        { date: "2026-07-02", dayOfMonth: 2, checked: true, available: true, reward: { type: "points", name: "积分", amount: 10, icon: "✦" } },
        { date: "2026-07-03", dayOfMonth: 3, checked: true, available: true, reward: { type: "points", name: "积分", amount: 15, icon: "✦" } },
        { date: "2026-07-04", dayOfMonth: 4, checked: true, available: true, reward: { type: "points", name: "积分", amount: 15, icon: "✦" } },
        { date: "2026-07-05", dayOfMonth: 5, checked: true, available: true, reward: { type: "points", name: "积分", amount: 20, icon: "✦" } },
        { date: "2026-07-06", dayOfMonth: 6, checked: true, available: true, reward: { type: "points", name: "积分", amount: 20, icon: "✦" } },
        { date: "2026-07-07", dayOfMonth: 7, checked: false, available: true, reward: { type: "gift", name: "七日礼包", icon: "🎁" } },
      ],
    },
  },
  tasks: [
    { id: "task-1", category: "daily", title: "每日登录盒子", description: "登录客户端即可完成", icon: "◷", progress: 1, target: 1, status: "claimable", rewards: [{ type: "points", name: "积分", amount: 20, icon: "✦" }] },
    { id: "task-2", category: "daily", title: "观看直播 10 分钟", description: "在直播频道观看任意直播", icon: "▶", progress: 6, target: 10, status: "in_progress", rewards: [{ type: "points", name: "积分", amount: 50, icon: "✦" }], actionLabel: "去直播", actionRoute: "#/live" },
    { id: "task-3", category: "game", title: "启动一次游戏", description: "启动任意已安装的传奇游戏", icon: "⚔", progress: 1, target: 1, status: "claimable", rewards: [{ type: "gift", name: "新手礼包", icon: "🎁" }] },
    { id: "task-4", category: "newbie", title: "完善个人资料", description: "上传头像并设置昵称", icon: "◇", progress: 0, target: 1, status: "in_progress", rewards: [{ type: "vip_exp", name: "SVIP经验", amount: 100, icon: "♛" }], actionLabel: "去完善", actionRoute: "#/settings" },
    { id: "task-5", category: "social", title: "关注 3 位主播", description: "关注你喜欢的传奇主播", icon: "♡", progress: 2, target: 3, status: "in_progress", rewards: [{ type: "points", name: "积分", amount: 30, icon: "✦" }], actionLabel: "去关注", actionRoute: "#/live" },
    { id: "task-6", category: "newbie", title: "完成首次下载", description: "下载并校验一款游戏", icon: "↓", progress: 1, target: 1, status: "claimed", rewards: [{ type: "coupon", name: "下载加速券", amount: 1, icon: "⚡" }] },
  ],
});

const activeCategory = ref<"all" | TaskCategory>("all");
const loading = ref(false);
const toast = ref("");
const filteredTasks = computed(() => activeCategory.value === "all" ? data.value.tasks : data.value.tasks.filter((task) => task.category === activeCategory.value));
const completionRate = computed(() => Math.round(data.value.tasks.filter((task) => task.status === "claimed").length / data.value.tasks.length * 100));

function notify(message: string) {
  toast.value = message;
  window.setTimeout(() => { toast.value = ""; }, 2200);
}

function claimTask(task: UserTask) {
  if (task.status !== "claimable") return;
  loading.value = true;
  window.setTimeout(() => {
    task.status = "claimed";
    data.value.summary.claimableCount = Math.max(0, data.value.summary.claimableCount - 1);
    data.value.summary.points += task.rewards.find((reward) => reward.type === "points")?.amount ?? 0;
    loading.value = false;
    notify(`已领取「${task.title}」奖励`);
  }, 350);
}

function checkin() {
  if (data.value.summary.checkin.checkedToday) return notify("今天已经签到过了");
  data.value.summary.checkin.checkedToday = true;
  const today = data.value.summary.checkin.days.find((day) => day.dayOfMonth === 7);
  if (today) today.checked = true;
  data.value.summary.continuousCheckinDays += 1;
  data.value.summary.points += 20;
  notify("签到成功，积分已到账");
}

function goAction(task: UserTask) {
  if (task.actionRoute) window.location.hash = task.actionRoute.replace("#", "");
  else notify("功能即将开放");
}
</script>

<template>
  <div class="tasks-page">
    <header class="tasks-header"><div><span class="eyebrow">DAILY REWARDS</span><h1>任务中心</h1><p>完成任务，领取积分、礼包和 SVIP 专属奖励</p></div><button class="back-button" @click="window.location.hash = ''">← 返回</button></header>

    <section class="summary-grid">
      <article class="summary-card points-card"><div class="summary-icon">✦</div><div><span>我的积分</span><strong>{{ data.summary.points.toLocaleString() }}</strong><small>可兑换礼包和抽奖次数</small></div><button @click="notify('积分商城即将开放')">去兑换 →</button></article>
      <article class="summary-card"><div class="summary-icon fire">♨</div><div><span>连续签到</span><strong>{{ data.summary.continuousCheckinDays }} <em>天</em></strong><small>再签到 1 天可领取七日礼包</small></div><button :class="{ disabled: data.summary.checkin.checkedToday }" @click="checkin">{{ data.summary.checkin.checkedToday ? "今日已签" : "立即签到" }}</button></article>
      <article class="summary-card"><div class="summary-icon trophy">♛</div><div><span>任务完成度</span><strong>{{ completionRate }}<em>%</em></strong><small>累计完成 {{ data.summary.totalCompleted }} 个任务</small></div><div class="summary-progress"><i :style="{ width: `${completionRate}%` }"></i></div></article>
    </section>

    <section class="checkin-card"><div class="checkin-title"><div><span class="eyebrow">CHECK IN</span><h2>每日签到</h2></div><span class="month-label">{{ data.summary.checkin.month }}　›</span></div><div class="checkin-days"><div v-for="day in data.summary.checkin.days" :key="day.date" class="checkin-day" :class="{ checked: day.checked, today: day.dayOfMonth === 7 && !day.checked }"><span>周{{ ["日", "一", "二", "三", "四", "五", "六"][new Date(day.date).getDay()] }}</span><b>{{ day.checked ? "✓" : day.dayOfMonth }}</b><small>{{ day.reward?.icon }} {{ day.reward?.amount ? `+${day.reward.amount}` : day.reward?.name }}</small></div></div><div class="checkin-footer"><span>已连续签到 {{ data.summary.continuousCheckinDays }} 天</span><span>本月已签到 6 / 31 天</span></div></section>

    <section class="task-section"><div class="section-heading"><div><span class="eyebrow">TASK LIST</span><h2>任务列表 <i v-if="data.summary.claimableCount">{{ data.summary.claimableCount }} 个可领取</i></h2></div><div class="category-tabs"><button v-for="category in categories" :key="category.key" :class="{ active: activeCategory === category.key }" @click="activeCategory = category.key">{{ category.label }}</button></div></div><div class="task-list"><article v-for="task in filteredTasks" :key="task.id" class="task-row"><div class="task-icon">{{ task.icon }}</div><div class="task-body"><div class="task-title"><h3>{{ task.title }}</h3><span class="task-status" :class="task.status">{{ task.status === "claimable" ? "可领取" : task.status === "claimed" ? "已完成" : task.status === "expired" ? "已过期" : "进行中" }}</span></div><p>{{ task.description }}</p><div class="task-progress"><div><i :style="{ width: `${Math.min(100, task.progress / task.target * 100)}%` }"></i></div><span>{{ task.progress }} / {{ task.target }}</span></div></div><div class="task-rewards"><span>奖励</span><div v-for="reward in task.rewards" :key="reward.name">{{ reward.icon }} {{ reward.name }}<b v-if="reward.amount">+{{ reward.amount }}</b></div></div><button v-if="task.status === 'claimable'" class="claim-button" :disabled="loading" @click="claimTask(task)">领取奖励</button><button v-else-if="task.status === 'in_progress'" class="action-button" @click="goAction(task)">{{ task.actionLabel || "去完成" }}</button><span v-else class="claimed-label">已领取 ✓</span></article><div v-if="!filteredTasks.length" class="empty-state">当前分类暂无任务</div></div></section>
  </div>
</template>

<style scoped>
:global(*) { box-sizing: border-box; }
:global(body) { margin: 0; background: #111217; color: #f5f1e9; font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif; }
button { font: inherit; cursor: pointer; border: 0; }.tasks-page { min-height: 100vh; max-width: 1250px; margin: auto; padding: 42px 46px 60px; background: radial-gradient(circle at 80% 0, rgba(103,77,30,.14), transparent 30%); }.tasks-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }.eyebrow { color: #c8a44a; font-size: 10px; letter-spacing: 2px; }.tasks-header h1 { margin: 8px 0 7px; font-size: 31px; }.tasks-header p { margin: 0; color: #8d8e97; font-size: 13px; }.close-button { color: #8d8e97; background: transparent; font-size: 26px; }.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }.summary-card { min-height: 137px; padding: 22px; display: flex; align-items: flex-start; gap: 14px; position: relative; overflow: hidden; border: 1px solid #302e29; border-radius: 9px; background: linear-gradient(135deg, #24221d, #191a20); }.summary-card > div:nth-child(2) { display: flex; flex-direction: column; gap: 5px; }.summary-card span { color: #9b9aa0; font-size: 12px; }.summary-card strong { color: #f1d16b; font-size: 28px; line-height: 1.1; }.summary-card em { margin-left: 3px; color: #c7a94e; font-size: 13px; font-style: normal; }.summary-card small { color: #73757e; font-size: 10px; }.summary-icon { width: 39px; height: 39px; display: grid; place-items: center; border-radius: 10px; color: #f2ce60; background: rgba(219,177,57,.14); font-size: 21px; }.summary-icon.fire { color: #f07e48; background: rgba(240,126,72,.12); }.summary-icon.trophy { color: #cba4ef; background: rgba(168,85,247,.13); }.summary-card button { position: absolute; right: 18px; bottom: 18px; padding: 6px 9px; color: #e2c258; background: #302c1e; border: 1px solid #65562e; border-radius: 4px; font-size: 10px; }.summary-card button.disabled { color: #76736a; border-color: #48463e; background: transparent; }.summary-progress { position: absolute; left: 22px; right: 22px; bottom: 22px; height: 4px; border-radius: 5px; background: #33343b; }.summary-progress i { display: block; height: 100%; border-radius: inherit; background: #c6a442; transition: width .3s; }
.checkin-card, .task-section { margin-top: 25px; padding: 25px; border: 1px solid #292b33; border-radius: 9px; background: #1a1b21; }.checkin-title, .section-heading { display: flex; justify-content: space-between; align-items: flex-end; }.checkin-title h2, .section-heading h2 { margin: 6px 0 0; font-size: 19px; }.month-label { color: #aaaab0; font-size: 12px; }.checkin-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-top: 24px; }.checkin-day { min-height: 91px; padding: 10px 5px; display: flex; flex-direction: column; align-items: center; gap: 7px; border: 1px solid #2e3038; border-radius: 6px; color: #7e808a; font-size: 10px; }.checkin-day b { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; color: #a6a7ad; background: #292b33; font-size: 12px; }.checkin-day small { color: #777981; font-size: 9px; white-space: nowrap; }.checkin-day.checked { border-color: #64552d; background: rgba(173,139,45,.09); }.checkin-day.checked b { color: #1e1b13; background: #d4b74f; }.checkin-day.checked small { color: #c3a94e; }.checkin-day.today { border-color: #d1ad48; box-shadow: 0 0 0 1px rgba(209,173,72,.25); }.checkin-footer { display: flex; justify-content: space-between; margin-top: 18px; color: #82838c; font-size: 11px; }.section-heading { align-items: center; }.section-heading h2 i { margin-left: 9px; padding: 3px 6px; color: #e6c35e; background: rgba(214,174,55,.12); border-radius: 3px; font-size: 10px; font-style: normal; font-weight: 400; }.category-tabs { display: flex; gap: 7px; }.category-tabs button { padding: 7px 11px; color: #858690; background: transparent; border-radius: 4px; font-size: 11px; }.category-tabs button:hover, .category-tabs button.active { color: #e5c45d; background: #302c20; }.task-list { margin-top: 20px; }.task-row { min-height: 100px; padding: 17px 0; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid #292b32; }.task-row:last-child { border-bottom: 0; }.task-icon { width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; border-radius: 9px; color: #d2b452; background: #2c291f; font-size: 19px; }.task-body { min-width: 210px; flex: 1.7; }.task-title { display: flex; align-items: center; gap: 8px; }.task-title h3 { margin: 0; font-size: 13px; }.task-status { padding: 3px 6px; border-radius: 3px; color: #8b8c94; background: #2a2b31; font-size: 9px; }.task-status.claimable { color: #e8c75c; background: rgba(224,183,57,.15); }.task-status.claimed { color: #6ec89b; background: rgba(76,170,115,.13); }.task-body p { margin: 6px 0 10px; color: #7f8089; font-size: 10px; }.task-progress { display: flex; align-items: center; gap: 10px; }.task-progress > div { width: 110px; height: 4px; overflow: hidden; border-radius: 4px; background: #33343a; }.task-progress i { display: block; height: 100%; border-radius: inherit; background: #b89a3e; }.task-progress span { color: #878891; font-size: 10px; }.task-rewards { min-width: 145px; color: #70727b; font-size: 10px; }.task-rewards > span { display: block; margin-bottom: 6px; }.task-rewards div { color: #b2a36f; }.task-rewards b { margin-left: 5px; color: #dfbd57; font-weight: 400; }.claim-button, .action-button { min-width: 75px; padding: 8px 10px; border-radius: 4px; font-size: 10px; }.claim-button { color: #1e1a0e; background: #dfbd54; }.claim-button:hover { background: #f2d56e; }.claim-button:disabled { opacity: .6; cursor: wait; }.action-button { color: #d0b04d; background: transparent; border: 1px solid #5b4f2d; }.claimed-label { min-width: 75px; color: #697b6e; font-size: 10px; text-align: center; }.empty-state { padding: 38px; color: #7f8089; text-align: center; }
@media (max-width: 850px) { .tasks-page { padding: 28px 20px 45px; }.summary-grid { grid-template-columns: 1fr; }.summary-card { min-height: 115px; }.task-row { flex-wrap: wrap; }.task-body { min-width: calc(100% - 55px); }.task-rewards { margin-left: 55px; }.category-tabs { overflow-x: auto; }.checkin-days { gap: 4px; }.checkin-day { min-height: 80px; } }
@media (max-width: 520px) { .tasks-header h1 { font-size: 25px; }.checkin-card, .task-section { padding: 17px 12px; }.checkin-day small { font-size: 8px; }.section-heading { align-items: flex-start; flex-direction: column; gap: 13px; }.task-rewards { min-width: 120px; }.task-row { gap: 10px; } }
<style scoped>
.tasks-page { height: 100vh; overflow-y: auto; scrollbar-color: #6f5a2d #17181d; scrollbar-width: thin; }
.tasks-page::-webkit-scrollbar { width: 8px; }
.tasks-page::-webkit-scrollbar-track { background: #17181d; }
.tasks-page::-webkit-scrollbar-thumb { border-radius: 8px; background: #6f5a2d; }
<style scoped>
.back-button { padding: 8px 13px; border: 1px solid #5e512d; border-radius: 5px; background: #29251a; color: #d8b84e; font-size: 12px; }
.back-button:hover { background: #3a3220; color: #f0d16c; }
</style>
