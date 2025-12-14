# 扣费显示功能使用指南

本文档介绍了 Figsci 项目中的扣费显示功能，包括用户界面显示和后台日志输出。

## 概述

扣费显示功能为用户和开发者提供了清晰的扣费信息反馈：

1. **用户界面**：在每条 AI 回复消息下方显示 Token 使用量和扣费金额
2. **后台日志**：在服务端控制台输出详细的扣费过程和结果

## 用户界面显示

### Token 使用量和扣费信息卡片

每条 AI 助手的回复消息下方会自动显示一个信息卡片，包含：

- **Token 使用量**
  - 总计 tokens
  - 输入 tokens
  - 输出 tokens

- **生成耗时**
  - 显示本次生成的耗时
  - 自动分类：极速响应、快速生成、正常速度、复杂任务

- **扣费信息**（如果启用了光子扣费）
  - 扣费金额（光子数）
  - 扣费模式（固定扣费、Token 扣费、混合扣费）
  - 扣费状态（成功/失败）

### 显示样式

#### 紧凑模式（默认）

在消息下方显示单行紧凑卡片：

```
[⚡ 1,234 tokens] [🕐 2.5s] [💰 -3 光子]
```

#### 详细模式

显示完整的三栏信息卡片，包含更详细的信息。

### 扣费状态指示

- ✅ **成功扣费**：绿色显示，显示扣除的光子数
- ❌ **扣费失败**：红色显示，提示失败原因
- ⚠️ **余额不足**：红色显示，提示余额不足

## 后台日志输出

### 日志格式

后台日志使用清晰的分隔符和 emoji 标记，便于快速识别：

#### 1. 扣费请求日志

```
============================================================
【光子扣费】发起扣费请求
------------------------------------------------------------
扣费模式: 混合扣费
扣费金额: 3 光子
业务编号: 1702345678901234
Token 使用量:
  - 输入: 500 tokens
  - 输出: 1200 tokens
  - 总计: 1700 tokens
任务完成: 是
============================================================
```

#### 2. 扣费成功日志

```
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
【光子扣费】扣费成功
------------------------------------------------------------
业务编号: 1702345678901234
扣费金额: 3 光子
扣费模式: 混合扣费
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
```

#### 3. 扣费失败日志

```
❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
【光子扣费】扣费失败
------------------------------------------------------------
错误代码: 403
错误消息: 余额不足
业务编号: 1702345678901234
扣费金额: 3 光子
扣费模式: 混合扣费
❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
```

#### 4. 生成完成日志

**流式生成：**

```
📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊
【流式生成】生成完成
------------------------------------------------------------
完成原因: stop
任务状态: ✅ 成功完成
生成耗时: 2543ms

Token 使用量（本轮）:
  - 输入: 500 tokens
  - 输出: 1200 tokens
  - 总计: 1700 tokens

Token 使用量（累计）:
  - 输入: 500 tokens
  - 输出: 1200 tokens
  - 总计: 1700 tokens
📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊
```

**非流式生成：**

```
📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊
【非流式生成】生成完成
------------------------------------------------------------
完成原因: stop
任务状态: ✅ 成功完成
生成耗时: 2543ms
工具调用支持: 是
工具调用数量: 1

Token 使用量:
  - 输入: 500 tokens
  - 输出: 1200 tokens
  - 总计: 1700 tokens
📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊

💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰
【非流式生成】扣费结果
------------------------------------------------------------
扣费状态: ✅ 成功
扣费金额: 3 光子
扣费模式: 混合扣费
💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰
```

## 工具函数使用

项目提供了一套扣费信息工具函数（`lib/charge-utils.js`），方便在其他地方复用：

### 1. 格式化扣费模式

```javascript
import { formatChargeMode } from '@/lib/charge-utils';

const mode = formatChargeMode('mixed'); // "混合扣费"
```

### 2. 获取扣费描述

```javascript
import { getChargeDescription } from '@/lib/charge-utils';

const description = getChargeDescription({
  success: true,
  eventValue: 3,
  chargeMode: 'mixed',
  message: '扣费成功'
});
// "扣费成功：扣除 3 光子（混合扣费）"
```

### 3. 计算 Token 扣费金额

```javascript
import { calculateTokenCharge } from '@/lib/charge-utils';

const charge = calculateTokenCharge(1700, 1); // 2 光子
```

