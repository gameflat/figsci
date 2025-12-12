# 玻尔平台光子扣费功能 - 集成说明

本文档记录了为 Figsci 项目集成玻尔平台光子扣费功能所做的所有修改。

## 📅 集成日期

2024-12-06

## 📋 功能概述

集成了玻尔平台的光子扣费功能，支持在用户使用 AI 生成图表时自动扣除光子费用。

### 主要特性

- ✅ 自动扣费：AI 生成完成后自动扣费
- ✅ 两种计费模式：固定扣费 / 按 Token 使用量扣费
- ✅ OAuth 集成：支持从 Cookie 获取用户 AK
- ✅ 开发调试支持：使用开发者 AK 进行本地测试
- ✅ 错误处理：扣费失败不影响主功能
- ✅ 完整文档：提供详细的配置和使用文档

## 📁 新增文件

### 1. API 路由

**文件**：`app/api/photon/charge/route.js`

**功能**：光子扣费 API 端点

**说明**：
- 提供独立的光子扣费接口
- 支持从 Cookie 或环境变量获取 AK
- 完整的错误处理和日志记录

### 2. 客户端工具库

**文件**：`lib/photon-client.js`

**功能**：光子扣费客户端工具函数

**提供的函数**：
- `chargePhoton(eventValue, options)` - 调用光子扣费
- `calculateChargeAmount(messageCount)` - 根据消息数量计算扣费
- `calculateChargeByTokens(tokenUsage)` - 根据 token 使用量计算扣费
- `isPhotonChargeEnabled()` - 检查是否启用扣费

### 3. UI 组件

**文件**：`components/photon-charge-notice.jsx`

**功能**：光子扣费相关的 UI 组件

**包含组件**：
- `PhotonChargeNotice` - 扣费提示组件
- `PhotonInsufficientNotice` - 余额不足提示
- `PhotonChargeHistory` - 扣费历史记录

### 4. 文档

#### 完整集成指南

**文件**：`docs/bohrium-photon-integration.md`

**内容**：
- 光子概念介绍
- 前置条件和配置步骤
- 使用方式和扣费规则
- 开发调试指南
- 常见问题解答
- 技术实现细节
- 合规性考量

#### 快速开始指南

**文件**：`docs/bohrium-photon-quickstart.md`

**内容**：
- 5 分钟快速配置
- 前置检查清单
- 测试步骤
- 常见问题排查

#### 变更说明

**文件**：`BOHRIUM_PHOTON_CHANGES.md`（本文件）

**内容**：
- 集成概述
- 文件变更列表
- 配置说明
- 使用示例

## 🔧 修改的文件

### 1. 聊天 API

**文件**：`app/api/chat/route.js`

**修改内容**：

1. 新增 `chargePhotonIfEnabled()` 函数
   - 在 AI 生成完成后自动调用
   - 支持两种计费模式
   - 完整的错误处理

2. 在 `streamText` 的 `onFinish` 回调中集成扣费
   ```javascript
   onFinish: async ({ responseMessage, messages: messages2 }) => {
     // ... 记录 token 使用量 ...
     
     // 光子扣费
     await chargePhotonIfEnabled(req, {
       inputTokens: totalUsage.inputTokens,
       outputTokens: totalUsage.outputTokens,
       totalTokens: (totalUsage.inputTokens || 0) + (totalUsage.outputTokens || 0)
     });
   }
   ```

3. 在非流式响应中也集成扣费
   ```javascript
   // 在 generateText 完成后调用
   await chargePhotonIfEnabled(req, {
     inputTokens: result.usage.inputTokens,
     outputTokens: result.usage.outputTokens,
     totalTokens: (result.usage.inputTokens || 0) + (result.usage.outputTokens || 0)
   });
   ```

### 2. 环境变量配置示例

**文件**：`env.example`

**新增配置**：

```env
# ===== 玻尔平台光子扣费配置 =====

# 是否启用光子扣费功能
NEXT_PUBLIC_ENABLE_PHOTON_CHARGE=false

# SKU ID（必需，如果启用扣费）
BOHRIUM_SKU_ID=

# 开发者 Access Key（用于开发调试）
BOHRIUM_DEV_ACCESS_KEY=

# 开发者 Client Name（可选）
BOHRIUM_CLIENT_NAME=

# 扣费模式：'fixed' 或 'token'
BOHRIUM_CHARGE_MODE=fixed

# 固定扣费金额
BOHRIUM_CHARGE_PER_REQUEST=1

# 基于 Token 的扣费金额
BOHRIUM_CHARGE_PER_1K_TOKEN=1

# 用户界面显示配置（可选）
NEXT_PUBLIC_PHOTON_CHARGE_PER_MESSAGE=1
NEXT_PUBLIC_PHOTON_CHARGE_PER_1K_TOKEN=1
```

### 3. README 文档

**文件**：`README_CN.md`

**修改内容**：

1. 在"配置说明"部分添加了光子扣费配置示例
2. 在"文档"部分添加了光子扣费文档链接

## 🎯 使用方法

### 最小配置（固定扣费模式）

在 `.env.local` 中添加：

```env
# 启用光子扣费
NEXT_PUBLIC_ENABLE_PHOTON_CHARGE=true

# 配置 SKU ID
BOHRIUM_SKU_ID=your-sku-id-here

# 配置开发者 AK（用于开发调试）
BOHRIUM_DEV_ACCESS_KEY=your-access-key-here

# 每次请求扣除 1 光子
BOHRIUM_CHARGE_MODE=fixed
BOHRIUM_CHARGE_PER_REQUEST=1
```

