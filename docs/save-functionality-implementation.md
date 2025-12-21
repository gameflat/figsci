# Figsci 项目保存功能实现详解

## 概述

Figsci 项目实现了多层次的保存功能，涵盖了图表数据、用户配置、对话状态、模板使用记录等多个方面。本文档详细梳理了项目中所有与"保存"相关的代码实现细节。

## 目录

1. [数据持久化架构](#数据持久化架构)
2. [图表保存系统](#图表保存系统)
3. [用户配置保存](#用户配置保存)
4. [对话状态管理](#对话状态管理)
5. [历史记录系统](#历史记录系统)
6. [状态快照与回滚](#状态快照与回滚)
7. [模板使用记录](#模板使用记录)
8. [SVG编辑器状态保存](#svg编辑器状态保存)
9. [localStorage 存储规范](#localstorage-存储规范)
10. [API 路由保存处理](#api-路由保存处理)
11. [错误处理与数据验证](#错误处理与数据验证)

---

## 数据持久化架构

### 基本原则

Figsci 采用客户端 localStorage 作为主要的数据持久化方案，遵循以下原则：

1. **统一的存储键名规范**：使用 `Figsci` 前缀避免冲突
2. **完善的错误处理**：确保数据读取和写入的安全性
3. **客户端环境检查**：避免在服务端渲染时访问 localStorage
4. **数据验证和规范化**：确保存储数据的完整性

### 存储键名规范

```javascript
// 项目中使用的存储键名
const STORAGE_KEYS = {
  // 模型配置注册表
  MODEL_REGISTRY: "Figsci.modelRegistry.v1",
  
  // 国际化语言设置
  LOCALE: "Figsci-locale",
  
  // 最近使用的模板
  RECENT_TEMPLATES: "Figsci_recent_templates",
  
  // 最后保存的图表XML（隐式定义，需要在代码中查找）
  LAST_XML: "LAST_XML_STORAGE_KEY" // 实际值未在代码中明确定义
};
```

---

## 图表保存系统

### 核心组件：DiagramContext

图表保存系统的核心是 `contexts/diagram-context.jsx`，它管理图表的状态和历史记录。

#### 主要状态

```javascript
// 图表状态管理
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

#### 图表导出与保存机制

系统提供两种导出模式：

1. **保存到历史记录的导出**：
```javascript
const handleExport = () => {
    if (drawioRef.current) {
        // 标记这次导出应该保存到历史记录
        expectHistoryExportRef.current = true;
        drawioRef.current.exportDiagram({
            format: "xmlsvg",
        });
    }
};
```

2. **不保存历史记录的导出**：
```javascript
const handleExportWithoutHistory = () => {
    if (drawioRef.current) {
        // 导出但不保存到历史记录（用于内部操作）
        drawioRef.current.exportDiagram({
            format: "xmlsvg",
        });
    }
};
```

#### 智能历史记录保存

系统在 `handleDiagramExport` 函数中实现了智能的历史记录保存逻辑：

```javascript
const handleDiagramExport = (data) => {
    const extractedXML = extractDiagramXML(data.data);
    setChartXML(extractedXML);
    setLatestSvg(data.data);

    // 只有在标记为需要保存历史时才保存到历史记录
    const MAX_HISTORY_SIZE = 20;
    if (expectHistoryExportRef.current) {
        setDiagramHistory((prev) => {
            // 检查是否为空白图表（避免保存空画布）
            const isEmptyDiagram = !extractedXML || 
                                  extractedXML.trim() === '' || 
                                  (extractedXML.includes('<root>') && !extractedXML.includes('mxCell id="2"'));
            
            // 检查是否与上一个版本重复（避免保存相同版本）
            const lastVersion = prev[prev.length - 1];
            const isDuplicate = lastVersion && lastVersion.xml === extractedXML;
            
            // 只有在非空且非重复的情况下才保存到历史
            if (isEmptyDiagram || isDuplicate) {
                console.log("[历史记录] 跳过保存：", isEmptyDiagram ? "空白图表" : "重复版本");
                return prev;
            }
            
            const newHistory = [
                ...prev,
                {
                    svg: data.data,
                    xml: extractedXML,
                },
            ];
            // 只保留最后 MAX_HISTORY_SIZE 个条目（循环缓冲区）
            const trimmedHistory = newHistory.slice(-MAX_HISTORY_SIZE);
            setActiveVersionIndex(trimmedHistory.length - 1);
            console.log("[历史记录] 已保存版本", trimmedHistory.length);
            return trimmedHistory;
        });
        // 重置标记
        expectHistoryExportRef.current = false;
    }
};
```

#### fetchDiagramXml 函数

提供异步获取图表XML的能力，支持选择性保存历史：

```javascript
const fetchDiagramXml = (options = {}) => {
    return new Promise((resolve, reject) => {
        if (!drawioRef.current) {
            if (chartXML && chartXML.trim()) {
                resolve(chartXML);
            } else {
                reject(new Error("当前没有可导出的画布实例"));
            }
            return;
        }
        
        resolverRef.current = resolve;
        
        // 根据选项决定是否保存到历史记录
        if (options?.saveHistory !== false) {
            handleExport(); // 会设置 expectHistoryExportRef.current = true
        } else {
            handleExportWithoutHistory(); // 不会保存到历史记录
        }
        
        // 设置10秒超时
        exportTimeoutRef.current = setTimeout(() => {
            if (resolverRef.current === resolve) {
                resolverRef.current = null;
                expectHistoryExportRef.current = false;
                reject(new Error("导出画布超时（10 秒无响应）"));
            }
        }, 10000);
    });
};
```

---

## 用户配置保存

### 模型配置注册表

`hooks/use-model-registry.js` 实现了用户模型配置的持久化管理。

#### 存储结构

```javascript
const STORAGE_KEY = "Figsci.modelRegistry.v1";

// 存储的数据结构
const ModelRegistryState = {
    endpoints: [], // 模型端点配置数组
    selectedModelKey: string // 当前选中的模型键
};
```

#### 持久化保存函数

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

#### 数据加载与验证

系统在初始化时会验证存储的数据并进行规范化：

```javascript
useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        let initialState;
        
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
                const endpoints = Array.isArray(parsed.endpoints) ? parsed.endpoints : [];
                
                const normalizedSelection = determineNextSelection(
                    typeof parsed.selectedModelKey === "string" ? parsed.selectedModelKey : undefined,
                    endpoints
                );
                
                initialState = {
                    endpoints,
                    selectedModelKey: normalizedSelection,
                };
                
                setState(initialState);
                
                // 如果选择发生变化，更新存储
                if (initialState.selectedModelKey !== parsed.selectedModelKey) {
                    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
                }
            } else {
                // 数据格式无效，使用默认配置
                initialState = createDefaultConfig();
                setState(initialState);
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
            }
        } else {
            // 首次使用，使用默认配置
            initialState = createDefaultConfig();
            setState(initialState);
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
        }
    } catch (error) {
        console.error("Failed to load model registry:", error);
        // 出错时使用默认配置
        const fallbackState = createDefaultConfig();
        setState(fallbackState);
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackState));
        } catch (e) {
            console.error("Failed to save fallback state:", e);
        }
    } finally {
        setIsReady(true);
    }
}, []);
```

### 国际化设置保存

`contexts/locale-context.jsx` 管理语言设置的持久化。

#### 语言设置保存

```javascript
const LOCALE_STORAGE_KEY = "Figsci-locale";

const setLocale = (newLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    // 更新 html lang 属性
    document.documentElement.lang = newLocale === "zh" ? "zh-CN" : "en";
};
```

#### 语言设置加载

```javascript
useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (savedLocale && (savedLocale === "zh" || savedLocale === "en")) {
        setLocaleState(savedLocale);
    } else {
        // 检测浏览器语言
        const browserLang = navigator.language.toLowerCase();
        const detectedLocale = browserLang.startsWith("zh") ? "zh" : "en";
        setLocaleState(detectedLocale);
    }
    setIsInitialized(true);
}, []);
```

---

## 对话状态管理

### ConversationContext

`contexts/conversation-context.jsx` 管理对话分支的状态，但**不直接持久化到 localStorage**。

#### 分支数据结构

```javascript
const ConversationBranch = {
    id: string,
    parentId: string | null,
    label: string,
    createdAt: string,
    messages: Message[],
    diagramXml: string | null,
    meta: ConversationBranchMeta
};
```

#### 分支创建与管理

```javascript
const createBranch = useCallback((input) => {
    const sourceId = input?.parentId ?? activeBranchId;
    const inheritMessages = input?.inheritMessages === undefined ? true : input.inheritMessages;
    const newId = createBranchId();

    const parent = branches[sourceId];
    if (!parent) {
        console.error(`无法创建分支：父分支 ${sourceId} 不存在`);
        return null;
    }

    setBranches((prev) => {
        const branch = {
            id: newId,
            parentId: sourceId,
            label: labelFromInput || `分支 ${branchOrder.length}`,
            createdAt: new Date().toISOString(),
            messages: seedMessages || (inheritMessages ? [...parent.messages] : []),
            diagramXml: input?.diagramXml !== undefined ? input.diagramXml : parent.diagramXml ?? null,
            meta: input?.meta ?? { type: "manual" },
        };
        
        return {
            ...prev,
            [branch.id]: branch,
        };
    });
    
    setBranchOrder((prev) => [...prev, newId]);
    
    if (shouldActivate) {
        setActiveBranchId(newId);
    }

    return pendingBranchRef.current;
}, [activeBranchId, branchOrder, branches]);
```

#### 分支消息和图表更新

```javascript
const updateActiveBranchMessages = useCallback((messages) => {
    setBranches((prev) => {
        const branch = prev[activeBranchId];
        if (!branch || branch.messages === messages) {
            return prev;
        }
        return {
            ...prev,
            [activeBranchId]: {
                ...branch,
                messages,
            },
        };
    });
}, [activeBranchId]);

const updateActiveBranchDiagram = useCallback((diagramXml) => {
    setBranches((prev) => {
        const branch = prev[activeBranchId];
        if (!branch || branch.diagramXml === diagramXml) {
            return prev;
        }
        return {
            ...prev,
            [activeBranchId]: {
                ...branch,
                diagramXml,
            },
        };
    });
}, [activeBranchId]);
```

---

## 历史记录系统

### 图表历史对话框

`components/history-dialog.jsx` 提供图表历史版本的可视化管理界面。

#### 历史记录恢复

```javascript
const handleConfirmRestore = () => {
    if (selectedIndex !== null) {
        // 跳过验证，因为历史快照是可信的
        onDisplayChart(diagramHistory[selectedIndex].xml, true);
        handleClose();
    }
};
```

#### 历史记录展示

```javascript
// 展示历史记录缩略图
{diagramHistory.map((item, index) => (
    <div
        key={index}
        className={`border rounded-md p-2 cursor-pointer hover:border-primary transition-colors ${
            selectedIndex === index ? "border-primary ring-2 ring-primary" : ""
        }`}
        onClick={() => setSelectedIndex(index)}
    >
        <div className="aspect-video bg-white rounded overflow-hidden flex items-center justify-center">
            <Image
                src={item.svg}  // 使用保存的SVG数据
                alt={`图表版本 ${index + 1}`}
                width={200}
                height={100}
                className="object-contain w-full h-full p-1"
                unoptimized
            />
        </div>
        <div className="text-xs text-center mt-1 text-gray-500">
            版本 {index + 1}
        </div>
    </div>
))}
```

---

## 状态快照与回滚

### Mixed 模式状态管理

`components/chat-panel-optimized.jsx` 实现了复杂的状态快照和回滚机制，主要用于光子扣费失败时的状态恢复。

#### 状态快照保存

```javascript
const saveStateSnapshot = useCallback(() => {
    stateSnapshotRef.current = {
        messages: messages ? [...messages] : [],
        diagramXml: activeBranch?.diagramXml ?? null,
        chartXML: chartXML || "",
        timestamp: Date.now()
    };
    console.log("已保存状态快照，用于 mixed 模式回滚", {
        messageCount: messages?.length ?? 0,
        hasDiagramXml: !!activeBranch?.diagramXml,
        timestamp: stateSnapshotRef.current.timestamp
    });
}, [messages, activeBranch, chartXML]);
```

#### 状态回滚机制

```javascript
const rollbackToSnapshot = useCallback(() => {
    const snapshot = stateSnapshotRef.current;
    if (!snapshot) {
        console.warn("❌ 回滚失败：无状态快照可回滚");
        return false;
    }

    console.log("🔄 开始执行状态回滚", {
        snapshotMessageCount: snapshot.messages.length,
        snapshotTimestamp: snapshot.timestamp,
        currentBranchId: activeBranchId,
        renderMode: isSvgMode ? 'svg' : 'drawio'
    });

    try {
        // 使用快照中的消息列表（发送前的状态）
        const truncatedMessages = snapshot.messages;
        const userMessageCount = truncatedMessages.filter(msg => msg.role === "user").length;

        // 创建新分支保存回滚状态
        const safeDiagramXml = normalizeDiagramXml(snapshot.diagramXml);
        
        const rollbackBranch = createBranch({
            parentId: activeBranchId,
            label: `扣费失败回滚`,
            meta: {
                type: "rollback",
                reason: "charge_failed",
                timestamp: Date.now(),
                originalMessageCount: snapshot.messages.length
            },
            diagramXml: safeDiagramXml,
            seedMessages: truncatedMessages,
            inheritMessages: false
        });

        // 更新UI状态
        setMessages(truncatedMessages);
        setInput(""); // 清空输入框
        resetProgressIndicator();

        return true;
    } catch (error) {
        console.error("回滚失败：", error);
        return false;
    }
}, [/* 依赖项 */]);
```

#### XML规范化处理

```javascript
const normalizeDiagramXml = useCallback((rawXml) => {
    if (isSvgMode) {
        if (typeof rawXml === "string" && rawXml.trim()) {
            return rawXml;
        }
        return null;
    }

    const candidate = (typeof rawXml === "string" && rawXml.trim()) ? rawXml : EMPTY_MXFILE;
    try {
        formatXML(candidate);
        return candidate;
    } catch (parseError) {
        console.warn("回滚 XML 解析失败，使用空画布替代", parseError);
        return EMPTY_MXFILE;
    }
}, [isSvgMode]);
```

---

## 模板使用记录

### 最近使用模板

`components/template-gallery.jsx` 实现了最近使用模板的记录和管理。

#### 存储键名

```javascript
const RECENT_KEY = "Figsci_recent_templates";
```

#### 最近使用记录加载

```javascript
useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(RECENT_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                setRecentTemplateIds(parsed);
            }
        } catch (error) {
            console.warn("Failed to parse recent templates:", error);
        }
    }
}, []);
```

#### 最近使用记录更新

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

#### 模板使用处理

```javascript
const handleUseTemplate = (template) => {
    onSelectTemplate(template);
    updateRecent(template.id); // 记录到最近使用
};
```

---

## SVG编辑器状态保存

### SVG编辑器历史管理

`contexts/svg-editor-context.jsx` 实现了SVG编辑器的状态管理和历史记录功能。

#### 编辑器快照

```javascript
const takeSnapshot = useCallback(
    (customElements, customDoc, customDefs) => ({
        doc: { ...(customDoc ?? doc) },
        elements: (customElements ?? elements).map((el) => ({ ...el })),
        defs: customDefs ?? defsMarkup,
    }),
    [doc, elements, defsMarkup]
);
```

#### 历史记录管理

```javascript
const pushHistorySnapshot = useCallback(
    (customElements, customDoc, customDefs) => {
        setPast((prev) => {
            const next = [...prev, takeSnapshot(customElements, customDoc, customDefs)];
            return next.slice(-50); // 限制历史记录为50个
        });
        setFuture([]);
    },
    [takeSnapshot]
);
```

#### 撤销/重做功能

```javascript
const undo = useCallback(() => {
    setPast((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        setFuture((f) => [takeSnapshot(), ...f].slice(0, 50));
        setDoc(last.doc);
        setElements(last.elements);
        setSelectedId(null);
        return prev.slice(0, -1);
    });
}, [takeSnapshot]);

