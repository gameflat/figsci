// -*- coding: utf-8 -*-
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaGithub } from "react-icons/fa";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Handshake,
  X,
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
// useSvgEditor 已移除：SVG 模式现在统一使用 Draw.io 画布
import { cn, formatXML, replaceXMLParts } from "@/lib/utils";
import { buildSvgRootXml } from "@/lib/svg";
import { QuickActionBar } from "@/components/quick-action-bar";
import { FlowShowcaseGallery } from "./flow-showcase-gallery";
import { ReportBlueprintTray } from "./report-blueprint-tray";
import { CalibrationConsole } from "./calibration-console";
import { useChatState } from "@/hooks/use-chat-state";
import { EMPTY_MXFILE } from "@/lib/diagram-templates";
// IntelligenceToolbar 已移除
import { ToolPanelSidebar } from "@/features/chat-panel/components/tool-panel-sidebar";
import {
  Figsci_AI_CALIBRATION_PROMPT,
  FLOW_SHOWCASE_PRESETS,
  QUICK_ACTIONS
} from "@/features/chat-panel/constants";
import { useDiagramOrchestrator } from "@/features/chat-panel/hooks/use-diagram-orchestrator";
import { serializeAttachments } from "@/features/chat-panel/utils/attachments";
import { useModelRegistry } from "@/hooks/use-model-registry";
import { TemplateGallery } from "@/components/template-gallery";
import Link from "next/link";
// 光子扣费客户端：用于 mixed 模式预扣费
import { isPhotonChargeEnabled, getChargeMode, preChargePhoton } from "@/lib/photon-client";
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
  // useSvgEditor 已移除：SVG 模式现在统一使用 Draw.io 画布
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
  
  // ========== Mixed 模式状态快照和回滚机制 ==========
  // 用于在预扣费后保存状态，任务失败或扣费失败时可以回滚
  /**
   * @typedef {Object} StateSnapshot
   * @property {Array} messages - 消息列表快照
   * @property {string|null} diagramXml - 画布 XML 快照
   * @property {string} chartXML - 当前画布 XML
   * @property {number} timestamp - 快照时间戳
   */
  /** @type {React.MutableRefObject<StateSnapshot|null>} */
  const stateSnapshotRef = useRef(null);
  const {
    activeBranch,
    activeBranchId,
    branchTrail,
    branchList,
    activeRenderMode: contextRenderMode,
    createBranch,
    switchBranch,
    switchRenderMode,
    updateActiveBranchMessages,
    updateActiveBranchDiagram,
    resetActiveBranch
  } = useConversationManager();
  const { handleDiagramXml, tryApplyRoot, updateLatestDiagramXml, getLatestDiagramXml } = useDiagramOrchestrator({
    chartXML,
    onDisplayChart,
    updateActiveBranchDiagram
  });
  // 统一使用 handleDiagramXml 处理画布更新
  // SVG 模式下，SVG 会在调用此函数前通过 buildSvgRootXml 转换为 Draw.io XML
  const handleCanvasUpdate = useCallback(
    async (payload, meta) => {
      await handleDiagramXml(payload, meta);
    },
    [handleDiagramXml]
  );
  // 统一使用 tryApplyRoot 处理根 XML
  // SVG 模式下，SVG 会在调用此函数前通过 buildSvgRootXml 转换为 Draw.io XML
  const tryApplyCanvasRoot = useCallback(
    async (xml) => {
      await tryApplyRoot(xml);
    },
    [tryApplyRoot]
  );
  const getLatestCanvasMarkup = useCallback(
    // 统一使用 getLatestDiagramXml，因为两种模式都使用 Draw.io 画布
    () => getLatestDiagramXml(),
    [getLatestDiagramXml]
  );
  const lastBranchIdRef = useRef(activeBranchId);
  const initialHydratedRef = useRef(false);
  const lastRenderModeRef = useRef(renderMode);

  // 监听 renderMode 变化的逻辑将在 useChat 之后定义，避免 TDZ 错误
  const fetchAndFormatDiagram = useCallback(
    async (options) => {
      if (isSvgMode) {
        // 统一使用 fetchDiagramXml，因为两种模式都使用 Draw.io 画布
        return fetchDiagramXml();
      }
      const rawXml = await fetchDiagramXml(options);
      const formatted = formatXML(rawXml);
      updateLatestDiagramXml(formatted);
      return formatted;
    },
    [fetchDiagramXml, updateLatestDiagramXml]
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
  
  const hasPromptedModelSetup = useRef(false);
  
  // Architect Workflow 配置状态（使用 localStorage 持久化）
  // 必须在 buildModelRequestBody 之前定义，因为 buildModelRequestBody 依赖它
  const [architectWorkflowConfig, setArchitectWorkflowConfig] = useState(() => {
    if (typeof window === "undefined") return { enabled: false, architectModel: null, rendererModel: null };
    try {
      const saved = localStorage.getItem("architectWorkflowConfig");
      return saved ? JSON.parse(saved) : { enabled: false, architectModel: null, rendererModel: null };
    } catch {
      return { enabled: false, architectModel: null, rendererModel: null };
    }
  });
  
  // 保存 Architect Workflow 配置到 localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("architectWorkflowConfig", JSON.stringify(architectWorkflowConfig));
      } catch (error) {
        console.warn("保存 Architect Workflow 配置失败:", error);
      }
    }
  }, [architectWorkflowConfig]);
  
  // 当系统模型存在时，设置 ArchitectWorkflow 默认使用最后一个系统模型
  useEffect(() => {
    if (!isModelRegistryReady || !modelOptions || modelOptions.length === 0) {
      return;
    }
    
    // 筛选出所有系统模型
    const systemModels = modelOptions.filter((model) => model.isSystemModel);
    
    if (systemModels.length === 0) {
      return;
    }
    
    // 获取最后一个系统模型
    const lastSystemModel = systemModels[systemModels.length - 1];
    
    // 只在配置为 null 时设置默认值，避免覆盖用户已配置的值
    setArchitectWorkflowConfig((prev) => {
      const needsUpdate = 
        (prev.architectModel === null || prev.architectModel === undefined) ||
        (prev.rendererModel === null || prev.rendererModel === undefined);
      
      if (!needsUpdate) {
        return prev;
      }
      
      const updated = { ...prev };
      
      if (updated.architectModel === null || updated.architectModel === undefined) {
        updated.architectModel = lastSystemModel;
        console.log("[ArchitectWorkflow] 设置默认 Architect 模型:", lastSystemModel.label || lastSystemModel.modelId);
      }
      
      if (updated.rendererModel === null || updated.rendererModel === undefined) {
        updated.rendererModel = lastSystemModel;
        console.log("[ArchitectWorkflow] 设置默认 Renderer 模型:", lastSystemModel.label || lastSystemModel.modelId);
      }
      
      return updated;
    });
  }, [isModelRegistryReady, modelOptions]);
  
  // 生成请求体中的模型配置
  // 系统模型：发送 useSystemModel + systemModelId
  // 自定义模型：发送完整的 modelRuntime
  // 自定义 API：发送 customApiUrl + customApiKey（用于模板匹配等场景）
  const buildModelRequestBody = useCallback(
    (model) => {
      if (!model) {
        return {};
      }
      
      const baseConfig = model.isSystemModel
        ? {
            // 系统模型：只发送模型标识，服务端从环境变量获取配置
            useSystemModel: true,
            systemModelId: model.modelId,
          }
        : {
            // 自定义模型：发送完整配置
            modelRuntime: model,
          };
      
      // 如果启用了 Architect Workflow，添加相关配置
      if (architectWorkflowConfig.enabled) {
        return {
          ...baseConfig,
          enableArchitectWorkflow: true,
          architectModel: architectWorkflowConfig.architectModel
            ? (architectWorkflowConfig.architectModel.isSystemModel
                ? {
                    useSystemModel: true,
                    systemModelId: architectWorkflowConfig.architectModel.modelId,
                  }
                : {
                    modelRuntime: architectWorkflowConfig.architectModel,
                  })
            : baseConfig, // 如果未配置，使用默认模型
          rendererModel: architectWorkflowConfig.rendererModel
            ? (architectWorkflowConfig.rendererModel.isSystemModel
                ? {
                    useSystemModel: true,
                    systemModelId: architectWorkflowConfig.rendererModel.modelId,
                  }
                : {
                    modelRuntime: architectWorkflowConfig.rendererModel,
                  })
            : baseConfig, // 如果未配置，使用默认模型
        };
      }
      
      return baseConfig;
    },
    [architectWorkflowConfig]
  );
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  // 统一使用 mxDiagramHistory，因为 SVG 模式下历史记录也是 Draw.io XML 格式
  const historyItems = useMemo(
    () => mxDiagramHistory,
    [mxDiagramHistory]
  );
  // 统一使用 restoreDiagramAt，因为 SVG 模式下历史记录也是 Draw.io XML 格式
  const handleRestoreHistory = useCallback(
    (index) => {
      restoreDiagramAt(index);
    },
    [restoreDiagramAt]
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
  // 提交状态标记：防止用户在异步操作期间重复点击发送按钮
  const [isSubmitting, setIsSubmitting] = useState(false);
  // AbortController 用于取消提交过程中的异步请求（如模板匹配）
  const submitAbortControllerRef = useRef(null);
  // 生成进度阶段：用于显示详细的进度提示
  // "idle" | "preparing" | "matching" | "sending" | "thinking" | "generating"
  const [generationPhase, setGenerationPhase] = useState("idle");
  // 进度指示器重置控制
  const progressResetTrigger = useRef(0);
  // 超时保护：如果 status === "ready" 超过 30 秒仍然没有完成，自动重置为 idle
  const readyStatusTimeoutRef = useRef(null);
  // 工具调用后的状态监听：跟踪 addToolResult 后的响应情况
  const toolResultTimeoutRefs = useRef(new Map());
  // 手动触发响应的标记，避免重复触发
  const manualTriggerRef = useRef(new Set());
  
  // 使用 ref 存储 useChat 返回的值，避免在 useChat 之前访问导致 TDZ 错误
  const statusRef = useRef(null);
  const messagesRef = useRef(null);
  const sendMessageRef = useRef(null);
  // 使用 ref 存储模型配置相关值，用于手动触发响应时传递配置
  const selectedModelRef = useRef(null);
  const renderModeRef = useRef(null);
  const fetchAndFormatDiagramRef = useRef(null);
  const buildModelRequestBodyRef = useRef(null);
  
  /**
   * 手动触发下一轮 LLM 响应
   * 当 finishReason 是 'stop' 且任务未完成时，addToolResult 不会自动触发下一轮响应
   * 需要手动调用 sendMessage 来触发
   * 
   * @param {string} toolCallId - 工具调用 ID，用于避免重复触发
   * @param {string} toolName - 工具名称，用于日志
   */
  const triggerManualResponse = useCallback((toolCallId, toolName) => {
    console.log(`[triggerManualResponse] 开始处理 (工具: ${toolName}, toolCallId: ${toolCallId})`, {
      currentStatus: statusRef.current,
      hasBeenTriggered: manualTriggerRef.current.has(toolCallId),
      messagesCount: messagesRef.current?.length
    });
    
    // 避免重复触发
    if (manualTriggerRef.current.has(toolCallId)) {
      console.log(`[triggerManualResponse] ⚠️ 已触发过，跳过 (工具: ${toolName}, toolCallId: ${toolCallId})`, {
        reason: "已标记为已触发",
        triggerSet: Array.from(manualTriggerRef.current)
      });
      return;
    }
    
    // 检查状态，避免在流式生成时触发
    // 使用 ref 访问，避免 TDZ 错误
    const currentStatus = statusRef.current;
    if (currentStatus === "streaming" || currentStatus === "submitted") {
      console.log(`[triggerManualResponse] ⚠️ 状态为 ${currentStatus}，跳过手动触发 (工具: ${toolName})`, {
        reason: "流式生成中或已提交，不应触发",
        currentStatus,
        toolCallId
      });
      return;
    }
    
    // 延迟检查，等待 metadata 更新
    // 使用多次尝试，确保能够正确检测到 metadata
    // 增加重试次数从3次到5次，延迟时间从500ms增加到1000ms
    const checkAndTrigger = (attempt = 0, maxAttempts = 5) => {
      const currentMessages = messagesRef.current;
      const lastAssistant = currentMessages?.filter(m => m.role === 'assistant').pop();
      const metadata = lastAssistant?.metadata;
      const finishReason = metadata?.finishReason;
      const isTaskCompleted = metadata?.isTaskCompleted;
      const taskFailed = metadata?.taskFailed;
      const reactInfo = metadata?.reactInfo;
      const actionCount = reactInfo?.actionCount || 0;
      const maxActions = reactInfo?.maxActions || 3;
      const reachedMaxActions = reactInfo?.reachedMaxActions || false;
      
      // 检查是否有工具结果已添加（通过检查消息中是否有对应的 tool 消息）
      const hasToolResult = currentMessages?.some(msg => 
        msg.role === 'tool' && msg.toolCallId === toolCallId
      ) || false;
      
      console.log(`[triggerManualResponse] 检查是否需要手动触发响应 (工具: ${toolName}, 尝试 ${attempt + 1}/${maxAttempts})`, {
        toolCallId,
        finishReason,
        isTaskCompleted,
        taskFailed,
        actionCount,
        maxActions,
        reachedMaxActions,
        status: currentStatus,
        hasMetadata: !!metadata,
        hasToolResult,
        lastAssistantId: lastAssistant?.id
      });
      
      // 如果 finishReason 是 'stop' 且任务未完成，需要手动触发
      // 同时检查 taskFailed：如果 taskFailed 为 false 或还有剩余行动次数，应该继续
      if (finishReason === 'stop' && isTaskCompleted === false) {
        // 如果 taskFailed 为 true 且已达到最大行动次数，不应该继续
        if (taskFailed === true && reachedMaxActions) {
          console.log(`[triggerManualResponse] ⚠️ 任务失败且已达到最大行动次数，不触发响应 (工具: ${toolName})`, {
            reason: "任务失败且无剩余行动次数",
            taskFailed,
            reachedMaxActions,
            actionCount,
            maxActions,
            toolCallId
          });
          return;
        }
        
        console.log(`[triggerManualResponse] ✅ 检测到 finishReason='stop' 且任务未完成，手动触发下一轮响应 (工具: ${toolName})`);
        
        // 标记已触发，避免重复
        manualTriggerRef.current.add(toolCallId);
        
        // 手动触发下一轮响应
        // 发送一个空消息，让 LLM 继续处理工具结果
        // 需要传递完整的配置信息，包括模型配置、XML、renderMode 等
        const currentSendMessage = sendMessageRef.current;
        if (currentSendMessage) {
          console.log(`[triggerManualResponse] 调用 sendMessage 触发下一轮响应 (工具: ${toolName})`);
          
          // 异步获取图表 XML 和构建请求体
          const triggerWithConfig = async () => {
            try {
              // 获取当前图表 XML
              const currentXml = fetchAndFormatDiagramRef.current 
                ? await fetchAndFormatDiagramRef.current({ saveHistory: false })
                : "";
              
              // 构建模型配置
              const modelConfig = buildModelRequestBodyRef.current 
                ? buildModelRequestBodyRef.current(selectedModelRef.current)
                : {};
              
              // 获取流式标志
              const streamingFlag = renderModeRef.current === "svg" 
                ? false 
                : (selectedModelRef.current?.isStreaming ?? false);
              
              console.log(`[triggerManualResponse] 准备发送请求，包含模型配置`, {
                hasModelConfig: !!Object.keys(modelConfig).length,
                hasXml: !!currentXml,
                renderMode: renderModeRef.current,
                streamingFlag
              });
              
              // 调用 sendMessage，传递完整的配置信息
              currentSendMessage(
                { 
                  parts: [{ type: "text", text: "" }]
                },
                {
                  body: {
                    xml: currentXml,
                    ...modelConfig,
                    enableStreaming: streamingFlag,
                    renderMode: renderModeRef.current || "drawio"
                  }
                }
              );
            } catch (error) {
              console.error(`[triggerManualResponse] 获取配置信息失败，使用简化请求`, error);
              // 如果获取配置失败，至少尝试发送一个空消息
              currentSendMessage({ 
                parts: [{ type: "text", text: "" }]
              });
            }
          };
          
          // 立即触发
          triggerWithConfig();
        } else {
          console.warn(`[triggerManualResponse] ⚠️ sendMessage 不可用，无法触发下一轮响应 (工具: ${toolName})`);
        }
        return; // 成功触发后直接返回
      } 
      
      // 如果 metadata 还没有更新，继续等待
      if (attempt < maxAttempts - 1 && !metadata) {
        const delay = 1000; // 增加延迟时间到1000ms
        console.log(`[triggerManualResponse] metadata 尚未更新，${delay}ms 后重试 (工具: ${toolName}, 尝试 ${attempt + 1}/${maxAttempts})`);
        setTimeout(() => checkAndTrigger(attempt + 1, maxAttempts), delay);
        return;
      }
      
      // 如果所有尝试都失败，但有工具结果已添加，使用兜底机制直接触发
      if (attempt >= maxAttempts - 1 && hasToolResult) {
        console.warn(`[triggerManualResponse] ⚠️ 所有检查尝试都失败，但检测到工具结果已添加，使用兜底机制直接触发 (工具: ${toolName})`);
        
        // 标记已触发，避免重复
        manualTriggerRef.current.add(toolCallId);
        
        // 兜底机制：直接触发下一轮响应
        const currentSendMessage = sendMessageRef.current;
        if (currentSendMessage) {
          console.log(`[triggerManualResponse] [兜底机制] 调用 sendMessage 触发下一轮响应 (工具: ${toolName})`);
          
          // 异步获取图表 XML 和构建请求体
          const triggerWithConfig = async () => {
            try {
              // 获取当前图表 XML
              const currentXml = fetchAndFormatDiagramRef.current 
                ? await fetchAndFormatDiagramRef.current({ saveHistory: false })
                : "";
              
              // 构建模型配置
              const modelConfig = buildModelRequestBodyRef.current 
                ? buildModelRequestBodyRef.current(selectedModelRef.current)
                : {};
              
              // 获取流式标志
              const streamingFlag = renderModeRef.current === "svg" 
                ? false 
                : (selectedModelRef.current?.isStreaming ?? false);
              
              console.log(`[triggerManualResponse] [兜底机制] 准备发送请求，包含模型配置`, {
                hasModelConfig: !!Object.keys(modelConfig).length,
                hasXml: !!currentXml,
                renderMode: renderModeRef.current,
                streamingFlag
              });
              
              // 调用 sendMessage，传递完整的配置信息
              currentSendMessage(
                { 
                  parts: [{ type: "text", text: "" }]
                },
                {
                  body: {
                    xml: currentXml,
                    ...modelConfig,
                    enableStreaming: streamingFlag,
                    renderMode: renderModeRef.current || "drawio"
                  }
                }
              );
            } catch (error) {
              console.error(`[triggerManualResponse] [兜底机制] 获取配置信息失败，使用简化请求`, error);
              // 如果获取配置失败，至少尝试发送一个空消息
              currentSendMessage({ 
                parts: [{ type: "text", text: "" }]
              });
            }
          };
          
          // 立即触发
          triggerWithConfig();
        } else {
          console.error(`[triggerManualResponse] [兜底机制] ⚠️ sendMessage 不可用，无法触发下一轮响应 (工具: ${toolName})`);
        }
        return;
      }
      
      // 其他情况：不需要手动触发
      console.log(`[triggerManualResponse] ⚠️ 不需要手动触发 (工具: ${toolName})`, {
        finishReason,
        isTaskCompleted,
        taskFailed,
        hasToolResult,
        actionCount,
        maxActions,
        reachedMaxActions,
        attempt,
        maxAttempts,
        hasMetadata: !!metadata,
        reason: finishReason !== 'stop' 
          ? `finishReason 是 '${finishReason}'，不是 'stop'` 
          : (isTaskCompleted 
            ? '任务已完成' 
            : '其他原因（可能是条件不满足）'),
        toolCallId
      });
    };
    
    // 首次检查延迟 1000ms，给 metadata 更多时间更新
    console.log(`[triggerManualResponse] 开始检查流程，1000ms 后首次检查 (工具: ${toolName})`);
    setTimeout(() => checkAndTrigger(0, 5), 1000);
  }, []); // 依赖数组留空，因为使用 ref 访问值
  
  // 重置进度指示器状态的函数
  // 注意：依赖数组留空，避免在 setChatStatus 声明之前触发 TDZ 错误
  const resetProgressIndicator = useCallback(() => {
    progressResetTrigger.current += 1;
    setGenerationPhase("idle");
    setIsSubmitting(false);
    // 这里使用 typeof 安全访问，避免在特殊情况下未初始化时报错
    if (typeof setChatStatus === "function") {
      setChatStatus("ready");
    }
  }, []);
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
      // 模型配置弹窗已移除，不再自动打开
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
    // SVG模式下，value.xml 是 Draw.io XML 格式（通过 buildSvgRootXml 转换）
    // 使用 handleDiagramXml 加载到画布
    if (value.xml) {
      handleDiagramXml(value.xml, {
        origin: "display",
        modelRuntime: value.runtime
      }).catch((error) => {
        console.error("恢复 SVG 结果到画布失败:", error);
      });
      updateActiveBranchDiagram(value.xml);
    }
    lastLoadedSvgResultIdRef.current = resultId;
  }, [diagramResultVersion, handleDiagramXml, updateActiveBranchDiagram]);
  const {
    messages,
    sendMessage,
    addToolResult,
    status,
    setStatus: setChatStatus,
    error,
    setMessages,
    stop
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat"
    }),
    // 注意：maxSteps 参数在后端 streamText 中设置，前端不需要设置
    // 后端已配置 maxSteps: 5，支持多轮工具调用（如：搜索模板 -> 生成图表 -> 编辑图表）
    // 但是，当 finishReason 是 'stop' 时，AI SDK 可能不会自动继续
    // 我们需要确保 addToolResult 后能触发下一轮响应
    maxSteps: 10, // 设置前端的 maxSteps，确保支持多轮工具调用
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === "display_diagram") {
        console.log("[display_diagram] 工具调用开始", { 
          toolCallId: toolCall.toolCallId, 
          inputKeys: Object.keys(toolCall.input || {}),
          inputPreview: JSON.stringify(toolCall.input).substring(0, 500)
        });
        const { xml } = toolCall.input || {};
        console.log("[display_diagram] 提取 XML", { 
          xmlLength: xml?.length, 
          xmlType: typeof xml, 
          xmlPreview: xml?.substring(0, 200),
          hasInput: !!toolCall.input,
          inputType: typeof toolCall.input,
          fullInput: toolCall.input
        });
        try {
          if (!xml || typeof xml !== "string" || !xml.trim()) {
            console.error("[display_diagram] XML 为空或无效 - 详细调试信息", { 
              xml, 
              xmlType: typeof xml,
              toolCallInput: toolCall.input,
              toolCallKeys: toolCall.input ? Object.keys(toolCall.input) : [],
              toolCallId: toolCall.toolCallId
            });
            
            // 提供更友好的错误提示和可能的解决方案
            const errorMessage = xml === undefined 
              ? "AI 模型调用了图表工具但未提供 XML 参数。可能的原因：模型配置问题或工具调用格式不正确。"
              : xml === ""
              ? "AI 模型提供了空的 XML 内容。请尝试重新生成或使用更明确的提示词。"
              : `AI 模型提供的 XML 格式无效（类型：${typeof xml}）。请重试生成。`;
            
            addToolResult({
              tool: "display_diagram",
              toolCallId: toolCall.toolCallId,
              output: `${errorMessage}\n\n💡 提示：如果 AI 在文本中输出了 XML 代码，系统会自动检测并应用到画布。`
            });
            // 手动触发下一轮响应（如果需要）
            triggerManualResponse(toolCall.toolCallId, "display_diagram");
            return; // 不抛出异常，而是返回错误信息
          }
          if (isSvgMode) {
            addToolResult({
              tool: "display_diagram",
              toolCallId: toolCall.toolCallId,
              output: "当前处于 SVG 模式，请使用 display_svg 工具返回 SVG。"
            });
            // 手动触发下一轮响应（如果需要）
            triggerManualResponse(toolCall.toolCallId, "display_diagram");
            return;
          }
          console.log("[display_diagram] 调用 handleCanvasUpdate", { xmlPreview: xml.substring(0, 200) });
          await handleCanvasUpdate(xml, {
            origin: "display",
            modelRuntime: selectedModel ?? void 0
          });
          console.log("[display_diagram] handleCanvasUpdate 完成");
          
          // 获取经过处理后的完整 XML（包含 mxfile 格式）
          const processedXml = getLatestDiagramXml();
          console.log("[display_diagram] 获取处理后的 XML", { processedXmlLength: processedXml?.length });
          
          diagramResultsRef.current.set(toolCall.toolCallId, {
            xml: processedXml, // 使用完整的 mxfile 格式 XML
            mode: "drawio",
            runtime: selectedModel ?? void 0
          });
          setDiagramResultVersion((prev) => prev + 1);
          
          // 不在AI生成后保存历史，因为历史应该在用户操作前保存
          // 这样可以避免重复保存和版本混乱
          
          // 注意：不要直接修改 toolCall.input，因为这会影响到后续的工具调用
          // 如果需要清理内存，应该创建一个新的对象而不是修改原始对象
          // 暂时移除这个内存优化逻辑，因为它会导致后续工具调用时 XML 丢失
          // if (toolCall.input && typeof toolCall.input === "object") {
          //   toolCall.input.xmlRef = toolCall.toolCallId;
          //   toolCall.input.xmlLength = xml.length;
          //   toolCall.input.xml = void 0;
          // }
          addToolResult({
            tool: "display_diagram",
            toolCallId: toolCall.toolCallId,
            output: "Diagram rendered to canvas successfully."
          });
          // 手动触发下一轮响应（如果需要）
          triggerManualResponse(toolCall.toolCallId, "display_diagram");
        } catch (error2) {
          console.error("[display_diagram] 错误:", error2);
          const message = error2 instanceof Error ? error2.message : "图表渲染失败";
          addToolResult({
            tool: "display_diagram",
            toolCallId: toolCall.toolCallId,
            output: `图表渲染失败: ${message}`
          });
          // 手动触发下一轮响应（如果需要）
          triggerManualResponse(toolCall.toolCallId, "display_diagram");
        }
      } else if (toolCall.toolName === "display_svg") {
        const { svg } = toolCall.input;
        try {
          if (!svg || typeof svg !== "string" || !svg.trim()) {
            throw new Error("大模型返回的 SVG 为空，无法渲染。");
          }
          // SVG 模式下，统一使用 buildSvgRootXml 转换为 Draw.io XML
          const { rootXml, dataUrl } = buildSvgRootXml(svg);
          console.log("[display_svg] 转换 SVG 为 Draw.io XML", { 
            rootXmlLength: rootXml?.length, 
            rootXmlPreview: rootXml?.substring(0, 200),
            dataUrlPreview: dataUrl?.substring(0, 100)
          });
          await handleCanvasUpdate(rootXml, {
            origin: "display",
            modelRuntime: selectedModel ?? void 0,
            toolCallId: toolCall.toolCallId
          });
          // 等待画布更新完成后再获取最新的 XML
          await new Promise((resolve) => setTimeout(resolve, 100));
          const mergedXml = getLatestDiagramXml();
          console.log("[display_svg] 存储合并后的 XML", { 
            mergedXmlLength: mergedXml?.length,
            mergedXmlPreview: mergedXml?.substring(0, 200)
          });
          // 保存原始 SVG 和转换后的 Draw.io XML，用于预览和历史记录
          diagramResultsRef.current.set(toolCall.toolCallId, {
            xml: mergedXml, // Draw.io XML 格式（用于恢复画布）
            svg, // 原始 SVG（用于预览）
            svgDataUrl: dataUrl, // SVG data URL（用于缩略图显示）
            mode: "svg",
            runtime: selectedModel ?? void 0
          });
          updateActiveBranchDiagram(mergedXml);
          setDiagramResultVersion((prev) => prev + 1);
          
          addToolResult({
            tool: "display_svg",
            toolCallId: toolCall.toolCallId,
            output: "SVG 已转换并渲染到画布。"
          });
          // 手动触发下一轮响应（如果需要）
          triggerManualResponse(toolCall.toolCallId, "display_svg");
        } catch (error2) {
          const message = error2 instanceof Error ? error2.message : "Failed to display SVG.";
          addToolResult({
            tool: "display_svg",
            toolCallId: toolCall.toolCallId,
            output: `Failed to display SVG: ${message}`
          });
          // 手动触发下一轮响应（如果需要）
          triggerManualResponse(toolCall.toolCallId, "display_svg");
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
          // 手动触发下一轮响应（如果需要）
          triggerManualResponse(toolCall.toolCallId, "edit_diagram");
        } catch (error2) {
          console.error("Edit diagram failed:", error2);
          const errorMessage = error2 instanceof Error ? error2.message : String(error2);
          addToolResult({
            tool: "edit_diagram",
            toolCallId: toolCall.toolCallId,
            output: `Failed to edit diagram: ${errorMessage}`
          });
          // 手动触发下一轮响应（如果需要）
          triggerManualResponse(toolCall.toolCallId, "edit_diagram");
        }
      } else if (toolCall.toolName === "run_python_code") {
        const { code } = toolCall.input || {};
        console.log("[run_python_code] 工具调用开始", { 
          toolCallId: toolCall.toolCallId, 
          codeLength: code?.length,
          codePreview: code?.substring(0, 200)
        });
        
        try {
          if (!code || typeof code !== "string" || !code.trim()) {
            addToolResult({
              tool: "run_python_code",
              toolCallId: toolCall.toolCallId,
              output: "错误：未提供 Python 代码。请确保代码参数不为空。"
            });
            return;
          }
          
          // 调用 Python 执行 API
          const response = await fetch("/api/execute-python", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ code })
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            // 构建包含详细错误信息的错误对象
            const error = new Error(result.error || result.message || "Python 代码执行失败");
            // 将响应结果直接附加到错误对象上，避免异步解析
            error.result = result;
            throw error;
          }
          
          if (result.success && result.svg) {
            // Python 执行成功，生成了 SVG
            console.log("[run_python_code] Python 执行成功，生成 SVG", {
              svgLength: result.svg.length,
              duration: result.duration
            });
            
            // 将 SVG 转换为 draw.io XML 或直接显示 SVG（根据渲染模式）
            if (isSvgMode) {
              // SVG 模式：使用 buildSvgRootXml 转换为 Draw.io XML（与 display_svg 工具保持一致）
              console.log("[run_python_code] SVG 模式：转换 SVG 为 Draw.io XML", {
                svgLength: result.svg.length,
                svgPreview: result.svg.substring(0, 200)
              });
              
              const { rootXml, dataUrl } = buildSvgRootXml(result.svg);
              console.log("[run_python_code] SVG 转换完成", {
                rootXmlLength: rootXml?.length,
                rootXmlPreview: rootXml?.substring(0, 200),
                dataUrlPreview: dataUrl?.substring(0, 100)
              });
              
              await handleCanvasUpdate(rootXml, {
                origin: "python_svg",
                modelRuntime: selectedModel ?? void 0,
                toolCallId: toolCall.toolCallId
              });
              
              // 等待画布更新完成后再获取最新的 XML
              await new Promise((resolve) => setTimeout(resolve, 100));
              const mergedXml = getLatestDiagramXml();
              
              // 保存原始 SVG 和转换后的 Draw.io XML，用于预览和历史记录
              diagramResultsRef.current.set(toolCall.toolCallId, {
                xml: mergedXml, // Draw.io XML 格式（用于恢复画布）
                svg: result.svg, // 原始 SVG（用于预览）
                svgDataUrl: dataUrl, // SVG data URL（用于缩略图显示）
                mode: "svg",
                runtime: selectedModel ?? void 0
              });
              updateActiveBranchDiagram(mergedXml);
              setDiagramResultVersion((prev) => prev + 1);
              
              // 保存到历史记录（Python 生图成功后）
              try {
                await fetchAndFormatDiagram({ saveHistory: true });
                console.log("[run_python_code] 已保存图表到历史记录（SVG 模式）");
              } catch (historyError) {
                console.warn("[run_python_code] 保存历史记录失败:", historyError);
                // 历史记录保存失败不影响主流程，只记录警告
              }
              
              // 使用统一的工具结果添加函数，确保在正确的状态下添加和触发
              const successOutput = `Python 代码执行成功，已生成 SVG 图表。\n执行时间: ${result.duration}ms\n\n标准输出:\n${result.stdout || '(无)'}\n\n标准错误:\n${result.stderr || '(无)'}`;
              
              const addToolResultSafely = () => {
                const currentStatus = statusRef.current;
                if (currentStatus === "streaming" || currentStatus === "submitted") {
                  console.log(`[run_python_code] 状态为 ${currentStatus}，等待状态变为 ready 后再添加工具结果`);
                  setTimeout(addToolResultSafely, 200);
                  return;
                }
                
                console.log(`[run_python_code] 当前状态: ${currentStatus}，添加工具结果（成功路径）`);
                addToolResult({
                  tool: "run_python_code",
                  toolCallId: toolCall.toolCallId,
                  output: successOutput
                });
                
                console.log("[run_python_code] 工具结果已添加，等待 LLM 响应", {
                  toolCallId: toolCall.toolCallId,
                  status: currentStatus,
                  messagesCount: messagesRef.current?.length
                });
                
                // 手动触发下一轮响应（如果需要）
                // 当 finishReason 是 'stop' 且任务未完成时，addToolResult 不会自动触发下一轮响应
                // 延迟一小段时间确保 addToolResult 已完成
                setTimeout(() => {
                  console.log("[run_python_code] 准备触发手动响应（成功路径）", {
                    toolCallId: toolCall.toolCallId,
                    status: statusRef.current
                  });
                  triggerManualResponse(toolCall.toolCallId, "run_python_code");
                }, 100);
              };
              
              // 立即尝试添加工具结果
              addToolResultSafely();
            } else {
              // Draw.io 模式：使用 buildSvgRootXml 转换为 Draw.io XML（与 SVG 模式保持一致）
              console.log("[run_python_code] Draw.io 模式：转换 SVG 为 Draw.io XML", {
                svgLength: result.svg.length,
                svgPreview: result.svg.substring(0, 200)
              });
              
              const { rootXml, dataUrl } = buildSvgRootXml(result.svg);
              console.log("[run_python_code] SVG 转换完成", {
                rootXmlLength: rootXml?.length,
                rootXmlPreview: rootXml?.substring(0, 200),
                dataUrlPreview: dataUrl?.substring(0, 100)
              });
              
              await handleCanvasUpdate(rootXml, {
                origin: "python_diagram",
                modelRuntime: selectedModel ?? void 0,
                toolCallId: toolCall.toolCallId
              });
              
              // 等待画布更新完成后再获取最新的 XML
              await new Promise((resolve) => setTimeout(resolve, 100));
              const mergedXml = getLatestDiagramXml();
              
              // 保存原始 SVG 和转换后的 Draw.io XML，用于预览和历史记录
              diagramResultsRef.current.set(toolCall.toolCallId, {
                xml: mergedXml, // Draw.io XML 格式（用于恢复画布）
                svg: result.svg, // 原始 SVG（用于预览）
                svgDataUrl: dataUrl, // SVG data URL（用于缩略图显示）
                mode: "drawio",
                runtime: selectedModel ?? void 0
              });
              updateActiveBranchDiagram(mergedXml);
              setDiagramResultVersion((prev) => prev + 1);
              
              // 保存到历史记录（Python 生图成功后）
              try {
                await fetchAndFormatDiagram({ saveHistory: true });
                console.log("[run_python_code] 已保存图表到历史记录（Draw.io 模式）");
              } catch (historyError) {
                console.warn("[run_python_code] 保存历史记录失败:", historyError);
                // 历史记录保存失败不影响主流程，只记录警告
              }
              
              // 使用统一的工具结果添加函数，确保在正确的状态下添加和触发
              const successOutput = `Python 代码执行成功，已生成图表。\n执行时间: ${result.duration}ms\n\n标准输出:\n${result.stdout || '(无)'}\n\n标准错误:\n${result.stderr || '(无)'}`;
              
              const addToolResultSafely = () => {
                const currentStatus = statusRef.current;
                if (currentStatus === "streaming" || currentStatus === "submitted") {
                  console.log(`[run_python_code] 状态为 ${currentStatus}，等待状态变为 ready 后再添加工具结果`);
                  setTimeout(addToolResultSafely, 200);
                  return;
                }
                
                console.log(`[run_python_code] 当前状态: ${currentStatus}，添加工具结果（成功路径）`);
                addToolResult({
                  tool: "run_python_code",
                  toolCallId: toolCall.toolCallId,
                  output: successOutput
                });
                
                console.log("[run_python_code] 工具结果已添加，等待 LLM 响应", {
                  toolCallId: toolCall.toolCallId,
                  status: currentStatus,
                  messagesCount: messagesRef.current?.length
                });
                
                // 手动触发下一轮响应（如果需要）
                // 当 finishReason 是 'stop' 且任务未完成时，addToolResult 不会自动触发下一轮响应
                // 延迟一小段时间确保 addToolResult 已完成
                setTimeout(() => {
                  console.log("[run_python_code] 准备触发手动响应（成功路径）", {
                    toolCallId: toolCall.toolCallId,
                    status: statusRef.current
                  });
                  triggerManualResponse(toolCall.toolCallId, "run_python_code");
                }, 100);
              };
              
              // 立即尝试添加工具结果
              addToolResultSafely();
              
              // 记录工具调用时的消息数量，用于检测是否有新的 assistant 消息
              const messagesCountAtToolResult = messages?.length || 0;
              const lastAssistantMessageId = messages?.filter(m => m.role === 'assistant').pop()?.id;
              
              // 清除之前的超时定时器（如果存在）
              if (toolResultTimeoutRefs.current.has(toolCall.toolCallId)) {
                clearTimeout(toolResultTimeoutRefs.current.get(toolCall.toolCallId));
                toolResultTimeoutRefs.current.delete(toolCall.toolCallId);
              }
              
              // 设置超时检测：如果 addToolResult 后 5 秒内没有新的 assistant 消息，记录警告
              const timeoutId = setTimeout(() => {
                const currentMessagesCount = messagesRef.current?.length || 0;
                const currentLastAssistant = messagesRef.current?.filter(m => m.role === 'assistant').pop();
                const hasNewAssistantMessage = currentLastAssistant?.id !== lastAssistantMessageId;
                const currentStatus = statusRef.current;
                
                console.log("[run_python_code] 超时检测：检查 LLM 是否继续响应（成功路径）", {
                  toolCallId: toolCall.toolCallId,
                  currentStatus,
                  messagesCountAtToolResult,
                  currentMessagesCount,
                  hasNewAssistantMessage,
                  lastAssistantMessageId,
                  currentLastAssistantId: currentLastAssistant?.id
                });
                
                // 如果状态仍然是 ready 且没有新的 assistant 消息，说明 LLM 没有继续响应
                if (currentStatus === 'ready' && !hasNewAssistantMessage) {
                  console.warn("[run_python_code] ⚠️ 工具结果已添加 5 秒后，LLM 仍然没有继续响应（成功路径）。可能需要检查 AI SDK 配置或手动触发下一轮响应。");
                }
                
                // 清理超时定时器引用
                toolResultTimeoutRefs.current.delete(toolCall.toolCallId);
              }, 5000); // 5 秒超时
              
              // 保存超时定时器引用
              toolResultTimeoutRefs.current.set(toolCall.toolCallId, timeoutId);
            }
          } else if (result.success && result.message) {
            // 执行成功但没有生成图形
            // 使用统一的工具结果添加函数，确保在正确的状态下添加和触发
            const successOutput = `Python 代码执行成功，但未生成图形。\n${result.message}\n\n标准输出:\n${result.stdout || '(无)'}\n\n标准错误:\n${result.stderr || '(无)'}`;
            
            const addToolResultSafely = () => {
              const currentStatus = statusRef.current;
              if (currentStatus === "streaming" || currentStatus === "submitted") {
                console.log(`[run_python_code] 状态为 ${currentStatus}，等待状态变为 ready 后再添加工具结果`);
                setTimeout(addToolResultSafely, 200);
                return;
              }
              
              console.log(`[run_python_code] 当前状态: ${currentStatus}，添加工具结果（成功但无图形路径）`);
              addToolResult({
                tool: "run_python_code",
                toolCallId: toolCall.toolCallId,
                output: successOutput
              });
              
              console.log("[run_python_code] 工具结果已添加，等待 LLM 响应", {
                toolCallId: toolCall.toolCallId,
                status: currentStatus,
                messagesCount: messagesRef.current?.length
              });
              
              // 手动触发下一轮响应（如果需要）
              // 当 finishReason 是 'stop' 且任务未完成时，addToolResult 不会自动触发下一轮响应
              // 延迟一小段时间确保 addToolResult 已完成
              setTimeout(() => {
                console.log("[run_python_code] 准备触发手动响应（成功但无图形路径）", {
                  toolCallId: toolCall.toolCallId,
                  status: statusRef.current
                });
                triggerManualResponse(toolCall.toolCallId, "run_python_code");
              }, 100);
            };
            
            // 立即尝试添加工具结果
            addToolResultSafely();
            
            // 记录工具调用时的消息数量，用于检测是否有新的 assistant 消息
            const messagesCountAtToolResult = messages?.length || 0;
            const lastAssistantMessageId = messages?.filter(m => m.role === 'assistant').pop()?.id;
            
            // 清除之前的超时定时器（如果存在）
            if (toolResultTimeoutRefs.current.has(toolCall.toolCallId)) {
              clearTimeout(toolResultTimeoutRefs.current.get(toolCall.toolCallId));
              toolResultTimeoutRefs.current.delete(toolCall.toolCallId);
            }
            
            // 设置超时检测：如果 addToolResult 后 5 秒内没有新的 assistant 消息，记录警告
            const timeoutId = setTimeout(() => {
              const currentMessagesCount = messagesRef.current?.length || 0;
              const currentLastAssistant = messagesRef.current?.filter(m => m.role === 'assistant').pop();
              const hasNewAssistantMessage = currentLastAssistant?.id !== lastAssistantMessageId;
              const currentStatus = statusRef.current;
              
              console.log("[run_python_code] 超时检测：检查 LLM 是否继续响应（成功但无图形路径）", {
                toolCallId: toolCall.toolCallId,
                currentStatus,
                messagesCountAtToolResult,
                currentMessagesCount,
                hasNewAssistantMessage,
                lastAssistantMessageId,
                currentLastAssistantId: currentLastAssistant?.id
              });
              
              // 如果状态仍然是 ready 且没有新的 assistant 消息，说明 LLM 没有继续响应
              if (currentStatus === 'ready' && !hasNewAssistantMessage) {
                console.warn("[run_python_code] ⚠️ 工具结果已添加 5 秒后，LLM 仍然没有继续响应（成功但无图形路径）。可能需要检查 AI SDK 配置或手动触发下一轮响应。");
              }
              
              // 清理超时定时器引用
              toolResultTimeoutRefs.current.delete(toolCall.toolCallId);
            }, 5000); // 5 秒超时
            
            // 保存超时定时器引用
            toolResultTimeoutRefs.current.set(toolCall.toolCallId, timeoutId);
          } else {
            // 执行失败
            throw new Error(result.error || "Python 代码执行失败");
          }
        } catch (error) {
          console.error("[run_python_code] 执行失败:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // 构建详细的错误信息，帮助 LLM 理解错误并决定下一步行动
          let detailedError = `❌ Python 代码执行失败\n\n📋 错误信息:\n${errorMessage}`;
          
          // 从错误对象中获取详细错误信息
          // 优先从 error.result 获取（已解析的响应），否则尝试从 error.response 解析
          const errorResult = error.result || (error.response ? await error.response.json().catch(() => null) : null);
          
          if (errorResult) {
            // 提取 stderr（Python 标准错误输出，包含详细的错误信息）
            if (errorResult.stderr) {
              detailedError += `\n\n🐛 Python 标准错误输出:\n\`\`\`\n${errorResult.stderr}\n\`\`\``;
            }
            // 提取 stdout（Python 标准输出）
            if (errorResult.stdout) {
              detailedError += `\n\n📤 Python 标准输出:\n\`\`\`\n${errorResult.stdout}\n\`\`\``;
            }
            // 提取 message（额外的错误消息）
            if (errorResult.message && errorResult.message !== errorMessage) {
              detailedError += `\n\n📝 详细信息:\n${errorResult.message}`;
            }
            // 提取 details（开发环境的堆栈信息）
            if (errorResult.details && process.env.NODE_ENV === 'development') {
              detailedError += `\n\n🔍 调试信息:\n\`\`\`\n${errorResult.details}\n\`\`\``;
            }
          }
          
          // 提供明确的下一步行动指导
          detailedError += `\n\n💡 下一步行动建议:\n`;
          detailedError += `1. **分析错误**：仔细阅读上述错误信息，确定问题所在\n`;
          detailedError += `2. **修复代码**：如果错误可以修复（如语法错误、编码问题、缺少库等），请修改 Python 代码后**再次调用 run_python_code 工具**\n`;
          detailedError += `3. **结束任务**：如果错误无法修复、已达到最大行动次数，或任务无法继续，请调用 **end_task 工具**结束任务\n`;
          detailedError += `\n⚠️ 重要：你必须选择一个行动 - 要么修复代码后重新调用 run_python_code，要么调用 end_task 结束任务。不能只思考不行动！`;
          
          console.log("[run_python_code] 准备添加工具结果，触发 LLM 下一步响应", {
            toolCallId: toolCall.toolCallId,
            errorLength: detailedError.length,
            hasStderr: !!errorResult?.stderr,
            hasStdout: !!errorResult?.stdout,
            currentStatus: status
          });
          
          // 确保在正确的状态下添加工具结果
          // 如果状态不是 ready，等待状态变为 ready
          const addToolResultSafely = () => {
            const currentStatus = statusRef.current;
            if (currentStatus === "streaming" || currentStatus === "submitted") {
              console.log(`[run_python_code] 状态为 ${currentStatus}，等待状态变为 ready 后再添加工具结果`);
              setTimeout(addToolResultSafely, 200);
              return;
            }
            
            console.log(`[run_python_code] 当前状态: ${currentStatus}，添加工具结果`);
            addToolResult({
              tool: "run_python_code",
              toolCallId: toolCall.toolCallId,
              output: detailedError
            });
            
            console.log("[run_python_code] 工具结果已添加，等待 LLM 响应", {
              toolCallId: toolCall.toolCallId,
              status: currentStatus,
              messagesCount: messagesRef.current?.length
            });
            
            // 手动触发下一轮响应（如果需要）
            // 当 finishReason 是 'stop' 且任务未完成时，addToolResult 不会自动触发下一轮响应
            // 延迟一小段时间确保 addToolResult 已完成
            setTimeout(() => {
              console.log("[run_python_code] 准备触发手动响应", {
                toolCallId: toolCall.toolCallId,
                status: statusRef.current
              });
              triggerManualResponse(toolCall.toolCallId, "run_python_code");
            }, 100);
          };
          
          // 立即尝试添加工具结果
          addToolResultSafely();
          
          // 记录工具调用时的消息数量，用于检测是否有新的 assistant 消息
          const messagesCountAtToolResult = messages?.length || 0;
          const lastAssistantMessageId = messages?.filter(m => m.role === 'assistant').pop()?.id;
          
          // 清除之前的超时定时器（如果存在）
          if (toolResultTimeoutRefs.current.has(toolCall.toolCallId)) {
            clearTimeout(toolResultTimeoutRefs.current.get(toolCall.toolCallId));
            toolResultTimeoutRefs.current.delete(toolCall.toolCallId);
          }
          
          // 设置超时检测：如果 addToolResult 后 5 秒内没有新的 assistant 消息，记录警告
          const timeoutId = setTimeout(() => {
            const currentMessagesCount = messages?.length || 0;
            const currentLastAssistant = messages?.filter(m => m.role === 'assistant').pop();
            const hasNewAssistantMessage = currentLastAssistant?.id !== lastAssistantMessageId;
            const currentStatus = status;
            
            console.log("[run_python_code] 超时检测：检查 LLM 是否继续响应", {
              toolCallId: toolCall.toolCallId,
              currentStatus,
              messagesCountAtToolResult,
              currentMessagesCount,
              hasNewAssistantMessage,
              lastAssistantMessageId,
              currentLastAssistantId: currentLastAssistant?.id
            });
            
            // 如果状态仍然是 ready 且没有新的 assistant 消息，说明 LLM 没有继续响应
            // 这可能是因为 finishReason 是 'stop' 时，AI SDK 认为不需要继续
            // 但是，根据 AI SDK 的设计，addToolResult 应该会自动触发下一轮响应
            if (currentStatus === 'ready' && !hasNewAssistantMessage) {
              console.warn("[run_python_code] ⚠️ 工具结果已添加 5 秒后，LLM 仍然没有继续响应。可能需要检查 AI SDK 配置或手动触发下一轮响应。");
            }
            
            // 清理超时定时器引用
            toolResultTimeoutRefs.current.delete(toolCall.toolCallId);
          }, 5000); // 5 秒超时
          
          // 保存超时定时器引用
          toolResultTimeoutRefs.current.set(toolCall.toolCallId, timeoutId);
        }
      } else if (toolCall.toolName === "end_task") {
        const { reason, summary } = toolCall.input || {};
        console.log("[end_task] 任务结束", { 
          toolCallId: toolCall.toolCallId, 
          reason,
          summary
        });
        
        addToolResult({
          tool: "end_task",
          toolCallId: toolCall.toolCallId,
          output: `任务已结束。${reason ? `\n原因: ${reason}` : ''}${summary ? `\n总结: ${summary}` : ''}`
        });
        
        // end_task 调用后，停止后续工具调用
        // 注意：AI SDK 会自动处理，这里只是记录日志
      }
    },
    onError: (error2) => {
      console.error("Chat error:", error2);
      // 注意：mixed 模式的回滚处理在下方的 effect 中进行
      // 因为 rollbackToSnapshot 在 useChat 之后定义
    }
  });
  
  // 更新 ref，使 triggerManualResponse 可以访问最新的值
  useEffect(() => {
    statusRef.current = status;
    messagesRef.current = messages;
    sendMessageRef.current = sendMessage;
    selectedModelRef.current = selectedModel;
    renderModeRef.current = renderMode;
    fetchAndFormatDiagramRef.current = fetchAndFormatDiagram;
    buildModelRequestBodyRef.current = buildModelRequestBody;
  }, [status, messages, sendMessage, selectedModel, renderMode, fetchAndFormatDiagram, buildModelRequestBody]);
  
  // ========== Mixed 模式：保存状态快照 ==========
  // 在发送消息前调用，用于预扣费后任务失败时回滚
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
  
  /**
   * 归一化回滚使用的画布 XML，避免损坏的 XML 触发解析报错
   * - SVG 模式：若为空则返回 null，交由上层清空画布
   * - Drawio 模式：若无效则回退到空画布模板
   */
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

  // 辅助函数：用于通知用户
  const notifyUser = useCallback((type, message) => {
    // 简单的通知实现，可以后续扩展
    console.log(`[${type}] ${message}`);
  }, []);

  // ========== Mixed 模式：回滚到快照状态 ==========
  // 当任务失败或 token 扣费失败时调用
  // 参考编辑历史对话的回滚机制，创建新分支保存回滚状态
  const rollbackToSnapshot = useCallback(() => {
    const snapshot = stateSnapshotRef.current;
    if (!snapshot) {
      console.warn("❌ 回滚失败：无状态快照可回滚");
      console.log("回滚失败详情：", {
        hasSnapshot: false,
        currentBranchId: activeBranchId,
        renderMode: isSvgMode ? 'svg' : 'drawio'
      });
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

      console.log("📝 回滚消息状态", {
        totalMessages: truncatedMessages.length,
        userMessages: userMessageCount,
        assistantMessages: truncatedMessages.filter(msg => msg.role === "assistant").length
      });

      // 计算画布历史索引（找到发送前的用户消息数量）
      let diagramXmlToRestore = snapshot.diagramXml || snapshot.chartXML || null;

      // 如果有画布历史记录，尝试回溯到对应的历史版本
      if (historyItems && historyItems.length > 0) {
        console.log("🎨 尝试回溯画布历史", {
          availableHistoryCount: historyItems.length,
          targetUserMessageIndex: userMessageCount
        });

        // 如果有足够的历史版本，回溯到对应位置
        if (userMessageCount > 0 && historyItems.length >= userMessageCount) {
          const historyIndex = Math.min(userMessageCount - 1, historyItems.length - 1);
          const targetHistory = historyItems[historyIndex];

          if (targetHistory) {
            // 对于 drawio 模式，使用 xml 字段；对于 svg 模式，使用 svg 字段
            const originalXml = diagramXmlToRestore;
            diagramXmlToRestore = targetHistory.xml || targetHistory.svg || diagramXmlToRestore;

            console.log("✅ 找到历史画布版本", {
              historyIndex,
              hasXmlInHistory: !!(targetHistory.xml || targetHistory.svg),
              xmlChanged: originalXml !== diagramXmlToRestore
            });

            // 同时回溯画布显示
            try {
              handleRestoreHistory(historyIndex);
              console.log("✅ 画布历史回溯成功");
            } catch (historyError) {
              console.warn("⚠️ 画布历史回溯失败，使用快照数据", historyError);
            }
          } else {
            console.warn("⚠️ 未找到对应的历史版本");
          }
        } else if (userMessageCount === 0) {
          // 如果目标位置之前没有用户消息，说明是回到最初状态
          console.log("🏠 回到初始状态，清空画布");
          diagramXmlToRestore = isSvgMode ? null : EMPTY_MXFILE;

          try {
            // 统一使用 clearDiagram，因为两种模式都使用 Draw.io 画布
            clearDiagram();
            console.log("✅ 画布清空成功");
          } catch (clearError) {
            console.warn("⚠️ 画布清空失败", clearError);
          }
        } else {
          console.log("⚠️ 历史记录不足，无法精确回溯", {
            neededHistoryCount: userMessageCount,
            availableHistoryCount: historyItems.length
          });
        }
      } else {
        console.log("ℹ️ 无画布历史记录，使用快照中的画布数据");
      }

      // 创建新分支保存回滚状态
      console.log("🌿 创建回滚分支");
      const safeDiagramXml = normalizeDiagramXml(diagramXmlToRestore);

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

      if (rollbackBranch) {
        console.log("✅ 回滚分支创建成功", {
          branchId: rollbackBranch.id,
          label: rollbackBranch.label
        });
      } else {
        console.warn("⚠️ 分支创建失败，将直接更新当前分支");
      }

      // 更新UI状态
      console.log("🔄 更新UI状态");
      setMessages(truncatedMessages);
      setInput(""); // 清空输入框，因为这是错误状态
      // 重置进度指示器状态（修复进度指示器回滚问题）
      resetProgressIndicator();

      if (!rollbackBranch) {
        // 如果分支创建失败，回退到直接更新当前分支
        console.log("🔄 直接更新当前分支");
        updateActiveBranchMessages(truncatedMessages);
        updateActiveBranchDiagram(safeDiagramXml);

        // 同步画布展示，防止损坏的 XML 弹窗
        // 统一使用 onDisplayChart，因为 SVG 模式下 diagramXml 存储的是 Draw.io XML
        try {
          onDisplayChart(safeDiagramXml || EMPTY_MXFILE);
        } catch (displayError) {
          console.warn("回滚画布加载失败，使用空画布兜底", displayError);
          onDisplayChart(EMPTY_MXFILE);
          updateActiveBranchDiagram(EMPTY_MXFILE);
        }
      }

      // 清理历史记录（移除失败的对话）
      console.log("🧹 清理历史记录");

      // 清空快照
      stateSnapshotRef.current = null;

      console.log("✅ 状态回滚完成", {
        finalMessageCount: truncatedMessages.length,
        hasDiagramXml: !!diagramXmlToRestore,
        branchCreated: !!rollbackBranch
      });

      return true;
    } catch (error) {
      console.error("❌ 状态回滚失败：", error);
      console.error("回滚失败详情：", {
        error: error.message,
        stack: error.stack,
        snapshot: {
          hasSnapshot: !!snapshot,
          messageCount: snapshot?.messages?.length,
          timestamp: snapshot?.timestamp
        }
      });

      // 提示用户回滚失败，避免静默错误
      notifyUser("error", "回滚失败，页面状态可能不一致，请刷新重试。");
      setGenerationPhase("idle");
      setIsSubmitting(false);
      if (typeof setChatStatus === "function") {
        setChatStatus("ready");
      }

      // 清理快照，避免下次回滚时使用损坏的快照
      stateSnapshotRef.current = null;

      return false;
    }
  }, [
    setMessages,
    setInput,
    updateActiveBranchMessages,
    updateActiveBranchDiagram,
    isSvgMode,
    onDisplayChart,
    historyItems,
    handleRestoreHistory,
    clearDiagram,
    createBranch,
    activeBranchId,
    normalizeDiagramXml,
    setGenerationPhase,
    setIsSubmitting,
    setChatStatus,
    notifyUser
  ]);
  
  // ========== Mixed 模式：清空快照 ==========
  // 任务成功完成且扣费成功时调用
  const clearStateSnapshot = useCallback(() => {
    if (stateSnapshotRef.current) {
      console.log("清空状态快照（任务成功完成）");
      stateSnapshotRef.current = null;
    }
  }, []);

  // ========== Mixed 模式：错误回滚 Effect ==========
  // 监听 useChat 的 error 状态，发生错误时执行回滚
  useEffect(() => {
    if (error && isPhotonChargeEnabled() && getChargeMode() === 'mixed' && stateSnapshotRef.current) {
      console.log("检测到任务错误，执行状态回滚", { error });
      const rolled = rollbackToSnapshot();
      if (rolled) {
        notifyUser("error", "任务失败，已恢复到发送前的状态：" + (error.message || String(error)));
      }
    }
  }, [error, rollbackToSnapshot]);
  
  // ========== Mixed 模式：任务完成状态处理 Effect ==========
  // 监听 status 变化，任务成功完成时清空快照
  // 检查消息的 metadata 中是否有扣费失败的情况
  useEffect(() => {
    // 只在 ready 状态（任务完成）时检查
    if (status !== "ready") {
      return;
    }
    
    // 检查是否是 mixed 模式且有快照
    if (!isPhotonChargeEnabled() || getChargeMode() !== 'mixed' || !stateSnapshotRef.current) {
      return;
    }
    
    // 检查最新的 assistant 消息的 metadata
    const lastAssistant = messages?.filter(m => m.role === 'assistant').pop();
    const metadata = lastAssistant?.metadata;

    // 检查是否有扣费结果（流式响应可能需要延迟检查）
    const checkChargeResult = (chargeResult) => {
      if (!chargeResult) return false;

      console.log("💰 检查扣费结果", {
        success: chargeResult.success,
        needsRollback: chargeResult.needsRollback,
        chargeMode: chargeResult.chargeMode,
        eventValue: chargeResult.eventValue,
        message: chargeResult.message
      });

      if (chargeResult.needsRollback || !chargeResult.success) {
        // 扣费失败或需要回滚
        console.log("❌ 检测到扣费失败或需要回滚，开始执行回滚操作");
        const rolled = rollbackToSnapshot();
        if (rolled) {
          console.log("✅ 回滚操作成功完成");
          notifyUser("error", "Token 扣费失败，已恢复到发送前的状态：" + (chargeResult.message || "余额不足"));
        } else {
          console.error("❌ 回滚操作失败");
          notifyUser("error", "Token 扣费失败，但回滚操作失败，请手动刷新页面：" + (chargeResult.message || "余额不足"));
        }
        return true;
      }

      console.log("✅ 扣费成功，无需回滚");
      return false;
    };

    // 首先检查任务是否失败（通过 metadata.taskFailed）
    // 这个检查应该优先于 chargeResult 检查，因为任务失败时必须回滚
    // 即使 chargeResult 是预估的且 needsRollback 为 false
    // 注意：后端已经区分了"任务未完成但可继续"和"任务失败且无法继续"
    // 只有当 taskFailed = true 时，才表示任务真正失败且无法继续
    if (metadata?.taskFailed) {
      // 额外检查：如果还有剩余行动次数，不应该回滚，应该等待AI继续响应
      const reactInfo = metadata?.reactInfo;
      const actionCount = reactInfo?.actionCount || 0;
      const maxActions = reactInfo?.maxActions || 3;
      const reachedMaxActions = reactInfo?.reachedMaxActions || false;
      
      // 如果还有剩余行动次数且未达到最大行动次数，不应该回滚
      // 这种情况应该等待AI继续响应（通过 triggerManualResponse 触发）
      if (!reachedMaxActions && actionCount < maxActions) {
        console.log("检测到任务失败标记，但还有剩余行动次数，不执行回滚，等待AI继续响应", {
          actionCount,
          maxActions,
          finishReason: metadata.finishReason,
          isTaskCompleted: metadata.isTaskCompleted
        });
        // 不执行回滚，让 triggerManualResponse 处理后续响应
        return;
      }
      
      console.log("检测到任务失败标记，执行回滚", {
        finishReason: metadata.finishReason,
        actionCount,
        maxActions,
        reachedMaxActions,
        hasChargeResult: !!metadata.chargeResult,
        chargeResultNeedsRollback: metadata.chargeResult?.needsRollback
      });
      
      // 如果 chargeResult 存在且需要回滚，使用 chargeResult 中的消息
      const rollbackMessage = metadata.chargeResult?.needsRollback 
        ? (metadata.chargeResult.message || "任务未完成，已恢复到发送前的状态")
        : "任务未完成，已恢复到发送前的状态";
      
      const rolled = rollbackToSnapshot();
      if (rolled) {
        notifyUser("error", rollbackMessage);
      }
      return;
    }

    // 然后检查 metadata 中是否已有 chargeResult
    if (metadata?.chargeResult && checkChargeResult(metadata.chargeResult)) {
      return;
    }

    // 对于流式响应，chargeResult 可能还未设置，延迟检查
    if (metadata && !metadata.chargeResult && (metadata.isTaskCompleted || metadata.taskFailed !== undefined)) {
      // 延迟 100ms 检查一次 chargeResult（给 onFinish 时间执行）
      setTimeout(() => {
        const updatedLastAssistant = messages?.filter(m => m.role === 'assistant').pop();
        const updatedMetadata = updatedLastAssistant?.metadata;

        if (updatedMetadata?.chargeResult && checkChargeResult(updatedMetadata.chargeResult)) {
          return;
        }

        // 如果仍然没有 chargeResult，且任务完成，则认为扣费成功
        if (metadata.isTaskCompleted && !metadata.taskFailed) {
          console.log("任务成功完成，清空状态快照");
          clearStateSnapshot();
        }
      }, 100);
    } else {
      // 任务成功完成，清空快照
      console.log("任务成功完成，清空状态快照");
      clearStateSnapshot();
    }
    
  }, [status, messages, rollbackToSnapshot, clearStateSnapshot, notifyUser]);
  
  const handleCopyXml = useCallback(
    async (xml) => {
      if (!xml || xml.trim().length === 0) {
        notifyUser("error", "当前结果缺少 XML 内容，无法复制。");
        return;
      }
      try {
        await navigator.clipboard.writeText(xml);
        notifyUser("success", "XML 已复制到剪贴板。");
      } catch (copyError) {
        console.error("Copy XML failed:", copyError);
        notifyUser("error", "复制 XML 失败，请检查浏览器权限。");
      }
    },
    [notifyUser]
  );
  const handleStopAll = useCallback(
    async (notice) => {
      // 取消提交过程中的异步请求（如模板匹配）
      if (isSubmitting && submitAbortControllerRef.current) {
        submitAbortControllerRef.current.abort();
        submitAbortControllerRef.current = null;
        setIsSubmitting(false);
      }
      // 重置进度状态
      setGenerationPhase("idle");
      try {
        if (status === "streaming" || status === "submitted") {
          await stop();
        }
      } catch (stopError) {
        console.error("停止生成失败：", stopError);
      }
      if (notice) {
        notifyUser(notice.type, notice.message);
      }
    },
    [isSubmitting, status, stop, notifyUser]
  );
  
  // 监听 renderMode 变化，自动切换到对应模式的根分支
  // 注意：必须在 useChat 和 handleStopAll 之后定义，因为依赖了 status 和 handleStopAll
  useEffect(() => {
    if (lastRenderModeRef.current !== renderMode) {
      console.log(`[ChatPanel] 渲染模式切换: ${lastRenderModeRef.current} -> ${renderMode}`);
      
      // 1. 停止正在进行的生成
      if (status === "streaming" || status === "submitted") {
        console.log(`[ChatPanel] 模式切换，停止正在进行的生成`);
        void handleStopAll({
          type: "info",
          message: "已切换渲染模式，自动暂停当前生成。"
        });
      }
      
      // 2. 切换到对应模式的根分支
      const targetBranch = switchRenderMode(renderMode);
      if (targetBranch) {
        console.log(`[ChatPanel] 已切换到 ${renderMode} 模式的根分支: ${targetBranch.id}`);
        
        // 3. 立即恢复对应分支的画布和消息
        // 恢复画布
        if (targetBranch.diagramXml) {
          (async () => {
            try {
              console.log(`[ChatPanel] 恢复 ${renderMode} 模式的画布`);
              await handleDiagramXml(targetBranch.diagramXml, {
                origin: "display",
                modelRuntime: void 0
              });
            } catch (error) {
              console.error(`[ChatPanel] 恢复 ${renderMode} 模式画布失败:`, error);
            }
          })();
        } else {
          // 如果分支没有 diagramXml，清空画布
          console.log(`[ChatPanel] ${renderMode} 模式分支无画布内容，清空画布`);
          clearDiagram();
        }
        
        // 恢复消息列表（立即同步，不等待异步操作）
        const targetMessages = targetBranch.messages || [];
        if (targetMessages.length > 0) {
          console.log(`[ChatPanel] 恢复 ${renderMode} 模式的对话历史，共 ${targetMessages.length} 条消息`);
        } else {
          console.log(`[ChatPanel] ${renderMode} 模式分支无对话历史，清空消息列表`);
        }
        // 立即更新消息列表，确保对话窗口显示正确的历史
        setMessages(targetMessages);
        
        // 清空输入框，避免残留内容
        setInput("");
      }
      
      lastRenderModeRef.current = renderMode;
    }
  }, [renderMode, switchRenderMode, status, handleStopAll, handleDiagramXml, clearDiagram, setMessages, setInput]);
  
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
      // 重试时不保存历史，因为用户在首次发送消息时已经保存过了
      const chartXml = await fetchAndFormatDiagram({ saveHistory: false });
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
  // ========== 统一的任务状态判断函数 ==========
  // 这是前端唯一判断任务是否真正完成的地方，确保逻辑清晰一致
  // 判断条件：
  // 1. status === "ready" 或 status === "error"
  // 2. metadata.isTaskCompleted === true 且 metadata.taskFailed === false
  // 3. 没有待处理的工具调用（所有工具调用的 state 都是 "output-available" 或 "output-error"）
  // 4. 或者有图表工具完成（display_diagram 或 display_svg）
  const isTaskReallyCompleted = useMemo(() => {
    // 如果状态不是 ready 或 error，任务肯定未完成
    if (status !== "ready" && status !== "error") {
      return false;
    }
    
    // 检查是否有待处理的工具调用（工具调用还未完成）
    const hasPendingToolCalls = messages.some((msg) => {
      if (msg.role !== "assistant" || !Array.isArray(msg.parts)) return false;
      return msg.parts.some((part) => {
        if (!part.type?.startsWith("tool-")) return false;
        // 检查工具调用状态：如果状态不是 "output-available" 或 "output-error"，说明还在处理中
        const toolState = part.state;
        return toolState !== "output-available" && toolState !== "output-error";
      });
    });
    
    // 如果有待处理的工具调用，任务未完成
    if (hasPendingToolCalls) {
      return false;
    }
    
    // 检查是否有图表工具完成（display_diagram 或 display_svg）
    const hasDiagramTool = messages.some((msg) => {
      if (msg.role !== "assistant" || !Array.isArray(msg.parts)) return false;
      return msg.parts.some((part) => {
        if (!part.type?.startsWith("tool-")) return false;
        const toolName = part.type.replace("tool-", "");
        // 只有当 display_diagram 或 display_svg 完成时才算真正完成
        return (toolName === "display_diagram" || toolName === "display_svg") && 
               part.state === "output-available";
      });
    });
    
    // 如果有图表工具完成，任务完成
    if (hasDiagramTool) {
      return true;
    }
    
    // 检查最新的 assistant 消息的 metadata，看任务是否真正完成
    const lastAssistant = messages?.filter(m => m.role === 'assistant').pop();
    const metadata = lastAssistant?.metadata;
    const isTaskCompletedFromMetadata = metadata?.isTaskCompleted && !metadata?.taskFailed;
    
    // 如果 metadata 标记任务完成，且没有待处理的工具调用，任务完成
    return isTaskCompletedFromMetadata;
  }, [status, messages]);
  
  // 监听 status 变化，更新进度阶段
  // 使用统一的任务状态判断函数
  useEffect(() => {
    // 清除之前的超时定时器
    if (readyStatusTimeoutRef.current) {
      clearTimeout(readyStatusTimeoutRef.current);
      readyStatusTimeoutRef.current = null;
    }
    
    if (status === "streaming") {
      // 流式生成开始，设置进度为"生成图表"
      setGenerationPhase("generating");
    } else if (status === "submitted") {
      // 保持当前进度（可能是 thinking 或 sending）
      // 如果当前是 idle，设置为 thinking
      setGenerationPhase((prev) => prev === "idle" ? "thinking" : prev);
    } else if (status === "ready" || status === "error") {
      console.log("[generationPhase] status 变为 ready/error，检查任务状态", {
        status,
        isTaskReallyCompleted,
        messagesCount: messages?.length
      });
      
      // 使用统一的任务状态判断函数
      if (status === "error") {
        // 出错时重置进度状态
        setGenerationPhase("idle");
      } else if (isTaskReallyCompleted) {
        // 任务真正完成，重置进度状态
        setGenerationPhase("idle");
        // 清除所有工具调用超时定时器
        toolResultTimeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
        toolResultTimeoutRefs.current.clear();
      } else {
        // 任务未完成，保持当前进度（不重置为 idle）
        // 这样可以让进度指示器继续显示，等待工具执行结果和 LLM 的下一步响应
        console.log("[generationPhase] 任务未完成，保持当前进度，等待工具执行结果或 LLM 继续响应");
        
        // 添加超时保护：如果 status === "ready" 超过 30 秒仍然没有完成，自动重置为 idle
        // 这可以避免前端一直显示"正在生成"的情况
        if (status === "ready") {
          readyStatusTimeoutRef.current = setTimeout(() => {
            console.warn("[generationPhase] ⚠️ 超时保护：status 为 'ready' 已超过 30 秒，自动重置为 idle");
            setGenerationPhase("idle");
            readyStatusTimeoutRef.current = null;
          }, 30000); // 30 秒超时
        }
      }
    }
    
    // 清理函数：组件卸载或状态变化时清除超时定时器
    return () => {
      if (readyStatusTimeoutRef.current) {
        clearTimeout(readyStatusTimeoutRef.current);
        readyStatusTimeoutRef.current = null;
      }
      // 注意：不在这里清除 toolResultTimeoutRefs，因为它们需要在工具调用完成后才清除
    };
  }, [status, messages, isTaskReallyCompleted]);
  
  // 监听消息变化，检测是否有新的 assistant 消息（工具调用后的响应）
  useEffect(() => {
    // 检查所有待处理的工具调用超时定时器
    toolResultTimeoutRefs.current.forEach((timeoutId, toolCallId) => {
      // 检查是否有新的 assistant 消息
      const lastAssistant = messages?.filter(m => m.role === 'assistant').pop();
      if (lastAssistant && lastAssistant.id) {
        // 如果有新的 assistant 消息，说明 LLM 已经响应，清除超时定时器
        console.log("[toolResultListener] 检测到新的 assistant 消息，清除工具调用超时定时器", {
          toolCallId,
          lastAssistantId: lastAssistant.id
        });
        clearTimeout(timeoutId);
        toolResultTimeoutRefs.current.delete(toolCallId);
      }
    });
  }, [messages]);
  
  // 状态监听机制：监听工具调用完成后的状态，如果长时间没有响应则主动触发
  useEffect(() => {
    // 只在 status 为 'ready' 时检查
    if (status !== 'ready') {
      return;
    }
    
    // 检查是否有工具结果已添加但长时间没有新的 assistant 消息
    const checkToolResultsAndTrigger = () => {
      const currentMessages = messages;
      if (!currentMessages || currentMessages.length === 0) {
        return;
      }
      
      // 查找所有已完成的工具调用（有 tool 消息但还没有新的 assistant 响应）
      const toolMessages = currentMessages.filter(msg => msg.role === 'tool');
      const lastAssistant = currentMessages.filter(m => m.role === 'assistant').pop();
      const lastAssistantId = lastAssistant?.id;
      
      // 检查每个工具消息，看是否有对应的 assistant 响应
      for (const toolMsg of toolMessages) {
        const toolCallId = toolMsg.toolCallId;
        if (!toolCallId) continue;
        
        // 检查是否已经手动触发过
        if (manualTriggerRef.current.has(toolCallId)) {
          continue;
        }
        
        // 检查是否有新的 assistant 消息（在工具消息之后）
        const toolMsgIndex = currentMessages.findIndex(msg => 
          msg.role === 'tool' && msg.toolCallId === toolCallId
        );
        const assistantAfterTool = currentMessages
          .slice(toolMsgIndex + 1)
          .some(msg => msg.role === 'assistant' && msg.id !== lastAssistantId);
        
        // 如果工具消息之后没有新的 assistant 消息，且已经过了足够的时间，尝试触发
        if (!assistantAfterTool) {
          // 检查工具消息的时间戳（如果有）
          const toolMsgTime = toolMsg.createdAt || toolMsg.timestamp || Date.now();
          const timeSinceToolResult = Date.now() - (typeof toolMsgTime === 'number' ? toolMsgTime : Date.now());
          
          // 如果工具结果已添加超过 3 秒，且状态仍然是 ready，尝试触发
          if (timeSinceToolResult > 3000) {
            const lastAssistantMetadata = lastAssistant?.metadata;
            const finishReason = lastAssistantMetadata?.finishReason;
            const isTaskCompleted = lastAssistantMetadata?.isTaskCompleted;
            
            // 如果 finishReason 是 'stop' 且任务未完成，应该触发下一轮响应
            if (finishReason === 'stop' && isTaskCompleted === false) {
              console.warn(`[状态监听] 检测到工具结果已添加超过 3 秒但 LLM 仍未响应，主动触发下一轮响应`, {
                toolCallId,
                toolName: toolMsg.toolName || 'unknown',
                finishReason,
                isTaskCompleted,
                timeSinceToolResult
              });
              
              // 标记已触发，避免重复
              manualTriggerRef.current.add(toolCallId);
              
              // 主动触发下一轮响应
              const currentSendMessage = sendMessageRef.current;
              if (currentSendMessage) {
                console.log(`[状态监听] 调用 sendMessage 触发下一轮响应 (工具: ${toolMsg.toolName || 'unknown'})`);
                
                // 异步获取图表 XML 和构建请求体
                const triggerWithConfig = async () => {
                  try {
                    // 获取当前图表 XML
                    const currentXml = fetchAndFormatDiagramRef.current 
                      ? await fetchAndFormatDiagramRef.current({ saveHistory: false })
                      : "";
                    
                    // 构建模型配置
                    const modelConfig = buildModelRequestBodyRef.current 
                      ? buildModelRequestBodyRef.current(selectedModelRef.current)
                      : {};
                    
                    // 获取流式标志
                    const streamingFlag = renderModeRef.current === "svg" 
                      ? false 
                      : (selectedModelRef.current?.isStreaming ?? false);
                    
                    console.log(`[状态监听] 准备发送请求，包含模型配置`, {
                      hasModelConfig: !!Object.keys(modelConfig).length,
                      hasXml: !!currentXml,
                      renderMode: renderModeRef.current,
                      streamingFlag
                    });
                    
                    // 调用 sendMessage，传递完整的配置信息
                    currentSendMessage(
                      { 
                        parts: [{ type: "text", text: "" }]
                      },
                      {
                        body: {
                          xml: currentXml,
                          ...modelConfig,
                          enableStreaming: streamingFlag,
                          renderMode: renderModeRef.current || "drawio"
                        }
                      }
                    );
                  } catch (error) {
                    console.error(`[状态监听] 获取配置信息失败，使用简化请求`, error);
                    // 如果获取配置失败，至少尝试发送一个空消息
                    currentSendMessage({ 
                      parts: [{ type: "text", text: "" }]
                    });
                  }
                };
                
                // 立即触发
                triggerWithConfig();
              }
            }
          }
        }
      }
    };
    
    // 延迟检查，给系统一些时间处理
    const timeoutId = setTimeout(checkToolResultsAndTrigger, 3000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [status, messages]);

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
    if (showHistory && (status === "streaming" || status === "submitted")) {
      void handleStopAll({
        type: "error",
        message: "查看历史时已暂停当前生成。"
      });
    }
  }, [showHistory, status, handleStopAll]);

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
      // 防止重复提交：如果正在提交中或流式生成中，直接返回
      if (isSubmitting || status === "streaming" || status === "submitted") {
        return;
      }
      if (!input.trim()) {
        return;
      }
      if (!selectedModel) {
        // 模型配置弹窗已移除
        return;
      }
      // 立即设置提交状态，禁用发送按钮，防止用户重复点击
      setIsSubmitting(true);
      // 设置进度阶段为"准备中"
      setGenerationPhase("preparing");
      
      // ========== Mixed 模式预扣费 ==========
      // 在发送消息前预扣固定费用，如果余额不足则取消任务
      if (isPhotonChargeEnabled() && getChargeMode() === 'mixed') {
        // 1. 保存状态快照（用于任务失败时回滚）
        saveStateSnapshot();
        
        // 2. 调用预扣费 API
        try {
          console.log("Mixed 模式：开始预扣费");
          const preChargeResult = await preChargePhoton();
          
          if (!preChargeResult.success) {
            // 预扣费失败（余额不足），取消任务
            console.log("预扣费失败：", preChargeResult);
            setIsSubmitting(false);
            setGenerationPhase("idle");
            // 清空快照（因为任务还没开始）
            clearStateSnapshot();
            // 显示错误提示：优先使用 isInsufficientBalance 字段判断余额不足
            const errorMessage = preChargeResult.isInsufficientBalance
              ? "您的光子不足"
              : (preChargeResult.message || "预扣费失败，请稍后重试");
            notifyUser("error", errorMessage);
            return;
          }
          
          console.log("预扣费成功：", preChargeResult);
        } catch (preChargeError) {
          console.error("预扣费请求异常：", preChargeError);
          setIsSubmitting(false);
          setGenerationPhase("idle");
          // 清空快照
          clearStateSnapshot();
          notifyUser("error", "预扣费请求失败：" + (preChargeError instanceof Error ? preChargeError.message : String(preChargeError)));
          return;
        }
      }
      
      // 创建 AbortController 用于取消异步请求
      const abortController = new AbortController();
      submitAbortControllerRef.current = abortController;
      try {
        // 在发送消息前保存当前图表状态到历史记录
        // 这样用户可以在 AI 修改图表后回溯到之前的版本
        let chartXml = await fetchAndFormatDiagram({ saveHistory: true });
        // 检查是否已被取消
        if (abortController.signal.aborted) {
          return;
        }
        const streamingFlag = renderMode === "svg" ? false : selectedModel?.isStreaming ?? false;
        
        // 直接使用用户输入
        const finalInput = input;
        
        // 设置进度阶段为"发送请求"
        setGenerationPhase("sending");
        
        // 构建最终的消息内容
        const parts = [{ type: "text", text: finalInput }];
        if (files.length > 0) {
          const attachments = await serializeAttachments(files);
          attachments.forEach(({ url, mediaType, fileName }) => {
            parts.push({
              type: "file",
              url,
              mediaType,
              fileName // 添加文件名，确保消息中能正确显示
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
        // sendMessage 调用后设置进度为"AI 思考中"，后续 status 变化时会更新
        setGenerationPhase("thinking");
        // sendMessage 调用后重置提交状态（此时 status 会变为 submitted 或 streaming）
        setIsSubmitting(false);
        submitAbortControllerRef.current = null;
      } catch (submissionError) {
        // 如果是用户取消操作，不需要输出错误日志
        if (submissionError.name === "AbortError") {
          console.log("提交请求已被用户取消");
          // 重置进度状态
          setGenerationPhase("idle");
          return;
        }
        console.error("Error fetching chart data:", submissionError);
        // 出错时也需要重置提交状态和进度状态，允许用户重新发送
        setIsSubmitting(false);
        setGenerationPhase("idle");
        submitAbortControllerRef.current = null;
      }
    },
    [
      isSubmitting,
      status,
      input,
      onFetchChart,
      files,
      sendMessage,
      selectedModel,
      renderMode,
      buildModelRequestBody,
      saveStateSnapshot,
      clearStateSnapshot,
      notifyUser
    ]
  );
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  const handleFileChange = (newFiles) => {
    setFiles(newFiles);
  };
  const handleAICalibrationRequest = async () => {
    if (status === "streaming") {
      throw new Error("AI 正在回答其他请求，请稍后再试。");
    }
    if (!selectedModel) {
      throw new Error("请先配置可用模型后再执行校准。");
    }
    if (renderMode === "svg") {
      throw new Error("SVG 模式暂不支持校准，请切换回 draw.io XML 模式。");
    }
    // 校准时保存当前图表状态，以防校准失败需要恢复
    let chartXml = await fetchAndFormatDiagram({ saveHistory: true });
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
    // 统一使用 EMPTY_MXFILE 和 clearDiagram，因为两种模式都使用 Draw.io 画布
    updateActiveBranchDiagram(EMPTY_MXFILE);
    clearDiagram();
    clearConversation();
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
    
    // 确定当前分支的渲染模式
    const branchRenderMode = activeBranch.meta?.renderMode || contextRenderMode || "drawio";
    const isBranchSvgMode = branchRenderMode === "svg";
    
    // 只在非模式切换导致的分支变化时恢复画布和消息
    // 模式切换时的恢复逻辑已在 renderMode useEffect 中处理
    if (branchChanged && lastRenderModeRef.current === renderMode) {
      // 这是普通的分支切换（不是模式切换）
      if (activeBranch.diagramXml) {
        (async () => {
          try {
            // 统一使用 handleDiagramXml，因为 SVG 模式下 diagramXml 存储的是 Draw.io XML
            await handleDiagramXml(activeBranch.diagramXml, {
              origin: "display",
              modelRuntime: void 0
            });
          } catch (error2) {
            console.error("切换分支应用画布失败：", error2);
          }
        })();
      } else {
        // 如果分支没有 diagramXml，清空画布
        clearDiagram();
      }
      
      if (messagesMismatch) {
        setMessages(activeBranch.messages || []);
      }
      
      if (status === "streaming" || status === "submitted") {
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
    contextRenderMode,
    handleStopAll,
    handleDiagramXml,
    messages,
    setMessages,
    status
  ]);

  useEffect(() => {
    if (initialHydratedRef.current || !activeBranch) {
      return;
    }
    initialHydratedRef.current = true;

    // 确定当前分支的渲染模式
    const branchRenderMode = activeBranch.meta?.renderMode || contextRenderMode || "drawio";
    const isBranchSvgMode = branchRenderMode === "svg";

    if (activeBranch.diagramXml) {
      (async () => {
        try {
          // 统一使用 handleDiagramXml，因为 SVG 模式下 diagramXml 存储的是 Draw.io XML
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
  }, [activeBranch, contextRenderMode, handleDiagramXml, messages, setMessages]);
  // Bug 3 修复：重构 handleMessageRevert 为编辑模式
  // 现在会回溯画布到对应的历史位置
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
          // 如果目标位置之前没有用户消息，说明是回到最初状态
          // 清空画布
          // 统一使用 EMPTY_MXFILE 和 clearDiagram，因为两种模式都使用 Draw.io 画布
          diagramXmlToRestore = EMPTY_MXFILE;
          clearDiagram();
        }
      }
      
      // 创建新分支保存回溯状态
      const revertBranch = createBranch({
        parentId: activeBranchId,
        label: `编辑 · 消息 ${labelSuffix}`,
        meta: {
          type: "history",
          label: `消息 ${labelSuffix}`
        },
        diagramXml: diagramXmlToRestore,
        seedMessages: truncated,
        inheritMessages: false
      });
      
      setMessages(truncated);
      setInput(text ?? "");
      // 重置进度指示器状态（修复编辑回滚时的进度指示器问题）
      resetProgressIndicator();

      if (!revertBranch) {
        updateActiveBranchMessages(truncated);
        updateActiveBranchDiagram(diagramXmlToRestore);
      }
      
    },
    [
      activeBranch,
      activeBranchId,
      createBranch,
      messages,
      setMessages,
      setInput,
      updateActiveBranchMessages,
      updateActiveBranchDiagram,
      historyItems,
      handleRestoreHistory,
      clearDiagram
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
  // 包含 isSubmitting 状态，确保在用户点击发送后立即显示忙碌状态
  const isGenerationBusy = isSubmitting || status === "streaming" || status === "submitted";
  const shouldShowSidebar = Boolean(activeToolPanel && isToolSidebarOpen);
  return <>
            <Card className="relative flex h-full max-h-full min-h-0 w-full max-w-full flex-col gap-0 rounded-none py-0 overflow-hidden">
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
                                <div className="text-xs text-amber-700">
                                    请使用系统内置模型或配置自定义模型接口
                                </div>
                            </div>}
                        {/* 智能工具栏已移除 */}
                        <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden">
                            <div
    ref={messagesScrollRef}
    className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-xl bg-white px-2.5 py-2 pb-28"
    style={{ 
      // Bug 2 修复：使用固定高度计算，确保容器不会被内容撑开
      // 使用 calc 让容器高度根据视口计算，而不是被内容撑开
      maxHeight: "calc(100vh - 280px)",
      // 让滚动条更早显示：设置最小高度
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
    onMessageRevert={handleMessageRevert}
    runtimeDiagramError={runtimeError?.message ?? null}
    onConsumeRuntimeError={() => setRuntimeError(null)}
    onStopAll={() => void handleStopAll({
      type: "error",
      message: "已手动暂停当前生成任务。"
    })}
    onRetryGeneration={handleRetryGeneration}
    isGenerationBusy={isGenerationBusy}
    diagramResultVersion={diagramResultVersion}
    getDiagramResult={getDiagramResult}
    generationPhase={generationPhase}
    onProgressReset={progressResetTrigger.current}
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
    onModelStreamingChange={handleModelStreamingChange}
    architectWorkflowConfig={architectWorkflowConfig}
    onArchitectWorkflowConfigChange={setArchitectWorkflowConfig}
    interactionLocked={!selectedModel}
    renderMode={renderMode}
    onRenderModeChange={handleRenderModeChange}
    onStop={() => handleStopAll({
      type: "success",
      message: "已手动暂停当前生成任务。"
    })}
    isBusy={isGenerationBusy}
    historyItems={historyItems}
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
        </>;
}
export {
  ChatPanelOptimized as default
};
