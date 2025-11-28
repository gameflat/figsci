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
import {
  FlowPilotBriefLauncher,
  FlowPilotBriefDialog,
  DEFAULT_BRIEF_STATE,
  FOCUS_OPTIONS,
  INTENT_OPTIONS,
  TONE_OPTIONS,
  DIAGRAM_TYPE_OPTIONS,
  FLOWPILOT_FREEFORM_PROMPT
} from "./flowpilot-brief";
import { ReportBlueprintTray } from "./report-blueprint-tray";
import { CalibrationConsole } from "./calibration-console";
import { useChatState } from "@/hooks/use-chat-state";
import { EMPTY_MXFILE } from "@/lib/diagram-templates";
import { ModelComparisonConfigDialog } from "@/components/model-comparison-config-dialog";
import { IntelligenceToolbar } from "@/features/chat-panel/components/intelligence-toolbar";
import { ToolPanelSidebar } from "@/features/chat-panel/components/tool-panel-sidebar";
import {
  FLOWPILOT_AI_CALIBRATION_PROMPT,
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
    saveEndpoints
  } = useModelRegistry();
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
  const [briefState, setBriefState] = useState(() => ({
    ...DEFAULT_BRIEF_STATE
  }));
  const [commandTab, setCommandTab] = useState(
    "templates"
  );
  const [activeToolPanel, setActiveToolPanel] = useState(null);
  const [isToolSidebarOpen, setIsToolSidebarOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isBriefDialogOpen, setIsBriefDialogOpen] = useState(false);
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
  const briefMode = briefState.mode ?? "guided";
  const briefContext = useMemo(() => {
    if (briefMode === "free") {
      return {
        prompt: FLOWPILOT_FREEFORM_PROMPT,
        badges: [
          "\u81EA\u7531\xB7AI \u81EA\u4E3B\u9009\u578B",
          "\u9ED8\u8BA4\xB7\u5E72\u51C0\u7F8E\u89C2"
        ],
        mode: briefMode
      };
    }
    const intentMeta = INTENT_OPTIONS.find(
      (option) => option.id === briefState.intent
    );
    const toneMeta = TONE_OPTIONS.find(
      (option) => option.id === briefState.tone
    );
    const focusMeta = FOCUS_OPTIONS.filter(
      (option) => briefState.focus.includes(option.id)
    );
    const diagramTypeMeta = DIAGRAM_TYPE_OPTIONS.filter(
      (option) => briefState.diagramTypes.includes(option.id)
    );
    const segments = [];
    const badges = [];
    if (intentMeta) {
      segments.push(`\u6A21\u5F0F\uFF1A\u300C${intentMeta.title}\u300D\u2014 ${intentMeta.prompt}`);
      badges.push(`\u6A21\u5F0F\xB7${intentMeta.title}`);
    }
    if (toneMeta) {
      segments.push(`\u89C6\u89C9\uFF1A${toneMeta.prompt}`);
      badges.push(`\u89C6\u89C9\xB7${toneMeta.title}`);
    }
    if (focusMeta.length > 0) {
      segments.push(
        `\u91CD\u70B9\uFF1A${focusMeta.map((item) => item.prompt).join("\uFF1B")}`
      );
      focusMeta.forEach((item) => badges.push(`\u91CD\u70B9\xB7${item.title}`));
    }
    if (diagramTypeMeta.length > 0) {
      segments.push(
        `\u56FE\u578B\uFF1A${diagramTypeMeta.map((item) => item.prompt).join("\uFF1B")}`
      );
      diagramTypeMeta.forEach(
        (item) => badges.push(`\u56FE\u578B\xB7${item.title}`)
      );
    }
    const prompt = segments.length > 0 ? `### FlowPilot Brief\\n${segments.map((segment) => `- ${segment}`).join("\\n")}` : "";
    return { prompt, badges, mode: briefMode };
  }, [briefMode, briefState]);
  const briefDisplayBadges = briefContext.badges.length > 0 ? briefContext.badges : briefMode === "free" ? [
    "\u81EA\u7531\xB7AI \u81EA\u4E3B\u9009\u578B",
    "\u9ED8\u8BA4\xB7\u5E72\u51C0\u7F8E\u89C2"
  ] : [
    "\u6A21\u5F0F\xB7\u7A7A\u767D\u8D77\u7A3F",
    "\u89C6\u89C9\xB7\u4E2D\u6027\u7B80\u7EA6",
    "\u91CD\u70B9\xB7\u7B80\u6D01\u6E05\u6670"
  ];
  const briefSummary = briefDisplayBadges.slice(0, 3).join(" \xB7 ");
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
            throw new Error("\u5927\u6A21\u578B\u8FD4\u56DE\u7684 XML \u4E3A\u7A7A\uFF0C\u65E0\u6CD5\u6E32\u67D3\u3002");
          }
          if (isSvgMode) {
            addToolResult({
              tool: "display_diagram",
              toolCallId: toolCall.toolCallId,
              output: "\u5F53\u524D\u5904\u4E8E SVG \u6A21\u5F0F\uFF0C\u8BF7\u4F7F\u7528 display_svg \u5DE5\u5177\u8FD4\u56DE SVG\u3002"
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
            throw new Error("\u5927\u6A21\u578B\u8FD4\u56DE\u7684 SVG \u4E3A\u7A7A\uFF0C\u65E0\u6CD5\u6E32\u67D3\u3002");
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
              output: "SVG \u5DF2\u8F7D\u5165\u65B0\u7F16\u8F91\u5668\uFF0C\u53EF\u76F4\u63A5\u7F16\u8F91\u3002"
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
            output: "SVG \u5DF2\u8F6C\u6362\u5E76\u6E32\u67D3\u5230\u753B\u5E03\u3002"
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
    briefContext,
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
        notifyComparison("error", "\u5F53\u524D\u7ED3\u679C\u7F3A\u5C11 XML \u5185\u5BB9\uFF0C\u65E0\u6CD5\u590D\u5236\u3002");
        return;
      }
      try {
        await navigator.clipboard.writeText(xml);
        notifyComparison("success", "XML \u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F\u3002");
      } catch (copyError) {
        console.error("Copy XML failed:", copyError);
        notifyComparison("error", "\u590D\u5236 XML \u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u6D4F\u89C8\u5668\u6743\u9650\u3002");
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
        console.error("\u505C\u6B62\u751F\u6210\u5931\u8D25\uFF1A", stopError);
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
        console.error("\u6CA1\u6709\u627E\u5230\u7528\u6237\u6D88\u606F\u53EF\u4EE5\u91CD\u8BD5");
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
            modelRuntime: selectedModel,
            enableStreaming: streamingFlag,
            renderMode
          }
        }
      );
    } catch (error2) {
      console.error("\u91CD\u8BD5\u751F\u6210\u5931\u8D25\uFF1A", error2);
    }
  }, [status, stop, messages, setMessages, sendMessage, onFetchChart, selectedModel, renderMode]);
  const handleCopyWechat = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText("leland1999");
      } else if (typeof window !== "undefined") {
        const fallback = window.prompt("\u590D\u5236\u5FAE\u4FE1\u53F7", "leland1999");
        if (fallback === null) {
          throw new Error("\u7528\u6237\u53D6\u6D88\u590D\u5236\u3002");
        }
      }
      setContactCopyState("copied");
      setTimeout(() => setContactCopyState("idle"), 1800);
    } catch (error2) {
      console.error("\u590D\u5236\u5FAE\u4FE1\u53F7\u5931\u8D25\uFF1A", error2);
      setContactCopyState("idle");
    }
  }, []);
  const briefTagTone = useCallback((badge) => {
    const prefix = badge.split("\xB7")[0];
    switch (prefix) {
      case "\u6A21\u5F0F":
        return "border-indigo-200 bg-indigo-50 text-indigo-700";
      case "\u89C6\u89C9":
        return "border-rose-200 bg-rose-50 text-rose-700";
      case "\u91CD\u70B9":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "\u62A4\u680F":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "\u81EA\u7531":
        return "border-sky-200 bg-sky-50 text-sky-700";
      case "\u8BED\u6CD5":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "\u9ED8\u8BA4":
        return "border-slate-200 bg-slate-50 text-slate-700";
      default:
        return "border-slate-200 bg-slate-50 text-slate-700";
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
        message: "\u67E5\u770B\u5386\u53F2\u65F6\u5DF2\u6682\u505C\u5F53\u524D\u751F\u6210\u3002"
      });
    }
  }, [showHistory, status, isComparisonRunning, handleStopAll]);
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
        const enrichedInput = briefContext.prompt.length > 0 ? `${briefContext.prompt}

${input}` : input;
        const parts = [{ type: "text", text: enrichedInput, displayText: input }];
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
              modelRuntime: selectedModel,
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
      briefContext.prompt,
      files,
      sendMessage,
      selectedModel,
      setIsModelConfigOpen,
      renderMode
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
      throw new Error("\u8BF7\u5148\u5904\u7406\u5BF9\u6BD4\u7ED3\u679C\uFF0C\u518D\u6267\u884C\u6821\u51C6\u3002");
    }
    if (status === "streaming") {
      throw new Error("AI \u6B63\u5728\u56DE\u7B54\u5176\u4ED6\u8BF7\u6C42\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002");
    }
    if (!selectedModel) {
      setIsModelConfigOpen(true);
      throw new Error("\u8BF7\u5148\u914D\u7F6E\u53EF\u7528\u6A21\u578B\u540E\u518D\u6267\u884C\u6821\u51C6\u3002");
    }
    if (renderMode === "svg") {
      throw new Error("SVG \u6A21\u5F0F\u6682\u4E0D\u652F\u6301\u6821\u51C6\uFF0C\u8BF7\u5207\u6362\u56DE draw.io XML \u6A21\u5F0F\u3002");
    }
    let chartXml = await onFetchChart();
    if (!chartXml.trim()) {
      throw new Error("\u5F53\u524D\u753B\u5E03\u4E3A\u7A7A\uFF0C\u65E0\u6CD5\u6267\u884C\u6821\u51C6\u3002");
    }
    const userVisibleMessage = "\u{1F3AF} \u542F\u52A8 AI \u6821\u51C6\n\n\u8BF7\u4F18\u5316\u5F53\u524D\u6D41\u7A0B\u56FE\u7684\u5E03\u5C40\uFF1A\n\u2022 \u4FDD\u6301\u6240\u6709\u8282\u70B9\u548C\u5185\u5BB9\u4E0D\u53D8\n\u2022 \u4F18\u5316\u8282\u70B9\u4F4D\u7F6E\u548C\u95F4\u8DDD\n\u2022 \u6574\u7406\u8FDE\u63A5\u7EBF\u8DEF\u5F84\n\u2022 \u4F7F\u7528 edit_diagram \u5DE5\u5177\u8FDB\u884C\u6279\u91CF\u8C03\u6574";
    const streamingFlag = selectedModel?.isStreaming ?? false;
    await sendMessage(
      {
        parts: [
          {
            type: "text",
            // 用户看到的是简化版本
            text: userVisibleMessage + "\n\n---\n\n" + FLOWPILOT_AI_CALIBRATION_PROMPT
          }
        ]
      },
      {
        body: {
          xml: chartXml,
          modelRuntime: selectedModel,
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
    setBriefState(preset.brief);
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
        message: "\u5DF2\u6682\u505C\u5F53\u524D\u751F\u6210\uFF0C\u51C6\u5907\u5207\u6362\u5206\u652F\u3002"
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
      message: "\u5DF2\u6E05\u7A7A\u5F53\u524D\u5BF9\u8BDD\u5E76\u505C\u6B62\u751F\u6210\u3002"
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
  const handleOpenBriefPanel = useCallback(() => {
    if (status === "streaming") {
      return;
    }
    setIsBriefDialogOpen(true);
  }, [status]);
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
          console.error("\u5207\u6362\u5206\u652F\u5E94\u7528\u753B\u5E03\u5931\u8D25\uFF1A", error2);
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
          message: "\u5DF2\u5207\u6362\u5206\u652F\uFF0C\u81EA\u52A8\u6682\u505C\u751F\u6210\u3002"
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
        label: `\u56DE\u6EDA \xB7 \u6D88\u606F ${labelSuffix}`,
        meta: {
          type: "history",
          label: `\u6D88\u606F ${labelSuffix}`
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
    if (activeToolPanel === "brief") {
      return <FlowPilotBriefLauncher
        state={briefState}
        onChange={(next) => setBriefState((prev) => ({ ...prev, ...next }))}
        disabled={status === "streaming"}
        badges={briefContext.badges}
      />;
    }
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
        setBriefState(template.brief);
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
                                <Link
    href="/xml"
    className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-900"
  >
                                    XML 代码
                                    <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-600">
                                        实时预览
                                    </span>
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <a
    href="https://github.com/cos43/flowpilot"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-white"
    aria-label="在 GitHub 查看源码"
  >
                                <FaGithub className="h-4 w-4" />
                            </a>
                            <button
    type="button"
    onClick={() => {
      setContactCopyState("idle");
      setIsContactDialogOpen(true);
    }}
    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-violet-200 bg-white/80 text-violet-600 shadow-sm transition hover:border-violet-300 hover:bg-white"
    aria-label="交流联系"
    title="交流联系"
  >
                                <Handshake className="h-4 w-4" />
                            </button>
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
                                    FlowPilot 需要至少配置一个模型接口才能开始生成，请先填写 Base URL、API Key 与模型 ID。
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
    className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-xl  bg-white px-2.5 py-2 pb-28"
    style={{ maxHeight: "100%" }}
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
    onOpenBriefPanel={status === "streaming" ? void 0 : handleOpenBriefPanel}
    briefBadges={briefDisplayBadges}
    briefSummary={briefSummary}
    runtimeDiagramError={runtimeError?.message ?? null}
    onConsumeRuntimeError={() => setRuntimeError(null)}
    onStopAll={() => void handleStopAll({
      type: "error",
      message: "\u5DF2\u624B\u52A8\u6682\u505C\u5F53\u524D\u751F\u6210\u4EFB\u52A1\u3002"
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
                        {briefDisplayBadges.length > 0 && <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-3 py-1.5 text-[11px] text-slate-500 shadow-lg backdrop-blur-md transition-all hover:bg-white/90">
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-2 py-0.5 font-semibold uppercase tracking-[0.25em] text-slate-600">
                                    <Sparkles className="h-3 w-3 text-amber-500" />
                                    Brief
                                </span>
                                <div
    className="flex min-w-0 max-w-[300px] items-center gap-1 overflow-hidden whitespace-nowrap pr-1"
    title={briefDisplayBadges.join(" \xB7 ")}
  >
                                    {briefDisplayBadges.map((badge, index) => <span
    key={`${badge}-${index}`}
    className={cn(
      "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium",
      briefTagTone(badge)
    )}
  >
                                            {badge}
                                        </span>)}
                                </div>
                                <button
    type="button"
    onClick={handleOpenBriefPanel}
    disabled={status === "streaming"}
    className={cn(
      "shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:border-slate-400",
      status === "streaming" && "cursor-not-allowed opacity-50 hover:border-slate-200"
    )}
  >
                                    调整
                                </button>
                            </div>}
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
      const enrichedInput = briefContext.prompt.length > 0 ? `${briefContext.prompt}

${input}` : input;
      const parts = [{ type: "text", text: enrichedInput, displayText: input }];
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
      message: "\u5DF2\u624B\u52A8\u6682\u505C\u5F53\u524D\u751F\u6210\u4EFB\u52A1\u3002"
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
      setBriefState(template.brief);
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
                            如果你在使用 FlowPilot 或图表创作时遇到问题、希望一起探讨方案，
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
            <FlowPilotBriefDialog
    open={isBriefDialogOpen}
    onOpenChange={setIsBriefDialogOpen}
    state={briefState}
    onChange={(next) => setBriefState((prev) => ({
      ...prev,
      ...next
    }))}
    disabled={status === "streaming"}
  />
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
