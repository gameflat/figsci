# 玻尔平台光子扣费 - 快速开始

本文档提供快速配置玻尔平台光子扣费功能的步骤。

## 📋 前置检查清单

在开始之前，请确保已完成：

- [ ] 已申请并获得 SKU ID
- [ ] 已获取开发者 Access Key（用于开发调试）
- [ ] 已在玻尔平台启用 OAuth 能力（用于生产环境）

## 🚀 5 分钟快速配置

### 步骤 1: 配置环境变量

编辑 `.env.local` 文件，添加以下配置：

```env
# 启用光子扣费
NEXT_PUBLIC_ENABLE_PHOTON_CHARGE=true

# SKU ID（从申请表获取）
BOHRIUM_SKU_ID=your-sku-id-here

# 开发者 Access Key（用于本地调试）
BOHRIUM_DEV_ACCESS_KEY=your-access-key-here

# 扣费模式：fixed（固定） 或 token（按量）
BOHRIUM_CHARGE_MODE=fixed

# 每次请求扣除的光子数量
BOHRIUM_CHARGE_PER_REQUEST=1
```

### 步骤 2: 重启应用

```bash
pnpm dev
```

### 步骤 3: 测试扣费

1. 打开应用：http://localhost:6002
2. 发送消息生成图表
3. 查看控制台日志，确认扣费成功：

```
发起光子扣费请求： { bizNo: 1733490123456, eventValue: 1, ... }
光子扣费成功： { bizNo: 1733490123456, eventValue: 1 }
```

## ✅ 完成！

现在你的应用已经集成了光子扣费功能。每次用户生成图表时，系统会自动扣除相应的光子。

## 📚 进阶配置

### 按 Token 使用量计费

```env
BOHRIUM_CHARGE_MODE=token
BOHRIUM_CHARGE_PER_1K_TOKEN=1
```

### 在前端显示扣费信息

在你的聊天界面添加扣费提示组件：

```jsx
import { PhotonChargeNotice } from '@/components/photon-charge-notice';

function ChatPanel() {
  return (
    <div>
      {/* 显示扣费提示 */}
      <PhotonChargeNotice />
      
      {/* 你的聊天界面 */}
      <ChatMessages />
      <ChatInput />
    </div>
  );
}
```

### 自定义扣费逻辑

编辑 `app/api/chat/route.js` 中的 `chargePhotonIfEnabled` 函数：

```javascript
async function chargePhotonIfEnabled(req, usage) {
  // 根据用户等级调整扣费
  const userLevel = getUserLevel(req);
  
  if (userLevel === 'vip') {
    // VIP 用户免费或折扣
    return;
  }
  
  // 自定义扣费逻辑...
}
```

## 🔗 相关链接

- **完整文档**：[docs/bohrium-photon-integration.md](./bohrium-photon-integration.md)
- **API 文档**：https://dptechnology.feishu.cn/wiki/LQKKwMet7i70XNk3TcjcwH8jnJi
- **申请 SKU ID**：https://dptechnology.feishu.cn/share/base/form/shrcnpCtBXBYZNWmwiNDMdGPH5c

## 🆘 遇到问题？

### 扣费失败

检查：
1. SKU ID 是否正确配置
2. Access Key 是否有效
3. 用户光子余额是否充足
4. 查看控制台错误日志

### OAuth 未生效

检查：
1. 玻尔平台是否启用了 OAuth 能力
2. 用户是否完成授权
3. Cookie 中是否包含 `appAccessKey`

### 更多帮助

参考完整文档或在 GitHub 提 Issue。
