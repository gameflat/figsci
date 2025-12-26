"use client";

import React, {
    useMemo,
    useRef,
    useState,
    useEffect,
    useCallback,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Database, Zap, FileText, Shield, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Simple Switch component
/**
 * @param {{
 *   checked: boolean;
 *   onCheckedChange: (checked: boolean) => void;
 *   disabled?: boolean;
 *   onClick?: (e: React.MouseEvent) => void;
 * }} props
 */
function Switch({ 
    checked, 
    onCheckedChange, 
    disabled,
    onClick,
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
                onCheckedChange(!checked);
            }}
            className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                checked ? "bg-blue-600" : "bg-gray-300",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <span
                className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    checked ? "translate-x-5" : "translate-x-0.5"
                )}
            />
        </button>
    );
}

/**
 * @typedef {Object} GroupedModelOptions
 * @property {string} endpointId
 * @property {string} endpointName
 * @property {string} providerHint
 * @property {import("@/types/model-config").RuntimeModelOption[]} items
 */

/**
 * @typedef {Object} ArchitectWorkflowConfig
 * @property {boolean} enabled
 * @property {import("@/types/model-config").RuntimeModelOption | null} architectModel
 * @property {import("@/types/model-config").RuntimeModelOption | null} rendererModel
 */

/**
 * @typedef {Object} ModelSelectorProps
 * @property {string} [selectedModelKey]
 * @property {(modelKey: string) => void} onModelChange
 * @property {import("@/types/model-config").RuntimeModelOption[]} models
 * @property {boolean} [disabled]
 * @property {(modelKey: string, isStreaming: boolean) => void} [onModelStreamingChange]
 * @property {boolean} [compact]
 * @property {ArchitectWorkflowConfig} [architectWorkflowConfig]
 * @property {(config: ArchitectWorkflowConfig) => void} [onArchitectWorkflowConfigChange]
 */

/**
 * @param {ModelSelectorProps} props
 */
