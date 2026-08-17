<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { createLiveRoom, endMyLiveRoom, getMyLiveRoom, heartbeatLiveRoom } from "../../api/live";
import { getCurrentAccountInfo } from "../../api/account";
import { clearSession, getAccountProfile, getCurrentAccount, saveAccountProfile } from "../../utils/auth";

const profile = ref(getAccountProfile());
const account = ref(profile.value?.account || getCurrentAccount());
const title = ref("");
const gameName = ref("");
const serverName = ref("");
const roomCreated = ref(false);
const creating = ref(false);
const message = ref("");
const liveStatus = ref<"idle" | "waiting" | "live" | "ended">("idle");
const loadingRoom = ref(false);
const pushUrl = ref("");
const pushUrlExpiresAt = ref("");
let statusTimer: number | undefined;
const defaultBackground = "/live/studio-background.png";
const backgroundImage = ref(defaultBackground);
const backgroundInput = ref<HTMLInputElement>();
const draftKey = `gamebox_live_draft_${account.value}`;
const backgroundKey = `gamebox_live_background_${account.value}`;

function loadDraft() {
  const defaults = {
    title: `${profile.value?.nickname || account.value}的直播`,
    gameName: "冰雪传奇",
    serverName: "火龙一区",
  };
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey) || "null") as Partial<typeof defaults> | null;
    title.value = saved?.title || defaults.title;
    gameName.value = saved?.gameName || defaults.gameName;
    serverName.value = saved?.serverName || defaults.serverName;
  } catch {
    title.value = defaults.title;
    gameName.value = defaults.gameName;
    serverName.value = defaults.serverName;
  }
}
function saveDraft() {
  localStorage.setItem(draftKey, JSON.stringify({ title: title.value, gameName: gameName.value, serverName: serverName.value }));
}
function loadBackground() { backgroundImage.value = localStorage.getItem(backgroundKey) || defaultBackground; }
function chooseBackground() { backgroundInput.value?.click(); }
function handleBackgroundChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { notify("请选择图片文件"); return; }
  if (file.size > 5 * 1024 * 1024) { notify("背景图不能超过 5MB"); return; }
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== "string") return;
    backgroundImage.value = reader.result;
    localStorage.setItem(backgroundKey, reader.result);
    notify("直播背景已更新");
  };
  reader.readAsDataURL(file);
  event.target && ((event.target as HTMLInputElement).value = "");
}
function resetBackground() { backgroundImage.value = defaultBackground; localStorage.removeItem(backgroundKey); notify("已恢复默认背景"); }

async function loadProfile() {
  try {
    const result = await getCurrentAccountInfo();
    if (result.user) {
      saveAccountProfile(result.user);
      profile.value = result.user;
      account.value = result.user.account || result.user.nickname || account.value;
    }
  } catch { /* 全局 HTTP 层处理 Token 失效 */ }
}
function notify(value: string) { message.value = value; window.setTimeout(() => { message.value = ""; }, 2400); }
async function copyPushUrl() { if (!pushUrl.value) return; try { await navigator.clipboard.writeText(pushUrl.value); notify("推流地址已复制"); } catch { notify("复制失败，请手动复制"); } }
async function createRoom() {
  if (!title.value.trim()) return notify("请填写直播标题");
  creating.value = true;
  try {
    const result = await createLiveRoom({
      title: title.value.trim(),
      streamerName: profile.value?.nickname || account.value,
      streamerAvatar: profile.value?.avatarUrl || undefined,
      gameName: gameName.value.trim() || undefined,
      serverName: serverName.value.trim() || undefined,
    });
    roomCreated.value = true;
    liveStatus.value = "waiting";
    pushUrl.value = result.room.pushUrl;
    void heartbeatLiveRoom().then(() => { liveStatus.value = "live"; }).catch(() => undefined);
    notify("直播间创建成功，请使用推流地址开始直播");
  } catch (reason) { notify(reason instanceof Error ? reason.message : "创建直播间失败"); }
  finally { creating.value = false; }
}
async function loadCurrentRoom(showError = false) {
  loadingRoom.value = true;
  try {
    const result = await getMyLiveRoom();
    roomCreated.value = true;
    liveStatus.value = result.room.status === "live" ? "live" : result.room.status === "ended" ? "ended" : "waiting";
    pushUrl.value = result.room.pushUrl || ""; pushUrlExpiresAt.value = result.room.pushUrlExpiresAt || "";
    if (result.room.title) title.value = result.room.title;
    if (result.room.gameName) gameName.value = result.room.gameName;
    if (result.room.serverName) serverName.value = result.room.serverName;
  } catch (reason) {
    if (showError && !String(reason).includes("未找到")) notify(reason instanceof Error ? reason.message : "直播状态查询失败");
  } finally { loadingRoom.value = false; }
}
async function endRoom() {
  if (!window.confirm("确定结束当前直播吗？结束后观众将无法继续观看。")) return;
  try {
    await endMyLiveRoom();
    roomCreated.value = false;
    liveStatus.value = "ended";
    notify("直播已结束");
  } catch (reason) { notify(reason instanceof Error ? reason.message : "结束直播失败"); }
}
function goLive() { window.location.hash = "#/live"; }
function goAccount() { window.location.hash = "#/account"; }
function logout() { clearSession(); window.location.hash = "#/login"; }
watch([title, gameName, serverName], saveDraft);
onMounted(() => {
  loadDraft(); loadBackground(); void loadProfile(); void loadCurrentRoom();
  statusTimer = window.setInterval(() => { if (roomCreated.value) void heartbeatLiveRoom().then(() => { liveStatus.value = "live"; }).catch(() => void loadCurrentRoom()); }, 30000);
});
onUnmounted(() => { if (statusTimer) window.clearInterval(statusTimer); });
</script>

