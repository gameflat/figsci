# Figsci 项目实现细节文档

本文档详细记录了 Figsci 项目的核心功能实现细节，包括画布系统、扣费功能、响应处理、模型对比等所有关键功能的实现原理和技术细节。

## 📑 目录

1. [画布（Canvas）实现细节](#1-画布canvas实现细节)
2. [图表历史功能实现](#2-图表历史功能实现)
3. [DrawIO 自动降级功能](#3-drawio-自动降级功能)
4. [光子扣费功能实现](#4-光子扣费功能实现)
5. [扣费显示功能实现](#5-扣费显示功能实现)
6. [流式与非流式响应](#6-流式与非流式响应)
7. [多模型对比功能](#7-多模型对比功能)
8. [保存功能实现](#8-保存功能实现)
9. [模板匹配功能](#9-模板匹配功能)
10. [超时设置](#10-超时设置)
11. [Draw.io XML 指南](#11-drawio-xml-指南)

---

## 1. 画布（Canvas）实现细节

### 1.1 概述

Figsci 项目的画布系统支持两种渲染模式：
- **Draw.io 模式**：基于 `react-drawio` 库嵌入 Draw.io 编辑器
- **SVG 模式**：自定义实现的 SVG 编辑器，支持基础的图形绘制和编辑

画布位于页面右侧（从用户视角看），占据主内容区域，与左侧的聊天面板通过可调整的分隔条分隔。

### 1.2 架构设计

#### 整体架构

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

#### 核心组件关系

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

### 1.3 渲染模式

#### Draw.io 模式

**实现位置**：
- **主组件**: `app/page.jsx` (第 513-524 行)
- **状态管理**: `contexts/diagram-context.jsx`

**核心实现**：

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

**关键特性**：

1. **嵌入方式**
   - 使用 `react-drawio` 库的 `DrawIoEmbed` 组件
   - 通过 `baseUrl` 指定 Draw.io 编辑器地址（默认：`https://embed.diagrams.net`）
   - 通过 `ref` 获取 Draw.io 实例引用，用于调用 API

2. **加载机制**
   - 监听 `onLoad` 事件，编辑器加载完成后设置 `drawioReadyRef.current = true`
   - 支持从 Context 中恢复画布内容（`hydrateDiagramFromContext`）
   - 15 秒超时检测，超时后显示错误提示

3. **错误处理**
   - 使用 `useDrawioDiagnostics` Hook 监控运行时错误
   - 捕获加载失败和运行时错误，显示友好的错误提示
   - 支持降级到备用 URL（通过 `use-drawio-fallback` Hook）

4. **数据格式**
   - 使用 Draw.io 的 XML 格式（`.mxfile`）
   - XML 结构：`<mxfile>` → `<diagram>` → `<mxGraphModel>` → `<root>` → `<mxCell>`

#### SVG 模式

**实现位置**：
- **主组件**: `components/svg-studio.jsx`
- **状态管理**: `contexts/svg-editor-context.jsx`

**核心实现**：

```javascript
// app/page.jsx
<div className="flex h-full w-full rounded-xl border border-slate-200 bg-white/90">
  <SvgStudio />
</div>
```

**关键特性**：

1. **SVG 画布渲染**
   - 支持网格背景、缩放、平移
   - 变换组支持缩放和平移操作
   - 根据元素类型渲染不同的 SVG 元素

2. **支持的元素类型**
   - **矩形** (`rect`): 支持位置、大小、圆角、填充、描边
   - **椭圆** (`ellipse`): 支持中心点、半径、填充、描边
   - **线条** (`line`): 支持起点、终点、连接点吸附
   - **路径** (`path`): 支持自定义路径数据
   - **文本** (`text`): 支持文本内容、字体大小、位置

3. **交互功能**
   - **选择工具**: 点击选择、框选（Marquee Selection）
   - **绘制工具**: 矩形、椭圆、线条、文本
   - **编辑工具**: 拖拽移动、调整大小、旋转
   - **对齐工具**: 左对齐、居中、右对齐、顶部、底部
   - **吸附功能**: 网格吸附、锚点吸附

4. **视图控制**
   - **缩放**: 支持 0.2x - 8x 缩放，鼠标滚轮 + Ctrl/Cmd 缩放
   - **平移**: 空格键 + 拖拽，或鼠标滚轮平移
   - **网格**: 可切换显示/隐藏，支持网格吸附

### 1.4 状态管理

#### Draw.io 模式状态管理

**DiagramContext** (`contexts/diagram-context.jsx`)

**状态定义**:
```javascript
const [chartXML, setChartXML] = useState("");           // 当前画布 XML
const [latestSvg, setLatestSvg] = useState("");          // 最新导出的 SVG
const [diagramHistory, setDiagramHistory] = useState([]); // 历史记录
const [activeVersionIndex, setActiveVersionIndex] = useState(-1); // 当前版本索引
const [runtimeError, setRuntimeError] = useState(null);   // 运行时错误
const drawioRef = useRef(null);                          // Draw.io 实例引用
```

**核心方法**:

1. **`loadDiagram(chart)`**
   - 功能: 加载 XML 到 Draw.io 画布
   - 实现: 使用 150ms 防抖，避免频繁加载
   - 位置: `contexts/diagram-context.jsx` (第 77-98 行)

2. **`handleDiagramExport(data)`**
   - 功能: 处理 Draw.io 导出的数据
   - 实现: 提取 XML，更新状态，保存历史记录
   - 位置: `contexts/diagram-context.jsx` (第 100-141 行)

3. **`fetchDiagramXml(options)`**
   - 功能: 异步获取当前画布的 XML
   - 实现: 触发导出，通过 Promise 返回结果
   - 位置: `contexts/diagram-context.jsx` (第 162-194 行)

#### SVG 模式状态管理

**SvgEditorContext** (`contexts/svg-editor-context.jsx`)

**状态定义**:
```javascript
const [doc, setDoc] = useState({ width: 1200, height: 800 }); // 画布尺寸
const [elements, setElements] = useState([]);                  // 元素列表
const [tool, setTool] = useState("select");                    // 当前工具
const [selectedId, setSelectedId] = useState(null);            // 选中的元素 ID
const [selectedIds, setSelectedIds] = useState(new Set());     // 多选元素 ID 集合
const [history, setHistory] = useState([]);                   // 历史记录（用于恢复）
const [activeHistoryIndex, setActiveHistoryIndex] = useState(-1); // 当前历史版本索引
const [past, setPast] = useState([]);                        // 撤销栈（最多 50 个快照）
const [future, setFuture] = useState([]);                    // 重做栈（最多 50 个快照）
```

### 1.5 画布更新机制

#### XML 处理流程

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

#### 更新模式

1. **替换模式** (`replaceRootXml`)
   - 使用场景: `display_diagram` 工具调用（完全替换画布）、初始化新图表
   - 实现: 保持 `<mxfile>` 和 `<diagram>` 结构，只替换 `<mxGraphModel>` 内的 `<root>`

2. **合并模式** (`mergeRootXml`)
   - 使用场景: 编辑操作（添加、修改元素）、增量更新
   - 实现: 合并新旧 XML，保留现有元素

#### 防抖机制

**目的**: 避免频繁更新导致性能问题

**实现**:
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

### 1.6 性能优化

1. **防抖加载**: 150ms 防抖，避免频繁调用 `drawioRef.current.load()`
2. **RequestAnimationFrame 优化**: 拖拽操作使用 RAF 批量更新
3. **条件渲染**: 聊天面板隐藏时，通过 CSS 控制可见性，而不是卸载组件
4. **历史记录优化**: 检查是否为空图表，避免保存空白历史；检查是否与上一个版本相同，避免保存重复历史
5. **元素引用缓存**: 使用 `elementRefs.current` 缓存 DOM 引用，避免频繁查询

### 1.7 关键代码位置

- **主页面**: `app/page.jsx`
- **Draw.io 状态管理**: `contexts/diagram-context.jsx`
- **SVG 编辑器**: `components/svg-studio.jsx`
- **画布编排器**: `features/chat-panel/hooks/use-diagram-orchestrator.js`
- **XML 工具函数**: `lib/utils.js`

---

## 2. 图表历史功能实现

### 2.1 概述

图表历史功能允许用户查看和恢复每次 AI 修改前的图表版本。该功能支持两种渲染模式：
- **Draw.io 模式**：使用 Draw.io XML 格式的图表
- **SVG 模式**：使用 SVG 格式的图表

### 2.2 用户操作流程

1. 用户点击聊天输入框中的"查看图表变更记录"按钮（历史图标）
2. 打开"图表历史"对话框，显示所有保存的图表版本缩略图
3. 用户点击任意缩略图即可恢复对应的图表版本
4. 对话框自动关闭，图表恢复到选中的版本

### 2.3 核心组件

#### 触发按钮组件

**文件位置**：`components/chat-input-optimized.jsx`

**关键代码**：
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

**文件位置**：`components/history-dialog.jsx`

**功能说明**：
- 使用 Radix UI 的 `Dialog` 组件
- 支持两种数据源：通过 `items` prop 传入（用于 SVG 模式）或从 `useDiagram()` hook 获取（用于 Draw.io 模式）
- 使用 Next.js 的 `Image` 组件显示缩略图
- 点击缩略图时调用恢复函数并关闭对话框

### 2.4 状态管理

#### Draw.io 模式历史管理

**文件位置**：`contexts/diagram-context.jsx`

**历史记录数据结构**：
```javascript
/**
 * @typedef {{svg: string, xml: string}} DiagramHistoryEntry
 */
```

每个历史记录项包含：
- `svg`：图表的 SVG 格式（用于显示缩略图）
- `xml`：图表的 Draw.io XML 格式（用于恢复图表）

**保存历史记录**：
历史记录在 `handleDiagramExport` 函数中保存，包含以下逻辑：
1. 检查是否是空白图表（避免保存空画布）
2. 检查是否与上一个版本重复（避免保存相同版本）
3. 只有在非空且非重复的情况下才保存

**恢复历史记录**：
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

**文件位置**：`contexts/svg-editor-context.jsx`

**历史记录数据结构**：
- `svg`：SVG 标记字符串
- `dataUrl`：SVG 转换为 Data URL（用于显示缩略图）
- `timestamp`：时间戳

### 2.5 历史记录保存时机

#### Draw.io 模式

1. **AI 生成图表后**（`display_diagram` 工具调用）：延迟 500ms 后异步保存，确保图表已加载
2. **AI 生成 SVG 后转换为 Draw.io**（`display_svg` 工具调用，非 SVG 模式）：同样延迟 500ms 后保存

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

## 3. DrawIO 自动降级功能

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

**核心特性**：
- ✅ 自动超时检测（默认 15 秒）
- ✅ 自动切换到备用 URL
- ✅ 手动重试主 URL
- ✅ 降级事件回调
- ✅ 可禁用自动降级
- ✅ 完整的 TypeScript 类型支持

#### 页面集成

**文件位置**: `app/page.jsx`

**主要改动**：

1. **导入新 Hook**
   ```typescript
   import { useDrawioFallback } from "@/hooks/use-drawio-fallback";
   ```

2. **使用降级逻辑**
   ```typescript
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

3. **与诊断系统集成**
   ```typescript
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

## 4. 光子扣费功能实现

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

1. **用户发送请求**
   - 用户在聊天界面发送消息
   - 请求发送到 `/api/chat`

2. **AI 模型生成内容**
   - 聊天 API 调用 AI 模型
   - 模型生成图表内容
   - 记录 token 使用量

3. **自动触发扣费**
   - 在 `onFinish` 回调中调用 `chargePhotonIfEnabled()`
   - 检查是否启用扣费功能
   - 获取用户 AK（从 Cookie 或使用开发者 AK）

4. **调用扣费 API**
   - 计算扣费金额（根据配置的模式）
   - 生成唯一的 `bizNo`
   - 调用玻尔平台扣费接口

5. **处理扣费结果**
   - 成功：记录日志
   - 失败：记录错误，但不影响主流程

### 4.5 扣费规则

#### 固定扣费模式

每次 AI **成功**生成请求扣除固定数量的光子，任务中断或异常时不收费。

**配置**：
```env
BOHRIUM_CHARGE_MODE=fixed
BOHRIUM_CHARGE_PER_REQUEST=1  # 每次成功请求扣除 1 光子
```

**扣费逻辑**：
- ✅ 任务成功完成（finishReason 为 'stop' 或 'tool-calls'）：收取固定费用
- ❌ 任务中断/异常/网络错误：不收费

#### Token 扣费模式

根据实际消耗的 token 数量扣费，**无论任务是否成功完成都会收费**。

**配置**：
```env
BOHRIUM_CHARGE_MODE=token
BOHRIUM_CHARGE_PER_1K_TOKEN=1  # 每 1000 个 token 扣除 1 光子
```

**计费公式**：
```
扣费金额 = ceil((总 token 数 / 1000) × 每千 token 费用)
```

#### 混合扣费模式（推荐）

同时使用固定扣费和按量扣费，固定费用仅在任务成功完成时收取，token 费用无论任务是否完成都会收取。

**配置**：
```env
BOHRIUM_CHARGE_MODE=mixed
BOHRIUM_CHARGE_PER_REQUEST=1   # 每次成功请求额外扣除 1 光子
BOHRIUM_CHARGE_PER_1K_TOKEN=1  # 每 1000 个 token 扣除 1 光子
```

**计费公式**：
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

## 5. 扣费显示功能实现

### 5.1 概述

扣费显示功能为用户和开发者提供了清晰的扣费信息反馈：
1. **用户界面**：在每条 AI 回复消息下方显示 Token 使用量和扣费金额
2. **后台日志**：在服务端控制台输出详细的扣费过程和结果

### 5.2 用户界面显示

#### Token 使用量和扣费信息卡片

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

#### 显示样式

**紧凑模式（默认）**：
```
[⚡ 1,234 tokens] [🕐 2.5s] [💰 -3 光子]
```

**扣费状态指示**：
- ✅ **成功扣费**：绿色显示，显示扣除的光子数
- ❌ **扣费失败**：红色显示，提示失败原因
- ⚠️ **余额不足**：红色显示，提示余额不足

### 5.3 核心组件

#### TokenUsageDisplay 组件

**文件位置**: `components/token-usage-display.jsx`

**功能**：
- 显示 Token 使用量统计
- 显示生成耗时
- 显示扣费信息
- 支持紧凑模式和详细模式

**扣费信息显示代码**：
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

**文件位置**: `components/photon-charge-notice.jsx`

**功能**：在聊天界面显示扣费提示，告知用户扣费规则

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

**扣费请求日志**：
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

**扣费成功日志**：
```
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
【光子扣费】扣费成功
------------------------------------------------------------
业务编号: 1702345678901234
扣费金额: 3 光子
扣费模式: 混合扣费
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
```

**扣费失败日志**：
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

---

## 6. 流式与非流式响应

### 6.1 概述

Figsci 支持两种 AI 响应模式：
- **流式（Streaming）**：实时逐字输出，用户体验更流畅
- **非流式（Non-Streaming）**：等待完整响应后一次性显示

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

**文件位置**: `app/api/chat/route.js`

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

**文件位置**: `components/chat-panel-optimized.jsx`

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
✅ **实时对话** - 聊天、问答等交互式场景  
✅ **长文本生成** - 文章、报告等，让用户看到实时进展  
✅ **图表生成** - 流式输出 XML，用户可以看到图表逐步构建  
✅ **用户体验优先** - 减少等待感，提供即时反馈  

#### 非流式模式适用场景
✅ **批量处理** - 后台任务，不需要实时反馈  
✅ **稳定性要求高** - 某些场景需要完整响应才能处理  
✅ **工具调用场景** - 复杂的多步骤工具调用，需要等待完整结果  
✅ **API 兼容性** - 某些 LLM 提供商可能不支持流式  

### 6.6 注意事项

1. **不要手动编码流式数据格式**：使用 AI SDK 提供的标准方法
2. **工具调用处理**：无论流式还是非流式，工具调用都在客户端的 `onToolCall` 回调中处理
3. **状态管理**：`useChat` 的 `status` 状态在两种模式下都正确工作

---

## 7. 多模型对比功能

### 7.1 概述

Figsci 支持同时配置最多 5 个来自不同 LLM API 服务商的大模型进行对比。当用户触发对比请求时，系统会将同一条提示词同步发送给所有配置的模型，并展示各个模型的生成结果，方便用户对比不同模型的效果。

### 7.2 整体流程

```
用户配置模型 → 触发对比请求 → 并行调用多个模型 → 收集结果 → 展示对比结果 → 用户选择应用
```

### 7.3 详细处理逻辑

#### 模型配置阶段

**文件位置**: `components/model-comparison-config-dialog.jsx`

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

#### 对比请求处理阶段

**文件位置**: `features/chat-panel/hooks/use-comparison-workbench.js`

**主要函数：`handleCompareRequest`**

**处理流程**：

1. **前置检查**
   - 检查是否正在流式生成
   - 检查是否已有对比任务在执行
   - 检查输入是否为空
   - 检查分支选择是否已确定

2. **模型解析**
   - 从配置中解析模型选项
   - 如果配置为空，使用当前选中的模型作为后备
   - 如果少于 2 个模型，复制第一个模型

3. **模型元数据构建**
   - 区分系统模型和自定义模型
   - 系统模型：只传递标志，服务端从环境变量获取配置
   - 自定义模型：传递完整的 runtime 配置

4. **创建对比条目**
   - 创建对比请求记录
   - 包含提示词、模型列表、锚点消息 ID

5. **发送 API 请求**
   - 构建请求体，包含模型配置、提示词、画布 XML、附件等
   - 发送到 `/api/model-compare`
   - 支持取消请求（AbortSignal）

6. **结果处理**
   - 规范化结果格式
   - 为每个结果创建分支
   - 更新对比条目状态

#### API 处理阶段

**文件位置**: `app/api/model-compare/route.js`

**关键实现**：

**并行调用多个模型**：
```javascript
const results = await Promise.all(
  normalizedModels.map(async (model) => {
    const startTime = Date.now();
    try {
      // 解析模型配置
      let resolved;
      if (model.isSystemModel) {
        resolved = resolveSystemModel(model.id);
      } else {
        resolved = resolveChatModel(model.runtime);
      }
      
      // 调用模型生成图表（非流式）
      const response = await generateText({
        model: resolved.model,
        system: mode === "svg" 
          ? MODEL_COMPARE_SYSTEM_PROMPT_SVG 
          : MODEL_COMPARE_SYSTEM_PROMPT_XML,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.1,
        abortSignal
      });
      
      // 解析 JSON 结果
      const payload = extractJsonPayload(response.text, mode);
      
      // 生成预览图（drawio 模式）
      const preview = payload.xml 
        ? await exportDiagramPreview(payload.xml) 
        : {};
      
      return {
        id: resolved.id,
        label: model.label ?? resolved.label,
        status: "ok",
        summary: payload.summary,
        xml: payload.xml,
        svg: payload.svg,
        previewImage: preview.image,
        usage: response.usage,
        durationMs: Date.now() - startTime
      };
    } catch (error) {
      // 错误处理：返回错误结果但不抛出异常
      return {
        id: model.id,
        status: "error",
        error: error.message,
        durationMs: Date.now() - startTime
      };
    }
  })
);

return Response.json({ results });
```

**关键设计点**：
- ✅ **并行处理**：使用 `Promise.all` 同时调用所有模型，提高效率
- ✅ **错误隔离**：单个模型失败不影响其他模型的结果
- ✅ **统一格式**：所有结果统一格式，便于前端处理
- ✅ **支持取消**：通过 `AbortSignal` 支持请求取消

### 7.4 结果展示

#### 对比结果渲染

**文件位置**: `components/chat-message-display-optimized.jsx`

**展示方式**：
- **2 个结果**：并排展示
- **超过 2 个结果**：横向滑动展示（每个卡片宽度 360px）

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

#### 分支管理

为每个结果创建独立分支，用户可以在不同结果之间切换，每个结果都有独立的对话历史。

### 7.5 错误处理

#### 单个模型失败
- ✅ **不影响其他模型**：使用 `Promise.all` 时，单个模型失败不会阻止其他模型继续执行
- ✅ **返回错误结果**：失败的模型会返回 `status: "error"` 的结果
- ✅ **前端展示错误**：错误结果会以红色背景展示，显示错误消息

#### 所有模型失败
- ✅ **显示错误提示**：前端会显示 "两个模型均未返回有效结果，请检查提示词或模型设置。"
- ✅ **不要求分支决策**：如果所有模型都失败，不会要求用户选择分支

---

## 8. 保存功能实现

### 8.1 概述

Figsci 项目实现了多层次的保存功能，涵盖了图表数据、用户配置、对话状态、模板使用记录等多个方面。

### 8.2 数据持久化架构

#### 基本原则

Figsci 采用客户端 localStorage 作为主要的数据持久化方案，遵循以下原则：

1. **统一的存储键名规范**：使用 `Figsci` 前缀避免冲突
2. **完善的错误处理**：确保数据读取和写入的安全性
3. **客户端环境检查**：避免在服务端渲染时访问 localStorage
4. **数据验证和规范化**：确保存储数据的完整性

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

**文件位置**: `contexts/diagram-context.jsx`

**主要状态**：
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

**文件位置**: `hooks/use-model-registry.js`

**存储结构**：
```javascript
const STORAGE_KEY = "Figsci.modelRegistry.v1";

const ModelRegistryState = {
    endpoints: [], // 模型端点配置数组
    selectedModelKey: string // 当前选中的模型键
};
```

**持久化保存函数**：
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

**文件位置**: `contexts/locale-context.jsx`

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

**文件位置**: `components/template-gallery.jsx`

**存储键名**：
```javascript
const RECENT_KEY = "Figsci_recent_templates";
```

**最近使用记录更新**：
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

## 9. 模板匹配功能

### 9.1 概述

模板匹配功能支持使用自定义的大模型 API 来匹配用户提示词和图表模板，而不是使用项目默认的 AI SDK。

### 9.2 配置方式

#### 使用环境变量（推荐）

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

### 9.3 API 响应格式要求

自定义 API 必须返回以下格式之一：

#### 格式 1：OpenAI 兼容格式（推荐）
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

#### 格式 2：直接 content 字段
```json
{
  "content": "返回的文本内容"
}
```

#### 格式 3：直接 text 字段
```json
{
  "text": "返回的文本内容"
}
```

#### 格式 4：纯字符串
```
"返回的文本内容"
```

### 9.4 请求格式

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

### 9.5 优先级

系统按以下优先级选择 API：

1. **自定义 API**（如果设置了 `NEXT_PUBLIC_TEMPLATE_MATCH_API_URL` 和 `NEXT_PUBLIC_TEMPLATE_MATCH_API_KEY`）
2. **当前选中的模型**（通过 `modelRuntime` 传递）
3. **系统模型**（如果启用）
4. **降级到关键词匹配**（如果所有 API 都不可用）

### 9.6 验证配置

配置完成后，在浏览器控制台查看日志：

- `🔄 使用自定义 AI API 进行匹配...` - 表示正在使用自定义 API
- `✅ 自定义 AI API 调用成功` - 表示 API 调用成功
- `❌ 自定义 API 调用失败` - 表示 API 调用失败，会降级到关键词匹配

---

## 10. 超时设置

### 10.1 概述

Figsci 实现了智能的超时检测机制，用于检测图表生成是否超时，并在超时时提示用户。

### 10.2 超时时间配置

#### 当前设置

**最终值**：**5分钟**（300秒）

**配置位置**：`components/chat-message-display-optimized.tsx`

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

1. **初始值**：30秒
2. **第一次调整**：60秒（用户反馈30秒太短）
3. **最终值**：**5分钟**（300秒）

### 10.4 设置原因

#### 为什么选择 5 分钟？

- **30秒/60秒都太短**：
  - 复杂图表生成可能需要较长时间
  - 某些大模型（如 Claude-3.5）响应较慢
  - 网络波动时容易误触发

- **5分钟更合理**：
  - 给予模型充足的响应时间
  - 几乎不会误触发超时提示
  - 仍然能在真正异常时提供保护
  - 用户体验更友好

### 10.5 建议的超时时间

根据实际使用场景：

| 网络状况 | 模型类型 | 建议超时时间 |
|---------|---------|------------|
| 快速网络 | 轻量模型（GPT-4o-mini） | 30-45秒 |
| 正常网络 | 标准模型（GPT-4o） | **5分钟** ⭐ |
| 慢速网络 | 大型模型（Claude-3.5） | 90-120秒 |

**当前配置：5分钟** - 适用于大多数场景

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

## 11. Draw.io XML 指南

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

**属性**：
- `host`: 创建文件的应用程序（例如 "app.diagrams.net"）
- `modified`: 最后修改时间戳
- `agent`: 浏览器/用户代理信息
- `version`: 应用程序版本
- `type`: 文件类型（通常是 "device" 或 "google"）

**示例**：
```xml
<mxfile host="app.diagrams.net" modified="2023-07-14T10:20:30.123Z" 
        agent="Mozilla/5.0" version="21.5.2" type="device">
```

### 11.3 图表元素：`<diagram>`

Draw.io 文档中的每个页面由一个 `<diagram>` 元素表示。

**属性**：
- `id`: 图表的唯一标识符
- `name`: 图表/页面名称

**示例**：
```xml
<diagram id="pWHN0msd4Ud1ZK5cD-Hr" name="Page-1">
```

### 11.4 图形模型：`<mxGraphModel>`

包含实际的图表数据。

**关键属性**：
- `dx`, `dy`: 网格大小（通常为 1）
- `grid`: 是否启用网格（0 或 1）
- `gridSize`: 网格单元格大小（通常为 10）
- `pageWidth`, `pageHeight`: 页面宽度和高度（例如 850, 1100）
- `pageScale`: 页面缩放（通常为 1）

### 11.5 根单元格容器：`<root>`

包含图表中的所有单元格。

**示例**：
```xml
<root>
  <mxCell id="0"/>
  <mxCell id="1" parent="0"/>
  <!-- 其他单元格 -->
</root>
```

### 11.6 单元格元素：`<mxCell>`

图表的基本构建块。单元格表示形状、连接器、文本等。

**所有单元格的通用属性**：
- `id`: 单元格的唯一标识符
- `parent`: 父单元格的 ID（大多数单元格的父元素通常是 "1"）
- `value`: 单元格的文本内容
- `style`: 样式信息

**形状（顶点）的属性**：
- `vertex`: 设置为 "1" 表示形状
- `connectable`: 形状是否可连接（0 或 1）

**连接器（边）的属性**：
- `edge`: 设置为 "1" 表示连接器
- `source`: 源单元格的 ID
- `target`: 目标单元格的 ID

**示例（矩形形状）**：
```xml
<mxCell id="2" value="Hello World" style="rounded=0;whiteSpace=wrap;html=1;" 
        vertex="1" parent="1">
  <mxGeometry x="350" y="190" width="120" height="60" as="geometry"/>
</mxCell>
```

**示例（连接器）**：
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

**形状的属性**：
- `x`: 形状**左上角**点的 x 坐标
- `y`: 形状**左上角**点的 y 坐标
- `width`: 形状的宽度
- `height`: 形状的高度
- `as`: 指定此几何在其父单元格中的角色，通常设置为 `"geometry"`

**连接器的属性**：
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

1. **根单元格** (id = "0")：所有单元格的父元素
2. **默认父单元格** (id = "1", parent = "0")：大多数单元格的默认图层和父元素

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

1. ✅ **画布系统**：支持 Draw.io 和 SVG 两种渲染模式
2. ✅ **图表历史**：完整的版本管理和恢复功能
3. ✅ **DrawIO 降级**：自动故障转移机制
4. ✅ **光子扣费**：三种扣费模式的完整实现
5. ✅ **扣费显示**：用户界面和后台日志
6. ✅ **流式响应**：流式与非流式两种响应模式
7. ✅ **模型对比**：多模型并行对比功能
8. ✅ **保存功能**：多层次的数据持久化
9. ✅ **模板匹配**：自定义 API 支持
10. ✅ **超时设置**：智能超时检测
11. ✅ **XML 指南**：Draw.io XML 格式参考

所有功能都经过精心设计和实现，确保了系统的稳定性、可维护性和用户体验。

---

**文档版本**：1.0.0  
**最后更新**：2025-01-19  
**维护者**：Figsci Team

