# client AI Development Plan

## 登录页截图还原与功能规划

根据登录截图，996 传奇盒子登录页采用“左侧品牌/游戏宣传图 + 右侧登录面板”的桌面端布局，默认展示账号密码登录，同时提供短信登录切换。

### 登录页布局

```text
登录窗口
├── 左侧宣传区域（约 64%）
│   ├── 游戏宣传背景图
│   ├── 996 传奇盒子/传奇游戏 Logo
│   └── 品牌氛围与游戏角色视觉
└── 右侧登录区域（约 36%）
    ├── 品牌 Logo
    ├── 关闭窗口
    ├── 账号登录 / 短信登录 Tab
    ├── 账号输入/选择
    ├── 密码输入
    ├── 记住密码
    ├── 客服咨询 / 注册 / 忘记密码
    ├── 登录按钮
    └── 用户协议、隐私条款、儿童隐私协议
```

### 账号密码登录功能

- 账号输入框支持“996 游戏账号 / 盒子号”提示。
- 账号输入框右侧下拉入口，用于选择或回填历史登录账号。
- 密码输入框支持密码显示/隐藏。
- 账号和密码均不能为空，提交前进行基础格式校验。
- 支持回车提交登录。
- 登录按钮在请求期间进入 loading 状态，禁止重复提交。
- 登录成功后保存用户基本信息和短期访问 Token，并返回首页或登录前目标页面。
- 登录失败根据稳定业务码展示错误，不直接展示服务端内部异常。
- “记住密码”必须经过产品和安全确认；默认只记住账号，不建议保存明文密码。

### 短信登录功能

点击“短信登录”后切换为：

- 手机号输入框。
- 短信验证码输入框。
- 发送验证码按钮和倒计时。
- 验证码重新发送限制。
- 手机号格式校验。
- 验证码错误、过期、发送频率过高和账号封禁提示。
- 短信登录成功后执行与账号密码登录相同的 Token、用户信息和跳转逻辑。

### 账号辅助功能

截图中登录按钮下方包含以下入口：

- 客服咨询：打开在线客服、客服页面或外部客服链接。
- 注册：进入账号注册页。
- 忘记密码：进入密码找回流程，通常通过手机号/短信验证码重置。
- 历史账号下拉：展示本机最近使用账号；账号信息需要脱敏。
- 关闭按钮：关闭登录窗口或返回主窗口，具体行为待确认。

### 用户协议与合规确认

登录面板底部展示“登录即同意”文案，并链接：

- 用户注册协议。
- 隐私条款。
- 儿童隐私保护协议。

实现要求：

- 协议文本必须支持服务端配置版本和更新时间。
- 链接点击后在内置页面或受控外部浏览器打开。
- 首次登录前展示完整协议确认状态。
- 协议版本更新后，按策略要求用户重新确认。
- 不得通过隐藏、默认勾选或误导方式绕过协议确认。
- 登录请求需要携带用户已确认的协议版本或 consentId。

### 登录状态与异常处理

登录页面需要覆盖以下状态：

```text
Idle
→ Validating
→ Sending
→ Success
→ Error
```

- 空账号/空密码：输入框就地提示。
- 账号或密码错误：提示账号或密码错误，限制连续失败次数。
- 验证码错误/过期：允许重新获取验证码。
- 账号被封禁：展示封禁原因、期限和客服入口。
- 网络超时：展示重试按钮，不清空用户已填写内容。
- 服务端 5xx：展示通用错误和 requestId。
- Token 失效：执行刷新 Token；刷新失败后清理登录态并返回登录页。
- 多设备登录或风控验证：展示二次验证或设备确认流程。

### 登录安全要求

- 密码输入框使用密码类型，不得写入普通日志。
- 不在 localStorage 或普通配置文件中保存明文密码。
- 记住密码功能优先使用系统安全存储；若产品不要求，不实现密码持久化。
- 账号历史记录只保存脱敏账号标识，支持删除历史账号。
- 访问 Token 和刷新 Token 不得展示在日志、错误提示或页面 URL 中。
- 登录接口使用 HTTPS，客户端校验服务端返回的协议和业务状态。
- 登录、验证码发送、密码找回和失败次数需要服务端限流和风控。
- 登录成功后建立会话设备信息，但不向游戏启动接口透传长期 Token。

### 登录页待确认事项

