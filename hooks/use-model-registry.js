"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { getDefaultEndpoints } from "@/lib/env-models.js";

const STORAGE_KEY = "flowpilot.modelRegistry.v1";

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
        }))
    );
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

    const models = useMemo(
        () => flattenModels(state.endpoints),
        [state.endpoints]
    );

    /**
     * @param {string} modelKey
     */
    const selectModel = useCallback(
        (modelKey) => {
            if (!modelKey) return;
            const exists = models.some((model) => model.key === modelKey);
            if (!exists) {
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
            return undefined;
        }
        return models.find((model) => model.key === state.selectedModelKey);
    }, [models, state.selectedModelKey]);

    return {
        isReady,
        hasConfiguredModels: models.length > 0,
        endpoints: state.endpoints,
        models,
        selectedModelKey: state.selectedModelKey,
        selectedModel,
        selectModel,
        saveEndpoints,
        clearRegistry,
    };
}

