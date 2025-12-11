// -*- coding: utf-8 -*-
/**
 * 模板匹配 Agent
 * 支持使用 AI SDK 或自定义 AI API 实现智能模板匹配
 */

import { generateText } from "ai";
import { z } from "zod";
import { getAllTemplatesForMatching, buildTemplateContext } from "../utils/template-loader";
import { resolveChatModel } from "@/lib/server-models";
import { resolveSystemModel, isSystemModelsEnabled } from "@/lib/system-models";

/**
 * 模板匹配结果 Schema
 */
const TemplateMatchSchema = z.object({
  templateId: z.string().describe("匹配到的模板 ID"),
  confidence: z.number().min(0).max(1).describe("匹配置信度，0-1 之间的数值"),
  reason: z.string().describe("匹配原因说明，解释为什么选择这个模板"),
});

/**
 * 模板匹配 Agent
 * 
 * 分析用户输入，智能匹配最合适的模板
 * 
 * @param {Object} params
 * @param {string} params.userInput - 用户输入的原始内容
 * @param {string} [params.currentXml] - 当前画布的 XML（可选）
 * @param {Object} [params.modelRuntime] - 模型运行时配置（可选，用于调用 LLM）
 * @returns {Promise<{templateId: string, confidence: number, reason: string}>}
 */
