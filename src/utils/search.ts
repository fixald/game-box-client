export interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  type: "游戏" | "直播" | "新服" | "礼包" | "资讯";
  keywords: string;
}

export const popularSearches = ["冰雪传奇", "新服", "首充双倍", "传奇世界", "小眼睛"];
export const SEARCH_MAX_LENGTH = 30;

const synonyms: Record<string, string[]> = {
  新服: ["新区", "开服", "预约"],
  新区: ["新服", "开服", "预约"],
  礼包: ["福利", "奖励", "首充"],
  主播: ["直播", "房间"],
  游戏: ["传奇", "手游"],
  热门: ["火爆", "推荐"],
};

const pinyin: Record<string, string> = {
  冰: "bing", 雪: "xue", 传: "chuan", 奇: "qi", 复: "fu", 古: "gu", 世: "shi", 界: "jie",
  小: "xiao", 眼: "yan", 睛: "jing", 战: "zhan", 阿: "a", 杰: "jie", 龙: "long",
  腾: "teng", 天: "tian", 下: "xia", 一: "yi", 区: "qu", 沙: "sha", 城: "cheng", 争: "zheng",
  霸: "ba", 首: "shou", 充: "chong", 双: "shuang", 倍: "bei", 新: "xin", 服: "fu", 礼: "li",
  包: "bao", 打: "da", 金: "jin", 神: "shen", 装: "zhuang", 自: "zi", 由: "you", 经: "jing",
  典: "dian", 三: "san", 职: "zhi", 业: "ye", 热: "re", 血: "xue", 攻: "gong", 国: "guo",
  万: "wan", 人: "ren", 兄: "xiong", 弟: "di", 集: "ji", 结: "jie", 直: "zhi", 播: "bo",
};

export function sanitizeSearchQuery(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").replace(/[<>`\\]/g, "").replace(/\s+/g, " ").trim().slice(0, SEARCH_MAX_LENGTH);
}

function toPinyin(value: string): string {
  return [...value].map((char) => pinyin[char] || char).join(" ").replace(/\s+/g, " ").trim();
}

function queryTerms(value: string): string[] {
  const query = sanitizeSearchQuery(value).toLowerCase();
  const terms = new Set<string>([query, ...query.split(/\s+/).filter(Boolean)]);
  for (const term of [...terms]) (synonyms[term] || []).forEach((item) => terms.add(item));
  return [...terms];
}

function matches(item: SearchItem, value: string): boolean {
  const terms = queryTerms(value);
  const pinyinText = `${toPinyin(item.title)} ${toPinyin(item.subtitle)}`;
  const searchable = `${item.title} ${item.subtitle} ${item.keywords} ${pinyinText} ${pinyinText.replace(/\s/g, "")}`.toLowerCase();
  return terms.some((term) => searchable.includes(term) || [...term].some((char) => searchable.includes(char) && char.length === 1 && /[\u4e00-\u9fff]/.test(char)));
}

export const searchCatalog: SearchItem[] = [
  { id: "game-1", title: "冰雪传奇", subtitle: "打金爆神装，自由交易 · 冰雪版本", type: "游戏", keywords: "冰雪传奇 打金 神装 自由交易 冰雪版本" },
  { id: "game-2", title: "复古传奇", subtitle: "经典三职业，热血攻沙 · 复古版本", type: "游戏", keywords: "复古传奇 三职业 热血攻沙 复古版本" },
  { id: "game-3", title: "传奇世界", subtitle: "万人国战，兄弟集结 · MMORPG", type: "游戏", keywords: "传奇世界 万人国战 MMORPG" },
  { id: "live-1", title: "小眼睛", subtitle: "冰雪传奇 · 新区冲榜，首充送神装", type: "直播", keywords: "小眼睛 冰雪传奇 新区 冲榜 直播" },
  { id: "live-2", title: "战神阿杰", subtitle: "复古传奇 · 极品装备爆不停", type: "直播", keywords: "战神阿杰 复古传奇 装备 直播" },
  { id: "server-1", title: "龙腾天下·一区", subtitle: "冰雪传奇 · 预约中", type: "新服", keywords: "龙腾天下 一区 冰雪传奇 新服 预约" },
  { id: "server-2", title: "沙城争霸·108服", subtitle: "复古传奇 · 火爆", type: "新服", keywords: "沙城争霸 108服 复古传奇 火爆 新服" },
  { id: "gift-1", title: "首充双倍礼包", subtitle: "预约新区即可领取", type: "礼包", keywords: "首充双倍 礼包 新区 预约" },
  { id: "article-1", title: "新区开服攻略：快速领取首充奖励", subtitle: "新手攻略 · 传奇玩法资讯", type: "资讯", keywords: "新区 开服 攻略 首充 奖励 资讯" },
];

export function searchCatalogAsync(query: string, signal?: AbortSignal): Promise<SearchItem[]> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("请求已取消", "AbortError"));
    const timer = window.setTimeout(() => {
      if (signal?.aborted) return reject(new DOMException("请求已取消", "AbortError"));
      const normalized = sanitizeSearchQuery(query);
      resolve(searchCatalog.filter((item) => matches(item, normalized)));
    }, 120);
    signal?.addEventListener("abort", () => { window.clearTimeout(timer); reject(new DOMException("请求已取消", "AbortError")); }, { once: true });
  });
}

const HISTORY_KEY = "gamebox_search_history";
export function getSearchHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
export function saveSearchHistory(keyword: string) {
  const next = [keyword, ...getSearchHistory().filter((item) => item !== keyword)].slice(0, 8);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}
export function clearSearchHistory() { localStorage.removeItem(HISTORY_KEY); }
