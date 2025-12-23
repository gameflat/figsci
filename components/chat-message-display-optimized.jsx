"use client";
import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn, convertToLegalXml } from "@/lib/utils";
import { svgToDataUrl } from "@/lib/svg";
import ExamplePanel from "./chat-example-panel";
import { TokenUsageDisplay } from "./token-usage-display";
import { FloatingProgressIndicator } from "./generation-progress-indicator";
import { useDiagram } from "@/contexts/diagram-context";
// StreamingThoughtDisplay 已弃用，改用 FloatingProgressIndicator 以支持完成状态保持显示
// import { StreamingThoughtDisplay } from "./streaming-thought-display";
const LARGE_TOOL_INPUT_CHAR_THRESHOLD = 3e3;

/**
 * 检测并提取消息文本中的 XML 代码块
 * 当 LLM 没有正确调用 tool-calls 时，它可能会以文本形式输出 XML
 * 此函数尝试从文本中提取有效的 draw.io XML 代码
 * 
 * @param {string} text - 消息文本内容
 * @returns {{ xml: string | null, hasXmlBlock: boolean }} 提取的 XML 和是否检测到代码块
 */
const detectAndExtractXml = (text) => {
  if (!text || typeof text !== "string") {
    return { xml: null, hasXmlBlock: false };
  }
  
  // 模式 1：匹配 ```xml ... ``` 格式的代码块
  const xmlBlockMatch = text.match(/```xml\s*([\s\S]*?)```/i);
  if (xmlBlockMatch && xmlBlockMatch[1]) {
    const extracted = xmlBlockMatch[1].trim();
    // 验证是否包含 draw.io 特有的结构
    if (extracted.includes("<root>") || extracted.includes("<mxCell") || extracted.includes("<mxGraphModel")) {
      return { xml: extracted, hasXmlBlock: true };
    }
  }
  
  // 模式 2：匹配独立的 <root>...</root> 结构
  const rootMatch = text.match(/<root>[\s\S]*<\/root>/);
  if (rootMatch && rootMatch[0]) {
    return { xml: rootMatch[0], hasXmlBlock: true };
  }
  
  // 模式 3：匹配 <mxGraphModel>...</mxGraphModel> 结构
  const mxGraphMatch = text.match(/<mxGraphModel[\s\S]*<\/mxGraphModel>/);
  if (mxGraphMatch && mxGraphMatch[0]) {
    return { xml: mxGraphMatch[0], hasXmlBlock: true };
  }
  
  return { xml: null, hasXmlBlock: false };
};
const CHAR_COUNT_FORMATTER = new Intl.NumberFormat("zh-CN");
const DIAGRAM_GENERATION_TIMEOUT_MS = 3e5;

/**
 * 将生成阶段映射到流式思考显示组件的状态
 * 
 * @param {string} phase - 生成阶段
 * @returns {string} 思考状态
 */
