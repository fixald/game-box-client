<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getAccountStats, getCurrentAccountInfo, getDownloads, getFavoriteGames, getMessages, getRecentGames } from "../../api/account";
import { clearSession, getAccountProfile, getCurrentAccount, saveAccountProfile } from "../../utils/auth";

const profile = ref(getAccountProfile());
const account = ref(profile.value?.account || getCurrentAccount());
const activeTab = ref("overview");
const loading = ref(true);
const error = ref("");
const stats = ref({ points: 0, favoriteGameCount: 0, continuousCheckinDays: 0, downloadCount: 0 });
const recentGames = ref<any[]>([]);
const favorites = ref<any[]>([]);
const downloads = ref<any[]>([]);
const messages = ref<any[]>([]);
const unreadCount = ref(0);
const tabs = [
  { key: "overview", label: "账号概览" }, { key: "games", label: "我的游戏" },
  { key: "downloads", label: "下载记录" }, { key: "security", label: "账号安全" },
  { key: "messages", label: "消息中心" }, { key: "settings", label: "其他设置" },
];
const formatDate = (value?: string) => value ? new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";
const notify = (value: string) => window.alert(value);
async function loadAccount() {
  loading.value = true; error.value = "";
  try {
    const [accountResult, summary, recent, favorite, download, message] = await Promise.all([
      getCurrentAccountInfo(), getAccountStats(), getRecentGames(), getFavoriteGames(), getDownloads(), getMessages(),
    ]);
    if (accountResult.user) {
      saveAccountProfile(accountResult.user);
      profile.value = accountResult.user;
      account.value = accountResult.user.account || accountResult.user.nickname || account.value;
    }
    stats.value = summary.stats;
    recentGames.value = recent.games;
    favorites.value = favorite.list;
    downloads.value = download.list;
    messages.value = message.list;
    unreadCount.value = message.unreadCount;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "个人中心数据加载失败";
  } finally { loading.value = false; }
}
function goHome() { window.location.hash = ""; }
function logout() { clearSession(); window.location.hash = "#/login"; }
onMounted(loadAccount);
</script>

<template>
  <div class="account-page">
    <header><button class="back" @click="goHome">← 返回首页</button><div><small>USER CENTER</small><h1>个人中心</h1></div><button class="message" @click="activeTab = 'messages'">♢<i v-if="unreadCount">{{ unreadCount }}</i></button></header>
    <p v-if="error" class="error">{{ error }}</p>
    <section class="profile"><img v-if="profile?.avatarUrl" class="avatar avatar-image" :src="profile.avatarUrl" alt="用户头像" /><div v-else class="avatar">{{ (profile?.nickname || account).slice(0, 1).toUpperCase() }}</div><div><h2>{{ profile?.nickname || account }} <b v-if="(profile?.vip?.level || 0) > 0">SVIP{{ profile?.vip?.level }}</b></h2><p>{{ account }} · 账号已安全登录</p><button @click="activeTab = 'security'">账号安全</button></div></section>
    <nav><button v-for="tab in tabs" :key="tab.key" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">{{ tab.label }}<b v-if="tab.key === 'messages' && unreadCount">{{ unreadCount }}</b></button></nav>
    <main v-if="loading" class="empty">正在加载个人中心…</main>
    <main v-else-if="activeTab === 'overview'">
      <section class="stats"><article>积分<strong>{{ stats.points.toLocaleString() }}</strong></article><article>收藏游戏<strong>{{ stats.favoriteGameCount }}</strong></article><article>连续签到<strong>{{ stats.continuousCheckinDays }} 天</strong></article><article>下载记录<strong>{{ stats.downloadCount }}</strong></article></section>
      <section class="panel"><h2>最近玩过</h2><div v-if="!recentGames.length" class="empty">暂无最近游戏</div><div v-for="game in recentGames" :key="game.id" class="row"><span>{{ game.name.slice(0, 1) }}</span><div><strong>{{ game.name }}</strong><small>{{ game.serverName || "暂无区服" }}</small></div><time>{{ formatDate(game.lastPlayedAt) }}</time></div></section>
    </main>
    <main v-else class="panel">
      <h2>{{ tabs.find((tab) => tab.key === activeTab)?.label }}</h2>
      <template v-if="activeTab === 'games'"><div v-if="!favorites.length" class="empty">暂无收藏游戏</div><div v-for="game in favorites" :key="game.gameId" class="row"><span>{{ game.gameName.slice(0, 1) }}</span><div><strong>{{ game.gameName }}</strong><small>{{ game.serverName || "暂无区服" }}</small></div><time>{{ formatDate(game.lastPlayedAt) }}</time></div></template>
      <template v-else-if="activeTab === 'downloads'"><div v-if="!downloads.length" class="empty">暂无下载记录</div><div v-for="item in downloads" :key="item.id" class="row"><span>↓</span><div><strong>{{ item.gameName }}</strong><small>版本 {{ item.version }} · {{ item.size }}</small></div><em>{{ item.status }}</em></div></template>
      <template v-else-if="activeTab === 'messages'"><div v-if="!messages.length" class="empty">暂无消息</div><div v-for="item in messages" :key="item.id" class="row"><span>♢</span><div><strong>{{ item.title }}</strong><small>{{ item.content }}</small></div><em>{{ item.read ? "已读" : "未读" }}</em></div></template>
      <template v-else><div v-for="item in ['修改密码', '绑定手机号', '绑定邮箱', '登录设备', '登录记录', '实名认证']" :key="item" class="setting" @click="notify(`${item}功能即将开放`)">{{ item }} →</div></template>
    </main>
    <footer><button @click="logout">退出登录</button><span>账号安全由 game盒子保护</span></footer>
  </div>