export function ModelSelector({
    selectedModelKey,
    onModelChange,
    models,
    disabled = false,
    onModelStreamingChange,
    compact = false,
    architectWorkflowConfig,
    onArchitectWorkflowConfigChange,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);
    const [isMounted, setIsMounted] = useState(false);
    const [menuPosition, setMenuPosition] = useState(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const updateMenuPosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const menuWidth = Math.max(rect.width, 280);
        const viewportWidth = window.innerWidth;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        
        // 计算菜单的右边界位置
        const menuRight = rect.left + menuWidth;
        
        // 如果菜单会超出右边界，调整 left 位置使其右对齐到触发器
        let left = rect.left + scrollX;
        if (menuRight > viewportWidth) {
            // 右对齐：菜单右边界对齐到触发器右边界
            left = rect.right + scrollX - menuWidth;
            // 确保不会超出左边界
            if (left < scrollX) {
                left = scrollX + 8; // 留出 8px 的边距
            }
        }
        
        setMenuPosition({
            top: rect.top + scrollY,
            left: left,
            width: menuWidth,
        });
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            const target = event.target;
            console.log('[ModelSelector] Click outside detected:', {
                target,
                triggerContains: triggerRef.current?.contains(target),
                dropdownContains: dropdownRef.current?.contains(target),
                isOpen
            });
            if (
                triggerRef.current?.contains(target) ||
                dropdownRef.current?.contains(target)
            ) {
                return;
            }
            console.log('[ModelSelector] Closing dropdown');
            setIsOpen(false);
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        updateMenuPosition();
        const handleWindowChange = () => updateMenuPosition();
        window.addEventListener("resize", handleWindowChange);
        window.addEventListener("scroll", handleWindowChange, true);
        return () => {
            window.removeEventListener("resize", handleWindowChange);
            window.removeEventListener("scroll", handleWindowChange, true);
        };
    }, [isOpen, updateMenuPosition]);

    const groupedModels = useMemo(() => {
        const map = new Map();
        // 分离系统模型和自定义模型
        const systemModels = models.filter((m) => m.isSystemModel);
        const customModels = models.filter((m) => !m.isSystemModel);
        
        // 先添加系统模型组
        if (systemModels.length > 0) {
            map.set("system", {
                endpointId: "system",
                endpointName: "系统内置",
                providerHint: "免配置",
                isSystem: true,
                items: systemModels,
            });
        }
        
        // 再添加自定义模型组
        customModels.forEach((model) => {
            if (!map.has(model.endpointId)) {
                map.set(model.endpointId, {
                    endpointId: model.endpointId,
                    endpointName: model.endpointName,
                    providerHint: model.providerHint,
                    isSystem: false,
                    items: [],
                });
            }
            map.get(model.endpointId)?.items.push(model);
        });
        return Array.from(map.values());
    }, [models]);

    const selectedModel = useMemo(
        () => models.find((model) => model.key === selectedModelKey),
        [models, selectedModelKey]
    );

    const handleSelect = (modelKey) => {
        console.log('[ModelSelector] handleSelect called:', modelKey);
        onModelChange(modelKey);
        setIsOpen(false);
    };

    const buttonLabel = selectedModel
        ? `${selectedModel.label || selectedModel.modelId}`
        : "配置模型";

    const isStreaming = selectedModel?.isStreaming ?? false;

    return (
        <div className="relative">
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                    console.log('[ModelSelector] Trigger clicked, current isOpen:', isOpen);
                    e.stopPropagation();
                    setIsOpen((prev) => !prev);
                }}
                disabled={disabled}
                ref={triggerRef}
                className={cn(
                    "justify-between rounded-full border-slate-200 font-semibold text-slate-700 hover:border-slate-300",
                    compact
                        ? "h-[30px] min-w-[110px] px-2.5 text-[11px]"
                        : "h-8 min-w-[120px] px-3 text-xs",
                    !selectedModel && "text-slate-400"
                )}
            >
                <span className="flex items-center gap-2 truncate">
                    {!selectedModel && <Database className="h-3.5 w-3.5" />}
                    {selectedModel && (
                        selectedModel.isSystemModel ? (
                            <span title="系统内置模型">
                                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                            </span>
                        ) : isStreaming ? (
                            <span title="流式输出">
                                <Zap className="h-3.5 w-3.5 text-blue-500" />
                            </span>
                        ) : (
                            <span title="普通输出">
                                <FileText className="h-3.5 w-3.5 text-slate-400" />
                            </span>
                        )
                    )}
                    <span className="truncate max-w-[120px]">{buttonLabel}</span>
                </span>
                <ChevronDown className="ml-1 h-3 w-3 shrink-0" />
            </Button>

            {isMounted &&
                isOpen &&
                menuPosition &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className="z-[9999] pointer-events-auto"
                        style={{
                            position: "absolute",
                            top: menuPosition.top,
                            left: menuPosition.left,
                            width: Math.max(menuPosition.width, 280),
                            transform: "translateY(calc(-100% - 8px))",
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <div className="w-full rounded-2xl border border-slate-100 bg-white/95 shadow-xl">
                            {models.length === 0 ? (
                                <div className="p-4 text-sm text-slate-500">
                                    暂无可用模型，请先完成接口配置。
                                    <div className="mt-3 text-xs text-slate-400">
                                        暂无可用模型
                                    </div>
                                </div>
                            ) : (
                                <div className="max-h-80 overflow-y-auto py-2">
                                    {groupedModels.map((group) => (
                                        <div key={group.endpointId} className="py-1">
                                            <div className={cn(
                                                "px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]",
                                                group.isSystem ? "text-emerald-600" : "text-slate-400"
                                            )}>
                                                <span className="flex items-center gap-1.5">
                                                    {group.isSystem ? (
                                                        <Shield className="h-3 w-3" />
                                                    ) : (
                                                        <User className="h-3 w-3" />
                                                    )}
                                                    {group.endpointName}
                                                </span>
                                                <span className={cn(
                                                    "ml-1 text-[10px] uppercase",
                                                    group.isSystem ? "text-emerald-400" : "text-slate-300"
                                                )}>
                                                    {group.providerHint}
                                                </span>
                                            </div>
                                            {group.items.map((model) => (
                                                <div
                                                    key={model.key}
                                                    className={cn(
                                                        "flex w-full flex-col items-start gap-2 px-4 py-2 text-left text-sm transition hover:bg-slate-50",
                                                        selectedModelKey === model.key &&
                                                            "bg-slate-900/5",
                                                        model.isSystemModel && "border-l-2 border-emerald-200"
                                                    )}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleSelect(model.key);
                                                        }}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                        }}
                                                        className="flex w-full items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {model.isSystemModel ? (
                                                                <span title="系统内置模型" className="flex items-center">
                                                                    <Shield className="h-3.5 w-3.5 text-emerald-500" />
                                                                </span>
                                                            ) : model.isStreaming ? (
                                                                <span title="流式输出">
                                                                    <Zap className="h-3.5 w-3.5 text-blue-500" />
                                                                </span>
                                                            ) : (
                                                                <span title="普通输出">
                                                                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                                                                </span>
                                                            )}
                                                            <span className="font-medium text-slate-900">
                                                                {model.label || model.modelId}
                                                            </span>
                                                            {model.isSystemModel && (
                                                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                                                    免配置
                                                                </span>
                                                            )}
                                                        </div>
                                                        {selectedModelKey === model.key && (
                                                            <Check className="h-4 w-4 text-slate-900" />
                                                        )}
                                                    </button>
                                                    <div className="ml-5 text-xs font-mono text-slate-400">
                                                        {model.modelId}
                                                    </div>
                                                    {/* 系统模型显示描述 */}
                                                    {model.isSystemModel && model.description && (
                                                        <div className="ml-5 text-xs text-slate-500">
                                                            {model.description}
                                                        </div>
                                                    )}
                                                    {/* 流式输出开关（仅自定义模型显示） */}
                                                    {!model.isSystemModel && onModelStreamingChange && (
                                                        <div className="ml-5 flex items-center gap-2 text-xs">
                                                            <span className="text-slate-600">流式输出:</span>
                                                            <Switch
                                                                checked={model.isStreaming ?? false}
                                                                onCheckedChange={(checked) => {
                                                                    onModelStreamingChange(model.key, checked);
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                }}
                                                            />
                                                            <span className="text-slate-400">
                                                                {model.isStreaming ? '开启' : '关闭'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {architectWorkflowConfig && onArchitectWorkflowConfigChange && (
                                <div className="border-t border-slate-100 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold text-slate-900">
                                                    智能体模式
                                                </div>
                                                <div className="text-[11px] text-slate-500 truncate">
                                                    启用两阶段智能体工作流（The Architect + The Renderer）
                                                </div>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={architectWorkflowConfig.enabled}
                                            onCheckedChange={(checked) => {
                                                onArchitectWorkflowConfigChange({
                                                    ...architectWorkflowConfig,
                                                    enabled: checked,
                                                });
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}

