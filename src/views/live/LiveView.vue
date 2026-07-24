<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import Hls from "hls.js";
import type { LiveRoom } from "../../types/home";

const props = defineProps<{
  room?: LiveRoom;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const currentRoom = ref<LiveRoom>(props.room || {
  id: "live-1",
  title: "[新服推荐] 战狂惊天沉默",
  streamerName: "战狂惊天沉默",
  viewers: 1357,
  gameName: "惊天沉默",
  serverName: "最新区",
  status: "live",
  accent: "#4d7cff",
  roomUrl: "",
});

const isFollowing = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
let hlsInstance: Hls | null = null;
const streamReady = ref(false);
const streamError = ref(false);

const chatMessages = ref<Array<{ id: string; user: string; content: string; time: string }>>([
  { id: "1", user: "孤。孤孤", content: "进入了直播间", time: "刚刚" },
  { id: "2", user: "养诗弄了桃桃", content: "进入了直播间", time: "刚刚" },
  { id: "3", user: "养诗弄了桃桃", content: "进入了直播间", time: "刚刚" },
  { id: "4", user: "sidclov...", content: "进入了直播间", time: "刚刚" },
  { id: "5", user: "司空以珊别离", content: "进入了直播间", time: "刚刚" },
  { id: "6", user: "时孤晴", content: "进入了直播间", time: "刚刚" },
  { id: "7", user: "时孤晴", content: "进入了直播间", time: "刚刚" },
  { id: "8", user: "kiζ棒棒龍", content: "进入了直播间", time: "刚刚" },
  { id: "9", user: "司马诗珊_花凋", content: "进入了直播间", time: "刚刚" },
  { id: "10", user: "司马诗珊_花凋", content: "进入了直播间", time: "刚刚" },
]);

const chatInput = ref("");
const chatContainer = ref<HTMLElement | null>(null);

const giftItems = [
  { id: "1", name: "魔法棒", icon: "✨", price: 1 },
  { id: "2", name: "玫瑰花", icon: "🌹", price: 10 },
  { id: "3", name: "小红包", icon: "🧧", price: 50 },
  { id: "4", name: "皇冠", icon: "👑", price: 100 },
  { id: "5", name: "跑车", icon: "🚗", price: 520 },
  { id: "6", name: "热气球", icon: "🎈", price: 1314 },
];

const rankings = ref([
  { rank: 1, user: "一个小绵绵", days: 56, level: "V3" },
  { rank: 2, user: "小手胖呼呼", days: 28, level: "V1" },
  { rank: 3, user: "性感大蝴蝶", days: 78, level: "V3" },
]);

const currentRankingTab = ref("守护");
const rankingTabs = ["贡献日榜", "贡献周榜", "守护", "观众"];

function destroyHls() {
  if (hlsInstance) {
    try { hlsInstance.destroy(); } catch { /* ignore */ }
    hlsInstance = null;
  }
}

function initHls() {
  destroyHls();
  streamReady.value = false;
  streamError.value = false;
  const video = videoRef.value;
  if (!video || !currentRoom.value.roomUrl) return;
  
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = currentRoom.value.roomUrl;
    video.addEventListener("loadedmetadata", () => { 
      streamReady.value = true; 
      void video.play().catch(() => { /* autoplay blocked */ }); 
    }, { once: true });
    video.addEventListener("error", () => { streamError.value = true; }, { once: true });
    return;
  }
  
  if (!Hls.isSupported()) { 
    streamError.value = true; 
    return; 
  }
  
  hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 60 });
  hlsInstance.loadSource(currentRoom.value.roomUrl);
  hlsInstance.attachMedia(video);
  hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
    streamReady.value = true;
    void video.play().catch(() => { /* autoplay blocked */ });
  });
  hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
    if (data.fatal) streamError.value = true;
  });
}

function toggleFollow() {
  isFollowing.value = !isFollowing.value;
}

