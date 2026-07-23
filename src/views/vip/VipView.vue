<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getCurrentAccountInfo } from "../../api/account";
import { getVipLevels, type VipLevel } from "../../api/vip";
import { getCurrentAccount } from "../../utils/auth";

const navItems = [
  { icon: "⌂", label: "首页" }, { icon: "▶", label: "直播" }, { icon: "◉", label: "游戏" },
  { icon: "✓", label: "任务" }, { icon: "S", label: "SVIP" },
];
const currentAccount = ref(getCurrentAccount());

const levels = ref<VipLevel[]>([]);
const currentIndex = ref(0);
const currentLevel = computed(() => levels.value[currentIndex.value]);
const currentGrowth = ref(0);
const growthTarget = computed(() => levels.value[currentIndex.value + 1]?.growth ?? currentLevel.value?.growth ?? 0);
const expiresAt = ref<string | null>(null);
const loading = ref(true);
const loadError = ref("");
const perks = [
  { icon: "▣", title: "积分福利", description: "兑换好礼" },
  { icon: "▤", title: "云手机福利", description: "云手机免费用" },
  { icon: "▧", title: "客服权益", description: "高级客服通道" },
  { icon: "▥", title: "交易优惠", description: "交易手续费减免" },
  { icon: "♕", title: "提现福利", description: "提现手续费减免" },
];

function selectLevel(step: number) {
  currentIndex.value = Math.min(levels.value.length - 1, Math.max(0, currentIndex.value + step));
}

function goHome() {
  window.location.hash = "";
}

function navigate(label: string) {
  if (label === "首页") window.location.hash = "";
  else if (label === "游戏") window.location.hash = "#/games";
  else if (label === "任务") window.location.hash = "#/tasks";
  else if (label === "SVIP") window.location.hash = "#/vip";
}

function goAccount() { window.location.hash = "#/account"; }
function logout() { window.location.hash = "#/login"; }

function formatDate(value: string | null) {
  if (!value) return "长期有效";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

async function loadVipInfo() {
  loading.value = true;
  loadError.value = "";
  try {
    const [response, levelResponse] = await Promise.all([getCurrentAccountInfo(), getVipLevels()]);
    levels.value = [...levelResponse.levels].sort((a, b) => a.growth - b.growth);
    if (!levels.value.length) throw new Error("暂无SVIP等级配置");
    const vip = response.user?.vip;
    currentGrowth.value = Number(vip?.growthValue ?? 0);
    const matchedIndex = levels.value.reduce((matched, level, index) => level.growth <= currentGrowth.value ? index : matched, 0);
    currentIndex.value = matchedIndex;
    expiresAt.value = vip?.expiresAt ?? null;
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : "SVIP信息加载失败";
  } finally {
    loading.value = false;
  }
}

onMounted(loadVipInfo);
</script>

<template>
  <div class="gamebox-shell">
    <aside class="gamebox-sidebar">
      <div class="brand"><span class="brand-mark">game</span><span>盒子</span></div>
      <nav class="side-nav" aria-label="主导航">
        <button v-for="item in navItems" :key="item.label" class="side-item" :class="{ active: item.label === 'SVIP' }" @click="navigate(item.label)"><span class="side-icon">{{ item.icon }}</span><span>{{ item.label }}</span></button>
      </nav>
      <div class="sidebar-footer"><button class="side-item" @click="navigate('设置')"><span class="side-icon">⚙</span><span>设置</span></button></div>
    </aside>
    <section class="gamebox-main">
      <header class="topbar">
        <div class="window-actions"><button aria-label="返回首页" @click="goHome">‹</button><button aria-label="刷新" @click="loadVipInfo">↻</button></div>
        <div class="user-actions"><button class="message-button" aria-label="消息">♢</button><button class="account-button" aria-label="个人中心" @click="goAccount"><span class="avatar">{{ currentAccount.slice(0, 1).toUpperCase() }}</span></button><button class="logout-button" @click="logout">退出</button></div>
      </header>
      <main class="vip-page">
    <section class="vip-hero">
      <div class="stars"></div>
      <div v-if="currentLevel" class="level-track">
        <div class="track-line"></div>
        <button v-for="(level, index) in levels" :key="level.name" class="level-node" :class="{ active: index === currentIndex }" :style="{ left: `${18 + index * (64 / Math.max(1, levels.length - 1))}%` }" @click="currentIndex = index">
          <strong>{{ level.name }}</strong><span>{{ index === currentIndex ? level.requirement : "" }}</span><i></i>
        </button>
      </div>
      <button class="level-arrow previous" aria-label="上一级" @click="selectLevel(-1)">‹</button>
      <article v-if="currentLevel" class="level-card">
        <div><h1>{{ currentLevel.name }}会员</h1><p>{{ loading ? "正在加载会员信息…" : `成长值 ${currentGrowth} / ${growthTarget}，有效期至 ${formatDate(expiresAt)}` }}</p><div class="progress"><span :style="{ width: `${Math.min(100, (currentGrowth / growthTarget) * 100)}%` }"></span></div></div>
        <div class="vip-emblem">♕</div>
      </article>
      <button class="level-arrow next" aria-label="下一级" @click="selectLevel(1)">›</button>
      <div class="notice">♬　{{ loadError || currentLevel?.desc || "升级至该等级可解锁专属权益" }}</div>
    </section>

    <section class="benefits">
      <div class="benefit-header"><div><span>SVIP PRIVILEGES</span><h2>{{ currentLevel?.name || (loading ? "SVIP等级权益加载中" : "SVIP等级权益") }}</h2></div><button @click="selectLevel(1)">查看等级说明　›</button></div>
      <div class="benefit-grid">
        <article class="benefit-card featured"><h3>区服福利</h3><p>现已支持1827个区服礼包及属性权益</p><button>区服礼包 <b>♜</b></button><button>属性特权 <b>✪</b></button></article>
        <article class="benefit-card"><h3>盒子福利</h3><div class="perk-list"><div v-for="perk in perks.slice(0, 3)" :key="perk.title"><i>{{ perk.icon }}</i><strong>{{ perk.title }}</strong><small>{{ perk.description }}</small></div></div></article>
        <article class="benefit-card"><h3>交易行福利</h3><div class="perk-list"><div v-for="perk in perks.slice(3)" :key="perk.title"><i>{{ perk.icon }}</i><strong>{{ perk.title }}</strong><small>{{ perk.description }}</small></div></div></article>
      </div>
    </section>
      </main>
    </section>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }
