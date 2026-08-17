<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { getLiveCategories, getLiveRooms, normalizeLiveRooms, type LiveCategory } from "../../api/live";
import { getCurrentAccountInfo } from "../../api/account";
import type { LiveRoom } from "../../types/home";
import { clearSession, getCurrentAccount } from "../../utils/auth";

const rooms = ref<LiveRoom[]>([]);
const loading = ref(false);
const error = ref("");
const searchText = ref("");
const activeCategory = ref("全部");
const activeCategoryId = ref("");
const currentAccount = ref(getCurrentAccount());
const isStreamer = ref(false);
const categories = ref<LiveCategory[]>([]);
const page = ref(1);
const hasMore = ref(false);
let requestController: AbortController | undefined;
let requestSequence = 0;
const navItems = [
  { icon: "⌂", label: "首页" }, { icon: "▶", label: "直播" },
  { icon: "◉", label: "游戏" }, { icon: "✓", label: "任务" }, { icon: "S", label: "SVIP" },
];

const filteredRooms = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  let result = rooms.value;
  result = [...result].sort((a, b) => b.viewers - a.viewers);
  if (keyword) result = result.filter((room) => `${room.title}${room.streamerName}${room.gameName}${room.serverName}`.toLowerCase().includes(keyword));
  return result;
});
const featuredRoom = computed(() => filteredRooms.value[0]);

async function loadRooms(categoryId = activeCategoryId.value, append = false) {
  requestController?.abort(); requestController = new AbortController(); const sequence = ++requestSequence;
  loading.value = true;
  if (!append) error.value = "";
  try {
    const nextPage = append ? page.value + 1 : 1;
    const response = await getLiveRooms(nextPage, 24, requestController.signal, { categoryId, keyword: searchText.value.trim() });
    if (sequence !== requestSequence) return;
    const next = normalizeLiveRooms(response);
    rooms.value = append ? [...rooms.value, ...next] : next; page.value = nextPage; hasMore.value = response.hasMore === true || (response.total != null && rooms.value.length < response.total);
  } catch (reason) {
    if ((reason as DOMException).name !== "AbortError" && sequence === requestSequence) error.value = reason instanceof Error ? reason.message : "直播列表加载失败";
  } finally { loading.value = false; }
}
async function loadCategories() {
  try {
    const response = await getLiveCategories();
    categories.value = [{ id: "all", name: "全部", type: "all", sort: -1, enabled: true }, ...response.list]
      .filter((category) => category.enabled !== false)
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  } catch (reason) {
    // 分类是独立状态，失败不影响已显示的房间。
  }
}
function selectCategory(category: LiveCategory) {
  activeCategory.value = category.name;
  activeCategoryId.value = category.id === "all" ? "" : category.id;
  void loadRooms(activeCategoryId.value);
}
async function loadAccountRole() {
  try {
    const result = await getCurrentAccountInfo();
    const user = result.user;
    isStreamer.value = user?.isStreamer === true || user?.role === "streamer" || user?.roles?.includes("streamer") === true;
    if (user?.account) currentAccount.value = user.account;
  } catch {
    // 统一请求层负责处理 Token 失效；身份读取失败不阻断直播列表展示。
  }
}
function startStreaming() { window.location.hash = "#/live/create"; }
function openRoom(room: LiveRoom) { window.location.hash = `#/live/${encodeURIComponent(room.id)}`; }
function navigate(label: string) {
  if (label === "首页") window.location.hash = "";
  else if (label === "直播") window.location.hash = "#/live";
  else if (label === "游戏") window.location.hash = "#/games";
  else if (label === "任务") window.location.hash = "#/tasks";
  else if (label === "SVIP") window.location.hash = "#/vip";
  else window.alert(`「${label}」页面即将开放`);
}
function goAccount() { window.location.hash = "#/account"; }
function logout() { clearSession(); window.location.hash = "#/login"; }
onMounted(() => { void loadRooms(); void loadCategories(); void loadAccountRole(); });
onUnmounted(() => requestController?.abort());
</script>

