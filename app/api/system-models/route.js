// -*- coding: utf-8 -*-
// 系统模型 API 路由
// 返回系统可用模型列表（不包含敏感信息如 API Key）

import { 
    getSystemModelList, 
    getStaticSystemModelList,
    fetchAvailableModels,
    isSystemModelsEnabled,
    hasSystemModelCredentials
} from "@/lib/system-models";

/**
 * GET /api/system-models
 * 获取系统内置模型列表
 * 
 * 此接口返回系统预配置的模型列表，用户可以直接使用这些模型而无需配置自己的 API Key。
 * 返回的数据不包含任何敏感信息（API Key 等），敏感配置仅存储在服务端环境变量中。
 * 
 * 支持两种模式：
 * 1. 静态配置：如果配置了 SYSTEM_MODELS 环境变量，返回静态配置的模型列表
 * 2. 动态获取：如果没有配置 SYSTEM_MODELS，自动从 LLM API 获取可用模型列表
 * 
 * @returns {Promise<Response>} 返回系统模型列表的 JSON 响应
 */
export async function GET() {
    try {
        // 检查系统模型功能是否启用（包括检查必需的配置）
        const enabled = isSystemModelsEnabled();
        
        if (!enabled) {
            // 区分不同的禁用原因
            const hasCredentials = hasSystemModelCredentials();
            const enableFlag = process.env.ENABLE_SYSTEM_MODELS === 'true' || process.env.ENABLE_SYSTEM_MODELS === '1';
            
            let message = "系统内置模型功能未启用";
            if (enableFlag && !hasCredentials) {
                message = "系统模型配置不完整：请配置 SYSTEM_LLM_BASE_URL 和 SYSTEM_LLM_API_KEY";
            }
            
            return Response.json({
                enabled: false,
                models: [],
                message,
            });
        }

        // 首先尝试获取静态配置的模型列表
        let models = getStaticSystemModelList();
        let source = "static";
        
        // 如果没有静态配置，尝试动态获取
        if (models.length === 0) {
            console.log("未配置 SYSTEM_MODELS，尝试从 LLM API 动态获取模型列表...");
            models = await fetchAvailableModels();
            source = "dynamic";
            
            if (models.length > 0) {
                console.log(`从 LLM API 获取到 ${models.length} 个可用模型`);
            }
        }

        return Response.json({
            enabled: true,
            models: models,
            source: source,
            message: models.length > 0 
                ? `发现 ${models.length} 个系统内置模型（${source === 'dynamic' ? '自动获取' : '静态配置'}）`
                : "系统模型已启用，但未找到可用模型。请检查 LLM API 配置或手动配置 SYSTEM_MODELS。",
        });
    } catch (error) {
        console.error("获取系统模型列表失败:", error);
        
        return Response.json(
            {
                enabled: false,
                models: [],
                error: "获取系统模型列表失败",
                message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

