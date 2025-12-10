# 多模型对比功能处理逻辑分析

## 概述

Figsci 支持同时配置最多 5 个来自不同 LLM API 服务商的大模型进行对比。当用户触发对比请求时，系统会将同一条提示词同步发送给所有配置的模型，并展示各个模型的生成结果，方便用户对比不同模型的效果。

## 整体流程

```
用户配置模型 → 触发对比请求 → 并行调用多个模型 → 收集结果 → 展示对比结果 → 用户选择应用
```

## 详细处理逻辑

### 1. 模型配置阶段

#### 1.1 配置对话框组件 (`components/model-comparison-config-dialog.jsx`)

**功能**：
- 允许用户选择 2-5 个模型进行对比
- 支持添加/删除模型
- 支持同步当前对话模型到模型 A
- 支持全部同步到当前模型

**关键常量**：
```javascript
const MAX_MODELS = 5;  // 最多 5 个模型
const MIN_MODELS = 2;  // 最少 2 个模型
const SLOT_LABELS = ["A", "B", "C", "D", "E"];  // 模型槽位标签
```

**配置数据结构**：
```javascript
{
  models: string[]  // 存储模型 key 的数组，最多 5 个
}
```

**关键操作**：
- `handleAddModel()`: 添加新模型（最多 5 个）
- `handleRemoveModel(index)`: 删除指定模型（至少保留 2 个）
- `handleUpdateModel(index, modelKey)`: 更新指定位置的模型
- `handleSyncFirst()`: 将模型 A 同步为当前对话模型
- `handleSyncAll()`: 将所有模型同步为当前对话模型

### 2. 对比请求处理阶段

#### 2.1 对比工作台 Hook (`features/chat-panel/hooks/use-comparison-workbench.js`)

**主要函数：`handleCompareRequest`**

**处理流程**：

1. **前置检查**：
   ```javascript
   - 检查是否正在流式生成（status === "streaming"）
   - 检查是否已有对比任务在执行（isComparisonRunning）
   - 检查输入是否为空
   - 检查分支选择是否已确定
   ```

2. **模型解析**：
   ```javascript
   // 从配置中解析模型选项
   const resolvedOptions = [];
   for (const modelKey of comparisonConfig.models) {
     const option = getModelOption(modelKey);
     if (option) {
       resolvedOptions.push(option);
     }
   }
   
   // 如果配置为空，使用当前选中的模型作为后备
   if (resolvedOptions.length === 0 && selectedModelKey) {
     const fallback = getModelOption(selectedModelKey);
     if (fallback) {
       resolvedOptions.push(fallback);
     }
   }
   
   // 如果少于 2 个模型，复制第一个模型
   if (resolvedOptions.length < 2) {
     resolvedOptions.push(resolvedOptions[0]);
   }
   ```

3. **模型元数据构建**：
   ```javascript
   const slots = ["A", "B", "C", "D", "E"];
   const modelsMeta = resolvedOptions.map((option, index) => {
     const slot = slots[index] ?? "A";
     
     // 区分系统模型和自定义模型
     if (option.isSystemModel) {
       // 系统模型：只传递标志，服务端从环境变量获取配置
       return {
         key: option.key,
         id: option.modelId,
         label: `${option.label || option.modelId} · 模型 ${slot}`,
         provider: option.providerHint,
         slot,
         isSystemModel: true,
       };
     } else {
       // 自定义模型：传递完整的 runtime 配置
       return {
         key: option.key,
         id: option.modelId,
         label: `${option.label || option.modelId} · 模型 ${slot}`,
         provider: option.providerHint,
         slot,
         runtime: {
           modelId: option.modelId,
           baseUrl: option.baseUrl,
           apiKey: option.apiKey,
           label: option.label
         }
       };
     }
   });
   ```

4. **创建对比条目**：
   ```javascript
   const requestId = createComparisonEntry({
     prompt: enrichedInput,  // 包含 Brief 的完整提示词
     badges: briefContext.badges,
     models: modelsMeta,
     anchorMessageId: userMessageId
   });
   ```

5. **发送 API 请求**：
   ```javascript
   const requestBody = {
     models: modelsMeta.map((model) => {
       // 系统模型：传递 isSystemModel 标志
       if (model.isSystemModel) {
         return {
           id: model.id,
           key: model.key,
           label: model.label,
           provider: model.provider,
           slot: model.slot,
           isSystemModel: true
         };
       }
       // 自定义模型：传递 runtime 配置
       return {
         id: model.id,
         key: model.key,
         label: model.label,
         provider: model.provider,
         slot: model.slot,
         runtime: model.runtime
       };
     }),
     prompt: enrichedInput,
     xml: chartXml,  // 当前画布 XML
     brief: briefContext.prompt,
     renderMode,  // "drawio" 或 "svg"
     attachments: attachments  // 附件（如果有）
   };
   
   const response = await fetch("/api/model-compare", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify(requestBody),
     signal: controller.signal  // 支持取消请求
   });
   ```

