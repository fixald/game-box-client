# client API 开发约束

客户端请求只能通过 `src/api/**` 封装，页面组件不能直接拼 URL。统一使用 `src/api/routes.ts` 中的 `CLIENT_API_PREFIX`。

## 路径规则

- 客户端业务统一使用 `/api/v1/client/*`，禁止裸 `/api/*`。
- 认证使用 `/api/v1/client/auth/*`；当前服务端兼容的 `/api/v1/auth/*` 只能作为迁移映射，新增代码不得继续扩散。
- 账户使用 `/api/v1/client/users/me/*`，游戏使用 `/api/v1/client/games`，服务器使用 `/api/v1/client/game-servers`。
- 资源 CRUD 遵循列表、详情、创建、更新、删除的标准 HTTP 方法；状态动作使用 POST。
- 查询参数统一 `page`、`pageSize`，路径参数使用 `{id}` 语义。

新增接口前必须确认 server router 已注册同样的 HTTP 方法和路径，并同步 API 文档。完整规则见 `../API_ROUTE_RULES.md`。