- “996 游戏账号 / 盒子号”是否支持两种账号体系，还是仅为同一账号的不同叫法。
- 账号下拉是否展示历史账号、账号列表，还是支持账号类型选择。
- 登录窗口关闭后是退出整个应用、隐藏窗口，还是返回游客首页。
- 是否支持游客浏览首页和新服信息。
- 是否强制短信登录，还是账号密码登录为主。
- 是否需要图形验证码、滑块验证或设备验证码。
- 是否允许多设备登录，冲突时采用顶号、拒绝登录还是二次确认。
- 客服咨询是内置页面、网页链接、QQ/微信客服还是在线工单。
- 协议是否必须勾选，还是使用“登录即同意”模式；需由法务确认。

### 登录页推荐前端文件

```text
src/views/auth/
├── LoginView.vue
├── AccountLoginForm.vue
├── SmsLoginForm.vue
├── AgreementLinks.vue
├── AccountHistoryPopover.vue
└── ForgotPasswordView.vue

src/components/auth/
├── CaptchaInput.vue
├── PasswordInput.vue
├── SmsCodeButton.vue
└── LoginErrorMessage.vue
```

### 登录后端接口依赖

```text
POST /api/auth/login
POST /api/auth/sms/send
POST /api/auth/sms/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/password/reset/request
POST /api/auth/password/reset/confirm
GET  /api/auth/agreements/latest
GET  /api/auth/accounts
```

账号密码登录请求示例：

```json
{
  "account": "user@example.com",
  "password": "<password>",
  "rememberAccount": true,
  "deviceId": "device_xxx",
  "agreementVersion": "2026-07-01",
  "consentId": "consent_xxx"
}
```

登录成功返回示例：

```json
{
  "code": 0,
  "message": "ok",
  "requestId": "req_login_001",
  "data": {
    "accessToken": "<short-lived-token>",
    "refreshToken": "<rotating-refresh-token>",
    "expiresIn": 7200,
    "user": {
      "id": "user_001",
      "nickname": "玩家",
      "avatarUrl": "https://cdn.example.com/avatar.png",
      "accountMasked": "use***com",
      "vipLevel": 0
    },
    "redirect": { "type": "home" }
  }
}
```

短信登录请求示例：

```json
{
  "phone": "13800000000",
  "code": "123456",
  "deviceId": "device_xxx",
  "agreementVersion": "2026-07-01",
  "consentId": "consent_xxx"
}
```

登录错误码建议：

```text
10001 → 账号或密码错误
10002 → 验证码错误或过期
10003 → 验证码发送过于频繁
10004 → 账号被封禁
10005 → Token 过期，需要刷新
10007 → 需要重新确认用户协议
10008 → 需要二次风控验证
90001 → 服务端异常
```

## 注册页截图还原与功能规划

注册页与登录页复用同一套桌面窗口和品牌宣传区域。截图显示注册页右侧面板提供账号注册，不展示手机号、短信验证码或图形验证码字段；这些能力是否需要由后端风控动态触发，待产品和服务端确认。

### 注册页布局

```text
注册窗口
├── 左侧宣传区域（约 64%）
│   ├── 游戏宣传背景图
│   ├── 传奇游戏 Logo
│   └── 品牌视觉
└── 右侧注册区域（约 36%）
    ├── 返回登录页
    ├── 关闭窗口
    ├── 品牌 Logo
    ├── 注册账号标题
    ├── “996传奇引擎玩家可直接使用游戏账号登录”提示
    ├── 账号输入框
    ├── 密码输入框（6-20个字符）
    ├── 确认密码输入框
    └── 立即注册
```

### 注册字段与校验

- 账号：必填，注册后作为盒子账号/游戏账号使用；输入框需要明确 placeholder。
- 密码：必填，长度 6-20 个字符；密码输入框支持显示/隐藏。
- 确认密码：必填，必须与密码完全一致；支持显示/隐藏。
- 注册按钮：字段校验通过后可提交，提交期间显示 loading 并禁止重复点击。
- 支持回车提交；校验错误在对应输入框下方就地展示。
- 账号已存在时保留用户输入，并提供“返回登录”或“忘记密码”入口。
- 注册成功后可直接登录，或跳转登录页并自动回填账号，具体流程待确认。

### 注册交互状态

```text
Idle
→ Validating
→ Submitting
→ Success
→ Error
```

