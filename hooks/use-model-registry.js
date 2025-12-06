"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { getDefaultEndpoints } from "@/lib/env-models.js";

const STORAGE_KEY = "Figsci.modelRegistry.v1";

// 系统模型端点 ID 常量
const SYSTEM_ENDPOINT_ID = "system";

/**
 * @typedef {import("@/types/model-config.js").SystemModelInfo} SystemModelInfo
 */

/**
 * @param {string} baseUrl
 * @returns {string}
 */
const deriveProviderHint = (baseUrl) => {
    if (!baseUrl) return "Custom Endpoint";
    try {
        const url = new URL(baseUrl);
        return url.hostname.replace(/^www\./, "");
    } catch {
        return baseUrl;
    }
};

/**
 * @param {EndpointModelDraft} model
 * @param {number} timestamp
 * @returns {EndpointModelConfig | null}
 */
const normalizeModel = (model, timestamp) => {
    const modelId = (model.modelId ?? "").trim();
    if (!modelId) {
        return null;
    }
    const label = (model.label ?? "").trim() || modelId;
    return {
        id: model.id && model.id.trim().length > 0 ? model.id : nanoid(8),
        modelId,
        label,
        description: model.description?.trim() || undefined,
        isStreaming: model.isStreaming ?? false, // 默认非流式
        createdAt: model.createdAt ?? timestamp,
        updatedAt: timestamp,
    };
};

/**
 * @param {ModelEndpointDraft} draft
 * @param {number} timestamp
 * @returns {ModelEndpointConfig | null}
 */
const normalizeEndpoint = (draft, timestamp) => {
    const baseUrl = (draft.baseUrl ?? "").trim();
    const apiKey = (draft.apiKey ?? "").trim();
    if (!baseUrl || !apiKey) {
        return null;
    }

    const models = (draft.models ?? [])
        .map((model) => normalizeModel(model, timestamp))
        .filter((model) => Boolean(model));

    if (models.length === 0) {
        return null;
    }

    return {
        id: draft.id && draft.id.trim().length > 0 ? draft.id : nanoid(12),
        name: (draft.name ?? "").trim() || deriveProviderHint(baseUrl),
        baseUrl,
        apiKey,
        models,
        createdAt: draft.createdAt ?? timestamp,
        updatedAt: timestamp,
    };
};

/**
 * @param {string} endpointId
 * @param {string} modelId
 * @returns {string}
 */
const buildModelKey = (endpointId, modelId) =>
    `${endpointId}:${modelId}`;

/**
 * @param {string | undefined} previousKey
 * @param {ModelEndpointConfig[]} endpoints
 * @returns {string | undefined}
 */
const determineNextSelection = (previousKey, endpoints) => {
    if (
        previousKey &&
        endpoints.some((endpoint) =>
            endpoint.models.some(
                (model) => buildModelKey(endpoint.id, model.id) === previousKey
            )
        )
    ) {
        return previousKey;
    }
    const firstEndpoint = endpoints[0];
    if (!firstEndpoint || firstEndpoint.models.length === 0) {
        return undefined;
    }
    return buildModelKey(firstEndpoint.id, firstEndpoint.models[0].id);
};

/**
 * @param {ModelEndpointConfig[]} endpoints
 * @returns {RuntimeModelOption[]}
 */
const flattenModels = (endpoints) => {
    return endpoints.flatMap((endpoint) =>
        endpoint.models.map((model) => ({
            key: buildModelKey(endpoint.id, model.id),
            modelId: model.modelId,
            label: model.label,
            baseUrl: endpoint.baseUrl,
            apiKey: endpoint.apiKey,
            endpointId: endpoint.id,
            endpointName: endpoint.name,
            providerHint: deriveProviderHint(endpoint.baseUrl),
            isStreaming: model.isStreaming ?? false, // 添加流式配置
            isSystemModel: false, // 标记为非系统模型
        }))
    );
};

/**
 * 将系统模型转换为运行时选项
 * @param {SystemModelInfo[]} systemModels
 * @returns {RuntimeModelOption[]}
 */
