// -*- coding: utf-8 -*-
// 系统内置模型配置管理
// 从环境变量读取系统模型配置，支持服务端安全地存储 API Key

import { createOpenAI } from "@ai-sdk/openai";

/**
 * 系统模型配置（客户端可见部分）
 * @typedef {Object} SystemModelInfo
 * @property {string} id - 模型 ID
 * @property {string} label - 显示名称
 * @property {string} [description] - 模型描述
 * @property {boolean} [isStreaming] - 是否支持流式输出
 */

/**
 * 系统模型完整配置（仅服务端使用）
 * @typedef {Object} SystemModelConfig
 * @property {string} id - 模型 ID
 * @property {string} label - 显示名称
 * @property {string} [description] - 模型描述
 * @property {boolean} [isStreaming] - 是否支持流式输出
 * @property {string} baseUrl - LLM API 基础 URL
 * @property {string} apiKey - LLM API Key
 */

/**
 * 检查系统模型的核心配置是否完整（Base URL 和 API Key）
 * @returns {boolean}
 */
export function hasSystemModelCredentials() {
    const baseUrl = process.env.SYSTEM_LLM_BASE_URL;
    const apiKey = process.env.SYSTEM_LLM_API_KEY;
    return Boolean(baseUrl?.trim()) && Boolean(apiKey?.trim());
}

/**
 * 检查系统模型功能是否启用
 * 必须同时满足：1. ENABLE_SYSTEM_MODELS 为 true，2. 有有效的 Base URL 和 API Key
 * @returns {boolean}
 */
export function isSystemModelsEnabled() {
    const enabled = process.env.ENABLE_SYSTEM_MODELS;
    const isEnabled = enabled === 'true' || enabled === '1';
    
    // 如果未启用，直接返回 false
    if (!isEnabled) {
        return false;
    }
    
    // 检查必需的配置是否存在
    if (!hasSystemModelCredentials()) {
        console.warn("系统模型已启用但配置不完整：缺少 SYSTEM_LLM_BASE_URL 或 SYSTEM_LLM_API_KEY");
        return false;
    }
    
    return true;
}

/**
 * 从环境变量获取静态配置的系统模型列表
 * @returns {SystemModelInfo[]}
 */
export function getStaticSystemModelList() {
    const modelsJson = process.env.SYSTEM_MODELS;
    if (!modelsJson || modelsJson.trim() === '') {
        return [];
    }

    try {
        const models = JSON.parse(modelsJson);
        if (!Array.isArray(models)) {
            console.warn("SYSTEM_MODELS 不是有效的数组格式");
            return [];
        }

        // 返回客户端可见的信息（不包含敏感配置）
        return models.map((model) => ({
            id: model.id,
            label: model.label || model.id,
            description: model.description,
            isStreaming: model.isStreaming ?? true,
        })).filter((model) => model.id && model.id.trim().length > 0);
    } catch (error) {
        console.error("解析 SYSTEM_MODELS 失败:", error);
        return [];
    }
}

/**
 * 从 LLM API 动态获取可用模型列表
 * 大多数 LLM 提供商支持 OpenAI 兼容的 /models 端点
 * @returns {Promise<SystemModelInfo[]>}
 */
