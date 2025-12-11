# 模板匹配自定义 API 配置指南

## 概述

模板匹配功能支持使用自定义的大模型 API，而不是使用项目默认的 AI SDK。你可以通过环境变量或代码配置来指定自己的 API。

## 配置方式

### 方式 1：使用环境变量（推荐）

在项目根目录的 `.env.local` 或 `.env` 文件中添加以下配置：

```env
# 模板匹配专用的 API URL
NEXT_PUBLIC_TEMPLATE_MATCH_API_URL=https://api.your-custom-ai.com/v1/chat/completions

# 模板匹配专用的 API Key
NEXT_PUBLIC_TEMPLATE_MATCH_API_KEY=your-api-key-here

# 模板匹配使用的模型名称（可选，默认使用当前选中的模型）
NEXT_PUBLIC_TEMPLATE_MATCH_MODEL=gpt-4o-mini
```

**优点**：
- ✅ 安全：API Key 不会暴露在代码中
- ✅ 灵活：可以为不同环境配置不同的 API
- ✅ 易于管理：通过环境变量统一管理

**配置后**：
- 模板匹配功能会自动使用你配置的 API
- 其他功能（如聊天、图表生成）仍使用当前选中的模型

### 方式 2：在代码中硬编码（不推荐）

如果需要临时测试，可以在 `components/chat-panel-optimized.jsx` 的 `buildModelRequestBody` 函数中取消注释并填入配置：

```javascript
// 方式 2：如果需要在代码中硬编码（不推荐，仅用于测试）
if (!requestBody.customApiUrl) {
  requestBody.customApiUrl = "https://api.your-custom-ai.com/v1/chat/completions";
  requestBody.customApiKey = "your-api-key-here";
  requestBody.customModel = "your-model-name";
}
```

**注意**：
- ⚠️ 这种方式会将 API Key 暴露在前端代码中，存在安全风险
- ⚠️ 仅建议用于本地开发测试
- ⚠️ 不要将包含 API Key 的代码提交到版本控制系统

## API 响应格式要求

自定义 API 必须返回以下格式之一：

### 格式 1：OpenAI 兼容格式（推荐）
```json
{
  "choices": [
    {
      "message": {
        "content": "返回的文本内容"
      }
    }
  ]
}
```

### 格式 2：直接 content 字段
```json
{
  "content": "返回的文本内容"
}
```

### 格式 3：直接 text 字段
```json
{
  "text": "返回的文本内容"
}
```

### 格式 4：纯字符串
```
"返回的文本内容"
```

## 请求格式

系统会向你的 API 发送以下格式的请求：

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "你是一个专业的图表模板匹配专家..."
    },
    {
      "role": "user",
      "content": "用户输入的提示词..."
    }
  ],
  "temperature": 0.3
}
```

## 优先级

系统按以下优先级选择 API：

1. **自定义 API**（如果设置了 `NEXT_PUBLIC_TEMPLATE_MATCH_API_URL` 和 `NEXT_PUBLIC_TEMPLATE_MATCH_API_KEY`）
2. **当前选中的模型**（通过 `modelRuntime` 传递）
3. **系统模型**（如果启用）
4. **降级到关键词匹配**（如果所有 API 都不可用）

## 验证配置

配置完成后，在浏览器控制台查看日志：

- `🔄 使用自定义 AI API 进行匹配...` - 表示正在使用自定义 API
- `✅ 自定义 AI API 调用成功` - 表示 API 调用成功
- `❌ 自定义 API 调用失败` - 表示 API 调用失败，会降级到关键词匹配

## 故障排查

### 问题 1：仍然使用 AI SDK

**原因**：环境变量未正确加载

**解决**：
1. 确保环境变量以 `NEXT_PUBLIC_` 开头
2. 重启开发服务器（`npm run dev`）
3. 检查 `.env.local` 文件是否在项目根目录

### 问题 2：API 调用失败

**原因**：API URL 或 Key 配置错误

**解决**：
1. 检查 API URL 是否正确（包含完整的路径）
2. 检查 API Key 是否有效
3. 查看控制台错误信息，确认具体的失败原因

### 问题 3：响应格式不匹配

**原因**：API 返回的格式不符合要求

**解决**：
1. 检查 API 返回的格式是否符合上述要求
2. 如果不符合，需要修改 API 或添加适配层

## 示例配置

### 使用 OpenAI API
```env
NEXT_PUBLIC_TEMPLATE_MATCH_API_URL=https://api.openai.com/v1/chat/completions
NEXT_PUBLIC_TEMPLATE_MATCH_API_KEY=sk-...
NEXT_PUBLIC_TEMPLATE_MATCH_MODEL=gpt-4o-mini
```

### 使用 Anthropic Claude API
```env
NEXT_PUBLIC_TEMPLATE_MATCH_API_URL=https://api.anthropic.com/v1/messages
NEXT_PUBLIC_TEMPLATE_MATCH_API_KEY=sk-ant-...
NEXT_PUBLIC_TEMPLATE_MATCH_MODEL=claude-3-5-sonnet-20241022
```

### 使用自定义代理 API
```env
NEXT_PUBLIC_TEMPLATE_MATCH_API_URL=https://your-proxy.com/v1/chat/completions
NEXT_PUBLIC_TEMPLATE_MATCH_API_KEY=your-proxy-key
NEXT_PUBLIC_TEMPLATE_MATCH_MODEL=gpt-4o-mini
```

## 注意事项

1. **安全性**：API Key 应该保密，不要提交到版本控制系统
2. **成本**：使用自定义 API 会产生相应的费用，请注意控制调用频率
3. **性能**：确保 API 响应时间合理，避免影响用户体验
4. **兼容性**：确保 API 支持标准的 Chat Completions 格式