export async function matchTemplate({ userInput, currentXml, modelRuntime }) {
  try {
    // 获取所有可用模板
    const templates = getAllTemplatesForMatching();
    
    // 如果模板列表为空，返回默认模板
    if (templates.length === 0) {
      return {
        templateId: "graphical-abstract-template",
        confidence: 0.5,
        reason: "未找到可用模板，使用默认模板",
      };
    }
    
    // 构建模板上下文信息
    const templatesContext = templates.map(template => ({
      id: template.id,
      title: template.title,
      context: buildTemplateContext(template),
    }));
    
    // 构建匹配提示词
    const matchingPrompt = `你是一个专业的图表模板匹配专家。请分析用户的输入内容，从以下模板列表中选择最合适的模板。

## 用户输入
${userInput}

${currentXml ? `## 当前画布状态
当前画布已有内容，用户可能想要修改或扩展现有图表。\n` : ""}

## 可用模板列表
${templatesContext.map((t, index) => `
【模板 ${index + 1}】
模板ID: ${t.id}
${t.context}
`).join("\n")}

## 匹配要求
1. 仔细分析用户输入的内容和意图
2. 考虑用户可能想要创建的图表类型（流程图、时序图、架构图、思维导图等）
3. 匹配模板的适用场景、标签和功能特性
4. 如果用户输入不够明确，选择最通用的模板
5. **重要：必须返回模板的实际 ID（如 "technical-roadmap"），而不是序号（如 "模板 2"）**
6. 返回 JSON 格式：{"templateId": "模板的实际ID（必须是上面列表中的ID）", "confidence": 0.0-1.0, "reason": "匹配原因"}

请返回匹配结果（必须使用模板的实际ID）：`;

    // 解析模型配置
    let model;
    let useCustomApi = false;
    let customApiConfig = null;
    
    if (modelRuntime) {
      // 检查是否提供了自定义 API 配置
      if (modelRuntime.customApiUrl && modelRuntime.customApiKey) {
        useCustomApi = true;
        customApiConfig = {
          url: modelRuntime.customApiUrl,
          apiKey: modelRuntime.customApiKey,
          model: modelRuntime.customModel || "gpt-4o-mini",
        };
      } else {
        const resolved = resolveChatModel(modelRuntime);
        model = resolved.model;
      }
    } else if (isSystemModelsEnabled()) {
      // 使用系统模型作为后备
      const systemModel = resolveSystemModel("gpt-4o-mini");
      if (systemModel) {
        model = systemModel.model;
      }
    }
    
    if (!model && !useCustomApi) {
      // 如果没有可用模型，使用简单的关键词匹配
      console.log("[模板匹配] ⚠️  没有可用的 AI 模型，降级到关键词匹配");
      return fallbackTemplateMatching(userInput, templates);
    }
    
    const systemPrompt = "你是一个专业的图表模板匹配专家。请仔细分析用户输入，返回 JSON 格式的匹配结果。";
    
    let responseText;
    let aiCallSuccess = false;
    
    if (useCustomApi) {
      // 使用自定义 API
      try {
        console.log("[模板匹配] 🔄 使用自定义 AI API 进行匹配...");
        responseText = await callCustomApi({
          url: customApiConfig.url,
          apiKey: customApiConfig.apiKey,
          model: customApiConfig.model,
          systemPrompt,
          userPrompt: matchingPrompt,
        });
        aiCallSuccess = true;
        console.log("[模板匹配] ✅ 自定义 AI API 调用成功");
      } catch (error) {
        console.error("[模板匹配] ❌ 自定义 API 调用失败:", error);
        console.log("[模板匹配] ⚠️  降级到关键词匹配");
        return fallbackTemplateMatching(userInput, templates);
      }
    } else {
      // 使用 AI SDK 调用 LLM
      try {
        console.log("[模板匹配] 🔄 使用 AI SDK 进行匹配...");
        const response = await generateText({
          model: model,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: matchingPrompt,
            },
          ],
          temperature: 0.3, // 使用较低温度确保结果稳定
        });
        responseText = response.text;
        aiCallSuccess = true;
        console.log("[模板匹配] ✅ AI SDK 调用成功");
        console.log("[模板匹配] 📝 AI 返回内容:", responseText.substring(0, 200) + "...");
      } catch (error) {
        console.error("[模板匹配] ❌ AI SDK 调用失败:", error);
        console.log("[模板匹配] ⚠️  降级到关键词匹配");
        return fallbackTemplateMatching(userInput, templates);
      }
    }
    
    // 解析 JSON 结果
    let result;
    try {
      // 尝试从代码块中提取 JSON
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/i) || 
                       responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      result = JSON.parse(jsonString);
      console.log("[模板匹配] ✅ JSON 解析成功:", JSON.stringify(result));
    } catch (parseError) {
      console.error("[模板匹配] ❌ JSON 解析失败:", parseError);
      console.error("[模板匹配] 📝 原始响应内容:", responseText);
      console.log("[模板匹配] ⚠️  降级到关键词匹配");
      return fallbackTemplateMatching(userInput, templates);
    }
    
    // 验证结果
    if (!result.templateId) {
      console.warn("[模板匹配] ⚠️  AI 未返回模板 ID");
      console.log("[模板匹配] ⚠️  降级到关键词匹配");
      return fallbackTemplateMatching(userInput, templates);
    }
    
    // 尝试将序号转换为实际 ID（兼容处理）
    let actualTemplateId = result.templateId;
    if (result.templateId.startsWith("模板 ") || result.templateId.match(/^模板\d+$/)) {
      // 如果返回的是序号格式，尝试转换
      const indexMatch = result.templateId.match(/\d+/);
      if (indexMatch) {
        const index = parseInt(indexMatch[0]) - 1; // 转换为 0-based 索引
        if (index >= 0 && index < templates.length) {
          actualTemplateId = templates[index].id;
          console.log(`[模板匹配] 🔄 将序号 "${result.templateId}" 转换为实际 ID: "${actualTemplateId}"`);
        }
      }
    }
    
    // 验证转换后的 ID 是否有效
    const matchedTemplate = templates.find(t => t.id === actualTemplateId);
    if (!matchedTemplate) {
      console.warn("[模板匹配] ⚠️  AI 返回的模板 ID 无效:", result.templateId, "转换后:", actualTemplateId);
      console.log("[模板匹配] 📋 可用模板 ID 列表:", templates.slice(0, 5).map(t => t.id).join(", "), "...");
      console.log("[模板匹配] ⚠️  降级到关键词匹配");
      return fallbackTemplateMatching(userInput, templates);
    }
    
    // 使用转换后的实际 ID
    actualTemplateId = matchedTemplate.id;
    
    // AI 匹配成功
    console.log("[模板匹配] ✅ AI 匹配成功，模板 ID:", actualTemplateId, "置信度:", result.confidence);
    return {
      templateId: actualTemplateId,
      confidence: result.confidence || 0.7,
      reason: result.reason || "基于内容分析匹配",
    };
  } catch (error) {
    console.error("模板匹配失败:", error);
    // 降级到简单匹配
    const templates = getAllTemplatesForMatching();
    return fallbackTemplateMatching(userInput, templates);
  }
}