6. **结果处理**：
   ```javascript
   const data = await response.json();
   const rawResults = Array.isArray(data?.results) ? data.results : [];
   
   // 规范化结果
   const normalizedResults = normalizeComparisonResults(
     modelsMeta,
     rawResults
   );
   
   // 为每个结果创建分支
   const bindings = createComparisonBranchesForResults(
     requestId,
     normalizedResults,
     originBranchId,
     branchSeedMessages
   );
   
   // 更新对比条目
   updateComparisonEntry(requestId, (entry) => ({
     ...entry,
     status: "ready",
     prompt: enrichedInput,
     results: enrichedResults
   }));
   ```

### 3. API 处理阶段 (`app/api/model-compare/route.js`)

#### 3.1 请求验证

```javascript
// 验证必需参数
if (!prompt || prompt.trim().length === 0) {
  return Response.json({ error: "prompt 不能为空。" }, { status: 400 });
}

// 规范化模型配置数组
const normalizedModels = (Array.isArray(models) ? models : [])
  .map((item) => typeof item === "string" ? { id: item } : item)
  .filter((item) => {
    if (!item?.id || item.id.trim().length === 0) {
      return false;
    }
    // 系统模型：检查 isSystemModel 标志
    if (item.isSystemModel) {
      return isSystemModelsEnabled() && isSystemModel(item.id);
    }
    // 自定义模型：需要完整的 runtime 配置
    return Boolean(
      item?.runtime && 
      typeof item.runtime.baseUrl === "string" && 
      typeof item.runtime.apiKey === "string" && 
      typeof item.runtime.modelId === "string"
    );
  });

// 验证至少需要一个有效的模型配置
if (normalizedModels.length === 0) {
  return Response.json(
    { error: "至少需要选择一个模型进行对比。" },
    { status: 400 }
  );
}
```

#### 3.2 构建用户提示

```javascript
function buildUserPrompt(prompt, xml, brief, renderMode = "drawio") {
  const sections = [];
  if (brief && brief.trim().length > 0) {
    sections.push(brief.trim());
  }
  sections.push(prompt.trim());
  
  return `当前图表 XML：
"""xml
${xml ?? ""}
"""

用户最新指令：
"""md
${sections.join("\n\n")}
"""

请输出 JSON（字段：summary, ${renderMode === "svg" ? "svg" : "xml"}），用于模型效果对比。`;
}
```

#### 3.3 并行调用多个模型

**关键：使用 `Promise.all` 并行调用所有模型**

```javascript
const results = await Promise.all(
  normalizedModels.map(async (model) => {
    const startTime = Date.now();
    try {
      // 解析模型配置
      let resolved;
      if (model.isSystemModel) {
        // 系统模型：从服务端环境变量获取配置
        resolved = resolveSystemModel(model.id);
      } else {
        // 自定义模型：使用客户端传入的 runtime 配置
        resolved = resolveChatModel(model.runtime);
      }
      
      // 调用模型生成图表（非流式，因为需要完整的 JSON 响应）
      const response = await generateText({
        model: resolved.model,
        system: mode === "svg" 
          ? MODEL_COMPARE_SYSTEM_PROMPT_SVG 
          : MODEL_COMPARE_SYSTEM_PROMPT_XML,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              ...attachmentParts  // 包含附件（如果有）
            ]
          }
        ],
        temperature: 0.1,  // 使用较低温度确保结果的一致性
        abortSignal  // 传递 AbortSignal 以支持取消请求
      });
      
      const endTime = Date.now();
      const durationMs = endTime - startTime;
      
      // 解析模型返回的 JSON 对象
      const payload = extractJsonPayload(response.text, mode);
      
      // 如果是 drawio 模式，生成预览图
      const preview = payload.xml 
        ? await exportDiagramPreview(payload.xml) 
        : {};
      
      // 获取 token 使用信息
      const usage = response.usage;
      
      // 返回成功结果
      return {
        id: resolved.id,
        label: model.label ?? resolved.label,
        provider: resolved.provider,
        status: "ok",
        summary: payload.summary,  // 差异描述
        xml: payload.xml,  // draw.io XML（drawio 模式）
        svg: payload.svg,  // SVG（svg 模式）
        previewSvg: payload.previewSvg,  // 预览 SVG（可选）
        previewImage: preview.image,  // PNG 预览图（drawio 模式）
        usage: {
          inputTokens: usage.inputTokens || 0,
          outputTokens: usage.outputTokens || 0,
          totalTokens: (usage.inputTokens || 0) + (usage.outputTokens || 0)
        },
        durationMs  // 耗时（毫秒）
      };
    } catch (error) {
      // 错误处理：记录错误但继续处理其他模型
      const endTime = Date.now();
      const durationMs = endTime - startTime;
      const message = error instanceof Error ? error.message : "模型调用失败";
      
      // 返回错误结果（不抛出异常，确保其他模型的结果能正常返回）
      return {
        id: model.id,
        label: model.label ?? model.id,
        provider: "unknown",
        status: "error",
        error: message,
        durationMs
      };
    }
  })
);

// 返回所有模型的结果数组
return Response.json({ results });
```