<template>
  <div class="live-shell">
    <aside class="sidebar"><div class="brand"><span class="brand-mark">game</span><span>盒子</span></div><nav class="side-nav" aria-label="主导航"><button v-for="item in navItems" :key="item.label" class="side-item" :class="{ active: item.label === '直播' }" @click="navigate(item.label)"><span class="side-icon">{{ item.icon }}</span><span>{{ item.label }}</span></button></nav><button class="side-item settings" @click="navigate('设置')"><span class="side-icon">⚙</span><span>设置</span></button></aside>
    <section class="main-area"><header class="topbar"><button class="refresh" aria-label="刷新" @click="loadRooms()">↻</button><div class="search-box"><span>⌕</span><input v-model="searchText" placeholder="搜索主播 / 游戏 / 直播间" /><kbd>⌘ K</kbd></div><div class="user-actions"><button v-if="isStreamer" class="start-streaming" @click="startStreaming">＋ 我要开播</button><button class="message" aria-label="消息">♢</button><button class="account" aria-label="个人中心" @click="goAccount"><span>{{ currentAccount.slice(0, 1).toUpperCase() }}</span></button><button class="logout" @click="logout">退出</button></div></header>
      <main class="live-page">
        <section v-if="featuredRoom && !searchText && activeCategory === '全部'" class="featured" @click="openRoom(featuredRoom)"><div class="featured-cover" :style="{ '--accent': featuredRoom.accent }"><img v-if="featuredRoom.coverUrl" :src="featuredRoom.coverUrl" :alt="featuredRoom.title" /><span v-else class="cover-art">▶</span><span class="live-badge"><i></i> LIVE · {{ featuredRoom.viewers.toLocaleString() }} 人观看</span><span class="play">▶</span></div><div class="featured-info"><span class="eyebrow">FEATURED STREAM</span><h2>{{ featuredRoom.title }}</h2><p>{{ featuredRoom.streamerName }} · {{ featuredRoom.gameName }} · {{ featuredRoom.serverName }}</p><button class="primary" @click.stop="openRoom(featuredRoom)">进入直播间 <b>→</b></button></div></section>
        <div v-if="loading" class="state">正在加载直播列表…</div><div v-else-if="error" class="state"><span>{{ error }}</span><button @click="loadRooms()">重试</button></div><div v-else-if="!filteredRooms.length" class="state">暂无匹配的直播，换个关键词试试。</div>
        <section v-else class="room-section"><div class="section-heading"><h2>推荐直播 <b>LIVE</b></h2><span>{{ filteredRooms.length }} 个房间</span></div><nav class="category-tabs" aria-label="直播分类"><button v-for="category in categories" :key="category.id" :class="{ active: activeCategory === category.name }" @click="selectCategory(category)">{{ category.name }}</button></nav><div class="room-grid"><article v-for="room in filteredRooms" :key="room.id" class="room-card" @click="openRoom(room)"><div class="room-cover" :style="{ '--accent': room.accent }"><img v-if="room.coverUrl" :src="room.coverUrl" :alt="room.title" /><span v-else class="cover-art">▶</span><span class="room-live"><i></i>直播中</span><span class="viewer-count">{{ room.viewers.toLocaleString() }} 人</span></div><div class="room-info"><div class="streamer"><span class="avatar"><img v-if="room.streamerAvatar" :src="room.streamerAvatar" :alt="room.streamerName" /><span v-else>{{ room.streamerName.slice(0, 1) }}</span></span><div><h3>{{ room.title }}</h3><p>{{ room.streamerName }} · {{ room.gameName }}</p></div></div><span v-if="room.serverName" class="server">{{ room.serverName }}</span></div></article></div></section>
      </main></section>
  </div>
</template>

