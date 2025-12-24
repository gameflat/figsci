# Figsci Studio 架构文档

## 1. 分层概述

参考 Google 规模的前端指南，工作区现在遵循三个同心分层结构，确保职责隔离和可组合性：

1. 应用层（`app/`） – Next.js 路由、布局和页面级连接。包含 API 路由（`app/api/`）、页面组件（`app/page.jsx`、`app/xml/page.jsx`）和全局配置（`app/layout.jsx`、`app/providers.jsx`）。仅导入面向功能的入口点和框架提供者。

2. 功能层（`features/`） – 拥有自身状态编排、hooks 和视图原语的垂直切片。每个功能向应用层暴露一个窄接口（通常是 React 组件或 hook）。当前包含 `features/chat-panel/` 模块，包含组件、hooks、工具函数、常量和类型定义。

3. 共享层 – 可被任何功能复用的资源，包括：
   - `components/` – 纯 UI 原子组件（包含 `ui/` 基础组件和业务组件）
   - `contexts/` – React Context 状态管理（对话、图表、国际化等）
   - `hooks/` – 可复用的自定义 Hooks（包含测试文件）
   - `lib/` – 工具库函数（模型管理、图表处理、扣费、验证等）
   - `types/` – 全局类型定义（支持 TypeScript 和 JSDoc）
   - `data/` – 静态数据文件（模板数据等）
   - `locales/` – 国际化翻译文件
   - `llm/` – AI Agents 工作流（模板匹配、提示词格式化等）

所有新功能都应该放在 `features/<domain>/` 中，并配置共置的 hooks、components、lib、constants 和 types，这样未来的贡献者只需打开单个文件夹即可开发一个功能。

## 2. 目录结构

