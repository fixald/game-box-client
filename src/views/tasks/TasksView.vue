<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { TaskCategory, TasksResponse, UserTask } from "../../types/tasks";
import { claimCheckinReward, claimTask as claimTaskApi, getCheckinRewards, getTaskList, getTasks, type CheckinReward, submitCheckin } from "../../api/tasks";
import { clearSession, getCurrentAccount } from "../../utils/auth";

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
    { id: "task-7", category: "daily", title: "浏览新服推荐", description: "查看今日推荐新区和开服信息", icon: "◈", progress: 0, target: 1, status: "in_progress", rewards: [{ type: "points", name: "积分", amount: 10, icon: "✦" }], actionLabel: "去新服", actionRoute: "#/" },
    { id: "task-8", category: "daily", title: "完成一次签到", description: "在任务中心完成每日签到", icon: "✓", progress: 0, target: 1, status: "in_progress", rewards: [{ type: "points", name: "积分", amount: 20, icon: "✦" }] },
    { id: "task-9", category: "game", title: "查看游戏详情", description: "浏览任意一款游戏的详情页面", icon: "◉", progress: 0, target: 1, status: "in_progress", rewards: [{ type: "points", name: "积分", amount: 15, icon: "✦" }], actionLabel: "去游戏", actionRoute: "#/games" },
    { id: "task-10", category: "game", title: "进入推荐区服", description: "从新服推荐中选择一个区服", icon: "⚑", progress: 0, target: 1, status: "in_progress", rewards: [{ type: "gift", name: "区服礼包", icon: "🎁" }] },
    { id: "task-12", category: "newbie", title: "完成首次区服选择", description: "选择喜欢的游戏区服", icon: "◇", progress: 0, target: 1, status: "in_progress", rewards: [{ type: "vip_exp", name: "SVIP经验", amount: 50, icon: "♛" }] },
  ],
});

const activeCategory = ref<"all" | TaskCategory>("all");
const loading = ref(false);
const pageLoading = ref(false);
const pageError = ref("");
const checkinRewards = ref<CheckinReward[]>([]);
const toast = ref("");
const currentAccount = ref(getCurrentAccount());
const navItems = [
  { icon: "⌂", label: "首页" }, { icon: "▶", label: "直播" },
  { icon: "◉", label: "游戏" }, { icon: "✓", label: "任务" }, { icon: "S", label: "SVIP" },
];
const filteredTasks = computed(() => activeCategory.value === "all" ? data.value.tasks : data.value.tasks.filter((task) => task.category === activeCategory.value));
const completionRate = computed(() => data.value.tasks.length
  ? Math.round(data.value.tasks.filter((task) => task.status === "claimed").length / data.value.tasks.length * 100)
  : 0);
const checkedInDays = computed(() => data.value.summary.checkin.days.filter((day) => day.checked).length);
const todayCheckinLabel = computed(() => data.value.summary.checkin.checkedToday ? "今日已完成签到" : "今日还未签到");
const todayDate = new Date();
const todayKey = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;
const calendarDays = computed(() => {
  const [year, month] = data.value.summary.checkin.month.split("-").map(Number);
  const totalDays = new Date(year, month, 0).getDate();
  const existing = new Map(data.value.summary.checkin.days.map((day) => [day.date, day]));
  return Array.from({ length: totalDays }, (_, index) => {
    const dayOfMonth = index + 1;
    const date = `${year}-${String(month).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`;
    return existing.get(date) ?? { date, dayOfMonth, checked: false, available: date <= todayKey, reward: { type: "points", name: "积分", amount: 10, icon: "✦" } };
  });
});
const checkinMilestones = computed(() => checkinRewards.value.map((item) => ({ ...item, days: item.level, completed: item.status === "claimed" })));

function notify(message: string) {
  toast.value = message;
  window.setTimeout(() => { toast.value = ""; }, 2200);
}

function claimTask(task: UserTask) {
  if (task.status !== "claimable") return;
  loading.value = true;
  void claimTaskApi(task.id).then((result) => {
    task.status = "claimed";
    data.value.summary.claimableCount = Math.max(0, data.value.summary.claimableCount - 1);
    data.value.summary.points += result.points;
    notify(`已领取「${task.title}」奖励`);
  }).catch((error) => notify(error instanceof Error ? error.message : "领取失败，请稍后重试")).finally(() => { loading.value = false; });
}