- 空账号：提示请输入账号。
- 账号格式不符合要求：提示允许的字符和长度。
- 密码少于 6 位或超过 20 位：提示密码长度要求。
- 两次密码不一致：提示确认密码不一致。
- 账号已存在：提示账号已注册，并提供登录入口。
- 注册频率过高：展示等待时间，不允许连续提交。
- 服务端异常或网络超时：展示重试入口和 requestId。
- 风控触发：按服务端返回进入图形验证码、短信验证或设备验证。

### 注册安全与合规

- 密码只通过 HTTPS 传输，不写入日志、埋点和错误信息。
- 客户端不保存明文密码；注册成功后只保存短期会话信息。
- 密码规则由服务端最终校验，客户端校验仅用于即时反馈。
- 服务端需要限制注册频率、设备频率、IP 频率和账号撞库行为。
- 用户协议、隐私条款和儿童隐私保护协议应与注册流程关联。
- 如果使用“注册即同意”，必须明确展示协议链接并记录协议版本/consentId。
- 注册成功后的 accessToken/refreshToken 不得出现在 URL、普通日志或页面文案中。

### 注册页待确认事项

- 账号格式：手机号、邮箱、字母数字账号，还是“盒子号”专用账号。
- 是否需要手机号绑定、短信验证码或邮箱验证。
- 是否需要图形验证码、滑块或设备验证。
- 注册成功后是否自动登录。
- 是否允许账号直接用于游戏登录，还是需要额外创建游戏角色/绑定游戏账号。
- 注册账号是否需要实名认证。
- 是否需要勾选用户协议，还是采用注册即同意模式。
- 是否需要昵称、头像、邀请码、渠道码或推广码字段。
- 截图中账号输入框无明显 placeholder，需产品补充字段提示文案。

### 注册页推荐前端文件

```text
src/views/auth/
├── RegisterView.vue
├── RegisterForm.vue
├── PasswordRuleHint.vue
└── AgreementLinks.vue
```

### 注册后端接口依赖

```text
POST /api/auth/register
POST /api/auth/register/check-account
POST /api/auth/register/verify
GET  /api/auth/agreements/latest
```

账号注册请求示例：

```json
{
  "account": "player001",
  "password": "<password>",
  "passwordConfirmation": "<password>",
  "deviceId": "device_xxx",
  "inviteCode": "optional_invite_code",
  "agreementVersion": "2026-07-01",
  "consentId": "consent_xxx"
}
```

注册成功返回示例：

```json
{
  "code": 0,
  "message": "注册成功",
  "requestId": "req_register_001",
  "data": {
    "user": {
      "id": "user_001",
      "account": "player001",
      "accountMasked": "pla***001",
      "nickname": "玩家001",
      "avatarUrl": null
    },
    "autoLogin": true,
    "accessToken": "<short-lived-token>",
    "refreshToken": "<rotating-refresh-token>",
    "expiresIn": 7200,
    "redirect": { "type": "home" }
  }
}
```

检查账号是否可用：

```http
POST /api/auth/register/check-account
Content-Type: application/json
```

```json
{ "account": "player001", "deviceId": "device_xxx" }
```

```json
{
  "code": 0,
  "message": "账号可用",
  "requestId": "req_account_check_001",
  "data": { "account": "player001", "available": true }
}
```

注册错误码建议：

```text
11001 → 账号格式错误
11002 → 账号长度不符合要求
11003 → 账号已存在
11004 → 密码不符合规则
11005 → 两次密码不一致
11006 → 注册过于频繁
11007 → 需要图形验证码/短信验证
11008 → 需要重新确认用户协议
11009 → 邀请码无效
11010 → 账号注册被风控拦截
90001 → 服务端异常
```

## 个人中心/账号中心模块

个人中心是登录用户管理账号、查看权益和维护游戏数据的统一入口。首页顶部展示当前账号摘要，点击头像或账号名称进入个人中心；未登录用户访问个人中心时跳转登录页。

### 页面结构

```text
个人中心
├── 账号概览：头像、昵称、脱敏账号、注册时间、账号状态
├── 会员权益：SVIP等级、成长值、到期时间、权益入口
├── 数据概览：积分、收藏游戏、最近玩过、下载记录、连续签到
├── 我的游戏：最近玩过、收藏游戏、最近登录区服、启动记录
├── 我的下载：下载中、已完成、失败、待更新、缓存清理
├── 账号安全：修改密码、手机/邮箱绑定、实名认证、设备、登录记录
├── 我的消息：系统、活动、任务、直播、游戏维护通知
└── 其他设置：礼包记录、协议、隐私、客服、退出登录、注销账号
```