```
app/
  api/                    # Next.js API 路由
    auth/
      validate/
        route.js          # 认证验证接口
    chat/
      route.js            # 聊天和图表生成的主要接口
    configs/
      route.js            # 配置管理接口
    diagram-repair/
      route.js            # 图表修复功能接口
    models/
      route.js            # 模型列表获取接口
    photon/               # 光子扣费相关接口
      charge/
        route.js          # 光子扣费接口
      pre-charge/
        route.js          # 预扣费检查接口
    system-models/
      route.js            # 系统内置模型列表接口
  favicon.ico             # 网站图标
  globals.css             # 全局样式文件
  layout.jsx              # 根布局组件
  page.jsx                # 主页面
  providers.jsx           # 全局 Context Providers
  xml/
    page.jsx              # XML 查看页面
components/               # React 组件
  ui/                     # UI 基础组件（Radix UI）
    alert-dialog.jsx      # 警告对话框组件
    button.jsx            # 按钮组件
    card.jsx              # 卡片组件
    collapsible.jsx       # 可折叠组件
    dialog.jsx            # 对话框组件
    input.jsx             # 输入框组件
    scroll-area.jsx       # 滚动区域组件
    select.jsx            # 选择器组件
    textarea.jsx          # 多行文本框组件
    tooltip.jsx           # 工具提示组件
  button-with-tooltip.jsx        # 带提示的按钮组件
  calibration-console.jsx        # 校准控制台组件
  chat-example-panel.jsx         # 聊天示例面板组件
  chat-input-optimized.jsx       # 优化后的聊天输入组件
  chat-message-display-optimized.jsx  # 优化后的聊天消息展示组件
  chat-panel-optimized.jsx       # 聊天面板入口组件
  figsci-brief.jsx               # Figsci 简介组件
  file-preview-list.jsx          # 文件预览列表组件
  flow-showcase-gallery.jsx      # 流程图展示画廊组件
  generation-progress-indicator.jsx  # 生成进度指示器组件
  history-dialog.jsx             # 历史记录对话框组件
  language-switcher.jsx          # 语言切换器组件
  model-config-dialog.jsx        # 模型配置对话框组件
  model-selector.jsx             # 模型选择器组件
  photon-charge-notice.jsx       # 光子扣费提示组件
  quick-action-bar.jsx           # 快速操作栏组件
  render-mode-toggle.jsx         # 渲染模式切换组件
  report-blueprint-tray.jsx      # 报告蓝图托盘组件
  reset-warning-modal.jsx        # 重置警告模态框组件
  save-dialog.jsx                # 保存对话框组件
  session-status.jsx             # 会话状态组件
  streaming-thought-display.jsx  # 流式思考展示组件
  svg-studio.jsx                 # SVG 工作室组件
  template-card.jsx              # 模板卡片组件
  template-detail-modal.jsx      # 模板详情模态框组件
  template-gallery.jsx           # 模板画廊组件
  token-usage-display.jsx        # Token 使用量展示组件
  workspace-nav.jsx              # 工作区导航组件
contexts/                 # React Context
  conversation-context.jsx       # 对话状态管理
  diagram-context.jsx            # Draw.io 图表状态管理
  locale-context.jsx             # 国际化语言设置
  svg-editor-context.jsx         # SVG 编辑器状态管理
data/                     # 静态数据文件
  templates.js                   # 图表模板数据定义
features/                 # 功能模块
  chat-panel/
    components/
      intelligence-toolbar.jsx   # 智能工具栏组件
      tool-panel-sidebar.jsx     # 工具面板侧边栏组件
    hooks/
      use-diagram-orchestrator.js    # 图表编排管理 Hook
    utils/
      attachments.js             # 附件处理工具函数
      messages.js                # 消息处理工具函数
    constants.js                 # 功能常量定义
    types.js                     # 功能类型定义
hooks/                    # 自定义 React Hooks
  __tests__/
    use-drawio-fallback.test.tsx # Draw.io 降级处理测试
  use-chat-state.js              # 聊天状态管理 Hook
  use-drawio-diagnostics.js      # Draw.io 诊断 Hook
  use-drawio-fallback.js         # Draw.io 降级处理 Hook
  use-model-registry.js          # 模型注册表 Hook
lib/                      # 工具库
  calibration.js                 # 校准相关工具函数
  charge-utils.js                # 扣费信息工具函数
  diagram-repair-client.js       # 图表修复客户端工具
  diagram-templates.js           # 图表模板工具
  diagram-validation.js          # 图表验证工具
  env-models.js                  # 环境变量模型配置
  llm-client.js                  # LLM 客户端工具
  photon-client.js               # 光子扣费客户端工具
  prompts.js                     # 提示词模板
  server-models.js               # 服务端模型解析和配置
  svg.js                         # SVG 处理工具
  system-models.js               # 系统模型配置
  utils.js                       # 通用工具函数
types/                    # 类型定义
  diagram.d.ts                   # 图表类型定义（TypeScript）
  diagram.js                     # 图表类型定义（JSDoc）
  model-config.d.ts              # 模型配置类型定义（TypeScript）
  model-config.js                # 模型配置类型定义（JSDoc）
  template.d.ts                  # 模板类型定义（TypeScript）
  template.js                    # 模板类型定义（JSDoc）
llm/                      # AI Agents 工作流
  agents/
    prompt-formatter.js          # 提示词格式化 Agent
    mermaid-generator.js         # Mermaid 生成器 Agent
    architect.js                 # Architect Agent（逻辑构建）
    renderer.js                  # Renderer Agent（绘图渲染）
    workflow.js                  # 工作流编排
  types/
    index.js                     # 类型定义
  README.md                      # AI Agents 工作流说明文档
locales/                  # 国际化翻译文件
  translations.js                # 多语言翻译配置文件
# 项目根目录配置文件
CHANGELOG.md                    # 项目变更日志
components.json                 # UI 组件库配置文件（shadcn/ui）
CONTRIBUTING.md                 # 贡献指南文档
env.example                     # 环境变量配置示例文件
jsconfig.json                   # JavaScript 项目路径别名配置
LICENSE                         # 项目许可证文件
next-env.d.ts                   # Next.js TypeScript 类型定义
next.config.mjs                 # Next.js 框架配置文件
nginx.conf.example              # Nginx 服务器配置示例
package.json                    # 项目依赖和脚本配置
pnpm-lock.yaml                  # pnpm 包管理器锁定文件
postcss.config.mjs              # PostCSS CSS 处理工具配置
README_CN.md                    # 中文项目说明文档
README.md                       # 英文项目说明文档
test_dptech_api.py              # DPTech API 测试脚本（Python）
tsconfig.json                   # TypeScript 编译器配置
```

