# Figsci Studio 架构文档

## 1. 分层概述

参考 Google 规模的前端指南，工作区现在遵循三个同心分层结构，确保职责隔离和可组合性：

1. **应用层（`app/`）** – Next.js 路由、布局和页面级连接。仅导入面向功能的入口点和框架提供者。
2. **功能层（`features/`）** – 拥有自身状态编排、hooks 和视图原语的垂直切片。每个功能向应用层暴露一个窄接口（通常是 React 组件或 hook）。
3. **共享层（`components/`、`lib/`、`contexts/`、`hooks/`、`types/`）** – 纯 UI 原子、上下文和工具函数，可被任何功能复用，且不会泄露业务逻辑。

所有新功能都应该放在 `features/<domain>` 中，并配置共置的 hooks/组件/测试，这样未来的贡献者只需打开单个文件夹即可开发一个功能。

## 2. 目录结构

```
app/
  api/                    # Next.js API 路由
    chat/                 # 聊天和图表生成的主要接口
    diagram-repair/       # 图表修复功能
    model-compare/        # 多模型对比功能
    template-match/       # 智能模板匹配
    search-template/      # 模板搜索
    models/               # 模型列表获取
    system-models/        # 系统内置模型列表
    configs/              # 配置管理
    photon/               # 光子扣费相关接口
      charge/             # 光子扣费
      pre-charge/         # 预扣费检查
    auth/                 # 认证相关接口
  page.jsx                # 主页面
  ppt/page.jsx            # PPT 工作室页面
components/               # React 组件
  ui/                     # UI 基础组件（Radix UI）
  photon-charge-notice.jsx # 光子扣费提示组件
  chat-panel-optimized.jsx # 聊天面板入口组件
  # ... 其他业务组件
contexts/                 # React Context
  conversation-context.jsx    # 对话状态管理
  diagram-context.jsx         # Draw.io 图表状态管理
  svg-editor-context.jsx      # SVG 编辑器状态管理
  ppt-studio-context.jsx      # PPT 工作室状态
  locale-context.jsx          # 国际化
features/                 # 功能模块
  chat-panel/
    components/
      intelligence-toolbar.jsx
      tool-panel-sidebar.jsx
    hooks/
      use-comparison-workbench.js
      use-diagram-orchestrator.js
    utils/
      attachments.js
      messages.js
    constants.js
    types.js
hooks/                    # 自定义 React Hooks
  use-chat-state.js
  use-drawio-fallback.js  # Draw.io 降级处理
  use-model-registry.js
lib/                      # 工具库
  server-models.js        # 服务端模型解析和配置
  diagram-validation.js   # 图表验证
  svg.js                  # SVG 处理工具
  photon-client.js        # 光子扣费客户端工具
  charge-utils.js         # 扣费信息工具函数
  # ... 其他工具函数
types/                    # 类型定义
llm/                      # AI Agents 工作流
  agents/
    template-matcher.js
    prompt-formatter.js
    workflow.js
```

关键点：
- **功能隔离** – `features/chat-panel` 封装了所有与会话工具相关的内容（状态机、UI 界面、辅助函数）。文件夹外部无需了解比较预览或自动修复的行为。
- **共享上下文** – `contexts/diagram-context`、`contexts/conversation-context` 和 `contexts/svg-editor-context` 是单一数据源提供者。功能 hooks 消费它们的 API，而不是复制逻辑。
- **纯 UI 原子** – `components/` 保留通用 UI，如 `ChatMessageDisplay`、`ChatInputOptimized` 等。它们通过 props 接收数据/处理函数，对编排细节保持无感知。
- **API 路由分层** – `app/api/` 下的路由按功能域组织，每个路由处理特定的业务逻辑。
- **工具库分离** – `lib/` 中的工具函数按功能分类，便于复用和维护。

## 3. 聊天面板分解

原始的 `ChatPanelOptimized`（约 2000 行代码）混合了传输逻辑、比较流程、自动修复和 UI 标记。它已被分解如下：

### Hooks
- `useDiagramOrchestrator`
  - 拥有 Draw.io XML 生命周期（应用/验证/自动修复），并为功能消费者暴露 `handleDiagramXml`、`tryApplyRoot` 和 ref 工具函数。
  - 集中运行时错误处理，任何消费者只需调用单个函数即可同步画布状态。
- `useComparisonWorkbench`
  - 管理模型比较工作流：分支创建、预览/应用/重试流程、通知队列、配置模态框状态和请求管道。
  - 返回"守卫"辅助函数（`ensureBranchSelectionSettled`、`releaseBranchRequirement`、`notifyComparison`），以便其他 UI 操作在比较决策待定时可以短路。

### 组件
- `IntelligenceToolbar` – 使用清晰的 API 渲染智能工具切换组。
- `ToolPanelSidebar` – 侧边栏的共享外壳（brief、calibration、templates），保持标记与主文件分离。

