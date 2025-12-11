// -*- coding: utf-8 -*-
/**
 * POST /api/template-match
 * 智能模板匹配接口
 * 
 * 功能：分析用户输入，智能匹配最合适的模板，并生成规范化的提示词
 * 
 * 请求体：
 * - userInput: 用户输入的原始内容（必需）
 * - currentXml: 当前画布的 XML（可选）
 * - modelRuntime: 模型运行时配置（可选）
 * 
 * 返回：
 * - formattedPrompt: 格式化后的提示词
 * - templateId: 匹配到的模板 ID
 * - brief: 应用的 Brief 配置
 * - confidence: 匹配置信度 (0-1)
 * - reason: 匹配原因说明
 */

import { executeTemplateMatchingWorkflow } from "@/llm/agents/workflow";
import { resolveChatModel } from "@/lib/server-models";
import { resolveSystemModel, isSystemModelsEnabled } from "@/lib/system-models";

// Next.js Route Handler 的最长执行时间（秒）
export const maxDuration = 60;

/**
 * POST /api/template-match
 * 智能模板匹配接口
 */
export async function POST(req) {
  try {
    const { userInput, currentXml, modelRuntime } = await req.json();
    
    // 验证必需参数
    if (!userInput || typeof userInput !== "string" || !userInput.trim()) {
      return Response.json(
        { error: "userInput 不能为空" },
        { status: 400 }
      );
    }
    
    // 解析模型配置（如果提供）
    let resolvedModelRuntime = null;
    if (modelRuntime) {
      try {
        // 检查是否提供了自定义 API 配置
        if (modelRuntime.customApiUrl && modelRuntime.customApiKey) {
          // 使用自定义 API
          resolvedModelRuntime = {
            customApiUrl: modelRuntime.customApiUrl,
            customApiKey: modelRuntime.customApiKey,
            customModel: modelRuntime.customModel || "gpt-4o-mini",
          };
        } else if (modelRuntime.useSystemModel && modelRuntime.systemModelId) {
          // 系统模型
          const systemModel = resolveSystemModel(modelRuntime.systemModelId);
          if (systemModel) {
            resolvedModelRuntime = {
              baseUrl: process.env.SYSTEM_LLM_BASE_URL,
              apiKey: process.env.SYSTEM_LLM_API_KEY,
              modelId: modelRuntime.systemModelId,
            };
          }
        } else if (modelRuntime.modelRuntime) {
          // 自定义模型（通过 resolveChatModel）
          const resolved = resolveChatModel(modelRuntime.modelRuntime);
          resolvedModelRuntime = {
            baseUrl: modelRuntime.modelRuntime.baseUrl,
            apiKey: modelRuntime.modelRuntime.apiKey,
            modelId: modelRuntime.modelRuntime.modelId,
          };
        }
      } catch (error) {
        console.warn("模型配置解析失败，将使用系统模型:", error);
      }
    }
    
    // 如果没有提供模型配置，尝试使用系统模型
    if (!resolvedModelRuntime && isSystemModelsEnabled()) {
      const systemModel = resolveSystemModel("gpt-4o-mini");
      if (systemModel) {
        resolvedModelRuntime = {
          baseUrl: process.env.SYSTEM_LLM_BASE_URL,
          apiKey: process.env.SYSTEM_LLM_API_KEY,
          modelId: "gpt-4o-mini",
        };
      }
    }
    
    // 执行工作流
    const result = await executeTemplateMatchingWorkflow({
      userInput: userInput.trim(),
      currentXml: currentXml || null,
      modelRuntime: resolvedModelRuntime,
    });
    
    // 打印匹配结果到控制台
    if (result.templateId) {
      const { getTemplateById } = await import("@/llm/utils/template-loader");
      const template = getTemplateById(result.templateId);
      const templateName = template ? template.title : result.templateId;
      console.log(`[模板匹配] 匹配到模板: ${templateName} (ID: ${result.templateId})`);
      console.log(`[模板匹配] 置信度: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`[模板匹配] 匹配原因: ${result.reason}`);
      if (result.confidence < 0.8) {
        console.log(`[模板匹配] ⚠️  置信度低于阈值 0.8，将不使用模板`);
      }
    } else {
      console.log(`[模板匹配] 未匹配到模板，使用原始输入`);
    }
    
    return Response.json(result);
  } catch (error) {
    console.error("模板匹配接口错误:", error);
    const errorMessage = error instanceof Error ? error.message : "内部服务器错误";
    
    return Response.json(
      {
        error: "模板匹配失败",
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error instanceof Error ? error.stack : undefined 
        }),
      },
      { status: 500 }
    );
  }
}


