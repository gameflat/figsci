# AI Agents 智能模板匹配系统

## 概述

本目录包含基于 AI SDK 的智能模板匹配系统，用于自动分析用户输入并匹配最合适的图表模板，同时将用户输入格式化为规范的提示词。

## 目录结构

```
llm/
├── agents/              # AI Agents 实现
│   ├── template-matcher.js    # 模板匹配 Agent
│   ├── prompt-formatter.js    # 提示词格式化 Agent
│   └── workflow.js            # 工作流编排
├── utils/               # 工具函数
│   └── template-loader.js     # 模板加载工具
├── types/               # 类型定义
│   └── index.js
└── README.md            # 本文档
```

## 功能说明

### 置信度阈值

系统设置了 **0.8** 的置信度阈值。只有当模板匹配的置信度 >= 0.8 时，才会使用模板并格式化提示词。如果置信度低于 0.8，系统会：
- 不使用模板
- 直接使用用户原始输入
- 不应用模板的 Brief 配置

这样可以确保只有在高度匹配的情况下才应用模板，避免不合适的模板影响用户体验。

### 1. 模板匹配 Agent (`template-matcher.js`)

**功能**：分析用户输入，智能匹配最合适的模板

**工作流程**：
1. 获取所有可用模板
2. 构建模板上下文信息
3. 使用 LLM 分析用户输入并匹配模板
4. 如果 LLM 不可用，降级到关键词匹配

**返回结果**：
```javascript
{
  templateId: string,      // 匹配到的模板 ID
  confidence: number,      // 匹配置信度 (0-1)
  reason: string          // 匹配原因说明
}
```

### 2. 提示词格式化 Agent (`prompt-formatter.js`)

**功能**：将用户输入按照模板格式生成规范的提示词

**工作流程**：
1. 获取匹配到的模板信息
2. 使用 LLM 将用户输入格式化为模板格式
3. 如果 LLM 不可用，使用简单拼接策略

**返回结果**：
```javascript
{
  formattedPrompt: string,  // 格式化后的提示词
  appliedBrief: Object      // 应用的 Brief 配置
}
```

### 3. 工作流编排 (`workflow.js`)

**功能**：编排模板匹配和提示词格式化流程

**工作流程**：
1. 执行模板匹配
2. 基于匹配结果执行提示词格式化
3. 返回完整结果

## API 接口

### POST /api/template-match

**功能**：智能模板匹配接口

**请求体**：
```json
{
  "userInput": "用户输入的原始内容",
  "currentXml": "当前画布的 XML（可选）",
  "modelRuntime": {
    "useSystemModel": true,
    "systemModelId": "gpt-4o-mini"
    // 或
    "modelRuntime": {
      "baseUrl": "...",
      "apiKey": "...",
      "modelId": "..."
    }
  }
}
```

**响应**：
```json
{
  "formattedPrompt": "格式化后的提示词",
  "templateId": "匹配到的模板 ID",
  "brief": {
    "intent": "...",
    "tone": "...",
    "focus": [...],
    "diagramTypes": [...]
  },
  "confidence": 0.85,
  "reason": "匹配原因说明"
}
```

## 使用方式

### 在消息发送时自动触发

当用户在输入框中输入内容并发送消息时，系统会自动：

1. **检查输入框是否有内容**
   - 如果为空：保持原有逻辑（点击"一键套用"将模板提示词放入输入框）
   - 如果有内容：调用智能模板匹配

2. **执行智能匹配**
   - 调用 `/api/template-match` 接口
   - 获取匹配结果和格式化后的提示词

3. **应用结果**
   - 使用格式化后的提示词发送消息
   - 自动应用匹配模板的 Brief 配置

### 代码示例

```javascript
// 在 chat-panel-optimized.jsx 中的 onFormSubmit 函数
if (input.trim()) {
  try {
    const matchResponse = await fetch("/api/template-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userInput: input.trim(),
        currentXml: chartXml,
        modelRuntime: buildModelRequestBody(selectedModel),
      }),
    });
    
    if (matchResponse.ok) {
      const matchResult = await matchResponse.json();
      if (matchResult.formattedPrompt) {
        finalInput = matchResult.formattedPrompt;
        // 应用 Brief 配置
        setBriefState(prev => ({
          ...prev,
          ...matchResult.brief,
        }));
      }
    }
  } catch (error) {
    // 失败时使用原始输入
    console.warn("模板匹配失败，使用原始输入:", error);
  }
}
```

## 降级策略

系统实现了多级降级策略，确保在 LLM 不可用时仍能正常工作：

1. **LLM 匹配失败** → 降级到关键词匹配
2. **关键词匹配失败** → 使用默认热门模板
3. **格式化失败** → 使用简单拼接策略

## 配置要求

### 环境变量

如果使用系统模型，需要配置：

```env
SYSTEM_LLM_BASE_URL=https://api.openai.com/v1
SYSTEM_LLM_API_KEY=your-api-key
```

### 模型选择

系统会按以下优先级选择模型：

1. **自定义 API**（如果提供 `customApiUrl` 和 `customApiKey`）
2. 用户当前选中的模型（如果提供）
3. 系统模型（如果启用）
4. 降级到关键词匹配

### 使用自定义 AI API

如果你想使用自己的 AI API 而不是 "ai" 包的 `generateText`，可以在调用 `/api/template-match` 时传递自定义 API 配置：

```javascript
const matchResponse = await fetch("/api/template-match", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userInput: input.trim(),
    currentXml: chartXml,
    modelRuntime: {
      customApiUrl: "https://api.your-ai-service.com/v1/chat/completions",
      customApiKey: "your-api-key",
      customModel: "gpt-4o-mini", // 可选，默认 "gpt-4o-mini"
    },
  }),
});
```

**自定义 API 响应格式支持**：
- OpenAI 格式：`{ choices: [{ message: { content: "..." } }] }`
- 直接 content：`{ content: "..." }`
- 直接 text：`{ text: "..." }`
- 纯字符串：`"..."`

**注意**：自定义 API 必须返回 JSON 格式的响应，且包含文本内容字段。

## 注意事项

1. **性能考虑**：模板匹配会增加一次 LLM 调用，可能增加响应时间
2. **错误处理**：匹配失败不会影响主流程，会使用原始输入
3. **成本考虑**：每次匹配会消耗 LLM token，建议使用成本较低的模型（如 gpt-4o-mini）

## 扩展开发

### 添加新的匹配规则

在 `template-matcher.js` 的 `fallbackTemplateMatching` 函数中添加：

```javascript
const keywordRules = [
  // ... 现有规则
  { keywords: ["新关键词"], templateId: "新模板ID" },
];
```

### 自定义格式化策略

在 `prompt-formatter.js` 的 `simpleFormatPrompt` 函数中修改格式化逻辑。

## 相关文件

- `app/api/template-match/route.js` - API 路由实现
- `components/chat-panel-optimized.jsx` - 前端集成
- `data/templates.js` - 模板数据源

