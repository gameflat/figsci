"use client";

import React, { useCallback, useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResetWarningModal } from "@/components/reset-warning-modal";
import {
    Loader2,
    Send,
    RotateCcw,
    History,
    Settings,
    Square,
} from "lucide-react";
import { ButtonWithTooltip } from "@/components/button-with-tooltip";
import { FilePreviewList } from "@/components/file-preview-list";
import { HistoryDialog } from "@/components/history-dialog";
import { ModelSelector } from "@/components/model-selector";
import { cn } from "@/lib/utils";
import { RenderModeToggle } from "@/components/render-mode-toggle";

/**
 * @typedef {Object} ChatInputOptimizedProps
 * @property {string} input
 * @property {"submitted" | "streaming" | "ready" | "error"} status
 * @property {(e: React.FormEvent<HTMLFormElement>) => void} onSubmit
 * @property {(e: React.ChangeEvent<HTMLTextAreaElement>) => void} onChange
 * @property {() => void} onClearChat
 * @property {File[]} [files]
 * @property {(files: File[]) => void} [onFileChange]
 * @property {boolean} [showHistory]
 * @property {(show: boolean) => void} [onToggleHistory]
 * @property {boolean} [isCompactMode]
 * @property {string} [selectedModelKey]
 * @property {import("@/types/model-config").RuntimeModelOption[]} [modelOptions]
 * @property {(modelKey: string) => void} [onModelChange]
 * @property {() => void} [onManageModels]
 * @property {() => void} [onCompareRequest]
 * @property {() => void} [onOpenComparisonConfig]
 * @property {boolean} [isCompareLoading]
 * @property {boolean} [interactionLocked]
 * @property {(modelKey: string, isStreaming: boolean) => void} [onModelStreamingChange]
 * @property {"drawio" | "svg"} [renderMode]
 * @property {(mode: "drawio" | "svg") => void} [onRenderModeChange]
 * @property {boolean} [comparisonEnabled]
 * @property {() => void} [onStop]
 * @property {boolean} [isBusy]
 * @property {Array<{ svg: string }>} [historyItems]
 * @property {(index: number) => void} [onRestoreHistory]
 */

/**
 * @param {ChatInputOptimizedProps} props
 */
