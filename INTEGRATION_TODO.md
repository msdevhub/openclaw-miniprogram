# OpenClaw Web 接入任务清单

本文档用于整理 **当前 Web React 项目（排除 miniprogram/）接入 clawdbot-generic-channel** 的全部工作事项，作为实施与对齐依据。

---

## 一、目标

- Web React 项目通过 **generic-channel (WebSocket)** 接入 OpenClaw
- 支持：
  - 用户登录后携带 `userId`
  - 建立 `chatId` 会话
  - 与 OpenClaw Bot 进行实时消息收发
- 测试环境：
  - WS：`ws://wolf-sg.southeastasia.cloudapp.azure.com:18080/ws`

---

## 二、整体原则

- ✅ 不影响 `miniprogram/`
- ✅ 最大限度复用现有 UI / 交互
- ✅ 不引入多余状态管理（Redux / Zustand）
- ✅ 渐进式引入 `react-router-dom`（Hybrid Routing）

---

## 三、接入协议要点（generic-channel）

### 1. 连接方式

```text
ws://<host>:18080/ws?chatId=<chatId>
```

### 2. 前端 → OpenClaw

事件：`message.receive`

```json
{
  "type": "message.receive",
  "data": {
    "messageId": "uuid",
    "chatId": "chat-123",
    "chatType": "direct",
    "senderId": "user-001",
    "senderName": "Test User",
    "content": "hello",
    "timestamp": 1710000000000
  }
}
```

### 3. OpenClaw → 前端

事件：`message.send`

---

## 四、当前项目现状

- ✅ 已有聊天页面：`src/screens/ChatRoom.tsx`
- ✅ 使用自研 Screen 状态路由（非 react-router）
- ✅ 已接入 generic-channel WebSocket 通信
- ✅ 已实现 userId 生成与持久化

---

## 五、实施任务拆解

### ✅ 1. 路由改造（Hybrid Routing）

目标：
- 保留现有 `Screen` 状态路由
- 引入 `react-router-dom` 作为 URL 同步层

任务：
- 安装 `react-router-dom`
- `App.tsx`：
  - 外层包裹 `BrowserRouter`
  - URL ⇄ currentScreen 双向同步
  - 支持 `/chat/:chatId` 深链接

---

### ✅ 2. 用户身份（最小登录）

目标：
- 在 Web 端生成并持久化 `userId`

任务：
- 复用 `Onboarding` 或新增简单登录页
- 登录成功后：
  - 生成 `userId`
  - 保存到 `localStorage`

---

### ✅ 3. WebSocket 通道封装（核心）

文件：
- `src/services/clawChannel.ts`

职责：
- 创建 / 维护 WebSocket 连接
- 发送 `message.receive`
- 监听 `message.send`
- 对外提供：
  - `sendMessage(content)`
  - `onMessage(callback)`

---

### ✅ 4. ChatRoom 接入真实通信

文件：
- `src/screens/ChatRoom.tsx`

任务：
- 移除：
  - `mockMessages`
  - `setTimeout` mock AI
- 接入：
  - clawChannel 消息回调
  - 真实 bot 回复渲染
- UI / 动画 / 交互 **不改**

---

### ✅ 5. 状态职责划分

| 状态 | 归属 |
|----|----|
| userId | localStorage + App |
| chatId | URL / Screen 状态 |
| WS 连接 | clawChannel service |
| 消息列表 | ChatRoom 内部 |

---

## 六、验证方式

1. 启动 Web 项目
2. 进入 Onboarding / 登录
3. 打开 ChatRoom
4. 确认：
   - WebSocket 成功连接
   - 发送消息 → OpenClaw
   - 收到 bot 回复

---

## 七、后续可扩展（非本次范围）

- 多会话 / ChatList 历史同步
- 鉴权 token
- 群聊 / 多 bot
- 与 miniprogram 共用后端逻辑

---

> 本文档用于当前阶段实施，不作为最终架构文档。