### 交互与安全规则

- 首页右上角账号卡片进入个人中心，展示与服务端一致的用户缓存。
- 修改头像、昵称、简介后同步更新首页账号摘要。
- 修改密码可选择使其他设备 Token 失效；不保存明文密码。
- 手机/邮箱绑定、换绑和实名认证由服务端验证码或风控流程完成。
- 设备列表支持查看当前设备、最近登录时间和移除其他会话。
- 退出登录调用服务端接口，清理 accessToken、refreshToken、用户缓存和敏感临时数据。
- 注销账号必须二次确认并完成服务端验证，完成后旧 Token 全部失效。
- 消息支持分类、未读数量、单条已读、全部已读和失效目标提示。

### 推荐前端文件结构

```text
src/views/account/
├── AccountView.vue
├── AccountOverview.vue
├── AccountSecurity.vue
├── AccountGames.vue
├── AccountDownloads.vue
├── AccountMessages.vue
└── AccountSettings.vue
```

### 推荐数据结构

```ts
interface CurrentUser {
  id: string;
  account: string;
  accountMasked: string;
  nickname: string;
  avatarUrl?: string;
  status: "normal" | "frozen" | "banned" | "pending_verification";
  registeredAt: string;
  vip: { level: number; name: string; growthValue: number; nextLevelValue?: number; expiresAt?: string };
  security: { phoneMasked?: string; emailMasked?: string; realNameStatus: "unverified" | "pending" | "verified" };
}

interface AccountStats {
  points: number;
  favoriteGameCount: number;
  recentGameCount: number;
  downloadCount: number;
  continuousCheckinDays: number;
  unreadMessageCount: number;
  claimableTaskCount: number;
}
```

### 个人中心后端 API

```text
GET    /api/users/me
PATCH  /api/users/me
GET    /api/users/me/stats
GET    /api/users/me/games/recent
GET    /api/users/me/games/favorites
POST   /api/users/me/games/:gameId/favorite
DELETE /api/users/me/games/:gameId/favorite
GET    /api/users/me/servers/recent
GET    /api/users/me/downloads
DELETE /api/users/me/downloads/:recordId
GET    /api/users/me/security
POST   /api/users/me/password/change
POST   /api/users/me/phone/bind/send
POST   /api/users/me/phone/bind/confirm
POST   /api/users/me/email/bind/send
POST   /api/users/me/email/bind/confirm
GET    /api/users/me/devices
DELETE /api/users/me/devices/:deviceId
GET    /api/users/me/login-records
GET    /api/messages
POST   /api/messages/:id/read
POST   /api/messages/read-all
POST   /api/auth/logout
POST   /api/users/me/deletion/request
POST   /api/users/me/deletion/confirm
```

### 个人中心聚合返回示例

```json
{
  "code": 0,
  "message": "ok",
  "requestId": "req_account_001",
  "data": {
    "user": {
      "id": "user_001",
      "account": "player001",
      "accountMasked": "pla***001",
      "nickname": "玩家001",
      "avatarUrl": "https://cdn.example.com/avatar.png",
      "status": "normal",
      "registeredAt": "2026-07-01T08:00:00Z",
      "vip": { "level": 2, "name": "SVIP2", "growthValue": 1200, "nextLevelValue": 2000, "expiresAt": "2026-12-31T23:59:59Z" },
      "security": { "phoneMasked": "138****0000", "emailMasked": "pla***@example.com", "realNameStatus": "unverified" }
    },
    "stats": { "points": 1280, "favoriteGameCount": 4, "recentGameCount": 8, "downloadCount": 3, "continuousCheckinDays": 6, "unreadMessageCount": 2, "claimableTaskCount": 1 }
  }
}
```

修改密码请求：

```json
{ "oldPassword": "<old-password>", "newPassword": "<new-password>", "passwordConfirmation": "<new-password>", "logoutOtherDevices": true }
```

退出登录请求：

```json
{ "refreshToken": "<refresh-token>", "deviceId": "device_xxx" }
```

建议错误码：

