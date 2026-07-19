# 首页后端接口契约

首页建议由一个聚合接口返回首屏所需数据，避免客户端并发请求多个模块导致首屏闪烁。所有响应使用统一结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "requestId": "req_01JXYZ"
}
```

## 1. 获取首页聚合数据

```http
GET /api/v1/client/home/feed?channel=recommend&page=1&pageSize=20
Authorization: Bearer <accessToken>
X-Request-Id: <clientRequestId>
```

未登录时允许不携带 `Authorization`；服务端根据登录态决定是否返回关注内容、会员活动和个性化推荐。

### 响应

```json
{
  "code": 0,
  "message": "ok",
  "requestId": "req_01JXYZ",
  "data": {
    "channel": "recommend",
    "liveRooms": [],
    "newServers": [],
    "games": [],
    "banners": [],
    "taskUnreadCount": 3,
    "messageUnreadCount": 2,
    "serverTime": "2026-07-19T12:00:00Z"
  }
}
```

## 2. 数据结构

### `liveRooms`

```json
{
  "id": "live_1001",
  "title": "冰雪传奇·新区冲榜",
  "streamer": {
    "id": "user_1001",
    "name": "主播名称",
    "avatarUrl": "https://cdn.example.com/avatar.jpg"
  },
  "gameId": "game_1001",
  "gameName": "冰雪传奇",
  "serverId": "server_2001",
  "serverName": "火龙一区",
  "coverUrl": "https://cdn.example.com/live-cover.jpg",
  "status": "live",
  "viewerCount": 1280,
  "roomUrl": "/live/live_1001",
  "tags": ["新区", "冲榜"]
}
```

`status` 可取：`live`、`upcoming`、`replay`、`offline`。

### `newServers`

```json
{
  "id": "server_2001",
  "gameId": "game_1001",
  "gameName": "冰雪传奇",
  "name": "龙腾天下·一区",
  "openAt": "2026-07-19T12:00:00Z",
  "status": "opening_soon",
  "onlineCount": 0,
  "onlineLabel": "预约中",
  "tags": ["首充双倍", "上线送VIP"],
  "launchable": false
}
```

`status` 使用计划中的服务端枚举：`preview`、`opening_soon`、`normal`、`hot`、`full`、`maintenance`、`closed`。

### `games`

```json
{
  "id": "game_1001",
  "name": "冰雪传奇",
  "subtitle": "打金爆神装，自由交易",
  "iconUrl": "https://cdn.example.com/game-icon.png",
  "coverUrl": "https://cdn.example.com/game-cover.jpg",
  "genre": "冰雪版本",
  "onlineCount": 128000,
  "onlineLabel": "12.8万人在玩",
  "status": "online",
  "isNew": true,
  "tags": ["热门", "新服"]
}
```

### `banners`

```json
{
  "id": "banner_3001",
  "eyebrow": "新区福利",
  "title": "龙腾天下·今晚20:00开服",
  "description": "预约新区，领取开服礼包",
  "imageUrl": "https://cdn.example.com/banner.jpg",
  "mobileImageUrl": "https://cdn.example.com/banner-mobile.jpg",
  "actionLabel": "立即预约",
  "actionType": "server",
  "actionTarget": { "gameId": "game_1001", "serverId": "server_2001" },
  "startsAt": "2026-07-19T00:00:00Z",
  "expiresAt": "2026-07-20T00:00:00Z",
  "sort": 10
}
```

`actionType` 建议支持：`game`、`server`、`live`、`article`、`url`、`vip`、`lottery`。

## 3. 首页交互接口

### 搜索

```http
GET /api/v1/client/search?q=冰雪&type=all&page=1&pageSize=10
```

`type`：`all`、`game`、`live`、`server`、`gift`、`article`。

### 记录首页行为

```http
POST /api/v1/client/ads/events
Authorization: Bearer <accessToken>
Idempotency-Key: <stableEventKey>
Content-Type: application/json
```

```json
{
  "eventType": "banner_click",
  "resourceType": "banner",
  "resourceId": "banner_3001",
  "channel": "recommend",
  "position": "home_hero_right",
  "occurredAt": "2026-07-19T12:00:00Z"
}
```

`eventType` 建议支持：`impression`、`click`、`live_enter`、`game_click`、`server_click`、`banner_click`。

### 领取任务红点

首页只读取摘要，详情使用：

```http
GET /api/v1/client/tasks/unread-count
GET /api/v1/client/messages/unread-count
```

返回：

```json
{ "code": 0, "message": "ok", "data": { "count": 3 }, "requestId": "req_01JXYZ" }
```

## 4. 错误处理约定

- `40100`：Token 失效，允许刷新 Token；匿名首页可降级为公开数据。
- `40401`：Banner、直播间或区服已下线，客户端移除卡片并重新拉取。
- `42900`：请求过于频繁，按 `retryAfter` 倒计时后重试。
- `90001`：服务端异常，保留页面骨架并展示“重新加载”。

客户端必须保留响应中的 `requestId`，写入前端错误上报和下载/启动事件，不得记录 Token、身份证或启动票据。