function sendChat() {
  if (!chatInput.value.trim()) return;
  chatMessages.value.push({
    id: String(Date.now()),
    user: "我",
    content: chatInput.value,
    time: "刚刚",
  });
  chatInput.value = "";
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

function sendGift(gift: typeof giftItems[0]) {
  chatMessages.value.push({
    id: String(Date.now()),
    user: "系统",
    content: `我 送出了 ${gift.icon} ${gift.name} x1`,
    time: "刚刚",
  });
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

onMounted(() => {
  nextTick(() => {
    initHls();
  });
});

onBeforeUnmount(() => {
  destroyHls();
});

defineExpose({ initHls });
</script>

<template>
  <section class="gamebox-main">
    <header class="live-room-header">
      <button class="back-btn" @click="emit('back')">←</button>
      <div class="header-title">
        <div class="streamer-info">
          <span class="streamer-avatar">{{ currentRoom.title.slice(0, 1) }}</span>
          <div class="streamer-details">
            <h2>{{ currentRoom.title }}</h2>
            <div class="streamer-meta">
              <span>{{ currentRoom.streamerName }}</span>
              <span class="live-status"><i></i> 正在直播</span>
              <span class="viewers">{{ currentRoom.viewers.toLocaleString() }} 人观看</span>
              <button class="follow-btn" :class="{ followed: isFollowing }" @click="toggleFollow">
                {{ isFollowing ? '✓ 已关注' : '+ 关注' }}
              </button>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn">分享</button>
          <button class="action-btn">举报</button>
        </div>
      </div>
      <div class="live-tabs">
        <button class="tab-btn active">96直播</button>
        <button class="tab-btn">传世</button>
        <button class="tab-btn">传奇3</button>
        <button class="tab-btn">美女</button>
      </div>
    </header>

    <main class="live-room-content">
      <div class="live-video-area">
        <div class="video-container">
          <video
            ref="videoRef"
            class="live-video"
            :muted="true"
            :autoplay="true"
            :loop="false"
            :playsinline="true"
            preload="auto"
          ></video>
          <div v-if="!streamReady && !streamError" class="video-placeholder">
            <div class="live-art" :style="{ '--live-accent': currentRoom.accent }">
              <div class="art-glow"></div>
              <div class="fake-character">⚔</div>
              <div class="fake-battle">✦　✧　✦</div>
              <div class="streamer-cam">
                <div class="cam-placeholder">
                  <span class="cam-icon">🎤</span>
                </div>
                <span class="streamer-name">{{ currentRoom.streamerName }}</span>
              </div>
              <div class="ad-banner">
                <span class="ad-title">开通金守护 300代币 专属称号 七日豪礼</span>
              </div>
              <div class="bottom-banner">
                <span class="game-logo">{{ currentRoom.gameName }}</span>
                <span class="game-desc">新颖题材 创新玩法 全新巨作</span>
              </div>
              <span class="live-game-label">LIVE · {{ currentRoom.gameName }}</span>
            </div>
          </div>
          <div v-if="streamError" class="stream-error">直播流加载失败</div>
        </div>
      </div>

      <aside class="live-chat-area">
        <div class="chat-header">
          <button 
            v-for="tab in rankingTabs" 
            :key="tab" 
            class="ranking-tab"
            :class="{ active: currentRankingTab === tab }"
            @click="currentRankingTab = tab"
          >
            {{ tab }}
            <span v-if="tab === '守护'" class="tab-count">(96)</span>
            <span v-if="tab === '观众'" class="tab-count">(137)</span>
          </button>
        </div>

        <div v-if="currentRankingTab === '守护'" class="ranking-list">
          <div v-for="item in rankings" :key="item.rank" class="ranking-item">
            <span class="rank-badge">{{ item.rank }}</span>
            <span class="rank-user">{{ item.user }}</span>
            <span class="rank-days">(已陪伴{{ item.days }}天)</span>
            <span class="rank-level">{{ item.level }}</span>
          </div>
          <button class="become-guard">开通守护</button>
        </div>

        <div v-else class="chat-messages" ref="chatContainer">
          <div class="welcome-message">
            欢迎光临{{ currentRoom.streamerName }}的直播间，如果喜欢请点击关注。96直播严禁未成年直播和充值消费，提倡理性消费。平台对直播内容24小时巡查，如发现任何违法违规、色情低俗、赌博诈骗等行为请及时举报。请勿相信各类卖金币、交易币、刷人气等广告信息，以免上当受骗！
          </div>
          <div v-for="msg in chatMessages" :key="msg.id" class="chat-message">
            <span class="msg-user">{{ msg.user }}:</span>
            <span class="msg-content">{{ msg.content }}</span>
          </div>
        </div>

        <div class="chat-input-area">
          <input 
            v-model="chatInput" 
            type="text" 
            class="chat-input" 
            placeholder="发个弹幕吧~"
            @keyup.enter="sendChat"
          />
          <button class="primary-button chat-send-btn" @click="sendChat">发送</button>
        </div>
      </aside>
    </main>

    <footer class="live-room-footer">
      <div class="gift-bar">
        <button 
          v-for="gift in giftItems" 
          :key="gift.id" 
          class="gift-item"
          @click="sendGift(gift)"
        >
          <span class="gift-icon">{{ gift.icon }}</span>
          <span class="gift-name">{{ gift.name }}</span>
        </button>
        <button class="more-gifts">‹</button>
      </div>
      <div class="footer-actions">
        <button class="action-icon">👑</button>
        <button class="action-icon">🎒</button>
        <button class="charge-btn">充值</button>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.gamebox-main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.live-room-header {
  background: rgba(13, 14, 19, .62);
  border-bottom: 1px solid #23242c;
  padding: 12px 32px;
}

.back-btn {
  background: transparent;
  color: #858791;
  font-size: 24px;
  line-height: 1;
  margin-right: 12px;
}

.back-btn:hover {
  color: #f4c94e;
}

.header-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.streamer-info {
  display: flex;
  gap: 12px;
}

.streamer-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(145deg, #463b25, #1d202b);
  color: #f2c956;
  display: grid;
  place-items: center;
  font-size: 20px;
  font-weight: 800;
}

.streamer-details h2 {
  margin: 0;
  font-size: 15px;
  color: #f7f4ed;
  font-weight: 600;
}

.streamer-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  font-size: 11px;
  color: #9899a3;
}

.live-status {
  color: #ef626a;
  font-size: 11px;
}

.live-status i {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 5px;
  border-radius: 50%;
  background: #ef626a;
}

.viewers {
  color: #858792;
  font-size: 11px;
}

.follow-btn {
  padding: 6px 10px;
  border-radius: 4px;
  background: #e8bd43;
  color: #17130c;
  font-weight: 700;
  font-size: 11px;
}

.follow-btn.followed {
  background: #374151;
  color: #f4c94e;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  background: transparent;
  color: #858791;
  font-size: 12px;
  padding: 4px 8px;
}

.action-btn:hover {
  color: #f4c94e;
}

.live-tabs {
  display: flex;
  gap: 38px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #23242c;
}

.tab-btn {
  position: relative;
  background: transparent;
  color: #868791;
  font-size: 14px;
  padding: 0;
}

.tab-btn:hover,
.tab-btn.active {
  color: #f5d254;
}

.tab-btn.active::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -12px;
  width: 30px;
  height: 2px;
  transform: translateX(-50%);
  background: #eac34a;
  box-shadow: 0 0 10px #eac34a;
}

