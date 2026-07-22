<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getGames, normalizeGameList, type ClientGame } from "../../api/games";

const games = ref<ClientGame[]>([]);
const loading = ref(false);
const error = ref("");
const searchText = ref("");
const activeNav = ref("游戏");
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

onMounted(loadGames);
</script>

<template>
  <div class="app-shell"><aside class="sidebar"><div class="brand">game<br /><span>盒子</span></div><button class="nav-item" :class="{ active: activeNav === '首页' }" @click="navigate('首页')">⌂<span>首页</span></button><button class="nav-item" :class="{ active: activeNav === '直播' }" @click="navigate('直播')">▶<span>直播</span></button><button class="nav-item" :class="{ active: activeNav === '社区' }" @click="navigate('社区')">◈<span>社区</span></button><button class="nav-item" :class="{ active: activeNav === '美女' }" @click="navigate('美女')">♡<span>美女</span></button><button class="nav-item" :class="{ active: activeNav === '资讯' }" @click="navigate('资讯')">◌<span>资讯</span></button><button class="nav-item active" @click="navigate('游戏')">◉<span>游戏</span></button><button class="nav-item" :class="{ active: activeNav === '任务' }" @click="navigate('任务')">✓<span>任务</span></button><button class="nav-item" :class="{ active: activeNav === '公会' }" @click="navigate('公会')">♛<span>公会</span></button><button class="nav-item" :class="{ active: activeNav === 'SVIP' }" @click="navigate('SVIP')">S<span>SVIP</span></button><button class="nav-item" :class="{ active: activeNav === '邀请' }" @click="navigate('邀请')">↗<span>邀请</span></button><button class="nav-item" @click="navigate('设置')">⚙<span>设置</span></button></aside><section class="main-area"><header class="topbar"><button class="refresh" @click="loadGames">↻</button><div class="search-box">⌕<input v-model="searchText" placeholder="搜索游戏" /><kbd>⌘ K</kbd></div><button class="home-link" @click="goHome">返回首页</button></header>
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
.sidebar { gap: 6px; padding: 20px 10px 15px; }
.sidebar { min-height: 100vh; }
.sidebar { position: sticky; top: 0; align-self: flex-start; height: 100vh; max-height: 100vh; overflow-y: auto; box-sizing: border-box; }
.sidebar > .nav-item:last-child { margin-top: auto; }
.brand { margin-bottom: 0; }
.nav-item { width: 100%; min-height: 53px; gap: 4px; font-size: 18px; }
.nav-item.active { color: #f4c94e; background: linear-gradient(145deg, rgba(244, 201, 78, .2), rgba(244, 201, 78, .04)); }
.nav-item.settings { margin-top: auto; }
</style>
