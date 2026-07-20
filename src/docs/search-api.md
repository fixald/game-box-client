# 搜索 API 契约

客户端搜索接口统一使用 `/api/v1/client/search`，响应 envelope 使用 `{ code: 0, message, requestId, data }`，与当前 `apiRequest` 保持一致。

## 路由

- `GET /api/v1/client/search?q=&type=&page=&pageSize=`：搜索结果
- `GET /api/v1/client/search/suggestions?q=&limit=`：下拉建议
- `GET /api/v1/client/search/hot?limit=`：热门搜索
- `GET /api/v1/client/search/history?limit=`：搜索历史
- `POST /api/v1/client/search/history`：新增历史
- `DELETE /api/v1/client/search/history`：清空历史
- `POST /api/v1/client/search/events`：搜索行为上报

`type` 支持 `all`、`game`、`live`、`server`、`gift`、`article`。搜索结果项统一包含 `id`、`type`、`title`、`subtitle`、`description`、`iconUrl`、`coverUrl`、`tags`、`target`、`score`；结果列表额外返回 `query`、`page`、`pageSize`、`total`、`hasMore`、`facets`。
