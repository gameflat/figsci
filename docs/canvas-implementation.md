# 画布（Canvas）实现详细分析

## 目录

1. [概述](#概述)
2. [架构设计](#架构设计)
3. [渲染模式](#渲染模式)
4. [状态管理](#状态管理)
5. [画布更新机制](#画布更新机制)
6. [交互实现](#交互实现)
7. [布局与样式](#布局与样式)
8. [性能优化](#性能优化)
9. [关键代码位置](#关键代码位置)

---

## 概述

Figsci 项目的画布系统支持两种渲染模式：
- **Draw.io 模式**：基于 `react-drawio` 库嵌入 Draw.io 编辑器
- **SVG 模式**：自定义实现的 SVG 编辑器，支持基础的图形绘制和编辑

画布位于页面右侧（从用户视角看），占据主内容区域，与左侧的聊天面板通过可调整的分隔条分隔。

---

## 架构设计

### 整体架构

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

### 核心组件关系

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

---

## 渲染模式

### 1. Draw.io 模式

#### 实现位置
- **主组件**: `app/page.jsx` (第 513-524 行)
- **状态管理**: `contexts/diagram-context.jsx`

#### 核心实现

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

#### 关键特性

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

### 2. SVG 模式

#### 实现位置
- **主组件**: `components/svg-studio.jsx`
- **状态管理**: `contexts/svg-editor-context.jsx`

#### 核心实现

```javascript
// app/page.jsx
<div className="flex h-full w-full rounded-xl border border-slate-200 bg-white/90">
  <SvgStudio />
</div>
```

#### 关键特性

1. **SVG 画布渲染**
   ```javascript
   // components/svg-studio.jsx (第 1359-1590 行)
   <svg
     ref={svgRef}
     className="relative z-10 h-full w-full select-none"
     width="100%"
     height="100%"
     onPointerDown={handleCanvasPointerDown}
     onPointerMove={handleCanvasPointerMove}
     onPointerUp={handleCanvasPointerUp}
   >
     {/* 网格背景 */}
     <defs>
       <pattern id="grid" width={GRID_SIZE * zoom} height={GRID_SIZE * zoom} ...>
         <path d={`M ${GRID_SIZE * zoom} 0 L 0 0 0 ${GRID_SIZE * zoom}`} ... />
       </pattern>
     </defs>
     <rect width="100%" height="100%" fill="url(#grid)" />
     
     {/* 变换组（支持缩放和平移） */}
     <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
       {/* 元素渲染 */}
       {elements.map((element) => {
         // 根据元素类型渲染不同的 SVG 元素
         // rect, ellipse, line, path, text
       })}
     </g>
   </svg>
   ```

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

---

## 状态管理

### Draw.io 模式状态管理

#### DiagramContext (`contexts/diagram-context.jsx`)

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

4. **`clearDiagram()`**
   - 功能: 清空画布
   - 实现: 加载空 XML，清空历史记录

5. **`restoreDiagramAt(index)`**
   - 功能: 恢复到指定历史版本
   - 实现: 从历史记录加载 XML

### SVG 模式状态管理

#### SvgEditorContext (`contexts/svg-editor-context.jsx`)

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
const [defsMarkup, setDefsMarkup] = useState(null);           // SVG defs 标记（渐变、滤镜等）
```

**核心方法**:

1. **`addElement(element)`**
   - 功能: 添加新元素到画布
   - 实现: 自动生成 ID（使用 nanoid），推入历史快照，设置为选中状态
   - 位置: `contexts/svg-editor-context.jsx` (第 580-594 行)

2. **`updateElement(id, updater, options)`**
   - 功能: 更新元素属性
   - 实现: 支持函数式更新，可控制是否记录历史（`options.record`）
   - 位置: `contexts/svg-editor-context.jsx` (第 601-627 行)

3. **`moveElement(id, dx, dy, options)`**
   - 功能: 移动元素
   - 实现: 通过 transform 或直接修改坐标实现移动
   - 位置: `contexts/svg-editor-context.jsx` (第 629-660 行)

4. **`removeElement(id)`**
   - 功能: 删除元素
   - 实现: 从元素列表中移除，清除选中状态

5. **`exportSvgMarkup()`**
   - 功能: 导出完整的 SVG 标记字符串
   - 实现: 包含 `<svg>` 标签、`<defs>`、所有元素
   - 位置: `contexts/svg-editor-context.jsx` (第 662-720 行)

6. **`loadSvgMarkup(markup)`**
   - 功能: 从 SVG 标记加载画布内容
   - 实现: 解析 SVG，提取元素和画布尺寸，推入历史记录
   - 位置: `contexts/svg-editor-context.jsx` (第 722-891 行)

7. **`undo()` / `redo()`**
   - 功能: 撤销/重做操作
   - 实现: 使用 `past` 和 `future` 栈管理历史，最多保存 50 个快照
   - 位置: `contexts/svg-editor-context.jsx` (第 929-951 行)

8. **`commitSnapshot()`**
   - 功能: 手动提交快照到历史记录
   - 实现: 调用 `pushHistorySnapshot()`，用于批量操作前保存状态
   - 位置: `contexts/svg-editor-context.jsx` (第 513-522 行)

**历史记录机制**:
- **撤销/重做栈**: 使用 `past` 和 `future` 两个栈，每个栈最多保存 50 个快照
- **历史记录**: `history` 数组用于持久化历史（如 AI 生成的历史版本）
- **快照结构**: `{ doc, elements, defs }` - 包含画布尺寸、所有元素、defs 标记

---

## 画布更新机制

### XML 处理流程

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

### 更新模式

#### 1. 替换模式 (`replaceRootXml`)

**使用场景**: 
- `display_diagram` 工具调用（完全替换画布）
- 初始化新图表

**实现逻辑**:
```javascript
// lib/utils.js (第 139-168 行)
export function replaceRootXml(baseXml, newRootXml) {
  const normalizedRoot = ensureRootXml(newRootXml);
  
  // 检查是否是完整的 mxfile 格式
  const isFullFormat = baseXml && baseXml.includes('<mxfile>') && baseXml.includes('<diagram');
  
  if (isFullFormat) {
    // 保持 <mxfile> 和 <diagram> 结构，只替换 <mxGraphModel> 内的 <root>
    const mxGraphModelMatch = baseXml.match(/<mxGraphModel[^>]*>[\s\S]*?<\/mxGraphModel>/i);
    if (mxGraphModelMatch) {
      const newMxGraphModel = `${startTag}${normalizedRoot}</mxGraphModel>`;
      return baseXml.replace(/<mxGraphModel[^>]*>[\s\S]*?<\/mxGraphModel>/i, newMxGraphModel);
    }
  }
  
  // 使用 EMPTY_MXFILE 作为基础模板
  // ...
}
```

#### 2. 合并模式 (`mergeRootXml`)

**使用场景**:
- 编辑操作（添加、修改元素）
- 增量更新

**实现逻辑**:
```javascript
// lib/utils.js (第 124-129 行)
export function mergeRootXml(baseXml, newRootXml) {
  if (!baseXml || baseXml.trim().length === 0) {
    return replaceNodes("", newRootXml);
  }
  return replaceNodes(baseXml, newRootXml);
}
```

### 防抖机制

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

---

## 交互实现

### Draw.io 模式交互

#### 1. 画布加载

```javascript
// app/page.jsx (第 176-181 行)
const handleDrawioLoad = () => {
  setIsDrawioLoading(false);
  setDrawioError(null);
  drawioReadyRef.current = true;
  hydrateDiagramFromContext(); // 从 Context 恢复画布内容
};
```

#### 2. 画布导出

```javascript
// contexts/diagram-context.jsx (第 68-74 行)
const handleExport = () => {
  if (drawioRef.current) {
    drawioRef.current.exportDiagram({
      format: "xmlsvg", // 同时导出 XML 和 SVG
    });
  }
};
```

#### 3. 画布内容恢复

```javascript
// app/page.jsx (第 64-76 行)
const hydrateDiagramFromContext = useCallback(() => {
  if (initialDiagramHydratedRef.current) return;
  if (!drawioReadyRef.current) return;
  if (!chartXML || !chartXML.trim()) return;
  loadDiagram(chartXML);
  initialDiagramHydratedRef.current = true;
}, [chartXML, loadDiagram]);
```

### SVG 模式交互

#### 1. 画布指针事件

```javascript
// components/svg-studio.jsx (第 634-707 行)
const handleCanvasPointerDown = (event) => {
  event.preventDefault();
  if (event.button !== 0) return;
  
  if (isSpacePressed) {
    // 空格键 + 拖拽 = 平移画布
    isPanningRef.current = true;
    setIsPanning(true);
    panStartRef.current = { x: event.clientX, y: event.clientY };
    return;
  }
  
  const point = canvasPoint(event); // 转换为画布坐标
  
  if (tool === "select") {
    // 选择工具：框选或点击选择
    // ...
  } else if (tool === "text") {
    // 文本工具：创建文本元素
    // ...
  } else {
    // 绘制工具：开始绘制
    setDraft({ mode: tool, start: point, current: point });
  }
};
```

#### 2. 元素拖拽

```javascript
// components/svg-studio.jsx (第 318-426 行)
useEffect(() => {
  const handleMove = (event) => {
    if (isPanningRef.current) {
      // 平移画布
      // ...
      return;
    }
    
    if (!dragging) return;
    
    // 拖拽元素
    dragLastPointRef.current = canvasPoint(event);
    scheduleDragFrame(); // 使用 RAF 优化性能
  };
  
  const applyDragFrame = () => {
    if (!dragging) return;
    const last = dragLastPointRef.current;
    const applied = dragAppliedPointRef.current;
    if (!last || !applied) return;
    
    const dx = last.x - applied.x;
    const dy = last.y - applied.y;
    if (dx === 0 && dy === 0) return;
    
    // 移动选中的元素
    ids.forEach((id) => moveElement(id, dx, dy, { record: false }));
    dragAppliedPointRef.current = last;
  };
  
  window.addEventListener("pointermove", handleMove);
  // ...
}, [dragging, moveElement, ...]);
```

#### 3. 缩放和平移

```javascript
// components/svg-studio.jsx (第 1308-1338 行)
ref={(node) => {
  if (node) {
    const handleWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd + 滚轮 = 缩放
        const delta = -e.deltaY * 15e-4;
        const rect = node.getBoundingClientRect();
        setZoom((prev) => {
          const nextZoom = clampZoom(prev + delta);
          const scale = nextZoom / prev;
          // 以鼠标位置为中心缩放
          setPan((prevPan) => {
            const cursorX = e.clientX - rect.left - prevPan.x;
            const cursorY = e.clientY - rect.top - prevPan.y;
            return {
              x: prevPan.x - cursorX * (scale - 1),
              y: prevPan.y - cursorY * (scale - 1)
            };
          });
          return nextZoom;
        });
      } else {
        // 普通滚轮 = 平移
        setPan((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };
    node.addEventListener("wheel", handleWheel, { passive: false });
    // ...
  }
}}
```

#### 4. 网格吸附

```javascript
// components/svg-studio.jsx (第 173 行)
const snapValue = (value) => snapEnabled ? Math.round(value / GRID_SIZE) * GRID_SIZE : value;

// 在 canvasPoint 函数中使用
const canvasPoint = (event) => {
  const svg = svgRef.current;
  if (!svg) return { x: 0, y: 0 };
  const rect = svg.getBoundingClientRect();
  const x = (event.clientX - rect.left - pan.x) / zoom;
  const y = (event.clientY - rect.top - pan.y) / zoom;
  return { x: snapValue(x), y: snapValue(y) }; // 应用网格吸附
};
```

---

## 布局与样式

### 主布局结构

```javascript
// app/page.jsx (第 399-403 行)
<div
  ref={mainContentRef}
  className="grid h-dvh min-h-0 flex-1"
  style={{ gridTemplateColumns }}
>
  {/* 画布区域 */}
  <div className="relative flex h-full min-h-0 min-w-0 p-1">
    {/* Draw.io 或 SVG 编辑器 */}
  </div>
  
  {/* 调整条 */}
  <div
    role="separator"
    aria-orientation="vertical"
    onPointerDown={handleResizeChatStart}
    className="..."
  >
    {/* 调整条内容 */}
  </div>
  
  {/* 聊天面板区域 */}
  <div className="...">
    <ChatPanelOptimized />
  </div>
</div>
```

### 动态列布局

```javascript
// app/page.jsx (第 381-383 行)
const gridTemplateColumns = isChatVisible 
  ? `${100 - chatWidthPercent}fr ${RESIZER_WIDTH}px ${chatWidthPercent}fr` 
  : `1fr 0px 0fr`;
```

**说明**:
- 当聊天面板可见时：`画布区域 | 调整条(10px) | 聊天面板`
- 当聊天面板隐藏时：`画布区域(100%) | 0px | 0px`

### 聊天面板宽度调整

```javascript
// app/page.jsx (第 206-288 行)
useEffect(() => {
  if (!isResizingChat) return;
  
  const handleMove = (event) => {
    if (!mainContentRef.current || !isChatVisible) return;
    
    const rect = mainContentRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    
    // 最小宽度限制
    const minChatPx = 320;      // 聊天面板最小宽度
    const minCanvasPx = 520;     // 画布区域最小宽度
    
    const clampedX = Math.min(
      Math.max(offsetX, minCanvasPx),
      rect.width - minChatPx
    );
    
    // 计算聊天面板宽度百分比（从右侧计算）
    const nextChatPercent = (rect.width - clampedX) / rect.width * 100;
    
    // 限制在 26%-50% 之间
    const clampedPercent = Math.min(50, Math.max(26, nextChatPercent));
    
    // 使用 RAF 节流更新
    if (resizeRafRef.current === null) {
      resizeRafRef.current = window.requestAnimationFrame(() => {
        setChatWidthPercent(pendingChatPercentRef.current);
        resizeRafRef.current = null;
      });
    }
  };
  
  window.addEventListener("pointermove", handleMove, { passive: true });
  // ...
}, [isResizingChat, isChatVisible]);
```

---

## 性能优化

### 1. 防抖加载

**位置**: `contexts/diagram-context.jsx` (第 77-98 行)

**实现**: 150ms 防抖，避免频繁调用 `drawioRef.current.load()`

### 2. RequestAnimationFrame 优化

**位置**: `components/svg-studio.jsx` (第 318-426 行, 第 428-556 行)

**实现**: 
- 拖拽操作使用 RAF 批量更新
- 调整大小操作使用 RAF 批量更新
- 避免每次 `pointermove` 事件都触发状态更新

### 3. 条件渲染

**位置**: `app/page.jsx` (第 381-383 行)

**实现**: 聊天面板隐藏时，通过 CSS 控制可见性，而不是卸载组件（避免状态丢失）

### 4. 历史记录优化

**位置**: `contexts/diagram-context.jsx` (第 108-131 行)

**实现**: 
- 检查是否为空图表，避免保存空白历史
- 检查是否与上一个版本相同，避免保存重复历史

### 5. 元素引用缓存

**位置**: `components/svg-studio.jsx` (第 151 行)

**实现**: 使用 `elementRefs.current` 缓存 DOM 引用，避免频繁查询

---

## 关键代码位置

### 主页面
- **文件**: `app/page.jsx`
- **关键行数**:
  - 第 60 行: 获取 DiagramContext
  - 第 64-76 行: 画布内容恢复逻辑
  - 第 176-181 行: Draw.io 加载完成处理
  - 第 399-403 行: 主布局结构
  - 第 409-537 行: 画布区域渲染
  - 第 513-524 行: Draw.io 嵌入组件

### Draw.io 状态管理
- **文件**: `contexts/diagram-context.jsx`
- **关键行数**:
  - 第 77-98 行: `loadDiagram` 方法（防抖加载）
  - 第 100-141 行: `handleDiagramExport` 方法（导出处理）
  - 第 162-194 行: `fetchDiagramXml` 方法（异步获取 XML）

### SVG 编辑器
- **文件**: `components/svg-studio.jsx`
- **关键行数**:
  - 第 115-141 行: 组件初始化和状态获取
  - 第 634-707 行: 画布指针按下事件
  - 第 708-724 行: 画布指针移动事件
  - 第 725-780 行: 画布指针释放事件
  - 第 1359-1590 行: SVG 画布渲染

### 画布编排器
- **文件**: `features/chat-panel/hooks/use-diagram-orchestrator.js`
- **关键行数**:
  - 第 15-40 行: `applyRootToCanvas` 方法（应用 XML 到画布）
  - 第 41-47 行: `tryApplyRoot` 方法（尝试应用 XML）
  - 第 48-63 行: `handleDiagramXml` 方法（处理 XML 更新）

### XML 工具函数
- **文件**: `lib/utils.js`
- **关键行数**:
  - 第 94-107 行: `ensureRootXml` 方法（确保 XML 有 root 标签）
  - 第 124-129 行: `mergeRootXml` 方法（合并 XML）
  - 第 139-168 行: `replaceRootXml` 方法（替换 XML）

### 聊天面板集成
- **文件**: `components/chat-panel-optimized.jsx`
- **关键行数**:
  - 第 132-136 行: 画布编排器初始化
  - 第 137-147 行: `handleCanvasUpdate` 方法（画布更新处理）
  - 第 362-399 行: `display_diagram` 工具调用处理

---

## 画布与聊天面板通信

### 通信流程

```
AI 生成图表
    ↓
ChatPanelOptimized (onToolCall)
    ↓
display_diagram 工具调用
    ↓
handleCanvasUpdate
    ↓
handleDiagramXml (useDiagramOrchestrator)
    ↓
applyRootToCanvas
    ↓
onDisplayChart (DiagramContext.loadDiagram)
    ↓
画布更新
```

### 关键通信接口

#### 1. 画布更新接口

**位置**: `components/chat-panel-optimized.jsx` (第 137-147 行)

```javascript
const handleCanvasUpdate = useCallback(
  async (payload, meta) => {
    if (isSvgMode) {
      loadSvgMarkup(payload);
      updateActiveBranchDiagram(payload);
      return;
    }
    await handleDiagramXml(payload, meta);
  },
  [isSvgMode, loadSvgMarkup, updateActiveBranchDiagram, handleDiagramXml]
);
```

**说明**:
- `payload`: XML 或 SVG 标记字符串
- `meta`: 元数据，包含 `origin`（来源标识，如 "display"）和 `modelRuntime`（模型配置）
- 根据渲染模式选择不同的处理方式

#### 2. 画布内容获取接口

**位置**: `components/chat-panel-optimized.jsx` (第 159-162 行)

```javascript
const getLatestCanvasMarkup = useCallback(
  () => isSvgMode ? exportSvgMarkup() : getLatestDiagramXml(),
  [isSvgMode, exportSvgMarkup, getLatestDiagramXml]
);
```

**说明**:
- 用于在发送消息时获取当前画布内容
- 根据渲染模式返回 SVG 标记或 Draw.io XML

#### 3. 分支对话集成

**位置**: `components/chat-panel-optimized.jsx` (第 128-131 行)

```javascript
const { 
  updateActiveBranchDiagram,  // 更新当前分支的画布 XML
  // ...
} = useConversationManager();
```

**说明**:
- 每个对话分支都有独立的画布状态
- 切换分支时自动恢复对应的画布内容
- 画布更新时自动保存到当前分支

### 工具调用处理

**位置**: `components/chat-panel-optimized.jsx` (第 362-399 行)

```javascript
async onToolCall({ toolCall }) {
  if (toolCall.toolName === "display_diagram") {
    const { xml } = toolCall.input || {};
    
    // 验证 XML
    if (!xml || typeof xml !== "string" || !xml.trim()) {
      throw new Error("大模型返回的 XML 为空，无法渲染。");
    }
    
    // 更新画布
    await handleCanvasUpdate(xml, {
      origin: "display",  // 标识为完全替换
      modelRuntime: selectedModel ?? void 0
    });
    
    // 保存到工具结果
    diagramResultsRef.current.set(toolCall.toolCallId, {
      xml,
      mode: "drawio",
      runtime: selectedModel ?? void 0
    });
    
    // 延迟保存到历史记录（确保画布已加载）
    setTimeout(async () => {
      // ...
    }, 500);
  }
}
```

---

## 总结

Figsci 的画布实现采用了**双模式架构**，既支持功能强大的 Draw.io 编辑器，也提供了轻量级的自定义 SVG 编辑器。通过 Context 进行状态管理，使用防抖和 RAF 优化性能，实现了流畅的用户体验。

**核心特点**:
1. ✅ 双模式支持（Draw.io + SVG）
2. ✅ 统一的状态管理接口
3. ✅ 智能的 XML 合并和替换机制
4. ✅ 性能优化（防抖、RAF、条件渲染）
5. ✅ 响应式布局（可调整的聊天面板宽度）
6. ✅ 完整的交互支持（拖拽、缩放、平移、吸附）
7. ✅ 分支对话集成（每个分支独立的画布状态）
8. ✅ 历史记录管理（撤销/重做、版本恢复）

**未来可能的改进方向**:
- 支持更多 SVG 元素类型（如多边形、曲线等）
- 优化大型图表的渲染性能
- 支持画布协作编辑
- 增强 SVG 模式的编辑功能（如路径编辑、渐变填充等）
- 支持画布导出为多种格式（PNG、PDF 等）