<template>
  <section v-if="roomCreated && pushUrl" class="address-card"><div class="address-title"><h2>推流地址</h2><button type="button" @click="copyPushUrl">复制</button></div><input :value="pushUrl" readonly /><small v-if="pushUrlExpiresAt">有效期：{{ pushUrlExpiresAt }}</small></section>
  <div class="studio-page"><header class="studio-top"><button @click="goLive">← 返回直播</button><div class="studio-brand"><small>LIVE STUDIO</small><strong>我要直播</strong></div><div class="studio-actions"><button @click="goAccount">个人中心</button><button class="avatar" @click="goAccount">{{ account.slice(0, 1).toUpperCase() }}</button><button @click="logout">退出</button></div></header><main class="studio-main"><section class="studio-title"><div><span class="eyebrow">LIVE STUDIO</span><h1>开启你的直播</h1><p>创建直播间，直播地址由系统自动生成。</p></div><span class="status" :class="{ ready: liveStatus === 'live' || liveStatus === 'waiting' }"><i></i>{{ liveStatus === "live" ? "正在直播" : liveStatus === "waiting" ? "等待推流" : liveStatus === "ended" ? "直播已结束" : "等待开播" }}</span></section><section class="studio-grid"><div class="preview-card"><div class="preview-screen" :style="{ backgroundImage: `linear-gradient(180deg, rgba(7,10,18,.12), rgba(7,10,18,.72)), url('${backgroundImage}')` }"><span class="play-mark">▶</span><strong>{{ title || "你的直播预览" }}</strong><small>{{ gameName || "选择游戏后开始直播" }}</small><div class="background-actions"><button type="button" @click="chooseBackground">更换背景</button><button type="button" @click="resetBackground">恢复默认</button><input ref="backgroundInput" type="file" accept="image/png,image/jpeg,image/webp" hidden @change="handleBackgroundChange" /></div></div><div class="preview-footer"><span>主播：{{ profile?.nickname || account }}</span><span>{{ liveStatus === "live" ? "正在直播" : liveStatus === "waiting" ? "等待推流" : "未开始" }}</span></div></div><form class="setup-card" @submit.prevent="createRoom"><h2>直播设置</h2><label>直播标题<input v-model="title" maxlength="60" placeholder="例如：新区冲榜，今晚冲击全服第一" /></label><label>游戏名称<input v-model="gameName" placeholder="请输入正在直播的游戏" /></label><label>区服名称<input v-model="serverName" placeholder="请输入区服，可选" /></label><button class="create-button" type="submit" :disabled="creating || roomCreated">{{ creating ? "创建中…" : roomCreated ? "直播间已创建" : "创建直播间" }}</button><button v-if="roomCreated" type="button" class="end-button" :disabled="loadingRoom" @click="endRoom">{{ loadingRoom ? "处理中…" : "结束直播" }}</button><p class="hint">创建后，系统会自动生成直播所需配置。</p></form></section></main><p v-if="message" class="toast">{{ message }}</p></div>
</template>