.gamebox-shell { min-height: 100vh; display: flex; background: #f6f6f6; }.gamebox-sidebar { width: 104px; flex: 0 0 104px; background: rgba(13, 14, 19, .98); color: #777984; display: flex; flex-direction: column; align-items: center; padding: 20px 10px 15px; }.brand { color: #f4c94e; font-weight: 800; font-size: 12px; display: flex; flex-direction: column; align-items: center; gap: 3px; letter-spacing: 1px; }.brand-mark { font-size: 18px; line-height: 17px; font-style: italic; }.side-nav { width: 100%; margin-top: 28px; display: flex; flex-direction: column; gap: 6px; }.side-item { position: relative; width: 100%; min-height: 53px; border: 0; border-radius: 10px; background: transparent; color: #777984; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 11px; cursor: pointer; }.side-item:hover, .side-item.active { color: #f4c94e; background: linear-gradient(145deg, rgba(244, 201, 78, .2), rgba(244, 201, 78, .04)); }.side-icon { height: 19px; font-size: 18px; line-height: 19px; }.sidebar-footer { margin-top: auto; width: 100%; }.gamebox-main { min-width: 0; flex: 1; }.topbar { height: 64px; padding: 0 32px; border-bottom: 1px solid #23242c; display: flex; align-items: center; gap: 28px; color: #858791; background: rgba(13, 14, 19, .96); }.window-actions { display: flex; gap: 14px; }.window-actions button { border: 0; color: #858791; background: transparent; font-size: 24px; cursor: pointer; }.search-box { width: min(360px, 35vw); height: 34px; padding: 0 10px; display: flex; align-items: center; gap: 8px; border: 1px solid #2d2e37; border-radius: 8px; color: #73757f; background: #191a20; font-size: 12px; }.search-box span:nth-child(2) { flex: 1; }.search-box kbd { color: #5d606c; font-size: 10px; }.user-actions { margin-left: auto; display: flex; align-items: center; gap: 18px; }.message-button, .account-button, .logout-button { border: 0; background: transparent; cursor: pointer; }.message-button { color: #8d8e98; font-size: 22px; }.account-button .avatar { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid #4b4e5a; border-radius: 50%; color: #f2d36b; background: #30323b; }.logout-button { padding: 6px 9px; border: 1px solid #383a44; border-radius: 4px; color: #8f919b; font-size: 10px; }
.vip-page { min-height: 100vh; color: #20232b; background: #f6f6f6; font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif; }
.vip-hero { position: relative; height: 430px; overflow: hidden; color: #d4d9e4; background: radial-gradient(circle at 50% 45%, #26252c 0, #15151d 42%, #101017 100%); }
.stars, .stars::before, .stars::after { position: absolute; inset: 0; content: ""; background-image: radial-gradient(#988d70 1px, transparent 1.5px), radial-gradient(#3e4050 1px, transparent 1.5px); background-size: 183px 137px, 257px 191px; opacity: .28; }
.stars::before { transform: translate(47px, 29px); opacity: .2; }.stars::after { transform: translate(-63px, 71px); opacity: .15; }
.level-track { position: absolute; top: 88px; left: 20%; width: 60%; height: 80px; }
.track-line { position: absolute; top: 0; left: 0; width: 100%; height: 3px; border-radius: 50%; background: linear-gradient(90deg, transparent, #9a7448 20%, #8d6a47 65%, transparent); transform: rotate(-1deg); box-shadow: 0 0 18px #76572e; }
.level-node { position: absolute; top: -16px; display: flex; flex-direction: column; align-items: center; gap: 9px; border: 0; background: transparent; color: #696b7c; font-size: 12px; transform: translateX(-50%); cursor: pointer; }.level-node strong { order: 0; }.level-node span { position: absolute; top: 28px; white-space: nowrap; color: #d5d9e5; font-size: 15px; font-weight: 700; }.level-node i { order: 1; width: 12px; height: 12px; border: 2px solid #60606a; border-radius: 50%; background: #34343b; }.level-node.active { color: #dbe1ee; }.level-node.active i { width: 14px; height: 14px; border-color: #eee; background: #9da5b2; box-shadow: 0 0 0 2px #56545a; }
.level-card { position: absolute; top: 151px; left: 50%; display: flex; justify-content: space-between; width: 400px; min-height: 168px; padding: 26px 20px; border: 1px solid #735634; border-radius: 8px; background: linear-gradient(145deg, rgba(92,68,43,.82), rgba(27,27,32,.96) 68%); transform: translateX(-50%); box-shadow: 0 14px 35px rgba(0,0,0,.25); }.level-card h1 { display: inline; margin: 0 8px 0 0; color: #f4f0e9; font-size: 17px; }.level-mark { color: #f5f0e6; font-weight: 800; }.level-card p { margin: 30px 0 20px; color: #c3c0bf; font-size: 12px; }.progress { width: 158px; height: 4px; border-radius: 2px; background: #343740; }.progress span { display: block; height: 100%; border-radius: inherit; background: #b9935c; }.vip-emblem { align-self: flex-start; color: #e8cc91; font-size: 59px; line-height: 1; text-shadow: 0 0 12px #9b7440; }.level-arrow { position: absolute; top: 215px; z-index: 1; width: 40px; height: 40px; border: 0; border-radius: 50%; color: #e4e5eb; background: #303139; font-size: 30px; line-height: 30px; cursor: pointer; }.level-arrow.previous { left: 21%; }.level-arrow.next { right: 21%; }.notice { position: absolute; top: 330px; left: 50%; width: 376px; padding: 9px 13px; border-radius: 3px; color: #c7cad3; background: #191a20; font-size: 11px; transform: translateX(-50%); }
.benefits { max-width: 1010px; margin: 0 auto; padding: 40px 0 80px; }.benefit-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }.benefit-header span { color: #9b7c4e; font-size: 10px; letter-spacing: 2px; }.benefit-header h2 { margin: 6px 0 0; font-size: 25px; }.benefit-header button { border: 0; color: #777a80; background: transparent; cursor: pointer; }.benefit-grid { display: grid; grid-template-columns: 1fr 1.35fr 1.35fr; gap: 16px; }.benefit-card { min-height: 170px; padding: 18px 16px; border-radius: 8px; background: white; }.benefit-card h3 { margin: 0 0 9px; font-size: 16px; }.benefit-card p { margin: 0 0 13px; color: #9b7f5b; font-size: 11px; }.featured { border: 1px solid #ecd8ae; background: #fff4d9; }.featured button { display: flex; justify-content: space-between; width: 100%; margin-top: 8px; padding: 11px 12px; border: 0; border-radius: 4px; color: #4e4c4a; background: white; text-align: left; }.featured b { color: #ebb65b; font-size: 20px; }.perk-list { display: flex; justify-content: space-around; gap: 15px; margin-top: 17px; }.perk-list div { display: flex; flex: 1; flex-direction: column; align-items: center; text-align: center; }.perk-list i { display: grid; place-items: center; width: 56px; height: 56px; margin-bottom: 9px; border-radius: 50%; color: #e4ad55; background: #fff3d9; font-size: 25px; font-style: normal; }.perk-list strong { font-size: 12px; font-weight: 500; white-space: nowrap; }.perk-list small { margin-top: 4px; color: #a6a6a6; font-size: 10px; white-space: nowrap; }
.back-button { position: absolute; top: 18px; left: 22px; z-index: 2; width: 34px; height: 34px; border: 0; border-radius: 50%; color: #ddd; background: #2c2d35; font-size: 26px; cursor: pointer; }
@media (max-width: 760px) { .gamebox-sidebar { width: 70px; flex-basis: 70px; }.brand { font-size: 8px; }.side-item { font-size: 9px; }.topbar { padding: 0 15px; gap: 10px; }.search-box { width: 100%; }.logout-button { display: none; }.vip-hero { height: 400px; }.level-track { left: 12%; width: 76%; }.level-card { width: min(400px, calc(100% - 100px)); }.level-arrow.previous { left: 4%; }.level-arrow.next { right: 4%; }.benefits { padding: 30px 16px; }.benefit-grid { grid-template-columns: 1fr; }.benefit-card { min-height: auto; }.benefit-header h2 { font-size: 21px; } }
</style>
<style scoped>
.gamebox-sidebar { min-height: 100vh; }
.gamebox-sidebar { position: sticky; top: 0; align-self: flex-start; height: 100vh; max-height: 100vh; overflow-y: auto; box-sizing: border-box; }
</style>
