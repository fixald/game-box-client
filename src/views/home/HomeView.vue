<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Hls from "hls.js";
import type { HomeChannel, HomeFeed, NewServer, RecommendedGame } from "../../types/home";
import { getCurrentAccountInfo } from "../../api/account";
import { clearSession, getCurrentAccount } from "../../utils/auth";
import { getSearchHistory, popularSearches, sanitizeSearchQuery } from "../../utils/search";
import { getSuggestions } from "../../api/search";
import { getRecommendedServers, normalizeServerList } from "../../api/servers";
import { getPopularGames, normalizeGameList } from "../../api/games";
import { getHomeBanners, normalizeHomeBanners } from "../../api/home";
import { getLiveRooms, normalizeLiveRooms } from "../../api/live";
import LiveView from "../live/LiveView.vue";

const channels: Array<{ key: HomeChannel; label: string }> = [
  { key: "follow", label: "关注" },
  { key: "recommend", label: "推荐" },
  { key: "new-server", label: "新服" },
];

const navItems = [
  { icon: "⌂", label: "首页" },
  { icon: "▶", label: "直播" },
  { icon: "◉", label: "游戏" },
  { icon: "✓", label: "任务", badge: true },
  { icon: "S", label: "SVIP" },
];

const heroVideoRef = ref<HTMLVideoElement | null>(null);
let heroHls: Hls | null = null;
const heroStreamReady = ref(false);
const heroStreamError = ref(false);

function destroyHeroHls() {
  if (heroHls) {
    try { heroHls.destroy(); } catch { /* ignore */ }
    heroHls = null;
  }
}

function initHeroHls() {
  destroyHeroHls();
  heroStreamReady.value = false;
  heroStreamError.value = false;
  const room = feed.value.liveRooms[0];
  const video = heroVideoRef.value;
  const roomUrl = room?.roomUrl;
  if (!video || !roomUrl || !room) return;
  if (room.status !== "live") return;
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = roomUrl;
    video.addEventListener("loadedmetadata", () => { heroStreamReady.value = true; void video.play().catch(() => { /* autoplay blocked */ }); }, { once: true });
    video.addEventListener("error", () => { heroStreamError.value = true; }, { once: true });
    return;
  }
  if (!Hls.isSupported()) { heroStreamError.value = true; return; }
  heroHls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 60 });
  heroHls.loadSource(roomUrl);
  heroHls.attachMedia(video);
  heroHls.on(Hls.Events.MANIFEST_PARSED, () => {
    heroStreamReady.value = true;
    void video.play().catch(() => { /* autoplay blocked */ });
  });
  heroHls.on(Hls.Events.ERROR, (_event, data) => {
    if (data.fatal) heroStreamError.value = true;
  });
}

const heroHasStream = computed(() => !!feed.value.liveRooms[0]?.roomUrl && feed.value.liveRooms[0]?.status === "live");

const feed = ref<HomeFeed>({
  requestId: "mock_home_001",
  taskUnreadCount: 3,
  messageUnreadCount: 2,
  liveRooms: [
    { id: "live-1", title: "冰雪传奇 · 新区冲榜，首充送神装", streamerName: "小眼睛", viewers: 1280, gameName: "冰雪传奇", serverName: "火龙一区", status: "live", accent: "#4d7cff" },
    { id: "live-2", title: "极品装备爆不停，今晚冲击全服第一", streamerName: "战神阿杰", viewers: 864, gameName: "复古传奇", serverName: "雷霆二服", status: "live", accent: "#a855f7" },
  ],
  newServers: [
    { id: "server-1", gameId: "game-1", gameName: "冰雪传奇", serverName: "龙腾天下·一区", openAt: "2026-07-19T20:00:00+08:00", status: "opening_soon", onlineLabel: "预约中", tags: ["首充双倍", "上线送VIP"] },
    { id: "server-2", gameId: "game-2", gameName: "复古传奇", serverName: "沙城争霸·108服", openAt: "2026-07-19T18:30:00+08:00", status: "hot", onlineLabel: "火爆", tags: ["新服", "万人同屏"] },
    { id: "server-3", gameId: "game-3", gameName: "传奇世界", serverName: "王者归来·三服", openAt: "2026-07-20T12:00:00+08:00", status: "opening_soon", onlineLabel: "明日开启", tags: ["预约有礼"] },
  ],
  games: [
    { id: "game-1", name: "冰雪传奇", subtitle: "打金爆神装，自由交易", genre: "冰雪版本", playersLabel: "12.8万人在玩", accent: "#2a4b8d", isNew: true },
    { id: "game-2", name: "复古传奇", subtitle: "经典三职业，热血攻沙", genre: "复古版本", playersLabel: "8.6万人在玩", accent: "#713c24" },
    { id: "game-3", name: "传奇世界", subtitle: "万人国战，兄弟集结", genre: "MMORPG", playersLabel: "5.2万人在玩", accent: "#364b32" },
  ],
  banners: [
    { id: "banner-1", eyebrow: "新区福利", title: "龙腾天下 · 今晚 20:00 开服", description: "预约新区，领取开服礼包与首充双倍奖励", actionLabel: "立即预约", accent: "#7c3aed", expiresAt: "2026-07-19T20:00:00+08:00" },
    { id: "banner-2", eyebrow: "SVIP 专享", title: "登录即领新手礼包", description: "装备、元宝、VIP经验一次领取", actionLabel: "去领取", accent: "#b45309" },
  ],
});