<style scoped>
.section-heading{align-items:center;gap:20px;margin-bottom:12px}.section-heading h2{font-size:20px;letter-spacing:.5px}.section-heading h2 b{color:#f4c94e;font-size:22px;font-style:normal}.category-tabs{display:flex;gap:10px;margin:0 0 22px;padding:0 0 2px;border:0;overflow-x:auto}.category-tabs button{height:34px;padding:0 20px;border:1px solid #2d303a;border-radius:8px;color:#b7bac4;background:rgba(25,27,34,.86);font-size:12px;transition:.2s}.category-tabs button:hover{border-color:#6d5b2b;color:#e6c65c}.category-tabs button.active{border-color:#a4812a;color:#f4cf5b;background:#26261b;box-shadow:inset 0 0 0 1px rgba(244,201,78,.14)}.start-streaming{padding:8px 13px;border:1px solid #9a7927;border-radius:6px;color:#f4cf5b;background:rgba(70,55,18,.45);font-size:11px;cursor:pointer}.start-streaming:hover{background:rgba(103,80,24,.65)}
</style>

<style scoped>
.live-shell{min-height:100vh;color:#f4f1eb;background:#101116}.sidebar{position:fixed;z-index:20;inset:0 auto 0 0;width:104px;display:flex;flex-direction:column;align-items:center;padding:20px 10px 15px;background:rgba(13,14,19,.98);border-right:1px solid #23242c;box-sizing:border-box}.brand{color:#f4c94e;font-weight:800;font-size:12px;line-height:normal;letter-spacing:1px;text-align:center}.brand-mark{display:block;font-size:18px;font-style:italic;line-height:17px}.brand span:last-child{font-size:12px}.side-nav{width:100%;margin-top:28px;display:flex;flex-direction:column;gap:6px}.side-item{width:100%;min-height:53px;border:0;border-radius:10px;color:#777984;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:11px;cursor:pointer}.side-item:hover,.side-item.active{color:#f4c94e;background:linear-gradient(145deg,rgba(244,201,78,.2),rgba(244,201,78,.04))}.side-icon{height:19px;font-size:18px;line-height:19px}.settings{margin-top:auto}.main-area{min-width:0;margin-left:104px}.topbar{position:fixed;z-index:10;top:0;right:0;left:104px;height:64px;padding:0 32px;display:flex;align-items:center;gap:28px;border-bottom:1px solid #23242c;background:rgba(13,14,19,.96);box-sizing:border-box}.refresh,.message{border:0;color:#858791;background:transparent;font-size:23px;cursor:pointer}.search-box{width:min(420px,50vw);height:34px;display:flex;align-items:center;gap:8px;padding:0 10px;border:1px solid #2d2e37;border-radius:8px;color:#73757f;background:#191a20;box-sizing:border-box}.search-box input{width:100%;border:0;outline:0;color:#eee;background:transparent;font-size:12px}.search-box kbd{color:#5d606c;font-size:10px;white-space:nowrap}.user-actions{margin-left:auto;display:flex;align-items:center;gap:18px}.account{border:0;background:transparent;cursor:pointer}.account span{display:grid;place-items:center;width:34px;height:34px;border:1px solid #4b4e5a;border-radius:50%;color:#f2d36b;background:#30323b}.logout{padding:6px 9px;border:1px solid #383a44;border-radius:4px;color:#8f919b;background:transparent;font-size:10px;cursor:pointer}.live-page{min-height:100vh;padding:108px 6vw 56px;background:radial-gradient(circle at 70% 0%,#20202a 0,#111217 42%,#0c0d11 100%)}.page-header,.room-section,.featured,.category-tabs{max-width:1280px;margin-left:auto;margin-right:auto}.page-header{display:flex;align-items:end;justify-content:space-between;margin-bottom:28px}.eyebrow{color:#d6ae48;font-size:11px;letter-spacing:2px}.page-header h1{margin:8px 0;font-size:32px}.page-header p{margin:0;color:#8e909a;font-size:13px}.room-count,.section-heading span{color:#777984;font-size:11px}.category-tabs{display:flex;gap:26px;margin-bottom:20px;border-bottom:1px solid #282a33;overflow-x:auto}.category-tabs button{padding:0 0 12px;border:0;color:#777984;background:transparent;white-space:nowrap;cursor:pointer;font-size:12px}.category-tabs button.active{color:#f4c94e;border-bottom:2px solid #f4c94e}.featured{display:grid;grid-template-columns:1.4fr 1fr;min-height:245px;margin-bottom:34px;overflow:hidden;border:1px solid #2b2d36;border-radius:9px;background:#1a1b22;cursor:pointer}.featured-cover,.room-cover{position:relative;overflow:hidden;background:radial-gradient(circle at 65% 25%,color-mix(in srgb,var(--accent),transparent 35%),transparent 40%),linear-gradient(135deg,#172338,#05070c 78%)}.featured-cover{min-height:245px}.featured-cover img,.room-cover img{width:100%;height:100%;object-fit:cover}.cover-art{position:absolute;inset:0;display:grid;place-items:center;color:#f4c94e;font-size:42px;text-shadow:0 0 25px var(--accent)}.live-badge,.room-live,.viewer-count{position:absolute;padding:5px 8px;color:#eee;background:rgba(0,0,0,.58);font-size:10px}.live-badge{top:14px;left:16px}.live-badge i,.room-live i{display:inline-block;width:6px;height:6px;margin-right:5px;border-radius:50%;background:#ef626a}.play{position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:30px;text-shadow:0 0 18px #000}.featured-info{align-self:end;padding:28px;background:linear-gradient(180deg,transparent,#191a21 25%)}.featured-info h2{margin:12px 0 8px;font-size:25px;line-height:1.3}.featured-info p{margin:0 0 22px;color:#999ba5;font-size:12px}.primary{padding:10px 16px;border:0;border-radius:5px;color:#17130c;background:#e8bd43;font-weight:700;font-size:12px;cursor:pointer}.primary b{margin-left:12px;font-size:16px}.section-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.section-heading h2{margin:0;font-size:17px}.room-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.room-card{overflow:hidden;border:1px solid #282a33;border-radius:8px;background:#1a1b22;cursor:pointer;transition:.2s}.room-card:hover{border-color:#62552d;transform:translateY(-2px)}.room-cover{aspect-ratio:16/9}.room-live{top:10px;left:10px;color:#f3b7b7}.viewer-count{right:10px;bottom:10px}.room-info{padding:12px}.streamer{display:flex;min-width:0;gap:9px}.avatar{flex:0 0 28px;width:28px;height:28px;display:grid;place-items:center;overflow:hidden;border-radius:50%;color:#f3d477;background:#3e3a2d;font-size:12px}.avatar img{width:100%;height:100%;object-fit:cover}.streamer div{min-width:0}.room-info h3{overflow:hidden;margin:0 0 5px;color:#eee;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.room-info p{margin:0;overflow:hidden;color:#888a94;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.server{display:inline-block;margin-top:10px;padding:3px 6px;color:#c1a458;background:#2a261d;font-size:10px}.state{max-width:1280px;min-height:150px;margin:30px auto;display:flex;align-items:center;justify-content:center;gap:12px;border:1px dashed #343641;border-radius:8px;color:#888a94;font-size:13px}.state button{padding:6px 10px;border:1px solid #62552d;border-radius:4px;color:#dfbb4d;background:transparent;cursor:pointer;font-size:11px}@media(max-width:1100px){.room-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:760px){.sidebar{width:70px}.main-area{margin-left:70px}.topbar{left:70px;padding:0 15px;gap:10px}.logout{display:none}.search-box{width:100%}.live-page{padding:94px 20px 40px}.page-header{align-items:start;gap:12px;flex-direction:column}.featured{grid-template-columns:1fr}.featured-cover{min-height:190px}.featured-info{padding:20px}.featured-info h2{font-size:19px}.room-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:460px){.room-grid{grid-template-columns:1fr}.room-count{display:none}}
</style>