```text
12001 → 用户资料不存在
12002 → 昵称或简介不符合规则
12003 → 旧密码错误
12004 → 验证码错误或过期
12005 → 设备会话不存在
12006 → 账号冻结/封禁
12007 → 注销需要二次验证
90001 → 服务端异常
```

## 截图还原的产品功能范围（996 传奇盒子用户端）

根据用户端截图，该产品不是单纯的游戏下载器，而是“传奇游戏大厅 + 直播社区 + 内容分发 + 新服推广 + 游戏启动器”的综合客户端。以下内容是从截图中识别出的功能规划；未被接口或产品文档确认的部分，均应视为待确认需求。

### 产品核心用户链路

```text
打开客户端 → 浏览推荐/直播/新服 → 查看游戏或区服详情
→ 登录 → 下载/更新游戏 → 选择区服 → 获取启动票据 → 启动游戏
```

平台主要通过直播内容、新区推广、充值活动、礼包和游戏启动完成用户转化。

### 用户端信息架构

#### 全局应用壳规范

所有登录后的业务页面必须持续保留统一的应用壳，不允许进入二级页面后移除主导航或顶部工具栏：

- 左侧导航栏在首页、游戏、游戏详情、区服选择、任务、直播、社区、资讯、SVIP、抽奖和设置等页面始终存在。
- 顶部栏在所有业务页面始终存在，包含页面刷新/返回能力、页面上下文搜索、消息入口和账户入口；页面需要时可增加返回按钮或其他操作。
- 当前页面对应的左侧导航项必须保持高亮，例如游戏详情和区服选择高亮“游戏”，任务页面高亮“任务”。
- 顶部搜索应根据当前页面切换搜索范围：首页支持游戏、主播、区服、礼包和文章；游戏相关页面默认只搜索游戏；其他内容页面使用对应内容类型。
- 页面主体只替换应用壳下的内容区，禁止各页面重复实现独立的 Sidebar、TopBar 和账户入口。
- 推荐使用 `AppShell.vue`、`Sidebar.vue` 和 `TopBar.vue` 统一承载应用壳，业务页面通过插槽或页面状态注入主体内容。
- 移动窗口或窄屏下允许压缩导航和工具栏，但不得隐藏全局导航能力；可将文字收缩为图标，并保留当前页面状态。

左侧主导航预计包含：

- 首页：推荐直播、热门游戏、新区、活动和广告。
- 直播：直播列表、直播间、主播主页、关注和互动。
- 社区：玩家动态、帖子、攻略、评论和收藏。
- 美女：娱乐/美女主播内容频道，具体内容范围待确认。
- 资讯：传奇新闻、版本公告、开服信息和攻略文章。
- 游戏：游戏列表、详情、区服、下载、更新和启动。
- 任务：每日任务、新手任务、签到、观看直播、下载和邀请任务；未完成任务显示红点。
- SVIP：会员等级、权益、礼包、下载加速和专属服务。
- 抽奖：抽奖次数、奖品、活动倒计时、中奖记录和奖励领取。
- 邀请/推广：邀请码、邀请记录、推广奖励和渠道身份；具体权限待确认。

顶部区域预计包含：

- 返回和刷新。
- 全局搜索：搜索游戏、主播、区服、礼包、文章等。
- 内容频道：关注、推荐、新服、美女、传世、传奇3。
- 用户头像、消息、设置和窗口控制入口。

### 首页/推荐页功能

截图中的推荐页应支持以下内容模块：

- 推荐直播大卡片：直播画面、直播状态、主播信息和“进入直播间”。
- 新服推荐：即将开服、开服倒计时、热门程度、推荐区服和进入游戏。
- 游戏推荐：热门、最新等分类。
- 活动 Banner：充值、首充、礼包、抽奖和限时活动。
- 右侧广告位：主播推广、游戏推广、新区推广和充值活动。
- 倒计时组件：开服、活动或充值奖励截止时间。
- 推广文案配置：直播标题、副标题、活动信息、跳转游戏和跳转区服。

### 直播功能

直播模块应预留：

- 直播分类、热门主播、新人主播和直播搜索。
- 直播间播放、全屏、回放和直播状态。
- 主播主页、关注、粉丝数和主播排行。
- 弹幕、聊天、点赞、分享、礼物和举报。
- 直播间公告、游戏推广文案和跳转区服。
- 曝光、点击、进入直播间、关注和礼物等事件上报。