const activeChannel = ref<HomeChannel>("recommend");
const serversLoading = ref(false);
const serversError = ref("");
const gamesLoading = ref(false);
const gamesError = ref("");
const activeNav = ref("首页");
const searchText = ref("");
const searchInput = ref<HTMLInputElement | null>(null);
const searchFocused = ref(false);
const searchHistory = ref(getSearchHistory());
const searchSuggestions = ref<string[]>([]);
const suggestionsLoading = ref(false);
let suggestionTimer = 0;
let suggestionRequest = 0;
const suggestionController = ref<AbortController | null>(null);
const bannerIndex = ref(0);
const toast = ref("");
const currentAccount = ref(getCurrentAccount());
const accountLoading = ref(false);
const now = ref(Date.now());

const showLiveRoom = ref(false);
const selectedRoom = ref<typeof feed.value.liveRooms[0] | null>(null);
const liveViewRef = ref<InstanceType<typeof import("../live/LiveView.vue").default> | null>(null);
const timer = window.setInterval(() => { now.value = Date.now(); }, 1000);

const currentBanner = computed(() => feed.value.banners[bannerIndex.value]);
const filteredGames = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  if (!keyword) return feed.value.games;
  return feed.value.games.filter((game) => `${game.name}${game.subtitle}${game.genre}`.toLowerCase().includes(keyword));
});

function notify(message: string) {
  toast.value = message;
  window.setTimeout(() => { toast.value = ""; }, 2200);
}

function submitSearch(value = searchText.value) {
  const keyword = sanitizeSearchQuery(value);
  if (!keyword) return notify("请输入有效的搜索内容");
  searchText.value = keyword;
  searchFocused.value = false;
  window.location.hash = `#/search?q=${encodeURIComponent(keyword)}`;
}
function submitSearchForm() { submitSearch(); }

function handleSearchShortcut(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  const isEditable = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
  const hasPlatformModifier = navigator.platform.toLowerCase().includes("mac") ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
  if (event.defaultPrevented || event.repeat || isEditable || !hasPlatformModifier || event.key.toLowerCase() !== "k") return;
  event.preventDefault();
  searchFocused.value = true;
  searchInput.value?.focus();
  searchInput.value?.select();
}

function refreshSuggestions(value: string) {
  window.clearTimeout(suggestionTimer);
  suggestionController.value?.abort();
  const keyword = sanitizeSearchQuery(value);
  if (keyword.length === 0) {
    searchSuggestions.value = [...searchHistory.value, ...popularSearches].filter((item, index, list) => list.indexOf(item) === index).slice(0, 6);
    suggestionsLoading.value = false;
    return;
  }
  if (keyword.length < 2) { searchSuggestions.value = []; suggestionsLoading.value = false; return; }
  const requestId = ++suggestionRequest;
  suggestionsLoading.value = true;
  suggestionTimer = window.setTimeout(async () => {
    const controller = new AbortController();
    suggestionController.value = controller;
    try {
      const response = await getSuggestions(keyword, 6, controller.signal);
      if (requestId === suggestionRequest) searchSuggestions.value = response.suggestions.map((item) => item.text).slice(0, 6);
    } catch (error) { if ((error as DOMException).name !== "AbortError") searchSuggestions.value = []; }
    finally { if (requestId === suggestionRequest) suggestionsLoading.value = false; }
  }, 300);
}

watch(searchText, refreshSuggestions, { immediate: true });

function formatCountdown(server: NewServer) {
  const diff = Math.max(0, new Date(server.openAt).getTime() - now.value);
  if (diff === 0) return "已开启";
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  return `${hours}时 ${minutes.toString().padStart(2, "0")}分 ${seconds.toString().padStart(2, "0")}秒`;
}

function serverStatusLabel(status: NewServer["status"]) {
  const labels: Record<NewServer["status"], string> = {
    opening_soon: "预约中",
    normal: "已开启",
    hot: "火爆",
    full: "已满",
    maintenance: "维护中",
  };
  return labels[status];
}

