"use client";

import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    KeyRound,
    Link2,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    Hash,
    ServerCog,
    ShieldCheck,
    Download,
    Loader2,
    Sparkles,
} from "lucide-react";
import { ModelSelector } from "@/components/model-selector";

// Simple Switch component
/**
 * @param {{
 *   checked: boolean;
 *   onCheckedChange: (checked: boolean) => void;
 *   disabled?: boolean;
 * }} props
 */
function Switch({ checked, onCheckedChange, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
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
 * @typedef {Object} ArchitectWorkflowConfig
 * @property {boolean} enabled
 * @property {import("@/types/model-config").RuntimeModelOption | null} architectModel
 * @property {import("@/types/model-config").RuntimeModelOption | null} rendererModel
 */

/**
 * @typedef {Object} ModelConfigDialogProps
 * @property {boolean} open
 * @property {(open: boolean) => void} onOpenChange
 * @property {import("@/types/model-config").ModelEndpointConfig[]} endpoints
 * @property {(drafts: import("@/types/model-config").ModelEndpointDraft[]) => void} onSave
 * @property {import("@/types/model-config").RuntimeModelOption[]} [models]
 * @property {ArchitectWorkflowConfig} [architectWorkflowConfig]
 * @property {(config: ArchitectWorkflowConfig) => void} [onArchitectWorkflowConfigChange]
 */

/**
 * @returns {import("@/types/model-config").EndpointModelDraft}
 */
const createEmptyModel = () => ({
    id: `model-${nanoid(6)}`,
    modelId: "",
    label: "",
});

/**
 * @returns {import("@/types/model-config").ModelEndpointDraft}
 */
const createEmptyEndpoint = () => {
    const timestamp = Date.now();
    return {
        id: `endpoint-${nanoid(6)}`,
        name: "",
        baseUrl: "",
        apiKey: "",
        createdAt: timestamp,
        updatedAt: timestamp,
        models: [createEmptyModel()],
    };
};

/**
 * @param {import("@/types/model-config").ModelEndpointDraft} endpoint
 * @returns {import("@/types/model-config").ModelEndpointDraft}
 */
const cloneEndpoint = (endpoint) => ({
    id: endpoint.id,
    name: endpoint.name,
    baseUrl: endpoint.baseUrl,
    apiKey: endpoint.apiKey,
    createdAt: endpoint.createdAt,
    updatedAt: endpoint.updatedAt,
    models: endpoint.models.map((model) => ({
        id: model.id,
        modelId: model.modelId,
        label: model.label,
        description: model.description,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
    })),
});

/**
 * @param {import("@/types/model-config").ModelEndpointDraft} endpoint
 * @returns {string[]}
 */
const validateEndpoint = (endpoint) => {
    const errors = [];
    if (!endpoint.baseUrl?.trim()) {
        errors.push("Base URL 不能为空。");
    }
    // 检查 API Key 是否有效
    const hasValidApiKey = endpoint.apiKey?.trim();
    if (!hasValidApiKey) {
        errors.push("API Key 不能为空。");
    }
    const validModels = endpoint.models.filter((model) =>
        Boolean(model.modelId?.trim())
    );
    if (validModels.length === 0) {
        errors.push("至少需要配置一个模型 ID。");
    }
    return errors;
};

/**
 * @param {ModelConfigDialogProps} props
 */
export function ModelConfigDialog({
    open,
    onOpenChange,
    endpoints,
    onSave,
    models = [],
    architectWorkflowConfig,
    onArchitectWorkflowConfigChange,
}) {
    const [drafts, setDrafts] = useState([]);
    const [revealedKeys, setRevealedKeys] = useState({});
    const [errors, setErrors] = useState({});
    // 加载可用模型相关状态
    const [loadingModels, setLoadingModels] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);
    const [modelSelectDialogOpen, setModelSelectDialogOpen] = useState(false);
    const [currentEndpointId, setCurrentEndpointId] = useState(null);

    useEffect(() => {
        if (open) {
            if (endpoints.length === 0) {
                setDrafts([createEmptyEndpoint()]);
            } else {
                setDrafts(endpoints.map((endpoint) => cloneEndpoint(endpoint)));
            }
            setRevealedKeys({});
            setErrors({});
        }
    }, [open, endpoints]);

    const toggleReveal = (endpointId) => {
        setRevealedKeys((prev) => ({
            ...prev,
            [endpointId]: !prev[endpointId],
        }));
    };

    const handleEndpointChange = (
        endpointId,
        patch
    ) => {
        setDrafts((prev) =>
            prev.map((endpoint) =>
                endpoint.id === endpointId ? { ...endpoint, ...patch } : endpoint
            )
        );
    };

    const handleModelChange = (
        endpointId,
        modelId,
        patch
    ) => {
        setDrafts((prev) =>
            prev.map((endpoint) =>
                endpoint.id === endpointId
                    ? {
                          ...endpoint,
                          models: endpoint.models.map((model) =>
                              model.id === modelId ? { ...model, ...patch } : model
                          ),
                      }
                    : endpoint
            )
        );
    };

    const handleAddEndpoint = () => {
        setDrafts((prev) => [...prev, createEmptyEndpoint()]);
    };

    const handleRemoveEndpoint = (endpointId) => {
        setDrafts((prev) => prev.filter((endpoint) => endpoint.id !== endpointId));
    };

    const handleAddModel = (endpointId) => {
        setDrafts((prev) =>
            prev.map((endpoint) =>
                endpoint.id === endpointId
                    ? {
                          ...endpoint,
                          models: [...endpoint.models, createEmptyModel()],
                      }
                    : endpoint
            )
        );
    };

    const handleRemoveModel = (endpointId, modelId) => {
        setDrafts((prev) =>
            prev.map((endpoint) => {
                if (endpoint.id !== endpointId) return endpoint;
                
                return {
                    ...endpoint,
                    models:
                        endpoint.models.length > 1
                            ? endpoint.models.filter((model) => model.id !== modelId)
                            : endpoint.models,
                };
            })
        );
    };

    /**
     * 根据 Base URL 判断提供商类型
     * @param {string} baseUrl - API 基础 URL
     * @returns {'openai' | 'anthropic'} 提供商类型
     */
    const deriveProviderType = (baseUrl) => {
        if (!baseUrl) {
            return 'openai'; // 默认使用 OpenAI 兼容协议
        }
        try {
            const hostname = new URL(baseUrl).hostname.toLowerCase();
            if (hostname.includes('anthropic') || hostname.includes('claude')) {
                return 'anthropic';
            }
            return 'openai'; // 默认使用 OpenAI 兼容协议
        } catch {
            return 'openai';
        }
    };

    /**
     * 加载可用模型列表
     * @param {string} endpointId - 接口 ID
     */
    const handleLoadAvailableModels = async (endpointId) => {
        const endpoint = drafts.find((e) => e.id === endpointId);
        if (!endpoint) return;

        // 验证必需字段
        if (!endpoint.baseUrl?.trim() || !endpoint.apiKey?.trim()) {
            alert('请先填写 Base URL 和 API Key');
            return;
        }

        setLoadingModels(true);
        setCurrentEndpointId(endpointId);

        try {
            // 判断提供商类型
            const providerType = deriveProviderType(endpoint.baseUrl);

            // 调用 API 获取模型列表
            const params = new URLSearchParams({
                type: providerType,
                baseUrl: endpoint.baseUrl.trim(),
                apiKey: endpoint.apiKey.trim(),
            });

            const response = await fetch(`/api/models?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '获取模型列表失败');
            }

            // 过滤掉已经添加的模型
            const existingModelIds = new Set(
                endpoint.models.map((m) => m.modelId).filter(Boolean)
            );
            const available = (data.models || []).filter(
                (model) => !existingModelIds.has(model.id)
            );

            if (available.length === 0) {
                alert('没有可用的新模型，所有模型都已添加');
                return;
            }

            setAvailableModels(available);
            setModelSelectDialogOpen(true);
        } catch (error) {
            console.error('加载模型列表失败:', error);
            alert(`加载模型列表失败: ${error.message}`);
        } finally {
            setLoadingModels(false);
        }
    };

    /**
     * 从可用模型列表中选择并添加模型
     * @param {string} modelId - 模型 ID
     */
    const handleSelectModel = (modelId) => {
        if (!currentEndpointId) return;

        const selectedModel = availableModels.find((m) => m.id === modelId);
        if (!selectedModel) return;

        // 添加选中的模型到当前接口
        setDrafts((prev) =>
            prev.map((endpoint) =>
                endpoint.id === currentEndpointId
                    ? {
                          ...endpoint,
                          models: [
                              ...endpoint.models,
                              {
                                  ...createEmptyModel(),
                                  modelId: selectedModel.id,
                                  label: selectedModel.name || selectedModel.id,
                              },
                          ],
                      }
                    : endpoint
            )
        );

        // 关闭对话框并重置状态
        setModelSelectDialogOpen(false);
        setAvailableModels([]);
        setCurrentEndpointId(null);
    };

    const handleSave = () => {
        // 如果只配置了 Architect 工作流，允许保存空接口列表
        // 只有当存在接口配置时才进行验证
        if (drafts.length > 0) {
            const nextErrors = {};
            // 只验证那些至少填写了部分内容的接口
            // 如果接口完全是空的（name、baseUrl、apiKey 都为空，且没有有效模型），就忽略它
            const validDrafts = drafts.filter((endpoint) => {
                // 检查接口是否为空（所有字段都为空）
                const isEmpty = 
                    !endpoint.name?.trim() && 
                    !endpoint.baseUrl?.trim() && 
                    !endpoint.apiKey?.trim() &&
                    endpoint.models.every(model => !model.modelId?.trim());
                
                // 如果接口为空，直接忽略，不进行验证
                if (isEmpty) {
                    return false;
                }
                
                // 如果接口有内容，进行验证
                const issues = validateEndpoint(endpoint);
                if (issues.length > 0) {
                    nextErrors[endpoint.id] = issues;
                    return false;
                }
                return true;
            });

            if (Object.keys(nextErrors).length > 0) {
                setErrors(nextErrors);
                return;
            }

            // 保存有效的接口配置（可能为空数组）
            onSave(validDrafts);
        } else {
            // 如果没有接口配置，保存空数组（允许仅配置 Architect 工作流）
            onSave([]);
        }
        
        onOpenChange(false);
    };

    /**
     * @param {string} endpointId
     * @param {import("@/types/model-config").EndpointModelDraft} model
     */
    const renderModelRow = (endpointId, model) => {
        return (
            <div
                key={model.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200/70 bg-white/80 p-3"
            >
                {/* 模型ID和标签输入框 */}
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            模型 ID
                        </label>
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2">
                            <Hash className="h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="app-xxxx 或 gpt-4o 等"
                                value={model.modelId}
                                onChange={(event) =>
                                    handleModelChange(endpointId, model.id, {
                                        modelId: event.target.value,
                                    })
                                }
                                className="h-9 w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            显示名称（可选）
                        </label>
                        <input
                            type="text"
                            placeholder="Figsci · 报表模型"
                            value={model.label}
                            onChange={(event) =>
                                handleModelChange(endpointId, model.id, {
                                    label: event.target.value,
                                })
                            }
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        />
                    </div>
                </div>

                {/* 流式输出配置 */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600">
                            流式输出
                        </span>
                        <span className="text-[10px] text-slate-400">
                            (启用后对话逐字显示)
                        </span>
                    </div>
                    <Switch
                        checked={model.isStreaming ?? false}
                        onCheckedChange={(checked) =>
                            handleModelChange(endpointId, model.id, {
                                isStreaming: checked,
                            })
                        }
                    />
                </div>

                {/* 删除按钮 */}
                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-slate-400 hover:text-red-600"
                        onClick={() => handleRemoveModel(endpointId, model.id)}
                        disabled={
                            (drafts.find((item) => item.id === endpointId)?.models.length ?? 1) <= 1
                        }
                        title="删除模型"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white/95 p-0 sm:max-w-3xl">
                <DialogHeader className="flex-shrink-0 border-b border-slate-100 px-6 py-4">
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                        <ServerCog className="h-5 w-5 text-slate-500" />
                        模型与 API 管理
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500">
                        一个 Base URL 绑定一个 API Key，可挂载多个模型 ID。所有配置仅存储在本地浏览器，不会上传到服务器。
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
                    {/* 隐藏接口配置提示 */}
                    {/* <div className="rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
                        提示：OpenRouter、OpenAI 自建代理都可以通过自定义 Base URL 接入；确保该接口支持 OpenAI 兼容协议。
                    </div> */}

                    {/* 隐藏接口配置部分 */}
                    {false && drafts.map((endpoint, index) => {
                        const endpointErrors = errors[endpoint.id] ?? [];
                        return (
                            <div
                                key={endpoint.id}
                                className={cn(
                                    "space-y-4 rounded-3xl border px-4 py-4 shadow-sm",
                                    endpointErrors.length > 0
                                        ? "border-red-200/80 bg-red-50/50"
                                        : "border-slate-100 bg-white/80"
                                )}
                            >
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                                                接口 {index + 1}
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="给这个接口起个名字（如：OpenAI）"
                                            value={endpoint.name}
                                            onChange={(event) =>
                                                handleEndpointChange(endpoint.id, {
                                                    name: event.target.value,
                                                })
                                            }
                                            className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none md:w-80"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full"
                                            onClick={() =>
                                                setDrafts((prev) => [
                                                    ...prev,
                                                    cloneEndpoint({
                                                        ...endpoint,
                                                        id: `endpoint-${nanoid(6)}`,
                                                        name: `${endpoint.name || "未命名"} · 副本`,
                                                    }),
                                                ])
                                            }
                                        >
                                            复制接口
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-full text-slate-400 hover:text-red-600"
                                            onClick={() => handleRemoveEndpoint(endpoint.id)}
                                            disabled={drafts.length <= 1}
                                            title="删除接口"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                            Base URL
                                        </label>
                                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                                            <Link2 className="h-4 w-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="https://api.example.com/v1"
                                                value={endpoint.baseUrl}
                                                onChange={(event) =>
                                                    handleEndpointChange(endpoint.id, {
                                                        baseUrl: event.target.value,
                                                    })
                                                }
                                                className="h-10 w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                            API Key
                                        </label>
                                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                                            <KeyRound className="h-4 w-4 text-slate-400" />
                                            <input
                                                type={revealedKeys[endpoint.id] ? "text" : "password"}
                                                placeholder="sk-xxxx or your-api-key"
                                                value={endpoint.apiKey}
                                                onChange={(event) =>
                                                    handleEndpointChange(endpoint.id, {
                                                        apiKey: event.target.value,
                                                    })
                                                }
                                                className="h-10 w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700"
                                                onClick={() => toggleReveal(endpoint.id)}
                                            >
                                                {revealedKeys[endpoint.id] ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                             )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                            模型列表
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* 加载可用模型按钮 */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 rounded-full text-slate-500 hover:text-slate-800"
                                                onClick={() => handleLoadAvailableModels(endpoint.id)}
                                                disabled={loadingModels || !endpoint.baseUrl?.trim() || !endpoint.apiKey?.trim()}
                                                title="从配置的 LLM 提供商加载可用模型列表"
                                            >
                                                {loadingModels && currentEndpointId === endpoint.id ? (
                                                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Download className="mr-1.5 h-4 w-4" />
                                                )}
                                                加载可用模型
                                            </Button>
                                            {/* 添加模型按钮 */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 rounded-full text-slate-500 hover:text-slate-800"
                                                onClick={() => handleAddModel(endpoint.id)}
                                                title="添加模型"
                                            >
                                                <Plus className="mr-1.5 h-4 w-4" />
                                                添加模型
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {endpoint.models.map((model) =>
                                            renderModelRow(endpoint.id, model)
                                        )}
                                    </div>
                                </div>

                                {endpointErrors.length > 0 && (
                                    <div className="rounded-2xl border border-red-200 bg-white/80 px-3 py-2 text-sm text-red-600">
                                        {endpointErrors.map((error, idx) => (
                                            <div key={`${endpoint.id}-error-${idx}`}>{error}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* 保留"新增接口"按钮，但隐藏接口配置 */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4 inline-flex items-center gap-2 self-start rounded-full border-dashed border-slate-300 text-slate-600"
                        onClick={handleAddEndpoint}
                    >
                        <Plus className="h-4 w-4" />
                        新增接口
                    </Button>

                    {/* Architect Workflow 配置区域 */}
                    {architectWorkflowConfig && onArchitectWorkflowConfigChange && (
                        <div className="mt-4 space-y-4 rounded-2xl border border-blue-200 bg-blue-50/50 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Architect 工作流
                                        </h3>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            启用两阶段智能体工作流（The Architect + The Renderer）
                                        </p>
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
                                />
                            </div>

                            {architectWorkflowConfig.enabled && (
                                <div className="mt-4 space-y-4 rounded-xl border border-blue-100 bg-white/80 p-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Architect 模型（逻辑推理）
                                        </label>
                                        <p className="text-xs text-slate-500">
                                            推荐使用推理能力强的模型（如 GPT-5, Claude 4.5, Gemini 3 Pro）
                                        </p>
                                        <ModelSelector
                                            selectedModelKey={
                                                architectWorkflowConfig.architectModel?.key || null
                                            }
                                            onModelChange={(key) => {
                                                const model = models.find((m) => m.key === key);
                                                onArchitectWorkflowConfigChange({
                                                    ...architectWorkflowConfig,
                                                    architectModel: model || null,
                                                });
                                            }}
                                            models={models}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Renderer 模型（代码生成）
                                        </label>
                                        <p className="text-xs text-slate-500">
                                            推荐使用代码生成能力强的模型（如 GPT-4o, Claude Sonnet）
                                        </p>
                                        <ModelSelector
                                            selectedModelKey={
                                                architectWorkflowConfig.rendererModel?.key || null
                                            }
                                            onModelChange={(key) => {
                                                const model = models.find((m) => m.key === key);
                                                onArchitectWorkflowConfigChange({
                                                    ...architectWorkflowConfig,
                                                    rendererModel: model || null,
                                                });
                                            }}
                                            models={models}
                                        />
                                    </div>

                                    <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-800">
                                        <p className="font-semibold">提示：</p>
                                        <ul className="mt-1 list-disc list-inside space-y-0.5">
                                            <li>如果未配置特定模型，将使用当前对话的默认模型</li>
                                            <li>Architect 负责生成 VISUAL SCHEMA，Renderer 负责转换为 XML</li>
                                            <li>此工作流仅支持 drawio 模式，不支持 svg 模式和续写</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-shrink-0 flex flex-col gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[11px] text-slate-500">
                        数据仅保存在浏览器 localStorage，清理缓存或更换设备会丢失配置。
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            className="rounded-full"
                            onClick={() => onOpenChange(false)}
                        >
                            取消
                        </Button>
                        <Button
                            type="button"
                            className="rounded-full bg-slate-900 px-4 text-white hover:bg-slate-900/90"
                            onClick={handleSave}
                        >
                            保存配置
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>

            {/* 模型选择对话框 */}
            <Dialog open={modelSelectDialogOpen} onOpenChange={setModelSelectDialogOpen}>
                <DialogContent className="max-h-[80vh] overflow-hidden rounded-3xl bg-white/95 p-0 sm:max-w-2xl">
                    <DialogHeader className="border-b border-slate-100 px-6 py-4">
                        <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                            <Download className="h-5 w-5 text-slate-500" />
                            选择要添加的模型
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                            从可用模型列表中选择要添加到当前接口的模型
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex max-h-[60vh] flex-col overflow-y-auto px-6 py-4">
                        {availableModels.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-500">
                                没有可用的模型
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {availableModels.map((model) => (
                                    <button
                                        key={model.id}
                                        type="button"
                                        onClick={() => handleSelectModel(model.id)}
                                        className="w-full rounded-xl border border-slate-200 bg-white/80 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-slate-900">
                                                    {model.name || model.id}
                                                </div>
                                                {model.name && model.name !== model.id && (
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {model.id}
                                                    </div>
                                                )}
                                            </div>
                                            <Plus className="h-5 w-5 text-slate-400" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="border-t border-slate-100 px-6 py-4">
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}

