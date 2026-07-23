<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getGames, normalizeGameList, type ClientGame } from "../../api/games";
import { clearSession, getCurrentAccount } from "../../utils/auth";

const games = ref<ClientGame[]>([]);
const loading = ref(false);
const error = ref("");
const searchText = ref("");
const activeNav = ref("游戏");
const currentAccount = ref(getCurrentAccount());
const navItems = [
  { icon: "⌂", label: "首页" }, { icon: "▶", label: "直播" },
  { icon: "◉", label: "游戏" }, { icon: "✓", label: "任务" }, { icon: "S", label: "SVIP" },
];
const filteredGames = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  if (!keyword) return games.value;
  return games.value.filter((game) => `${game.name}${game.category ?? ""}${game.gameType ?? ""}${game.description ?? ""}`.toLowerCase().includes(keyword));
});
const accents = ["#2a4b8d", "#713c24", "#364b32", "#56357d"];

async function loadGames() {
  loading.value = true;
  error.value = "";
  try {
    const response = await getGames(1, 100);
    games.value = normalizeGameList(response);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "游戏列表加载失败";
  } finally {
    loading.value = false;
  }
}

function openGame(game: ClientGame) {
  window.location.hash = `#/games/${encodeURIComponent(String(game.id))}`;
}

function goHome() {
  window.location.hash = "";
}

function goGames() { window.location.hash = "#/games"; }
function goTasks() { window.location.hash = "#/tasks"; }
function navigate(label: string) {
  activeNav.value = label;
  if (label === "首页") return goHome();
  if (label === "游戏") return goGames();
  if (label === "任务") return goTasks();
  if (label === "SVIP") return void (window.location.hash = "#/vip");
  window.alert(`「${label}」页面即将开放`);
}
function goAccount() { window.location.hash = "#/account"; }
function logout() { clearSession(); window.location.hash = "#/login"; }

onMounted(loadGames);
</script>

<template>
  <div class="gamebox-shell"><aside class="gamebox-sidebar"><div class="brand"><span class="brand-mark">game</span><span>盒子</span></div><nav class="side-nav" aria-label="主导航"><button v-for="item in navItems" :key="item.label" class="side-item" :class="{ active: activeNav === item.label }" @click="navigate(item.label)"><span class="side-icon">{{ item.icon }}</span><span>{{ item.label }}</span></button></nav><div class="sidebar-footer"><button class="side-item" @click="navigate('设置')"><span class="side-icon">⚙</span><span>设置</span></button></div></aside><section class="gamebox-main"><header class="topbar"><div class="window-actions"><button aria-label="刷新" @click="loadGames">↻</button></div><div class="search-wrap"><div class="search-box">⌕<input v-model="searchText" placeholder="搜索游戏" /><kbd>⌘ K</kbd></div></div><div class="user-actions"><button class="message-button" aria-label="消息">♢</button><button class="account-button" aria-label="个人中心" @click="goAccount"><span class="avatar">{{ currentAccount.slice(0, 1).toUpperCase() }}</span></button><button class="logout-button" @click="logout">退出</button></div></header>
  <main class="games-page">
    <header class="games-header">
      <div><span class="eyebrow">GAME LIBRARY</span><h1>全部游戏</h1><p>浏览平台全部已上线游戏，选择游戏查看详情和区服。</p></div>
    </header>
    <div v-if="loading" class="state">正在加载游戏列表…</div>
    <div v-else-if="error" class="state"><span>{{ error }}</span><button @click="loadGames">重试</button></div>
    <div v-else-if="!games.length" class="state">暂无已上线游戏</div>
    <section v-else class="games-grid">
      <article v-for="(game, index) in filteredGames" :key="game.id" class="game-card" @click="openGame(game)">
        <div class="game-cover" :style="{ '--game-accent': accents[index % accents.length] }">
          <img v-if="game.iconUrl" :src="game.iconUrl" :alt="game.name" />
          <span v-else class="game-emblem">{{ game.name.slice(0, 1) }}</span>
          <small>{{ game.category || game.gameType || "热门游戏" }}</small>
        </div>
        <div class="game-info"><h2>{{ game.name }}</h2><p>{{ game.description || "精彩玩法，等你来体验" }}</p><button @click.stop="openGame(game)">查看详情 →</button></div>
      </article>
    </section>
  </main></section></div>
</template>