function checkin() {
  if (data.value.summary.checkin.checkedToday) return notify("今天已经签到过了");
  loading.value = true;
  void submitCheckin(todayKey).then((result) => {
    data.value.summary.checkin.checkedToday = true;
    data.value.summary.continuousCheckinDays += 1;
    data.value.summary.points += result.points;
    const today = data.value.summary.checkin.days.find((day) => day.date === todayKey);
    if (today) today.checked = true;
    notify("签到成功，积分已到账");
  }).catch((error) => notify(error instanceof Error ? error.message : "签到失败，请稍后重试")).finally(() => { loading.value = false; });
}

function claimReward(level: number) {
  const reward = checkinRewards.value.find((item) => item.level === level);
  if (!reward || reward.status !== "claimable") return;
  loading.value = true;
  void claimCheckinReward(level).then(() => {
    reward.status = "claimed";
    notify(`已领取「${reward.name}」`);
  }).catch((error) => notify(error instanceof Error ? error.message : "奖励领取失败，请稍后重试")).finally(() => { loading.value = false; });
}

async function loadTasks() {
  pageLoading.value = true;
  pageError.value = "";
  try {
    const month = todayKey.slice(0, 7);
    const [taskInfo, taskList, rewards] = await Promise.all([
      getTasks("all", todayKey),
      getTaskList(),
      getCheckinRewards(month),
    ]);
    data.value = {
      ...data.value,
      ...taskInfo,
      summary: {
        ...data.value.summary,
        ...taskInfo.summary,
        checkin: {
          ...data.value.summary.checkin,
          ...taskInfo.summary.checkin,
          month,
        },
      },
      requestId: data.value.requestId,
      tasks: taskList,
    };
    checkinRewards.value = rewards.rewards;
  }
  catch (error) { pageError.value = error instanceof Error ? error.message : "任务数据加载失败"; }
  finally { pageLoading.value = false; }
}

function goAction(task: UserTask) {
  if (task.actionRoute) window.location.hash = task.actionRoute.replace("#", "");
  else notify("功能即将开放");
}

function goHome() {
  window.location.hash = "";
}
function goGames() { window.location.hash = "#/games"; }
function goTasks() { window.location.hash = "#/tasks"; }
const activeNav = ref("任务");
function navigate(label: string) {
  activeNav.value = label;
  if (label === "首页") return goHome();
  if (label === "游戏") return goGames();
  if (label === "任务") return goTasks();
  if (label === "SVIP") return void (window.location.hash = "#/vip");
  notify(`「${label}」页面即将开放`);
}
function goAccount() { window.location.hash = "#/account"; }
function logout() { clearSession(); window.location.hash = "#/login"; }
onMounted(loadTasks);
</script>