### 工具函数和常量
- `constants.ts` – 承载 Figsci 校准提示词、工具栏元数据和精选的快速操作，以便设计者可以在不接触组件逻辑的情况下调整内容。
- `utils/messages.ts` 和 `utils/attachments.ts` – 用于克隆聊天历史和序列化用户上传的副作用辅助函数。

### 入口组件（`components/chat-panel-optimized.tsx`）
现在专注于连接：
- 消费功能 hooks 和上下文。
- 处理纯 UI 关注点（表单输入、切换开关、堆叠卡片）。
- 通过 props 将重量级流程委托给 hooks/组件。

最终结果：`ChatPanelOptimized` 减少了约 60%，每个行为都可以独立演化。

## 4. 核心功能架构

### 4.1 渲染模式架构

项目支持两种渲染模式，通过统一的接口抽象：

#### Draw.io 模式（默认）

```
用户请求
  ↓
ChatPanelOptimized
  ↓
useDiagramOrchestrator
  ↓
DiagramContext (diagram-context.jsx)
  ↓
DrawIoEmbed (react-drawio)
  ↓
Draw.io 编辑器
```

**关键组件**：
- `contexts/diagram-context.jsx` - Draw.io 状态管理
- `components/` 中的 Draw.io 相关组件
- `hooks/use-drawio-fallback.js` - Draw.io 降级处理

#### SVG 模式

```
用户请求
  ↓
ChatPanelOptimized
  ↓
SvgEditorContext (svg-editor-context.jsx)
  ↓
SvgStudio (components/svg-studio.jsx)
  ↓
SVG Canvas
```

**关键组件**：
- `contexts/svg-editor-context.jsx` - SVG 编辑器状态管理
- `components/svg-studio.jsx` - SVG 编辑器组件
- `lib/svg.js` - SVG 处理工具函数

### 4.2 光子扣费架构

```
用户操作
  ↓
ChatPanelOptimized
  ↓
/api/chat (route.js)
  ↓
AI 生成完成 → chargePhotonIfEnabled()
  ↓
/api/photon/charge (route.js)
  ↓
玻尔平台 API
```

**关键组件**：
- `app/api/photon/charge/route.js` - 光子扣费 API
- `app/api/photon/pre-charge/route.js` - 预扣费检查 API
- `lib/photon-client.js` - 光子扣费客户端工具
- `lib/charge-utils.js` - 扣费信息工具函数
- `components/photon-charge-notice.jsx` - 扣费提示组件

**扣费模式**：
- **固定扣费（fixed）**：每次成功请求扣除固定金额
- **Token 扣费（token）**：根据实际 token 使用量扣费
- **混合扣费（mixed）**：固定费用 + Token 费用

### 4.3 多模型对比架构

```
用户配置模型
  ↓
ModelComparisonConfigDialog
  ↓
useComparisonWorkbench
  ↓
/api/model-compare (route.js)
  ↓
Promise.all([model1, model2, ...])  # 并行调用
  ↓
结果规范化 → 创建分支 → 展示对比
```

**关键组件**：
- `features/chat-panel/hooks/use-comparison-workbench.js` - 对比工作流管理
- `app/api/model-compare/route.js` - 模型对比 API
- `components/model-comparison-config-dialog.jsx` - 模型配置对话框

### 4.4 模板匹配架构

```
用户输入提示词
  ↓
TemplateMatcher Agent (llm/agents/template-matcher.js)
  ↓
自定义 API 或 AI SDK
  ↓
模板匹配结果
  ↓
TemplateGallery 展示
```

**关键组件**：
- `llm/agents/template-matcher.js` - 模板匹配 Agent
- `app/api/template-match/route.js` - 模板匹配 API
- `components/template-gallery.jsx` - 模板画廊组件

### 4.5 Draw.io 降级架构

```
加载 Draw.io 编辑器
  ↓
useDrawioFallback Hook
  ↓
主 URL 加载（15秒超时）
  ├─ 成功 → 正常使用
  └─ 失败 → 切换到备用 URL
      ├─ 成功 → 使用备用 URL，显示提示
      └─ 失败 → 显示错误，提供重试
```

**关键组件**：
- `hooks/use-drawio-fallback.js` - Draw.io 降级逻辑
- `app/page.jsx` - 主页面集成降级功能

## 5. 扩展系统

添加功能时，遵循以下工作流：
1. **创建功能切片** 在 `features/<domain>/` 下，配置共置的 hooks 和视图原语。
2. **使用上下文契约** 而不是深入到无关模块。例如，分支操作必须通过 `useConversationManager` 进行。
3. **暴露最小入口点** – 导出一个应用层可以消费的 hook 或组件；保持其他所有内容对功能私有。
4. **优先使用组合** – 当 UI 增长时，添加展示组件（如新的工具栏/横幅/侧边栏），而不是扩展容器文件。
5. **记录流程** – 添加新模块/流程时更新本文档，以便未来的贡献者快速理解依赖图。

## 6. API 路由架构

### 6.1 路由分类

