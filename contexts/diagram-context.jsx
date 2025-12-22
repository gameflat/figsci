"use client";

import React, {
    createContext,
    useContext,
    useRef,
    useState,
    useCallback,
    useEffect,
} from "react";
import { extractDiagramXML } from "../lib/utils";
import { EMPTY_MXFILE } from "@/lib/diagram-templates.js";

/**
 * 存储键名：用于 localStorage 中保存图表 XML
 */
export const LAST_XML_STORAGE_KEY = "Figsci-diagram-xml";

/**
 * 导出格式类型
 * @typedef {"drawio" | "png" | "svg"} ExportFormat
 */

/**
 * @typedef {import("react-drawio").DrawIoEmbedRef} DrawIoEmbedRef
 * @typedef {import("@/types/diagram").RuntimeErrorPayload} RuntimeErrorPayload
 * @typedef {{svg: string, xml: string}} DiagramHistoryEntry
 *
 * @typedef {Object} DiagramContextValue
 * @property {string} chartXML - 当前图表的 XML 数据
 * @property {string} latestSvg - 最新的 SVG 渲染结果
 * @property {DiagramHistoryEntry[]} diagramHistory - 图表历史记录数组
 * @property {number} activeVersionIndex - 当前活动版本索引
 * @property {(chart: string, skipValidation?: boolean) => string | null} loadDiagram - 加载图表到画布
 * @property {() => void} handleExport - 导出并保存到历史记录
 * @property {() => void} handleExportWithoutHistory - 导出但不保存到历史记录  
 * @property {React.MutableRefObject<((value: string) => void) | null>} resolverRef - 异步导出的 Promise resolver
 * @property {React.MutableRefObject<DrawIoEmbedRef | null>} drawioRef - Draw.io 编辑器引用
 * @property {(data: { data: string }) => void} handleDiagramExport - 处理图表导出回调
 * @property {() => void} clearDiagram - 清空图表和历史记录
 * @property {(index: number) => void} restoreDiagramAt - 恢复指定索引的历史版本
 * @property {(options?: { saveHistory?: boolean }) => Promise<string>} fetchDiagramXml - 获取图表 XML
 * @property {RuntimeErrorPayload | null} runtimeError - 运行时错误信息
 * @property {React.Dispatch<React.SetStateAction<RuntimeErrorPayload | null>>} setRuntimeError - 设置运行时错误
 * @property {(filename: string, format: ExportFormat, sessionId?: string) => void} saveDiagramToFile - 保存图表到文件
 * @property {boolean} showSaveDialog - 保存对话框显示状态
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setShowSaveDialog - 设置保存对话框显示状态
 */

/** @type {React.Context<DiagramContextValue | undefined>} */
const DiagramContext = createContext(undefined);

/**
 * @param {{ children: React.ReactNode }} props
 */
