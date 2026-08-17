<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import Hls from "hls.js";
import { followStreamer, getLiveRoom, reportLiveEvent, reportLiveRoom } from "../../api/live";
import type { LiveRoom } from "../../types/home";

const room = ref<LiveRoom>();
const loading = ref(true);
const error = ref("");
const video = ref<HTMLVideoElement>();
const streamError = ref(false);
const followed = ref(false);
const followLoading = ref(false);
const fans = ref(0);
const actionMessage = ref("");
const playRefreshing = ref(false);
const playError = ref("");
let hls: Hls | undefined;
let refreshUsed = false;
const roomId = computed(() => decodeURIComponent(window.location.hash.split("/").pop() || ""));

async function loadRoom() {
  loading.value = true;
  try {
    const detail = await getLiveRoom(roomId.value);
    room.value = {
      id: detail.id,
      streamerId: detail.streamer?.id,
      title: detail.title,
      streamerName: detail.streamer?.name || "主播",
      streamerAvatar: detail.streamer?.avatarUrl,
      viewers: detail.viewers || 0,
      gameName: detail.game?.name || "未知游戏",
      serverName: detail.server?.name || "",
      status: detail.status,
      roomUrl: detail.stream?.playUrl,
      startedAt: detail.startedAt,
      endedAt: detail.endedAt,
      announcement: detail.announcement,
      isFollowed: detail.streamer?.isFollowed,
      accent: "#4d7cff",
    };
    followed.value = detail.streamer?.isFollowed === true;
    fans.value = detail.streamer?.fans || 0;
    await nextTick();
    playStream();
    void reportLiveEvent({ eventType: "live_enter", resourceId: detail.id, source: "live_list" }).catch(() => undefined);
  } catch (reason) {
    const status = (reason as { status?: number }).status;
    error.value = status === 401 ? "登录状态已失效，请重新登录" : status === 403 ? "你暂无权限观看该直播间" : status === 404 ? "直播间不存在" : status === 410 ? "直播已结束" : status && status >= 500 ? "服务暂时不可用，请稍后重试" : reason instanceof Error ? reason.message : "直播间加载失败";
  }
  finally { loading.value = false; }
}
function playStream() {
  if (!video.value || !room.value?.roomUrl) return;
  hls?.destroy(); hls = undefined;
  streamError.value = false;
  playError.value = "";
  if (video.value.canPlayType("application/vnd.apple.mpegurl")) video.value.src = room.value.roomUrl;
  else if (Hls.isSupported()) { hls = new Hls({ enableWorker: true }); hls.loadSource(room.value.roomUrl); hls.attachMedia(video.value); hls.on(Hls.Events.MANIFEST_PARSED, () => { void reportLiveEvent({ eventType: "live_play_start", resourceId: room.value?.id || "", source: "live_room" }).catch(() => undefined); }); hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) handlePlayError(); }); }
  else streamError.value = true;
}
function handlePlayError() {
  streamError.value = true; playError.value = "播放失败，请稍后重试";
  void reportLiveEvent({ eventType: "live_play_error", resourceId: room.value?.id || "", source: "live_room" }).catch(() => undefined);
  if (!refreshUsed && !playRefreshing.value) { refreshUsed = true; playRefreshing.value = true; void loadRoom().finally(() => { playRefreshing.value = false; }); }
}
function goLive() { window.location.hash = "#/live"; }
function goGames() { window.location.hash = "#/games"; }
async function toggleFollow() {
  if (!room.value?.streamerId || followLoading.value) return;
  const previous = followed.value; followLoading.value = true;
  try {
    const result = await followStreamer(room.value.streamerId, !previous);
    followed.value = result.following;
    room.value.isFollowed = result.following;
    fans.value = result.fans;
    void reportLiveEvent({ eventType: "live_follow", resourceId: room.value.streamerId, source: result.following ? "follow" : "unfollow" }).catch(() => undefined);
    actionMessage.value = result.following ? `已关注主播 · ${result.fans} 粉丝` : "已取消关注";
  } catch (reason) { followed.value = previous; actionMessage.value = reason instanceof Error ? reason.message : "关注操作失败"; }
  finally { followLoading.value = false; }
  window.setTimeout(() => { actionMessage.value = ""; }, 2200);
}
async function reportRoom() {
  if (!room.value) return;
  const reason = window.prompt("请输入举报原因", "违规内容")?.trim();
  if (!reason) return;
  try {
    await reportLiveRoom(room.value.id, reason);
    actionMessage.value = "举报已提交";
  } catch (reason) { actionMessage.value = reason instanceof Error ? reason.message : "举报提交失败"; }
  window.setTimeout(() => { actionMessage.value = ""; }, 2200);
}
async function shareRoom() {
  const url = window.location.href;
  try { await navigator.clipboard.writeText(url); actionMessage.value = "直播间链接已复制"; }
  catch { actionMessage.value = url; }
  window.setTimeout(() => { actionMessage.value = ""; }, 2200);
}
onMounted(loadRoom);
onUnmounted(() => { hls?.destroy(); hls = undefined; void reportLiveEvent({ eventType: "live_leave", resourceId: room.value?.id || roomId.value, source: "live_room" }).catch(() => undefined); });
</script>