<style scoped>
.background-actions{display:flex;gap:8px;margin-top:8px;opacity:0;transition:.2s}.preview-screen:hover .background-actions{opacity:1}.background-actions button{padding:6px 9px;border:1px solid rgba(232,189,67,.65);border-radius:4px;color:#f0cc62;background:rgba(12,14,20,.72);font-size:10px}.background-actions button:hover{background:rgba(67,52,18,.88)}
.end-button{padding:10px;border:1px solid #744047;border-radius:5px;color:#df858b;background:rgba(93,38,46,.35);font-size:12px}.end-button:hover{background:rgba(112,44,52,.55)}.end-button:disabled{opacity:.55;cursor:not-allowed}
</style>

<style scoped>
.preview-screen{background-image:linear-gradient(180deg,rgba(7,10,18,.18),rgba(7,10,18,.72)),url('/live/studio-background.png');background-position:center;background-size:cover}
</style>

<style scoped>
:global(*){box-sizing:border-box}:global(body){margin:0;background:#101116;color:#f4f1eb;font-family:Inter,"PingFang SC","Microsoft YaHei",sans-serif}.studio-page{min-height:100vh;background:radial-gradient(circle at 70% 0%,#29252a,#111217 44%,#0c0d11)}button{font:inherit;border:0;color:inherit;background:transparent;cursor:pointer}.studio-top{height:68px;padding:0 5vw;display:flex;align-items:center;border-bottom:1px solid #292a32;background:rgba(13,14,19,.94)}.studio-top>button{color:#a2a3ac;font-size:12px}.studio-brand{display:flex;flex-direction:column;align-items:center;margin:auto}.studio-brand small,.eyebrow{color:#d5ae4b;font-size:10px;letter-spacing:2px}.studio-brand strong{margin-top:4px;font-size:16px}.studio-actions{display:flex;align-items:center;gap:16px;color:#9b9ca5;font-size:11px}.studio-actions .avatar{display:grid;place-items:center;width:32px;height:32px;border:1px solid #6b572a;border-radius:50%;color:#ebc85a;background:#302b20}.studio-main{max-width:1120px;margin:auto;padding:54px 5vw}.studio-title{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:30px}.studio-title h1{margin:10px 0 7px;font-size:30px}.studio-title p{margin:0;color:#92949d;font-size:13px}.status{display:flex;align-items:center;gap:7px;padding:8px 12px;border:1px solid #363740;border-radius:20px;color:#92949d;font-size:11px}.status i{width:7px;height:7px;border-radius:50%;background:#747680}.status.ready{border-color:#385c48;color:#8bd0a5}.status.ready i{background:#55c487;box-shadow:0 0 8px #55c487}.studio-grid{display:grid;grid-template-columns:1.25fr 1fr;gap:18px}.preview-card,.setup-card,.address-card{border:1px solid #30313a;border-radius:9px;background:#1a1b22}.preview-card{padding:14px}.preview-screen{aspect-ratio:16/9;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;border-radius:6px;background:radial-gradient(circle at 50% 35%,#393047,#0d0f15 70%)}.play-mark{color:#e1bb50;font-size:32px}.preview-screen strong{font-size:15px}.preview-screen small{margin:0;color:#858791}.preview-footer{display:flex;justify-content:space-between;padding:13px 2px 2px;color:#858791;font-size:11px}.setup-card{display:flex;flex-direction:column;gap:15px;padding:24px}.setup-card h2{margin:0 0 3px;font-size:18px}.setup-card label{display:flex;flex-direction:column;gap:7px;color:#a7a8b0;font-size:11px}.setup-card input{padding:11px;border:1px solid #383943;border-radius:5px;outline:0;color:#eee;background:#121319;font-size:12px}.setup-card input:focus{border-color:#a77e2c}.create-button{padding:12px;border-radius:5px;color:#17130c;background:#e8bd43;font-weight:700;font-size:12px}.create-button:disabled{opacity:.55;cursor:not-allowed}.hint{margin:0;color:#71737d;font-size:10px;line-height:1.6}.address-card{margin-top:18px;padding:22px}.address-title{display:flex;justify-content:space-between;gap:20px}.address-title h2{margin:0 0 7px;font-size:16px}.address-title p{margin:0;color:#858790;font-size:11px}.address-title>span{color:#72c592;font-size:10px}.address-row{display:flex;align-items:center;gap:12px;margin-top:18px}.address-row label{width:70px;color:#9a9ca5;font-size:11px}.address-row input{min-width:0;flex:1;padding:10px;border:1px solid #343640;border-radius:5px;color:#ddd;background:#121319;font-size:11px}.address-row button{padding:7px 10px;border:1px solid #61512a;border-radius:4px;color:#dfbb51;font-size:11px}.toast{position:fixed;right:28px;bottom:25px;padding:11px 16px;border:1px solid #65552c;border-radius:6px;color:#f0d16d;background:#29251b;font-size:12px}@media(max-width:720px){.studio-top{padding:0 18px}.studio-actions button:first-child{display:none}.studio-main{padding:32px 18px}.studio-title{align-items:flex-start;gap:18px;flex-direction:column}.studio-title h1{font-size:25px}.studio-grid{grid-template-columns:1fr}.address-row{align-items:flex-start;flex-wrap:wrap}.address-row label{width:100%}.address-row input{flex-basis:calc(100% - 65px)}}
</style>