<template>
  <div class="gamebox-shell"><aside class="gamebox-sidebar"><div class="brand"><span class="brand-mark">game</span><span>盒子</span></div><nav class="side-nav" aria-label="主导航"><button v-for="item in navItems" :key="item.label" class="side-item" :class="{ active: activeNav === item.label }" @click="navigate(item.label)"><span class="side-icon">{{ item.icon }}</span><span>{{ item.label }}</span></button></nav><div class="sidebar-footer"><button class="side-item" @click="navigate('设置')"><span class="side-icon">⚙</span><span>设置</span></button></div></aside><section class="gamebox-main"><header class="topbar"><div class="window-actions"><button aria-label="刷新" @click="notify('任务状态已刷新')">↻</button></div><div class="user-actions"><button class="message-button" aria-label="消息">♢</button><button class="account-button" aria-label="个人中心" @click="goAccount"><span class="avatar">{{ currentAccount.slice(0, 1).toUpperCase() }}</span></button><button class="logout-button" @click="logout">退出</button></div></header>
  <main class="tasks-page" style="height: calc(100vh - 64px); overflow-y: scroll; scrollbar-gutter: stable;">
    <div v-if="pageLoading" class="page-state">正在加载任务数据…</div><div v-else-if="pageError" class="page-state"><span>{{ pageError }}</span><button @click="loadTasks">重试</button></div>
    <header class="tasks-header"><div><span class="eyebrow">DAILY REWARDS</span><h1>任务中心</h1><p>完成任务，领取积分、礼包和 SVIP 专属奖励</p></div></header>

    <section class="summary-grid">
      <article class="summary-card points-card"><div class="summary-icon">✦</div><div><span>我的积分</span><strong>{{ data.summary.points.toLocaleString() }}</strong><small>可兑换礼包和抽奖次数</small></div><button @click="notify('积分商城即将开放')">去兑换 →</button></article>
      <article class="summary-card"><div class="summary-icon fire">♨</div><div><span>连续签到</span><strong>{{ data.summary.continuousCheckinDays }} <em>天</em></strong><small>再签到 1 天可领取七日礼包</small></div><button :class="{ disabled: data.summary.checkin.checkedToday }" @click="checkin">{{ data.summary.checkin.checkedToday ? "今日已签" : "立即签到" }}</button></article>
      <article class="summary-card"><div class="summary-icon trophy">♛</div><div><span>任务完成度</span><strong>{{ completionRate }}<em>%</em></strong><small>累计完成 {{ data.summary.totalCompleted }} 个任务</small></div><div class="summary-progress"><i :style="{ width: `${completionRate}%` }"></i></div></article>
    </section>

    <section class="checkin-card"><div class="checkin-title"><div><span class="eyebrow">CHECK IN</span><h2>每日签到</h2><p class="checkin-status">{{ todayCheckinLabel }} · 连续签到 {{ data.summary.continuousCheckinDays }} 天</p></div><span class="month-label">{{ data.summary.checkin.month }}　›</span></div><div class="checkin-days"><div v-for="day in calendarDays" :key="day.date" class="checkin-day" :class="{ checked: day.checked, today: day.date === todayKey }"><span>周{{ ["日", "一", "二", "三", "四", "五", "六"][new Date(day.date).getDay()] }}</span><b>{{ day.checked ? "✓" : day.dayOfMonth }}</b><small>{{ day.reward?.icon }} {{ day.reward?.amount ? `+${day.reward.amount}` : day.reward?.name }}</small></div></div><div class="checkin-footer"><span>本月已签到 {{ checkedInDays }} / {{ calendarDays.length }} 天</span><button class="checkin-action" :class="{ done: data.summary.checkin.checkedToday }" @click="checkin">{{ data.summary.checkin.checkedToday ? "今日已签" : "立即签到" }}</button></div></section>

    <section class="task-section"><div class="section-heading"><div><span class="eyebrow">TASK LIST</span><h2>任务列表 <i v-if="data.summary.claimableCount">{{ data.summary.claimableCount }} 个可领取</i></h2></div><div class="category-tabs"><button v-for="category in categories" :key="category.key" :class="{ active: activeCategory === category.key }" @click="activeCategory = category.key">{{ category.label }}</button></div></div><div class="task-list"><article v-for="task in filteredTasks" :key="task.id" class="task-row"><div class="task-icon">{{ task.icon }}</div><div class="task-body"><div class="task-title"><h3>{{ task.title }}</h3><span class="task-status" :class="task.status">{{ task.status === "claimable" ? "可领取" : task.status === "claimed" ? "已完成" : task.status === "expired" ? "已过期" : "进行中" }}</span></div><p>{{ task.description }}</p><div class="task-progress"><div><i :style="{ width: `${Math.min(100, task.progress / task.target * 100)}%` }"></i></div><span>{{ task.progress }} / {{ task.target }}</span></div></div><div class="task-rewards"><span>奖励</span><div v-for="reward in task.rewards" :key="reward.name">{{ reward.icon }} {{ reward.name }}<b v-if="reward.amount">+{{ reward.amount }}</b></div></div><button v-if="task.status === 'claimable'" class="claim-button" :disabled="loading" @click="claimTask(task)">领取奖励</button><button v-else-if="task.status === 'in_progress'" class="action-button" @click="goAction(task)">{{ task.actionLabel || "去完成" }}</button><span v-else class="claimed-label">已领取 ✓</span></article><div v-if="!filteredTasks.length" class="empty-state">当前分类暂无任务</div></div></section>
    <section class="cumulative-rewards"><div class="section-heading"><div><span class="eyebrow">CHECK IN REWARDS</span><h2>累计签到奖励</h2></div><span class="reward-progress">已连续 {{ data.summary.continuousCheckinDays }} 天</span></div><div class="milestone-list"><article v-for="milestone in checkinMilestones" :key="milestone.days" class="milestone" :class="{ completed: milestone.completed }" @click="claimReward(milestone.days)"><div class="milestone-icon">{{ milestone.completed ? "✓" : milestone.icon }}</div><strong>{{ milestone.days }}天</strong><span>{{ milestone.name }}</span><small>{{ milestone.reward }}</small></article></div></section>
  </main></section></div>
</template>