const redo = useCallback(() => {
    setFuture((prev) => {
        if (prev.length === 0) return prev;
        const next = prev[0];
        setPast((p) => [...p, takeSnapshot()].slice(-50));
        setDoc(next.doc);
        setElements(next.elements);
        setSelectedId(null);
        return prev.slice(1);
    });
}, [takeSnapshot]);
```

---

## localStorage 存储规范

### 存储键名规范

项目遵循统一的存储键名规范：

```javascript
// 存储键名格式
const STORAGE_PATTERNS = {
    // 使用点分隔的版本化键名
    "Figsci.modelRegistry.v1": "模型配置注册表",
    
    // 使用连字符的简单键名
    "Figsci-locale": "国际化语言设置",
    
    // 使用下划线的功能键名
    "Figsci_recent_templates": "最近使用的模板",
};
```

### 错误处理模式

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

### 数据验证

重要数据在加载时会进行验证：

```javascript
// 验证存储数据的示例
const validateStoredData = (data) => {
    if (!data || typeof data !== "object") {
        return false;
    }
    
    // 验证必需字段
    if (!Array.isArray(data.endpoints)) {
        return false;
    }
    
    return true;
};
```

---

## API 路由保存处理

### 配置测试API

`app/api/configs/route.js` 提供模型配置的连接测试功能，虽然不直接保存数据，但是配置验证的重要环节。

#### 配置验证处理

```javascript
export async function POST(request) {
    try {
        const { config } = await request.json();

        if (!config) {
            return NextResponse.json(
                { error: 'Missing required parameter: config' },
                { status: 400 }
            );
        }

        // 调用测试连接函数，验证配置的有效性
        const result = await testConnection(config);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error testing connection:', error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || '连接测试失败'
            },
            { status: 500 }
        );
    }
}
```

### 聊天API中的保存逻辑

`app/api/chat/route.js` 在处理聊天请求时会涉及图表状态的传递和处理：

```javascript
// 在发送消息前保存当前图表状态到历史记录
let chartXml = await fetchAndFormatDiagram({ saveHistory: true });
```

---

## 错误处理与数据验证

### 图表XML验证

`lib/diagram-validation.js` 提供图表XML的验证功能：

```javascript
export function validateDiagramXml(xml) {
    const normalizedXml = normalizeGeneratedXml(xml);
    const errors = [];

    if (!normalizedXml.trim()) {
        errors.push({
            code: "empty-input",
            message: "生成的 XML 内容为空，无法应用到画布。",
        });
        return { isValid: false, normalizedXml, errors };
    }

    // XML解析验证
    const parser = new DOMParser();
    const doc = parser.parseFromString(
        `<mxGraphModel>${normalizedXml}</mxGraphModel>`,
        "text/xml"
    );
    
    const parserError = doc.querySelector("parsererror");
    if (parserError) {
        errors.push({
            code: "parser-error",
            message: parserError.textContent?.replace(/\s+/g, " ").trim(),
        });
        return { isValid: false, normalizedXml, errors };
    }

    return { isValid: true, normalizedXml, errors };
}
```

### XML处理工具函数

`lib/utils.js` 提供了完整的XML处理工具集：

#### extractDiagramXML - 从SVG中提取XML

```javascript
export function extractDiagramXML(xml_svg_string) {
    try {
        // 1. 解析SVG字符串
        const svgString = atob(xml_svg_string.slice(26));
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
        
        // 2. 提取content属性
        const svgElement = svgDoc.querySelector('svg');
        const encodedContent = svgElement.getAttribute('content');
        
        // 3. 解码HTML实体
        function decodeHtmlEntities(str) {
            const textarea = document.createElement('textarea');
            textarea.innerHTML = str;
            return textarea.value;
        }
        const xmlContent = decodeHtmlEntities(encodedContent);
        
        // 4. 解析XML内容并提取diagram元素
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
        const diagramElement = xmlDoc.querySelector('diagram');
        const base64EncodedData = diagramElement.textContent;
        
        // 5. Base64解码
        const binaryString = atob(base64EncodedData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // 6. 使用pako解压缩
        const decompressedData = pako.inflate(bytes, { windowBits: -15 });
        const decoder = new TextDecoder('utf-8');
        const decodedString = decoder.decode(decompressedData);
        
        // 7. URL解码
        return decodeURIComponent(decodedString);
        
    } catch (error) {
        console.error("Error extracting diagram XML:", error);
        throw error;
    }
}
```

#### encodeDiagramXml - 编码XML为Base64

```javascript
export function encodeDiagramXml(xml) {
    if (!xml || xml.trim().length === 0) {
        throw new Error("XML 内容不能为空");
    }

    const urlEncoded = encodeURIComponent(xml);
    const encoder = new TextEncoder();
    const utf8 = encoder.encode(urlEncoded);
    const compressed = pako.deflate(utf8, { level: 9, windowBits: -15 });

    let binary = "";
    for (let i = 0; i < compressed.length; i++) {
        binary += String.fromCharCode(compressed[i]);
    }

    return btoa(binary);
}
```

#### replaceRootXml - 替换图表根XML

```javascript
export function replaceRootXml(baseXml, newRootXml) {
    const normalizedRoot = ensureRootXml(newRootXml);
    
    // 检查是否是完整的 mxfile 格式
    const isFullFormat = baseXml && baseXml.includes('<mxfile>') && baseXml.includes('<diagram');
    
    if (isFullFormat) {
        // 完整格式：保持结构，只替换 <root> 内容
        const mxGraphModelMatch = baseXml.match(/<mxGraphModel[^>]*>[\s\S]*?<\/mxGraphModel>/i);
        if (mxGraphModelMatch) {
            const mxGraphModelTag = mxGraphModelMatch[0].match(/<mxGraphModel[^>]*>/i);
            const startTag = mxGraphModelTag ? mxGraphModelTag[0] : '<mxGraphModel>';
            const newMxGraphModel = `${startTag}${normalizedRoot}</mxGraphModel>`;
            return baseXml.replace(/<mxGraphModel[^>]*>[\s\S]*?<\/mxGraphModel>/i, newMxGraphModel);
        }
    }
    
    // 使用 EMPTY_MXFILE 作为基础模板
    const mxGraphModelMatch = EMPTY_MXFILE.match(/<mxGraphModel[^>]*>[\s\S]*?<\/mxGraphModel>/i);
    if (mxGraphModelMatch) {
        const mxGraphModelTag = mxGraphModelMatch[0].match(/<mxGraphModel[^>]*>/i);
        const startTag = mxGraphModelTag ? mxGraphModelTag[0] : '<mxGraphModel>';
        const newMxGraphModel = `${startTag}${normalizedRoot}</mxGraphModel>`;
        return EMPTY_MXFILE.replace(/<mxGraphModel[^>]*>[\s\S]*?<\/mxGraphModel>/i, newMxGraphModel);
    }
    
    // 兜底方案
    return `<mxGraphModel>${normalizedRoot}</mxGraphModel>`;
}
```

---

## 总结

Figsci 项目实现了一个完整而复杂的保存系统，涵盖了：

1. **图表数据保存**：自动保存、历史记录、版本管理
2. **用户配置保存**：模型配置、语言设置、使用偏好
3. **状态管理**：对话分支、编辑历史、快照回滚
4. **数据持久化**：localStorage规范、错误处理、数据验证
5. **工具函数**：XML处理、编码解码、格式转换

整个系统采用了分层架构，通过React Context提供状态管理，使用localStorage进行客户端持久化，并实现了完善的错误处理和数据验证机制。每个组件都有明确的职责分工，形成了一个可靠、高效的保存功能体系。

---

## 相关文件索引

### 核心Context文件
- `contexts/diagram-context.jsx` - 图表状态管理和历史记录
- `contexts/conversation-context.jsx` - 对话分支管理
- `contexts/svg-editor-context.jsx` - SVG编辑器状态管理
- `contexts/locale-context.jsx` - 国际化设置管理

### Hook文件
- `hooks/use-model-registry.js` - 模型配置注册表
- `hooks/use-chat-state.js` - 聊天状态管理
- `features/chat-panel/hooks/use-diagram-orchestrator.js` - 图表编排器

### 组件文件
- `components/chat-panel-optimized.jsx` - 聊天面板（包含状态快照功能）
- `components/history-dialog.jsx` - 历史记录对话框
- `components/template-gallery.jsx` - 模板画廊（最近使用记录）
- `components/model-config-dialog.jsx` - 模型配置对话框

### 工具库文件
- `lib/utils.js` - XML处理和编码工具
- `lib/diagram-validation.js` - 图表验证工具
- `lib/diagram-templates.js` - 图表模板定义

### API路由文件
- `app/api/configs/route.js` - 配置验证API
- `app/api/chat/route.js` - 聊天API（包含图表状态处理）

### 规范文件
- `.cursor/rules/data-persistence.mdc` - 数据持久化规范
- `.cursor/rules/api-routes.mdc` - API路由规范
- `.cursor/rules/state-management.mdc` - 状态管理规范