async function loadRecommendedServers(pageSizeOrEvent: number | Event = 6) {
  const pageSize = typeof pageSizeOrEvent === "number" ? pageSizeOrEvent : 6;
  serversLoading.value = true;
  serversError.value = "";
  try {
    const response = await getRecommendedServers(1, pageSize);
    feed.value.newServers = normalizeServerList(response).map((server) => ({
      id: String(server.id), gameId: String(server.gameId), gameName: server.gameName ?? "游戏区服", imageUrl: server.imageUrl ?? server.iconUrl,
      serverName: server.name, openAt: server.openTime,
      status: server.status === "preview" ? "opening_soon" : server.status === "closed" ? "maintenance" : server.status,
      onlineLabel: serverStatusLabel(server.status === "preview" ? "opening_soon" : server.status === "closed" ? "maintenance" : server.status),
      tags: server.tags ?? (server.isRecommended ? ["推荐区服"] : []),
    }));
  } catch (error) {
    serversError.value = error instanceof Error ? error.message : "新服数据加载失败";
  } finally { serversLoading.value = false; }
}

function enterServer(server: NewServer) {
  window.location.hash = `#/games/${encodeURIComponent(server.gameId)}/servers?serverId=${encodeURIComponent(server.id)}`;
}

function openNewServerChannel() {
  activeChannel.value = "new-server";
  void loadRecommendedServers(20);
}

async function loadPopularGames() {
  gamesLoading.value = true;
  gamesError.value = "";
  try {
    const response = await getPopularGames(1, 6);
    feed.value.games = normalizeGameList(response).map((game, index) => ({
      id: String(game.id), name: game.name, subtitle: game.description ?? "热门游戏，等你来战",
      genre: game.category ?? game.gameType ?? "热门游戏", playersLabel: "热门推荐",
      accent: ["#2a4b8d", "#713c24", "#364b32", "#56357d"][index % 4], iconUrl: game.iconUrl,
      isNew: index === 0,
    }));
  } catch (error) {
    gamesError.value = error instanceof Error ? error.message : "热门游戏加载失败";
  } finally { gamesLoading.value = false; }
}

async function loadHomeBanners() {
  try {
    const response = await getHomeBanners();
    const banners = normalizeHomeBanners(response);
    if (banners.length) feed.value.banners = banners;
  } catch {
    // Banner 接口不可用时保留页面占位数据，避免首页布局塌陷。
  }
}

async function loadLiveRooms() {
  try {
    const response = await getLiveRooms(1, 6);
    feed.value.liveRooms = normalizeLiveRooms(response);
    await nextTick();
    initHeroHls();
  } catch {
    // 直播接口不可用时保留当前内容，等待服务端接口上线。
  }
}

async function loadHomeAccount() {
  try {
    const response = await getCurrentAccountInfo();
    const source = response.user ?? response;
    if (typeof source.taskUnreadCount === "number") feed.value.taskUnreadCount = source.taskUnreadCount;
    if (typeof source.messageUnreadCount === "number") feed.value.messageUnreadCount = source.messageUnreadCount;
  } catch {
    // App 层已负责会话校验；首页只保留当前展示状态。
  }
}

function enterGame(game: RecommendedGame) {
  window.location.hash = `#/games/${encodeURIComponent(game.id)}`;
}

function enterLiveRoom(room: typeof feed.value.liveRooms[0]) {
  selectedRoom.value = { ...room };
  showLiveRoom.value = true;
  activeNav.value = "直播";
}

function switchBanner(step: number) {
  const count = feed.value.banners.length;
  bannerIndex.value = (bannerIndex.value + step + count) % count;
}

function enterSection(label: string) {
  activeNav.value = label;
  if (label === "任务") {
    window.location.hash = "#/tasks";
    return;
  }
  if (label === "游戏") {
    window.location.hash = "#/games";
    return;
  }
  if (label === "SVIP") {
    window.location.hash = "#/vip";
    return;
  }
  if (label !== "首页") notify(`「${label}」页面即将开放`);
}

function logout() {
  clearSession();
  window.location.hash = "#/login";
}

function exitLiveRoom() {
  showLiveRoom.value = false;
  selectedRoom.value = null;
}

async function goAccount() {
  if (accountLoading.value) return;
  accountLoading.value = true;
  try {
    const result = await getCurrentAccountInfo();
    if (result.user?.account) currentAccount.value = result.user.account;
    window.location.hash = "#/account";
  } catch (error) {
    notify(error instanceof Error ? error.message : "获取账户信息失败，请稍后重试");
  } finally {
    accountLoading.value = false;
  }
}

onBeforeUnmount(() => { window.clearInterval(timer); window.clearTimeout(suggestionTimer); suggestionController.value?.abort(); destroyHeroHls(); });
onMounted(() => window.addEventListener("keydown", handleSearchShortcut));
onMounted(loadRecommendedServers);
onMounted(loadPopularGames);
onMounted(loadHomeBanners);
onMounted(loadHomeAccount);
onMounted(loadLiveRooms);
onMounted(async () => { await nextTick(); initHeroHls(); });
watch(activeChannel, (channel) => {
  if (channel === "new-server") void loadRecommendedServers(20);
});
watch(activeNav, (label) => {
  if (label === "游戏" && window.location.hash !== "#/games") window.location.hash = "#/games";
});
onBeforeUnmount(() => window.removeEventListener("keydown", handleSearchShortcut));
</script>