<style scoped>
.app-shell { min-height: 100vh; display: flex; color: #f4f1eb; background: #101116; }.sidebar { width: 104px; flex: 0 0 104px; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px 10px; background: #0d0e13; border-right: 1px solid #23242c; }.brand { margin-bottom: 22px; color: #f4c94e; font-weight: 800; font-size: 14px; text-align: center; line-height: 1.1; }.brand span { font-size: 11px; }.nav-item { width: 84px; min-height: 58px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; border: 0; border-radius: 9px; color: #777984; background: transparent; cursor: pointer; font-size: 18px; }.nav-item span { font-size: 11px; }.nav-item:hover, .nav-item .active { color: #f4c94e; }.main-area { min-width: 0; flex: 1; }.topbar { height: 64px; display: flex; align-items: center; gap: 24px; padding: 0 32px; border-bottom: 1px solid #23242c; background: rgba(13,14,19,.62); }.refresh, .home-link { border: 0; color: #a6a7b0; background: transparent; cursor: pointer; }.refresh { font-size: 23px; }.home-link { margin-left: auto; font-size: 12px; }.search-box { width: min(420px, 50vw); height: 34px; display: flex; align-items: center; gap: 8px; padding: 0 10px; border: 1px solid #2d2e37; border-radius: 8px; color: #73757f; background: #191a20; }.search-box input { width: 100%; border: 0; outline: 0; color: #eee; background: transparent; font-size: 12px; }.search-box kbd { color: #5d606c; font-size: 10px; white-space: nowrap; }.games-page { min-height: calc(100vh - 64px); padding: 44px 6vw; color: #f4f1eb; background: radial-gradient(circle at 70% 0%, #20202a 0, #111217 42%, #0c0d11 100%); }
.games-header { max-width: 1280px; margin: 0 auto 30px; }.back-button { padding: 8px 12px; margin-bottom: 28px; border: 1px solid #393a44; border-radius: 5px; color: #b8b9c1; background: transparent; cursor: pointer; }.eyebrow { color: #d6ae48; font-size: 11px; letter-spacing: 2px; }.games-header h1 { margin: 8px 0; font-size: 32px; }.games-header p { margin: 0; color: #8e909a; font-size: 13px; }
.games-grid { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }.game-card { overflow: hidden; display: flex; min-height: 140px; border: 1px solid #282a33; border-radius: 8px; background: #1a1b22; cursor: pointer; transition: .2s; }.game-card:hover { border-color: #62552d; transform: translateY(-2px); }.game-cover { flex: 0 0 125px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--game-accent), white 20%), transparent 32%), linear-gradient(135deg, var(--game-accent), #12141b); }.game-cover img { width: 100%; height: 100%; object-fit: cover; }.game-emblem { color: #f7dd83; font-size: 42px; font-weight: 900; text-shadow: 2px 2px 0 #51290d; }.game-cover small { color: #d1d2d5; font-size: 10px; }.game-info { min-width: 0; padding: 20px 16px 14px; flex: 1; }.game-info h2 { margin: 0 0 9px; font-size: 16px; }.game-info p { overflow: hidden; display: -webkit-box; margin: 0; color: #92939c; font-size: 11px; line-height: 1.6; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }.game-info button, .state button { margin-top: 16px; padding: 6px 10px; border: 1px solid #62552d; border-radius: 4px; color: #dfbb4d; background: transparent; cursor: pointer; font-size: 11px; }.state { max-width: 1280px; min-height: 130px; margin: 40px auto; display: flex; align-items: center; justify-content: center; gap: 12px; border: 1px dashed #343641; border-radius: 8px; color: #888a94; font-size: 13px; }
@media (max-width: 1000px) { .games-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } } @media (max-width: 640px) { .sidebar { width: 70px; flex-basis: 70px; }.nav-item { width: 50px; }.games-page { padding: 28px 16px; }.games-grid { grid-template-columns: 1fr; }.topbar { padding: 0 14px; gap: 10px; }.search-box { width: 100%; }.home-link { display: none; } }
</style>
<style scoped>
.gamebox-shell { min-height: 100vh; display: block; color: #f4f1eb; background: #101116; }
.gamebox-sidebar { position: fixed; z-index: 20; inset: 0 auto 0 0; width: 104px; display: flex; flex-direction: column; align-items: center; padding: 20px 10px 15px; background: rgba(13,14,19,.98); border-right: 1px solid #23242c; }
.brand { margin: 0; color: #f4c94e; font-weight: 800; font-size: 12px; line-height: normal; letter-spacing: 1px; white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 3px; }.brand > .brand-mark { display: block; font-size: 18px !important; line-height: 17px !important; font-style: italic; }.brand > span:not(.brand-mark) { font-size: 12px; line-height: normal; }
.side-nav { width: 100%; margin-top: 28px; display: flex; flex-direction: column; gap: 6px; }.side-item { position: relative; width: 100%; min-height: 53px; border: 0; border-radius: 10px; color: #777984; background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 11px; cursor: pointer; }.side-item:hover, .side-item.active { color: #f4c94e; background: linear-gradient(145deg, rgba(244,201,78,.2), rgba(244,201,78,.04)); }.side-icon { height: 19px; font-size: 18px; line-height: 19px; }.sidebar-footer { width: 100%; margin-top: auto; }.gamebox-main { min-width: 0; margin-left: 104px; }.topbar { position: fixed; z-index: 10; top: 0; right: 0; left: 104px; height: 64px; padding: 0 32px; display: flex; align-items: center; gap: 28px; border-bottom: 1px solid #23242c; background: rgba(13,14,19,.96); }.window-actions { display: flex; gap: 14px; }.window-actions button { border: 0; color: #858791; background: transparent; font-size: 24px; cursor: pointer; }.search-wrap { width: min(360px, 35vw); }.search-box { width: 100%; }.user-actions { margin-left: auto; display: flex; align-items: center; gap: 18px; }.message-button { border: 0; color: #8d8e98; background: transparent; font-size: 22px; cursor: pointer; }.account-button { border: 0; background: transparent; cursor: pointer; }.account-button .avatar { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid #4b4e5a; border-radius: 50%; color: #f2d36b; background: #30323b; }.logout-button { padding: 6px 9px; border: 1px solid #383a44; border-radius: 4px; color: #8f919b; background: transparent; font-size: 10px; cursor: pointer; }.games-page { padding-top: 108px; }
@media (max-width: 680px) { .gamebox-sidebar { width: 70px; }.gamebox-main { margin-left: 70px; }.topbar { left: 70px; padding: 0 15px; gap: 10px; }.side-item { font-size: 9px; }.search-wrap { width: 100%; }.logout-button { display: none; } }
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