关键点：
- 功能隔离 – `features/chat-panel/` 封装了所有与会话工具相关的内容，包括组件（`components/intelligence-toolbar.jsx`、`components/tool-panel-sidebar.jsx`）、hooks（`hooks/use-diagram-orchestrator.js`）、工具函数（`utils/attachments.js`、`utils/messages.js`）和常量定义。文件夹外部无需了解自动修复的行为。

- 共享上下文 – `contexts/` 目录包含四个核心 Context：`conversation-context.jsx`（对话状态管理）、`diagram-context.jsx`（Draw.io 图表状态）、`svg-editor-context.jsx`（SVG 编辑器状态）和 `locale-context.jsx`（国际化设置）。这些是单一数据源提供者，功能 hooks 消费它们的 API，而不是复制逻辑。

- 组件分层 – `components/` 目录分为两层：
  - `components/ui/` – 基础 UI 组件（基于 Radix UI），包含 10 个原子组件（button、dialog、input 等）
  - `components/` 根目录 – 业务组件（chat-panel-optimized、model-config-dialog、template-gallery 等 30+ 个组件），它们通过 props 接收数据/处理函数，对编排细节保持无感知

- API 路由分层 – `app/api/` 下的 7 个路由按功能域组织：核心功能（chat、diagram-repair）、模型管理（models、system-models、configs）、光子扣费（photon/charge、photon/pre-charge）和认证（auth/validate）。每个路由处理特定的业务逻辑。

- 工具库模块化 – `lib/` 中的 13 个工具文件按功能分类：模型管理（server-models.js、env-models.js、system-models.js）、图表处理（diagram-validation.js、diagram-repair-client.js、diagram-templates.js、svg.js）、扣费相关（photon-client.js、charge-utils.js）、AI 相关（llm-client.js、prompts.js、calibration.js）和通用工具（utils.js）。便于复用和维护。

- 类型定义支持 – `types/` 目录同时支持 TypeScript（.d.ts）和 JSDoc（.js）类型定义，覆盖 diagram、model-config、template 等核心类型。

- 国际化支持 – `locales/translations.js` 提供多语言翻译配置，配合 `contexts/locale-context.jsx` 实现完整的国际化方案。

## 3. 聊天面板分解

原始的 `ChatPanelOptimized`（约 2000 行代码）混合了传输逻辑、比较流程、自动修复和 UI 标记。它已被分解到 `features/chat-panel/` 模块，结构如下：

### Hooks（`features/chat-panel/hooks/`）
- `use-diagram-orchestrator.js`
  - 拥有 Draw.io XML 生命周期（应用/验证/自动修复），并为功能消费者暴露 `handleDiagramXml`、`tryApplyRoot` 和 ref 工具函数。
  - 集中运行时错误处理，任何消费者只需调用单个函数即可同步画布状态。
  - 依赖 `contexts/diagram-context.jsx` 和 `lib/diagram-validation.js`、`lib/diagram-repair-client.js`。

### 组件（`features/chat-panel/components/`）
- `intelligence-toolbar.jsx` – 使用清晰的 API 渲染智能工具切换组，提供模型对比、图表修复等功能入口。
- `tool-panel-sidebar.jsx` – 侧边栏的共享外壳，集成 Figsci 简介（`components/figsci-brief.jsx`）、校准控制台（`components/calibration-console.jsx`）和模板画廊（`components/template-gallery.jsx`），保持标记与主文件分离。

### 工具函数（`features/chat-panel/utils/`）
- `messages.js` – 用于克隆聊天历史、消息序列化和状态管理的辅助函数。
- `attachments.js` – 用于序列化用户上传文件、附件处理的副作用辅助函数。

### 常量和类型（`features/chat-panel/`）
- `constants.js` – 承载 Figsci 校准提示词（从 `lib/calibration.js` 导入）、工具栏元数据和精选的快速操作，以便设计者可以在不接触组件逻辑的情况下调整内容。
- `types.js` – 功能特定的类型定义（使用 JSDoc 格式），定义聊天面板内部使用的数据结构。

