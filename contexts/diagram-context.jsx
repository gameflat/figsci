"use client";

import React, {
    createContext,
    useContext,
    useRef,
    useState,
    useCallback,
} from "react";
import { extractDiagramXML } from "../lib/utils";
import { EMPTY_MXFILE } from "@/lib/diagram-templates.js";

/**
 * @typedef {import("react-drawio").DrawIoEmbedRef} DrawIoEmbedRef
 * @typedef {import("@/types/diagram").RuntimeErrorPayload} RuntimeErrorPayload
 * @typedef {{svg: string, xml: string}} DiagramHistoryEntry
 *
 * @typedef {Object} DiagramContextValue
 * @property {string} chartXML
 * @property {string} latestSvg
 * @property {DiagramHistoryEntry[]} diagramHistory
 * @property {number} activeVersionIndex
 * @property {(chart: string) => void} loadDiagram
 * @property {() => void} handleExport
 * @property {React.MutableRefObject<((value: string) => void) | null>} resolverRef
 * @property {React.MutableRefObject<DrawIoEmbedRef | null>} drawioRef
 * @property {(data: { data: string }) => void} handleDiagramExport
 * @property {() => void} clearDiagram
 * @property {(index: number) => void} restoreDiagramAt
 * @property {(options?: { saveHistory?: boolean }) => Promise<string>} fetchDiagramXml
 * @property {RuntimeErrorPayload | null} runtimeError
 * @property {React.Dispatch<React.SetStateAction<RuntimeErrorPayload | null>>} setRuntimeError
 */

/** @type {React.Context<DiagramContextValue | undefined>} */
const DiagramContext = createContext(undefined);

/**
 * @param {{ children: React.ReactNode }} props
 */
export function DiagramProvider({ children }) {
    const [chartXML, setChartXML] = useState("");
    const [latestSvg, setLatestSvg] = useState("");
    const [diagramHistory, setDiagramHistory] = useState([]);
    const [activeVersionIndex, setActiveVersionIndex] = useState(-1);
    /** @type {React.MutableRefObject<DrawIoEmbedRef | null>} */
    const drawioRef = useRef(null);
    /** @type {React.MutableRefObject<((value: string) => void) | null>} */
    const resolverRef = useRef(null);
    const saveHistoryRef = useRef(true);
    const exportTimeoutRef = useRef(null);
    const loadDiagramTimeoutRef = useRef(null);
    const [runtimeError, setRuntimeError] = useState(null);

    const handleExport = () => {
        if (drawioRef.current) {
            drawioRef.current.exportDiagram({
                format: "xmlsvg",
            });
        }
    };

    // 🚀 性能优化：使用防抖避免频繁加载 draw.io
    const loadDiagram = useCallback((chart) => {
        if (loadDiagramTimeoutRef.current) {
            clearTimeout(loadDiagramTimeoutRef.current);
        }
        
        loadDiagramTimeoutRef.current = setTimeout(() => {
            if (drawioRef.current) {
                drawioRef.current.load({
                    xml: chart,
                });
            }
            loadDiagramTimeoutRef.current = null;
        }, 150); // 150ms 防抖，平衡流畅度和性能
    }, []);

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

    const clearDiagram = () => {
        loadDiagram(EMPTY_MXFILE);
        setChartXML(EMPTY_MXFILE);
        setLatestSvg("");
        setDiagramHistory([]);
        setActiveVersionIndex(-1);
    };

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

    const fetchDiagramXml = (options = {}) => {
        return new Promise((resolve, reject) => {
            if (!drawioRef.current) {
                saveHistoryRef.current = true;
                reject(new Error("DrawIO 尚未初始化，暂时无法导出画布。"));
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

    return (
        <DiagramContext.Provider
            value={{
                chartXML,
                latestSvg,
                diagramHistory,
                activeVersionIndex,
                loadDiagram,
                handleExport,
                resolverRef,
                drawioRef,
                handleDiagramExport,
                clearDiagram,
                restoreDiagramAt,
                fetchDiagramXml,
                runtimeError,
                setRuntimeError,
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