.live-room-content {
  flex: 1;
  display: flex;
  min-height: 0;
}

.live-video-area {
  flex: 1;
  position: relative;
  background: #000;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.live-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}

.video-placeholder {
  position: absolute;
  inset: 0;
}

.live-art {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(circle at 65% 25%, color-mix(in srgb, var(--live-accent), transparent 30%), transparent 35%), linear-gradient(135deg, #172338, #05070c 78%);
}

.live-art::before,
.live-art::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
}

.live-art::before {
  width: 180px;
  height: 180px;
  right: 18%;
  top: 25%;
  background: color-mix(in srgb, var(--live-accent), transparent 45%);
  box-shadow: 0 0 80px 35px color-mix(in srgb, var(--live-accent), transparent 55%);
}

.live-art::after {
  inset: 0;
  background: repeating-linear-gradient(122deg, transparent 0 35px, rgba(255,255,255,.03) 36px 37px);
  transform: skewX(-20deg);
}

.art-glow {
  position: absolute;
  width: 90px;
  height: 140px;
  top: 78px;
  right: 29%;
  border-radius: 50% 50% 25% 25%;
  background: linear-gradient(90deg, #b3e6ff, #4d7cff 50%, #e6c96c);
  box-shadow: 0 0 30px #61b3ff;
  transform: rotate(20deg);
  opacity: .8;
  z-index: 1;
}

.fake-character {
  position: absolute;
  z-index: 1;
  right: 25%;
  top: 97px;
  color: #fff3c4;
  font-size: 72px;
  text-shadow: 0 0 16px #f1c75b;
}

.fake-battle {
  position: absolute;
  z-index: 2;
  right: 17%;
  top: 45%;
  color: #f7ce59;
  font-size: 25px;
  text-shadow: 0 0 10px #f00;
}

.streamer-cam {
  position: absolute;
  right: 20px;
  bottom: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  z-index: 3;
}

.cam-placeholder {
  width: 180px;
  height: 140px;
  border-radius: 8px;
  background: linear-gradient(145deg, #374151 0%, #1f2937 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #2d2e37;
}

.cam-icon {
  font-size: 40px;
}

.streamer-name {
  font-size: 12px;
  color: #f4c94e;
}

.ad-banner {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  z-index: 3;
}

.ad-title {
  display: block;
  padding: 10px 16px;
  background: linear-gradient(90deg, rgba(168, 85, 247, 0.9), rgba(139, 92, 246, 0.9));
  border-radius: 4px;
  color: white;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
}

.bottom-banner {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 3;
}

.game-logo {
  font-size: 24px;
  font-weight: bold;
  color: #fcd34d;
  text-shadow: 0 0 10px rgba(252, 211, 77, 0.5);
}

.game-desc {
  font-size: 14px;
  color: #fff;
}

.live-game-label {
  position: absolute;
  z-index: 3;
  top: 14px;
  left: 16px;
  padding: 4px 8px;
  border-radius: 3px;
  background: rgba(0,0,0,.55);
  color: #e2bb55;
  font-size: 10px;
}

.stream-error {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #a87a7a;
  font-size: 12px;
  background: rgba(0,0,0,.6);
}

.live-chat-area {
  width: 320px;
  flex: 0 0 320px;
  background: #1a1b22;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #23242c;
}

.chat-header {
  display: flex;
  border-bottom: 1px solid #23242c;
}

.ranking-tab {
  flex: 1;
  background: transparent;
  color: #868791;
  font-size: 12px;
  padding: 10px 4px;
  border-bottom: 2px solid transparent;
  transition: .2s;
}

.ranking-tab:hover,
.ranking-tab.active {
  color: #f5d254;
  border-bottom-color: #eac34a;
}

.tab-count {
  color: #666;
  margin-left: 4px;
}

.ranking-list {
  padding: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #282a33;
}

.rank-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(145deg, #fcd34d, #f59e0b);
  color: #1a1a24;
  font-size: 10px;
  font-weight: bold;
  display: grid;
  place-items: center;
}

.rank-user {
  flex: 1;
  font-size: 12px;
  color: #f7f4ed;
}

.rank-days {
  font-size: 10px;
  color: #848691;
}

.rank-level {
  font-size: 10px;
  color: #f4c94e;
}

.become-guard {
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  background: #e8bd43;
  color: #17130c;
  font-size: 12px;
  font-weight: 700;
  border-radius: 5px;
}

.chat-messages {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.welcome-message {
  font-size: 10px;
  color: #848691;
  line-height: 1.6;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(26,27,34,.85);
  border-radius: 4px;
}

.chat-message {
  margin-bottom: 8px;
  font-size: 12px;
}

.msg-user {
  color: #f4c94e;
  margin-right: 6px;
}

.msg-content {
  color: #c9cbce;
}

.chat-input-area {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #23242c;
}

.chat-input {
  flex: 1;
  padding: 8px 12px;
  background: #191a20;
  border: 1px solid #2d2e37;
  border-radius: 8px;
  color: #eee;
  font-size: 12px;
  outline: none;
}

.chat-send-btn {
  padding: 8px 16px;
}

.primary-button {
  padding: 10px 16px;
  border-radius: 5px;
  background: #e8bd43;
  color: #17130c;
  font-weight: 700;
  font-size: 12px;
}

.live-room-footer {
  background: rgba(13, 14, 19, .62);
  border-top: 1px solid #23242c;
  padding: 10px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gift-bar {
  display: flex;
  gap: 16px;
}

.gift-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  color: #f7f4ed;
}

.gift-icon {
  font-size: 24px;
}

.gift-name {
  font-size: 10px;
  color: #858792;
}

.more-gifts {
  background: transparent;
  color: #858792;
  font-size: 20px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-icon {
  background: transparent;
  font-size: 24px;
  color: #858792;
}

.action-icon:hover {
  color: #f4c94e;
}

.charge-btn {
  padding: 8px 20px;
  background: #e8bd43;
  color: #17130c;
  font-size: 12px;
  font-weight: 700;
  border-radius: 5px;
}
</style>