</template>

<style scoped>
:global(*){box-sizing:border-box}:global(body){margin:0;background:#111217;color:#f5f1e9;font-family:Inter,"PingFang SC","Microsoft YaHei",sans-serif}button{font:inherit;cursor:pointer;border:0;background:transparent;color:inherit}.account-page{max-width:1180px;min-height:100vh;margin:auto;padding:32px 42px;background:#111217}header{display:flex;align-items:center;justify-content:space-between;margin-bottom:25px}header>div{text-align:center}header small{color:#c7a248;letter-spacing:2px;font-size:10px}h1{margin:5px 0;font-size:24px}.back,.message{color:#9a9ba4}.message{position:relative;font-size:21px}.message i,nav b{margin-left:5px;border-radius:8px;background:#d85e65;color:white;padding:2px 5px;font-size:9px;font-style:normal}.profile{display:flex;align-items:center;gap:20px;padding:26px 30px;border:1px solid #343038;border-radius:10px;background:linear-gradient(105deg,#25231e,#1b1c23 65%)}.avatar{width:70px;height:70px;display:grid;place-items:center;border:2px solid #c8a43e;border-radius:50%;background:#35333a;color:#edc957;font-size:25px}.profile h2{margin:0}.profile h2 b{padding:4px 7px;border-radius:3px;background:#503c1a;color:#e7c659;font-size:10px}.profile p,small{display:block;color:#858790;font-size:11px}.profile button,footer button{color:#d7b94e}nav{display:flex;gap:25px;margin:28px 0 20px;border-bottom:1px solid #2b2d34}nav button{padding:0 0 14px;color:#85868f;font-size:12px}nav button.active{color:#e6c653;border-bottom:2px solid #d7b64f}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.stats article,.panel{padding:20px;border:1px solid #2e3038;border-radius:8px;background:#1a1b21}.stats strong{display:block;margin-top:10px;color:#f0ce64;font-size:21px}.panel{margin-top:16px}.panel h2{margin-top:0}.row{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #292b32}.row>span{width:36px;height:36px;display:grid;place-items:center;border-radius:8px;background:#30323b;color:#f1d376;font-size:18px}.row>div{flex:1}.row time,.row em{color:#85868e;font-size:10px;font-style:normal}.setting{padding:16px 5px;border-bottom:1px solid #292b32;color:#c4c5ca;cursor:pointer}.setting:hover{color:#e6c653}.empty{text-align:center;padding:35px;color:#85868e}.error{color:#df7779}footer{display:flex;justify-content:space-between;margin-top:23px;color:#6f717a;font-size:10px}footer button{color:#c87579}@media(max-width:850px){.account-page{padding:25px 18px}.profile{align-items:flex-start}.stats{grid-template-columns:repeat(2,1fr)}nav{gap:15px;overflow:auto}}@media(max-width:520px){.account-page{padding:20px 14px}.profile{padding:20px}.stats{grid-template-columns:1fr 1fr}.row time{display:none}}
</style>