### 入口组件（`components/chat-panel-optimized.jsx`）
现在专注于连接：
- 消费 `features/chat-panel/` 中的 hooks 和组件。
- 消费共享上下文（`conversation-context.jsx`、`diagram-context.jsx`、`locale-context.jsx`）。
- 处理纯 UI 关注点（表单输入、切换开关、堆叠卡片）。
- 通过 props 将重量级流程委托给 hooks/组件。

### 相关组件
聊天面板功能还依赖以下共享组件：
- `components/chat-input-optimized.jsx` – 优化的聊天输入组件
- `components/chat-message-display-optimized.jsx` – 优化的消息展示组件
- `components/photon-charge-notice.jsx` – 光子扣费提示组件

最终结果：`ChatPanelOptimized` 减少了约 60%，每个行为都可以独立演化，功能模块化程度显著提升。

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

关键组件：
- `contexts/diagram-context.jsx` – Draw.io 状态管理，提供 XML 数据、历史记录和画布状态
- `hooks/use-drawio-fallback.js` – Draw.io 降级处理，支持主 URL 和备用 URL 切换
- `hooks/use-drawio-diagnostics.js` – Draw.io 诊断工具，用于问题排查
- `lib/diagram-validation.js` – 图表验证工具，验证 Draw.io XML 格式
- `lib/diagram-repair-client.js` – 图表修复客户端，调用 `app/api/diagram-repair/route.js` 进行自动修复

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

关键组件：
- `contexts/svg-editor-context.jsx` – SVG 编辑器状态管理，提供 SVG 元素、工具状态和历史记录
- `components/svg-studio.jsx` – SVG 编辑器组件，提供可视化编辑界面
- `lib/svg.js` – SVG 处理工具函数，提供 SVG 解析、生成和转换功能

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

关键组件：
- `app/api/photon/charge/route.js` – 光子扣费 API，执行实际的扣费操作，调用玻尔平台 API
- `app/api/photon/pre-charge/route.js` – 预扣费检查 API，在 mixed 模式下预先检查账户余额
- `lib/photon-client.js` – 光子扣费客户端工具，封装与玻尔平台的通信逻辑
- `lib/charge-utils.js` – 扣费信息工具函数，提供扣费模式判断、费用计算等辅助功能
- `components/photon-charge-notice.jsx` – 扣费提示组件，显示扣费信息和余额状态

扣费模式：
- 固定扣费（fixed）：每次成功请求扣除固定金额
- Token 扣费（token）：根据实际 token 使用量扣费
- 混合扣费（mixed）：固定费用 + Token 费用

### 4.3 Architect Workflow 架构

```
用户输入提示词
  ↓
/api/chat (route.js) - 检查 enableArchitectWorkflow
  ↓
executeWorkflow (llm/agents/workflow.js)
  ↓
步骤 1: 提示词格式化 (prompt-formatter.js)
  ↓
步骤 2: Mermaid 生成 (mermaid-generator.js)
  ↓
步骤 3: The Architect (architect.js)
  - 输入：格式化提示词 + Mermaid
  - 输出：VISUAL SCHEMA (---BEGIN PROMPT--- ... ---END PROMPT---)
  ↓
步骤 4: The Renderer (renderer.js)
  - 输入：VISUAL SCHEMA
  - 输出：Draw.io XML 代码
  ↓
XML 验证和规范化 (lib/diagram-validation.js)
  ↓
应用到画布
```

