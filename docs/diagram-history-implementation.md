# 图表历史功能实现细节

## 概述

图表历史功能允许用户查看和恢复每次 AI 修改前的图表版本。该功能支持两种渲染模式：
- **Draw.io 模式**：使用 Draw.io XML 格式的图表
- **SVG 模式**：使用 SVG 格式的图表

## 用户操作流程

1. 用户点击聊天输入框中的"查看图表变更记录"按钮（历史图标）
2. 打开"图表历史"对话框，显示所有保存的图表版本缩略图
3. 用户点击任意缩略图即可恢复对应的图表版本
4. 对话框自动关闭，图表恢复到选中的版本

## 核心组件

### 1. 触发按钮组件

**文件位置**：`components/chat-input-optimized.jsx`

**关键代码**：

```323:337:components/chat-input-optimized.jsx
                        <ButtonWithTooltip
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-[30px] w-[30px] rounded-full flex-shrink-0"
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

**功能说明**：
- 使用 `History` 图标（来自 `lucide-react`）
- 点击时调用 `onToggleHistory(true)` 打开历史对话框
- 按钮在以下情况下禁用：
  - `isBusy`：正在处理中
  - `historyItems.length === 0`：没有历史记录
  - `interactionLocked`：交互被锁定

**Props 传递**：

```450:455:components/chat-input-optimized.jsx
            <HistoryDialog
                showHistory={showHistory}
                onToggleHistory={onToggleHistory}
                items={historyItems}
                onRestore={onRestoreHistory}
            />