### 4. 预估扣费金额

```javascript
import { estimateCharge } from '@/lib/charge-utils';

const estimate = estimateCharge(1700);
// {
//   enabled: true,
//   amount: 4,
//   description: "混合扣费（2 固定 + 2 Token）"
// }
```

### 5. 打印扣费信息到控制台

```javascript
import { logChargeInfo } from '@/lib/charge-utils';

logChargeInfo({
  success: true,
  eventValue: 3,
  chargeMode: 'mixed',
  message: '扣费成功'
}, '[Prefix] ');
```

## 配置说明

扣费功能的配置在 `.env` 文件中：

```bash
# 是否启用光子扣费
NEXT_PUBLIC_ENABLE_PHOTON_CHARGE=true

# SKU ID（必需）
BOHRIUM_SKU_ID=10059

# 扣费模式：fixed（固定）、token（按量）、mixed（混合）
BOHRIUM_CHARGE_MODE=mixed

# 固定扣费金额（每次请求）
BOHRIUM_CHARGE_PER_REQUEST=2

# Token 扣费金额（每 1000 tokens）
BOHRIUM_CHARGE_PER_1K_TOKEN=1

# 前端显示配置
NEXT_PUBLIC_PHOTON_CHARGE_PER_MESSAGE=2
NEXT_PUBLIC_PHOTON_CHARGE_PER_1K_TOKEN=1
```

## 扣费模式说明

### 1. 固定扣费（fixed）

- 每次请求扣除固定金额
- 仅在任务成功完成时扣费
- 适用于简单的计费场景

### 2. Token 扣费（token）

- 根据实际使用的 token 数量扣费
- 无论任务是否完成都会扣费
- 适用于精确计费的场景

### 3. 混合扣费（mixed）

- 固定费用在请求前预扣（前端调用 preChargePhoton）
- Token 费用在任务完成后扣除
- 任务失败时自动回滚状态
- 推荐使用的模式

## 开发调试

### 查看扣费日志

启动开发服务器后，在终端中可以看到详细的扣费日志：

```bash
pnpm dev
```

### 测试扣费功能

1. 确保 `.env` 中配置了扣费相关参数
2. 在聊天界面发送消息
3. 观察：
   - 消息下方是否显示扣费信息
   - 终端中是否输出扣费日志

### 调试技巧

- 使用 `BOHRIUM_DEV_ACCESS_KEY` 配置开发者 Access Key 进行测试
- 设置 `BOHRIUM_CHARGE_PER_REQUEST=0` 可以暂时禁用固定扣费（仅测试 Token 扣费）
- 查看浏览器控制台的 Network 标签，检查 `/api/chat` 的响应中的 `metadata` 字段

## 常见问题

### Q: 为什么看不到扣费信息？

A: 检查以下几点：
1. `.env` 中 `NEXT_PUBLIC_ENABLE_PHOTON_CHARGE` 是否设置为 `true`
2. 是否配置了 `BOHRIUM_SKU_ID`
3. 是否有有效的 Access Key（Cookie 或环境变量）

### Q: 扣费显示为 0 怎么办？

A: 可能的原因：
1. 配置的扣费金额为 0（检查 `BOHRIUM_CHARGE_PER_REQUEST` 和 `BOHRIUM_CHARGE_PER_1K_TOKEN`）
2. 任务未成功完成（fixed 模式不会扣费）
3. 扣费计算逻辑出现问题（查看后台日志）

### Q: 如何自定义扣费信息显示样式？

A: 修改 `components/token-usage-display.jsx` 组件：
1. `compact` 参数控制是否使用紧凑模式
2. 通过 CSS 类名自定义样式
3. 可以扩展 `chargeInfo` 参数支持更多信息

## 相关文件

- `/components/token-usage-display.jsx` - Token 和扣费信息显示组件
- `/components/chat-message-display-optimized.jsx` - 消息显示组件（调用 TokenUsageDisplay）
- `/app/api/chat/route.js` - API 路由（扣费逻辑和日志输出）
- `/lib/charge-utils.js` - 扣费信息工具函数
- `/lib/photon-client.js` - 光子扣费客户端（预扣费功能）

## 贡献

如果你有改进建议或发现问题，欢迎提交 Issue 或 PR！