关键组件：
- `llm/agents/prompt-formatter.js` – 提示词格式化 Agent，将用户输入格式化为规范的 Markdown 格式
- `llm/agents/mermaid-generator.js` – Mermaid 生成器 Agent，根据用户输入生成 Mermaid 图表代码，帮助理解逻辑结构
- `llm/agents/architect.js` – Architect Agent（逻辑构建），使用强大的 LLM（如 Gemini 3 Pro、GPT-5、Claude 4.5）将用户输入和 Mermaid 转换为 VISUAL SCHEMA
- `llm/agents/renderer.js` – Renderer Agent（绘图渲染），将 VISUAL SCHEMA 转换为 Draw.io XML 代码
- `llm/agents/workflow.js` – 工作流编排，协调整个 Architect Workflow 的执行流程
- `app/api/chat/route.js` – 聊天 API，集成 Architect Workflow，通过 `enableArchitectWorkflow` 参数启用
- `components/model-config-dialog.jsx` – 模型配置对话框，包含 Architect Workflow 配置区域，允许用户启用/禁用工作流并选择 Architect 和 Renderer 模型
- `lib/prompts.js` – 包含 `ARCHITECT_SYSTEM_MESSAGE` 和 `RENDERER_SYSTEM_MESSAGE` 系统提示词
- `lib/diagram-validation.js` – 图表验证工具，验证和规范化生成的 XML

工作流特点：
- 两阶段智能体设计：Architect 负责逻辑构建，Renderer 负责绘图渲染
- 支持独立模型配置：可以为 Architect 和 Renderer 选择不同的模型
- 完整的错误处理：每个步骤都有错误处理和回退机制
- XML 验证：生成的 XML 会经过验证和规范化，确保可以正确应用到画布

### 4.4 Draw.io 降级架构

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

关键组件：
- `hooks/use-drawio-fallback.js` – Draw.io 降级逻辑，实现主 URL 和备用 URL 的自动切换机制
- `hooks/__tests__/use-drawio-fallback.test.tsx` – 降级逻辑的单元测试，确保功能可靠性
- `app/page.jsx` – 主页面集成降级功能，在编辑器加载时自动触发降级检查

## 5. 扩展系统

添加功能时，遵循以下工作流：

1. 创建功能切片 – 在 `features/<domain>/` 下创建新模块，包含完整的目录结构：
   - `components/` – 功能特定的 UI 组件
   - `hooks/` – 功能特定的状态管理和业务逻辑 Hooks
   - `utils/` – 功能特定的工具函数
   - `constants.js` – 功能常量和配置
   - `types.js` – 功能类型定义（JSDoc 格式）

2. 使用上下文契约 – 通过共享 Context 访问全局状态，而不是深入到无关模块：
   - 对话相关：使用 `contexts/conversation-context.jsx` 中的 `useConversationManager`
   - 图表相关：使用 `contexts/diagram-context.jsx` 或 `contexts/svg-editor-context.jsx`
   - 国际化：使用 `contexts/locale-context.jsx`

3. 复用共享资源 – 优先使用 `components/ui/` 中的基础组件和 `lib/` 中的工具函数：
   - UI 组件：从 `components/ui/` 导入 button、dialog、input 等基础组件
   - 工具函数：复用 `lib/` 中的验证、处理、客户端工具

4. 暴露最小入口点 – 导出一个应用层可以消费的 hook 或组件；保持其他所有内容对功能私有：
   - 示例：`features/chat-panel/` 对外只暴露 `useDiagramOrchestrator` hook
   - 内部组件和工具函数保持私有，通过 hooks 暴露接口

5. API 路由创建 – 在 `app/api/<route-name>/route.js` 创建对应的 API 路由：
   - 遵循单一职责原则，每个路由处理一个特定功能
   - 使用统一的错误处理和中文错误消息
   - 需要 AI 功能的，使用 Vercel AI SDK 的标准方法

6. 类型定义 – 根据作用域选择类型定义位置：
   - 功能特定类型：放在 `features/<domain>/types.js`
   - 跨功能类型：放在 `types/` 目录，同时提供 `.d.ts` 和 `.js` 版本

7. 国际化支持 – 新增用户可见文本时，更新 `locales/translations.js`：
   - 在对应的语言对象中添加翻译
   - 在组件中使用 `useLocale` hook 获取翻译

8. 记录流程 – 添加新模块/流程时更新本文档：
   - 更新目录结构部分
   - 更新相关的架构说明
   - 添加关键组件和 API 的描述

参考实现：`features/chat-panel/` 是一个完整的功能切片示例，可以作为新功能开发的参考模板。

## 6. API 路由架构

### 6.1 路由分类