<template>
  <div class="gamebox-shell">
    <aside class="gamebox-sidebar">
      <div class="brand"><span class="brand-mark">game</span><span>盒子</span></div>
      <nav class="side-nav" aria-label="主导航">
        <button v-for="item in navItems" :key="item.label" class="side-item" :class="{ active: activeNav === item.label }" @click="enterSection(item.label)">
          <span class="side-icon">{{ item.icon }}</span><span>{{ item.label }}</span><i v-if="item.badge && feed.taskUnreadCount" class="nav-badge">{{ feed.taskUnreadCount }}</i>
        </button>
      </nav>
      <div class="sidebar-footer"><button class="side-item" @click="enterSection('设置')"><span class="side-icon">⚙</span><span>设置</span></button></div>
    </aside>

    <section class="gamebox-main">
      <header class="topbar">
        <div class="window-actions"><button aria-label="刷新" @click="notify('内容已刷新')">↻</button></div>
        <div class="search-wrap"><form class="search-box" @submit.prevent="submitSearchForm"><button type="submit" aria-label="搜索">⌕</button><input ref="searchInput" v-model="searchText" placeholder="搜索游戏 / 主播 / 区服 / 礼包" @focus="searchFocused = true" @keydown.esc="searchFocused = false" /><span v-if="suggestionsLoading" class="search-loading">搜索中…</span><kbd v-else>⌘ K</kbd></form><div v-if="searchFocused" class="search-popover" @mousedown.prevent><span class="search-popover-title">{{ searchText.trim() ? "搜索建议" : "热门搜索 / 历史记录" }}</span><button v-for="item in searchSuggestions" :key="item" @click="submitSearch(item)">⌕ {{ item }}</button><span v-if="!searchSuggestions.length && !suggestionsLoading" class="search-popover-empty">{{ searchText.trim().length < 2 ? "请输入至少 2 个字符" : "暂无匹配建议" }}</span><span v-if="suggestionsLoading" class="search-popover-empty">正在获取建议…</span><button class="search-more" @click="submitSearchForm">查看全部结果 →</button></div></div>
        <div class="user-actions"><button class="message-button" @click="notify(`有 ${feed.messageUnreadCount} 条未读消息`)">♢<i v-if="feed.messageUnreadCount"></i></button><button class="account-button" :class="{ loading: accountLoading }" aria-label="个人中心" :disabled="accountLoading" @click="goAccount"><span class="avatar">{{ currentAccount.slice(0, 1).toUpperCase() }}</span></button><button class="logout-button" @click="logout">退出</button></div>
      </header>

      <main v-if="showLiveRoom && selectedRoom" class="home-content live-room-mode">
        <LiveView 
          ref="liveViewRef"
          :room="selectedRoom"
          @back="exitLiveRoom"
        />
      </main>
      <main v-else class="home-content" :class="{ 'new-server-mode': activeChannel === 'new-server' }">
        <div class="channel-tabs"><button v-for="channel in channels" :key="channel.key" :class="{ selected: activeChannel === channel.key }" @click="channel.key === 'new-server' ? openNewServerChannel() : activeChannel = channel.key">{{ channel.label }}</button></div>

        <section class="hero-grid">
          <article class="hero-live" :style="{ '--live-accent': feed.liveRooms[0].accent }">
            <div class="live-art" :class="{ 'has-stream': heroHasStream, 'stream-ready': heroStreamReady, 'stream-error': heroStreamError }">
              <video
                v-if="heroHasStream"
                ref="heroVideoRef"
                class="live-video"
                :muted="true"
                :autoplay="true"
                :loop="false"
                :playsinline="true"
                preload="auto"
              ></video>
              <div v-if="heroHasStream && !heroStreamReady && !heroStreamError" class="stream-loading"><span></span>加载直播流…</div>
              <div v-if="heroStreamError" class="stream-error-tip">直播流加载失败</div>
              <template v-if="!heroHasStream || !heroStreamReady">
                <div class="art-glow"></div>
                <div class="fake-character">⚔</div>
                <div class="fake-battle">✦　✧　✦</div>
              </template>
              <span class="live-game-label">LIVE · {{ feed.liveRooms[0].gameName }}</span>
            </div>
            <div class="hero-live-info"><div><span class="live-status"><i></i> 正在直播</span><span class="viewers">{{ feed.liveRooms[0].viewers.toLocaleString() }} 人观看</span></div><h1>{{ feed.liveRooms[0].title }}</h1><p>{{ feed.liveRooms[0].streamerName }} · {{ feed.liveRooms[0].serverName }}</p><button class="primary-button" @click="enterLiveRoom(feed.liveRooms[0])">进入直播间 <span>→</span></button></div>
          </article>
          <aside class="hero-promo" :style="{ '--promo-accent': currentBanner?.accent }"><span class="promo-eyebrow">{{ currentBanner?.eyebrow }}</span><h2>{{ currentBanner?.title }}</h2><p>{{ currentBanner?.description }}</p><button class="promo-button" @click="notify(currentBanner?.actionLabel ?? '活动详情')">{{ currentBanner?.actionLabel }} <span>→</span></button><div class="promo-dots"><button v-for="(_, index) in feed.banners" :key="index" :class="{ active: bannerIndex === index }" @click="bannerIndex = index"></button></div><button class="carousel-arrow prev" @click="switchBanner(-1)">‹</button><button class="carousel-arrow next" @click="switchBanner(1)">›</button></aside>
        </section>

        <section class="section-block"><div class="section-heading"><div><span class="section-kicker">HOT SERVERS</span><h2>新服推荐</h2></div><button class="link-button" @click="activeChannel = 'new-server'">查看全部 <span>→</span></button></div><div v-if="serversLoading" class="server-state">正在加载新服…</div><div v-else-if="serversError" class="server-state"><span>{{ serversError }}</span><button class="small-button" @click="loadRecommendedServers">重试</button></div><div v-else-if="!feed.newServers.length" class="server-state">暂无推荐区服</div><div v-else class="server-list"><article v-for="server in feed.newServers" :key="server.id" class="server-card"><div class="server-icon"><img v-if="server.imageUrl" :src="server.imageUrl" :alt="server.gameName" /><span v-else>{{ server.gameName.slice(0, 1) }}</span></div><div class="server-info"><div class="server-title"><strong>{{ server.serverName }}</strong><span class="status-pill" :class="server.status">{{ server.onlineLabel }}</span></div><p>{{ server.gameName }} · {{ formatCountdown(server) }}</p><div class="tag-list"><span v-for="tag in server.tags" :key="tag">{{ tag }}</span></div></div><button class="small-button" @click="enterServer(server)">进入</button></article></div></section>

        <section class="section-block"><div class="section-heading"><div><span class="section-kicker">EXPLORE GAMES</span><h2>热门游戏</h2></div><button class="link-button" @click="activeNav = '游戏'">全部游戏 <span>→</span></button></div><div v-if="gamesLoading" class="server-state">正在加载热门游戏…</div><div v-else-if="gamesError" class="server-state"><span>{{ gamesError }}</span><button class="small-button" @click="loadPopularGames">重试</button></div><div v-else-if="filteredGames.length" class="game-list"><article v-for="game in filteredGames" :key="game.id" class="game-card" :style="{ '--game-accent': game.accent }"><div class="game-cover"><img v-if="game.iconUrl" :src="game.iconUrl" :alt="game.name" /><span v-else-if="game.isNew" class="new-label">NEW</span><span v-if="!game.iconUrl" class="game-emblem">{{ game.name.slice(0, 1) }}</span><small>{{ game.genre }}</small></div><div class="game-info"><h3>{{ game.name }} <span>⋮</span></h3><p>{{ game.subtitle }}</p><div class="game-meta"><span>热门推荐</span><button @click="enterGame(game)">查看详情</button></div></div></article></div><div v-else class="empty-state">没有找到匹配的游戏</div></section>
      </main>
    </section>
    <Transition name="toast"><div v-if="toast" class="toast-message">{{ toast }}</div></Transition>
  </div>