### 游戏与区服功能

- 游戏列表、搜索、分类、标签、收藏和热门榜单。
- 游戏详情：介绍、截图、公告、礼包、版本和区服入口。
- 区服列表：推荐区服、最近登录、收藏区服、开服倒计时和在线热度。
- 区服状态：`preview/opening_soon/normal/hot/full/maintenance/closed`。
- 下载、暂停、继续、重试、更新、校验、安装、回滚和启动。
- 维护、低版本、版本校验失败、磁盘不足和启动失败时必须阻断或给出可恢复操作。

### 活动与用户增长功能

- 任务：每日任务、新手任务、签到、观看直播、下载游戏、启动游戏、邀请和充值。
- 礼包：新手礼包、首充礼包、活动礼包、兑换码和领取记录。
- SVIP：会员等级、成长值、权益、折扣、礼包和有效期。
- 抽奖：次数、积分、奖品、抽奖记录、中奖通知和奖励领取。
- 邀请推广：邀请码、邀请关系、奖励明细、推广链接和结算；是否开放代理能力待确认。
- 消息中心：系统公告、活动、任务奖励、中奖、直播和维护通知。

### 截图对应的待确认需求

以下能力可以从界面推测，但不能仅凭截图确定，联调前需要产品确认：

- “美女”频道是主播分类、短视频，还是图片/资讯内容。
- “邀请”入口是普通用户邀请奖励，还是渠道/代理中心。
- SVIP 是否涉及充值、下载加速、专属礼包或推广分成。
- 抽奖是否消耗积分、充值额度、任务次数或平台币。
- 直播是否支持礼物、弹幕、私聊和未成年人相关限制。
- 广告是否由后台动态配置、按用户定向，还是固定素材。

### 截图还原的 MVP 优先级

第一阶段先实现可用主链路：

1. 应用壳、左侧导航、顶部搜索和推荐页布局。
2. 推荐直播卡片、新服卡片、游戏卡片和活动 Banner。
3. 登录、游戏列表、游戏详情和区服列表。
4. 版本检查、游戏下载、校验、安装、更新和启动。
5. 消息入口、任务红点、错误提示和下载状态展示。

第二阶段实现增长和内容：

1. 直播间、关注、弹幕和主播主页。
2. 社区、资讯、攻略、评论和收藏。
3. 礼包、签到、任务、SVIP、抽奖和邀请。
4. 广告位、曝光/点击统计和运营配置。

### 推荐前端页面结构

```text
src/views/
├── home/HomeView.vue
├── live/LiveView.vue
├── live/LiveRoomView.vue
├── community/CommunityView.vue
├── news/NewsView.vue
├── games/GamesView.vue
├── games/GameDetailView.vue
├── games/ServerSelectView.vue
├── download/DownloadView.vue
├── tasks/TasksView.vue
├── activities/LotteryView.vue
├── vip/VipView.vue
└── settings/SettingsView.vue
```

### 推荐组件与数据模型

```text
src/components/
├── AppShell.vue
├── Sidebar.vue
├── TopBar.vue
├── LiveCard.vue
├── GameCard.vue
├── ServerCard.vue
├── ActivityBanner.vue
├── Countdown.vue
├── DownloadProgress.vue
└── NotificationBadge.vue
```

应新增或完善以下模型：

- `User`、`VipProfile`、`Message`。
- `Game`、`GameVersion`、`Server`。
- `LiveRoom`、`Streamer`、`LiveCategory`。
- `Task`、`Gift`、`LotteryActivity`、`InviteRecord`。
- `Banner`、`Advertisement`、`Article`、`Comment`。


## 工程职责

本工程是 Windows 玩家端：Tauri 2 + Rust 原生层 + Vue3 + TypeScript。

- Vue：页面、交互、展示状态。
- Rust/Tauri：文件下载、校验、目录管理、进程启动、系统存储和原生更新能力。
- 后端：账号、游戏、区服、版本、权限和业务规则。

禁止客户端直连生产数据库、执行未签名文件、透传长期用户 Token、静默安装无关软件。

## Phase 0：客户端基线

