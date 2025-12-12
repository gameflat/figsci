// -*- coding: utf-8 -*-
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaGithub } from "react-icons/fa";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Handshake,
  PanelRightClose,
  Sparkles
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatInputOptimized } from "@/components/chat-input-optimized";
import { ChatMessageDisplay } from "./chat-message-display-optimized";
import { useDiagram } from "@/contexts/diagram-context";
import { useConversationManager } from "@/contexts/conversation-context";
import { useSvgEditor } from "@/contexts/svg-editor-context";
import { cn, formatXML, replaceXMLParts } from "@/lib/utils";
import { buildSvgRootXml } from "@/lib/svg";
import { QuickActionBar } from "@/components/quick-action-bar";
import { FlowShowcaseGallery } from "./flow-showcase-gallery";
import { ReportBlueprintTray } from "./report-blueprint-tray";
import { CalibrationConsole } from "./calibration-console";
import { useChatState } from "@/hooks/use-chat-state";
import { EMPTY_MXFILE } from "@/lib/diagram-templates";
import { ModelComparisonConfigDialog } from "@/components/model-comparison-config-dialog";
import { IntelligenceToolbar } from "@/features/chat-panel/components/intelligence-toolbar";
import { ToolPanelSidebar } from "@/features/chat-panel/components/tool-panel-sidebar";
import {
  Figsci_AI_CALIBRATION_PROMPT,
  FLOW_SHOWCASE_PRESETS,
  QUICK_ACTIONS
} from "@/features/chat-panel/constants";
import { useComparisonWorkbench } from "@/features/chat-panel/hooks/use-comparison-workbench";
import { useDiagramOrchestrator } from "@/features/chat-panel/hooks/use-diagram-orchestrator";
import { serializeAttachments } from "@/features/chat-panel/utils/attachments";
import { useModelRegistry } from "@/hooks/use-model-registry";
import { ModelConfigDialog } from "@/components/model-config-dialog";
import { TemplateGallery } from "@/components/template-gallery";
import Link from "next/link";
function ChatPanelOptimized({
  onCollapse,
  isCollapsible = false,
  renderMode: controlledRenderMode,
  onRenderModeChange
}) {
  const {
    loadDiagram: onDisplayChart,
    chartXML,
    clearDiagram,
    diagramHistory: mxDiagramHistory,
    restoreDiagramAt,
    fetchDiagramXml,
    runtimeError,
    setRuntimeError
  } = useDiagram();
  const {
    loadSvgMarkup,
    exportSvgMarkup,
    clearSvg,
    history: svgHistory,
    restoreHistoryAt: restoreSvgHistoryAt
  } = useSvgEditor();
  const [internalRenderMode, setInternalRenderMode] = useState("drawio");
  const renderMode = controlledRenderMode ?? internalRenderMode;
  const isSvgMode = renderMode === "svg";
  const handleRenderModeChange = useCallback(
    (mode) => {
      if (onRenderModeChange) {
        onRenderModeChange(mode);
      } else {
        setInternalRenderMode(mode);
      }
    },
    [onRenderModeChange]
  );
  const {
    isConversationStarted,
    messageCount,
    isCompactMode,
    startConversation,
    incrementMessageCount,
    clearConversation,
    toggleCompactMode
  } = useChatState();
  // 聊天消息滚动容器 ref，用于自动滚动到底部
  const messagesScrollRef = useRef(null);
  // 跟踪用户是否手动滚动，如果用户手动滚动到顶部，则不再自动滚动
  const userScrolledRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const {
    activeBranch,
    activeBranchId,
    branchTrail,
    branchList,
    createBranch,
    switchBranch,
    updateActiveBranchMessages,
    updateActiveBranchDiagram,
    resetActiveBranch
  } = useConversationManager();
  const { handleDiagramXml, tryApplyRoot, updateLatestDiagramXml, getLatestDiagramXml } = useDiagramOrchestrator({
    chartXML,
    onDisplayChart,
    updateActiveBranchDiagram
  });
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
  const tryApplyCanvasRoot = useCallback(
    async (xml) => {
      if (isSvgMode) {
        loadSvgMarkup(xml);
        updateActiveBranchDiagram(xml);
        return;
      }
      await tryApplyRoot(xml);
    },
    [isSvgMode, loadSvgMarkup, updateActiveBranchDiagram, tryApplyRoot]
  );
  const getLatestCanvasMarkup = useCallback(
    () => isSvgMode ? exportSvgMarkup() : getLatestDiagramXml(),
    [isSvgMode, exportSvgMarkup, getLatestDiagramXml]
  );
  const lastBranchIdRef = useRef(activeBranchId);
  const initialHydratedRef = useRef(false);
  const fetchAndFormatDiagram = useCallback(
    async (options) => {
      if (isSvgMode) {
        return exportSvgMarkup();
      }
      const rawXml = await fetchDiagramXml(options);
      const formatted = formatXML(rawXml);
      updateLatestDiagramXml(formatted);
      return formatted;
    },
    [isSvgMode, exportSvgMarkup, fetchDiagramXml, updateLatestDiagramXml]
  );
  const onFetchChart = useCallback(async () => {
    return fetchAndFormatDiagram();
  }, [fetchAndFormatDiagram]);
  const {
    isReady: isModelRegistryReady,
    hasConfiguredModels,
    endpoints: modelEndpoints,
    models: modelOptions,
    selectedModelKey,
    selectedModel,
    selectModel,
    saveEndpoints,
    isSelectedSystemModel
  } = useModelRegistry();
  
  // 生成请求体中的模型配置
  // 系统模型：发送 useSystemModel + systemModelId
  // 自定义模型：发送完整的 modelRuntime
  // 自定义 API：发送 customApiUrl + customApiKey（用于模板匹配等场景）
  const buildModelRequestBody = useCallback(
    (model) => {
      if (!model) {
        return {};
      }
      
      if (model.isSystemModel) {
        // 系统模型：只发送模型标识，服务端从环境变量获取配置
        return {
          useSystemModel: true,
          systemModelId: model.modelId,
        };
      }
      
      // 自定义模型：发送完整配置
      // 默认使用当前选中的模型配置（通过 modelRuntime）
      const requestBody = {
        modelRuntime: model,
      };
      
      // 方式 1：使用环境变量配置的模板匹配专用 API（推荐）
      // 在 .env.local 或 .env 文件中设置：
      // NEXT_PUBLIC_TEMPLATE_MATCH_API_URL=https://api.your-custom-ai.com/v1/chat/completions
      // NEXT_PUBLIC_TEMPLATE_MATCH_API_KEY=your-api-key-here
      // NEXT_PUBLIC_TEMPLATE_MATCH_MODEL=your-model-name (可选，默认使用当前模型)
      if (typeof window !== "undefined") {
        const templateMatchApiUrl = process.env.NEXT_PUBLIC_TEMPLATE_MATCH_API_URL;
        const templateMatchApiKey = process.env.NEXT_PUBLIC_TEMPLATE_MATCH_API_KEY;
        
        if (templateMatchApiUrl && templateMatchApiKey) {
          requestBody.customApiUrl = templateMatchApiUrl;
          requestBody.customApiKey = templateMatchApiKey;
          requestBody.customModel = process.env.NEXT_PUBLIC_TEMPLATE_MATCH_MODEL || model.modelId || "gpt-4o-mini";
        }
      }
      
      // 方式 2：如果需要在代码中硬编码（不推荐，仅用于测试）
      // 取消下面的注释并填入你的 API 配置
      // 注意：这种方式会将 API Key 暴露在前端代码中，存在安全风险
      // if (!requestBody.customApiUrl) {
      //   requestBody.customApiUrl = "https://api.your-custom-ai.com/v1/chat/completions";
      //   requestBody.customApiKey = "your-api-key-here";
      //   requestBody.customModel = "your-model-name";
      // }
      
      return requestBody;
    },
    []
  );
  const [isModelConfigOpen, setIsModelConfigOpen] = useState(false);
  const hasPromptedModelSetup = useRef(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
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
  const handleModelStreamingChange = useCallback((modelKey, isStreaming) => {
    const [endpointId, modelId] = modelKey.split(":");
    const updatedEndpoints = modelEndpoints.map((endpoint) => {
      if (endpoint.id === endpointId) {
        return {
          ...endpoint,
          models: endpoint.models.map((model) => {
            if (model.id === modelId) {
              return { ...model, isStreaming, updatedAt: Date.now() };
            }
            return model;
          }),
          updatedAt: Date.now()
        };
      }
      return endpoint;
    });
    saveEndpoints(updatedEndpoints);
  }, [modelEndpoints, saveEndpoints]);
  const [files, setFiles] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [commandTab, setCommandTab] = useState(
    "templates"
  );
  const [activeToolPanel, setActiveToolPanel] = useState(null);
  const [isToolSidebarOpen, setIsToolSidebarOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contactCopyState, setContactCopyState] = useState(
    "idle"
  );
  const diagramResultsRef = useRef(/* @__PURE__ */ new Map());
  const [diagramResultVersion, setDiagramResultVersion] = useState(0);
  const lastLoadedSvgResultIdRef = useRef(null);
  const getDiagramResult = useCallback(
    (toolCallId) => diagramResultsRef.current.get(toolCallId),
    []
  );
  useEffect(() => {
    if (isModelRegistryReady && !hasConfiguredModels && !hasPromptedModelSetup.current) {
      setIsModelConfigOpen(true);
      hasPromptedModelSetup.current = true;
    }
  }, [hasConfiguredModels, isModelRegistryReady]);
  useEffect(() => {
    if (hasConfiguredModels) {
      hasPromptedModelSetup.current = false;
    }
  }, [hasConfiguredModels]);
  useEffect(() => {
    if (!isSvgMode) return;
    const entries = Array.from(diagramResultsRef.current.entries());
    if (entries.length === 0) return;
    const lastWithSvg = [...entries].reverse().find(([, value2]) => value2.mode === "svg" && value2.svg);
    if (!lastWithSvg) return;
    const [resultId, value] = lastWithSvg;
    if (lastLoadedSvgResultIdRef.current === resultId) return;
    loadSvgMarkup(value.svg);
    updateActiveBranchDiagram(value.svg);
    lastLoadedSvgResultIdRef.current = resultId;
  }, [isSvgMode, diagramResultVersion, loadSvgMarkup, updateActiveBranchDiagram]);
  const {
    messages,
    sendMessage,
    addToolResult,
    status,
    error,
    setMessages,
    stop
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat"
    }),
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === "display_diagram") {
        const { xml } = toolCall.input;
        try {
          if (!xml || typeof xml !== "string" || !xml.trim()) {
            throw new Error("大模型返回的 XML 为空，无法渲染。");
          }
          if (isSvgMode) {
            addToolResult({
              tool: "display_diagram",
              toolCallId: toolCall.toolCallId,
              output: "当前处于 SVG 模式，请使用 display_svg 工具返回 SVG。"
            });
            return;
          }
          await handleCanvasUpdate(xml, {
            origin: "display",
            modelRuntime: selectedModel ?? void 0
          });
          diagramResultsRef.current.set(toolCall.toolCallId, {
            xml,
            mode: "drawio",
            runtime: selectedModel ?? void 0
          });
          setDiagramResultVersion((prev) => prev + 1);
          if (toolCall.input && typeof toolCall.input === "object") {
            toolCall.input.xmlRef = toolCall.toolCallId;
            toolCall.input.xmlLength = xml.length;
            toolCall.input.xml = void 0;
          }
          addToolResult({
            tool: "display_diagram",
            toolCallId: toolCall.toolCallId,
            output: "Diagram rendered to canvas successfully."
          });
        } catch (error2) {
          const message = error2 instanceof Error ? error2.message : "Failed to display diagram.";
          addToolResult({
            tool: "display_diagram",
            toolCallId: toolCall.toolCallId,
            output: `Failed to display diagram: ${message}`
          });
        }
      } else if (toolCall.toolName === "display_svg") {
        const { svg } = toolCall.input;
        try {
          if (!svg || typeof svg !== "string" || !svg.trim()) {
            throw new Error("大模型返回的 SVG 为空，无法渲染。");
          }
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
          const { rootXml } = buildSvgRootXml(svg);
          await handleCanvasUpdate(rootXml, {
            origin: "display",
            modelRuntime: selectedModel ?? void 0,
            toolCallId: toolCall.toolCallId
          });
          const mergedXml = getLatestDiagramXml();
          diagramResultsRef.current.set(toolCall.toolCallId, {
            xml: mergedXml,
            svg,
            mode: "svg",
            runtime: selectedModel ?? void 0
          });
          setDiagramResultVersion((prev) => prev + 1);
          if (toolCall.input && typeof toolCall.input === "object") {
            toolCall.input.svgRef = toolCall.toolCallId;
            toolCall.input.svgLength = svg.length;
            toolCall.input.svg = void 0;
          }
          addToolResult({
            tool: "display_svg",
            toolCallId: toolCall.toolCallId,
            output: "SVG 已转换并渲染到画布。"
          });
        } catch (error2) {
          const message = error2 instanceof Error ? error2.message : "Failed to display SVG.";
          addToolResult({
            tool: "display_svg",
            toolCallId: toolCall.toolCallId,
            output: `Failed to display SVG: ${message}`
          });
        }
      } else if (toolCall.toolName === "edit_diagram") {
        const { edits } = toolCall.input;
        let currentXml = "";
        try {
          currentXml = await fetchAndFormatDiagram({ saveHistory: false });
          const editedXml = replaceXMLParts(currentXml, edits);
          onDisplayChart(editedXml);
          updateActiveBranchDiagram(editedXml);
          updateLatestDiagramXml(editedXml);
          try {
            await new Promise((resolve) => setTimeout(resolve, 250));
            await fetchAndFormatDiagram();
          } catch (snapshotError) {
            console.warn("Failed to capture diagram history after edit:", snapshotError);
          }
          addToolResult({
            tool: "edit_diagram",
            toolCallId: toolCall.toolCallId,
            output: `Successfully applied ${edits.length} edit(s) to the diagram.`
          });
        } catch (error2) {
          console.error("Edit diagram failed:", error2);
          const errorMessage = error2 instanceof Error ? error2.message : String(error2);
          addToolResult({
            tool: "edit_diagram",
            toolCallId: toolCall.toolCallId,
            output: `Failed to edit diagram: ${errorMessage}`
          });
        }
      }
    },
    onError: (error2) => {
      console.error("Chat error:", error2);
    }
  });
  const {
    comparisonConfig,
    setComparisonConfig,
    isComparisonConfigOpen,
    setIsComparisonConfigOpen,
    comparisonHistory,
    comparisonNotice,
    isComparisonRunning,
    activeComparisonPreview,
    requiresBranchDecision,
    handleCompareRequest,
    handleRetryComparisonResult,
    handleApplyComparisonResult,
    handlePreviewComparisonResult,
    handleDownloadXml,
    buildComparisonPreviewUrl,
    ensureBranchSelectionSettled,
    resetWorkbench,
    releaseBranchRequirement,
    notifyComparison,
    cancelComparisonJobs,
    pruneHistoryByMessageIds
  } = useComparisonWorkbench({
    activeBranch,
    activeBranchId,
    createBranch,
    switchBranch,
    onFetchChart,
    files,
    input,
    status,
    tryApplyRoot: tryApplyCanvasRoot,
    handleDiagramXml: handleCanvasUpdate,
    getLatestDiagramXml: getLatestCanvasMarkup,
    messages,
    modelOptions,
    selectedModelKey,
    renderMode
  });
  const isComparisonAllowed = Boolean(selectedModel);
  const handleCopyXml = useCallback(
    async (xml) => {
      if (!xml || xml.trim().length === 0) {
        notifyComparison("error", "当前结果缺少 XML 内容，无法复制。");
        return;
      }
      try {
        await navigator.clipboard.writeText(xml);
        notifyComparison("success", "XML 已复制到剪贴板。");
      } catch (copyError) {
        console.error("Copy XML failed:", copyError);
        notifyComparison("error", "复制 XML 失败，请检查浏览器权限。");
      }
    },
    [notifyComparison]
  );
  const handleStopAll = useCallback(
    async (notice) => {
      try {
        if (status === "streaming" || status === "submitted") {
          await stop();
        }
      } catch (stopError) {
        console.error("停止生成失败：", stopError);
      }
      cancelComparisonJobs();
      if (notice) {
        notifyComparison(notice.type, notice.message);
      }
    },
    [status, stop, cancelComparisonJobs, notifyComparison]
  );
  const handleRetryGeneration = useCallback(async () => {
    try {
      if (status === "streaming") {
        await stop();
      }
      const lastUserMessage = messages.slice().reverse().find((msg) => msg.role === "user");
      if (!lastUserMessage) {
        console.error("没有找到用户消息可以重试");
        return;
      }
      const lastMessageIndex = messages.length - 1;
      if (lastMessageIndex >= 0 && messages[lastMessageIndex].role === "assistant") {
        setMessages(messages.slice(0, lastMessageIndex));
      }
      const chartXml = await onFetchChart();
      const streamingFlag = renderMode === "svg" ? false : selectedModel?.isStreaming ?? false;
      sendMessage(
        { parts: lastUserMessage.parts || [] },
        {
          body: {
            xml: chartXml,
            ...buildModelRequestBody(selectedModel),
            enableStreaming: streamingFlag,
            renderMode
          }
        }
      );
    } catch (error2) {
      console.error("重试生成失败：", error2);
    }
  }, [status, stop, messages, setMessages, sendMessage, onFetchChart, selectedModel, renderMode, buildModelRequestBody]);
  const handleCopyWechat = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText("leland1999");
      } else if (typeof window !== "undefined") {
        const fallback = window.prompt("复制微信号", "leland1999");
        if (fallback === null) {
          throw new Error("用户取消复制。");
        }
      }
      setContactCopyState("copied");
      setTimeout(() => setContactCopyState("idle"), 1800);
    } catch (error2) {
      console.error("复制微信号失败：", error2);
      setContactCopyState("idle");
    }
  }, []);
  useEffect(() => {
    const userMessages = messages.filter((message) => message.role === "user");
    if (userMessages.length > 0 && !isConversationStarted) {
      startConversation();
    }
    if (userMessages.length > messageCount) {
      incrementMessageCount();
    }
  }, [messages, isConversationStarted, messageCount, startConversation, incrementMessageCount]);
  useEffect(() => {
    if (isConversationStarted) {
      setActiveToolPanel(null);
      setIsToolSidebarOpen(false);
    }
  }, [isConversationStarted]);
  useEffect(() => {
    if (!activeBranch) {
      return;
    }
    if (activeBranch.messages === messages) {
      return;
    }
    updateActiveBranchMessages(messages);
  }, [messages, activeBranch, updateActiveBranchMessages]);
  useEffect(() => {
    if (showHistory && (status === "streaming" || status === "submitted" || isComparisonRunning)) {
      void handleStopAll({
        type: "error",
        message: "查看历史时已暂停当前生成。"
      });
    }
  }, [showHistory, status, isComparisonRunning, handleStopAll]);

  // 检查是否接近底部（距离底部 100px 以内）
  const checkIsNearBottom = useCallback(() => {
    const scrollContainer = messagesScrollRef.current;
    if (!scrollContainer) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom < 100;
  }, []);

  // 自动滚动到最新消息
  const scrollToBottom = useCallback((smooth = true, force = false) => {
    const scrollContainer = messagesScrollRef.current;
    if (!scrollContainer) return;
    
    // 如果用户手动滚动到顶部，且不是强制滚动，则不自动滚动
    if (!force && userScrolledRef.current && !isNearBottomRef.current) {
      return;
    }
    
    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: smooth ? "smooth" : "auto"
    });
    
    // 滚动后更新状态
    isNearBottomRef.current = true;
    if (force) {
      // 强制滚动时（新消息），重置用户滚动标记
      userScrolledRef.current = false;
    }
  }, []);

  // 监听滚动事件，检测用户是否手动滚动
  useEffect(() => {
    const scrollContainer = messagesScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const isNearBottom = checkIsNearBottom();
      isNearBottomRef.current = isNearBottom;
      
      // 如果用户滚动到顶部附近，标记为用户手动滚动
      if (!isNearBottom) {
        userScrolledRef.current = true;
      } else {
        // 如果滚动回到底部，重置标记
        userScrolledRef.current = false;
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [checkIsNearBottom]);

  // 当消息变化时自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      // 使用 setTimeout 确保 DOM 更新完成后再滚动
      const timer = setTimeout(() => {
        scrollToBottom(true, true); // 新消息时强制滚动
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToBottom]);

  // 流式生成时也自动滚动（仅在接近底部时）
  useEffect(() => {
    if (status === "streaming") {
      const interval = setInterval(() => {
        // 只有在接近底部时才自动滚动
        if (isNearBottomRef.current) {
          scrollToBottom(false, false); // 流式生成时使用 instant 滚动
        }
      }, 500); // 每 500ms 检查一次，减少频率
      return () => clearInterval(interval);
    }
  }, [status, scrollToBottom]);
  const onFormSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (status === "streaming") {
        return;
      }
      if (!input.trim()) {
        return;
      }
      if (!ensureBranchSelectionSettled()) {
        return;
      }
      if (!selectedModel) {
        setIsModelConfigOpen(true);
        return;
      }
      try {
        let chartXml = await onFetchChart();
        const streamingFlag = renderMode === "svg" ? false : selectedModel?.isStreaming ?? false;
        
        // 智能模板匹配：如果输入框有内容，调用 AI Agents 进行智能匹配和格式化
        let finalInput = input;
        let matchedTemplateId = null;
        
        if (input.trim()) {
          try {
            // 调用智能模板匹配 API
            const matchResponse = await fetch("/api/template-match", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userInput: input.trim(),
                currentXml: chartXml,
                modelRuntime: buildModelRequestBody(selectedModel),
              }),
            });
            
            if (matchResponse.ok) {
              const matchResult = await matchResponse.json();
              const CONFIDENCE_THRESHOLD = 0.8; // 置信度阈值
              
              // 只有当置信度 >= 0.8 且匹配到模板时才使用格式化后的提示词
              if (matchResult.confidence >= CONFIDENCE_THRESHOLD && matchResult.templateId && matchResult.formattedPrompt) {
                finalInput = matchResult.formattedPrompt;
                matchedTemplateId = matchResult.templateId;
                
                // 获取模板名称用于日志显示
                const { DIAGRAM_TEMPLATES } = await import("@/data/templates");
                const matchedTemplate = DIAGRAM_TEMPLATES.find(t => t.id === matchResult.templateId);
                const templateName = matchedTemplate ? matchedTemplate.title : matchResult.templateId;
                
                console.log(`[前端] ✅ 智能匹配模板成功`);
                console.log(`[前端] 模板名称: ${templateName}`);
                console.log(`[前端] 模板 ID: ${matchResult.templateId}`);
                console.log(`[前端] 置信度: ${(matchResult.confidence * 100).toFixed(1)}%`);
                console.log(`[前端] 匹配原因: ${matchResult.reason}`);
              } else {
                // 置信度低于阈值，不使用模板
                let templateName = "无";
                if (matchResult.templateId) {
                  try {
                    const { DIAGRAM_TEMPLATES } = await import("@/data/templates");
                    const matchedTemplate = DIAGRAM_TEMPLATES.find(t => t.id === matchResult.templateId);
                    templateName = matchedTemplate ? matchedTemplate.title : matchResult.templateId;
                  } catch (e) {
                    templateName = matchResult.templateId;
                  }
                }
                console.log(`[前端] ⚠️  模板匹配置信度低于阈值`);
                console.log(`[前端] 匹配到的模板: ${templateName} (ID: ${matchResult.templateId || "无"})`);
                console.log(`[前端] 置信度: ${(matchResult.confidence * 100).toFixed(1)}% (阈值: ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}%)`);
                console.log(`[前端] 匹配原因: ${matchResult.reason || "无"}`);
                console.log(`[前端] 将使用原始输入，不应用模板`);
              }
            } else {
              console.warn("模板匹配失败，使用原始输入:", await matchResponse.text());
            }
          } catch (matchError) {
            // 模板匹配失败不影响主流程，使用原始输入
            console.warn("模板匹配请求失败，使用原始输入:", matchError);
          }
        }
        
        // 构建最终的消息内容
        const parts = [{ type: "text", text: finalInput, displayText: input }];
        if (files.length > 0) {
          const attachments = await serializeAttachments(files);
          attachments.forEach(({ url, mediaType }) => {
            parts.push({
              type: "file",
              url,
              mediaType
            });
          });
        }
        sendMessage(
          { parts },
          {
            body: {
              xml: chartXml,
              ...buildModelRequestBody(selectedModel),
              enableStreaming: streamingFlag,
              renderMode
            }
          }
        );
        setInput("");
        setFiles([]);
      } catch (submissionError) {
        console.error("Error fetching chart data:", submissionError);
      }
    },
    [
      status,
      input,
      ensureBranchSelectionSettled,
      onFetchChart,
      files,
      sendMessage,
      selectedModel,
      setIsModelConfigOpen,
      renderMode,
      buildModelRequestBody
    ]
  );
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  const handleFileChange = (newFiles) => {
    setFiles(newFiles);
  };
  const handleAICalibrationRequest = async () => {
    if (!ensureBranchSelectionSettled()) {
      throw new Error("请先处理对比结果，再执行校准。");
    }
    if (status === "streaming") {
      throw new Error("AI 正在回答其他请求，请稍后再试。");
    }
    if (!selectedModel) {
      setIsModelConfigOpen(true);
      throw new Error("请先配置可用模型后再执行校准。");
    }
    if (renderMode === "svg") {
      throw new Error("SVG 模式暂不支持校准，请切换回 draw.io XML 模式。");
    }
    let chartXml = await onFetchChart();
    if (!chartXml.trim()) {
      throw new Error("当前画布为空，无法执行校准。");
    }
    const userVisibleMessage = "启动 AI 校准\n\n请优化当前流程图的布局：\n• 保持所有节点和内容不变\n• 优化节点位置和间距\n• 整理连接线路径\n• 使用 edit_diagram 工具进行批量调整";
    const streamingFlag = selectedModel?.isStreaming ?? false;
    await sendMessage(
      {
        parts: [
          {
            type: "text",
            // 用户看到的是简化版本
            text: userVisibleMessage + "\n\n---\n\n" + Figsci_AI_CALIBRATION_PROMPT
          }
        ]
      },
      {
        body: {
          xml: chartXml,
          ...buildModelRequestBody(selectedModel),
          enableStreaming: streamingFlag,
          renderMode
        }
      }
    );
  };
  const handleQuickAction = async (action) => {
    if (status === "streaming") return;
    if (!ensureBranchSelectionSettled()) return;
    setInput(action.prompt);
    if (action.attachment) {
      try {
        const response = await fetch(action.attachment.path);
        const blob = await response.blob();
        const file = new File([blob], action.attachment.fileName, {
          type: action.attachment.mime
        });
        handleFileChange([file]);
      } catch (err) {
        console.error("Failed to attach reference asset:", err);
      }
    } else if (files.length > 0) {
      handleFileChange([]);
    }
  };
  const handleShowcasePreset = (preset) => {
    if (status === "streaming") return;
    if (!ensureBranchSelectionSettled()) return;
    setInput(preset.prompt);
    if (files.length > 0) {
      handleFileChange([]);
    }
  };
  const handleBranchSwitch = useCallback(
    async (branchId) => {
      if (branchId === activeBranchId) {
        return;
      }
      await handleStopAll({
        type: "error",
        message: "已暂停当前生成，准备切换分支。"
      });
      switchBranch(branchId);
    },
    [activeBranchId, handleStopAll, switchBranch]
  );
  const handleBlueprintTemplate = (prompt) => {
    if (status === "streaming") return;
    if (!ensureBranchSelectionSettled()) return;
    setInput(prompt);
    if (files.length > 0) {
      handleFileChange([]);
    }
  };
  const handleClearChat = () => {
    void handleStopAll({
      type: "success",
      message: "已清空当前对话并停止生成。"
    });
    setMessages([]);
    resetActiveBranch();
    updateActiveBranchDiagram(isSvgMode ? null : EMPTY_MXFILE);
    if (isSvgMode) {
      clearSvg();
    } else {
      clearDiagram();
    }
    clearConversation();
    resetWorkbench();
  };
  const exchanges = messages.filter(
    (message) => message.role === "user" || message.role === "assistant"
  ).length;
  const toggleToolPanel = (panel) => {
    setActiveToolPanel((current) => {
      const next = current === panel ? null : panel;
      setIsToolSidebarOpen(next !== null);
      return next;
    });
  };
  const closeToolSidebar = () => {
    setActiveToolPanel(null);
    setIsToolSidebarOpen(false);
  };
  useEffect(() => {
    if (!activeBranch) {
      return;
    }
    const branchChanged = lastBranchIdRef.current !== activeBranchId;
    const messagesMismatch = activeBranch.messages !== messages;
    if (branchChanged && activeBranch.diagramXml) {
      (async () => {
        try {
          await handleDiagramXml(activeBranch.diagramXml, {
            origin: "display",
            modelRuntime: void 0
          });
        } catch (error2) {
          console.error("切换分支应用画布失败：", error2);
        }
      })();
    }
    if (branchChanged && messagesMismatch) {
      setMessages(activeBranch.messages);
    }
    if (branchChanged) {
      if (status === "streaming" || status === "submitted" || isComparisonRunning) {
        void handleStopAll({
          type: "error",
          message: "已切换分支，自动暂停生成。"
        });
      }
      lastBranchIdRef.current = activeBranchId;
    }
  }, [
    activeBranch,
    activeBranchId,
    handleStopAll,
    handleDiagramXml,
    isComparisonRunning,
    messages,
    setMessages,
    status
  ]);

  useEffect(() => {
    if (initialHydratedRef.current || !activeBranch) {
      return;
    }
    initialHydratedRef.current = true;

    if (activeBranch.diagramXml) {
      (async () => {
        try {
          await handleDiagramXml(activeBranch.diagramXml, {
            origin: "display",
            modelRuntime: void 0
          });
        } catch (error2) {
          console.error("初始化应用画布失败:", error2);
        }
      })();
    }

    if (
      activeBranch.messages &&
      activeBranch.messages.length > 0 &&
      messages !== activeBranch.messages
    ) {
      setMessages(activeBranch.messages);
    }
  }, [activeBranch, handleDiagramXml, messages, setMessages]);
  const handleMessageRevert = useCallback(
    ({ messageId, text }) => {
      const targetIndex = messages.findIndex(
        (message) => message.id === messageId
      );
      if (targetIndex < 0) {
        return;
      }
      const truncated = messages.slice(0, targetIndex);
      const labelSuffix = targetIndex + 1 <= 9 ? `0${targetIndex + 1}` : `${targetIndex + 1}`;
      const revertBranch = createBranch({
        parentId: activeBranchId,
        label: `回滚 · 消息 ${labelSuffix}`,
        meta: {
          type: "history",
          label: `消息 ${labelSuffix}`
        },
        diagramXml: activeBranch?.diagramXml ?? null,
        seedMessages: truncated,
        inheritMessages: false
      });
      setMessages(truncated);
      setInput(text ?? "");
      if (!revertBranch) {
        updateActiveBranchMessages(truncated);
      }
      pruneHistoryByMessageIds(new Set(truncated.map((msg) => msg.id)));
      releaseBranchRequirement();
    },
    [
      activeBranch,
      activeBranchId,
      createBranch,
      messages,
      setMessages,
      setInput,
      updateActiveBranchMessages,
      releaseBranchRequirement,
      pruneHistoryByMessageIds
    ]
  );
  const renderToolPanel = () => {
    if (!activeToolPanel) return null;
    if (activeToolPanel === "calibration") {
      return <CalibrationConsole
        disabled={status === "streaming" || requiresBranchDecision}
        onAiCalibrate={handleAICalibrationRequest}
      />;
    }
    return <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="inline-flex min-w-[280px] items-center rounded-full bg-slate-100 p-1 overflow-x-auto scrollbar-hide">
                        <button
      type="button"
      onClick={() => setCommandTab("templates")}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition",
        commandTab === "templates" ? "bg-white text-slate-900 shadow" : "text-slate-500"
      )}
    >
                            📚 模板库
                        </button>
                        <button
      type="button"
      onClick={() => setCommandTab("starter")}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition",
        commandTab === "starter" ? "bg-white text-slate-900 shadow" : "text-slate-500"
      )}
    >
                            灵感起稿
                        </button>
                        <button
      type="button"
      onClick={() => setCommandTab("report")}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition",
        commandTab === "report" ? "bg-white text-slate-900 shadow" : "text-slate-500"
      )}
    >
                            述职模板
                        </button>
                        <button
      type="button"
      onClick={() => setCommandTab("showcase")}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition",
        commandTab === "showcase" ? "bg-white text-slate-900 shadow" : "text-slate-500"
      )}
    >
                            样板间
                        </button>
                    </div>
                </div>
                {commandTab === "templates" ? <div className="flex h-full flex-col">
                        <div className="flex-1 overflow-hidden">
                            <TemplateGallery
      variant="compact"
      onSelectTemplate={(template) => {
        if (status === "streaming") return;
        if (!ensureBranchSelectionSettled()) return;
        setInput(template.prompt);
        if (files.length > 0) {
          handleFileChange([]);
        }
        closeToolSidebar();
      }}
      onExpand={() => setIsTemplateDialogOpen(true)}
    />
                        </div>
                    </div> : commandTab === "starter" ? <QuickActionBar
      actions={QUICK_ACTIONS}
      disabled={status === "streaming" || requiresBranchDecision}
      onSelect={handleQuickAction}
      variant="plain"
      title=""
      subtitle=""
    /> : commandTab === "report" ? <ReportBlueprintTray
      disabled={status === "streaming" || requiresBranchDecision}
      onUseTemplate={(template) => handleBlueprintTemplate(template.prompt)}
    /> : <FlowShowcaseGallery
      presets={FLOW_SHOWCASE_PRESETS}
      disabled={status === "streaming" || requiresBranchDecision}
      onSelect={handleShowcasePreset}
    />}
            </div>;
  };
  const showSessionStatus = !isCompactMode || !isConversationStarted;
  const isGenerationBusy = status === "streaming" || status === "submitted" || isComparisonRunning;
  const shouldShowSidebar = Boolean(activeToolPanel && isToolSidebarOpen);
  return <>
            <Card className="relative flex h-full max-h-full min-h-0 flex-col gap-0 rounded-none py-0 overflow-hidden">
                <CardHeader className="flex shrink-0 flex-col gap-1.5 border-b border-slate-100 px-3 py-1.5">
                    <div className="flex w-full items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 rounded-full bg-slate-100 p-0.5">
                                <Link
    href="/"
    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm"
  >
                                    画图工作室
                                </Link>
                                {/* XML 代码页面已注释掉，不再使用 */}
                                {/* <Link
    href="/xml"
    className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-900"
  >
                                    XML 代码
                                    <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-600">
                                        实时预览
                                    </span>
                                </Link> */}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {isCollapsible && <button
    type="button"
    onClick={onCollapse}
    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-white"
    aria-label="收起聊天"
  >
                                    <PanelRightClose className="h-4 w-4" />
                                </button>}
                        </div>
                    </div>

                </CardHeader>
                <CardContent className="flex flex-1 min-h-0 flex-col overflow-hidden">
                    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
                        {!selectedModel && <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-2 text-sm text-amber-900">
                                <div>
                                    Figsci 需要至少配置一个模型接口才能开始生成，请先填写 Base URL、API Key 与模型 ID。
                                </div>
                                <Button
    type="button"
    size="sm"
    className="rounded-full bg-amber-900 text-white hover:bg-amber-900/90"
    onClick={() => setIsModelConfigOpen(true)}
  >
                                    立即配置
                                </Button>
                            </div>}
                        <IntelligenceToolbar
    activePanel={activeToolPanel}
    isSidebarOpen={isToolSidebarOpen}
    onToggle={toggleToolPanel}
  />
                        <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden">
                            {comparisonNotice && <div
    className={cn(
      "mb-3 flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs",
      comparisonNotice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"
    )}
  >
                                    {comparisonNotice.type === "success" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                                    <span className="leading-snug">
                                        {comparisonNotice.message}
                                    </span>
                                </div>}
                            <div
    ref={messagesScrollRef}
    className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-xl bg-white px-2.5 py-2 pb-28"
    style={{ 
      maxHeight: "100%",
      // 让滚动条更早显示：设置最小高度，当内容超过这个高度时就会显示滚动条
      minHeight: "200px"
    }}
  >
                                <ChatMessageDisplay
    messages={messages}
    error={error}
    setInput={setInput}
    setFiles={handleFileChange}
    activeBranchId={activeBranchId}
    onDisplayDiagram={(xml) => handleDiagramXml(xml, {
      origin: "display",
      modelRuntime: selectedModel ?? void 0
    })}
    onComparisonApply={(result) => {
      void handleApplyComparisonResult(result);
    }}
    onComparisonCopyXml={handleCopyXml}
    onComparisonDownload={handleDownloadXml}
    onComparisonPreview={(requestId, result) => {
      void handlePreviewComparisonResult(requestId, result);
    }}
    onComparisonRetry={handleRetryComparisonResult}
    buildComparisonPreviewUrl={buildComparisonPreviewUrl}
    comparisonHistory={comparisonHistory}
    activePreview={activeComparisonPreview}
    onMessageRevert={handleMessageRevert}
    runtimeDiagramError={runtimeError?.message ?? null}
    onConsumeRuntimeError={() => setRuntimeError(null)}
    onStopAll={() => void handleStopAll({
      type: "error",
      message: "已手动暂停当前生成任务。"
    })}
    onRetryGeneration={handleRetryGeneration}
    isGenerationBusy={isGenerationBusy}
    isComparisonRunning={isComparisonRunning}
    diagramResultVersion={diagramResultVersion}
    getDiagramResult={getDiagramResult}
  />
                            </div>
                            <ToolPanelSidebar
    activePanel={activeToolPanel}
    isOpen={shouldShowSidebar}
    onClose={closeToolSidebar}
  >
                                {renderToolPanel()}
                            </ToolPanelSidebar>
                        </div>
                    </div>
                </CardContent>

                <div className="absolute bottom-3 left-0 right-0 z-10 w-full px-3">
                    <div className="flex w-full flex-col gap-1.5">
                        <div className="rounded-2xl shadow-xl">
                            <ChatInputOptimized
    input={input}
    status={status}
    onSubmit={onFormSubmit}
    onChange={handleInputChange}
    onClearChat={handleClearChat}
    files={files}
    onFileChange={handleFileChange}
    showHistory={showHistory}
    onToggleHistory={setShowHistory}
    isCompactMode={isCompactMode && isConversationStarted}
    selectedModelKey={selectedModelKey}
    modelOptions={modelOptions}
    onModelChange={selectModel}
    onManageModels={() => setIsModelConfigOpen(true)}
    onModelStreamingChange={handleModelStreamingChange}
    comparisonEnabled={isComparisonAllowed}
    onCompareRequest={async () => {
      if (!input.trim()) {
        return;
      }
      const parts = [{ type: "text", text: input }];
      if (files.length > 0) {
        const attachments = await serializeAttachments(files);
        attachments.forEach(({ url, mediaType }) => {
          parts.push({
            type: "file",
            url,
            mediaType
          });
        });
      }
      const userMessageId = `user-compare-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: userMessageId,
          role: "user",
          parts
        }
      ]);
      void handleCompareRequest(userMessageId);
      setInput("");
      setFiles([]);
    }}
    onOpenComparisonConfig={() => {
      setIsComparisonConfigOpen(true);
    }}
    isCompareLoading={isComparisonRunning}
    interactionLocked={requiresBranchDecision || !selectedModel}
    renderMode={renderMode}
    onRenderModeChange={handleRenderModeChange}
    historyItems={historyItems}
    onRestoreHistory={handleRestoreHistory}
    onStop={() => handleStopAll({
      type: "success",
      message: "已手动暂停当前生成任务。"
    })}
    isBusy={isGenerationBusy}
  />
                        </div>
                    </div>
                </div>

            </Card>
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogContent className="!max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-4 pb-2">
                        <DialogTitle>全屏模板库</DialogTitle>
                        <DialogDescription>
                            大屏浏览全部模板，包含筛选、预览与快捷应用。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="h-[calc(90vh-96px)]">
                        <TemplateGallery
    onSelectTemplate={(template) => {
      if (status === "streaming") return;
      if (!ensureBranchSelectionSettled()) return;
      setInput(template.prompt);
      if (files.length > 0) {
        handleFileChange([]);
      }
      setIsTemplateDialogOpen(false);
      closeToolSidebar();
    }}
  />
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>交流联系</DialogTitle>
                        <DialogDescription>
                            如果你在使用 Figsci 或图表创作时遇到问题、希望一起探讨方案，
                            欢迎通过微信联系我。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-slate-50 p-4 shadow-inner">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-violet-500">
                            微信号
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                            <span className="text-lg font-semibold tracking-wide text-slate-900">
                                leland1999
                            </span>
                            <button
    type="button"
    onClick={handleCopyWechat}
    className={cn(
      "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-medium transition",
      contactCopyState === "copied" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-violet-200 bg-white text-violet-600 hover:border-violet-300"
    )}
  >
                                {contactCopyState === "copied" ? <>
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        已复制
                                    </> : <>
                                        <Copy className="h-3.5 w-3.5" />
                                        复制
                                    </>}
                            </button>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                            简单备注一下问题背景或想聊的主题，我会在方便时尽快回复。
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
            <ModelComparisonConfigDialog
    open={isComparisonConfigOpen}
    onOpenChange={setIsComparisonConfigOpen}
    config={comparisonConfig}
    onConfigChange={setComparisonConfig}
    defaultPrimaryKey={selectedModelKey}
    models={modelOptions}
    onManageModels={() => setIsModelConfigOpen(true)}
  />
            <ModelConfigDialog
    open={isModelConfigOpen}
    onOpenChange={setIsModelConfigOpen}
    endpoints={modelEndpoints}
    onSave={saveEndpoints}
  />
        </>;
}
export {
  ChatPanelOptimized as default
};