export function ChatInputOptimized({
    input,
    status,
    onSubmit,
    onChange,
    onClearChat,
    files = [],
    onFileChange = () => { },
    showHistory = false,
    onToggleHistory = () => { },
    isCompactMode = false,
    selectedModelKey,
    modelOptions = [],
    onModelChange = () => { },
    onManageModels,
    onCompareRequest = () => { },
    onOpenComparisonConfig = () => { },
    isCompareLoading = false,
    interactionLocked = false,
    onModelStreamingChange,
    renderMode = "drawio",
    onRenderModeChange,
    comparisonEnabled = true,
    onStop,
    isBusy = false,
    historyItems = [],
    onRestoreHistory,
}) {
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const controlBarRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [isRenderModeIconOnly, setIsRenderModeIconOnly] = useState(false);
    const [shouldHideModelSelector, setShouldHideModelSelector] = useState(false);

    const MAX_VISIBLE_LINES = 5;
    const RENDER_MODE_ICON_BREAKPOINT = 460;
    const MODEL_SELECTOR_HIDE_BREAKPOINT = 400;

    // Auto-resize textarea based on content
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            const lineHeight =
                parseFloat(window.getComputedStyle(textarea).lineHeight || "24") ||
                24;
            const maxHeight = lineHeight * MAX_VISIBLE_LINES;
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
        }
    }, []);

    useEffect(() => {
        adjustTextareaHeight();
    }, [input, adjustTextareaHeight]);

    // Handle keyboard shortcuts and paste events
    const handleKeyDown = (e) => {
        // Enter: 发送消息（阻止默认换行行为）
        // Shift+Enter: 换行（允许默认行为，不处理）
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const form = e.currentTarget.closest("form");
            if (form && input.trim() && status !== "streaming") {
                form.requestSubmit();
            }
        }
    };

    // Handle clipboard paste
    const handlePaste = async (e) => {
        if (status === "streaming") return;

        const items = e.clipboardData.items;
        const imageItems = Array.from(items).filter((item) =>
            item.type.startsWith("image/")
        );

        if (imageItems.length > 0) {
            const imageFiles = await Promise.all(
                imageItems.map(async (item) => {
                    const file = item.getAsFile();
                    if (!file) return null;
                    // Create a new file with a unique name
                    return new File(
                        [file],
                        `pasted-image-${Date.now()}.${file.type.split("/")[1]}`,
                        {
                            type: file.type,
                        }
                    );
                })
            );

            const validFiles = imageFiles.filter(
                (file) => file !== null
            );
            if (validFiles.length > 0) {
                onFileChange([...files, ...validFiles]);
            }
        }
    };

    // Handle file changes
    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files || []);
        onFileChange([...files, ...newFiles]);
    };

    // Remove individual file
    const handleRemoveFile = (fileToRemove) => {
        onFileChange(files.filter((file) => file !== fileToRemove));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleRemoveAllFiles = () => {
        if (files.length === 0) return;
        onFileChange([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Trigger file input click
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    // Handle drag events
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (status === "streaming") return;

        const droppedFiles = e.dataTransfer.files;

        // Only process image files
        const imageFiles = Array.from(droppedFiles).filter((file) =>
            file.type.startsWith("image/")
        );

        if (imageFiles.length > 0) {
            onFileChange([...files, ...imageFiles]);
        }
    };

    // Handle clearing conversation and diagram
    const handleClear = () => {
        onClearChat();
        setShowClearDialog(false);
    };

    // 监听底部工具栏宽度，窄屏时收起文字与模型选择
    useEffect(() => {
        const container = controlBarRef.current;
        if (!container || typeof ResizeObserver === "undefined") return;

        const updateFlags = (width) => {
            const compactRenderToggle = width < RENDER_MODE_ICON_BREAKPOINT;
            const hideModelPicker = width < MODEL_SELECTOR_HIDE_BREAKPOINT;

            setIsRenderModeIconOnly((prev) =>
                prev === compactRenderToggle ? prev : compactRenderToggle
            );
            setShouldHideModelSelector((prev) =>
                prev === hideModelPicker ? prev : hideModelPicker
            );
        };

        updateFlags(container.getBoundingClientRect().width);

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            updateFlags(entry.contentRect.width);
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, []);

    return (
        <form
            onSubmit={onSubmit}
            className="w-full"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div
                className={cn(
                    "relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm transition-all",
                    isDragging && "ring-2 ring-slate-300"
                )}
            >
                {files.length > 0 && (
                    <div className="flex flex-col gap-1 border-b border-slate-200/80 px-3 py-2">
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
                                {files.length} 个附件
                            </span>
                            <button
                                type="button"
                                onClick={handleRemoveAllFiles}
                                className="rounded-full px-2 py-0.5 text-[11px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            >
                                移除全部
                            </button>
                        </div>
                        <FilePreviewList
                            files={files}
                            onRemoveFile={handleRemoveFile}
                            variant="chip"
                        />
                    </div>
                )}

                <div className="px-3 py-2">
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={onChange}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder="描述你想让流程图如何调整，支持拖拽或粘贴图片作为参考素材"
                        disabled={status === "streaming"}
                        aria-label="聊天输入框"
                        className="h-auto min-h-[48px] resize-none border-0 !border-none bg-transparent p-0 text-sm leading-5 text-slate-900 outline-none shadow-none focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:!border-none focus-visible:!outline-none focus-visible:shadow-none"
                    />
                </div>

                <div
                    ref={controlBarRef}
                    className="flex flex-nowrap items-center gap-2 px-3 pt-1 pb-1.5 overflow-hidden"
                >
                    <div className="flex items-center gap-1.5 flex-shrink-0 mr-2">
                        <ButtonWithTooltip
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-[30px] w-[30px] rounded-full flex-shrink-0"
                            onClick={() => setShowClearDialog(true)}
                            tooltipContent="清空当前对话与图表"
                            disabled={status === "streaming"}
                        >
                            <RotateCcw className="h-4 w-4" />
                        </ButtonWithTooltip>

                        <ButtonWithTooltip
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-[30px] w-[30px] rounded-full flex-shrink-0"
                            onClick={() => onToggleHistory(true)}
                            disabled={
                                status === "streaming" ||
                                historyItems.length === 0 ||
                                interactionLocked
                            }
                            tooltipContent="查看图表变更记录"
                        >
                            <History className="h-4 w-4" />
                        </ButtonWithTooltip>
                    </div>

                    <div className="flex flex-nowrap items-center gap-2 flex-1 min-w-0 justify-end">
                        <div className="flex-shrink-0">
                            <RenderModeToggle
                                value={renderMode}
                                onChange={onRenderModeChange}
                                disabled={status === "streaming" || interactionLocked}
                                iconOnly={isRenderModeIconOnly}
                            />
                        </div>
                        {!shouldHideModelSelector && (
                            <ModelSelector
                                selectedModelKey={selectedModelKey}
                                onModelChange={onModelChange}
                                models={modelOptions}
                                onManage={onManageModels}
                                disabled={status === "streaming" || interactionLocked}
                                onModelStreamingChange={onModelStreamingChange}
                                compact
                            />
                        )}
                        {comparisonEnabled ? (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {isBusy ? (
                                    <Button
                                        type="button"
                                        onClick={onStop}
                                        className="h-[30px] min-w-[30px] gap-2 rounded-full bg-red-500 text-white text-[11px] shadow-sm transition hover:bg-red-600 flex-shrink-0"
                                        size="sm"
                                        aria-label="暂停生成"
                                    >
                                        <Square className="h-3.5 w-3.5 fill-current" />
                                    </Button>
                                ) : (
                                    <>
                                        {/* 只保留设置按钮，删除对比按钮 */}
                                        <ButtonWithTooltip
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-[30px] w-[30px] rounded-full flex-shrink-0"
                                            onClick={onOpenComparisonConfig}
                                            disabled={status === "streaming" || interactionLocked}
                                            tooltipContent="模型设置"
                                        >
                                            <Settings className="h-4 w-4" />
                                        </ButtonWithTooltip>
                                        <Button
                                            type="submit"
                                            disabled={
                                                status === "streaming" ||
                                                !input.trim() ||
                                                interactionLocked
                                            }
                                            className="h-[30px] w-[30px] gap-2 rounded-full bg-slate-900 text-white text-[11px] shadow-sm transition hover:bg-slate-900/90 disabled:opacity-60 flex-shrink-0"
                                            size="sm"
                                            aria-label="发送消息"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        ) : (
                            isBusy ? (
                                <Button
                                    type="button"
                                    onClick={onStop}
                                    className="h-[30px] min-w-[30px] gap-2 rounded-full bg-red-500 text-white text-[11px] shadow-sm transition hover:bg-red-600"
                                    size="sm"
                                    aria-label="暂停生成"
                                >
                                    <Square className="h-3.5 w-3.5 fill-current" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={
                                        status === "streaming" ||
                                        !input.trim() ||
                                        interactionLocked
                                    }
                                    className="h-[30px] min-w-[78px] gap-2 rounded-full bg-slate-900 text-white text-[11px] shadow-sm transition hover:bg-slate-900/90 disabled:opacity-60"
                                    size="sm"
                                    aria-label="发送消息"
                                >
                                    <Send className="h-4 w-4" />
                                    发送
                                </Button>
                            )
                        )}
                    </div>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
                multiple
                disabled={status === "streaming" || interactionLocked}
            />

            <ResetWarningModal
                open={showClearDialog}
                onOpenChange={setShowClearDialog}
                onClear={handleClear}
            />

            <HistoryDialog
                showHistory={showHistory}
                onToggleHistory={onToggleHistory}
                items={historyItems}
                onRestore={onRestoreHistory}
            />
        </form>
    );
}