**关键设计点**：
- ✅ **并行处理**：使用 `Promise.all` 同时调用所有模型，提高效率
- ✅ **错误隔离**：单个模型失败不影响其他模型的结果
- ✅ **统一格式**：所有结果统一格式，便于前端处理
- ✅ **支持取消**：通过 `AbortSignal` 支持请求取消

#### 3.4 JSON 解析

```javascript
function extractJsonPayload(text, renderMode) {
  // 尝试从代码块中提取 JSON（模型可能用 ```json 包裹）
  const jsonBlockMatch = text.match(/```json([\s\S]*?)```/i);
  const jsonString = jsonBlockMatch 
    ? jsonBlockMatch[1] 
    : text.trim().startsWith("{") 
      ? text.trim() 
      : "";
  
  if (!jsonString) {
    throw new Error("模型未返回 JSON 结果，请重试或更换模型。");
  }
  
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new Error("无法解析模型返回的 JSON 内容。");
  }
  
  // 提取并验证各个字段
  const summary = typeof parsed.summary === "string" ? parsed.summary : "";
  const xml = typeof parsed.xml === "string" ? parsed.xml : void 0;
  const svg = typeof parsed.svg === "string" ? parsed.svg : void 0;
  const previewSvg = typeof parsed.previewSvg === "string" ? parsed.previewSvg : void 0;
  
  // 根据渲染模式验证必需字段
  if (renderMode === "svg" && !svg) {
    throw new Error("模型返回结果缺少 svg 字段。");
  }
  if (renderMode === "drawio" && !xml) {
    throw new Error("模型返回结果缺少 xml 字段。");
  }
  
  return { summary, xml, svg, previewSvg };
}
```

#### 3.5 预览图生成（drawio 模式）

```javascript
async function exportDiagramPreview(xml) {
  if (!xml || xml.trim().length === 0) {
    return {};
  }
  
  try {
    // 构建 draw.io 导出 API 的请求参数
    const params = new URLSearchParams();
    params.set("format", "png");
    params.set("embedImages", "1");
    params.set("border", "0");
    params.set("base64", "1");
    params.set("w", "800");
    params.set("h", "600");
    params.set("xml", xml);
    
    const drawioBaseUrl = process.env.NEXT_PUBLIC_DRAWIO_BASE_URL 
      || "https://app.diagrams.net";
    
    // 调用 draw.io 导出 API
    const response = await fetch(`${drawioBaseUrl}/export3`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
    
    if (!response.ok) {
      return {};
    }
    
    const text = (await response.text()).trim();
    if (!text) {
      return {};
    }
    
    // 如果返回的不是 data URL 格式，添加前缀
    const dataUrl = text.startsWith("data:") 
      ? text 
      : `data:image/png;base64,${text}`;
    
    return { image: dataUrl };
  } catch (error) {
    console.error("Failed to export diagram preview:", error);
    return {};  // 静默处理错误，不影响对比流程
  }
}
```

### 4. 结果展示阶段

#### 4.1 对比结果渲染 (`components/chat-message-display-optimized.jsx`)

**渲染函数：`renderComparisonEntry`**

**展示方式**：
- **2 个结果**：并排展示
- **超过 2 个结果**：横向滑动展示（每个卡片宽度 360px）

**结果卡片结构**：
```javascript
<div className="w-full overflow-x-auto">
  <div className="flex gap-3 pb-2" style={{
    width: `${entry.results.length * 360 + (entry.results.length - 1) * 12}px`,
    overflowX: "auto",
    scrollBehavior: "smooth"
  }}>
    {entry.results.map((result, resultIndex) => (
      <div className="flex flex-col rounded-lg" style={{ 
        width: "360px", 
        height: "260px" 
      }}>
        {/* 预览图区域（220px 高度） */}
        {/* 操作按钮区域（40px 高度） */}
      </div>
    ))}
  </div>
</div>
```

**每个结果卡片包含**：
- **预览图**：支持 SVG、PNG 图片或 iframe（draw.io 预览）
- **模型标签**：左上角显示 "模型 A"、"模型 B" 等
- **使用中标签**：右上角显示 "✓ 使用中"（如果该结果已应用到画布）
- **操作按钮**：
  - "设为画布"：应用该结果到主画布
  - "复制 XML"：复制 XML 到剪贴板
  - "下载 XML"：下载 XML 文件
  - "预览"：全屏预览图表
  - "重试"：重新生成该模型的结果

#### 4.2 分支管理

**为每个结果创建独立分支**：
```javascript
const bindings = createComparisonBranchesForResults(
  requestId,
  normalizedResults,
  originBranchId,
  branchSeedMessages
);

// 每个结果都有一个对应的分支 ID
const enrichedResults = normalizedResults.map((result) => ({
  ...result,
  branchId: bindings[result.id]
}));
```

**分支的作用**：
- 用户可以在不同结果之间切换
- 每个结果都有独立的对话历史
- 支持回滚到特定结果

### 5. 错误处理

#### 5.1 单个模型失败

- ✅ **不影响其他模型**：使用 `Promise.all` 时，单个模型失败不会阻止其他模型继续执行
- ✅ **返回错误结果**：失败的模型会返回 `status: "error"` 的结果
- ✅ **前端展示错误**：错误结果会以红色背景展示，显示错误消息

#### 5.2 所有模型失败

- ✅ **显示错误提示**：前端会显示 "两个模型均未返回有效结果，请检查提示词或模型设置。"
- ✅ **不要求分支决策**：如果所有模型都失败，不会要求用户选择分支

#### 5.3 请求取消

- ✅ **支持 AbortSignal**：前端可以通过 `AbortController` 取消请求
- ✅ **静默处理**：取消请求时不会显示错误提示

### 6. 性能优化

#### 6.1 并行处理

- ✅ **Promise.all**：所有模型同时调用，总耗时 = 最慢模型的耗时
- ✅ **非流式生成**：对比功能使用非流式生成，确保获取完整结果

#### 6.2 预览图生成

- ✅ **异步生成**：预览图生成不影响主流程
- ✅ **失败容错**：预览图生成失败不影响结果展示

#### 6.3 结果缓存

- ✅ **对比历史**：所有对比结果保存在 `comparisonHistory` 中
- ✅ **支持重试**：可以单独重试某个模型的结果

## 数据流图

```
用户操作
  ↓
[配置模型] → ModelComparisonConfigDialog
  ↓
[触发对比] → handleCompareRequest
  ↓
[构建请求] → 模型元数据 + 提示词 + XML + 附件
  ↓
[API 请求] → POST /api/model-compare
  ↓
[并行调用] → Promise.all([model1, model2, ..., model5])
  ↓
[解析结果] → extractJsonPayload → 提取 XML/SVG + summary
  ↓
[生成预览] → exportDiagramPreview → PNG 预览图
  ↓
[返回结果] → { results: [...] }
  ↓
[创建分支] → createComparisonBranchesForResults
  ↓
[更新条目] → updateComparisonEntry
  ↓
[展示结果] → renderComparisonEntry → 横向滑动卡片
  ↓
[用户选择] → 应用结果到画布 / 切换分支
```

## 关键设计决策

### 1. 为什么使用非流式生成？

- ✅ **需要完整 JSON**：对比功能需要模型返回完整的 JSON 结果
- ✅ **并行处理**：非流式更适合并行调用多个模型
- ✅ **结果一致性**：确保所有模型的结果格式统一

### 2. 为什么为每个结果创建分支？

- ✅ **独立历史**：每个结果都有独立的对话历史
- ✅ **支持切换**：用户可以在不同结果之间切换
- ✅ **支持回滚**：可以回滚到特定结果

### 3. 为什么使用横向滑动展示？

- ✅ **空间利用**：超过 2 个结果时，横向滑动比垂直堆叠更节省空间
- ✅ **对比方便**：用户可以快速滑动查看所有结果
- ✅ **响应式设计**：适配不同屏幕尺寸

## 总结

多模型对比功能的处理逻辑设计合理，具有以下优点：

1. ✅ **高效并行**：使用 `Promise.all` 并行调用所有模型
2. ✅ **错误隔离**：单个模型失败不影响其他模型
3. ✅ **灵活配置**：支持 2-5 个模型，支持系统模型和自定义模型
4. ✅ **友好展示**：横向滑动展示，支持预览、复制、下载等操作
5. ✅ **分支管理**：为每个结果创建独立分支，支持切换和回滚

整个流程从配置到展示都经过精心设计，确保了良好的用户体验和系统稳定性。