<template>
  <main class="room-page"><header class="room-top"><button @click="goLive">← 返回</button><span>直播间</span></header><section v-if="loading" class="room-state">正在进入直播间…</section><section v-else-if="error" class="room-state"><p>{{ error }}</p><button @click="goLive">返回直播列表</button></section><section v-else-if="room" class="room-layout"><div><div class="player"><video ref="video" controls playsinline @error="streamError = true"></video><div v-if="!room.roomUrl || streamError" class="player-placeholder"><b>{{ streamError ? "直播流加载失败" : "主播暂未提供播放流" }}</b><span>可以先查看直播信息，稍后重试</span><button v-if="streamError" @click="playStream">重试播放</button></div></div><div class="room-detail"><div class="streamer"><span class="avatar"><img v-if="room.streamerAvatar" :src="room.streamerAvatar" :alt="room.streamerName" /><span v-else>{{ room.streamerName.slice(0, 1) }}</span></span><div><h1>{{ room.title }}</h1><p>{{ room.streamerName }} · {{ room.viewers.toLocaleString() }} 人观看</p></div></div><div class="actions"><button @click="toggleFollow">{{ followed ? "♥ 已关注" : "♡ 关注" }}</button><button @click="shareRoom">↗ 分享</button><button @click="reportRoom">⚑ 举报</button></div></div><p v-if="actionMessage" class="action-message">{{ actionMessage }}</p></div><aside class="room-aside"><span class="eyebrow">LIVE ROOM</span><h2>直播公告</h2><p>{{ room.announcement || "欢迎来到直播间，文明观看，理性互动。" }}</p><div class="game-link"><small>主播正在直播</small><strong>{{ room.gameName }}</strong><span v-if="room.serverName">{{ room.serverName }}</span><button @click="goGames">查看游戏 →</button></div><div class="chat-placeholder"><h3>互动聊天</h3><p>弹幕和聊天功能即将开放</p></div></aside></section></main>
</template>

<style scoped>
.room-page{min-height:100vh;color:#f4f1eb;background:#101116}.room-top{height:64px;display:flex;align-items:center;gap:22px;padding:0 5vw;border-bottom:1px solid #282a33;background:#0d0e13}.room-top button{border:0;color:#bbb;background:transparent;cursor:pointer}.room-top span{color:#f4c94e;font-size:13px}.room-layout{max-width:1280px;margin:0 auto;padding:42px 5vw;display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:20px}.player{position:relative;aspect-ratio:16/9;overflow:hidden;border-radius:8px;background:#050608}.player video{width:100%;height:100%;object-fit:contain}.player-placeholder{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#9698a1;background:radial-gradient(circle at 50% 40%,#252331,#08090d 70%)}.player-placeholder b{color:#ddd;font-size:15px}.player-placeholder span{font-size:11px}.player-placeholder button,.room-state button,.actions button,.game-link button{padding:8px 12px;border:1px solid #65562b;border-radius:5px;color:#e2bd50;background:transparent;cursor:pointer;font-size:11px}.room-detail{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 2px;border-bottom:1px solid #282a33}.streamer{display:flex;min-width:0;gap:12px;align-items:center}.avatar{flex:0 0 38px;width:38px;height:38px;display:grid;place-items:center;overflow:hidden;border-radius:50%;color:#f3d477;background:#3e3a2d}.avatar img{width:100%;height:100%;object-fit:cover}.room-detail h1{margin:0 0 7px;overflow:hidden;font-size:17px;text-overflow:ellipsis;white-space:nowrap}.room-detail p{margin:0;color:#92949d;font-size:11px}.actions{display:flex;gap:8px}.room-aside{padding:22px;border:1px solid #282a33;border-radius:8px;background:#1a1b22}.eyebrow{color:#d6ae48;font-size:10px;letter-spacing:2px}.room-aside h2{margin:14px 0 8px;font-size:16px}.room-aside>p{margin:0;color:#92949d;font-size:11px;line-height:1.7}.game-link{display:flex;flex-direction:column;gap:7px;margin-top:24px;padding:15px;border-radius:6px;background:#24231f}.game-link small{color:#999;font-size:10px}.game-link strong{font-size:15px}.game-link span{color:#d3ad4b;font-size:11px}.game-link button{align-self:flex-start;margin-top:7px}.chat-placeholder{margin-top:30px;padding-top:22px;border-top:1px solid #363640}.chat-placeholder h3{margin:0 0 8px;font-size:13px}.chat-placeholder p{margin:0;color:#777984;font-size:11px}.room-state{min-height:calc(100vh - 64px);display:grid;place-items:center;color:#92949d;font-size:13px}.room-state p{margin:0 0 12px}.room-state button{margin-left:10px}@media(max-width:760px){.room-layout{display:block;padding:20px}.room-aside{margin-top:16px}.room-detail{align-items:flex-start;flex-direction:column}.actions{width:100%}}
</style>