<style scoped>
.app-shell { min-height: 100vh; display: flex; background: #101116; }.sidebar { width: 104px; flex: 0 0 104px; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px 10px; background: #0d0e13; border-right: 1px solid #23242c; }.brand { margin-bottom: 22px; color: #f4c94e; font-weight: 800; font-size: 14px; text-align: center; line-height: 1.1; }.brand span { font-size: 11px; }.nav-item { width: 84px; min-height: 58px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; border: 0; border-radius: 9px; color: #777984; background: transparent; cursor: pointer; font-size: 18px; }.nav-item span { font-size: 11px; }.nav-item:hover, .nav-item .active { color: #f4c94e; }.main-area { min-width: 0; flex: 1; }.topbar { height: 64px; display: flex; align-items: center; gap: 24px; padding: 0 32px; border-bottom: 1px solid #23242c; background: rgba(13,14,19,.62); }.refresh, .home-link { border: 0; color: #a6a7b0; background: transparent; cursor: pointer; }.refresh { font-size: 23px; }.home-link { margin-left: auto; font-size: 12px; }.search-box { width: min(420px, 50vw); height: 34px; display: flex; align-items: center; gap: 8px; padding: 0 10px; border: 1px solid #2d2e37; border-radius: 8px; color: #73757f; background: #191a20; }.search-box input { width: 100%; border: 0; outline: 0; color: #eee; background: transparent; font-size: 12px; }
:global(*) { box-sizing: border-box; }
:global(body) { margin: 0; background: #111217; color: #f5f1e9; font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif; }
button { font: inherit; cursor: pointer; border: 0; }.tasks-page { min-height: 100vh; max-width: 1250px; margin: auto; padding: 42px 46px 60px; background: radial-gradient(circle at 80% 0, rgba(103,77,30,.14), transparent 30%); }.tasks-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }.eyebrow { color: #c8a44a; font-size: 10px; letter-spacing: 2px; }.tasks-header h1 { margin: 8px 0 7px; font-size: 31px; }.tasks-header p { margin: 0; color: #8d8e97; font-size: 13px; }.close-button { color: #8d8e97; background: transparent; font-size: 26px; }.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }.summary-card { min-height: 137px; padding: 22px; display: flex; align-items: flex-start; gap: 14px; position: relative; overflow: hidden; border: 1px solid #302e29; border-radius: 9px; background: linear-gradient(135deg, #24221d, #191a20); }.summary-card > div:nth-child(2) { display: flex; flex-direction: column; gap: 5px; }.summary-card span { color: #9b9aa0; font-size: 12px; }.summary-card strong { color: #f1d16b; font-size: 28px; line-height: 1.1; }.summary-card em { margin-left: 3px; color: #c7a94e; font-size: 13px; font-style: normal; }.summary-card small { color: #73757e; font-size: 10px; }.summary-icon { width: 39px; height: 39px; display: grid; place-items: center; border-radius: 10px; color: #f2ce60; background: rgba(219,177,57,.14); font-size: 21px; }.summary-icon.fire { color: #f07e48; background: rgba(240,126,72,.12); }.summary-icon.trophy { color: #cba4ef; background: rgba(168,85,247,.13); }.summary-card button { position: absolute; right: 18px; bottom: 18px; padding: 6px 9px; color: #e2c258; background: #302c1e; border: 1px solid #65562e; border-radius: 4px; font-size: 10px; }.summary-card button.disabled { color: #76736a; border-color: #48463e; background: transparent; }.summary-progress { position: absolute; left: 22px; right: 22px; bottom: 22px; height: 4px; border-radius: 5px; background: #33343b; }.summary-progress i { display: block; height: 100%; border-radius: inherit; background: #c6a442; transition: width .3s; }
.checkin-card, .task-section { margin-top: 25px; padding: 25px; border: 1px solid #292b33; border-radius: 9px; background: #1a1b21; }.checkin-title, .section-heading { display: flex; justify-content: space-between; align-items: flex-end; }.checkin-title h2, .section-heading h2 { margin: 6px 0 0; font-size: 19px; }.month-label { color: #aaaab0; font-size: 12px; }.checkin-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-top: 24px; }.checkin-day { min-height: 91px; padding: 10px 5px; display: flex; flex-direction: column; align-items: center; gap: 7px; border: 1px solid #2e3038; border-radius: 6px; color: #7e808a; font-size: 10px; }.checkin-day b { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; color: #a6a7ad; background: #292b33; font-size: 12px; }.checkin-day small { color: #777981; font-size: 9px; white-space: nowrap; }.checkin-day.checked { border-color: #64552d; background: rgba(173,139,45,.09); }.checkin-day.checked b { color: #1e1b13; background: #d4b74f; }.checkin-day.checked small { color: #c3a94e; }.checkin-day.today { border-color: #d1ad48; box-shadow: 0 0 0 1px rgba(209,173,72,.25); }.checkin-footer { display: flex; justify-content: space-between; margin-top: 18px; color: #82838c; font-size: 11px; }.section-heading { align-items: center; }.section-heading h2 i { margin-left: 9px; padding: 3px 6px; color: #e6c35e; background: rgba(214,174,55,.12); border-radius: 3px; font-size: 10px; font-style: normal; font-weight: 400; }.category-tabs { display: flex; gap: 7px; }.category-tabs button { padding: 7px 11px; color: #858690; background: transparent; border-radius: 4px; font-size: 11px; }.category-tabs button:hover, .category-tabs button.active { color: #e5c45d; background: #302c20; }.task-list { margin-top: 20px; }.task-row { min-height: 100px; padding: 17px 0; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid #292b32; }.task-row:last-child { border-bottom: 0; }.task-icon { width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; border-radius: 9px; color: #d2b452; background: #2c291f; font-size: 19px; }.task-body { min-width: 210px; flex: 1.7; }.task-title { display: flex; align-items: center; gap: 8px; }.task-title h3 { margin: 0; font-size: 13px; }.task-status { padding: 3px 6px; border-radius: 3px; color: #8b8c94; background: #2a2b31; font-size: 9px; }.task-status.claimable { color: #e8c75c; background: rgba(224,183,57,.15); }.task-status.claimed { color: #6ec89b; background: rgba(76,170,115,.13); }.task-body p { margin: 6px 0 10px; color: #7f8089; font-size: 10px; }.task-progress { display: flex; align-items: center; gap: 10px; }.task-progress > div { width: 110px; height: 4px; overflow: hidden; border-radius: 4px; background: #33343a; }.task-progress i { display: block; height: 100%; border-radius: inherit; background: #b89a3e; }.task-progress span { color: #878891; font-size: 10px; }.task-rewards { min-width: 145px; color: #70727b; font-size: 10px; }.task-rewards > span { display: block; margin-bottom: 6px; }.task-rewards div { color: #b2a36f; }.task-rewards b { margin-left: 5px; color: #dfbd57; font-weight: 400; }.claim-button, .action-button { min-width: 75px; padding: 8px 10px; border-radius: 4px; font-size: 10px; }.claim-button { color: #1e1a0e; background: #dfbd54; }.claim-button:hover { background: #f2d56e; }.claim-button:disabled { opacity: .6; cursor: wait; }.action-button { color: #d0b04d; background: transparent; border: 1px solid #5b4f2d; }.claimed-label { min-width: 75px; color: #697b6e; font-size: 10px; text-align: center; }.empty-state { padding: 38px; color: #7f8089; text-align: center; }
@media (max-width: 850px) { .tasks-page { padding: 28px 20px 45px; }.summary-grid { grid-template-columns: 1fr; }.summary-card { min-height: 115px; }.task-row { flex-wrap: wrap; }.task-body { min-width: calc(100% - 55px); }.task-rewards { margin-left: 55px; }.category-tabs { overflow-x: auto; }.checkin-days { gap: 4px; }.checkin-day { min-height: 80px; } }
@media (max-width: 520px) { .tasks-header h1 { font-size: 25px; }.checkin-card, .task-section { padding: 17px 12px; }.checkin-day small { font-size: 8px; }.section-heading { align-items: flex-start; flex-direction: column; gap: 13px; }.task-rewards { min-width: 120px; }.task-row { gap: 10px; } }
<style scoped>
.tasks-page { height: calc(100vh - 64px); overflow-y: scroll; scrollbar-gutter: stable; scrollbar-color: #6f5a2d #17181d; scrollbar-width: thin; }
.tasks-page::-webkit-scrollbar { width: 8px; }
.tasks-page::-webkit-scrollbar-track { background: #17181d; }
.tasks-page::-webkit-scrollbar-thumb { border-radius: 8px; background: #6f5a2d; }
<style scoped>
.back-button { padding: 8px 13px; border: 1px solid #5e512d; border-radius: 5px; background: #29251a; color: #d8b84e; font-size: 12px; }
.back-button:hover { background: #3a3220; color: #f0d16c; }
</style>
<style scoped>
.gamebox-shell { min-height: 100vh; display: flex; background: #101116; }.gamebox-sidebar { width: 104px; flex: 0 0 104px; position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 20px 10px 15px; background: rgba(13,14,19,.96); border-right: 1px solid #23242c; }.brand { margin: 0; color: #f4c94e; font-size: 12px; letter-spacing: 1px; display: flex; flex-direction: column; align-items: center; gap: 3px; }.brand-mark { font-size: 18px; line-height: 17px; font-style: italic; }.side-nav { width: 100%; margin-top: 28px; display: flex; flex-direction: column; gap: 6px; }.side-item { width: 100%; min-height: 53px; border: 0; border-radius: 10px; color: #777984; background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 11px; cursor: pointer; }.side-item:hover, .side-item.active { color: #f4c94e; background: linear-gradient(145deg, rgba(244,201,78,.2), rgba(244,201,78,.04)); }.side-icon { height: 19px; font-size: 18px; line-height: 19px; }.sidebar-footer { width: 100%; margin-top: auto; }.gamebox-main { min-width: 0; flex: 1; }.topbar { height: 64px; padding: 0 32px; display: flex; align-items: center; gap: 28px; border-bottom: 1px solid #23242c; background: rgba(13,14,19,.62); }.window-actions button { border: 0; color: #858791; background: transparent; font-size: 24px; cursor: pointer; }.user-actions { margin-left: auto; display: flex; align-items: center; gap: 18px; }.message-button, .account-button, .logout-button { border: 0; background: transparent; cursor: pointer; }.message-button { color: #8d8e98; font-size: 22px; }.account-button .avatar { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid #4b4e5a; border-radius: 50%; color: #f2d36b; background: #30323b; }.logout-button { padding: 6px 9px; border: 1px solid #383a44; border-radius: 4px; color: #8f919b; font-size: 10px; }.tasks-page { min-height: calc(100vh - 64px); }.main-area { min-width: 0; flex: 1; } @media (max-width: 680px) { .gamebox-sidebar { width: 70px; flex-basis: 70px; }.topbar { padding: 0 15px; gap: 10px; }.logout-button { display: none; } }
</style>
<style scoped>
.sidebar { gap: 6px; padding: 20px 10px 15px; }
.sidebar { min-height: 100vh; }
.sidebar { position: sticky; top: 0; align-self: flex-start; height: 100vh; max-height: 100vh; overflow-y: auto; box-sizing: border-box; }
.sidebar > .nav-item:last-child { margin-top: auto; }
.brand { margin-bottom: 0; }
.nav-item { width: 100%; min-height: 53px; gap: 4px; font-size: 18px; }
.nav-item.active { color: #f4c94e; background: linear-gradient(145deg, rgba(244, 201, 78, .2), rgba(244, 201, 78, .04)); }
.nav-item.settings { margin-top: auto; }
</style>
<style scoped>
.checkin-days { display: none; }
.tasks-page { display: flex; flex-direction: column; }
.tasks-page > .tasks-header { order: 1; }
.tasks-page > .summary-grid { order: 2; }
.tasks-page > .checkin-card { display: none; }
.tasks-page > .cumulative-rewards { order: 3; }
.tasks-page > .task-section { order: 4; }
.cumulative-rewards { margin-top: 25px; padding: 25px; border: 1px solid #292b33; border-radius: 9px; background: #1a1b21; }.reward-progress { color: #d8b953; font-size: 12px; }.milestone-list { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 20px; }.milestone { min-height: 120px; padding: 14px 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; border: 1px solid #30323a; border-radius: 8px; color: #777984; background: #202128; text-align: center; }.milestone-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; color: #9a9ba3; background: #30323a; font-size: 18px; }.milestone strong { color: #b9bac2; font-size: 13px; }.milestone span, .milestone small { font-size: 10px; }.milestone.completed { border-color: #6a592d; background: rgba(173,139,45,.1); }.milestone.completed .milestone-icon { color: #211c0e; background: #d4b74f; }.milestone.completed strong, .milestone.completed small { color: #e0c35b; }
@media (max-width: 700px) { .milestone-list { grid-template-columns: repeat(2, 1fr); } }
</style>
<style scoped>
.checkin-status { margin: 7px 0 0; color: #8c8d96; font-size: 11px; }
.checkin-footer { align-items: center; }
.checkin-action { padding: 8px 14px; border: 1px solid #6a592d; border-radius: 5px; color: #1e1a0e; background: #dfbd54; font-size: 11px; }
.checkin-action:hover { background: #f2d56e; }
.checkin-action.done { color: #89877e; border-color: #48463e; background: #292a2e; cursor: default; }
</style>