const flattenSystemModels = (systemModels) => {
    return systemModels.map((model) => ({
        key: buildModelKey(SYSTEM_ENDPOINT_ID, model.id),
        modelId: model.id,
        label: model.label,
        description: model.description,
        // 系统模型不需要在客户端存储这些信息
        baseUrl: "",
        apiKey: "",
        endpointId: SYSTEM_ENDPOINT_ID,
        endpointName: "系统内置",
        providerHint: "System",
        isStreaming: model.isStreaming ?? true,
        isSystemModel: true, // 标记为系统模型
    }));
};

// Default configuration
/**
 * @returns {ModelRegistryState}
 */
const createDefaultConfig = () => {
    const endpoints = getDefaultEndpoints();
    const firstEndpoint = endpoints[0];
    const firstModel = firstEndpoint?.models[0];
    
    return {
        endpoints,
        selectedModelKey: firstEndpoint && firstModel 
            ? buildModelKey(firstEndpoint.id, firstModel.id)
            : undefined,
    };
};

/**
 * @returns {Object}
 */
export function useModelRegistry() {
    const [state, setState] = useState({
        endpoints: [],
        selectedModelKey: undefined,
    });
    const [isReady, setIsReady] = useState(false);
    
    // 系统模型相关状态
    const [systemModels, setSystemModels] = useState([]);
    const [systemModelsEnabled, setSystemModelsEnabled] = useState(false);
    const [systemModelsLoading, setSystemModelsLoading] = useState(true);

    /**
     * @param {(prev: ModelRegistryState) => ModelRegistryState} updater
     */
    const setAndPersist = useCallback((updater) => {
        setState((prev) => {
            const next = updater(prev);
            if (typeof window !== "undefined") {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            }
            return next;
        });
    }, []);

    // 加载系统模型
    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        
        const loadSystemModels = async () => {
            try {
                setSystemModelsLoading(true);
                const response = await fetch("/api/system-models");
                const data = await response.json();
                
                if (data.enabled && Array.isArray(data.models)) {
                    setSystemModels(data.models);
                    setSystemModelsEnabled(true);
                    console.log("已加载系统内置模型:", data.models.length, "个");
                } else {
                    setSystemModels([]);
                    setSystemModelsEnabled(false);
                    console.log("系统内置模型未启用或无可用模型");
                }
            } catch (error) {
                console.error("加载系统模型失败:", error);
                setSystemModels([]);
                setSystemModelsEnabled(false);
            } finally {
                setSystemModelsLoading(false);
            }
        };
        
        loadSystemModels();
    }, []);

    // 加载用户自定义模型配置
    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            let initialState;
            
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object") {
                    const endpoints = Array.isArray(parsed.endpoints)
                        ? parsed.endpoints
                        : [];
                    
                    const normalizedSelection = determineNextSelection(
                        typeof parsed.selectedModelKey === "string"
                            ? parsed.selectedModelKey
                            : undefined,
                        endpoints
                    );
                    initialState = {
                        endpoints,
                        selectedModelKey: normalizedSelection,
                    };
                    
                    setState(initialState);
                    if (initialState.selectedModelKey !== parsed.selectedModelKey) {
                        window.localStorage.setItem(
                            STORAGE_KEY,
                            JSON.stringify(initialState)
                        );
                    }
                } else {
                    // Invalid format, use default config
                    initialState = createDefaultConfig();
                    setState(initialState);
                    window.localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify(initialState)
                    );
                }
            } else {
                // First time use, use default config
                initialState = createDefaultConfig();
                setState(initialState);
                window.localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(initialState)
                );
            }
        } catch (error) {
            console.error("Failed to load model registry:", error);
            // On error, use default config
            const fallbackState = createDefaultConfig();
            setState(fallbackState);
            try {
                window.localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(fallbackState)
                );
            } catch (e) {
                console.error("Failed to save fallback state:", e);
            }
        } finally {
            setIsReady(true);
        }
    }, []);

    // 合并系统模型和用户自定义模型
    // 系统模型在前，用户自定义模型在后
    const models = useMemo(() => {
        const systemModelOptions = systemModelsEnabled 
            ? flattenSystemModels(systemModels)
            : [];
        const userModelOptions = flattenModels(state.endpoints);
        return [...systemModelOptions, ...userModelOptions];
    }, [state.endpoints, systemModels, systemModelsEnabled]);
    
    // 仅用户自定义模型
    const userModels = useMemo(
        () => flattenModels(state.endpoints),
        [state.endpoints]
    );
    
    // 仅系统模型
    const systemModelOptions = useMemo(
        () => systemModelsEnabled ? flattenSystemModels(systemModels) : [],
        [systemModels, systemModelsEnabled]
    );

    /**
     * @param {string} modelKey
     */
    const selectModel = useCallback(
        (modelKey) => {
            if (!modelKey) return;
            const exists = models.some((model) => model.key === modelKey);
            if (!exists) {
                console.warn("尝试选择不存在的模型:", modelKey);
                return;
            }
            setAndPersist((prev) => ({
                ...prev,
                selectedModelKey: modelKey,
            }));
        },
        [models, setAndPersist]
    );
    
    /**
     * 检查当前选择的是否为系统模型
     * @param {string} [modelKey]
     * @returns {boolean}
     */
    const isSelectedSystemModel = useCallback(
        (modelKey) => {
            const key = modelKey || state.selectedModelKey;
            if (!key) return false;
            return key.startsWith(`${SYSTEM_ENDPOINT_ID}:`);
        },
        [state.selectedModelKey]
    );

    /**
     * @param {ModelEndpointDraft[]} drafts
     */
    const saveEndpoints = useCallback(
        (drafts) => {
            setAndPersist((prev) => {
                const timestamp = Date.now();
                const normalized = drafts
                    .map((draft) => normalizeEndpoint(draft, timestamp))
                    .filter((endpoint) => Boolean(endpoint));
                
                return {
                    endpoints: normalized,
                    selectedModelKey: determineNextSelection(
                        prev.selectedModelKey,
                        normalized
                    ),
                };
            });
        },
        [setAndPersist]
    );

    const clearRegistry = useCallback(() => {
        setAndPersist(() => ({
            endpoints: [],
            selectedModelKey: undefined,
        }));
    }, [setAndPersist]);

    const selectedModel = useMemo(() => {
        if (!state.selectedModelKey) {
            // 如果没有选择模型，且有系统模型可用，返回第一个系统模型
            if (systemModelsEnabled && systemModelOptions.length > 0) {
                return systemModelOptions[0];
            }
            return undefined;
        }
        return models.find((model) => model.key === state.selectedModelKey);
    }, [models, state.selectedModelKey, systemModelsEnabled, systemModelOptions]);
    
    // 当系统模型加载完成且当前没有选择模型时，自动选择第一个系统模型
    useEffect(() => {
        if (!systemModelsLoading && systemModelsEnabled && systemModelOptions.length > 0) {
            // 如果当前没有选中的模型，或者选中的模型不存在
            const currentSelection = models.find((m) => m.key === state.selectedModelKey);
            if (!currentSelection) {
                const firstSystemModel = systemModelOptions[0];
                console.log("自动选择系统模型:", firstSystemModel.label);
                setAndPersist((prev) => ({
                    ...prev,
                    selectedModelKey: firstSystemModel.key,
                }));
            }
        }
    }, [systemModelsLoading, systemModelsEnabled, systemModelOptions, models, state.selectedModelKey, setAndPersist]);

    return {
        isReady: isReady && !systemModelsLoading,
        hasConfiguredModels: models.length > 0,
        hasUserModels: userModels.length > 0,
        endpoints: state.endpoints,
        models,
        userModels,
        systemModels: systemModelOptions,
        systemModelsEnabled,
        selectedModelKey: state.selectedModelKey,
        selectedModel,
        selectModel,
        saveEndpoints,
        clearRegistry,
        isSelectedSystemModel,
    };
}

