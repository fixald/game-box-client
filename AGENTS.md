# AI 开发入口

本目录由 client-agent 负责。开始前必须阅读仓库根目录 `../AGENTS.md`、`../DEVELOPMENT_PLAN.md`、本目录 `AI_PLAN.md`、`API_RULES.md` 和 `../API_ROUTE_RULES.md`。

负责 Tauri + Vue 3 + TypeScript 用户端页面、组件、API、下载更新、校验、回滚和游戏启动。HTTP 请求只能通过 `src/api/**` 和 `src/api/routes.ts` 管理；不得直连数据库、保存明文密码或长期 Token，不得绕过后端权限和签名校验。

修改 Rust/Tauri 能力时必须检查签名、路径、进程和错误处理边界。优先验证：`pnpm build`。