#### 核心功能路由（`app/api/`）
- `chat/route.js` – 聊天和图表生成的主要接口，集成光子扣费功能和 Architect Workflow
  - 处理用户消息，调用 AI 模型生成图表
  - 支持流式响应，使用 Vercel AI SDK
  - 集成 `lib/photon-client.js` 进行扣费操作
  - 支持 Architect Workflow：通过 `enableArchitectWorkflow` 参数启用两阶段智能体工作流
  - Architect Workflow 包含：提示词格式化 → Mermaid 生成 → Architect 生成 VISUAL SCHEMA → Renderer 生成 XML
  - 支持独立的模型配置：`architectModel` 和 `rendererModel` 参数
  
- `diagram-repair/route.js` – 图表修复功能
  - 调用 `lib/diagram-repair-client.js` 修复无效的 Draw.io XML
  - 使用 AI 分析图表问题并生成修复方案

#### 模型管理路由
- `models/route.js` – 获取模型列表
  - 解析环境变量和配置文件中的模型定义
  - 调用 `lib/server-models.js` 获取可用模型
  - 返回模型配置信息（baseUrl、apiKey 等）
  
- `system-models/route.js` – 获取系统内置模型列表
  - 调用 `lib/system-models.js` 获取预定义模型
  - 返回系统默认支持的模型配置
  
- `configs/route.js` – 配置管理
  - 提供配置的读取和更新接口
  - 支持用户自定义模型配置的持久化

#### 光子扣费路由（`app/api/photon/`）
- `charge/route.js` – 执行光子扣费
  - 调用 `lib/photon-client.js` 执行实际扣费
  - 支持 fixed、token、mixed 三种扣费模式
  - 与玻尔平台 API 通信
  
- `pre-charge/route.js` – 预扣费检查（mixed 模式）
  - 在 mixed 模式下，预先检查账户余额
  - 确保账户有足够余额执行扣费

#### 认证路由（`app/api/auth/`）
- `validate/route.js` – 认证验证
  - 验证用户身份和权限
  - 支持 API Key 验证和会话验证

### 6.2 路由设计原则

1. 单一职责：每个路由只处理一个特定的业务逻辑
2. 统一错误处理：所有路由使用统一的错误处理模式
3. 中文错误消息：所有错误消息使用中文，便于前端直接展示
4. 环境变量验证：在使用前验证必需的环境变量
5. 流式响应支持：需要流式返回的路由使用 AI SDK 的标准方法

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

- `LocaleContext`（`contexts/locale-context.jsx`）：
  - 国际化语言设置（中文/英文切换）
  - 从 `locales/translations.js` 加载翻译数据
  - 持久化语言偏好到 localStorage
  - 提供 `useLocale` hook 供组件使用

- `ConversationContext`（`contexts/conversation-context.jsx`）：
  - 对话历史管理（消息列表、时间戳等）
  - 分支管理（创建、切换、删除分支）
  - 消息状态（发送中、已送达、错误等）
  - 提供 `useConversationManager` hook
  - 自动持久化到 localStorage

- `DiagramContext`（`contexts/diagram-context.jsx`）：
  - Draw.io XML 数据管理
  - 图表历史记录（撤销/重做）
  - 画布状态（缩放、平移等）
  - 提供图表更新和验证功能
  - 与 `hooks/use-drawio-fallback.js` 集成

- `SvgEditorContext`（`contexts/svg-editor-context.jsx`）：
  - SVG 元素管理（添加、删除、修改）
  - 工具状态（当前选择的工具）
  - 历史记录（操作历史）
  - 提供 SVG 编辑器的核心状态管理

### 7.3 数据持久化

所有 Context 都支持数据持久化到 localStorage：
- 对话历史：自动保存到浏览器存储
- 图表 XML：保存最后编辑的图表
- 用户配置：模型配置、语言设置等

## 8. 项目演进说明

### 8.1 架构优化
- 实现了功能切片架构（Feature Slice Architecture），将大型组件拆分为独立的功能模块
- `features/chat-panel/` 模块化重构，将原本 2000+ 行的 `ChatPanelOptimized` 拆分为多个 hooks、组件和工具函数
- 建立了清晰的三层架构：应用层（app/）、功能层（features/）、共享层（components/、lib/、contexts/等）