### 生产环境配置

1. **启用 OAuth**：在玻尔平台 App 管理界面启用 OAuth 能力

2. **配置环境变量**：
   ```env
   NEXT_PUBLIC_ENABLE_PHOTON_CHARGE=true
   BOHRIUM_SKU_ID=your-sku-id-here
   BOHRIUM_CHARGE_MODE=fixed
   BOHRIUM_CHARGE_PER_REQUEST=1
   ```

3. **用户授权**：用户首次使用时需要授权，系统会自动获取用户 AK

### 显示扣费提示（可选）

在聊天界面组件中添加：

```jsx
import { PhotonChargeNotice } from '@/components/photon-charge-notice';

function ChatPanel() {
  return (
    <div>
      {/* 显示扣费提示 */}
      <PhotonChargeNotice className="mb-4" />
      
      {/* 聊天界面 */}
      <ChatMessages />
      <ChatInput />
    </div>
  );
}
```

## 🔍 代码示例

### 自动扣费（已集成）

无需额外代码，系统在 AI 生成完成后自动扣费：

```javascript
// app/api/chat/route.js

const result = await streamText(commonConfig);

return result.toUIMessageStreamResponse({
  onFinish: async ({ responseMessage, messages: messages2 }) => {
    const usage = await result.usage;
    
    // 自动扣费
    await chargePhotonIfEnabled(req, {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens
    });
  }
});
```

### 手动扣费（高级用法）

如需在其他场景手动扣费：

```javascript
import { chargePhoton } from '@/lib/photon-client';

async function handleCustomAction() {
  try {
    const result = await chargePhoton(5, {
      scene: 'appCustomizeCharge'
    });
    
    console.log('扣费成功：', result);
  } catch (error) {
    console.error('扣费失败：', error.message);
  }
}
```

## 🧪 测试步骤

### 1. 配置环境变量

创建 `.env.local` 文件并配置必需的变量。

### 2. 启动应用

```bash
pnpm dev
```

### 3. 测试扣费

1. 打开应用：http://localhost:6002
2. 发送消息生成图表
3. 查看控制台输出：

```
发起光子扣费请求： {
  bizNo: 1733490123456,
  eventValue: 1,
  chargeMode: 'fixed',
  tokenUsage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 }
}
光子扣费成功： { bizNo: 1733490123456, eventValue: 1 }
```

### 4. 验证扣费

访问玻尔平台查看扣费记录：
https://www.bohrium.com/consume?tab=photon&menu=bills

## 🔐 安全性考虑

### 1. Access Key 保护

- ✅ 开发者 AK 存储在环境变量中，不会暴露给客户端
- ✅ 用户 AK 从 Cookie 中读取，由玻尔平台 OAuth 管理
- ✅ 所有扣费请求在服务端进行，客户端无法直接调用

### 2. 扣费验证

- ✅ 验证扣费金额必须大于 0
- ✅ 验证 SKU ID 是否配置
- ✅ 验证用户 AK 是否可用

### 3. 错误处理

- ✅ 扣费失败不影响主功能
- ✅ 记录详细的错误日志用于排查
- ✅ 生产环境不暴露敏感信息

## 📊 扣费统计

开发者可以在以下位置查看扣费统计：

- **开发者后台**：https://www.bohrium.com/developer/financial-management
- **统计范围**：2025 年 10 月 15 日之后的自定义 SKU 订单

## 🎓 学习资源

### 官方文档

- **玻尔平台开发者文档**：https://dptechnology.feishu.cn/wiki/LQKKwMet7i70XNk3TcjcwH8jnJi
- **SKU ID 申请表**：https://dptechnology.feishu.cn/share/base/form/shrcnpCtBXBYZNWmwiNDMdGPH5c

### 本项目文档

- **完整集成指南**：[docs/bohrium-photon-integration.md](./docs/bohrium-photon-integration.md)
- **快速开始**：[docs/bohrium-photon-quickstart.md](./docs/bohrium-photon-quickstart.md)

## ⚠️ 注意事项

### 1. 开发调试

- 使用开发者 AK 时会真实扣费
- 建议在开发阶段设置较小的扣费金额
- 或者暂时关闭扣费功能：`NEXT_PUBLIC_ENABLE_PHOTON_CHARGE=false`

### 2. 生产环境

- 必须启用 OAuth 能力
- 向用户清晰展示扣费信息
- 维护自己的扣费记录用于核对

### 3. 扣费失败

- 扣费失败不会影响主功能
- 失败原因会记录在日志中
- 建议实现前端提示，告知用户扣费状态

## 🐛 已知问题

目前无已知问题。

## 🚀 后续优化建议

1. **前端提示优化**
   - 在聊天界面集成 `PhotonChargeNotice` 组件
   - 实时显示用户光子余额
   - 扣费成功/失败的即时反馈

2. **数据统计**
   - 实现本地扣费记录数据库
   - 提供扣费统计图表
   - 定期与玻尔平台对账

3. **高级功能**
   - 实现免费额度支持
   - 根据用户等级调整扣费
   - 支持充值套餐和优惠券

4. **用户体验**
   - 预估扣费金额展示
   - 扣费记录查询
   - 余额预警提示

## 📞 支持

如有问题或建议，请：

1. 查看完整文档：[docs/bohrium-photon-integration.md](./docs/bohrium-photon-integration.md)
2. 在 GitHub 提 Issue
3. 参考玻尔平台官方文档

---

**集成完成时间**：2024-12-06  
**文档版本**：1.0.0  
**维护者**：Figsci Team
