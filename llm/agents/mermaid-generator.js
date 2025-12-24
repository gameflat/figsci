// -*- coding: utf-8 -*-
/**
 * Mermaid 生成器 Agent
 * 根据用户输入生成 Mermaid 图表代码
 */

import { generateText } from "ai";
import { resolveChatModel } from "@/lib/server-models";
import { resolveSystemModel, isSystemModelsEnabled } from "@/lib/system-models";
import { MERMAID_GENERATOR_SYSTEM_MESSAGE } from "@/lib/prompts";

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
 * 根据用户输入生成 Mermaid 图表代码
 * 
 * @param {Object} params
 * @param {string} params.userInput - 用户输入的原始内容或格式化后的提示词
 * @param {Object} [params.modelRuntime] - 模型运行时配置（可选）
 * @returns {Promise<{mermaid: string}>}
 */
export async function generateMermaid({ 
  userInput, 
  modelRuntime 
}) {
  try {
    // 解析模型配置
    let model;
    let useCustomApi = false;
    let customApiConfig = null;
    
    if (modelRuntime) {
      console.log("[Mermaid生成] 🔍 解析模型配置:", {
        hasUseSystemModel: !!modelRuntime.useSystemModel,
        systemModelId: modelRuntime.systemModelId,
        hasBaseUrl: !!modelRuntime.baseUrl,
        hasApiKey: !!modelRuntime.apiKey,
        modelId: modelRuntime.modelId,
        hasModelRuntime: !!modelRuntime.modelRuntime
      });
      
      if (modelRuntime.customApiUrl && modelRuntime.customApiKey) {
        useCustomApi = true;
        customApiConfig = {
          url: modelRuntime.customApiUrl,
          apiKey: modelRuntime.customApiKey,
          model: modelRuntime.customModel || "gpt-4o-mini",
        };
      } else if (modelRuntime.useSystemModel && modelRuntime.systemModelId) {
        console.log("[Mermaid生成] 🔄 使用系统模型:", modelRuntime.systemModelId);
        const systemModel = resolveSystemModel(modelRuntime.systemModelId);
        if (systemModel) {
          model = systemModel.model;
          console.log("[Mermaid生成] ✅ 系统模型解析成功");
        } else {
          console.warn("[Mermaid生成] ⚠️  系统模型解析失败:", modelRuntime.systemModelId);
        }
      } else if (modelRuntime.systemModelId && !modelRuntime.useSystemModel) {
        // 处理特殊情况：有 systemModelId 但 useSystemModel 为 false
        // 可能是前端传递的配置格式问题，尝试将其作为系统模型解析
        console.log("[Mermaid生成] 🔄 检测到 systemModelId 但 useSystemModel 为 false，尝试解析为系统模型:", modelRuntime.systemModelId);
        const systemModel = resolveSystemModel(modelRuntime.systemModelId);
        if (systemModel) {
          model = systemModel.model;
          console.log("[Mermaid生成] ✅ 系统模型解析成功（自动修复）");
        } else {
          console.warn("[Mermaid生成] ⚠️  系统模型解析失败，尝试其他方式:", modelRuntime.systemModelId);
        }
      } else if (modelRuntime.modelRuntime) {
        try {
          console.log("[Mermaid生成] 🔄 解析嵌套 modelRuntime...");
          const resolved = resolveChatModel(modelRuntime.modelRuntime);
          model = resolved.model;
          console.log("[Mermaid生成] ✅ 嵌套 modelRuntime 解析成功");
        } catch (error) {
          console.warn("[Mermaid生成] ❌ 嵌套 modelRuntime 解析失败:", error);
        }
      } else if (modelRuntime.baseUrl && modelRuntime.apiKey && modelRuntime.modelId) {
        try {
          console.log("[Mermaid生成] 🔄 解析直接模型配置:", modelRuntime.modelId);
          const resolved = resolveChatModel(modelRuntime);
          model = resolved.model;
          console.log("[Mermaid生成] ✅ 直接模型配置解析成功");
        } catch (error) {
          console.warn("[Mermaid生成] ❌ 直接模型配置解析失败:", error);
        }
      } else {
        console.warn("[Mermaid生成] ⚠️  模型配置格式不完整:", modelRuntime);
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
      // 如果没有可用模型，返回空Mermaid（降级方案）
      console.log("[Mermaid生成] ⚠️  没有可用的 AI 模型，跳过Mermaid生成");
      return { mermaid: "" };
    }
    
    let responseText;
    
    if (useCustomApi) {
      try {
        console.log("[Mermaid生成] 🔄 使用自定义 AI API 生成Mermaid...");
        responseText = await callCustomApi({
          url: customApiConfig.url,
          apiKey: customApiConfig.apiKey,
          model: customApiConfig.model,
          systemPrompt: MERMAID_GENERATOR_SYSTEM_MESSAGE,
          userPrompt: userInput,
        });
        console.log("[Mermaid生成] ✅ 自定义 AI API 调用成功");
      } catch (error) {
        console.error("[Mermaid生成] ❌ 自定义 API 调用失败:", error);
        return { mermaid: "" };
      }
    } else {
      try {
        console.log("[Mermaid生成] 🔄 使用 AI SDK 生成Mermaid...");
        const response = await generateText({
          model: model,
          system: MERMAID_GENERATOR_SYSTEM_MESSAGE,
          messages: [
            {
              role: "user",
              content: userInput,
            },
          ],
          temperature: 0.3,
        });
        responseText = response.text;
        console.log("[Mermaid生成] ✅ AI SDK 调用成功");
      } catch (error) {
        console.error("[Mermaid生成] ❌ AI SDK 调用失败:", error);
        return { mermaid: "" };
      }
    }
    
    // 清理响应文本，提取Mermaid代码
    let mermaidCode = responseText.trim();
    
    // 移除可能的代码块标记
    mermaidCode = mermaidCode
      .replace(/```mermaid\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    // 验证是否是有效的Mermaid代码（简单检查）
    const mermaidKeywords = ['flowchart', 'graph', 'sequenceDiagram', 'classDiagram', 'gantt', 'stateDiagram'];
    const isValidMermaid = mermaidKeywords.some(keyword => mermaidCode.toLowerCase().includes(keyword.toLowerCase()));
    
    if (!isValidMermaid && mermaidCode.length > 0) {
      console.warn("[Mermaid生成] ⚠️  生成的代码可能不是有效的Mermaid格式");
    }
    
    return {
      mermaid: mermaidCode || "",
    };
  } catch (error) {
    console.error("Mermaid生成失败:", error);
    return { mermaid: "" };
  }
}

