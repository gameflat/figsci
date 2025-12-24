// -*- coding: utf-8 -*-
/**
 * The Renderer Agent
 * 将VISUAL SCHEMA转换为Draw.io XML代码
 */

import { generateText } from "ai";
import { resolveChatModel } from "@/lib/server-models";
import { resolveSystemModel, isSystemModelsEnabled } from "@/lib/system-models";
import { RENDERER_SYSTEM_MESSAGE } from "@/lib/prompts";

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
      temperature: 0.1,
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
 * 从Renderer输出中提取Draw.io XML
 * 
 * @param {string} rendererOutput - Renderer的原始输出
 * @returns {string} Draw.io XML代码
 */
function extractXml(rendererOutput) {
  // 尝试从代码块中提取XML
  const xmlBlockMatch = rendererOutput.match(/```xml\s*([\s\S]*?)\s*```/i);
  if (xmlBlockMatch) {
    return xmlBlockMatch[1].trim();
  }
  
  // 尝试提取 <root>...</root> 块
  const rootMatch = rendererOutput.match(/<root>[\s\S]*?<\/root>/i);
  if (rootMatch) {
    return rootMatch[0];
  }
  
  // 尝试提取 <mxfile>...</mxfile> 块
  const mxfileMatch = rendererOutput.match(/<mxfile>[\s\S]*?<\/mxfile>/i);
  if (mxfileMatch) {
    return mxfileMatch[0];
  }
  
  // 如果都找不到，返回原始输出
  return rendererOutput.trim();
}

/**
 * 获取Renderer模型配置
 * 优先使用环境变量配置，否则使用传入的模型配置
 * 
 * @param {Object} [defaultModelRuntime] - 默认模型配置
 * @returns {Object|null} 解析后的模型配置
 */
function getRendererModelConfig(defaultModelRuntime) {
  // 优先使用环境变量配置
  const rendererModelId = process.env.RENDERER_MODEL_ID;
  const rendererBaseUrl = process.env.RENDERER_MODEL_BASE_URL;
  const rendererApiKey = process.env.RENDERER_MODEL_API_KEY;
  
  if (rendererModelId && rendererBaseUrl && rendererApiKey) {
    try {
      return resolveChatModel({
        modelId: rendererModelId,
        baseUrl: rendererBaseUrl,
        apiKey: rendererApiKey,
        label: `Renderer (${rendererModelId})`,
      });
    } catch (error) {
      console.warn("[Renderer] 环境变量模型配置解析失败:", error);
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
      console.warn("[Renderer] 默认模型配置解析失败:", error);
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
 * The Renderer Agent - 生成Draw.io XML
 * 
 * @param {Object} params
 * @param {string} params.visualSchema - VISUAL SCHEMA内容
 * @param {Object} [params.modelRuntime] - 模型运行时配置（可选）
 * @returns {Promise<{xml: string}>}
 */
export async function generateXml({ 
  visualSchema, 
  modelRuntime 
}) {
  try {
    // 获取模型配置
    const resolvedModel = getRendererModelConfig(modelRuntime);
    
    if (!resolvedModel) {
      throw new Error("无法获取Renderer模型配置");
    }
    
    // VISUAL SCHEMA 作为 user message 传递，系统提示词保持不变
    let responseText;
    
    // 检查是否使用自定义API（通过模型配置）
    if (modelRuntime?.customApiUrl && modelRuntime?.customApiKey) {
      try {
        console.log("[Renderer] 🔄 使用自定义 AI API 生成XML...");
        responseText = await callCustomApi({
          url: modelRuntime.customApiUrl,
          apiKey: modelRuntime.customApiKey,
          model: modelRuntime.customModel || "gpt-4o-mini",
          systemPrompt: RENDERER_SYSTEM_MESSAGE,
          userPrompt: visualSchema,
        });
        console.log("[Renderer] ✅ 自定义 AI API 调用成功");
      } catch (error) {
        console.error("[Renderer] ❌ 自定义 API 调用失败:", error);
        throw error;
      }
    } else {
      try {
        console.log("[Renderer] 🔄 使用 AI SDK 生成XML...");
        const response = await generateText({
          model: resolvedModel.model,
          system: RENDERER_SYSTEM_MESSAGE,
          messages: [
            {
              role: "user",
              content: visualSchema,
            },
          ],
          temperature: 0.1, // 使用较低温度确保结果稳定
        });
        responseText = response.text;
        console.log("[Renderer] ✅ AI SDK 调用成功");
      } catch (error) {
        console.error("[Renderer] ❌ AI SDK 调用失败:", error);
        throw error;
      }
    }
    
    // 提取XML
    let xml = extractXml(responseText);
    
    // 验证XML格式：必须包含 <root> 或 <mxfile>
    if (!xml || (!xml.includes('<root>') && !xml.includes('<mxfile>'))) {
      console.error("[Renderer] ❌ XML格式验证失败", {
        xmlLength: xml?.length,
        hasRoot: xml?.includes('<root>'),
        hasMxfile: xml?.includes('<mxfile>'),
        xmlPreview: xml?.substring(0, 200)
      });
      throw new Error("生成的XML格式无效：必须包含 <root> 或 <mxfile> 标签");
    }
    
    // 确保 XML 包含必需的基础结构
    if (xml.includes('<root>')) {
      // 检查是否包含 id="0" 和 id="1" 的 mxCell
      if (!xml.includes('id="0"') || !xml.includes('id="1"')) {
        console.warn("[Renderer] ⚠️  XML 缺少基础结构，尝试修复...");
        // 如果缺少基础结构，尝试添加
        const rootContent = xml.match(/<root>([\s\S]*)<\/root>/i);
        if (rootContent) {
          const innerContent = rootContent[1].trim();
          // 确保有基础结构
          if (!innerContent.includes('id="0"')) {
            xml = `<root><mxCell id="0" />${innerContent.includes('id="1"') ? '' : '<mxCell id="1" parent="0" />'}${innerContent}</root>`;
          } else if (!innerContent.includes('id="1"')) {
            xml = xml.replace(/<mxCell\s+id="0"[^>]*\/?>/, (match) => `${match}\n<mxCell id="1" parent="0" />`);
          }
        }
      }
    }
    
    console.log("[Renderer] ✅ XML 提取成功", {
      xmlLength: xml.length,
      hasRoot: xml.includes('<root>'),
      hasMxfile: xml.includes('<mxfile>'),
      hasId0: xml.includes('id="0"'),
      hasId1: xml.includes('id="1"')
    });
    
    return {
      xml,
    };
  } catch (error) {
    console.error("Renderer生成失败:", error);
    throw error;
  }
}