### 8.2 工具库完善
- 新增 `lib/photon-client.js` 和 `lib/charge-utils.js`，统一管理光子扣费相关逻辑
- 新增 `lib/diagram-repair-client.js`，提供图表自动修复功能
- 新增 `lib/calibration.js`，集中管理校准提示词和配置
- 新增 `lib/system-models.js`，管理系统内置模型配置

### 8.3 功能模块
- `features/chat-panel/` 成为功能模块化的典型示例，包含完整的目录结构
- 通过 `features/chat-panel/constants.js` 标准化快速操作和模板，使得在不接触逻辑的情况下添加或重新排序预设变得简单
- 建立了清晰的功能边界，外部无需了解内部实现细节

### 8.4 类型系统
- `types/` 目录同时支持 TypeScript（.d.ts）和 JSDoc（.js）类型定义
- 功能特定的类型定义放在 `features/<domain>/types.js`，全局类型放在 `types/`
- 所有 Context 和主要函数都使用 JSDoc 类型注释

### 8.5 国际化支持
- 建立了完整的国际化体系：`locales/translations.js` + `contexts/locale-context.jsx`
- 支持中文和英文切换，所有用户可见文本都可通过翻译系统管理

### 8.6 AI Agents 工作流
- 建立了 `llm/` 目录，包含 AI Agents 实现
- `llm/agents/mermaid-generator.js` 实现 Mermaid 生成，根据用户输入生成 Mermaid 图表代码
- `llm/agents/architect.js` 实现 Architect Agent，将用户输入和 Mermaid 转换为 VISUAL SCHEMA
- `llm/agents/renderer.js` 实现 Renderer Agent，将 VISUAL SCHEMA 转换为 Draw.io XML 代码
- `llm/agents/prompt-formatter.js` 实现提示词格式化
- `llm/agents/workflow.js` 编排整个 AI 工作流

### 8.7 测试支持
- `hooks/__tests__/` 目录包含单元测试示例
- `use-drawio-fallback.test.tsx` 展示了如何测试自定义 Hook

## 9. 开发指南

### 9.1 功能开发最佳实践

- 保持功能文件夹自给自足：每个重要的 hook 都应该位于 `features/<domain>/hooks/` 中，与消费它的 UI 组件保持在同一模块内

- 类型定义策略：
  - 功能特定类型：放在 `features/<domain>/types.js`（使用 JSDoc 格式）
  - 跨功能类型：提升到 `types/` 目录，同时提供 `.d.ts` 和 `.js` 版本
  - 优先使用 JSDoc 类型注释，保持与项目现有代码风格一致

- 异步工作流处理：
  - 将副作用集中在 `features/<domain>/hooks/` 中的自定义 hooks 内部
  - 每个 hook 应该可以单独进行单元测试（参考 `hooks/__tests__/use-drawio-fallback.test.tsx`）
  - 使用 `lib/` 中的工具函数处理 API 调用和数据处理

### 9.2 API 路由开发

- 在创建 `app/api/` 路由之前，先考虑：
  - 该功能是否应该属于某个功能切片（`features/<domain>/`）
  - 是否已经有现有的路由可以复用或扩展
  - 是否需要新的工具函数（应该放在 `lib/` 中）

- API 路由规范：
  - 每个路由文件必须是 `route.js`，放在对应的目录下
  - 使用统一的错误处理模式，返回中文错误消息
  - 验证必需的环境变量
  - 需要流式响应时，使用 Vercel AI SDK 的标准方法

### 9.3 组件开发

- UI 组件分类：
  - 基础组件（可复用）：放在 `components/ui/`，基于 Radix UI
  - 业务组件（功能特定）：放在 `features/<domain>/components/` 或 `components/`
  - 功能入口组件：放在 `components/`，作为功能的对外接口

- 组件设计原则：
  - 通过 props 接收数据和回调函数，保持组件纯函数特性
  - 使用 Context 访问全局状态，避免 prop drilling
  - 复杂的业务逻辑应该提取到 hooks 中

### 9.4 状态管理

- Context 使用：
  - 全局状态使用 `contexts/` 中的 Context
  - 功能特定状态使用功能模块内部的 hooks
  - 避免在 Context 中存储过多数据，考虑拆分

