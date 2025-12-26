// -*- coding: utf-8 -*-
/**
 * The Architect Agent
 * 将用户输入和Mermaid转换为VISUAL SCHEMA
 */

import { generateText } from "ai";
import { resolveChatModel } from "@/lib/server-models";
import { resolveSystemModel, isSystemModelsEnabled } from "@/lib/system-models";
import { ARCHITECT_SYSTEM_MESSAGE } from "@/lib/prompts";

/**
 * 调用自定义 AI API
 * 
 * @param {Object} config
 * @param {string} config.url - API URL
 * @param {string} config.apiKey - API Key
 * @param {string} config.model - 模型名称
 * @param {string} config.systemPrompt - 系统提示词
 * @param {string} config.userPrompt - 用户提示词
 * @param {AbortSignal} [config.abortSignal] - 取消信号，用于取消请求
 * @returns {Promise<string>} API 返回的文本
 */
async function callCustomApi({ url, apiKey, model, systemPrompt, userPrompt, abortSignal }) {
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
      temperature: 0.1, // 使用较低温度确保结果稳定
    }),
    signal: abortSignal,
  });
  
  if (!response.ok) {
    throw new Error(`API 调用失败: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  } else if (data.content) {
    return data.content;
  } else if (data.text) {
    return data.text;
  } else if (typeof data === "string") {
    return data;
  } else {
    throw new Error("无法解析 API 响应格式");
  }
}

/**
 * 从Architect输出中提取VISUAL SCHEMA
 * 
 * @param {string} architectOutput - Architect的原始输出
 * @returns {string} VISUAL SCHEMA内容（---BEGIN PROMPT--- 到 ---END PROMPT--- 之间的内容）
 */
export function extractVisualSchema(architectOutput) {
  const beginMarker = '---BEGIN PROMPT---';
  const endMarker = '---END PROMPT---';
  const beginIndex = architectOutput.indexOf(beginMarker);
  const endIndex = architectOutput.indexOf(endMarker);
  
  if (beginIndex === -1 || endIndex === -1) {
    throw new Error('VISUAL SCHEMA markers not found');
  }
  
  return architectOutput.substring(
    beginIndex + beginMarker.length,
    endIndex
  ).trim();
}

/**
 * 获取Architect模型配置
 * 优先使用环境变量配置，否则使用传入的模型配置
 * 
 * @param {Object} [defaultModelRuntime] - 默认模型配置
 * @returns {Object|null} 解析后的模型配置
 */
function getArchitectModelConfig(defaultModelRuntime) {
  // 优先使用环境变量配置
  const architectModelId = process.env.ARCHITECT_MODEL_ID;
  const architectBaseUrl = process.env.ARCHITECT_MODEL_BASE_URL;
  const architectApiKey = process.env.ARCHITECT_MODEL_API_KEY;
  
  if (architectModelId && architectBaseUrl && architectApiKey) {
    try {
      return resolveChatModel({
        modelId: architectModelId,
        baseUrl: architectBaseUrl,
        apiKey: architectApiKey,
        label: `Architect (${architectModelId})`,
      });
    } catch (error) {
      console.warn("[Architect] 环境变量模型配置解析失败:", error);
    }
  }
  
  // 回退到默认模型配置
  if (defaultModelRuntime) {
    try {
      if (defaultModelRuntime.useSystemModel && defaultModelRuntime.systemModelId) {
        const systemModel = resolveSystemModel(defaultModelRuntime.systemModelId);
        if (systemModel) {
          return systemModel;
        }
      } else if (defaultModelRuntime.modelRuntime) {
        return resolveChatModel(defaultModelRuntime.modelRuntime);
      } else if (defaultModelRuntime.baseUrl && defaultModelRuntime.apiKey && defaultModelRuntime.modelId) {
        return resolveChatModel(defaultModelRuntime);
      }
    } catch (error) {
      console.warn("[Architect] 默认模型配置解析失败:", error);
    }
  }
  
  // 最后尝试使用系统模型
  if (isSystemModelsEnabled()) {
    const systemModel = resolveSystemModel("gpt-4o-mini");
    if (systemModel) {
      return systemModel;
    }
  }
  
  return null;
}

/**
 * The Architect Agent - 生成VISUAL SCHEMA
 * 
 * @param {Object} params
 * @param {string} params.formattedPrompt - 格式化后的用户提示词
 * @param {string} [params.mermaid] - Mermaid图表代码（可选）
 * @param {Object} [params.modelRuntime] - 模型运行时配置（可选）
 * @param {AbortSignal} [params.abortSignal] - 取消信号，用于取消请求
 * @returns {Promise<{visualSchema: string, rawOutput: string}>}
 */
export async function generateVisualSchema({ 
  formattedPrompt, 
  mermaid, 
  modelRuntime,
  abortSignal
}) {
  try {
    // 构建用户提示词
    let userPrompt = formattedPrompt;
    
    if (mermaid && mermaid.trim()) {
      userPrompt = `${formattedPrompt}

## Mermaid 图表参考
以下Mermaid图表可以帮助理解逻辑结构：

\`\`\`mermaid
${mermaid}
\`\`\`

请结合上述Mermaid图表和用户输入，生成VISUAL SCHEMA。`;
    }
    
    // 获取模型配置
    const resolvedModel = getArchitectModelConfig(modelRuntime);
    
    if (!resolvedModel) {
      throw new Error("无法获取Architect模型配置");
    }
    
    let responseText;
    
    // 检查是否使用自定义API（通过模型配置）
    if (modelRuntime?.customApiUrl && modelRuntime?.customApiKey) {
      try {
        console.log("[Architect] 🔄 使用自定义 AI API 生成VISUAL SCHEMA...");
        responseText = await callCustomApi({
          url: modelRuntime.customApiUrl,
          apiKey: modelRuntime.customApiKey,
          model: modelRuntime.customModel || "gpt-4o-mini",
          systemPrompt: ARCHITECT_SYSTEM_MESSAGE,
          userPrompt: userPrompt,
          abortSignal,
        });
        console.log("[Architect] ✅ 自定义 AI API 调用成功");
      } catch (error) {
        if (error.name === 'AbortError' || abortSignal?.aborted) {
          throw error;
        }
        console.error("[Architect] ❌ 自定义 API 调用失败:", error);
        throw error;
      }
    } else {
      try {
        console.log("[Architect] 🔄 使用 AI SDK 生成VISUAL SCHEMA...");
        const response = await generateText({
          model: resolvedModel.model,
          system: ARCHITECT_SYSTEM_MESSAGE,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0.1, // 使用较低温度确保结果稳定
          abortSignal,
        });
        responseText = response.text;
        console.log("[Architect] ✅ AI SDK 调用成功");
      } catch (error) {
        if (error.name === 'AbortError' || abortSignal?.aborted) {
          throw error;
        }
        console.error("[Architect] ❌ AI SDK 调用失败:", error);
        throw error;
      }
    }
    
    // 提取VISUAL SCHEMA
    let visualSchema;
    try {
      visualSchema = extractVisualSchema(responseText);
      console.log("[Architect] ✅ VISUAL SCHEMA 提取成功");
    } catch (error) {
      console.error("[Architect] ❌ VISUAL SCHEMA 提取失败:", error);
      // 如果提取失败，使用整个输出作为降级方案
      visualSchema = responseText;
    }
    
    return {
      visualSchema,
      rawOutput: responseText,
    };
  } catch (error) {
    console.error("Architect生成失败:", error);
    throw error;
  }
}