```

### 2. 历史对话框组件

**文件位置**：`components/history-dialog.jsx`

**组件结构**：

```26:94:components/history-dialog.jsx
export function HistoryDialog({
    showHistory,
    onToggleHistory,
    items,
    onRestore,
}) {
    const { restoreDiagramAt, diagramHistory } = useDiagram();
    const historyItems = items ?? diagramHistory;
    const handleRestore = onRestore ?? restoreDiagramAt;

    return (
        <Dialog open={showHistory} onOpenChange={onToggleHistory}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>图表历史</DialogTitle>
                    <DialogDescription>
                        这里保留了每次 AI 修改前的图表。
                        <br />
                        点击任意缩略图即可恢复。
                    </DialogDescription>
                </DialogHeader>

                {historyItems.length === 0 ? (
                    <div className="text-center p-4 text-gray-500">
                        暂无历史记录，发送消息后会自动保存版本。
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
                        {historyItems.map((item, index) => (
                            <div
                                key={index}
                                className="border rounded-md p-2 cursor-pointer hover:border-primary transition-colors"
                                onClick={() => {
                                    handleRestore(index);
                                    onToggleHistory(false);
                                }}
                            >
                                <div className="aspect-video bg-white rounded overflow-hidden flex items-center justify-center">
                                    <div className="relative h-full w-full">
                                        <Image
                                            src={item.svg}
                                            alt={`图表版本 ${index + 1}`}
                                            fill
                                            className="object-contain p-1"
                                            sizes="(max-width: 640px) 50vw, 200px"
                                            unoptimized
                                        />
                                    </div>
                                </div>
                                <div className="text-xs text-center mt-1 text-gray-500">
                                    版本 {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onToggleHistory(false)}
                    >
                        关闭
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

**功能说明**：
- 使用 Radix UI 的 `Dialog` 组件
- 支持两种数据源：
  - 通过 `items` prop 传入（用于 SVG 模式）
  - 从 `useDiagram()` hook 获取 `diagramHistory`（用于 Draw.io 模式）
- 使用 Next.js 的 `Image` 组件显示缩略图
- 点击缩略图时：
  1. 调用 `handleRestore(index)` 恢复图表
  2. 调用 `onToggleHistory(false)` 关闭对话框

**Props 类型定义**：

```15:21:components/history-dialog.jsx
/**
 * @typedef {Object} HistoryDialogProps
 * @property {boolean} showHistory
 * @property {(show: boolean) => void} onToggleHistory
 * @property {Array<{ svg: string }>} [items]
 * @property {(index: number) => void} [onRestore]
 */
```

## 状态管理

### Draw.io 模式历史管理

**文件位置**：`contexts/diagram-context.jsx`

**状态定义**：

```57:58:contexts/diagram-context.jsx
    const [diagramHistory, setDiagramHistory] = useState([]);
    const [activeVersionIndex, setActiveVersionIndex] = useState(-1);
```

**历史记录数据结构**：

```17:17:contexts/diagram-context.jsx
 * @typedef {{svg: string, xml: string}} DiagramHistoryEntry
```

每个历史记录项包含：
- `svg`：图表的 SVG 格式（用于显示缩略图）
- `xml`：图表的 Draw.io XML 格式（用于恢复图表）

**保存历史记录**：

历史记录在 `handleDiagramExport` 函数中保存：

```100:141:contexts/diagram-context.jsx
    const handleDiagramExport = (data) => {
        const shouldSaveHistory = saveHistoryRef.current;
        saveHistoryRef.current = true;

        const extractedXML = extractDiagramXML(data.data);
        setChartXML(extractedXML);
        setLatestSvg(data.data);
        
        // 🔧 修复：避免保存空白或重复的版本
        // 1. 检查是否是空白画布（只有基础结构，没有实际内容）
        const isEmptyDiagram = !extractedXML || 
                               extractedXML.trim() === '' || 
                               extractedXML.includes('<root>') && !extractedXML.includes('mxCell id="2"');
        
        // 2. 检查是否与上一个版本相同
        const lastVersion = diagramHistory[diagramHistory.length - 1];
        const isDuplicate = lastVersion && lastVersion.xml === extractedXML;
        
        // 只有在非空且非重复的情况下才保存到历史
        if (shouldSaveHistory && !isEmptyDiagram && !isDuplicate) {
            setDiagramHistory((prev) => {
                const updated = [
                    ...prev,
                    {
                        svg: data.data,
                        xml: extractedXML,
                    },
                ];
                setActiveVersionIndex(updated.length - 1);
                return updated;
            });
        }
        
        if (resolverRef.current) {
            resolverRef.current(extractedXML);
            resolverRef.current = null;
        }
        if (exportTimeoutRef.current) {
            clearTimeout(exportTimeoutRef.current);
            exportTimeoutRef.current = null;
        }
    };
```

**保存逻辑说明**：
1. 通过 `saveHistoryRef.current` 控制是否保存历史（可通过 `fetchDiagramXml({ saveHistory: false })` 禁用）
2. 从 Draw.io 导出的数据中提取 XML 和 SVG
3. 检查是否为空白图表（避免保存空画布）
4. 检查是否与上一个版本重复（避免保存相同版本）
5. 只有在非空且非重复的情况下才保存

**恢复历史记录**：

```151:160:contexts/diagram-context.jsx
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

**恢复逻辑说明**：
1. 根据索引获取历史记录项
2. 使用 `loadDiagram` 将 XML 加载到 Draw.io 画布
3. 更新 `chartXML` 和 `latestSvg` 状态
4. 更新 `activeVersionIndex` 标记当前版本

**清空历史记录**：

```143:149:contexts/diagram-context.jsx
    const clearDiagram = () => {
        loadDiagram(EMPTY_MXFILE);
        setChartXML(EMPTY_MXFILE);
        setLatestSvg("");
        setDiagramHistory([]);
        setActiveVersionIndex(-1);
    };
```

### SVG 模式历史管理

**文件位置**：`contexts/svg-editor-context.jsx`

**状态定义**：

```487:490:contexts/svg-editor-context.jsx
    const [history, setHistory] = useState([]);
    const [activeHistoryIndex, setActiveHistoryIndex] = useState(-1);
    const [past, setPast] = useState([]);
    const [future, setFuture] = useState([]);
```

**历史记录数据结构**：

SVG 模式的历史记录项包含：
- `svg`：SVG 标记字符串
- `dataUrl`：SVG 转换为 Data URL（用于显示缩略图）
- `timestamp`：时间戳

**保存历史记录**：

历史记录在 `addHistory` 函数中保存：

```548:558:contexts/svg-editor-context.jsx
    const addHistory = useCallback(
        (snapshotSvg) => {
            const dataUrl = svgToDataUrl(snapshotSvg);
            setHistory((prev) => {
                const next = [...prev, { svg: snapshotSvg, dataUrl, timestamp: Date.now() }];
                setActiveHistoryIndex(next.length - 1);
                return next;
            });
        },
        []
    );
```

**保存触发时机**：

在 `loadSvgMarkup` 函数中，当加载 SVG 时会自动保存历史：

```866:892:contexts/svg-editor-context.jsx
    const loadSvgMarkup = useCallback(
        (svg, options) => {
            try {
                const content = svg.trim();
                if (!content.toLowerCase().includes("<svg")) {
                    console.warn("忽略非 SVG 内容载入：", content.slice(0, 120));
                    return;
                }
                const parsed = parseSvgMarkup(svg);
                if (!parsed.valid) {
                    return;
                }
                setDoc(parsed.doc);
                setElements(parsed.elements);
                setDefsMarkup(parsed.defs ?? null);
                setSelectedId(null);
                pushHistorySnapshot(parsed.elements, parsed.doc, parsed.defs ?? null);
                if (options?.saveHistory !== false) {
                    const snapshot = buildSvgMarkup(parsed.doc, parsed.elements);
                    addHistory(snapshot);
                }
            } catch (error) {
                console.error("解析 SVG 失败：", error);
            }
        },
        [addHistory, pushHistorySnapshot]
    );
```

**恢复历史记录**：

```909:927:contexts/svg-editor-context.jsx
    const restoreHistoryAt = useCallback((index) => {
        const entry = history[index];
        if (!entry) return;
        try {
            const parsed = parseSvgMarkup(entry.svg);
            setDoc(parsed.doc);
            setElements(
                parsed.elements.map((el) => ({
                    ...el,
                    visible: el.visible !== false,
                    locked: el.locked === true,
                }))
            );
            setSelectedId(null);
            setActiveHistoryIndex(index);
        } catch (error) {
            console.error("恢复历史失败：", error);
        }
    }, [history]);
```

**清空历史记录**：

```894:904:contexts/svg-editor-context.jsx
    const clearSvg = useCallback(() => {
        pushHistorySnapshot();
        setDoc(DEFAULT_DOC);
        setElements([]);
        setDefsMarkup(null);
        setSelectedId(null);
        setHistory([]);
        setActiveHistoryIndex(-1);
        setPast([]);
        setFuture([]);
    }, [pushHistorySnapshot]);
```

## 历史记录保存时机

### Draw.io 模式

历史记录在以下时机保存：

1. **AI 生成图表后**（`display_diagram` 工具调用）：

```396:407:components/chat-panel-optimized.jsx
          // 保存图表到历史记录：等待图表加载到画布后，异步保存到历史记录
          // 延迟一段时间确保图表已经完全加载到 draw.io 画布中
          setTimeout(async () => {
            try {
              console.log("[display_diagram] 开始保存图表到历史记录");
              await fetchDiagramXml({ saveHistory: true });
              console.log("[display_diagram] 图表已保存到历史记录");
            } catch (error) {
              console.warn("[display_diagram] 保存图表到历史记录失败:", error);
              // 保存失败不影响主要流程，只记录警告
            }
          }, 500); // 延迟 500ms 确保图表已加载
```

2. **AI 生成 SVG 后转换为 Draw.io**（`display_svg` 工具调用，非 SVG 模式）：

```469:478:components/chat-panel-optimized.jsx
          // 保存图表到历史记录（非 SVG 模式但使用 display_svg 工具时）
          setTimeout(async () => {
            try {
              console.log("[display_svg] 开始保存图表到历史记录（draw.io 模式）");
              await fetchDiagramXml({ saveHistory: true });
              console.log("[display_svg] 图表已保存到历史记录");
            } catch (error) {
              console.warn("[display_svg] 保存图表到历史记录失败:", error);
            }
          }, 500);
```

**保存流程**：
1. 调用 `fetchDiagramXml({ saveHistory: true })`
2. 触发 Draw.io 的 `exportDiagram` 方法
3. Draw.io 回调 `handleDiagramExport` 函数
4. 在 `handleDiagramExport` 中检查并保存历史记录

### SVG 模式

历史记录在以下时机保存：

1. **AI 生成 SVG 后**（`display_svg` 工具调用，SVG 模式）：

```437:452:components/chat-panel-optimized.jsx
          if (isSvgMode) {
            loadSvgMarkup(svg);
            updateActiveBranchDiagram(svg);
            diagramResultsRef.current.set(toolCall.toolCallId, {
              xml: svg,
              svg,
              mode: "svg",
              runtime: selectedModel ?? void 0
            });
            setDiagramResultVersion((prev) => prev + 1);
            addToolResult({
              tool: "display_svg",
              toolCallId: toolCall.toolCallId,
              output: "SVG 已载入新编辑器，可直接编辑。"
            });
            return;
          }
```

**保存流程**：
1. 调用 `loadSvgMarkup(svg)`（默认 `saveHistory` 为 `true`）
2. 解析 SVG 并更新编辑器状态
3. 调用 `addHistory(snapshot)` 保存历史记录

## 历史记录数据整合

在 `chat-panel-optimized.jsx` 中，根据当前渲染模式整合历史记录：

```248:263:components/chat-panel-optimized.jsx
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

**说明**：
- SVG 模式：使用 `svgHistory`，将 `dataUrl` 或 `svg` 作为缩略图源
- Draw.io 模式：直接使用 `mxDiagramHistory`（已包含 `svg` 字段）
- 恢复时根据模式调用对应的恢复函数

## 历史记录与消息回溯的关联

在消息回溯功能中，会同时回溯图表历史：

```1527:1564:components/chat-panel-optimized.jsx
  const handleMessageRevert = useCallback(
    ({ messageId, text, messageIndex, shouldRestoreCanvas }) => {
      const targetIndex = messages.findIndex(
        (message) => message.id === messageId
      );
      if (targetIndex < 0) {
        return;
      }
      
      // 截断消息到目标位置
      const truncated = messages.slice(0, targetIndex);
      const labelSuffix = targetIndex + 1 <= 9 ? `0${targetIndex + 1}` : `${targetIndex + 1}`;
      
      // 如果需要回溯画布，尝试找到对应的历史版本
      let diagramXmlToRestore = activeBranch?.diagramXml ?? null;
      
      if (shouldRestoreCanvas && historyItems && historyItems.length > 0) {
        // 计算应该回溯到的画布历史索引
        // 策略：每条用户消息对应一个画布版本
        // 找到目标消息之前的用户消息数量，作为画布历史索引
        const userMessagesBeforeTarget = truncated.filter(msg => msg.role === "user").length;
        
        // 如果有足够的历史版本，回溯到对应位置
        if (userMessagesBeforeTarget > 0 && historyItems.length >= userMessagesBeforeTarget) {
          const historyIndex = Math.min(userMessagesBeforeTarget - 1, historyItems.length - 1);
          
          // historyItems 可能是 SVG 模式或 drawio 模式的历史
          const targetHistory = historyItems[historyIndex];
          if (targetHistory) {
            // 对于 drawio 模式，使用 xml 字段；对于 svg 模式，使用 svg 字段
            diagramXmlToRestore = targetHistory.xml || targetHistory.svg || diagramXmlToRestore;
            
            // 同时回溯画布显示
            handleRestoreHistory(historyIndex);
          }
        } else if (userMessagesBeforeTarget === 0) {
```

**回溯策略**：
- 每条用户消息对应一个画布版本
- 计算目标消息之前的用户消息数量，作为历史索引
- 调用 `handleRestoreHistory(historyIndex)` 恢复对应的图表版本

## 关键实现细节

### 1. 防抖优化

Draw.io 模式使用防抖避免频繁加载：

```76:98:contexts/diagram-context.jsx
    // 🚀 性能优化：使用防抖避免频繁加载 draw.io
    const loadDiagram = useCallback((chart) => {
        if (loadDiagramTimeoutRef.current) {
            clearTimeout(loadDiagramTimeoutRef.current);
        }
        
        loadDiagramTimeoutRef.current = setTimeout(() => {
            if (drawioRef.current && chart) {
                // 总是调用 load，让 draw.io 决定是否需要更新
                // 这样即使 XML 字符串相同，也能确保画布刷新
                drawioRef.current.load({
                    xml: chart,
                });
            }
            loadDiagramTimeoutRef.current = null;
        }, 150); // 150ms 防抖，平衡流畅度和性能

        // 更新状态：如果 chart 与当前 chartXML 不同，则更新
        // 注意：即使 XML 相同，draw.io 的 load 函数也会被调用，这样可以处理缓存问题
        if (chart && chart !== chartXML) {
            setChartXML(chart);
        }
    }, [chartXML]);
```

### 2. 空白和重复检测

避免保存空白或重复的版本：

```108:131:contexts/diagram-context.jsx
        // 🔧 修复：避免保存空白或重复的版本
        // 1. 检查是否是空白画布（只有基础结构，没有实际内容）
        const isEmptyDiagram = !extractedXML || 
                               extractedXML.trim() === '' || 
                               extractedXML.includes('<root>') && !extractedXML.includes('mxCell id="2"');
        
        // 2. 检查是否与上一个版本相同
        const lastVersion = diagramHistory[diagramHistory.length - 1];
        const isDuplicate = lastVersion && lastVersion.xml === extractedXML;
        
        // 只有在非空且非重复的情况下才保存到历史
        if (shouldSaveHistory && !isEmptyDiagram && !isDuplicate) {
            setDiagramHistory((prev) => {
                const updated = [
                    ...prev,
                    {
                        svg: data.data,
                        xml: extractedXML,
                    },
                ];
                setActiveVersionIndex(updated.length - 1);
                return updated;
            });
        }
```

### 3. 异步保存延迟

为了确保图表完全加载后再保存，使用 500ms 延迟：

```396:407:components/chat-panel-optimized.jsx
          // 保存图表到历史记录：等待图表加载到画布后，异步保存到历史记录
          // 延迟一段时间确保图表已经完全加载到 draw.io 画布中
          setTimeout(async () => {
            try {
              console.log("[display_diagram] 开始保存图表到历史记录");
              await fetchDiagramXml({ saveHistory: true });
              console.log("[display_diagram] 图表已保存到历史记录");
            } catch (error) {
              console.warn("[display_diagram] 保存图表到历史记录失败:", error);
              // 保存失败不影响主要流程，只记录警告
            }
          }, 500); // 延迟 500ms 确保图表已加载
```

### 4. 可选的保存控制

通过 `saveHistory` 选项控制是否保存历史：

```162:194:contexts/diagram-context.jsx
    const fetchDiagramXml = (options = {}) => {
        return new Promise((resolve, reject) => {
            if (!drawioRef.current) {
                if (chartXML && chartXML.trim()) {
                    resolve(chartXML);
                } else {
                    reject(
                        new Error(
                            "当前没有可导出的画布实例，请先在画图工作室中生成或编辑图表。"
                        )
                    );
                }
                return;
            }
            resolverRef.current = resolve;
            saveHistoryRef.current = options?.saveHistory !== false;
            handleExport();
            if (exportTimeoutRef.current) {
                clearTimeout(exportTimeoutRef.current);
            }
            exportTimeoutRef.current = setTimeout(() => {
                if (resolverRef.current === resolve) {
                    resolverRef.current = null;
                    saveHistoryRef.current = true;
                    reject(
                        new Error(
                            "导出画布超时（10 秒无响应），请稍后重试。"
                        )
                    );
                }
            }, 10000);
        });
    };
```

## 相关文件清单

### 核心组件
- `components/history-dialog.jsx` - 历史对话框组件
- `components/chat-input-optimized.jsx` - 触发按钮组件

### 状态管理
- `contexts/diagram-context.jsx` - Draw.io 模式历史管理
- `contexts/svg-editor-context.jsx` - SVG 模式历史管理

### 业务逻辑
- `components/chat-panel-optimized.jsx` - 历史记录整合和恢复逻辑

## 总结

图表历史功能通过以下机制实现：

1. **双模式支持**：分别管理 Draw.io 和 SVG 两种模式的历史记录
2. **自动保存**：在 AI 生成图表后自动保存到历史记录
3. **智能过滤**：避免保存空白或重复的版本
4. **异步保存**：使用延迟确保图表完全加载后再保存
5. **统一接口**：通过 `historyItems` 和 `handleRestoreHistory` 统一两种模式的使用
6. **消息关联**：支持在消息回溯时同步恢复图表历史

该功能为用户提供了完整的图表版本管理能力，可以随时查看和恢复之前的图表版本。