</template>

<style scoped>
.server-icon { flex: 0 0 110px !important; width: 110px !important; height: 112px !important; overflow: hidden; }
.server-icon img { width: 100%; height: 100%; display: block; object-fit: cover; }
.server-icon > span { color: #f7dd83; font-size: 38px; font-weight: 900; text-shadow: 2px 2px 0 #51290d; }
.new-server-mode .hero-grid, .new-server-mode .section-block:nth-of-type(3) { display: none; }
.new-server-mode .section-block:nth-of-type(2) .section-heading h2 { font-size: 0; }
.new-server-mode .section-block:nth-of-type(2) .section-heading h2::after { content: "新服列表"; font-size: 20px; }
.live-room-mode { max-width: none; margin: 0; padding: 0; display: flex; flex-direction: column; height: calc(100vh - 64px); }
:global(*) { box-sizing: border-box; }
:global(body) { margin: 0; background: #101116; color: #f4f1eb; font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif; }
:global(button), :global(input) { font: inherit; }
button { border: 0; color: inherit; cursor: pointer; }
.gamebox-shell { min-height: 100vh; display: flex; background: radial-gradient(circle at 70% 0%, #20202a 0, #111217 42%, #0c0d11 100%); }
.gamebox-sidebar { width: 104px; flex: 0 0 104px; background: rgba(13, 14, 19, .96); border-right: 1px solid #23242c; display: flex; flex-direction: column; align-items: center; padding: 20px 10px 15px; }
.gamebox-sidebar { position: sticky; top: 0; align-self: flex-start; height: 100vh; max-height: 100vh; overflow-y: auto; box-sizing: border-box; }
.brand { color: #f4c94e; font-weight: 800; font-size: 12px; display: flex; flex-direction: column; align-items: center; gap: 3px; letter-spacing: 1px; white-space: nowrap; }.brand-mark { font-size: 18px; line-height: 17px; font-style: italic; }.side-nav { width: 100%; margin-top: 28px; display: flex; flex-direction: column; gap: 6px; }.side-item { position: relative; width: 100%; min-height: 53px; border-radius: 10px; background: transparent; color: #777984; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 11px; transition: .2s; }.side-item:hover, .side-item.active { color: #f4c94e; background: linear-gradient(145deg, rgba(244, 201, 78, .2), rgba(244, 201, 78, .04)); }.side-icon { height: 19px; font-size: 18px; line-height: 19px; }.nav-badge { position: absolute; top: 5px; right: 12px; min-width: 15px; padding: 1px 4px; border-radius: 8px; background: #ec4e55; color: white; font-size: 9px; font-style: normal; }.sidebar-footer { margin-top: auto; width: 100%; }
.gamebox-main { min-width: 0; flex: 1; }.topbar { height: 64px; padding: 0 32px; border-bottom: 1px solid #23242c; display: flex; align-items: center; gap: 28px; background: rgba(13, 14, 19, .62); }.window-actions { display: flex; gap: 14px; }.window-actions button { background: transparent; color: #858791; font-size: 24px; line-height: 1; }.window-actions button:hover { color: #f4c94e; }.search-box { width: min(360px, 35vw); height: 34px; padding: 0 10px; display: flex; align-items: center; gap: 8px; border: 1px solid #2d2e37; border-radius: 8px; background: #191a20; color: #73757f; }.search-box input { width: 100%; border: 0; outline: 0; color: #eee; background: transparent; font-size: 12px; }.search-box kbd { color: #5d606c; font-size: 10px; white-space: nowrap; }.user-actions { margin-left: auto; display: flex; align-items: center; gap: 18px; }.message-button { position: relative; background: transparent; color: #8d8e98; font-size: 22px; }.message-button i { position: absolute; top: 0; right: -2px; width: 6px; height: 6px; border-radius: 50%; background: #e65b60; }.login-button { padding: 8px 13px; color: #d3b65a; background: #29251a; border: 1px solid #5e512d; border-radius: 6px; font-size: 12px; }.avatar { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: #30323b; color: #aaa; font-size: 12px; }
.home-content { max-width: 1450px; margin: auto; padding: 0 40px 48px; }.channel-tabs { height: 64px; display: flex; align-items: center; gap: 38px; }.channel-tabs button { position: relative; height: 100%; padding: 0; background: transparent; color: #868791; font-size: 14px; }.channel-tabs button:hover, .channel-tabs button.selected { color: #f5d254; }.channel-tabs button.selected::after { content: ""; position: absolute; left: 50%; bottom: 0; width: 30px; height: 2px; transform: translateX(-50%); background: #eac34a; box-shadow: 0 0 10px #eac34a; }
.hero-grid { display: grid; grid-template-columns: minmax(0, 1.75fr) minmax(260px, .72fr); gap: 14px; }.hero-live, .hero-promo { min-height: 300px; overflow: hidden; position: relative; border: 1px solid #2b2d36; border-radius: 8px; background: #1b1c23; }.hero-live { display: grid; grid-template-columns: minmax(230px, 1.45fr) minmax(230px, 1fr); }.live-art { position: relative; overflow: hidden; background: radial-gradient(circle at 65% 25%, color-mix(in srgb, var(--live-accent), transparent 30%), transparent 35%), linear-gradient(135deg, #172338, #05070c 78%); }.live-art::before, .live-art::after { content: ""; position: absolute; border-radius: 50%; filter: blur(2px); }.live-art::before { width: 180px; height: 180px; right: 18%; top: 25%; background: color-mix(in srgb, var(--live-accent), transparent 45%); box-shadow: 0 0 80px 35px color-mix(in srgb, var(--live-accent), transparent 55%); }.live-art::after { inset: 0; background: repeating-linear-gradient(122deg, transparent 0 35px, rgba(255,255,255,.03) 36px 37px); transform: skewX(-20deg); }.live-art.has-stream::before, .live-art.has-stream::after { opacity: .35; }.live-art.stream-ready::before, .live-art.stream-ready::after { display: none; }.live-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; background: #000; }.stream-loading { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; gap: 10px; color: #c9cbce; font-size: 12px; background: rgba(0,0,0,.5); backdrop-filter: blur(4px); }.stream-loading span { width: 16px; height: 16px; border: 2px solid rgba(244,201,78,.35); border-top-color: #e8bd43; border-radius: 50%; animation: hero-spin 1s linear infinite; }.stream-error-tip { position: absolute; inset: 0; z-index: 2; display: grid; place-items: center; color: #a87a7a; font-size: 12px; background: rgba(0,0,0,.6); }@keyframes hero-spin { to { transform: rotate(360deg); } }.art-glow { position: absolute; width: 90px; height: 140px; top: 78px; right: 29%; border-radius: 50% 50% 25% 25%; background: linear-gradient(90deg, #b3e6ff, #4d7cff 50%, #e6c96c); box-shadow: 0 0 30px #61b3ff; transform: rotate(20deg); opacity: .8; z-index: 1; }.fake-character { position: absolute; z-index: 1; right: 25%; top: 97px; color: #fff3c4; font-size: 72px; text-shadow: 0 0 16px #f1c75b; }.fake-battle { position: absolute; z-index: 2; right: 17%; top: 45%; color: #f7ce59; font-size: 25px; text-shadow: 0 0 10px #f00; }.live-game-label { position: absolute; z-index: 3; top: 14px; left: 16px; padding: 4px 8px; border-radius: 3px; background: rgba(0,0,0,.55); color: #e2bb55; font-size: 10px; }.hero-live-info { align-self: end; padding: 24px 26px; background: linear-gradient(180deg, transparent, rgba(19,20,27,.96) 32%); z-index: 3; position: relative; }.live-status { color: #ef626a; font-size: 11px; }.live-status i { display: inline-block; width: 6px; height: 6px; margin-right: 5px; border-radius: 50%; background: #ef626a; }.viewers { margin-left: 12px; color: #858792; font-size: 11px; }.hero-live h1 { margin: 12px 0 8px; color: #f7f4ed; font-size: clamp(18px, 2vw, 26px); line-height: 1.25; }.hero-live-info p { margin: 0 0 18px; color: #9899a3; font-size: 12px; }.primary-button, .promo-button { padding: 10px 16px; border-radius: 5px; background: #e8bd43; color: #17130c; font-weight: 700; font-size: 12px; }.primary-button span, .promo-button span { margin-left: 12px; font-size: 16px; }
.hero-promo { padding: 32px 28px; background: radial-gradient(circle at 90% 20%, color-mix(in srgb, var(--promo-accent), transparent 55%), transparent 38%), linear-gradient(145deg, #28202c, #15161c); }.hero-promo::before { content: "✦"; position: absolute; right: 26px; top: 20px; color: color-mix(in srgb, var(--promo-accent), white 20%); font-size: 70px; opacity: .35; }.promo-eyebrow, .section-kicker { color: #d6ae48; font-size: 10px; letter-spacing: 2px; }.hero-promo h2 { max-width: 250px; margin: 22px 0 12px; font-size: 25px; line-height: 1.25; }.hero-promo p { max-width: 240px; margin: 0 0 25px; color: #a7a2ad; font-size: 12px; line-height: 1.8; }.promo-button { background: transparent; color: #f0ce63; border: 1px solid #a47d29; }.promo-dots { position: absolute; left: 28px; bottom: 20px; display: flex; gap: 6px; }.promo-dots button { width: 20px; height: 3px; padding: 0; border-radius: 2px; background: #55505a; }.promo-dots button.active { background: #f0c955; }.carousel-arrow { position: absolute; top: 50%; background: rgba(255,255,255,.08); border-radius: 50%; width: 25px; height: 25px; color: #ccc; }.carousel-arrow.prev { left: 10px; }.carousel-arrow.next { right: 10px; }
.section-block { margin-top: 35px; }.section-heading { display: flex; justify-content: space-between; align-items: end; margin-bottom: 16px; }.section-heading h2 { margin: 5px 0 0; font-size: 20px; }.link-button { background: transparent; color: #a6a7b0; font-size: 12px; }.link-button:hover { color: #e6c656; }.link-button span { margin-left: 8px; color: #dfbb4e; }.server-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }.server-card { min-width: 0; padding: 16px; display: flex; align-items: center; gap: 12px; border: 1px solid #282a33; border-radius: 7px; background: rgba(26,27,34,.85); }.server-card:hover, .game-card:hover { border-color: #62552d; transform: translateY(-2px); }.server-icon { flex: 0 0 38px; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 9px; background: linear-gradient(145deg, #463b25, #1d202b); color: #f2c956; font-size: 20px; font-weight: 800; }.server-info { min-width: 0; flex: 1; }.server-title { display: flex; align-items: center; gap: 7px; }.server-title strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }.status-pill { padding: 2px 5px; border-radius: 3px; color: #65cd94; background: rgba(61,151,104,.16); font-size: 9px; white-space: nowrap; }.status-pill.opening_soon { color: #eac75f; background: rgba(214,171,58,.15); }.server-info p { overflow: hidden; margin: 5px 0 8px; color: #848691; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }.tag-list { display: flex; gap: 5px; }.tag-list span { padding: 2px 5px; color: #9d8a5c; background: #29271f; border-radius: 2px; font-size: 9px; }.small-button { padding: 6px 10px; border: 1px solid #63552b; border-radius: 4px; background: transparent; color: #d4b653; font-size: 11px; }.small-button:hover { background: #d4b653; color: #19150d; }
.game-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }.game-card { overflow: hidden; display: flex; border: 1px solid #282a33; border-radius: 7px; background: #1a1b22; transition: .2s; }.game-cover { position: relative; flex: 0 0 110px; min-height: 112px; display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: hidden; background: radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--game-accent), white 20%), transparent 32%), linear-gradient(135deg, var(--game-accent), #12141b); }.game-cover small { color: #d1d2d5; font-size: 9px; }.game-emblem { color: #f7dd83; font-size: 38px; font-weight: 900; text-shadow: 2px 2px 0 #51290d; }.new-label { position: absolute; top: 8px; left: 8px; color: #f1c450; font-size: 9px; font-weight: 800; }.game-info { min-width: 0; padding: 18px 15px 12px; flex: 1; }.game-info h3 { display: flex; justify-content: space-between; margin: 0 0 8px; font-size: 15px; }.game-info h3 span { color: #8c8d95; font-weight: 400; }.game-info p { overflow: hidden; margin: 0; color: #92939c; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.game-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 25px; color: #7f8089; font-size: 10px; }.game-meta button { padding: 5px 8px; color: #dfbb4d; background: transparent; border: 1px solid #62552d; border-radius: 3px; font-size: 10px; }.empty-state { padding: 40px; text-align: center; border: 1px dashed #343641; border-radius: 8px; color: #888a94; }.toast-message { position: fixed; z-index: 5; left: 50%; bottom: 28px; transform: translateX(-50%); padding: 11px 18px; border: 1px solid #63572e; border-radius: 7px; background: #28251b; color: #f0d16c; font-size: 12px; box-shadow: 0 8px 30px rgba(0,0,0,.35); }.toast-enter-active, .toast-leave-active { transition: .2s; }.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 10px); }
@media (max-width: 1050px) { .home-content { padding: 0 24px 40px; }.hero-grid { grid-template-columns: 1fr; }.hero-promo { min-height: 220px; }.server-list, .game-list { grid-template-columns: 1fr; } }
@media (max-width: 680px) { .gamebox-sidebar { width: 70px; flex-basis: 70px; }.brand { font-size: 8px; }.side-item { font-size: 9px; }.topbar { padding: 0 15px; gap: 10px; }.search-box { width: 100%; }.login-button { display: none; }.home-content { padding: 0 14px 30px; }.channel-tabs { gap: 18px; overflow-x: auto; }.hero-live { grid-template-columns: 1fr; }.live-art { min-height: 180px; }.hero-live-info { padding: 20px; }.server-card { padding: 12px; } }
<style scoped>
.account-button { display: grid; place-items: center; width: 40px; height: 40px; padding: 0; border: 0 !important; outline: 0; appearance: none; -webkit-appearance: none; background: transparent !important; color: #c6c7cd; font-size: 12px; }
.account-button,
.account-button:hover,
.account-button:focus,
.account-button:focus-visible,
.account-button:active { background: none !important; background-color: transparent !important; box-shadow: none; }
.account-button:hover { color: #e6c656; background: transparent !important; }
.account-button .avatar { width: 34px; height: 34px; border: 1px solid #4b4e5a; background: linear-gradient(145deg, #3b3f4c, #252832); color: #f2d36b; box-shadow: 0 3px 10px rgba(0, 0, 0, .28); transition: border-color .2s, box-shadow .2s, transform .2s; }
.account-button:hover .avatar { border-color: #d8b84e; box-shadow: 0 0 0 3px rgba(216, 184, 78, .14), 0 4px 12px rgba(0, 0, 0, .35); transform: translateY(-1px); }
.account-button.loading { cursor: wait; }
.account-button.loading .avatar { opacity: .6; }
.account-name { max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.logout-button { padding: 6px 9px; color: #8f919b; background: transparent; border: 1px solid #383a44; border-radius: 4px; font-size: 10px; }
.logout-button:hover { color: #e06f72; border-color: #754044; }
@media (max-width: 680px) { .account-name, .logout-button { display: none; } }
.search-wrap { position: relative; width: min(360px, 35vw); }.search-popover { position: absolute; z-index: 10; top: 42px; left: 0; right: 0; padding: 9px; border: 1px solid #36333a; border-radius: 8px; background: #1a1b22; box-shadow: 0 12px 30px rgba(0,0,0,.35); }.search-popover-title,.search-popover-empty { display: block; padding: 6px 8px; color: #a9955a; font-size: 10px; }.search-popover button { display: block; width: 100%; padding: 8px; text-align: left; border-radius: 4px; background: transparent; color: #c4c5cb; font-size: 12px; }.search-popover button:hover { color: #f0ce62; background: #29271f; }.search-more { margin-top: 4px; border-top: 1px solid #2c2d35; color: #d2b24e !important; }.search-popover-empty { color: #777984; }
.search-box > button { width: 22px; height: 26px; flex: 0 0 22px; padding: 0; border: 0; outline: 0; border-radius: 0; background: transparent !important; color: #858791; line-height: 1; appearance: none; -webkit-appearance: none; }
.search-box > button:hover, .search-box > button:focus, .search-box > button:active { background: transparent !important; color: #f0c955; box-shadow: none; }
</style>
