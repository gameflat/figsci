// -*- coding: utf-8 -*-
/**
 * AI Agents 工作流
 * 编排模板匹配和提示词格式化流程
 */

import { matchTemplate } from "./template-matcher";
import { formatPromptWithTemplate } from "./prompt-formatter";

/**
 * 执行智能模板匹配工作流
 * 
 * 工作流步骤：
 * 1. 模板匹配：分析用户输入，智能匹配最合适的模板
 * 2. 提示词格式化：将用户输入按照模板格式生成规范的提示词
 * 
 * @param {Object} params
 * @param {string} params.userInput - 用户输入的原始内容
 * @param {string} [params.currentXml] - 当前画布的 XML
 * @param {Object} [params.modelRuntime] - 模型运行时配置
 * @returns {Promise<{formattedPrompt: string, templateId: string, brief: Object, confidence: number, reason: string}>}
 */
export async function executeTemplateMatchingWorkflow({ 
  userInput, 
  currentXml, 
  modelRuntime 
}) {
  try {
    // 步骤 1: 模板匹配
    const matchResult = await matchTemplate({
      userInput,
      currentXml,
      modelRuntime,
    });
    
    if (!matchResult.templateId) {
      throw new Error("模板匹配失败，未找到合适的模板");
    }
    
    const confidence = matchResult.confidence || 0.5;
    const CONFIDENCE_THRESHOLD = 0.8; // 置信度阈值
    
    // 如果置信度低于阈值，不使用模板，直接返回原始输入
    if (confidence < CONFIDENCE_THRESHOLD) {
      return {
        formattedPrompt: userInput, // 使用原始输入
        templateId: null, // 不应用模板
        brief: {}, // 不应用 Brief 配置
        confidence: confidence,
        reason: `置信度 ${(confidence * 100).toFixed(1)}% 低于阈值 ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}%，不使用模板`,
      };
    }
    
    // 步骤 2: 提示词格式化（仅在置信度足够高时执行）
    const formatResult = await formatPromptWithTemplate({
      userInput,
      templateId: matchResult.templateId,
      currentXml,
      modelRuntime,
    });
    
    // 返回完整结果
    return {
      formattedPrompt: formatResult.formattedPrompt || userInput,
      templateId: matchResult.templateId,
      brief: formatResult.appliedBrief || {},
      confidence: confidence,
      reason: matchResult.reason || "智能匹配",
    };
  } catch (error) {
    console.error("工作流执行失败:", error);
    throw error;
  }
}