export function DiagramProvider({ children }) {
    const [chartXML, setChartXML] = useState("");
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const stored = window.localStorage.getItem(LAST_XML_STORAGE_KEY);
            if (stored && stored !== chartXML) {
                setChartXML(stored);
            }
        } catch {
            // ignore
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [latestSvg, setLatestSvg] = useState("");
    const [diagramHistory, setDiagramHistory] = useState([]);
    const [activeVersionIndex, setActiveVersionIndex] = useState(-1);
    /** @type {React.MutableRefObject<DrawIoEmbedRef | null>} */
    const drawioRef = useRef(null);
    /** @type {React.MutableRefObject<((value: string) => void) | null>} */
    const resolverRef = useRef(null);
    /** @type {React.MutableRefObject<boolean>} 标记当前导出操作是否应该保存到历史记录 */
    const expectHistoryExportRef = useRef(false);
    const exportTimeoutRef = useRef(null);
    const loadDiagramTimeoutRef = useRef(null);
    const [runtimeError, setRuntimeError] = useState(null);
    /** @type {React.MutableRefObject<{resolver: ((data: string) => void) | null, format: ExportFormat | null}>} 保存解析器引用 */
    const saveResolverRef = useRef({ resolver: null, format: null });
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    const handleExport = () => {
        if (drawioRef.current) {
            // 标记这次导出应该保存到历史记录
            expectHistoryExportRef.current = true;
            drawioRef.current.exportDiagram({
                format: "xmlsvg",
            });
        }
    };

    const handleExportWithoutHistory = () => {
        if (drawioRef.current) {
            // 导出但不保存到历史记录（用于内部操作）
            drawioRef.current.exportDiagram({
                format: "xmlsvg",
            });
        }
    };

    // 🚀 性能优化：使用防抖避免频繁加载 draw.io
    const loadDiagram = useCallback((chart, skipValidation = false) => {
        let xmlToLoad = chart;

        // XML 验证和修复（除非跳过验证，用于可信的历史快照）
        if (!skipValidation && chart) {
            // 这里可以添加验证逻辑，目前直接使用输入的 chart
            // const validation = validateAndFixXml(chart);
            // if (validation.fixed) xmlToLoad = validation.fixed;
        }

        if (loadDiagramTimeoutRef.current) {
            clearTimeout(loadDiagramTimeoutRef.current);
        }
        
        loadDiagramTimeoutRef.current = setTimeout(() => {
            if (drawioRef.current && xmlToLoad) {
                // 总是调用 load，让 draw.io 决定是否需要更新
                // 这样即使 XML 字符串相同，也能确保画布刷新
                drawioRef.current.load({
                    xml: xmlToLoad,
                });
            }
            loadDiagramTimeoutRef.current = null;
        }, 150); // 150ms 防抖，平衡流畅度和性能

        // 更新状态：同步 chartXML 状态
        if (xmlToLoad && xmlToLoad !== chartXML) {
            setChartXML(xmlToLoad);
        }
        
        return null; // 返回 null 表示成功
    }, [chartXML]);

    const handleDiagramExport = (data) => {
        // 优先处理文件保存请求（处理原始数据，在 XML 提取之前）
        if (saveResolverRef.current.resolver) {
            const format = saveResolverRef.current.format;
            saveResolverRef.current.resolver(data.data);
            saveResolverRef.current = { resolver: null, format: null };
            // PNG/SVG 格式不包含 XML，直接返回
            if (format === "png" || format === "svg") {
                return;
            }
        }

        const extractedXML = extractDiagramXML(data.data);
        setChartXML(extractedXML);
        setLatestSvg(data.data);

        // 只有在标记为需要保存历史时才保存到历史记录
        // 限制到 20 个条目以防止长时间会话中的内存泄漏
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

        // 解析任何等待中的 Promise
        if (resolverRef.current) {
            resolverRef.current(extractedXML);
            resolverRef.current = null;
        }
        if (exportTimeoutRef.current) {
            clearTimeout(exportTimeoutRef.current);
            exportTimeoutRef.current = null;
        }
    };

    const clearDiagram = () => {
        // 跳过验证，因为 EMPTY_MXFILE 是可信的内置模板
        loadDiagram(EMPTY_MXFILE, true);
        setLatestSvg("");
        setDiagramHistory([]);
        setActiveVersionIndex(-1);
    };

    const restoreDiagramAt = (index) => {
        const entry = diagramHistory[index];
        if (!entry) {
            return;
        }
        // 跳过验证，因为历史快照是可信的
        loadDiagram(entry.xml, true);
        setChartXML(entry.xml);
        setLatestSvg(entry.svg);
        setActiveVersionIndex(index);
    };

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
            
            // 根据选项决定是否保存到历史记录
            if (options?.saveHistory !== false) {
                handleExport(); // 会设置 expectHistoryExportRef.current = true
            } else {
                handleExportWithoutHistory(); // 不会保存到历史记录
            }
            
            if (exportTimeoutRef.current) {
                clearTimeout(exportTimeoutRef.current);
            }
            exportTimeoutRef.current = setTimeout(() => {
                if (resolverRef.current === resolve) {
                    resolverRef.current = null;
                    expectHistoryExportRef.current = false; // 重置标记
                    reject(
                        new Error(
                            "导出画布超时（10 秒无响应），请稍后重试。"
                        )
                    );
                }
            }, 10000);
        });
    };

    /**
     * 保存图表到文件
     * @param {string} filename - 文件名（不含扩展名）
     * @param {ExportFormat} format - 导出格式（drawio/png/svg）
     * @param {string} [sessionId] - 会话 ID（可选，用于日志记录）
     */
    const saveDiagramToFile = useCallback((filename, format, sessionId) => {
        if (!drawioRef.current) {
            console.warn("Draw.io 编辑器未就绪");
            return;
        }

        // 格式映射：drawio 格式使用 xmlsvg 导出格式
        const drawioFormat = format === "drawio" ? "xmlsvg" : format;

        // 设置保存解析器（在触发导出前设置回调函数）
        saveResolverRef.current = {
            resolver: (exportData) => {
                let fileContent;
                let mimeType;
                let extension;

                if (format === "drawio") {
                    // 从 SVG 中提取 XML（用于 .drawio 格式）
                    const xml = extractDiagramXML(exportData);
                    let xmlContent = xml;
                    // 确保有 mxfile 包装
                    if (!xml.includes("<mxfile")) {
                        xmlContent = `<mxfile><diagram name="Page-1" id="page-1">${xml}</diagram></mxfile>`;
                    }
                    fileContent = xmlContent;
                    mimeType = "application/xml";
                    extension = ".drawio";

                    // 同步保存到 localStorage
                    if (typeof window !== "undefined") {
                        try {
                            localStorage.setItem(LAST_XML_STORAGE_KEY, xmlContent);
                        } catch (error) {
                            console.warn("保存到 localStorage 失败:", error);
                        }
                    }
                } else if (format === "png") {
                    // PNG 数据已经是 base64 data URL
                    fileContent = exportData;
                    mimeType = "image/png";
                    extension = ".png";
                } else {
                    // SVG 格式
                    fileContent = exportData;
                    mimeType = "image/svg+xml";
                    extension = ".svg";
                }

                // 处理文件下载
                let url;
                if (typeof fileContent === "string" && fileContent.startsWith("data:")) {
                    // 已经是 data URL（PNG 格式）
                    url = fileContent;
                } else {
                    // 创建 Blob 对象
                    const blob = new Blob([fileContent], { type: mimeType });
                    url = URL.createObjectURL(blob);
                }

                // 创建隐藏的下载链接并触发下载
                const a = document.createElement("a");
                a.href = url;
                a.download = `${filename}${extension}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // 延迟清理 URL 对象以确保下载完成
                if (!url.startsWith("data:")) {
                    setTimeout(() => {
                        try {
                            URL.revokeObjectURL(url);
                        } catch (error) {
                            console.warn("清理 URL 对象失败:", error);
                        }
                    }, 100);
                }
            },
            format,
        };

        // 触发导出（回调将在 handleDiagramExport 中处理）
        drawioRef.current.exportDiagram({ format: drawioFormat });
    }, []);

    return (
        <DiagramContext.Provider
            value={{
                chartXML,
                latestSvg,
                diagramHistory,
                activeVersionIndex,
                loadDiagram,
                handleExport,
                handleExportWithoutHistory,
                resolverRef,
                drawioRef,
                handleDiagramExport,
                clearDiagram,
                restoreDiagramAt,
                fetchDiagramXml,
                runtimeError,
                setRuntimeError,
                saveDiagramToFile,
                showSaveDialog,
                setShowSaveDialog,
            }}
        >
            {children}
        </DiagramContext.Provider>
    );
}

export function useDiagram() {
    const context = useContext(DiagramContext);
    if (context === undefined) {
        throw new Error("useDiagram must be used within a DiagramProvider");
    }
    return context;
}
