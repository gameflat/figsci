# 扣费显示功能测试指南

## 测试前检查

### 1. 确认环境变量配置

打开 `.env` 文件，确认以下配置：

```bash
# 必须启用
NEXT_PUBLIC_ENABLE_PHOTON_CHARGE=true

# 确保配置了 SKU ID
BOHRIUM_SKU_ID=10059

# 扣费模式（当前使用 mixed）
BOHRIUM_CHARGE_MODE=mixed

# 扣费金额
BOHRIUM_CHARGE_PER_REQUEST=2
BOHRIUM_CHARGE_PER_1K_TOKEN=1
```

### 2. 重启开发服务器

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
pnpm dev
```

## 测试步骤

### 测试 1: 查看后台日志

1. 打开终端，运行 `pnpm dev`
2. 在浏览器中打开应用
3. 发送一条简单的消息（如"画一个流程图"）
4. 在终端中查看日志输出

**预期结果：**
应该看到类似以下的日志：

```
============================================================
【光子扣费】发起扣费请求
------------------------------------------------------------
扣费模式: 混合扣费
扣费金额: 3 光子
...
============================================================

✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
【光子扣费】扣费成功
扣费金额: 3 光子
扣费模式: 混合扣费
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
```

### 测试 2: 查看用户界面显示

1. 在浏览器中发送消息
2. 等待 AI 回复
3. 在 AI 回复消息下方查看是否显示了信息卡片

**预期结果：**
应该看到类似以下的显示：

```
[⚡ 1,234 tokens] [🕐 2.5s] [💰 -3 光子]
```

### 测试 3: 查看浏览器控制台

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 发送消息并等待回复
4. 查看控制台输出

**预期结果：**
应该看到调试日志：

```
[扣费显示调试] Message metadata: {
  id: "msg-xxx",
  hasUsage: true,
  hasDuration: true,
  hasChargeResult: true,
  chargeResult: { success: true, eventValue: 3, ... }
}
```

### 测试 4: 检查网络请求

1. 在浏览器开发者工具中切换到 Network 标签
2. 发送消息
3. 找到 `/api/chat` 请求
4. 查看响应内容

**预期结果：**
在响应的 SSE 事件中，应该看到包含 `chargeResult` 的 metadata：

```
data: ...
data: {
  "type": "finish",
  "finishReason": "stop",
  "messageMetadata": {
    "usage": { ... },
    "durationMs": 2543,
    "chargeResult": {
      "success": true,
      "eventValue": 3,
      "chargeMode": "mixed",
      ...
    }
  }
}
```

## 常见问题排查

### 问题 1: 看不到扣费信息卡片

**可能原因：**
1. `message.metadata` 为空
2. `chargeResult` 未被设置
3. 扣费金额为 0

**排查步骤：**
1. 检查浏览器控制台的调试日志
2. 查看 `hasChargeResult` 是否为 `true`
3. 查看 `chargeResult.eventValue` 是否大于 0

### 问题 2: 只显示 Token 使用量，没有扣费金额

**可能原因：**
1. 扣费被禁用（`NEXT_PUBLIC_ENABLE_PHOTON_CHARGE` 不是 `true`）
2. 扣费金额配置为 0
3. 扣费失败但没有设置 `chargeResult`

**排查步骤：**
1. 检查 `.env` 配置
2. 查看后台日志是否有扣费请求
3. 检查是否有扣费错误日志

### 问题 3: 流式响应中看不到扣费信息

**说明：**
这是已知的限制。在流式响应中，扣费是在 `onFinish` 回调中异步执行的，而 `messageMetadata` 可能在扣费完成前就被发送了。

**解决方案：**
1. 刷新页面后再查看（metadata 会被更新）
2. 使用非流式模式测试（设置 `isStreaming: false`）
3. 查看后台日志确认扣费是否成功

### 问题 4: 扣费金额显示为 0

**可能原因：**
1. 配置的扣费金额为 0
2. Token 数量很少，计算结果为 0
3. 任务未完成（fixed 模式不扣费）

**排查步骤：**
1. 检查 `BOHRIUM_CHARGE_PER_REQUEST` 和 `BOHRIUM_CHARGE_PER_1K_TOKEN`
2. 查看后台日志中的扣费金额计算
3. 确认任务是否成功完成

## 调试技巧

### 1. 强制使用非流式响应

在模型配置中，将 `isStreaming` 设置为 `false`，这样更容易看到完整的 metadata。

### 2. 增加扣费金额

临时将扣费金额调高，以便更容易看到效果：

```bash
BOHRIUM_CHARGE_PER_REQUEST=10
BOHRIUM_CHARGE_PER_1K_TOKEN=5
```

### 3. 使用简单的测试输入

发送简单的消息，如"你好"或"画一个简单的流程图"，减少生成时间和复杂度。

### 4. 清除浏览器缓存

有时候浏览器缓存会导致旧代码仍在运行，尝试：
1. 清除浏览器缓存
2. 使用隐私模式/无痕模式
3. 强制刷新页面（Ctrl+Shift+R 或 Cmd+Shift+R）

## 需要帮助？

如果以上步骤都无法解决问题，请提供以下信息：

1. 浏览器控制台的调试日志截图
2. 后台终端的扣费日志截图
3. Network 标签中 `/api/chat` 请求的响应内容
4. 当前的 `.env` 配置（隐藏敏感信息）

这些信息将帮助快速定位问题。
