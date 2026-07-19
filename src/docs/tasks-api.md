# 任务中心后端 API 契约

所有接口使用统一响应格式：

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "requestId": "req_01JXYZ"
}
```

写接口必须携带稳定的 `Idempotency-Key`，网络重试不得生成重复奖励。

## 1. 获取任务中心数据

```http
GET /api/v1/client/tasks?category=all&date=2026-07-19
Authorization: Bearer <accessToken>
X-Request-Id: <clientRequestId>
```

请求参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `category` | string | 否 | `all/daily/newbie/game/social`，默认 `all` |
| `date` | string | 否 | `YYYY-MM-DD`，用于任务日切换 |

返回：

```json
{
  "code": 0,
  "message": "ok",
  "requestId": "req_tasks_001",
  "data": {
    "summary": {
      "points": 1280,
      "continuousCheckinDays": 6,
      "totalCompleted": 18,
      "claimableCount": 2,
      "checkin": {
        "checkedToday": false,
        "month": "2026-07",
        "days": [
          {
            "date": "2026-07-19",
            "dayOfMonth": 19,
            "checked": false,
            "available": true,
            "reward": { "type": "points", "name": "积分", "amount": 20, "icon": "✦" }
          }
        ]
      }
    },
    "tasks": [
      {
        "id": "task_1001",
        "category": "daily",
        "title": "观看直播 10 分钟",
        "description": "在直播频道观看任意直播",
        "icon": "▶",
        "progress": 6,
        "target": 10,
        "status": "in_progress",
        "rewards": [
          { "type": "points", "name": "积分", "amount": 50, "icon": "✦" }
        ],
        "actionLabel": "去直播",
        "actionRoute": "/live",
        "expiresAt": "2026-07-20T00:00:00Z"
      }
    ]
  }
}
```

任务状态：`in_progress`、`claimable`、`claimed`、`expired`。

奖励类型：`points`、`gift`、`vip_exp`、`coupon`。

## 2. 每日签到

查询签到日历：

```http
GET /api/v1/client/checkins?month=2026-07
Authorization: Bearer <accessToken>
```

签到请求：

```http
POST /api/v1/client/checkins
Authorization: Bearer <accessToken>
Idempotency-Key: checkin_<userId>_2026-07-19
Content-Type: application/json
```

```json
{
  "date": "2026-07-19",
  "clientTime": "2026-07-19T12:00:00+08:00"
}
```

成功返回：

```json
{
  "code": 0,
  "message": "签到成功",
  "requestId": "req_checkin_001",
  "data": {
    "date": "2026-07-19",
    "continuousDays": 7,
    "reward": { "type": "gift", "name": "七日礼包", "giftId": "gift_7001", "icon": "🎁" },
    "balance": { "points": 1300 }
  }
}
```

重复签到应返回稳定业务码，不得重复发奖：

```json
{
  "code": 20011,
  "message": "今日已签到",
  "data": { "date": "2026-07-19", "checked": true, "continuousDays": 7 }
}
```

## 3. 领取任务奖励

```http
POST /api/v1/client/tasks/{taskId}/claim
Authorization: Bearer <accessToken>
Idempotency-Key: claim_<userId>_<taskId>_<taskDate>
Content-Type: application/json
```

```json
{
  "taskDate": "2026-07-19",
  "clientProgress": 1
}
```

成功返回：

```json
{
  "code": 0,
  "message": "领取成功",
  "requestId": "req_claim_001",
  "data": {
    "taskId": "task_1001",
    "status": "claimed",
    "claimedAt": "2026-07-19T12:01:00Z",
    "rewards": [
      { "type": "points", "name": "积分", "amount": 50, "transactionId": "txn_001" }
    ],
    "summary": { "points": 1330, "claimableCount": 1 }
  }
}
```

## 4. 任务未读/可领取数量

```http
GET /api/v1/client/tasks/unread-count
Authorization: Bearer <accessToken>
```

```json
{
  "code": 0,
  "message": "ok",
  "data": { "claimableCount": 2, "incompleteCount": 4 },
  "requestId": "req_tasks_count_001"
}
```

## 5. 任务行为上报

对于观看直播、启动游戏、关注主播、下载游戏等任务，客户端只上报行为，服务端负责校验进度：

```http
POST /api/v1/client/tasks/events
Authorization: Bearer <accessToken>
Idempotency-Key: event_<eventId>
Content-Type: application/json
```

```json
{
  "eventId": "evt_01JXYZ",
  "eventType": "live_watch_completed",
  "resourceType": "live_room",
  "resourceId": "live_1001",
  "durationSeconds": 600,
  "occurredAt": "2026-07-19T12:10:00Z",
  "clientVersion": "0.1.0"
}
```

`eventType` 建议支持：`login`、`live_watch_completed`、`game_launch`、`game_download_completed`、`follow_streamer`、`invite_registered`、`recharge_completed`。

返回：

```json
{
  "code": 0,
  "message": "进度已更新",
  "data": {
    "updatedTasks": [
      { "taskId": "task_1001", "progress": 10, "target": 10, "status": "claimable" }
    ],
    "claimableCount": 2
  },
  "requestId": "req_task_event_001"
}
```

## 6. 错误码

| code | 含义 | 客户端处理 |
|---:|---|---|
| `10005` | Token 过期 | 刷新 Token，失败后回登录 |
| `20010` | 任务未完成 | 重新拉取任务进度，不允许领取 |
| `20011` | 今日已签到 | 展示已签到状态，不重试 |
| `20012` | 任务已领取 | 更新为 `claimed`，不重复加奖励 |
| `20013` | 任务已过期 | 更新为 `expired` |
| `20014` | 活动未开始/已结束 | 展示活动状态 |
| `20015` | 奖励发放失败 | 保留 `claimable`，展示重试入口 |
| `90001` | 服务端异常 | 展示重试入口并保留 requestId |