#### 核心功能路由
- **`/api/chat`** - 聊天和图表生成的主要接口，集成光子扣费
- **`/api/diagram-repair`** - 图表修复功能
- **`/api/model-compare`** - 多模型并行对比

#### 模板相关路由
- **`/api/template-match`** - 智能模板匹配（使用 AI Agents）
- **`/api/search-template`** - 模板搜索

#### 模型管理路由
- **`/api/models`** - 获取模型列表
- **`/api/system-models`** - 获取系统内置模型列表
- **`/api/configs`** - 配置管理

#### 光子扣费路由
- **`/api/photon/charge`** - 执行光子扣费
- **`/api/photon/pre-charge`** - 预扣费检查（mixed 模式）

#### 认证路由
- **`/api/auth/validate`** - 认证验证

### 6.2 路由设计原则

1. **单一职责**：每个路由只处理一个特定的业务逻辑
2. **统一错误处理**：所有路由使用统一的错误处理模式
3. **中文错误消息**：所有错误消息使用中文，便于前端直接展示
4. **环境变量验证**：在使用前验证必需的环境变量
5. **流式响应支持**：需要流式返回的路由使用 AI SDK 的标准方法

## 7. 状态管理架构

### 7.1 Context 层次结构

```
App (app/page.jsx)
  ├─ LocaleProvider (locale-context.jsx)
  ├─ ConversationProvider (conversation-context.jsx)
  ├─ DiagramProvider (diagram-context.jsx)  # Draw.io 模式
  └─ SvgEditorProvider (svg-editor-context.jsx)  # SVG 模式
```

### 7.2 Context 职责划分

- **`LocaleContext`**：国际化语言设置，持久化到 localStorage
- **`ConversationContext`**：对话历史、分支管理、消息状态
- **`DiagramContext`**：Draw.io XML、历史记录、画布状态
- **`SvgEditorContext`**：SVG 元素、工具状态、历史记录

### 7.3 数据持久化

所有 Context 都支持数据持久化到 localStorage：
- 对话历史：自动保存到浏览器存储
- 图表 XML：保存最后编辑的图表
- 用户配置：模型配置、语言设置等

## 8. 清理说明

- 从 `components/_unused` 移除了遗留的未使用组件，以保持表面区域精简。
- 通过 `features/chat-panel/constants.js` 标准化快速操作/模板，使得在不接触逻辑的情况下添加或重新排序预设变得简单。
- 新增了 `lib/charge-utils.js` 和 `lib/photon-client.js`，统一管理扣费相关逻辑。

## 9. 未来指南

- 保持功能文件夹自给自足：每个重要的 hook 都应该位于消费它的 UI 旁边。
- 使用 `features/.../types.ts` 中的 TypeScript 类型作为跨文件契约；只有当多个功能需要时才将类型提升到 `types/`。
- 处理异步工作流时，将副作用集中在可以单独进行单元测试的 hooks 内部。
- 在接触 `app/` 路由之前，考虑工作是否实际上属于功能切片。

这种结构使项目与大规模前端实践保持一致：清晰的边界、可发现的模块，以及在不深入无关文件的情况下迭代功能的能力。

## 10. 技术栈

### 10.1 核心框架
- **Next.js 15** (App Router) - 全栈 React 框架
- **React 19** - UI 库
- **TypeScript** - 类型安全（部分文件使用 JSDoc 类型注释）

### 10.2 UI 组件库
- **Radix UI** - 无样式、可访问的组件原语
- **Tailwind CSS** - 实用优先的 CSS 框架

### 10.3 AI 和图表
- **Vercel AI SDK** (`ai` 包) - AI 集成工具包
- **react-drawio** - Draw.io 编辑器 React 封装
- **draw.io XML** - 图表数据格式

### 10.4 工具库
- **Zod v3** - 数据验证
- **自定义工具函数** - `lib/` 目录下的各种工具函数

## 11. 关键设计决策

### 11.1 为什么使用功能切片架构？

- ✅ **可维护性**：每个功能独立，易于理解和修改
- ✅ **可测试性**：功能模块可以独立测试
- ✅ **可扩展性**：新功能只需添加新的功能切片
- ✅ **团队协作**：不同开发者可以并行开发不同功能

### 11.2 为什么使用 Context 而不是全局状态管理库？

- ✅ **轻量级**：React Context 足够满足需求
- ✅ **简单性**：不需要额外的依赖和学习成本
- ✅ **类型安全**：配合 JSDoc 类型注释提供类型检查
- ✅ **性能**：通过合理的 Context 拆分避免不必要的重渲染

### 11.3 为什么支持两种渲染模式？

- ✅ **灵活性**：用户可以根据需求选择不同的渲染模式
- ✅ **兼容性**：Draw.io 模式兼容现有图表，SVG 模式提供更多控制
- ✅ **渐进增强**：可以从简单的 SVG 模式开始，逐步迁移到 Draw.io

---

**文档版本**：2.0.0  
**最后更新**：2025-01-19  
**维护者**：Figsci Team