- 确认 `src/`、`src-tauri/`、Tauri capabilities 和权限最小化。
- 增加 API base URL、环境配置和 requestId 展示/上报能力。
- 建立页面目录：`src/views/auth`、`src/views/lobby`、`src/views/game`、`src/views/download`、`src/views/support`。
- 建立状态目录：`src/stores` 或等价状态管理方案。

## Phase 1：MVP 任务

| ID | 任务 | 实现边界 | 验收 |
|---|---|---|---|
| `C.AUTH.01` | 登录页 | Vue 表单、协议勾选、安全 Token 存储 | Token 不落明文日志/普通文件 |
| `C.LOBBY.01` | 游戏大厅 | 推荐、热门、新服、空态、错误重试 | 未登录可按策略浏览 |
| `C.SERVER.01` | 区服列表 | 状态色、倒计时、维护阻断 | 开服瞬间状态正确 |
| `C.DL.01` | 全量下载 | Rust 分块/断点、目录选择、进度、重试 | SHA 不符删除临时包 |
| `C.DL.02` | 差分/强制更新 | 版本比较、签名、安装、回滚 | 失败不破坏旧版本 |
| `C.DL.03` | 启动游戏 | 启动票据、区服参数、文件完整性 | 维护/低版本/校验失败阻断 |
| `C.DL.04` | 盒子自身更新 | 独立版本通道 | 更新失败可恢复 |
| `C.SUPPORT.01` | 反馈表单 | 分类、日志/截图上传、提交结果 | 失败可重试，附件有大小限制 |

## Phase 2 C 端 API

| 功能 | 方法与路径 | 客户端用途 |
|---|---|---|
| 礼包列表 | `GET /api/gifts` | 游戏详情展示可领取礼包 |
| 领取礼包 | `POST /api/gifts/:id/claim` | 展示领取结果和奖励 |
| 兑换码 | `POST /api/gifts/redeem` | 提交兑换码 |
| 签到查询 | `GET /api/checkins` | 展示签到日历和连续天数 |
| 签到 | `POST /api/checkins` | 当日签到，重复返回首次结果 |
| 任务列表 | `GET /api/tasks` | 展示任务进度 |
| 任务领奖 | `POST /api/tasks/:id/claim` | 领取任务奖励 |
| 文章列表 | `GET /api/articles` | 游戏攻略/公告列表 |
| 文章详情 | `GET /api/articles/:id` | 阅读文章 |
| 发布文章 | `POST /api/articles` | 登录用户投稿，进入审核 |
| 评论列表 | `GET /api/articles/:id/comments` | 评论分页 |
| 发表评论 | `POST /api/articles/:id/comments` | 发布评论，等待审核或直发 |
| 删除评论 | `DELETE /api/comments/:id` | 删除本人评论 |
| 站内信 | `GET /api/messages` | 消息列表 |
| 未读数量 | `GET /api/messages/unread-count` | 消息角标 |
| 标记已读 | `POST /api/messages/:id/read` | 单条/全部已读 |
| 崩溃上报 | `POST /api/client/crashes` | 上报版本、设备、堆栈 |

礼包、签到、任务和消息写接口必须支持重复请求安全处理；文章和评论发布后客户端必须正确展示 `draft/pending/published/rejected/offline` 状态。

## Phase 3 C 端 API

| 功能 | 方法与路径 | 客户端用途 |
|---|---|---|
| 创建充值订单 | `POST /api/payments/orders` | 实名用户创建订单 |
| 查询充值订单 | `GET /api/payments/orders/:id` | 支付结果轮询 |
| 广告事件 | `POST /api/ads/events` | 曝光/点击埋点 |
| 厂商数据 | `GET /api/partners/me/stats` | 厂商/代理只读数据 |

## 后端 API 对接契约

API 基础路径由环境变量配置，默认 `/api`。所有请求使用 `Authorization: Bearer <accessToken>`；登录和公开大厅接口可不带 Token。客户端必须保留响应中的 `requestId`，错误只根据稳定 `code` 处理。

