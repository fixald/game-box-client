<script setup lang="ts">
import { computed, ref } from "vue";
import { clearSearchHistory, getSearchHistory, popularSearches, sanitizeSearchQuery, saveSearchHistory } from "../../utils/search";
import { search as searchApi, saveSearchHistoryRemote, type SearchResultItem, type SearchType } from "../../api/search";

const keyword = ref(new URLSearchParams(window.location.hash.split("?")[1] || "").get("q") || "");
const submitted = ref(keyword.value.trim());
const history = ref(getSearchHistory());
const loading = ref(false);
const error = ref("");
const types = ["全部", "游戏", "直播", "新服", "礼包", "资讯"] as const;
const activeType = ref<(typeof types)[number]>("全部");
const allResults = ref<SearchResultItem[]>([]);
const typeMap: Record<(typeof types)[number], SearchType> = { 全部: "all", 游戏: "game", 直播: "live", 新服: "server", 礼包: "gift", 资讯: "article" };
const results = computed(() => allResults.value.filter((item) => activeType.value === "全部" || item.type === typeMap[activeType.value]));
let requestSerial = 0;
let requestController: AbortController | null = null;

function search(value = keyword.value) {
  const next = sanitizeSearchQuery(value);
  if (next.length < 2) { error.value = "请输入至少 2 个字符"; return; }
  const serial = ++requestSerial;
  requestController?.abort();
  const controller = new AbortController();
  requestController = controller;
  loading.value = true; error.value = ""; submitted.value = next; keyword.value = next;
  searchApi(next, typeMap[activeType.value], 1, 20, controller.signal).then((response) => {
    if (serial !== requestSerial) return;
    allResults.value = response.items; history.value = saveSearchHistory(next); void saveSearchHistoryRemote(next).catch(() => undefined); window.location.hash = `#/search?q=${encodeURIComponent(next)}`;
  }).catch((reason) => { if (reason?.name !== "AbortError" && serial === requestSerial) error.value = "搜索失败，请稍后重试"; }).finally(() => { if (serial === requestSerial) loading.value = false; });
}
function submitSearch() { search(); }
function handleEnter() { search(); }
function choose(value: string) { keyword.value = value; search(value); }
function goHome() { window.location.hash = ""; }
function clearHistory() { clearSearchHistory(); history.value = []; }
if (keyword.value.length >= 2) search(keyword.value);
</script>
<template>
  <div class="search-page">
    <header class="search-header"><button class="back" @click="goHome">← 返回首页</button><div class="search-form"><button aria-label="搜索" @click="submitSearch">⌕</button><input v-model="keyword" autofocus placeholder="搜索游戏 / 主播 / 区服 / 礼包" @keyup.enter="handleEnter" /><span v-if="loading" class="loading-dot">搜索中…</span></div></header>
    <main class="search-content">
      <section v-if="!submitted" class="search-discovery"><div class="search-block"><div class="block-title"><h2>搜索历史</h2><button v-if="history.length" @click="clearHistory">清空</button></div><div v-if="history.length" class="chips"><button v-for="item in history" :key="item" @click="choose(item)">{{ item }}</button></div><p v-else class="muted">暂无搜索记录</p></div><div class="search-block"><div class="block-title"><h2>热门搜索</h2></div><div class="chips hot"><button v-for="item in popularSearches" :key="item" @click="choose(item)">{{ item }}</button></div></div></section>
      <section v-else><div class="result-heading"><div><span>搜索结果</span><h1>“{{ submitted }}”</h1></div><strong v-if="!loading">{{ results.length }} 条结果</strong></div><nav class="type-tabs"><button v-for="type in types" :key="type" :class="{ active: activeType === type }" @click="activeType = type">{{ type }}</button></nav><div v-if="error" class="state error">{{ error }}</div><div v-else-if="loading" class="state">正在搜索…</div><div v-else-if="results.length" class="results"><button v-for="item in results" :key="item.id" class="result-card"><span class="result-icon">{{ item.title.slice(0, 1) }}</span><span><b>{{ item.title }}</b><small>{{ item.type }} · {{ item.subtitle }}</small></span><i>→</i></button></div><div v-else class="state">没有找到相关结果，换个关键词试试</div></section>
    </main>
  </div>