- 数据持久化：
  - 需要持久化的数据通过 Context 或自定义 hook 保存到 localStorage
  - 敏感数据不要存储在 localStorage 中

### 9.5 测试

- 单元测试：
  - Hooks 测试：放在 `hooks/__tests__/` 或 `features/<domain>/__tests__/`
  - 工具函数测试：放在对应的 `lib/` 目录下的 `__tests__/`
  - 使用 TypeScript/TSX 格式编写测试（参考现有测试文件）

### 9.6 国际化

- 添加新文本：
  - 所有用户可见的文本都应该添加到 `locales/translations.js`
  - 在组件中使用 `useLocale` hook 获取翻译
  - 避免硬编码中文或英文文本

### 9.7 文档维护

- 添加新功能时：
  - 更新 `docs/architecture.md` 的目录结构部分
  - 在相关章节添加功能说明
  - 更新 API 路由架构或核心功能架构部分

这种结构使项目与大规模前端实践保持一致：清晰的边界、可发现的模块，以及在不深入无关文件的情况下迭代功能的能力。

## 10. 技术栈

### 10.1 核心框架
- Next.js 15 (App Router) - 全栈 React 框架
- React 19 - UI 库
- TypeScript - 类型安全（部分文件使用 JSDoc 类型注释）

### 10.2 UI 组件库
- Radix UI - 无样式、可访问的组件原语
- Tailwind CSS - 实用优先的 CSS 框架

### 10.3 AI 和图表
- Vercel AI SDK (`ai` 包) - AI 集成工具包
- react-drawio - Draw.io 编辑器 React 封装
- draw.io XML - 图表数据格式

### 10.4 工具库
- Zod v3 – 数据验证和模式定义
- 自定义工具函数 – `lib/` 目录下的 13 个工具模块：
  - 模型管理：`server-models.js`、`env-models.js`、`system-models.js`
  - 图表处理：`diagram-validation.js`、`diagram-repair-client.js`、`diagram-templates.js`、`svg.js`
  - 扣费相关：`photon-client.js`、`charge-utils.js`
  - AI 相关：`llm-client.js`、`prompts.js`、`calibration.js`
  - 通用工具：`utils.js`

### 10.5 数据管理
- `data/templates.js` – 图表模板数据定义，包含模板元数据、提示词和配置
- `locales/translations.js` – 多语言翻译配置，支持中文和英文

### 10.6 AI Agents
- 自定义 AI Agents（`llm/agents/`）：
  - `mermaid-generator.js` – Mermaid 生成器 Agent
  - `architect.js` – Architect Agent（逻辑构建）
  - `renderer.js` – Renderer Agent（绘图渲染）
  - `prompt-formatter.js` – 提示词格式化 Agent
  - `workflow.js` – 工作流编排

### 10.7 开发工具
- pnpm – 包管理器（`pnpm-lock.yaml`）
- ESLint / TypeScript – 代码检查和类型安全
- PostCSS + Tailwind CSS – CSS 处理

## 11. 关键设计决策

### 11.1 为什么使用功能切片架构？

- ✅ 可维护性：每个功能独立，易于理解和修改
- ✅ 可测试性：功能模块可以独立测试
- ✅ 可扩展性：新功能只需添加新的功能切片
- ✅ 团队协作：不同开发者可以并行开发不同功能

### 11.2 为什么使用 Context 而不是全局状态管理库？

- ✅ 轻量级：React Context 足够满足需求
- ✅ 简单性：不需要额外的依赖和学习成本
- ✅ 类型安全：配合 JSDoc 类型注释提供类型检查
- ✅ 性能：通过合理的 Context 拆分避免不必要的重渲染

### 11.3 为什么支持两种渲染模式？

- ✅ 灵活性：用户可以根据需求选择不同的渲染模式
- ✅ 兼容性：Draw.io 模式兼容现有图表，SVG 模式提供更多控制
- ✅ 渐进增强：可以从简单的 SVG 模式开始，逐步迁移到 Draw.io

---

文档版本：2.1.0  
最后更新：2025-01-18 
维护者：Figsci Team
