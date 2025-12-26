# Figsci 项目实现细节文档

本文档详细记录了 Figsci 项目的核心功能实现细节，按照项目架构的三个分层（应用层、功能层、共享层）组织，包括各个模块的实现原理、技术细节和关键代码。

## 📑 目录

### 第一部分：架构概述
1. [文档说明](#1-文档说明)
2. [架构分层](#2-架构分层)
3. [实现原则](#3-实现原则)

### 第二部分：应用层实现（app/）
4. [页面实现](#4-页面实现)
   - [主页面（app/page.jsx）](#41-主页面apppagejsx)
   - [XML 查看页面（app/xml/page.jsx）](#42-xml-查看页面appxmlpagejsx)
   - [根布局（app/layout.jsx）](#43-根布局applayoutjsx)
   - [全局提供者（app/providers.jsx）](#44-全局提供者appprovidersjsx)

5. [API 路由实现](#5-api-路由实现)
   - [核心功能路由](#51-核心功能路由)
     - [聊天和图表生成（/api/chat）](#511-聊天和图表生成apichat)
     - [图表修复（/api/diagram-repair）](#512-图表修复apidiagram-repair)
     - [Architect Workflow（/api/chat 集成）](#513-architect-workflowapichat-集成)
   - [模型管理路由](#53-模型管理路由)
     - [模型列表（/api/models）](#531-模型列表apimodels)
     - [系统模型（/api/system-models）](#532-系统模型apisystem-models)
     - [配置管理（/api/configs）](#533-配置管理apiconfigs)
   - [光子扣费路由](#54-光子扣费路由)
     - [执行扣费（/api/photon/charge）](#541-执行扣费apiphotoncharge)
     - [预扣费检查（/api/photon/pre-charge）](#542-预扣费检查apiphotonpre-charge)
   - [认证路由](#55-认证路由)
     - [认证验证（/api/auth/validate）](#551-认证验证apiauthvalidate)

### 第三部分：功能层实现（features/）
6. [聊天面板功能模块（features/chat-panel/）](#6-聊天面板功能模块featureschat-panel)
   - [功能概述](#61-功能概述)
   - [Hooks 实现](#62-hooks-实现)
     - [图表编排器（use-diagram-orchestrator.js）](#621-图表编排器use-diagram-orchestratorjs)
   - [组件实现](#63-组件实现)
     - [智能工具栏（intelligence-toolbar.jsx）](#631-智能工具栏intelligence-toolbarjsx)
     - [工具面板侧边栏（tool-panel-sidebar.jsx）](#632-工具面板侧边栏tool-panel-sidebarjsx)
   - [工具函数实现](#64-工具函数实现)
     - [消息处理（utils/messages.js）](#641-消息处理utilsmessagesjs)
     - [附件处理（utils/attachments.js）](#642-附件处理utilsattachmentsjs)
   - [常量定义（constants.js）](#65-常量定义constantsjs)
   - [类型定义（types.js）](#66-类型定义typesjs)

### 第四部分：共享层实现
7. [组件实现（components/）](#7-组件实现components)
   - [UI 基础组件（components/ui/）](#71-ui-基础组件componentsui)
   - [业务组件实现](#72-业务组件实现)
     - [聊天面板入口（chat-panel-optimized.jsx）](#721-聊天面板入口chat-panel-optimizedjsx)
     - [聊天输入（chat-input-optimized.jsx）](#722-聊天输入chat-input-optimizedjsx)
     - [消息展示（chat-message-display-optimized.jsx）](#723-消息展示chat-message-display-optimizedjsx)
     - [SVG 工作室（svg-studio.jsx）](#724-svg-工作室svg-studiojsx)
     - [模板画廊（template-gallery.jsx）](#725-模板画廊template-galleryjsx)
     - [模型配置对话框（model-config-dialog.jsx）](#726-模型配置对话框model-config-dialogjsx)
     - [其他业务组件](#727-其他业务组件)

8. [状态管理实现（contexts/）](#8-状态管理实现contexts)
   - [对话上下文（conversation-context.jsx）](#81-对话上下文conversation-contextjsx)
   - [图表上下文（diagram-context.jsx）](#82-图表上下文diagram-contextjsx)
   - [SVG 编辑器上下文（svg-editor-context.jsx）](#83-svg-编辑器上下文svg-editor-contextjsx)
   - [国际化上下文（locale-context.jsx）](#84-国际化上下文locale-contextjsx)

9. [自定义 Hooks 实现（hooks/）](#9-自定义-hooks-实现hooks)
   - [聊天状态管理（use-chat-state.js）](#91-聊天状态管理use-chat-statejs)
   - [Draw.io 降级处理（use-drawio-fallback.js）](#92-drawio-降级处理use-drawio-fallbackjs)
   - [Draw.io 诊断（use-drawio-diagnostics.js）](#93-drawio-诊断use-drawio-diagnosticsjs)
   - [模型注册表（use-model-registry.js）](#94-模型注册表use-model-registryjs)

10. [工具库实现（lib/）](#10-工具库实现lib)
    - [模型管理](#101-模型管理)
      - [服务端模型解析（server-models.js）](#1011-服务端模型解析server-modelsjs)
      - [环境变量模型（env-models.js）](#1012-环境变量模型env-modelsjs)
      - [系统模型（system-models.js）](#1013-系统模型system-modelsjs)
    - [图表处理](#102-图表处理)
      - [图表验证（diagram-validation.js）](#1021-图表验证diagram-validationjs)
      - [图表修复客户端（diagram-repair-client.js）](#1022-图表修复客户端diagram-repair-clientjs)
      - [图表模板（diagram-templates.js）](#1023-图表模板diagram-templatesjs)
      - [SVG 处理（svg.js）](#1024-svg-处理svgjs)
    - [扣费相关](#103-扣费相关)
      - [光子扣费客户端（photon-client.js）](#1031-光子扣费客户端photon-clientjs)
      - [扣费工具函数（charge-utils.js）](#1032-扣费工具函数charge-utilsjs)
    - [AI 相关](#104-ai-相关)
      - [LLM 客户端（llm-client.js）](#1041-llm-客户端llm-clientjs)
      - [提示词模板（prompts.js）](#1042-提示词模板promptsjs)
      - [校准工具（calibration.js）](#1043-校准工具calibrationjs)
    - [通用工具（utils.js）](#105-通用工具utilsjs)

11. [AI Agents 工作流实现（llm/）](#11-ai-agents-工作流实现llm)
    - [Architect Agent（agents/architect.js）](#111-architect-agentagentsarchitectjs)
    - [Renderer Agent（agents/renderer.js）](#112-renderer-agentagentsrendererjs)
    - [Mermaid 生成器（agents/mermaid-generator.js）](#113-mermaid-生成器agentsmermaid-generatorjs)
    - [提示词格式化 Agent（agents/prompt-formatter.js）](#114-提示词格式化-agentagentsprompt-formatterjs)
    - [工作流编排（agents/workflow.js）](#115-工作流编排agentsworkflowjs)
    - [类型定义（types/index.js）](#116-类型定义typesindexjs)

12. [数据文件（data/）](#12-数据文件data)
    - [模板数据（templates.js）](#121-模板数据templatesjs)

13. [国际化实现（locales/）](#13-国际化实现locales)
    - [翻译配置（translations.js）](#131-翻译配置translationsjs)

### 第五部分：功能实现
14. [渲染模式实现](#14-渲染模式实现)
    - [Draw.io 模式](#141-drawio-模式)
    - [SVG 模式](#142-svg-模式)
    - [模式切换机制](#143-模式切换机制)

15. [功能实现](#15-功能实现)
    - [图表历史功能实现](#151-图表历史功能实现)
    - [流式与非流式响应实现](#152-流式与非流式响应实现)
    - [光子扣费功能实现](#153-光子扣费功能实现)
    - [扣费显示功能实现](#154-扣费显示功能实现)
    - [Architect Workflow 功能实现](#155-architect-workflow-功能实现)
    - [数据持久化功能实现](#156-数据持久化功能实现)
    - [超时设置实现](#157-超时设置实现)
    - [Draw.io XML 格式指南](#158-drawio-xml-格式指南)

---

## 1. 文档说明

### 1.1 文档目的

本文档是 Figsci 项目的实现细节文档，旨在为开发者提供：

- 技术实现细节：各个模块、组件、函数的实现原理和关键代码
- 架构理解：按照项目分层架构组织，便于理解整体结构
- 开发指南：为新增功能和修改现有功能提供参考
- 问题排查：帮助快速定位问题和技术细节

### 1.2 文档结构

本文档按照项目架构的三个分层组织：

1. 应用层（app/）：Next.js 路由、页面和 API 路由的实现
2. 功能层（features/）：功能模块的实现，当前主要是 `features/chat-panel/`
3. 共享层：可复用的组件、状态管理、工具库等

每个分层下按照目录结构进一步细分，最后是跨层的核心功能实现细节。

### 1.3 阅读建议

- 新手开发者：建议先阅读 [架构文档](../docs/architecture.md)，了解整体结构，再阅读本文档的具体实现
- 功能开发：根据要开发的功能，先找到对应的分层和模块，再深入阅读实现细节
- 问题排查：使用目录快速定位相关模块，查看具体实现代码位置

### 1.4 代码位置说明

文档中会标注关键代码的文件路径和行号，例如：
- `app/page.jsx`（第 100-150 行）
- `features/chat-panel/hooks/use-diagram-orchestrator.js`（第 50-80 行）

## 2. 架构分层

### 2.1 三层架构概述

Figsci 项目遵循三层同心分层架构，确保职责隔离和可组合性：

```
┌─────────────────────────────────────────┐
│         应用层 (app/)                   │
│  Next.js 路由、页面、API 路由           │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐  ┌─────▼──────┐
│  功能层     │  │  共享层     │
│ (features/) │  │             │
│             │  │ components/ │
│ 垂直切片    │  │ contexts/   │
│             │  │ hooks/      │
│ 独立功能    │  │ lib/        │
│             │  │ types/      │
│             │  │ data/       │
│             │  │ locales/    │
│             │  │ llm/        │
└─────────────┘  └─────────────┘
```

### 2.2 应用层（app/）

职责：Next.js 框架层面的路由、布局和页面级连接

包含内容：
- 页面组件：`app/page.jsx`（主页面）、`app/xml/page.jsx`（XML 查看页面）
- 布局组件：`app/layout.jsx`（根布局）、`app/providers.jsx`（全局 Context Providers）
- API 路由：`app/api/` 下的所有路由端点
- 全局配置：`app/globals.css`（全局样式）

实现特点：
- 仅导入面向功能的入口点和框架提供者
- 不包含业务逻辑，只负责组合和路由
- API 路由处理服务端业务逻辑

### 2.3 功能层（features/）

职责：拥有自身状态编排、hooks 和视图原语的垂直切片

当前模块：
- `features/chat-panel/`：聊天面板功能模块

模块结构：
```
features/chat-panel/
├── components/          # 功能特定组件
│   ├── intelligence-toolbar.jsx
│   └── tool-panel-sidebar.jsx
├── hooks/               # 功能特定 Hooks
│   ├── use-comparison-workbench.js
│   └── use-diagram-orchestrator.js
├── utils/               # 功能特定工具函数
│   ├── attachments.js
│   └── messages.js
├── constants.js         # 功能常量定义
└── types.js            # 功能类型定义
```

实现特点：
- 自包含：模块内部包含所需的所有资源
- 窄接口：向应用层暴露最小接口（通常是组件或 hook）
- 独立性：模块之间相互独立，不直接依赖

### 2.4 共享层

职责：可被任何功能复用的资源

包含目录：

1. components/：UI 组件
   - `ui/`：基础 UI 组件（基于 Radix UI）
   - 根目录：业务组件

2. contexts/：React Context 状态管理
   - `conversation-context.jsx`：对话状态
   - `diagram-context.jsx`：Draw.io 图表状态
   - `svg-editor-context.jsx`：SVG 编辑器状态
   - `locale-context.jsx`：国际化设置

3. hooks/：可复用的自定义 Hooks
   - `use-chat-state.js`：聊天状态管理
   - `use-drawio-fallback.js`：Draw.io 降级处理
   - `use-drawio-diagnostics.js`：Draw.io 诊断
   - `use-model-registry.js`：模型注册表

4. lib/：工具库函数
   - 模型管理、图表处理、扣费、验证等工具函数

5. types/：全局类型定义
   - 支持 TypeScript（.d.ts）和 JSDoc（.js）

6. data/：静态数据文件
   - `templates.js`：图表模板数据

7. locales/：国际化翻译文件
   - `translations.js`：多语言翻译配置

8. llm/：AI Agents 工作流
   - `agents/`：AI Agents 实现
   - `utils/`：工具函数
   - `types/`：类型定义

## 3. 实现原则

### 3.1 代码组织原则

1. 功能隔离：每个功能模块独立，包含所需的组件、hooks、工具函数
2. 单一职责：每个模块、组件、函数只负责一个明确的功能
3. 依赖方向：应用层 → 功能层 → 共享层（单向依赖）
4. 接口最小化：模块对外暴露最小接口，隐藏内部实现

### 3.2 状态管理原则

1. Context 分层：
   - 全局状态使用 `contexts/` 中的 Context
   - 功能特定状态使用功能模块内部的 hooks

2. 状态持久化：
   - 使用 localStorage 持久化用户配置和对话历史
   - 统一的存储键名规范（`Figsci` 前缀）

3. 状态更新：
   - 使用函数式更新避免闭包问题
   - 使用 useCallback 优化更新函数

### 3.3 错误处理原则

1. 统一错误格式：所有错误消息使用中文，便于前端展示
2. 错误隔离：API 路由中的错误不影响主流程
3. 用户友好：错误消息应该具体、可操作
4. 开发调试：开发环境显示详细错误信息，生产环境只显示用户友好消息

### 3.4 性能优化原则

1. 防抖节流：频繁操作使用防抖（如画布更新）
2. 条件渲染：合理使用条件渲染避免不必要的渲染
3. 引用缓存：使用 ref 缓存 DOM 引用和计算结果
4. 历史记录优化：避免保存空白或重复的历史记录

### 3.5 类型安全原则

1. JSDoc 类型注释：所有主要函数和组件使用 JSDoc 类型注释
2. 类型定义集中：功能特定类型放在 `features/<domain>/types.js`，全局类型放在 `types/`
3. 类型检查：使用 TypeScript 编译器检查类型（即使使用 .js 文件）

---

## 4. 页面实现

### 4.1 主页面（app/page.jsx）

主页面是 Figsci 项目的核心入口，包含画布系统、聊天面板和页面布局。

#### 4.1.1 概述

主页面支持两种渲染模式：
- Draw.io 模式：基于 `react-drawio` 库嵌入 Draw.io 编辑器
- SVG 模式：自定义实现的 SVG 编辑器，支持基础的图形绘制和编辑

画布位于页面右侧（从用户视角看），占据主内容区域，与左侧的聊天面板通过可调整的分隔条分隔。

#### 4.1.2 架构设计

整体架构：

```
app/page.jsx (主页面)
├── 布局容器 (CSS Grid)
│   ├── 画布区域
│   │   ├── Draw.io 模式: <DrawIoEmbed />
│   │   └── SVG 模式: <SvgStudio />
│   ├── 调整条 (Resizer)
│   └── 聊天面板区域
│       └── <ChatPanelOptimized />
└── Context Providers
    ├── DiagramProvider (Draw.io 状态)
    └── SvgEditorProvider (SVG 状态)
```

核心组件关系：

```
┌─────────────────────────────────────────┐
│         app/page.jsx                    │
│  (主页面，负责布局和模式切换)            │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐  ┌─────▼──────┐
│ Draw.io模式 │  │  SVG模式   │
│             │  │            │
│ DrawIoEmbed │  │ SvgStudio  │
│   (react-   │  │ (自定义)    │
│   drawio)   │  │            │
└──────┬──────┘  └─────┬──────┘
       │               │
       └───────┬───────┘
               │
    ┌──────────▼──────────┐
    │  DiagramContext     │
    │  (Draw.io 状态管理)  │
    └─────────────────────┘
```

#### 4.1.3 渲染模式实现

Draw.io 模式：

实现位置：
- 主组件: `app/page.jsx` (第 513-524 行)
- 状态管理: `contexts/diagram-context.jsx`

核心实现：

```javascript
// app/page.jsx
<DrawIoEmbed
  ref={drawioRef}
  baseUrl={drawioBaseUrl}
  onExport={handleDiagramExport}
  onLoad={handleDrawioLoad}
  urlParameters={{
    spin: true,        // 显示加载动画
    libraries: false,  // 禁用形状库（减少加载时间）
    saveAndExit: false, // 禁用保存并退出按钮
    noExitBtn: true    // 隐藏退出按钮
  }}
/>
```

关键特性：

1. 嵌入方式   - 使用 `react-drawio` 库的 `DrawIoEmbed` 组件
   - 通过 `baseUrl` 指定 Draw.io 编辑器地址（默认：`https://embed.diagrams.net`）
   - 通过 `ref` 获取 Draw.io 实例引用，用于调用 API

2. 加载机制   - 监听 `onLoad` 事件，编辑器加载完成后设置 `drawioReadyRef.current = true`
   - 支持从 Context 中恢复画布内容（`hydrateDiagramFromContext`）
   - 15 秒超时检测，超时后显示错误提示

3. 错误处理   - 使用 `useDrawioDiagnostics` Hook 监控运行时错误
   - 捕获加载失败和运行时错误，显示友好的错误提示
   - 支持降级到备用 URL（通过 `use-drawio-fallback` Hook）

4. 数据格式   - 使用 Draw.io 的 XML 格式（`.mxfile`）
   - XML 结构：`<mxfile>` → `<diagram>` → `<mxGraphModel>` → `<root>` → `<mxCell>`

SVG 模式：

**重要变化**：SVG 模式现在统一使用 Draw.io 画布，通过 `buildSvgRootXml` 函数将 SVG 转换为 Draw.io XML 格式。

实现位置：
- 转换函数: `lib/svg.js` - `buildSvgRootXml` 函数
- 主组件: `components/chat-panel-optimized.jsx` - 处理 `display_svg` 工具调用
- 状态管理: `contexts/diagram-context.jsx` - 统一管理两种模式的画布状态

核心实现：

```javascript
// components/chat-panel-optimized.jsx
// 处理 display_svg 工具调用
if (toolCall.toolName === "display_svg") {
  const { svg } = toolCall.input;
  // SVG 模式下，统一使用 buildSvgRootXml 转换为 Draw.io XML
  const { rootXml, dataUrl } = buildSvgRootXml(svg);
  await handleCanvasUpdate(rootXml, {
    origin: "display",
    modelRuntime: selectedModel ?? void 0,
  });
}
```

```javascript
// lib/svg.js
export function buildSvgRootXml(svg) {
  // 1. 清理和验证 SVG
  const cleaned = svg.replace(XML_DECLARATION, "").trim();
  assertSafeSvg(cleaned);
  
  // 2. 将 SVG 编码为 data URL
  const dataUrl = svgToDataUrl(cleaned);
  const styleImageUrl = `data:image/svg+xml,${encodeURIComponent(cleaned)}`;
  
  // 3. 推断 SVG 尺寸
  const inferred = inferSvgDimensions(cleaned) ?? {
    width: DEFAULT_CANVAS.width * 0.8,
    height: DEFAULT_CANVAS.height * 0.6,
  };
  
  // 4. 计算缩放和位置
  const scale = Math.min(1, MAX_SVG_VIEWPORT.width / inferred.width, ...);
  const width = Math.max(MIN_SVG_SIZE.width, Math.round(inferred.width * scale));
  const height = Math.max(MIN_SVG_SIZE.height, Math.round(inferred.height * scale));
  const x = Math.max(20, Math.round((DEFAULT_CANVAS.width - width) / 2));
  const y = Math.max(20, Math.round((DEFAULT_CANVAS.height - height) / 2));
  
  // 5. 构建 Draw.io XML（将 SVG 作为 image cell）
  const style = `shape=image;imageAspect=1;aspect=fixed;...image=${styleImageUrl};`;
  const rootXml = `<root><mxCell id="0"/><mxCell id="1" parent="0"/>` +
    `<mxCell id="2" value="" style="${style}" vertex="1" parent="1">` +
    `<mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry" />` +
    `</mxCell></root>`;
  
  return { rootXml, dataUrl, dimensions: { width, height } };
}
```

关键特性：

1. **SVG 转换机制**：
   - SVG 内容通过 `buildSvgRootXml` 函数转换为 Draw.io XML 格式
   - SVG 被编码为 data URL，作为 Draw.io 的 image cell 嵌入到画布中
   - 转换后的 XML 包含完整的 `<root>` 结构，可以直接应用到 Draw.io 画布
   - 自动推断 SVG 尺寸并进行缩放，确保内容适合画布显示

2. **统一画布渲染**：
   - 两种模式现在都使用相同的画布组件（`DrawIoEmbed`）
   - 使用相同的状态管理（`DiagramContext`）
   - SVG 模式下的内容通过 Draw.io 的 image cell 机制显示

3. **数据格式**：
   - 输入：完整的自包含 SVG 标记（包含 `<svg>` 标签）
   - 输出：Draw.io XML 格式（包含 `<root>` 结构）
   - 中间格式：SVG data URL（用于预览和缩略图）

4. **安全验证**：
   - 检查 SVG 是否包含 `<svg>` 根节点
   - 禁止包含脚本、事件处理器或 JavaScript URI
   - 确保 SVG 内容安全可渲染

#### 4.1.4 渲染模式切换机制

**统一画布架构**：两种渲染模式现在都使用 Draw.io 画布，通过不同的数据格式和转换机制实现。

**模式切换流程**：

```
用户切换渲染模式
  ↓
renderMode 状态变化（drawio ↔ svg）
  ↓
useEffect 监听模式变化
  ↓
1. 停止正在进行的生成（如果存在）
  ↓
2. 切换到对应模式的根分支（ConversationContext）
  ↓
3. 恢复对应分支的画布内容
   - Draw.io 模式：直接加载 XML
   - SVG 模式：加载已转换的 Draw.io XML（包含 SVG image cell）
  ↓
4. 恢复对应分支的对话历史
  ↓
5. 清空输入框
```

**实现位置**：
- `components/chat-panel-optimized.jsx`（第 1006-1062 行）- 模式切换逻辑
- `contexts/conversation-context.jsx` - 分支管理和模式切换

**关键实现**：

```javascript
// components/chat-panel-optimized.jsx
useEffect(() => {
  if (lastRenderModeRef.current !== renderMode) {
    // 1. 停止正在进行的生成
    if (status === "streaming" || status === "submitted") {
      handleStopAll({
        type: "info",
        message: "已切换渲染模式，自动暂停当前生成。"
      });
    }
    
    // 2. 切换到对应模式的根分支
    const targetBranch = switchRenderMode(renderMode);
    
    // 3. 恢复画布内容
    if (targetBranch.diagramXml) {
      await handleDiagramXml(targetBranch.diagramXml, {
        origin: "display",
        modelRuntime: void 0
      });
    } else {
      clearDiagram();
    }
    
    // 4. 恢复对话历史
    setMessages(targetBranch.messages || []);
    setInput("");
    
    lastRenderModeRef.current = renderMode;
  }
}, [renderMode, switchRenderMode, status, handleStopAll, handleDiagramXml, clearDiagram, setMessages, setInput]);
```

**分支管理**：
- 每个渲染模式都有独立的根分支
- 分支元数据中包含 `renderMode` 标识
- 切换模式时自动切换到对应模式的根分支
- 每个分支独立保存画布内容和对话历史

**数据格式统一**：
- Draw.io 模式：直接使用 Draw.io XML 格式
- SVG 模式：SVG 通过 `buildSvgRootXml` 转换为 Draw.io XML，然后统一存储
- 两种模式的数据都存储在 `DiagramContext` 中，使用相同的画布组件渲染

#### 4.1.5 画布更新机制

XML 处理流程：

```
AI 生成 XML
    ↓
handleCanvasUpdate (chat-panel-optimized.jsx)
    ↓
handleDiagramXml (use-diagram-orchestrator.js)
    ↓
tryApplyRoot
    ↓
applyRootToCanvas
    ↓
replaceRootXml / mergeRootXml (lib/utils.js)
    ↓
onDisplayChart (DiagramContext.loadDiagram)
    ↓
drawioRef.current.load({ xml })
    ↓
Draw.io 画布更新
```

更新模式：

1. 替换模式 (`replaceRootXml`)
   - 使用场景: `display_diagram` 工具调用（完全替换画布）、初始化新图表
   - 实现: 保持 `<mxfile>` 和 `<diagram>` 结构，只替换 `<mxGraphModel>` 内的 `<root>`

2. 合并模式 (`mergeRootXml`)
   - 使用场景: 编辑操作（添加、修改元素）、增量更新
   - 实现: 合并新旧 XML，保留现有元素

防抖机制：

目的: 避免频繁更新导致性能问题

实现:
```javascript
// contexts/diagram-context.jsx (第 77-98 行)
const loadDiagram = useCallback((chart) => {
  if (loadDiagramTimeoutRef.current) {
    clearTimeout(loadDiagramTimeoutRef.current);
  }
  
  loadDiagramTimeoutRef.current = setTimeout(() => {
    if (drawioRef.current && chart) {
      drawioRef.current.load({
        xml: chart,
      });
    }
    loadDiagramTimeoutRef.current = null;
  }, 150); // 150ms 防抖
}, [chartXML]);
```

#### 4.1.5 Draw.io 自动降级功能

Draw.io 自动降级功能在 Draw.io 编辑器加载失败时，自动切换到备用 URL，提升用户体验和系统可靠性。

核心 Hook: `hooks/use-drawio-fallback.js`
这是整个降级逻辑的核心，提供了以下功能：

```javascript
const {
    currentUrl,      // 当前使用的 URL
    isLoading,       // 加载状态
    error,           // 错误信息
    isFallback,      // 是否在使用备用 URL
    retryPrimary,    // 重试主 URL
    handleLoad,      // 处理加载成功
    handleError,     // 处理加载失败
} = useDrawioFallback({
    primaryUrl: "https://embed.diagrams.net",
    fallbackUrl: "https://app.diagrams.net",
    timeout: 15000,
    enableFallback: true,
    onFallback: (from, to) => console.log(`降级: ${from} -> ${to}`),
});
```

核心特性：
- ✅ 自动超时检测（默认 15 秒）
- ✅ 自动切换到备用 URL
- ✅ 手动重试主 URL
- ✅ 降级事件回调
- ✅ 可禁用自动降级
- ✅ 完整的 TypeScript 类型支持

页面集成：

文件位置: `app/page.jsx`

主要改动：

1. 导入新 Hook   ```javascript
   import { useDrawioFallback } from "@/hooks/use-drawio-fallback";
   ```

2. 使用降级逻辑   ```javascript
   const {
       currentUrl: drawioBaseUrl,
       isLoading: isDrawioLoading,
       error: drawioError,
       isFallback,
       retryPrimary,
       handleLoad: handleDrawioLoadSuccess,
       handleError: handleDrawioLoadError,
   } = useDrawioFallback({
       primaryUrl: process.env.NEXT_PUBLIC_DRAWIO_BASE_URL,
       fallbackUrl: "https://app.diagrams.net",
       timeout: 15000,
       enableFallback: true,
       onFallback: (from, to) => {
           console.warn(`DrawIO自动降级: ${from} -> ${to}`);
       },
   });
   ```

3. 与诊断系统集成   ```javascript
   useDrawioDiagnostics({
       baseUrl: drawioBaseUrl,
       onRuntimeError: (payload) => {
           setRuntimeError(payload);
           // 严重错误时触发降级
           if (payload.type === "merge" || payload.message?.includes("Error")) {
               handleDrawioLoadError(payload.message);
           }
       },
   });
   ```

工作流程：

```
用户打开页面
    ↓
加载主 URL (embed.diagrams.net)
    ↓
  成功? ──Yes──> 正常使用
    ↓
   No
    ↓
超时或错误?
    ↓
自动切换到备用 URL (app.diagrams.net)
    ↓
  成功? ──Yes──> 使用备用 URL，显示降级提示
    ↓
   No
    ↓
显示错误信息，提供重试按钮
```

配置说明：

在 `.env.local` 中配置：

```bash
# 主 DrawIO URL
NEXT_PUBLIC_DRAWIO_BASE_URL=https://embed.diagrams.net

# 或使用其他 URL
NEXT_PUBLIC_DRAWIO_BASE_URL=https://app.diagrams.net

# 或使用自托管版本
NEXT_PUBLIC_DRAWIO_BASE_URL=https://your-drawio.com
```

#### 4.1.6 性能优化

1. 防抖加载: 150ms 防抖，避免频繁调用 `drawioRef.current.load()`
2. RequestAnimationFrame 优化: 拖拽操作使用 RAF 批量更新
3. 条件渲染: 聊天面板隐藏时，通过 CSS 控制可见性，而不是卸载组件
4. 历史记录优化: 检查是否为空图表，避免保存空白历史；检查是否与上一个版本相同，避免保存重复历史
5. 元素引用缓存: 使用 `elementRefs.current` 缓存 DOM 引用，避免频繁查询

#### 4.1.7 关键代码位置

- 主页面: `app/page.jsx`
- Draw.io 状态管理: `contexts/diagram-context.jsx`
- SVG 编辑器: `components/svg-studio.jsx`
- 画布编排器: `features/chat-panel/hooks/use-diagram-orchestrator.js`
- XML 工具函数: `lib/utils.js`
- Draw.io 降级 Hook: `hooks/use-drawio-fallback.js`

### 4.2 XML 查看页面（app/xml/page.jsx）

（待补充详细实现）

### 4.3 根布局（app/layout.jsx）

（待补充详细实现）

### 4.4 全局提供者（app/providers.jsx）

（待补充详细实现）

---

## 5. API 路由实现

### 5.1 核心功能路由

#### 5.1.1 聊天和图表生成（/api/chat）

（待补充详细实现）

#### 5.1.2 图表修复（/api/diagram-repair）

（待补充详细实现）

#### 5.1.4 模板搜索（/api/search-template）⚠️ **未使用**

**状态**：此 API 路由已实现但当前未被项目使用，保留供未来使用。

**功能说明**：
- 根据查询内容搜索匹配的模板
- 返回最匹配的模板及其详细的绘图指导信息
- 支持按模板类型、标题、描述、标签等进行搜索
- 返回布局建议、配色方案、节点样式等绘图指导

**实现位置**：
- `app/api/search-template/route.js` - 模板搜索 API 实现

**未使用原因**：
- 该 API 路由已实现，但尚未集成到 `/api/chat` 的工具列表中
- LLM 目前无法调用此工具进行模板搜索
- 保留此路由供未来集成使用

#### 5.1.3 Architect Workflow（/api/chat 集成）

Architect Workflow 集成在 `/api/chat` 路由中，通过 `enableArchitectWorkflow` 参数启用。

**启用条件**：
- `enableArchitectWorkflow` 为 `true`（从请求体或环境变量 `ENABLE_ARCHITECT_WORKFLOW` 获取）
- `renderMode` 为 `"drawio"`（Draw.io 模式）
- `isContinuation` 为 `false`（非继续对话）

**工作流程**：
1. 检查是否启用 Architect Workflow
2. 调用 `llm/agents/workflow.js` 的 `executeWorkflow` 函数
3. 传递 `architectModel` 和 `rendererModel` 配置（如果提供）
4. 工作流执行完成后，验证和规范化生成的 XML
5. 返回流式响应格式，包含工具调用 `display_diagram`

**关键代码位置**：
- `app/api/chat/route.js`（第 1088-1156 行）
- `llm/agents/workflow.js` - 工作流编排

### 5.3 模型管理路由

#### 5.3.1 模型列表（/api/models）

（待补充详细实现）

#### 5.3.2 系统模型（/api/system-models）

（待补充详细实现）

#### 5.3.3 配置管理（/api/configs）

（待补充详细实现）

### 5.4 光子扣费路由

#### 5.4.1 执行扣费（/api/photon/charge）

（待补充详细实现）

#### 5.4.2 预扣费检查（/api/photon/pre-charge）

（待补充详细实现）

### 5.5 认证路由

#### 5.5.1 认证验证（/api/auth/validate）

（待补充详细实现）

---

## 6. 聊天面板功能模块（features/chat-panel/）

### 6.1 功能概述

（待补充详细实现）

### 6.2 Hooks 实现

#### 6.2.1 图表编排器（use-diagram-orchestrator.js）

（待补充详细实现）


### 6.3 组件实现

#### 6.3.1 智能工具栏（intelligence-toolbar.jsx）

（待补充详细实现）

#### 6.3.2 工具面板侧边栏（tool-panel-sidebar.jsx）

（待补充详细实现）

### 6.4 工具函数实现

#### 6.4.1 消息处理（utils/messages.js）

（待补充详细实现）

#### 6.4.2 附件处理（utils/attachments.js）

（待补充详细实现）

### 6.5 常量定义（constants.js）

（待补充详细实现）

### 6.6 类型定义（types.js）

（待补充详细实现）

---

（后续部分待补充...）

---

## 15. 功能实现

### 15.1 图表历史功能实现

### 2.1 概述

图表历史功能允许用户查看和恢复每次 AI 修改前的图表版本。该功能支持两种渲染模式：
- Draw.io 模式：使用 Draw.io XML 格式的图表
- SVG 模式：使用 SVG 格式的图表

### 2.2 用户操作流程

1. 用户点击聊天输入框中的"查看图表变更记录"按钮（历史图标）
2. 打开"图表历史"对话框，显示所有保存的图表版本缩略图
3. 用户点击任意缩略图即可恢复对应的图表版本
4. 对话框自动关闭，图表恢复到选中的版本

### 2.3 核心组件

#### 触发按钮组件

文件位置：`components/chat-input-optimized.jsx`

关键代码：
```javascript
<ButtonWithTooltip
    type="button"
    variant="ghost"
    size="icon"
    onClick={() => onToggleHistory(true)}
    disabled={
        isBusy ||
        historyItems.length === 0 ||
        interactionLocked
    }
    tooltipContent="查看图表变更记录"
>
    <History className="h-4 w-4" />
</ButtonWithTooltip>
```

#### 历史对话框组件

文件位置：`components/history-dialog.jsx`

功能说明：
- 使用 Radix UI 的 `Dialog` 组件
- 支持两种数据源：通过 `items` prop 传入（用于 SVG 模式）或从 `useDiagram()` hook 获取（用于 Draw.io 模式）
- 使用 Next.js 的 `Image` 组件显示缩略图
- 点击缩略图时调用恢复函数并关闭对话框

### 2.4 状态管理

#### Draw.io 模式历史管理

文件位置：`contexts/diagram-context.jsx`

历史记录数据结构：
```javascript
/ * @typedef {{svg: string, xml: string}} DiagramHistoryEntry
 */
```

每个历史记录项包含：
- `svg`：图表的 SVG 格式（用于显示缩略图）
- `xml`：图表的 Draw.io XML 格式（用于恢复图表）

保存历史记录：
历史记录在 `handleDiagramExport` 函数中保存，包含以下逻辑：
1. 检查是否是空白图表（避免保存空画布）
2. 检查是否与上一个版本重复（避免保存相同版本）
3. 只有在非空且非重复的情况下才保存

恢复历史记录：
```javascript
const restoreDiagramAt = (index) => {
    const entry = diagramHistory[index];
    if (!entry) {
        return;
    }
    loadDiagram(entry.xml);
    setChartXML(entry.xml);
    setLatestSvg(entry.svg);
    setActiveVersionIndex(index);
};
```

#### SVG 模式历史管理

文件位置：`contexts/svg-editor-context.jsx`

历史记录数据结构：
- `svg`：SVG 标记字符串
- `dataUrl`：SVG 转换为 Data URL（用于显示缩略图）
- `timestamp`：时间戳

### 2.5 历史记录保存时机

#### Draw.io 模式

1. AI 生成图表后（`display_diagram` 工具调用）：延迟 500ms 后异步保存，确保图表已加载
2. AI 生成 SVG 后转换为 Draw.io（`display_svg` 工具调用，非 SVG 模式）：同样延迟 500ms 后保存

#### SVG 模式

历史记录在 `loadSvgMarkup` 函数中，当加载 SVG 时会自动保存历史（默认 `saveHistory` 为 `true`）

### 2.6 历史记录数据整合

在 `chat-panel-optimized.jsx` 中，根据当前渲染模式整合历史记录：

```javascript
const historyItems = useMemo(
  () => isSvgMode ? svgHistory.map((item) => ({
    svg: item.dataUrl || item.svg
  })) : mxDiagramHistory,
  [isSvgMode, svgHistory, mxDiagramHistory]
);

const handleRestoreHistory = useCallback(
  (index) => {
    if (isSvgMode) {
      restoreSvgHistoryAt(index);
    } else {
      restoreDiagramAt(index);
    }
  },
  [isSvgMode, restoreDiagramAt, restoreSvgHistoryAt]
);
```

---

### 15.2 流式与非流式响应实现

### 3.1 概述

DrawIO 自动降级功能在 Draw.io 编辑器加载失败时，自动切换到备用 URL，提升用户体验和系统可靠性。

### 3.2 核心实现

#### 核心 Hook: `hooks/use-drawio-fallback.ts`

这是整个降级逻辑的核心，提供了以下功能：

```typescript
const {
    currentUrl,      // 当前使用的 URL
    isLoading,       // 加载状态
    error,           // 错误信息
    isFallback,      // 是否在使用备用 URL
    retryPrimary,    // 重试主 URL
    handleLoad,      // 处理加载成功
    handleError,     // 处理加载失败
} = useDrawioFallback({
    primaryUrl: "https://embed.diagrams.net",
    fallbackUrl: "https://app.diagrams.net",
    timeout: 15000,
    enableFallback: true,
    onFallback: (from, to) => console.log(`降级: ${from} -> ${to}`),
});
```

核心特性：
- ✅ 自动超时检测（默认 15 秒）
- ✅ 自动切换到备用 URL
- ✅ 手动重试主 URL
- ✅ 降级事件回调
- ✅ 可禁用自动降级
- ✅ 完整的 TypeScript 类型支持

#### 页面集成

文件位置: `app/page.jsx`

主要改动：

1. 导入新 Hook   ```typescript
   import { useDrawioFallback } from "@/hooks/use-drawio-fallback";
   ```

2. 使用降级逻辑   ```typescript
   const {
       currentUrl: drawioBaseUrl,
       isLoading: isDrawioLoading,
       error: drawioError,
       isFallback,
       retryPrimary,
       handleLoad: handleDrawioLoadSuccess,
       handleError: handleDrawioLoadError,
   } = useDrawioFallback({
       primaryUrl: process.env.NEXT_PUBLIC_DRAWIO_BASE_URL,
       fallbackUrl: "https://app.diagrams.net",
       timeout: 15000,
       enableFallback: true,
       onFallback: (from, to) => {
           console.warn(`DrawIO自动降级: ${from} -> ${to}`);
       },
   });
   ```

3. 与诊断系统集成   ```typescript
   useDrawioDiagnostics({
       baseUrl: drawioBaseUrl,
       onRuntimeError: (payload) => {
           setRuntimeError(payload);
           // 严重错误时触发降级
           if (payload.type === "merge" || payload.message?.includes("Error")) {
               handleDrawioLoadError(payload.message);
           }
       },
   });
   ```

### 3.3 工作流程

```
用户打开页面
    ↓
加载主 URL (embed.diagrams.net)
    ↓
  成功? ──Yes──> 正常使用
    ↓
   No
    ↓
超时或错误?
    ↓
自动切换到备用 URL (app.diagrams.net)
    ↓
  成功? ──Yes──> 使用备用 URL，显示降级提示
    ↓
   No
    ↓
显示错误信息，提供重试按钮
```

### 3.4 配置说明

#### 环境变量

在 `.env.local` 中配置：

```bash
# 主 DrawIO URL
NEXT_PUBLIC_DRAWIO_BASE_URL=https://embed.diagrams.net

# 或使用其他 URL
NEXT_PUBLIC_DRAWIO_BASE_URL=https://app.diagrams.net

# 或使用自托管版本
NEXT_PUBLIC_DRAWIO_BASE_URL=https://your-drawio.com
```

#### 代码配置

在 `app/page.tsx` 中调整参数：

```typescript
useDrawioFallback({
    primaryUrl: process.env.NEXT_PUBLIC_DRAWIO_BASE_URL,
    fallbackUrl: "https://app.diagrams.net",  // 修改备用 URL
    timeout: 20000,                            // 调整超时时间
    enableFallback: true,                      // 启用/禁用降级
    onFallback: (from, to) => {
        // 自定义降级处理
        analytics.track('drawio_fallback', { from, to });
    },
});
```

### 3.5 使用场景

#### 场景 1: 正常加载
```
1. 用户访问页面
2. 开始加载 https://embed.diagrams.net
3. 5 秒后加载成功
4. 用户正常使用编辑器
```

#### 场景 2: 主 URL 超时，自动降级
```
1. 用户访问页面
2. 开始加载 https://embed.diagrams.net
3. 15 秒后超时，无响应
4. 自动切换到 https://app.diagrams.net
5. 3 秒后加载成功
6. 显示 "加载中... (使用备用URL)"
7. 用户可以正常使用，看到降级提示
```

#### 场景 3: 两个 URL 都失败
```
1. 用户访问页面
2. 开始加载主 URL，15 秒后超时
3. 自动切换到备用 URL
4. 备用 URL 也在 15 秒后超时
5. 显示详细错误信息和解决方案
6. 提供"重试主URL"按钮
```

### 3.6 监控和日志

系统会在关键操作时输出日志：

```javascript
// 降级时
[DrawIO Fallback] 主URL加载失败: https://embed.diagrams.net，切换到备用URL: https://app.diagrams.net

// 超时时
[DrawIO Fallback] 加载超时 (15000ms): https://embed.diagrams.net

// 成功时
[DrawIO Fallback] 加载成功: https://app.diagrams.net (备用URL)

// 重试时
[DrawIO Fallback] 重试主URL: https://embed.diagrams.net
```

---

### 15.3 光子扣费功能实现

### 4.1 概述

Figsci 集成了玻尔平台的光子扣费功能，支持在用户使用 AI 生成图表时自动扣除光子费用。系统支持三种扣费模式：固定扣费、按 Token 使用量扣费、混合扣费。

### 4.2 架构设计

```
用户请求
   ↓
聊天 API (/api/chat)
   ↓
AI 模型生成图表
   ↓
onFinish 回调 → chargePhotonIfEnabled()
   ↓
光子扣费 API (/api/photon/charge)
   ↓
玻尔平台扣费接口
```

### 4.3 核心文件

| 文件路径 | 说明 |
|---------|------|
| `app/api/photon/charge/route.js` | 光子扣费 API 路由 |
| `lib/photon-client.js` | 光子扣费客户端工具库 |
| `app/api/chat/route.js` | 聊天 API（集成了自动扣费） |

### 4.4 扣费流程

#### 详细步骤

1. 用户发送请求   - 用户在聊天界面发送消息
   - 请求发送到 `/api/chat`

2. AI 模型生成内容   - 聊天 API 调用 AI 模型
   - 模型生成图表内容
   - 记录 token 使用量

3. 自动触发扣费   - 在 `onFinish` 回调中调用 `chargePhotonIfEnabled()`
   - 检查是否启用扣费功能
   - 获取用户 AK（从 Cookie 或使用开发者 AK）

4. 调用扣费 API   - 计算扣费金额（根据配置的模式）
   - 生成唯一的 `bizNo`
   - 调用玻尔平台扣费接口

5. 处理扣费结果   - 成功：记录日志
   - 失败：记录错误，但不影响主流程

### 4.5 扣费规则

#### 固定扣费模式

每次 AI 成功生成请求扣除固定数量的光子，任务中断或异常时不收费。

配置：
```env
BOHRIUM_CHARGE_MODE=fixed
BOHRIUM_CHARGE_PER_REQUEST=1  # 每次成功请求扣除 1 光子
```

扣费逻辑：
- ✅ 任务成功完成（finishReason 为 'stop' 或 'tool-calls'）：收取固定费用
- ❌ 任务中断/异常/网络错误：不收费

#### Token 扣费模式

根据实际消耗的 token 数量扣费，无论任务是否成功完成都会收费。

配置：
```env
BOHRIUM_CHARGE_MODE=token
BOHRIUM_CHARGE_PER_1K_TOKEN=1  # 每 1000 个 token 扣除 1 光子
```

计费公式：
```
扣费金额 = ceil((总 token 数 / 1000) × 每千 token 费用)
```

#### 混合扣费模式（推荐）

同时使用固定扣费和按量扣费，固定费用仅在任务成功完成时收取，token 费用无论任务是否完成都会收取。

配置：
```env
BOHRIUM_CHARGE_MODE=mixed
BOHRIUM_CHARGE_PER_REQUEST=1   # 每次成功请求额外扣除 1 光子
BOHRIUM_CHARGE_PER_1K_TOKEN=1  # 每 1000 个 token 扣除 1 光子
```

计费公式：
```
# 任务成功完成时：
总扣费 = 固定费用 + ceil((总 token 数 / 1000) × 每千 token 费用)

# 任务中断/异常时：
总扣费 = ceil((总 token 数 / 1000) × 每千 token 费用)
```

### 4.6 关键代码片段

#### 自动扣费函数

```javascript
// app/api/chat/route.js

async function chargePhotonIfEnabled(req, usage, isTaskCompleted = true) {
  const enablePhotonCharge = process.env.NEXT_PUBLIC_ENABLE_PHOTON_CHARGE === 'true';
  
  if (!enablePhotonCharge) {
    return;
  }
  
  // 计算扣费金额
  const chargeMode = process.env.BOHRIUM_CHARGE_MODE || 'fixed';
  let eventValue = 0;
  
  if (chargeMode === 'token') {
    const chargePerKToken = parseFloat(process.env.BOHRIUM_CHARGE_PER_1K_TOKEN || '1');
    eventValue = Math.ceil((usage.totalTokens / 1000) * chargePerKToken);
  } else if (chargeMode === 'mixed') {
    // 混合模式：固定费用仅在任务完成时收取
    const fixedCharge = isTaskCompleted ? parseInt(process.env.BOHRIUM_CHARGE_PER_REQUEST || '1') : 0;
    const chargePerKToken = parseFloat(process.env.BOHRIUM_CHARGE_PER_1K_TOKEN || '1');
    const tokenCharge = Math.ceil((usage.totalTokens / 1000) * chargePerKToken);
    eventValue = fixedCharge + tokenCharge;
  } else {
    // 固定模式：仅在任务完成时收取
    eventValue = isTaskCompleted ? parseInt(process.env.BOHRIUM_CHARGE_PER_REQUEST || '1') : 0;
  }
  
  // 调用扣费 API...
}
```

#### 集成到聊天 API

```javascript
// app/api/chat/route.js

const result = await streamText(commonConfig);

return result.toUIMessageStreamResponse({
  onFinish: async ({ responseMessage, messages: messages2 }) => {
    // 记录 token 使用量
    const usage = await result.usage;
    
    // 检查任务是否成功完成
    const finishReason = await result.finishReason;
    const isTaskCompleted = finishReason === 'stop' || finishReason === 'tool-calls';
    
    // 自动扣费
    await chargePhotonIfEnabled(req, {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens
    }, isTaskCompleted);
  }
});
```

### 4.7 配置说明

#### 环境变量

```env
# ===== 玻尔平台光子扣费配置 =====

# 是否启用光子扣费功能
NEXT_PUBLIC_ENABLE_PHOTON_CHARGE=true

# SKU ID（必需，如果启用扣费）
BOHRIUM_SKU_ID=your-sku-id-here

# 开发者 Access Key（用于开发调试）
BOHRIUM_DEV_ACCESS_KEY=your-access-key-here

# 扣费模式：'fixed'、'token' 或 'mixed'
BOHRIUM_CHARGE_MODE=mixed

# 固定扣费金额
BOHRIUM_CHARGE_PER_REQUEST=1

# 基于 Token 的扣费金额
BOHRIUM_CHARGE_PER_1K_TOKEN=1

# 用户界面显示配置（可选）
NEXT_PUBLIC_PHOTON_CHARGE_PER_MESSAGE=1
NEXT_PUBLIC_PHOTON_CHARGE_PER_1K_TOKEN=1
```

---

### 15.4 扣费显示功能实现

### 5.1 概述

扣费显示功能为用户和开发者提供了清晰的扣费信息反馈：
1. 用户界面：在每条 AI 回复消息下方显示 Token 使用量和扣费金额
2. 后台日志：在服务端控制台输出详细的扣费过程和结果

### 5.2 用户界面显示

#### Token 使用量和扣费信息卡片

每条 AI 助手的回复消息下方会自动显示一个信息卡片，包含：

- Token 使用量  - 总计 tokens
  - 输入 tokens
  - 输出 tokens

- 生成耗时  - 显示本次生成的耗时
  - 自动分类：极速响应、快速生成、正常速度、复杂任务

- 扣费信息（如果启用了光子扣费）
  - 扣费金额（光子数）
  - 扣费模式（固定扣费、Token 扣费、混合扣费）
  - 扣费状态（成功/失败）

#### 显示样式

紧凑模式（默认）：
```
[⚡ 1,234 tokens] [🕐 2.5s] [💰 -3 光子]
```

扣费状态指示：
- ✅ 成功扣费：绿色显示，显示扣除的光子数
- ❌ 扣费失败：红色显示，提示失败原因
- ⚠️ 余额不足：红色显示，提示余额不足

### 5.3 核心组件

#### TokenUsageDisplay 组件

文件位置: `components/token-usage-display.jsx`

功能：
- 显示 Token 使用量统计
- 显示生成耗时
- 显示扣费信息
- 支持紧凑模式和详细模式

扣费信息显示代码：
```javascript
{chargeInfo && (
    <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <Coins className="h-2.5 w-2.5" strokeWidth={3} />
            <span>扣费</span>
        </div>
        {chargeInfo.eventValue > 0 ? (
            <>
                <div className="flex items-baseline gap-1.5">
                    <span className={cn(
                        "text-base font-bold",
                        chargeInfo.success ? "text-emerald-600" : "text-red-600"
                    )}>
                        {chargeInfo.success ? '-' : ''}{formatNumber(chargeInfo.eventValue)}
                    </span>
                    <span className="text-[10px] text-slate-500">光子</span>
                </div>
                <div className="text-[9px] text-slate-500">
                    {chargeInfo.chargeMode === 'fixed' && "固定扣费"}
                    {chargeInfo.chargeMode === 'token' && "按量扣费"}
                    {chargeInfo.chargeMode === 'mixed' && "混合扣费"}
                    {!chargeInfo.success && chargeInfo.isInsufficientBalance && " · 余额不足"}
                    {!chargeInfo.success && !chargeInfo.isInsufficientBalance && " · 扣费失败"}
                </div>
            </>
        ) : (
            <div className="text-[9px] text-slate-500">
                本次未扣费
            </div>
        )}
    </div>
)}
```

#### PhotonChargeNotice 组件

文件位置: `components/photon-charge-notice.jsx`

功能：在聊天界面显示扣费提示，告知用户扣费规则

```javascript
export function PhotonChargeNotice({ className = "" }) {
  const [chargeInfo, setChargeInfo] = useState(null);
  
  // 从环境变量获取扣费配置
  const chargeMode = process.env.NEXT_PUBLIC_BOHRIUM_CHARGE_MODE || 'fixed';
  
  // 根据模式显示不同的提示信息
  return (
    <div className="charge-notice">
      {chargeInfo.mode === 'fixed' && (
        <span>每次成功生成图表需要 <strong>{chargeInfo.amount}</strong> 光子</span>
      )}
      {chargeInfo.mode === 'token' && (
        <span>按使用量计费：<strong>{chargeInfo.amount}</strong> 光子 / {chargeInfo.unit}</span>
      )}
      {chargeInfo.mode === 'mixed' && (
        <span>混合计费：发送时预扣 <strong>{chargeInfo.fixedAmount}</strong> 光子，
              完成后按量计费 <strong>{chargeInfo.tokenAmount}</strong> 光子/1000 tokens</span>
      )}
    </div>
  );
}
```

### 5.4 后台日志输出

#### 日志格式

后台日志使用清晰的分隔符和 emoji 标记，便于快速识别：

扣费请求日志：
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

扣费成功日志：
```
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
【光子扣费】扣费成功
------------------------------------------------------------
业务编号: 1702345678901234
扣费金额: 3 光子
扣费模式: 混合扣费
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
```

扣费失败日志：
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

### 5.5 工具函数

项目提供了一套扣费信息工具函数（`lib/charge-utils.js`），方便在其他地方复用：

#### 格式化扣费模式

```javascript
import { formatChargeMode } from '@/lib/charge-utils';

const mode = formatChargeMode('mixed'); // "混合扣费"
```

#### 获取扣费描述

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

#### 计算 Token 扣费金额

```javascript
import { calculateTokenCharge } from '@/lib/charge-utils';

const charge = calculateTokenCharge(1700, 1); // 2 光子
```

（内容已整合到 15.2）

---

### 6.1 概述

Figsci 支持两种 AI 响应模式：
- 流式（Streaming）：实时逐字输出，用户体验更流畅
- 非流式（Non-Streaming）：等待完整响应后一次性显示

### 6.2 配置方式

#### 在模型配置中启用/禁用流式

1. 打开"模型配置"对话框
2. 在每个模型配置中，有一个"启用流式输出"开关
3. 切换开关即可为该模型启用或禁用流式模式

#### 配置数据存储位置

模型配置存储在浏览器的 `localStorage` 中：
```javascript
{
  "id": "endpoint-1",
  "label": "OpenAI",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-...",
  "models": [
    {
      "id": "gpt-4",
      "label": "GPT-4",
      "modelId": "gpt-4",
      "isStreaming": true,  // 流式开关
      "enabled": true
    }
  ]
}
```

### 6.3 技术实现

#### 后端实现

文件位置: `app/api/chat/route.js`

```javascript
// 根据模型配置决定使用流式或非流式
const enableStreaming = selectedModel?.isStreaming ?? true;

if (enableStreaming) {
  // 流式响应
  const result = await streamText(commonConfig);
  return result.toUIMessageStreamResponse({
    onError: errorHandler,
    messageMetadata: ({ part }) => {
      // 返回 token 使用统计等 metadata
    },
  });
} else {
  // 非流式响应
  const result = await generateText(commonConfig);
  return result.toUIMessageResponse({
    onError: errorHandler,
    messageMetadata: () => ({
      usage: result.usage,
      finishReason: result.finishReason,
    }),
  });
}
```

#### 前端处理

文件位置: `components/chat-panel-optimized.jsx`

```javascript
// 使用 AI SDK 的 useChat hook
const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({
    api: "/api/chat",
  }),
  async onToolCall({ toolCall }) {
    // 处理工具调用
  },
});

// 发送消息时传递模型配置
sendMessage(
  { parts },
  {
    body: {
      xml: chartXml,
      modelRuntime: selectedModel,
      enableStreaming: selectedModel?.isStreaming ?? false,
    },
  }
);
```

### 6.4 关键差异

| 特性 | streamText | generateText |
|------|-----------|--------------|
| 响应方式 | 流式，逐步返回 | 非流式，一次返回 |
| 用户体验 | 实时反馈，减少等待感 | 等待完整结果 |
| 返回方法 | `toUIMessageStreamResponse()` | `toUIMessageResponse()` |
| Token 统计 | 需要 await `result.usage` | 直接访问 `result.usage` |
| 工具调用 | 实时显示工具调用过程 | 完成后显示 |
| 适用场景 | 交互式对话 | 批量处理、后台任务 |

### 6.5 使用场景对比

#### 流式模式适用场景
✅ 实时对话 - 聊天、问答等交互式场景  
✅ 长文本生成 - 文章、报告等，让用户看到实时进展  
✅ 图表生成 - 流式输出 XML，用户可以看到图表逐步构建  
✅ 用户体验优先 - 减少等待感，提供即时反馈  

#### 非流式模式适用场景
✅ 批量处理 - 后台任务，不需要实时反馈  
✅ 稳定性要求高 - 某些场景需要完整响应才能处理  
✅ 工具调用场景 - 复杂的多步骤工具调用，需要等待完整结果  
✅ API 兼容性 - 某些 LLM 提供商可能不支持流式  

### 6.6 注意事项

1. 不要手动编码流式数据格式：使用 AI SDK 提供的标准方法
2. 工具调用处理：无论流式还是非流式，工具调用都在客户端的 `onToolCall` 回调中处理
3. 状态管理：`useChat` 的 `status` 状态在两种模式下都正确工作

---

### 15.5 Architect Workflow 功能实现

#### 15.5.1 概述

Architect Workflow 是一个两阶段智能体工作流，用于将用户输入转换为高质量的 Draw.io XML 图表。工作流分为两个核心阶段：

1. **The Architect（逻辑构建）**：使用强大的 LLM（如 Gemini 3 Pro、GPT-5、Claude 4.5）将用户输入和 Mermaid 图表转换为 VISUAL SCHEMA
2. **The Renderer（绘图渲染）**：将 VISUAL SCHEMA 转换为 Draw.io XML 代码

#### 15.5.2 架构设计

```
用户输入提示词
  ↓
步骤 1: 提示词格式化 (prompt-formatter.js)
  - 将用户输入格式化为规范的 Markdown 格式
  ↓
步骤 2: Mermaid 生成 (mermaid-generator.js)
  - 根据用户输入生成 Mermaid 图表代码
  - 帮助理解用户输入的逻辑结构
  ↓
步骤 3: The Architect (architect.js)
  - 输入：格式化提示词 + Mermaid
  - 输出：VISUAL SCHEMA (---BEGIN PROMPT--- ... ---END PROMPT---)
  - 使用 ARCHITECT_SYSTEM_MESSAGE 系统提示词
  ↓
步骤 4: The Renderer (renderer.js)
  - 输入：VISUAL SCHEMA
  - 输出：Draw.io XML 代码
  - 使用 RENDERER_SYSTEM_MESSAGE 系统提示词
  ↓
XML 验证和规范化 (lib/diagram-validation.js)
  ↓
应用到画布
```

#### 15.5.3 核心文件

- `llm/agents/prompt-formatter.js` - 提示词格式化 Agent
- `llm/agents/mermaid-generator.js` - Mermaid 生成器 Agent
- `llm/agents/architect.js` - Architect Agent（逻辑构建）
- `llm/agents/renderer.js` - Renderer Agent（绘图渲染）
- `llm/agents/workflow.js` - 工作流编排
- `app/api/chat/route.js` - 聊天 API，集成 Architect Workflow
- `components/model-config-dialog.jsx` - 模型配置对话框，包含 Architect Workflow 配置
- `lib/prompts.js` - 包含 `ARCHITECT_SYSTEM_MESSAGE` 和 `RENDERER_SYSTEM_MESSAGE`
- `lib/diagram-validation.js` - XML 验证和规范化

#### 15.5.4 工作流步骤详解

**步骤 1: 提示词格式化**

文件位置: `llm/agents/prompt-formatter.js`

功能：将用户输入的原始文本格式化为规范的 Markdown 格式，作为后续步骤的输入。

```javascript
export async function formatPrompt({ userInput, currentXml, modelRuntime }) {
  // 构建用户提示词
  let userPrompt = userInput;
  if (currentXml && currentXml.trim()) {
    userPrompt = `${userInput}\n\n## 当前画布状态\n当前画布已有内容，请在现有基础上进行修改或扩展。`;
  }
  
  // 调用 AI 模型进行格式化
  const response = await generateText({
    model: resolvedModel.model,
    system: PROMPT_FORMATTER_SYSTEM_MESSAGE,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0.1,
  });
  
  return { formattedPrompt: response.text };
}
```

**步骤 2: Mermaid 生成**

文件位置: `llm/agents/mermaid-generator.js`

功能：根据格式化后的用户输入生成 Mermaid 图表代码，帮助理解用户输入的逻辑结构。

```javascript
export async function generateMermaid({ userInput, modelRuntime }) {
  // 调用 AI 模型生成 Mermaid 代码
  const response = await generateText({
    model: resolvedModel.model,
    system: MERMAID_GENERATOR_SYSTEM_MESSAGE,
    messages: [{ role: "user", content: userInput }],
    temperature: 0.3,
  });
  
  // 从代码块中提取 Mermaid 代码
  const mermaidMatch = response.text.match(/```mermaid\s*([\s\S]*?)\s*```/i);
  const mermaid = mermaidMatch ? mermaidMatch[1].trim() : "";
  
  return { mermaid };
}
```

**步骤 3: The Architect**

文件位置: `llm/agents/architect.js`

功能：将格式化提示词和 Mermaid 转换为 VISUAL SCHEMA。

```javascript
export async function generateVisualSchema({ formattedPrompt, mermaid, modelRuntime }) {
  // 构建用户提示词
  let userPrompt = formattedPrompt;
  if (mermaid && mermaid.trim()) {
    userPrompt = `${formattedPrompt}\n\n## Mermaid 图表参考\n以下Mermaid图表可以帮助理解逻辑结构：\n\n\`\`\`mermaid\n${mermaid}\n\`\`\`\n\n请结合上述Mermaid图表和用户输入，生成VISUAL SCHEMA。`;
  }
  
  // 调用 AI 模型生成 VISUAL SCHEMA
  const response = await generateText({
    model: resolvedModel.model,
    system: ARCHITECT_SYSTEM_MESSAGE,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0.1,
  });
  
  // 提取 VISUAL SCHEMA
  const visualSchema = extractVisualSchema(response.text);
  
  return { visualSchema, rawOutput: response.text };
}
```

**步骤 4: The Renderer**

文件位置: `llm/agents/renderer.js`

功能：将 VISUAL SCHEMA 转换为 Draw.io XML 代码。

```javascript
export async function generateXml({ visualSchema, modelRuntime }) {
  // 调用 AI 模型生成 XML
  const response = await generateText({
    model: resolvedModel.model,
    system: RENDERER_SYSTEM_MESSAGE,
    messages: [{ role: "user", content: visualSchema }],
    temperature: 0.1,
  });
  
  // 提取 XML 代码
  const xml = extractXml(response.text);
  
  return { xml };
}
```

**工作流编排**

文件位置: `llm/agents/workflow.js`

功能：协调整个 Architect Workflow 的执行流程。

```javascript
export async function executeWorkflow({ userInput, currentXml, modelRuntime, architectModel, rendererModel }) {
  // 步骤 1: 提示词格式化
  const formatResult = await formatPrompt({ userInput, currentXml, modelRuntime });
  
  // 步骤 2: Mermaid 生成（可选，失败时继续）
  let mermaidResult;
  try {
    mermaidResult = await generateMermaid({ userInput: formatResult.formattedPrompt, modelRuntime });
  } catch (error) {
    console.warn("Mermaid 生成失败，继续执行:", error);
    mermaidResult = { mermaid: "" };
  }
  
  // 步骤 3: The Architect
  const architectResult = await generateVisualSchema({
    formattedPrompt: formatResult.formattedPrompt,
    mermaid: mermaidResult.mermaid || "",
    modelRuntime: architectModel || modelRuntime,
  });
  
  // 步骤 4: The Renderer
  const rendererResult = await generateXml({
    visualSchema: architectResult.visualSchema,
    modelRuntime: rendererModel || modelRuntime,
  });
  
  return {
    xml: rendererResult.xml,
    formattedPrompt: formatResult.formattedPrompt,
    mermaid: mermaidResult.mermaid,
    visualSchema: architectResult.visualSchema,
    metadata: { /* ... */ },
  };
}
```

#### 15.5.5 UI 配置

文件位置: `components/model-config-dialog.jsx`

Architect Workflow 配置区域包含：

1. **启用开关**：`Switch` 组件控制 `enableArchitectWorkflow`
2. **Architect 模型选择器**：选择用于逻辑构建的模型（推荐：GPT-4o、Claude 3 Opus）
3. **Renderer 模型选择器**：选择用于绘图渲染的模型（推荐：GPT-4o、Gemini 1.5 Pro）

配置存储在 `localStorage` 中，键名为 `architectWorkflowConfig`：

```javascript
{
  enabled: true,
  architectModel: { /* 模型配置 */ },
  rendererModel: { /* 模型配置 */ }
}
```

#### 15.5.6 配置说明

**环境变量配置**（可选）：

```bash
# Architect 模型配置
ARCHITECT_MODEL_ID=gemini-2.5-pro
ARCHITECT_MODEL_BASE_URL=https://api.example.com
ARCHITECT_MODEL_API_KEY=your-api-key

# Renderer 模型配置
RENDERER_MODEL_ID=gpt-4o
RENDERER_MODEL_BASE_URL=https://api.openai.com
RENDERER_MODEL_API_KEY=your-api-key

# 全局启用 Architect Workflow
ENABLE_ARCHITECT_WORKFLOW=true
```

**前端配置**：

通过模型配置对话框启用和配置 Architect Workflow，配置会自动保存到 `localStorage`。

#### 15.5.7 错误处理

- **Mermaid 生成失败**：工作流会继续执行，使用空的 Mermaid 代码
- **Architect 失败**：工作流会抛出错误，回退到原有的聊天逻辑
- **Renderer 失败**：工作流会抛出错误，回退到原有的聊天逻辑
- **XML 验证失败**：会尝试修复 XML，如果修复失败则抛出错误

#### 15.5.8 关键设计点

- ✅ 两阶段设计：逻辑构建和绘图渲染分离，各司其职
- ✅ 独立模型配置：可以为 Architect 和 Renderer 选择不同的模型
- ✅ 完整的错误处理：每个步骤都有错误处理和回退机制
- ✅ XML 验证：生成的 XML 会经过验证和规范化，确保可以正确应用到画布
- ✅ 灵活的配置：支持环境变量和前端 UI 配置

---

### 15.6 数据持久化功能实现

### 8.1 概述

Figsci 项目实现了多层次的保存功能，涵盖了图表数据、用户配置、对话状态、模板使用记录等多个方面。

### 8.2 数据持久化架构

#### 基本原则

Figsci 采用客户端 localStorage 作为主要的数据持久化方案，遵循以下原则：

1. 统一的存储键名规范：使用 `Figsci` 前缀避免冲突
2. 完善的错误处理：确保数据读取和写入的安全性
3. 客户端环境检查：避免在服务端渲染时访问 localStorage
4. 数据验证和规范化：确保存储数据的完整性

#### 存储键名规范

```javascript
const STORAGE_KEYS = {
  // 模型配置注册表
  MODEL_REGISTRY: "Figsci.modelRegistry.v1",
  
  // 国际化语言设置
  LOCALE: "Figsci-locale",
  
  // 最近使用的模板
  RECENT_TEMPLATES: "Figsci_recent_templates",
  
  // 最后保存的图表XML
  LAST_XML: "LAST_XML_STORAGE_KEY"
};
```

### 8.3 图表保存系统

#### 核心组件：DiagramContext

文件位置: `contexts/diagram-context.jsx`

主要状态：
```javascript
const [chartXML, setChartXML] = useState("");           // 当前图表XML
const [latestSvg, setLatestSvg] = useState("");         // 最新SVG渲染结果
const [diagramHistory, setDiagramHistory] = useState([]); // 历史记录数组
const [activeVersionIndex, setActiveVersionIndex] = useState(-1); // 当前版本索引
```

#### 图表XML自动保存

系统在组件初始化时自动从 localStorage 恢复上次保存的图表：

```javascript
useEffect(() => {
    if (typeof window === "undefined") return;
    try {
        const stored = window.localStorage.getItem(LAST_XML_STORAGE_KEY);
        if (stored && stored !== chartXML) {
            setChartXML(stored);
        }
    } catch {
        // 忽略错误，使用默认空状态
    }
}, []);
```

#### 智能历史记录保存

系统在 `handleDiagramExport` 函数中实现了智能的历史记录保存逻辑：

1. 检查是否是空白图表（避免保存空画布）
2. 检查是否与上一个版本重复（避免保存相同版本）
3. 只有在非空且非重复的情况下才保存

### 8.4 用户配置保存

#### 模型配置注册表

文件位置: `hooks/use-model-registry.js`

存储结构：
```javascript
const STORAGE_KEY = "Figsci.modelRegistry.v1";

const ModelRegistryState = {
    endpoints: [], // 模型端点配置数组
    selectedModelKey: string // 当前选中的模型键
};
```

持久化保存函数：
```javascript
const setAndPersist = useCallback((updater) => {
    setState((prev) => {
        const next = updater(prev);
        if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
    });
}, []);
```

#### 国际化设置保存

文件位置: `contexts/locale-context.jsx`

```javascript
const LOCALE_STORAGE_KEY = "Figsci-locale";

const setLocale = (newLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    // 更新 html lang 属性
    document.documentElement.lang = newLocale === "zh" ? "zh-CN" : "en";
};
```

### 8.5 模板使用记录

文件位置: `components/template-gallery.jsx`

存储键名：
```javascript
const RECENT_KEY = "Figsci_recent_templates";
```

最近使用记录更新：
```javascript
const updateRecent = (templateId) => {
    setRecentTemplateIds((prev) => {
        // 将新使用的模板移到最前面，去重，并限制为6个
        const next = [templateId, ...prev.filter((id) => id !== templateId)].slice(0, 6);
        if (typeof window !== "undefined") {
            localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        }
        return next;
    });
};
```

### 8.6 localStorage 存储规范

#### 错误处理模式

所有 localStorage 操作都包含完善的错误处理：

```javascript
// 读取数据的标准模式
const loadData = (key, defaultValue = null) => {
    if (typeof window === "undefined") return defaultValue;
    
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.warn(`Failed to load data from localStorage (${key}):`, error);
    }
    
    return defaultValue;
};

// 保存数据的标准模式
const saveData = (key, data) => {
    if (typeof window === "undefined") return;
    
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Failed to save data to localStorage (${key}):`, error);
    }
};
```

---


- `🔄 使用自定义 AI API 进行匹配...` - 表示正在使用自定义 API
- `✅ 自定义 AI API 调用成功` - 表示 API 调用成功
- `❌ 自定义 API 调用失败` - 表示 API 调用失败，会降级到关键词匹配

---

## 11. AI Agents 工作流实现（llm/）

### 11.1 Architect Agent（agents/architect.js）

**功能**：将用户输入和 Mermaid 转换为 VISUAL SCHEMA

**核心函数**：`generateVisualSchema`

**输入参数**：
- `formattedPrompt` - 格式化后的用户提示词
- `mermaid` - Mermaid 图表代码（可选）
- `modelRuntime` - 模型运行时配置（可选）

**输出**：
- `visualSchema` - VISUAL SCHEMA 内容（`---BEGIN PROMPT---` 到 `---END PROMPT---` 之间的内容）
- `rawOutput` - Architect 的原始输出

**关键实现**：
```javascript
export async function generateVisualSchema({ formattedPrompt, mermaid, modelRuntime }) {
  // 构建用户提示词
  let userPrompt = formattedPrompt;
  if (mermaid && mermaid.trim()) {
    userPrompt = `${formattedPrompt}\n\n## Mermaid 图表参考\n以下Mermaid图表可以帮助理解逻辑结构：\n\n\`\`\`mermaid\n${mermaid}\n\`\`\`\n\n请结合上述Mermaid图表和用户输入，生成VISUAL SCHEMA。`;
  }
  
  // 解析模型配置
  const resolvedModel = getArchitectModelConfig(modelRuntime);
  
  // 调用 AI 模型生成 VISUAL SCHEMA
  const response = await generateText({
    model: resolvedModel.model,
    system: ARCHITECT_SYSTEM_MESSAGE,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0.1,
  });
  
  // 提取 VISUAL SCHEMA
  const visualSchema = extractVisualSchema(response.text);
  
  return { visualSchema, rawOutput: response.text };
}
```

**模型配置优先级**：
1. 环境变量配置（`ARCHITECT_MODEL_ID`、`ARCHITECT_MODEL_BASE_URL`、`ARCHITECT_MODEL_API_KEY`）
2. 传入的 `modelRuntime` 参数
3. 系统模型（如果启用）

### 11.2 Renderer Agent（agents/renderer.js）

**功能**：将 VISUAL SCHEMA 转换为 Draw.io XML 代码

**核心函数**：`generateXml`

**输入参数**：
- `visualSchema` - VISUAL SCHEMA 内容
- `modelRuntime` - 模型运行时配置（可选）

**输出**：
- `xml` - Draw.io XML 代码

**关键实现**：
```javascript
export async function generateXml({ visualSchema, modelRuntime }) {
  // 解析模型配置
  const resolvedModel = getRendererModelConfig(modelRuntime);
  
  // 调用 AI 模型生成 XML
  const response = await generateText({
    model: resolvedModel.model,
    system: RENDERER_SYSTEM_MESSAGE,
    messages: [{ role: "user", content: visualSchema }],
    temperature: 0.1,
  });
  
  // 提取 XML 代码
  const xml = extractXml(response.text);
  
  // 检测并拒绝图像数据
  if (xml.includes('data:image/') || xml.includes('base64')) {
    throw new Error('Renderer 返回了图像数据而不是 XML 代码。请确保模型输出的是 Draw.io XML 代码。');
  }
  
  return { xml };
}
```

**XML 提取逻辑**：
1. 尝试从代码块中提取（`\`\`\`xml ... \`\`\``）
2. 尝试提取 `<root>...</root>` 块
3. 尝试提取 `<mxfile>...</mxfile>` 块
4. 如果都找不到，返回原始输出

**模型配置优先级**：
1. 环境变量配置（`RENDERER_MODEL_ID`、`RENDERER_MODEL_BASE_URL`、`RENDERER_MODEL_API_KEY`）
2. 传入的 `modelRuntime` 参数
3. 系统模型（如果启用）

### 11.3 Mermaid 生成器（agents/mermaid-generator.js）

**功能**：根据用户输入生成 Mermaid 图表代码

**核心函数**：`generateMermaid`

**输入参数**：
- `userInput` - 用户输入的原始内容或格式化后的提示词
- `modelRuntime` - 模型运行时配置（可选）

**输出**：
- `mermaid` - Mermaid 图表代码

**关键实现**：
```javascript
export async function generateMermaid({ userInput, modelRuntime }) {
  // 解析模型配置
  const resolvedModel = getMermaidModelConfig(modelRuntime);
  
  // 调用 AI 模型生成 Mermaid 代码
  const response = await generateText({
    model: resolvedModel.model,
    system: MERMAID_GENERATOR_SYSTEM_MESSAGE,
    messages: [{ role: "user", content: userInput }],
    temperature: 0.3,
  });
  
  // 从代码块中提取 Mermaid 代码
  const mermaidMatch = response.text.match(/```mermaid\s*([\s\S]*?)\s*```/i);
  const mermaid = mermaidMatch ? mermaidMatch[1].trim() : "";
  
  return { mermaid };
}
```

**模型配置优先级**：
1. 传入的 `modelRuntime` 参数
2. 系统模型（如果启用）

### 11.4 提示词格式化 Agent（agents/prompt-formatter.js）

**功能**：将用户输入格式化为规范的 Markdown 格式

**核心函数**：`formatPrompt`

**输入参数**：
- `userInput` - 用户输入的原始内容
- `currentXml` - 当前画布的 XML（可选）
- `modelRuntime` - 模型运行时配置（可选）

**输出**：
- `formattedPrompt` - 格式化后的用户提示词

**关键实现**：
```javascript
export async function formatPrompt({ userInput, currentXml, modelRuntime }) {
  // 构建用户提示词
  let userPrompt = userInput;
  if (currentXml && currentXml.trim()) {
    userPrompt = `${userInput}\n\n## 当前画布状态\n当前画布已有内容，请在现有基础上进行修改或扩展。`;
  }
  
  // 解析模型配置
  const resolvedModel = getFormatterModelConfig(modelRuntime);
  
  // 调用 AI 模型进行格式化
  const response = await generateText({
    model: resolvedModel.model,
    system: PROMPT_FORMATTER_SYSTEM_MESSAGE,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0.1,
  });
  
  return { formattedPrompt: response.text };
}
```

### 11.5 工作流编排（agents/workflow.js）

**功能**：协调整个 Architect Workflow 的执行流程

**核心函数**：`executeWorkflow`

**输入参数**：
- `userInput` - 用户输入的原始内容
- `currentXml` - 当前画布的 XML（可选）
- `modelRuntime` - 默认模型运行时配置（可选）
- `architectModel` - Architect 模型配置（可选，覆盖默认配置）
- `rendererModel` - Renderer 模型配置（可选，覆盖默认配置）

**输出**：
- `xml` - 生成的 Draw.io XML 代码
- `formattedPrompt` - 格式化后的用户提示词
- `mermaid` - 生成的 Mermaid 代码
- `visualSchema` - 生成的 VISUAL SCHEMA
- `metadata` - 工作流执行元数据

**工作流步骤**：
1. 提示词格式化（`formatPrompt`）
2. Mermaid 生成（`generateMermaid`，失败时继续）
3. The Architect 生成 VISUAL SCHEMA（`generateVisualSchema`）
4. The Renderer 生成 XML（`generateXml`）

**错误处理**：
- Mermaid 生成失败：记录警告，继续执行（使用空的 Mermaid）
- Architect 失败：抛出错误，回退到原有的聊天逻辑
- Renderer 失败：抛出错误，回退到原有的聊天逻辑

### 11.6 类型定义（types/index.js）

**类型定义**：
- `WorkflowInput` - 工作流输入类型
- `WorkflowOutput` - 工作流输出类型
- `VisualSchema` - VISUAL SCHEMA 类型
- `ArchitectWorkflowConfig` - Architect Workflow 配置类型

---

### 15.8 超时设置实现

### 10.1 概述

Figsci 实现了智能的超时检测机制，用于检测图表生成是否超时，并在超时时提示用户。

### 10.2 超时时间配置

#### 当前设置

最终值：5分钟（300秒）

配置位置：`components/chat-message-display-optimized.tsx`

```javascript
// 智能图表生成超时检测时间（毫秒）- 5分钟
const DIAGRAM_GENERATION_TIMEOUT_MS = 300000;

// 超时检测机制（5分钟）
useEffect(() => {
    // ...
    const timer = setTimeout(() => {
        const elapsed = Date.now() - (streamingStartTimeRef.current || 0);
        if (elapsed >= DIAGRAM_GENERATION_TIMEOUT_MS && localState === "input-streaming") {
            // 5分钟后仍在 streaming 状态，显示超时提示
            setShowTimeoutHint(true);
        }
    }, DIAGRAM_GENERATION_TIMEOUT_MS);
    // ...
}, [localState]);
```

### 10.3 超时时间调整历史

1. 初始值：30秒
2. 第一次调整：60秒（用户反馈30秒太短）
3. 最终值：5分钟（300秒）

### 10.4 设置原因

#### 为什么选择 5 分钟？

- 30秒/60秒都太短：
  - 复杂图表生成可能需要较长时间
  - 某些大模型（如 Claude-3.5）响应较慢
  - 网络波动时容易误触发

- 5分钟更合理：
  - 给予模型充足的响应时间
  - 几乎不会误触发超时提示
  - 仍然能在真正异常时提供保护
  - 用户体验更友好

### 10.5 建议的超时时间

根据实际使用场景：

| 网络状况 | 模型类型 | 建议超时时间 |
|---------|---------|------------|
| 快速网络 | 轻量模型（GPT-4o-mini） | 30-45秒 |
| 正常网络 | 标准模型（GPT-4o） | 5分钟 ⭐ |
| 慢速网络 | 大型模型（Claude-3.5） | 90-120秒 |

当前配置：5分钟 - 适用于大多数场景

### 10.6 用户体验改进

#### 调整前（30秒）
```
0s ────────────── 30s ────────────── 60s
│                  │                  │
生成中             超时提示❌          可能还在正常生成
                   (误触发)
```

#### 调整后（5分钟）
```
0s ────────────── 30s ────────────── 60s ────────────── 90s
│                  │                  │                  │
生成中             正常生成中          正常生成中          超时提示✅
                                                      (合理触发)
```

---

### 15.9 Draw.io XML 格式指南

### 11.1 基本结构

一个 draw.io XML 文件具有以下层次结构：

```xml
<mxfile>
  <diagram>
    <mxGraphModel>
      <root>
        <mxCell /> <!-- 组成图表的单元格 -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### 11.2 根元素：`<mxfile>`

Draw.io 文件的根元素。

属性：
- `host`: 创建文件的应用程序（例如 "app.diagrams.net"）
- `modified`: 最后修改时间戳
- `agent`: 浏览器/用户代理信息
- `version`: 应用程序版本
- `type`: 文件类型（通常是 "device" 或 "google"）

示例：
```xml
<mxfile host="app.diagrams.net" modified="2023-07-14T10:20:30.123Z" 
        agent="Mozilla/5.0" version="21.5.2" type="device">
```

### 11.3 图表元素：`<diagram>`

Draw.io 文档中的每个页面由一个 `<diagram>` 元素表示。

属性：
- `id`: 图表的唯一标识符
- `name`: 图表/页面名称

示例：
```xml
<diagram id="pWHN0msd4Ud1ZK5cD-Hr" name="Page-1">
```

### 11.4 图形模型：`<mxGraphModel>`

包含实际的图表数据。

关键属性：
- `dx`, `dy`: 网格大小（通常为 1）
- `grid`: 是否启用网格（0 或 1）
- `gridSize`: 网格单元格大小（通常为 10）
- `pageWidth`, `pageHeight`: 页面宽度和高度（例如 850, 1100）
- `pageScale`: 页面缩放（通常为 1）

### 11.5 根单元格容器：`<root>`

包含图表中的所有单元格。

示例：
```xml
<root>
  <mxCell id="0"/>
  <mxCell id="1" parent="0"/>
  <!-- 其他单元格 -->
</root>
```

### 11.6 单元格元素：`<mxCell>`

图表的基本构建块。单元格表示形状、连接器、文本等。

所有单元格的通用属性：
- `id`: 单元格的唯一标识符
- `parent`: 父单元格的 ID（大多数单元格的父元素通常是 "1"）
- `value`: 单元格的文本内容
- `style`: 样式信息

形状（顶点）的属性：
- `vertex`: 设置为 "1" 表示形状
- `connectable`: 形状是否可连接（0 或 1）

连接器（边）的属性：
- `edge`: 设置为 "1" 表示连接器
- `source`: 源单元格的 ID
- `target`: 目标单元格的 ID

示例（矩形形状）：
```xml
<mxCell id="2" value="Hello World" style="rounded=0;whiteSpace=wrap;html=1;" 
        vertex="1" parent="1">
  <mxGeometry x="350" y="190" width="120" height="60" as="geometry"/>
</mxCell>
```

示例（连接器）：
```xml
<mxCell id="3" value="" style="endArrow=classic;html=1;rounded=0;" 
        edge="1" parent="1" source="2" target="4">
  <mxGeometry width="50" height="50" relative="1" as="geometry">
    <mxPoint x="400" y="430" as="sourcePoint"/>
    <mxPoint x="450" y="380" as="targetPoint"/>
  </mxGeometry>
</mxCell>
```

### 11.7 几何：`<mxGeometry>`

定义单元格的位置和尺寸。

形状的属性：
- `x`: 形状左上角点的 x 坐标
- `y`: 形状左上角点的 y 坐标
- `width`: 形状的宽度
- `height`: 形状的高度
- `as`: 指定此几何在其父单元格中的角色，通常设置为 `"geometry"`

连接器的属性：
- `relative`: 设置为 "1" 表示相对几何
- `as`: 设置为 "geometry"

### 11.8 单元格样式参考

样式在 `<mxCell>` 元素的 `style` 属性中指定，为分号分隔的 `key=value` 对。

#### 形状特定样式

- Rectangle: `shape=rectangle`
- Ellipse: `shape=ellipse`
- Triangle: `shape=triangle`
- Rhombus: `shape=rhombus`
- Hexagon: `shape=hexagon`
- Cloud: `shape=cloud`
- Actor: `shape=actor`
- Cylinder: `shape=cylinder`
- Document: `shape=document`
- Note: `shape=note`
- Card: `shape=card`
- Parallelogram: `shape=parallelogram`

#### 连接器样式

- `endArrow=classic`: 末端的箭头类型（classic, open, oval, diamond, block）
- `startArrow=none`: 起始端的箭头类型（none, classic, open, oval, diamond）
- `curved=1`: 弯曲连接器（0 或 1）
- `edgeStyle=orthogonalEdgeStyle`: 连接器路由样式
- `elbow=vertical`: 弯头方向（vertical, horizontal）
- `jumpStyle=arc`: 线条交叉的跳跃样式（arc, gap）
- `jumpSize=10`: 跳跃大小

### 11.9 特殊单元格

Draw.io 文件包含两个始终存在的特殊单元格：

1. 根单元格 (id = "0")：所有单元格的父元素
2. 默认父单元格 (id = "1", parent = "0")：大多数单元格的默认图层和父元素

### 11.10 常见模式

#### 分组元素

要对元素进行分组，创建一个父单元格并将其他单元格的 `parent` 属性设置为其 ID：

```xml
<!-- 分组容器 -->
<mxCell id="10" value="Group" style="group" vertex="1" connectable="0" parent="1">
  <mxGeometry x="200" y="200" width="200" height="100" as="geometry" />
</mxCell>
<!-- 分组内的元素 -->
<mxCell id="11" value="Element 1" style="rounded=0;whiteSpace=wrap;html=1;" 
        vertex="1" parent="10">
  <mxGeometry width="90" height="40" as="geometry" />
</mxCell>
```

#### 泳道（Swimlanes）

泳道使用 `swimlane` 形状样式：

```xml
<mxCell id="20" value="Swimlane 1" 
        style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=30;..." 
        vertex="1" parent="1">
  <mxGeometry x="200" y="200" width="140" height="120" as="geometry" />
</mxCell>
```

### 11.11 手动创建 Draw.io XML 的技巧

1. 从基本结构开始（`mxfile`, `diagram`, `mxGraphModel`, `root`）
2. 始终包含两个特殊单元格（id = "0" 和 id = "1"）
3. 为所有单元格分配唯一且连续的 ID
4. 正确定义父关系
5. 使用 `mxGeometry` 元素定位形状
6. 对于连接器，指定 `source` 和 `target` 属性

---

## 总结

本文档详细记录了 Figsci 项目的所有核心功能实现细节，包括：

1. ✅ 画布系统：支持 Draw.io 和 SVG 两种渲染模式
2. ✅ 图表历史：完整的版本管理和恢复功能
3. ✅ DrawIO 降级：自动故障转移机制
4. ✅ 光子扣费：三种扣费模式的完整实现
5. ✅ 扣费显示：用户界面和后台日志
6. ✅ 流式响应：流式与非流式两种响应模式
7. ✅ Architect Workflow：两阶段智能体工作流（Architect + Renderer）
8. ✅ 保存功能：多层次的数据持久化
9. ✅ 超时设置：智能超时检测
10. ✅ XML 指南：Draw.io XML 格式参考

所有功能都经过精心设计和实现，确保了系统的稳定性、可维护性和用户体验。

---

文档版本：1.2.0  
最后更新：2025-01-24  
维护者：Figsci Team