/**
 * 调用自定义 AI API
 * 
 * @param {Object} config
 * @param {string} config.url - API URL
 * @param {string} config.apiKey - API Key
 * @param {string} config.model - 模型名称
 * @param {string} config.systemPrompt - 系统提示词
 * @param {string} config.userPrompt - 用户提示词
 * @returns {Promise<string>} API 返回的文本
 */
async function callCustomApi({ url, apiKey, model, systemPrompt, userPrompt }) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.3,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API 调用失败: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // 支持不同的响应格式
  if (data.choices && data.choices[0] && data.choices[0].message) {
    // OpenAI 格式
    return data.choices[0].message.content;
  } else if (data.content) {
    // 直接 content 字段
    return data.content;
  } else if (data.text) {
    // text 字段
    return data.text;
  } else if (typeof data === "string") {
    // 直接是字符串
    return data;
  } else {
    throw new Error("无法解析 API 响应格式");
  }
}

/**
 * 降级匹配策略（当 LLM 不可用时使用）
 * 
 * @param {string} userInput - 用户输入
 * @param {Array} templates - 模板列表
 * @returns {Object} 匹配结果
 */
function fallbackTemplateMatching(userInput, templates) {
  console.log("[模板匹配] 🔄 执行关键词匹配降级策略...");
  const inputLower = userInput.toLowerCase();
  
  // 关键词匹配规则
  const keywordRules = [
    { keywords: ["思维导图", "mind map", "头脑风暴"], templateId: "mind-map-concept" },
    { keywords: ["流程图", "flow", "流程"], templateId: "process-flow-template" },
    { keywords: ["时序图", "sequence", "时序"], templateId: "sequence-diagram-template" },
    { keywords: ["架构图", "architecture", "架构"], templateId: "architecture-diagram-template" },
    { keywords: ["路线图", "roadmap", "规划"], templateId: "technical-roadmap" },
    { keywords: ["实验", "experiment", "方法"], templateId: "experimental-process-flow" },
    { keywords: ["进度表", "甘特图", "gantt", "进度管理", "项目进度", "开发进度", "schedule"], templateId: "gantt-schedule-chart" },
  ];
  
  // 查找匹配的关键词
  for (const rule of keywordRules) {
    if (rule.keywords.some(keyword => inputLower.includes(keyword))) {
      const template = templates.find(t => t.id === rule.templateId);
      if (template) {
        // 如果关键词匹配，给予更高的置信度（0.85），确保能通过阈值
        // 因为关键词匹配通常意味着明确的意图
        const matchedKeyword = rule.keywords.find(k => inputLower.includes(k.toLowerCase()));
        console.log(`[模板匹配] ✅ 关键词匹配成功: "${matchedKeyword}" -> 模板 "${template.title}"`);
        return {
          templateId: rule.templateId,
          confidence: 0.85,
          reason: `基于关键词"${matchedKeyword}"匹配`,
        };
      }
    }
  }
  
  // 默认返回最热门的模板
  const popularTemplate = templates.find(t => t.isPopular) || templates[0];
  return {
    templateId: popularTemplate.id,
    confidence: 0.5,
    reason: "使用默认热门模板",
  };
}