</template>
<style scoped>
:global(*){box-sizing:border-box}:global(body){margin:0;background:#111217;color:#f5f1e9;font-family:Inter,"PingFang SC","Microsoft YaHei",sans-serif}button,input{font:inherit}.search-page{min-height:100vh;background:radial-gradient(circle at 75% 0,#282329 0,#111217 43%,#0c0d11 100%)}.search-header{height:78px;padding:0 46px;display:flex;align-items:center;gap:34px;border-bottom:1px solid #292a32}.back{color:#c7a94e;background:transparent;font-size:13px}.search-form{width:min(600px,60vw);height:42px;display:flex;align-items:center;gap:10px;padding:0 14px;border:1px solid #65552e;border-radius:8px;background:#191a20}.search-form button{color:#e5bf52;background:transparent;font-size:22px}.search-form input{flex:1;min-width:0;border:0;outline:0;color:#fff;background:transparent}.loading-dot{color:#888;font-size:11px}.search-content{max-width:980px;margin:auto;padding:58px 34px}.search-block{margin-bottom:48px}.block-title,.result-heading{display:flex;justify-content:space-between;align-items:end}.block-title h2{margin:0;font-size:20px}.block-title button{color:#888;background:transparent;font-size:12px}.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.chips button{padding:10px 16px;border:1px solid #30323b;border-radius:6px;color:#b7b7bf;background:#1a1b22}.chips button:hover,.chips.hot button:hover{color:#f0ca5c;border-color:#755f2e}.chips.hot button{color:#d5b453}.muted,.state{color:#80828d;font-size:13px}.result-heading span{color:#c7a94e;font-size:12px}.result-heading h1{margin:8px 0 0;font-size:30px}.result-heading strong{color:#858792;font-size:12px}.type-tabs{display:flex;gap:26px;margin:38px 0 16px;border-bottom:1px solid #292b33}.type-tabs button{padding:0 0 12px;color:#858792;background:transparent;border-bottom:2px solid transparent;font-size:13px}.type-tabs button.active{color:#f0ca5c;border-color:#e0b947}.results{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.result-card{display:flex;align-items:center;gap:14px;padding:18px;text-align:left;border:1px solid #2b2d36;border-radius:8px;color:#eee;background:#1a1b22}.result-card:hover{border-color:#75612f;transform:translateY(-1px)}.result-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:9px;color:#f0ce64;background:#302b1e;font-size:20px;font-weight:800}.result-card span:nth-child(2){display:flex;flex:1;flex-direction:column;gap:6px}.result-card small{color:#888a94;font-size:11px}.result-card i{color:#d6b44d;font-style:normal}.state{padding:58px;text-align:center;border:1px dashed #343641;border-radius:8px}.error{color:#e87d7f}@media(max-width:680px){.search-header{padding:0 16px;gap:14px}.back{font-size:11px}.search-form{width:100%}.search-content{padding:35px 16px}.results{grid-template-columns:1fr}.result-heading h1{font-size:23px}}
</style>
<style scoped>
.search-content{max-width:1250px;padding-left:48px;padding-right:48px}.back,.search-form button,.type-tabs button{appearance:none;-webkit-appearance:none;outline:0}
.back{display:inline-flex;align-items:center;justify-content:center;min-width:102px;height:34px;padding:0 14px;border:1px solid #3b3d46;border-radius:6px;color:#b7b8c0;background:rgba(25,26,32,.72);font-size:12px;transition:.2s}.back:hover{color:#f0ca5c;border-color:#8a6d2d;background:#25231d}
.search-form button{width:28px;height:28px;flex:0 0 28px;padding:0;border:0;border-radius:5px;color:#d9b84e;background:transparent;line-height:1;cursor:pointer}.search-form button:hover{color:#ffe27a;background:rgba(224,187,72,.12)}
.type-tabs{gap:8px;padding-left:2px}.type-tabs button{position:relative;padding:9px 14px 11px;border:1px solid transparent;border-radius:5px 5px 0 0;color:#858792;background:transparent;cursor:pointer;transition:.2s}.type-tabs button:hover{color:#ded18f;background:rgba(255,255,255,.04)}.type-tabs button.active{color:#f0ca5c;background:rgba(224,187,72,.08);border-color:#a27f2b;border-bottom-color:#e0b947;box-shadow:0 -2px 12px rgba(224,187,72,.08)}
.results{gap:16px}.result-card{min-height:92px;padding:20px}.result-icon{width:46px;height:46px;flex-basis:46px;font-size:22px}.result-card b{font-size:15px}.result-card small{font-size:12px}
</style>
