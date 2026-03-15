# OpenClaw Miniprogram — 项目上下文

## 测试环境

- **WebSocket 地址**: `ws://wolf-sg.southeastasia.cloudapp.azure.com:18080/ws`

## 测试账号

| 账号 | chatId | senderId | token | allowAgents |
|------|--------|----------|-------|-------------|
| test-main | gc-test-main | gc-test-main | `gc_test_main_2b2b7fe4982bcc185db65bca5a738284` | main |
| test-writer | gc-test-writer | gc-test-writer | `gc_test_writer_0b55382f6d8c3597091c534fbb53482a` | main, writer |
| test-full | gc-test-full | gc-test-full | `gc_test_full_d64d1d536326af83df3f0ad97654eea5` | main, code, writer |

## 连接方式

```
ws://wolf-sg.southeastasia.cloudapp.azure.com:18080/ws?chatId=<chatId>&token=<token>&agentId=<agentId>
```
