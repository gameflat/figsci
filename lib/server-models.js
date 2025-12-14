import { createOpenAI } from "@ai-sdk/openai";

/**
 * @typedef {import("@/types/model-config.d.ts").RuntimeModelConfig} RuntimeModelConfig
 */

/**
 * @typedef {import("@/lib/model-constants").ModelProvider} ModelProvider
 */

/**
 * @typedef {Object} ResolvedModel
 * @property {string} id
 * @property {string} label
 * @property {string} [description]
 * @property {ModelProvider} provider
 * @property {string} slug
 * @property {ReturnType<ReturnType<typeof createOpenAI>["chat"]>} model
 */

const deriveProvider = (baseUrl) => {
    try {
        const hostname = new URL(baseUrl).hostname;
        if (hostname.includes("googleapis")) {
            return "google";
        }
        if (hostname.includes("openrouter")) {
            return "openrouter";
        }
        if (hostname.includes("openai")) {
            return "openai";
        }
    } catch {
        // ignore parse error
    }
    return "custom";
};

/**
 * 根据运行时配置构造可用的聊天模型客户端。
 * @param {RuntimeModelConfig} [runtime]
 * @returns {ResolvedModel}
 */
export function resolveChatModel(runtime) {
    if (
        !runtime ||
        !runtime.modelId ||
        !runtime.baseUrl ||
        !runtime.apiKey
    ) {
        throw new Error("模型配置缺失，请先在客户端完成接口配置。");
    }

    const normalizedBaseUrl = runtime.baseUrl.trim().replace(/\/$/, "");

    const client = createOpenAI({
        apiKey: runtime.apiKey,
        baseURL: normalizedBaseUrl,
    });

    const provider = deriveProvider(runtime.baseUrl);
    const label = runtime.label || runtime.modelId;

    return {
        id: runtime.modelId,
        label,
        description: undefined,
        provider,
        slug: runtime.modelId,
        model: client.chat(runtime.modelId),
        supportsToolCalls: runtime.supportsToolCalls ?? true, // 默认支持工具调用
    };
}
