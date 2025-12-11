// -*- coding: utf-8 -*-
/**
 * 提示词格式化 Agent
 * 使用 AI SDK 将用户输入按照模板格式生成规范的提示词
 */

import { generateText } from "ai";
import { z } from "zod";
import { getTemplateById } from "../utils/template-loader";
import { resolveChatModel } from "@/lib/server-models";
import { resolveSystemModel, isSystemModelsEnabled } from "@/lib/system-models";

/**
 * 调用自定义 AI API（与 template-matcher.js 中的实现保持一致）
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
 * 格式化结果 Schema
 */
const FormattedPromptSchema = z.object({
  formattedPrompt: z.string().describe("格式化后的完整提示词"),
  appliedBrief: z.object({
    intent: z.string().optional(),
    tone: z.string().optional(),
    focus: z.array(z.string()).optional(),
    diagramTypes: z.array(z.string()).optional(),
  }).optional().describe("应用的 Brief 配置"),
});

/**
 * 格式化用户输入为模板格式的提示词
 * 
 * @param {Object} params
 * @param {string} params.userInput - 用户输入的原始内容
 * @param {string} params.templateId - 选中的模板 ID
 * @param {string} [params.currentXml] - 当前画布的 XML（可选）
 * @param {Object} [params.modelRuntime] - 模型运行时配置（可选）
 * @returns {Promise<{formattedPrompt: string, appliedBrief: Object}>}
 */
export async function formatPromptWithTemplate({ 
  userInput, 
  templateId, 
  currentXml, 
  modelRuntime 
}) {
  try {
    // 获取模板信息
    const template = getTemplateById(templateId);
    if (!template) {
      // 如果模板不存在，直接返回用户输入
      return {
        formattedPrompt: userInput,
        appliedBrief: {},
      };
    }
    
    // 构建格式化提示词
    const formattingPrompt = `你是一个专业的提示词格式化专家。请将用户的输入内容按照模板格式进行规范化处理。

## 用户原始输入
${userInput}

${currentXml ? `## 当前画布状态
当前画布已有内容，用户可能想要修改或扩展现有图表。\n` : ""}

## 目标模板格式
模板标题: ${template.title}
模板描述: ${template.description}
模板提示词格式:
${template.prompt}

## 模板特性
${template.features ? `核心功能: ${template.features.join(", ")}\n` : ""}
${template.useCases ? `适用场景: ${template.useCases.join(", ")}\n` : ""}
${template.brief ? `Brief 配置: ${JSON.stringify(template.brief)}\n` : ""}

## 格式化要求
1. 保留用户输入的核心意图和关键信息
2. 按照模板的提示词格式进行结构化组织
3. 将用户的具体需求融入到模板的结构中
4. 保持模板的专业性和规范性
5. 如果用户输入已经比较规范，可以适当简化
6. 确保生成的提示词清晰、完整、可执行

请返回 JSON 格式：
{
  "formattedPrompt": "格式化后的完整提示词",
  "appliedBrief": {
    "intent": "模板的 intent 配置",
    "tone": "模板的 tone 配置",
    "focus": ["模板的 focus 配置"],
    "diagramTypes": ["模板的 diagramTypes 配置"]
  }
}`;

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
      } else if (modelRuntime.useSystemModel && modelRuntime.systemModelId) {
        // 系统模型
        const systemModel = resolveSystemModel(modelRuntime.systemModelId);
        if (systemModel) {
          model = systemModel.model;
        }
      } else if (modelRuntime.modelRuntime) {
        // 自定义模型（通过 resolveChatModel）
        try {
          const resolved = resolveChatModel(modelRuntime.modelRuntime);
          model = resolved.model;
        } catch (error) {
          console.warn("[提示词格式化] 模型配置解析失败:", error);
        }
      } else if (modelRuntime.baseUrl && modelRuntime.apiKey && modelRuntime.modelId) {
        // 直接传递的模型配置
        try {
          const resolved = resolveChatModel(modelRuntime);
          model = resolved.model;
        } catch (error) {
          console.warn("[提示词格式化] 模型配置解析失败:", error);
        }
      }
    }
    
    // 如果没有配置，尝试使用系统模型
    if (!model && !useCustomApi && isSystemModelsEnabled()) {
      const systemModel = resolveSystemModel("gpt-4o-mini");
      if (systemModel) {
        model = systemModel.model;
      }
    }
    
    if (!model && !useCustomApi) {
      // 如果没有可用模型，使用简单格式化
      console.log("[提示词格式化] ⚠️  没有可用的 AI 模型，使用简单格式化");
      return simpleFormatPrompt(userInput, template);
    }
    
    const systemPrompt = "你是一个专业的提示词格式化专家。请将用户输入按照模板格式进行规范化处理，返回 JSON 格式的结果。";
    
    let responseText;
    
    if (useCustomApi) {
      // 使用自定义 API
      try {
        console.log("[提示词格式化] 🔄 使用自定义 AI API 进行格式化...");
        responseText = await callCustomApi({
          url: customApiConfig.url,
          apiKey: customApiConfig.apiKey,
          model: customApiConfig.model,
          systemPrompt,
          userPrompt: formattingPrompt,
        });
        console.log("[提示词格式化] ✅ 自定义 AI API 调用成功");
      } catch (error) {
        console.error("[提示词格式化] ❌ 自定义 API 调用失败:", error);
        return simpleFormatPrompt(userInput, template);
      }
    } else {
      // 使用 AI SDK 调用 LLM
      try {
        console.log("[提示词格式化] 🔄 使用 AI SDK 进行格式化...");
        const response = await generateText({
          model: model,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: formattingPrompt,
            },
          ],
          temperature: 0.3, // 使用较低温度确保结果稳定
        });
        responseText = response.text;
        console.log("[提示词格式化] ✅ AI SDK 调用成功");
      } catch (error) {
        console.error("[提示词格式化] ❌ AI SDK 调用失败:", error);
        return simpleFormatPrompt(userInput, template);
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
      console.log("[提示词格式化] ✅ JSON 解析成功");
    } catch (parseError) {
      console.error("[提示词格式化] ❌ JSON 解析失败:", parseError);
      return simpleFormatPrompt(userInput, template);
    }
    
    return {
      formattedPrompt: result.formattedPrompt || userInput,
      appliedBrief: result.appliedBrief || template.brief || {},
    };
  } catch (error) {
    console.error("提示词格式化失败:", error);
    // 降级到简单格式化
    const template = getTemplateById(templateId);
    return simpleFormatPrompt(userInput, template);
  }
}

/**
 * 简单格式化策略（当 LLM 不可用时使用）
 * 
 * @param {string} userInput - 用户输入
 * @param {Object} template - 模板对象
 * @returns {Object} 格式化结果
 */
function simpleFormatPrompt(userInput, template) {
  if (!template) {
    return {
      formattedPrompt: userInput,
      appliedBrief: {},
    };
  }
  
  // 简单拼接：模板提示词 + 用户输入
  const formattedPrompt = `${template.prompt}\n\n用户具体需求：\n${userInput}`;
  
  return {
    formattedPrompt,
    appliedBrief: template.brief || {},
  };
}