const mapPhaseToStatus = (phase) => {
  switch (phase) {
    case "preparing":
    case "sending":
    case "thinking":
      return "thinking";
    case "generating":
      return "generating";
    case "idle":
    default:
      return "idle";
  }
};
const DiagramToolCard = memo(({
  part,
  onCopy,
  onStopAll,
  isGenerationBusy,
  isComparisonRunning,
  diagramResult,
  onStreamingApply,
  onRetry,
  messageMetadata
}) => {
  const { loadDiagram } = useDiagram();
  const callId = part.toolCallId;
  const { state, input, output } = part;
  const toolName = part.type?.replace("tool-", "") || "display_diagram";
  const [copiedKind, setCopiedKind] = useState(null);
  const [toolCallError, setToolCallError] = useState(null);
  const previousXmlRef = useRef("");
  const [localState, setLocalState] = useState(state || "pending");
  const [autoCompletedByStreamEnd, setAutoCompletedByStreamEnd] = useState(false);
  const [showTimeoutHint, setShowTimeoutHint] = useState(false);
  const streamingStartTimeRef = useRef(null);
  const diagramMode = diagramResult?.mode ?? (toolName === "display_svg" ? "svg" : "drawio");
  const displaySvg = diagramResult?.svg || (typeof input?.svg === "string" ? input.svg : null);
  const displayDiagramXml = diagramResult?.xml || (typeof input?.xml === "string" ? input.xml : null);
  useEffect(() => {
    if (state) {
      setLocalState(state);
      if (state !== "input-streaming") {
        setShowTimeoutHint(false);
        streamingStartTimeRef.current = null;
      }
    }
  }, [state]);
  useEffect(() => {
    if (localState === "input-streaming" && streamingStartTimeRef.current === null) {
      streamingStartTimeRef.current = Date.now();
    }
  }, [localState]);
  useEffect(() => {
    if (localState !== "input-streaming" || !streamingStartTimeRef.current) {
      return;
    }
    const timer = setTimeout(() => {
      const elapsed = Date.now() - (streamingStartTimeRef.current || 0);
      if (elapsed >= DIAGRAM_GENERATION_TIMEOUT_MS && localState === "input-streaming") {
        setShowTimeoutHint(true);
      }
    }, DIAGRAM_GENERATION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [localState]);
  useEffect(() => {
    if (!isGenerationBusy && !isComparisonRunning && localState === "input-streaming" && displayDiagramXml && displayDiagramXml.length > 0) {
      setLocalState("output-available");
      setAutoCompletedByStreamEnd(true);
    }
  }, [isGenerationBusy, isComparisonRunning, localState, displayDiagramXml]);
  useEffect(() => {
    if (diagramMode !== "svg" && localState === "input-streaming" && displayDiagramXml && displayDiagramXml !== previousXmlRef.current && onStreamingApply) {
      previousXmlRef.current = displayDiagramXml;
      onStreamingApply(displayDiagramXml, callId);
    }
  }, [diagramMode, localState, displayDiagramXml, callId, onStreamingApply]);
  const handleCopyClick = useCallback(async () => {
    if (!displayDiagramXml) return;
    await onCopy(displayDiagramXml, callId);
    setCopiedKind("xml");
    setTimeout(() => setCopiedKind(null), 2e3);
  }, [displayDiagramXml, callId, onCopy]);
  const handleCopySvgClick = useCallback(async () => {
    if (!displaySvg) return;
    await onCopy(displaySvg, callId);
    setCopiedKind("svg");
    setTimeout(() => setCopiedKind(null), 2e3);
  }, [displaySvg, callId, onCopy]);
  const handleStopClick = useCallback(() => {
    if (onStopAll) {
      setLocalState("stopped");
      onStopAll();
    }
  }, [onStopAll]);
  const handleRetryClick = useCallback(() => {
    if (onRetry) {
      setLocalState("pending");
      setToolCallError(null);
      setAutoCompletedByStreamEnd(false);
      setShowTimeoutHint(false);
      streamingStartTimeRef.current = null;
      onRetry();
    }
  }, [onRetry]);
  const handleManualComplete = useCallback(() => {
    if (displayDiagramXml && displayDiagramXml.length > 0) {
      setLocalState("output-available");
      setAutoCompletedByStreamEnd(true);
      setShowTimeoutHint(false);
    }
  }, [displayDiagramXml]);
  // 确定实际显示的状态：如果还在生成中（isGenerationBusy），即使状态是 output-available 也应该显示为生成中
  const actualState = (() => {
    const baseState = localState || state;
    
    // 如果整体生成流程仍在进行中
    if (isGenerationBusy || isComparisonRunning) {
      // 除非是明确的错误或停止状态，否则显示为"生成中"
      // 这样可以避免在 LLM 还在输出时就显示"已完成"
      if (baseState !== "output-error" && baseState !== "stopped") {
        return "input-streaming";
      }
    }
    
    return baseState;
  })();
  const currentState = actualState;
  const statusLabel = currentState === "output-available" ? "已完成" : currentState === "output-error" ? "生成失败" : currentState === "input-streaming" ? "生成中" : currentState === "stopped" ? "已暂停" : currentState || "等待中";
  const statusClass = cn(
    "rounded-full border px-2 py-0.5 text-[11px] font-medium",
    currentState === "output-available" && "border-emerald-200 bg-emerald-50 text-emerald-700",
    (currentState === "output-error" || toolCallError) && "border-red-200 bg-red-50 text-red-700",
    currentState === "input-streaming" && "border-blue-200 bg-blue-50 text-blue-700",
    currentState === "stopped" && "border-amber-200 bg-amber-50 text-amber-700",
    currentState !== "output-available" && currentState !== "output-error" && currentState !== "input-streaming" && currentState !== "stopped" && "border-slate-200 bg-slate-50 text-slate-500"
  );
  const statusMessage = (() => {
    if (toolCallError) return toolCallError;
    if (currentState === "output-error") {
      return output || "图表生成失败，请修改提示词或重新上传素材后重试。";
    }
    if (currentState === "stopped") {
      return "图表生成已暂停，可以点击「重新生成」继续。";
    }
    if (currentState === "output-available") {
      if (autoCompletedByStreamEnd) {
        return "流式输出已结束，图表已自动应用到画布。";
      }
      return "图表生成完成，已实时渲染到画布。";
    }
    if (currentState === "input-streaming") {
      return "AI 正在生成图表，画布实时更新中…";
    }
    return "等待模型输出图表内容…";
  })();
  // 根据状态动态生成标题
  const cardTitle = (() => {
    if (toolName !== "display_diagram" && toolName !== "display_svg") {
      return "工具执行完成";
    }
    if (currentState === "input-streaming") {
      return "图表生成中";
    }
    if (currentState === "output-available") {
      return "图表生成完成";
    }
    if (currentState === "output-error") {
      return "图表生成失败";
    }
    if (currentState === "stopped") {
      return "图表生成已暂停";
    }
    return "图表生成中";
  })();
  return <div
    className="my-2 w-full max-w-[min(720px,90%)] rounded-lg bg-white/80 border border-slate-200/60 px-4 py-3 text-xs text-slate-600"
  >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {cardTitle}
                    </div>
                </div>
                <span className={statusClass}>{statusLabel}</span>
            </div>
            <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-[13px] leading-relaxed text-slate-700">
                {statusMessage}
            </div>
            {/* 在图表生成完成时显示缩略图 */}
            {currentState === "output-available" && diagramResult && (diagramResult.svg || diagramResult.xml) && (
                <div className="mt-3">
                    <div className="text-xs text-slate-600 mb-2">点击缩略图恢复到画布：</div>
                    <div 
                        className="relative w-full h-32 bg-white border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:border-slate-300 transition-colors"
                        onClick={() => {
                            if (diagramResult.xml) {
                                // 跳过验证，因为这是可信的图表数据
                                loadDiagram(diagramResult.xml, true);
                            }
                        }}
                    >
                        {diagramResult.svg && (
                            <Image
                                src={diagramResult.svg}
                                alt="图表缩略图"
                                fill
                                className="object-contain p-2"
                                sizes="(max-width: 768px) 100vw, 400px"
                                unoptimized
                            />
                        )}
                        {!diagramResult.svg && diagramResult.xml && (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
                                点击恢复图表
                            </div>
                        )}
                    </div>
                </div>
            )}
            {diagramMode === "svg" && currentState === "output-available" && displaySvg && <div className="mt-2">
                    <details className="group">
                        <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700">
                            <svg className="h-3.5 w-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            查看 SVG 预览
                        </summary>
                        <div className="mt-2 rounded-lg border border-slate-100 bg-white/90 p-2">
                            <div className="relative h-48 w-full overflow-hidden rounded-lg bg-slate-50">
                                {svgToDataUrl(displaySvg) ? <Image
    src={svgToDataUrl(displaySvg)}
    alt={`svg-preview-${callId}`}
    fill
    className="object-contain"
    sizes="(max-width: 768px) 100vw, 320px"
    unoptimized
  /> : null}
                                {!svgToDataUrl(displaySvg) && <div
    className="absolute inset-0 overflow-auto p-2 text-xs text-slate-700"
    dangerouslySetInnerHTML={{ __html: displaySvg }}
  />}
                            </div>
                        </div>
                    </details>
                </div>}
            {
    /* 超时提示 */
  }
            {showTimeoutHint && currentState === "input-streaming" && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <div className="flex items-start gap-2">
                        <svg className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <div className="font-medium">长时间无响应</div>
                            <div className="mt-0.5 text-amber-700">
                                流式输出可能已结束，但状态未更新。如果画布已显示图表，可以点击下方按钮应用当前结果。
                            </div>
                        </div>
                    </div>
                </div>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
                {currentState === "input-streaming" && <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                        <span>实时渲染中</span>
                    </div>}
                {(currentState === "stopped" || currentState === "output-error") && onRetry && <button
    type="button"
    onClick={handleRetryClick}
    className="inline-flex items-center rounded-full border border-slate-900 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
  >
                        重新生成
                    </button>}
                {displayDiagramXml && diagramMode === "drawio" && <button
    type="button"
    onClick={handleCopyClick}
    className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
  >
                        {copiedKind === "xml" ? "已复制 XML" : "复制 XML"}
                    </button>}
                {displaySvg && <button
    type="button"
    onClick={handleCopySvgClick}
    className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
  >
                        {copiedKind === "svg" ? "已复制 SVG" : "复制 SVG"}
                    </button>}
                {currentState === "input-streaming" && onStopAll && <button
    type="button"
    onClick={handleStopClick}
    className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100"
  >
                        暂停生成
                    </button>}
                {
    /* 超时手动完成按钮 */
  }
                {showTimeoutHint && currentState === "input-streaming" && displayDiagramXml && <button
    type="button"
    onClick={handleManualComplete}
    className="inline-flex items-center rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
  >
                        应用当前图表
                    </button>}
            </div>
            {
    /* Token 使用信息显示 - 仅在完成时显示 (已隐藏以节省空间) */
  }
            {
    /* {currentState === "output-available" && messageMetadata && (
        <div className="mt-3">
            <TokenUsageDisplay
                usage={messageMetadata.usage}
                durationMs={messageMetadata.durationMs}
                compact
            />
        </div>
    )} */
  }
        </div>;
});
DiagramToolCard.displayName = "DiagramToolCard";
function ChatMessageDisplay({
  messages,
  error,
  setInput,
  setFiles,
  onDisplayDiagram,
  onMessageRevert,
  activeBranchId,
  onOpenBriefPanel,
  briefBadges,
  briefSummary,
  runtimeDiagramError,
  onConsumeRuntimeError,
  onStopAll,
  onRetryGeneration,
  isGenerationBusy = false,
  diagramResultVersion = 0,
  getDiagramResult,
  generationPhase = "idle",
  onProgressReset,
}) {
  const messagesEndRef = useRef(null);
  const [expandedTools, setExpandedTools] = useState({});
  const [expandedMessages, setExpandedMessages] = useState({});
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  
  // 跟踪已自动应用 XML 的消息 ID，避免重复应用
  const autoAppliedXmlMessagesRef = useRef(new Set());
  
  // Bug 3 修复：编辑确认对话框状态
  // 存储待编辑的消息信息，用于确认对话框显示
  const [pendingEditMessage, setPendingEditMessage] = useState(null);
  
  // 处理编辑确认：用户点击"编辑"按钮后显示确认对话框
  const handleEditClick = useCallback((messageId, text, messageIndex) => {
    setPendingEditMessage({ messageId, text, messageIndex });
  }, []);
  
  // 处理编辑确认后的回调：回溯对话和画布
  const handleEditConfirm = useCallback(() => {
    if (pendingEditMessage && onMessageRevert) {
      onMessageRevert({
        messageId: pendingEditMessage.messageId,
        text: pendingEditMessage.text,
        messageIndex: pendingEditMessage.messageIndex,
        // 标记为需要回溯画布
        shouldRestoreCanvas: true
      });
    }
    setPendingEditMessage(null);
  }, [pendingEditMessage, onMessageRevert]);
  
  // 取消编辑确认
  const handleEditCancel = useCallback(() => {
    setPendingEditMessage(null);
  }, []);
  
  // 自动检测并应用 XML 到画布
  // 当检测到 AI 消息包含 XML 代码块但没有 tool-call 时，自动应用
  useEffect(() => {
    if (!onDisplayDiagram || isGenerationBusy) return;
    
    // 遍历所有消息，检测未处理的 XML
    messages.forEach((message) => {
      // 跳过用户消息
      if (message.role === "user") return;
      
      // 检查是否已经自动应用过
      if (autoAppliedXmlMessagesRef.current.has(message.id)) return;
      
      // 检查是否有 tool-call（如果有 tool-call 则不需要自动应用）
      const parts = Array.isArray(message.parts) ? message.parts : [];
      const hasToolCall = parts.some((part) => part.type?.startsWith("tool-"));
      if (hasToolCall) return;
      
      // 获取消息文本并检测 XML
      const messageText = (() => {
        if (typeof message.content === "string") return message.content;
        if (Array.isArray(message.parts)) {
          return message.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text ?? "")
            .join("\n")
            .trim();
        }
        return "";
      })();
      
      const { xml, hasXmlBlock } = detectAndExtractXml(messageText);
      
      // 如果检测到有效的 XML，自动应用到画布
      if (xml && hasXmlBlock) {
        console.log("[自动应用] 检测到 XML 代码块，自动应用到画布，消息 ID:", message.id);
        const convertedXml = convertToLegalXml(xml);
        onDisplayDiagram(convertedXml, { toolCallId: `auto-${message.id}` });
        // 标记为已处理
        autoAppliedXmlMessagesRef.current.add(message.id);
      }
    });
  }, [messages, onDisplayDiagram, isGenerationBusy]);
  const handleStreamingApply = useCallback((xml, toolCallId) => {
    if (!xml || typeof onDisplayDiagram !== "function") {
      return;
    }
    const convertedXml = convertToLegalXml(xml);
    const result = onDisplayDiagram(convertedXml, { toolCallId });
    if (result && typeof result.catch === "function") {
      result.catch((error2) => {
        console.error("流式渲染失败:", error2);
      });
    }
  }, [onDisplayDiagram]);
  const diagramResults = useMemo(() => {
    const results = /* @__PURE__ */ new Map();
    messages.forEach((message) => {
      if (!message.parts) return;
      message.parts.forEach((part) => {
        if (typeof part.type !== "string") return;
        const toolName = part.type.replace("tool-", "");
        if (toolName !== "display_diagram" && toolName !== "display_svg") return;
        const toolCallId = part.toolCallId;
        if (!toolCallId) return;
        const result = getDiagramResult?.(toolCallId);
        if (result) {
          results.set(toolCallId, result);
        }
      });
    });
    return results;
  }, [messages, getDiagramResult, diagramResultVersion]);
  const hasLiveToolCard = useMemo(() => {
    return messages.some(
      (message) => message.parts?.some((part) => {
        if (typeof part?.type !== "string") return false;
        if (!part.type.startsWith("tool-")) return false;
        const state = part.state;
        return state === "input-streaming" || state === "pending" || state === "required";
      })
    );
  }, [messages]);
  const handleCopyDiagramXml = useCallback(async (xml, toolCallId) => {
    if (!xml || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(xml);
    } catch (error2) {
      console.error("复制 XML 失败：", error2);
    }
  }, []);
  useEffect(() => {
    if (messagesEndRef.current) {
      let parent = messagesEndRef.current.parentElement;
      while (parent) {
        const style = window.getComputedStyle(parent);
        if (style.overflowY === "auto" || style.overflowY === "scroll") {
          parent.scrollTo({
            top: parent.scrollHeight,
            behavior: "smooth"
          });
          return;
        }
        parent = parent.parentElement;
      }
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages]);
  useEffect(() => {
    const forceCollapseIds = /* @__PURE__ */ new Set();
    const defaultCollapseIds = /* @__PURE__ */ new Set();
    messages.forEach((message) => {
      if (!message.parts) return;
      message.parts.forEach((part) => {
        if (!part.type?.startsWith("tool-")) return;
        const toolCallId = part.toolCallId;
        if (!toolCallId) return;
        const { state } = part;
        if (state === "output-available") {
          forceCollapseIds.add(toolCallId);
        }
        if (part.type === "tool-display_diagram") {
          const xmlInput = typeof part.input?.xml === "string" ? part.input.xml : null;
          if (xmlInput && xmlInput.length >= LARGE_TOOL_INPUT_CHAR_THRESHOLD) {
            defaultCollapseIds.add(toolCallId);
          }
        }
      });
    });
    if (forceCollapseIds.size === 0 && defaultCollapseIds.size === 0) {
      return;
    }
    setExpandedTools((prev) => {
      let changed = false;
      const next = { ...prev };
      forceCollapseIds.forEach((id) => {
        if (next[id] !== false) {
          next[id] = false;
          changed = true;
        }
      });
      defaultCollapseIds.forEach((id) => {
        if (!(id in next)) {
          next[id] = false;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [messages]);
  const renderToolPart = (part, messageMetadata) => {
    const callId = part.toolCallId;
    const { state, input, output } = part;
    const toolName = part.type?.replace("tool-", "");
    const isDisplayDiagramTool = toolName === "display_diagram" || toolName === "display_svg";
    if (isDisplayDiagramTool) {
      const diagramResult = diagramResults.get(callId);
      return <DiagramToolCard
        key={callId}
        part={part}
        onCopy={handleCopyDiagramXml}
        onStopAll={onStopAll}
        isGenerationBusy={isGenerationBusy}
        isComparisonRunning={isComparisonRunning}
        diagramResult={diagramResult}
        onStreamingApply={handleStreamingApply}
        onRetry={onRetryGeneration}
        messageMetadata={messageMetadata}
      />;
    }
    const storedExpansion = expandedTools[callId];
    const isExpanded = storedExpansion !== void 0 ? storedExpansion : true;
    const toggleExpanded = () => {
      setExpandedTools((prev) => ({
        ...prev,
        [callId]: !isExpanded
      }));
    };
    const renderInputContent = () => {
      if (!input || !isExpanded) return null;
      if (toolName === "edit_diagram" && Array.isArray(input?.edits) && input.edits.length > 0) {
        return <div className="mt-1 flex max-h-80 flex-col gap-2 overflow-auto pr-1">
                        {input.edits.map((edit, index) => <div
          key={`${callId}-edit-${index}`}
          className="rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-1.5"
        >
                                <div className="text-[10px] font-semibold text-slate-600">
                                    编辑 #{index + 1}
                                </div>
                                {edit.search ? <div className="mt-1">
                                        <div className="text-[10px] uppercase text-slate-500">
                                            Search
                                        </div>
                                        <pre className="mt-0.5 whitespace-pre-wrap break-all font-mono text-[10px] text-slate-600">
                                            {edit.search}
                                        </pre>
                                    </div> : null}
                                {edit.replace ? <div className="mt-1">
                                        <div className="text-[10px] uppercase text-slate-500">
                                            Replace
                                        </div>
                                        <pre className="mt-0.5 whitespace-pre-wrap break-all font-mono text-[10px] text-slate-600">
                                            {edit.replace}
                                        </pre>
                                    </div> : null}
                            </div>)}
                    </div>;
      }
      const serialized = typeof input === "string" ? input : JSON.stringify(input, null, 2);
      return <pre className="mt-1 max-h-80 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-slate-500">
                    输入：{serialized}
                </pre>;
    };
    return <div
      key={callId}
      className="my-2 w-full max-w-[min(720px,90%)] rounded-lg  bg-white/95 px-3 py-2.5 text-xs leading-relaxed text-slate-600"
    >
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <div className="text-[11px] font-medium text-slate-700">工具：{toolName}</div>
                        <div className="flex items-center gap-2">
                            {input && Object.keys(input).length > 0 && <button
      onClick={toggleExpanded}
      className="text-[11px] text-slate-500 transition hover:text-slate-700"
    >
                                    {isExpanded ? "隐藏参数" : "显示参数"}
                                </button>}
                        </div>
                    </div>
                    {renderInputContent()}
                    <div className="mt-1.5 text-xs">
                        {state === "input-streaming" ? <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" /> : state === "output-available" ? <div className="text-emerald-600">
                                {output || (toolName === "display_diagram" ? "图表生成完成" : toolName === "edit_diagram" ? "图表编辑完成" : "工具执行完成")}
                            </div> : state === "output-error" ? <div className="text-red-600">
                                {output || (toolName === "display_diagram" ? "生成图表时出错" : toolName === "edit_diagram" ? "编辑图表时出错" : "工具执行出错")}
                            </div> : null}
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                        <div className="mb-1 text-[11px] font-semibold text-slate-600">
                            执行状态：{state}
                        </div>
                        {output && <div className="text-[11px] text-slate-700 whitespace-pre-wrap break-words">
                                {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
                            </div>}
                    </div>
                </div>
            </div>;
  };
  // renderComparisonEntry 函数已删除（模型对比功能已移除）
  const resolveMessageText = (message) => {
    if (typeof message.content === "string") {
      return message.content;
    }
    if (Array.isArray(message.parts)) {
      return message.parts.filter(
        (part) => part.type === "text" && (typeof part.text === "string" || typeof part.displayText === "string")
      ).map(
        (part) => (typeof part.displayText === "string" && part.displayText.length > 0 ? part.displayText : part.text) ?? ""
      ).join("\n").trim();
    }
    return "";
  };
  const handleCopyMessage = async (messageId, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2e3);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  const toggleMessageExpanded = (messageId) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };
  const showExamplePanel = messages.length === 0;

  // 计算最近一条 AI 消息的扣费结果，用于在进度指示器中展示“本次扣费”
  const latestAssistantChargeInfo = useMemo(() => {
    // 从后往前查找，找到最近一条带有 chargeResult 的 AI 消息
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      if (msg.role !== "assistant") continue;
      if (msg.metadata && msg.metadata.chargeResult) {
        return msg.metadata.chargeResult;
      }
    }
    return null;
  }, [messages]);
  // 添加 overflow-x-hidden 防止内容撑开容器
  return <div className="pr-4 overflow-x-hidden w-full max-w-full">
            {showExamplePanel ? <div className="py-2">
                    <ExamplePanel
    setInput={setInput}
    setFiles={setFiles}
    onOpenBriefPanel={onOpenBriefPanel}
    briefBadges={briefBadges}
    briefSummary={briefSummary}
  />
                </div> : <>
                    {messages.map((message) => {
    const isUser = message.role === "user";
    const parts = Array.isArray(message.parts) ? message.parts : [];
    const toolParts = parts.filter(
      (part) => part.type?.startsWith("tool-")
    );
    const contentParts = parts.filter(
      (part) => !part.type?.startsWith("tool-")
    );
    const displayableContentParts = contentParts.filter((part) => {
      if (part.type === "text") {
        const textToShow = (part.displayText ?? part.text ?? "").trim();
        return textToShow.length > 0;
      }
      return true;
    });
    const fallbackText = contentParts.length === 0 ? resolveMessageText(message) : "";
    const hasBubbleContent = displayableContentParts.length > 0 || fallbackText.length > 0;
    const fullMessageText = resolveMessageText(message);
    const messageLength = fullMessageText.length;
    // Bug 2 修复：降低折叠阈值，对长消息更积极地折叠
    const shouldCollapse = messageLength > 300;
    const isExpanded = expandedMessages[message.id] ?? !shouldCollapse;
    const isCopied = copiedMessageId === message.id;
    
    // Bug 1 修复：检测 AI 消息中是否包含未通过 tool-call 输出的 XML 代码
    // 只在 AI 消息且没有 tool-call 时检测
    const hasToolCall = toolParts.length > 0;
    const { xml: detectedXml, hasXmlBlock } = !isUser && !hasToolCall 
      ? detectAndExtractXml(fullMessageText) 
      : { xml: null, hasXmlBlock: false };
    
    // 检查该消息是否已被自动应用
    const wasAutoApplied = autoAppliedXmlMessagesRef.current.has(message.id);
    
    return <div key={message.id} className="mb-5 flex flex-col gap-2">
                                {hasBubbleContent && <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
                                        <div className="relative max-w-[min(600px,85%)] group" style={{ maxWidth: "min(600px, 85%)" }}>
                                            <div
      className={cn(
        "rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
        // 强制换行和隐藏溢出，防止 XML 代码撑开容器
        "whitespace-pre-wrap break-all overflow-x-hidden",
        isUser ? "bg-slate-900 text-white" : "border border-slate-200/60 bg-white text-slate-900",
        // Bug 2 修复：添加最大高度限制，无论是否折叠都限制高度
        isExpanded ? "max-h-[400px] overflow-y-auto" : "max-h-[200px] overflow-hidden relative"
      )}
      style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
    >
                                                {displayableContentParts.map((part, index) => {
      switch (part.type) {
        case "text":
          const textToShow = part.displayText ?? part.text ?? "";
          return <div key={index} className="mb-1 last:mb-0">
                                                                    {textToShow}
                                                                </div>;
        case "file":
          return <div key={index} className="mt-3">
                                                                    <Image
            src={part.url}
            width={240}
            height={240}
            alt={`file-${index}`}
            className="rounded-xl border object-contain"
          />
                                                                </div>;
        default:
          return null;
      }
    })}
                                                {!contentParts.length && fallbackText && <div>{fallbackText}</div>}
                                                {!isExpanded && <div
      className={cn(
        "absolute bottom-0 left-0 right-0 h-20 pointer-events-none",
        isUser ? "bg-gradient-to-t from-slate-900 to-transparent" : "bg-gradient-to-t from-white to-transparent"
      )}
    />}
                                            </div>

                                            <div className={cn(
      "flex flex-wrap items-center gap-1.5 mt-1.5",
      isUser ? "justify-end" : "justify-start"
    )}>
                                                {/* Bug 1 修复：检测到 XML 代码块时显示状态或手动应用按钮 */}
                                                {/* 在流式输出期间禁用手动应用，避免状态混乱 */}
                                                {detectedXml && hasXmlBlock && onDisplayDiagram && (
                                                  wasAutoApplied ? (
                                                    // 已自动应用，显示状态提示
                                                    <span className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                      </svg>
                                                      <span>已自动应用到画布</span>
                                                    </span>
                                                  ) : isGenerationBusy ? (
                                                    // 流式输出中，显示等待状态而不是可点击按钮
                                                    <span className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
                                                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                                                      </svg>
                                                      <span>生成中，稍后自动应用</span>
                                                    </span>
                                                  ) : (
                                                    // 生成完成后，允许手动应用
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const convertedXml = convertToLegalXml(detectedXml);
                                                        onDisplayDiagram(convertedXml, { toolCallId: `manual-${message.id}` });
                                                        autoAppliedXmlMessagesRef.current.add(message.id);
                                                      }}
                                                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all bg-blue-500 text-white hover:bg-blue-600"
                                                      title="将检测到的 XML 代码应用到画布"
                                                    >
                                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                      </svg>
                                                      <span>应用到画布</span>
                                                    </button>
                                                  )
                                                )}
                                                <button
      type="button"
      onClick={() => handleCopyMessage(message.id, fullMessageText)}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all",
        isUser ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100",
        isCopied && "text-emerald-600"
      )}
      title="复制消息"
    >
                                                    {isCopied ? <>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span>已复制</span>
                                                        </> : <>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                            <span>复制</span>
                                                        </>}
                                                </button>

                                                {shouldCollapse && <button
      type="button"
      onClick={() => toggleMessageExpanded(message.id)}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all",
        isUser ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
      )}
    >
                                                        {isExpanded ? <>
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                                </svg>
                                                                <span>收起</span>
                                                            </> : <>
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                                <span>展开</span>
                                                            </>}
                                                    </button>}
                                                {/* Bug 3 修复：将 Revert 改为编辑按钮，点击后显示确认对话框 */}
                                                {isUser && onMessageRevert && <button
      type="button"
      onClick={() => handleEditClick(
        message.id,
        resolveMessageText(message),
        messages.findIndex(m => m.id === message.id)
      )}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all",
        isUser ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
      )}
      title="编辑此消息（将回溯对话和画布到此位置）"
    >
                                                        <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
                                                            <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
                                                        </svg>
                                                        <span>编辑</span>
                                                    </button>}
                                            </div>
                                            {/* Token 使用量和扣费信息显示 */}
                                            {!isUser && message.metadata && (message.metadata.usage || message.metadata.durationMs || message.metadata.chargeResult) && (() => {
                                                // 调试日志：查看 metadata 内容
                                                if (process.env.NODE_ENV === 'development') {
                                                    console.log('[扣费显示调试] Message metadata:', {
                                                        id: message.id,
                                                        hasUsage: !!message.metadata.usage,
                                                        hasDuration: message.metadata.durationMs !== undefined,
                                                        hasChargeResult: !!message.metadata.chargeResult,
                                                        chargeResult: message.metadata.chargeResult
                                                    });
                                                }
                                                return (
                                                    <div className="mt-2">
                                                        <TokenUsageDisplay
                                                            usage={message.metadata.usage}
                                                            durationMs={message.metadata.durationMs}
                                                            chargeInfo={message.metadata.chargeResult}
                                                            compact={true}
                                                        />
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>}
                                {toolParts.map((part) => <div
      key={part.toolCallId}
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
                                        {renderToolPart(part, message.metadata)}
                                    </div>)}
                            </div>;
  })}
                </>}
            {
    /* Bug 2 修复：使用 FloatingProgressIndicator 替代 StreamingThoughtDisplay */
    /* FloatingProgressIndicator 会在生成完成后保持显示"生成完成"状态，而不是直接消失 */
    /* 这提供了类似 GPT/Claude 的用户体验，让用户能看到完整的进度过程 */
  }
            <FloatingProgressIndicator
              phase={generationPhase}
              isVisible={isGenerationBusy || generationPhase !== "idle"}
              onReset={onProgressReset}
              chargeInfo={latestAssistantChargeInfo}
            />
            {error && <div className="text-red-500 text-sm mt-2">
                    错误：{error.message}
                </div>}
            <div ref={messagesEndRef} />
            
            {/* Bug 3 修复：编辑确认对话框 */}
            <AlertDialog open={!!pendingEditMessage} onOpenChange={(open) => !open && handleEditCancel()}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认编辑此消息？</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      此操作将回溯对话历史和画布状态到该消息发送时的状态。
                    </p>
                    <p className="text-amber-600 font-medium">
                      ⚠️ 注意：该消息之后的所有对话和画布修改都将被移除，此操作不可撤回。
                    </p>
                    <p className="text-slate-500 text-sm">
                      原消息内容将填充到输入框，您可以重新编辑后发送。
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={handleEditCancel}>
                    取消
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleEditConfirm}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    确认回溯并编辑
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>;
}
export {
  ChatMessageDisplay
};