export async function fetchAvailableModels() {
    if (!hasSystemModelCredentials()) {
        return [];
    }

    const baseUrl = process.env.SYSTEM_LLM_BASE_URL?.trim().replace(/\/$/, '');
    const apiKey = process.env.SYSTEM_LLM_API_KEY?.trim();

    try {
        // 调用 OpenAI 兼容的 /models 端点
        const response = await fetch(`${baseUrl}/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`获取模型列表失败: HTTP ${response.status}`);
            return [];
        }

        const data = await response.json();
        
        // 解析返回的模型列表
        // OpenAI 格式: { data: [{ id: "gpt-4", ... }, ...] }
        const models = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        
        // 过滤和转换模型信息
        return models
            .filter((model) => {
                // 过滤掉非聊天模型（如 embedding、whisper 等）
                const id = model.id?.toLowerCase() || '';
                const excludePatterns = ['embedding', 'whisper', 'tts', 'dall-e', 'moderation'];
                return !excludePatterns.some(pattern => id.includes(pattern));
            })
            .map((model) => ({
                id: model.id,
                label: model.id,
                description: model.description || undefined,
                isStreaming: true,
            }))
            .filter((model) => model.id && model.id.trim().length > 0);
    } catch (error) {
        console.error("从 API 获取模型列表失败:", error);
        return [];
    }
}

/**
 * 获取系统模型列表（客户端可见的信息，不包含 API Key）
 * 优先使用环境变量中的静态配置，如果没有则返回空数组
 * 动态获取使用 fetchAvailableModels()
 * @returns {SystemModelInfo[]}
 */
export function getSystemModelList() {
    if (!isSystemModelsEnabled()) {
        return [];
    }

    return getStaticSystemModelList();
}

/**
 * 获取系统模型的完整配置（仅服务端使用）
 * 支持静态配置和动态获取的模型
 * @param {string} modelId - 模型 ID
 * @returns {SystemModelConfig | null}
 */
export function getSystemModelConfig(modelId) {
    if (!isSystemModelsEnabled()) {
        return null;
    }

    const baseUrl = process.env.SYSTEM_LLM_BASE_URL;
    const apiKey = process.env.SYSTEM_LLM_API_KEY;

    if (!baseUrl || !apiKey) {
        console.error("系统模型配置不完整：缺少 SYSTEM_LLM_BASE_URL 或 SYSTEM_LLM_API_KEY");
        return null;
    }

    // 首先在静态配置中查找
    const staticModels = getStaticSystemModelList();
    const modelInfo = staticModels.find((m) => m.id === modelId);

    if (modelInfo) {
        return {
            ...modelInfo,
            baseUrl: baseUrl.trim().replace(/\/$/, ''),
            apiKey: apiKey.trim(),
        };
    }

    // 如果静态配置为空，说明使用动态获取模式
    // 直接返回配置，让 LLM API 验证模型是否有效
    if (staticModels.length === 0) {
        console.log(`使用动态模型: ${modelId}`);
        return {
            id: modelId,
            label: modelId,
            isStreaming: true,
            baseUrl: baseUrl.trim().replace(/\/$/, ''),
            apiKey: apiKey.trim(),
        };
    }

    console.error(`系统模型未找到: ${modelId}`);
    return null;
}

/**
 * 解析系统模型为可调用的模型客户端
 * @param {string} modelId - 模型 ID
 * @returns {Object | null} 解析后的模型配置
 */
export function resolveSystemModel(modelId) {
    const config = getSystemModelConfig(modelId);
    
    if (!config) {
        return null;
    }

    const client = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
    });

    return {
        id: config.id,
        label: config.label,
        description: config.description,
        provider: "system",
        slug: config.id,
        model: client.chat(config.id),
        isStreaming: config.isStreaming ?? true,
    };
}

/**
 * 检查指定的模型 ID 是否为系统模型
 * 注意：对于动态获取的模型列表，这个函数会先检查静态配置
 * @param {string} modelId - 模型 ID
 * @returns {boolean}
 */
export function isSystemModel(modelId) {
    if (!isSystemModelsEnabled()) {
        return false;
    }
    
    // 首先检查静态配置
    const staticModels = getStaticSystemModelList();
    if (staticModels.some((m) => m.id === modelId)) {
        return true;
    }
    
    // 如果静态配置为空，说明可能使用动态获取模式
    // 在这种情况下，只要系统模型功能启用且配置完整，就认为是有效的系统模型
    // 实际验证会在 resolveSystemModel 中进行
    if (staticModels.length === 0 && hasSystemModelCredentials()) {
        return true;
    }
    
    return false;
}

/**
 * 异步检查指定的模型 ID 是否为可用的系统模型
 * 会实际调用 API 验证模型是否存在
 * @param {string} modelId - 模型 ID
 * @returns {Promise<boolean>}
 */
export async function isValidSystemModel(modelId) {
    if (!isSystemModelsEnabled()) {
        return false;
    }
    
    // 首先检查静态配置
    const staticModels = getStaticSystemModelList();
    if (staticModels.some((m) => m.id === modelId)) {
        return true;
    }
    
    // 如果静态配置为空，动态获取模型列表进行验证
    if (staticModels.length === 0) {
        const dynamicModels = await fetchAvailableModels();
        return dynamicModels.some((m) => m.id === modelId);
    }
    
    return false;
}