| 功能 | 方法与路径 | 请求 | 客户端用途 |
|---|---|---|---|
| 发短信 | `POST /api/auth/sms/send` | `{phone}` | 登录页发送验证码 |
| 登录 | `POST /api/auth/sms/login` | `{phone,code,deviceId?}` | 保存 Token 和用户信息 |
| 刷新 | `POST /api/auth/refresh` | `{refreshToken}` | accessToken 过期时轮换 |
| 登出 | `POST /api/auth/logout` | `{refreshToken?}` | 清理本地登录态 |
| 游戏列表 | `GET /api/games` | `tag,status,sort,page,pageSize` | 大厅卡片和筛选 |
| 游戏详情 | `GET /api/games/:id` | 路径 `id` | 详情、公告、礼包入口 |
| 新服推荐 | `GET /api/v1/client/game-servers` | `page,pageSize,recommended=true` | 推荐页新服卡片和倒计时 |
| 版本查询 | `GET /api/client/versions/latest` | `gameId,platform,channel,version?` | 判断下载/更新/强更 |
| 下载事件 | `POST /api/downloads/events` | `eventType,gameId,version,result,errorCode` | 上报下载/校验/安装结果 |
| 启动票据 | `POST /api/games/:gameId/launch-ticket` | `{serverId,clientVersion}` | 启动前获取短期票据 |
| 反馈 | `POST /api/feedback` | `{category,detail,attachmentIds[]}` | 提交问题和日志 |
| 举报 | `POST /api/reports` | `{targetType,targetId,reason,detail}` | 提交内容举报 |

### 核心响应结构

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "requestId": "req_01JXYZ"
}
```

游戏列表 `data` 为 `{list,page,pageSize,total}`。游戏和区服状态使用后端枚举，不在客户端自行推断：

```text
game: draft/online/maintenance/offline
server: preview/opening_soon/normal/hot/full/maintenance/closed
```

版本查询必须返回：

```text
version, minimumVersion, packageType, downloadUrl, expiresAt,
fileSize, sha256, signature, mandatory, changelog
```

`downloadUrl` 是短期签名地址，过期后重新请求接口；客户端禁止拼接或永久缓存 CDN 地址。

### 客户端错误码处理

```text
10003/10004 → 验证码错误或过期，允许重新获取
10005       → 刷新 Token，失败后回到登录页
10006       → 展示封禁提示，不循环重试
20002       → 游戏下架，退出详情或展示下架态
30002       → 区服维护，禁止启动
40002       → 重新请求版本签名地址
40003/40004 → 删除临时包，禁止安装并上报安全事件
90001       → 展示重试入口，不暴露内部错误
```

所有写请求在网络重试时必须携带相同 `Idempotency-Key`，避免重复创建反馈或事件；Token、身份证和启动票据不得写入普通日志。

## 客户端状态机

```text
Idle → CheckingVersion → NeedDownload/NeedUpdate/UpToDate
NeedDownload/NeedUpdate → Downloading ↔ Paused
Downloading → Verifying → Installing → ReadyToLaunch → Launching
任何中间态 → Error → Retry/Rollback/Idle
```

每个状态必须包含：UI 文案、进入条件、离开条件、可恢复动作、错误码、日志事件。

## Rust/Tauri 原生接口约定

命令只接收经过校验的业务参数，不允许任意 shell 字符串：

```text
check_local_version(game_id)
prepare_download(game_id, version)
download_file(url, target, expected_sha256, signature)
verify_package(path, manifest)
install_version(game_id, version)
rollback_version(game_id)
check_game_files(game_id, version)
launch_game(game_id, server_id, launch_ticket)
```

- 下载地址必须来自服务端短期签名 URL。
- Rust 层完成 SHA-256、数字签名和文件清单校验。
- `launch_game` 使用短期 `launch_ticket`，禁止传入长期 access token。
- 游戏目录使用版本隔离或备份目录，切换当前版本必须可回滚。

## 客户端异常验收

- 网络中断：保留分块状态并支持继续。
- 签名失败：禁止安装，记录安全事件。
- 磁盘不足：提前检查，过程中暂停并提示。
- 更新中断：重启后恢复或回滚。
- CDN 地址过期：重新获取签名地址。
- 游戏启动失败：保留旧版本并上报 `launch_failed`。

## 客户端完成定义

- 页面状态与后端状态码一致。
- 不执行未签名包，不绕过强制更新。
- 下载、校验、安装、启动均有日志和 requestId/eventId。
- Windows 开发环境下可运行 `pnpm tauri dev`；发布前完成构建和更新回滚测试。
- API 联调覆盖 401/403、非 0 业务码、超时、重复提交、签名地址过期和服务端 5xx。
- API 字段、状态枚举、错误码和下载安全规则与 `server/AI_PLAN.md` 完全一致。
