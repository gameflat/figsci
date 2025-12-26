// -*- coding: utf-8 -*-
/**
 * 提示词格式化 Agent
 * 将用户输入格式化为规范的遵循Markdown语法的格式化提示词
 */

import { generateText } from "ai";
import { resolveChatModel } from "@/lib/server-models";
import { resolveSystemModel, isSystemModelsEnabled, getStaticSystemModelList } from "@/lib/system-models";

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
      temperature: 0.3,
    }),
    signal: abortSignal,
  });
  
  if (!response.ok) {
    throw new Error(`API 调用失败: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // 支持不同的响应格式
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
 * 格式化用户输入为规范的Markdown格式提示词
 * 
 * @param {Object} params
 * @param {string} params.userInput - 用户输入的原始内容
 * @param {string} [params.currentXml] - 当前画布的 XML（可选）
 * @param {Object} [params.modelRuntime] - 模型运行时配置（可选）
 * @param {AbortSignal} [params.abortSignal] - 取消信号，用于取消请求
 * @returns {Promise<{formattedPrompt: string}>}
 */
export async function formatPrompt({ 
  userInput, 
  currentXml, 
  modelRuntime,
  abortSignal
}) {
  try {
    // 构建格式化提示词
    const formattingPrompt = `请将以下用户输入格式化为规范的Markdown格式提示词。

## 用户原始输入
${userInput}

${currentXml && currentXml.trim() ? `## 当前画布状态
当前画布已有内容，用户可能想要修改或扩展现有图表。当前画布的 XML 内容如下：

\`\`\`xml
${currentXml.trim()}
\`\`\`

请在格式化时考虑当前画布的状态，确保格式化后的提示词能够帮助后续步骤理解用户是想要修改、扩展还是重新创建图表。

` : ""}

## 格式化要求
1. 将用户输入转换为结构化的Markdown格式
2. 将用户的具体需求融入到结构中
3. 使用适当的Markdown语法（标题、列表、代码块等）
4. 保持用户的核心意图和关键信息
5. 确保生成的提示词清晰、完整、可执行
6. 如果用户输入已经比较规范，可以适当优化但不要大幅改动
7. **重要**：如果用户输入中包含"数据上下文"部分（包含Markdown表格），必须完整保留，不要删除或修改数据内容

请直接返回格式化后的Markdown提示词，不要包含额外的解释文字。`;

    // 解析模型配置
    let model;
    let useCustomApi = false;
    let customApiConfig = null;
    
    if (modelRuntime) {
      console.log("[提示词格式化] 🔍 解析模型配置:", {
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
        console.log("[提示词格式化] 🔄 使用系统模型:", modelRuntime.systemModelId);
        const systemModel = resolveSystemModel(modelRuntime.systemModelId);
        if (systemModel) {
          model = systemModel.model;
          console.log("[提示词格式化] ✅ 系统模型解析成功");
        } else {
          console.warn("[提示词格式化] ⚠️  系统模型解析失败:", modelRuntime.systemModelId);
        }
      } else if (modelRuntime.systemModelId && !modelRuntime.useSystemModel) {
        // 处理特殊情况：有 systemModelId 但 useSystemModel 为 false
        // 可能是前端传递的配置格式问题，尝试将其作为系统模型解析
        console.log("[提示词格式化] 🔄 检测到 systemModelId 但 useSystemModel 为 false，尝试解析为系统模型:", modelRuntime.systemModelId);
        const systemModel = resolveSystemModel(modelRuntime.systemModelId);
        if (systemModel) {
          model = systemModel.model;
          console.log("[提示词格式化] ✅ 系统模型解析成功（自动修复）");
        } else {
          console.warn("[提示词格式化] ⚠️  系统模型解析失败，尝试其他方式:", modelRuntime.systemModelId);
        }
      } else if (modelRuntime.modelRuntime) {
        try {
          console.log("[提示词格式化] 🔄 解析嵌套 modelRuntime...");
          const resolved = resolveChatModel(modelRuntime.modelRuntime);
          model = resolved.model;
          console.log("[提示词格式化] ✅ 嵌套 modelRuntime 解析成功");
        } catch (error) {
          console.warn("[提示词格式化] ❌ 嵌套 modelRuntime 解析失败:", error);
        }
      } else if (modelRuntime.baseUrl && modelRuntime.apiKey && modelRuntime.modelId) {
        try {
          console.log("[提示词格式化] 🔄 解析直接模型配置:", modelRuntime.modelId);
          const resolved = resolveChatModel(modelRuntime);
          model = resolved.model;
          console.log("[提示词格式化] ✅ 直接模型配置解析成功");
        } catch (error) {
          console.warn("[提示词格式化] ❌ 直接模型配置解析失败:", error);
        }
      } else {
        console.warn("[提示词格式化] ⚠️  模型配置格式不完整:", modelRuntime);
      }
    }
    
    // 如果没有配置，尝试使用系统模型列表中的最后一个
    if (!model && !useCustomApi && isSystemModelsEnabled()) {
      const systemModels = getStaticSystemModelList();
      if (systemModels && systemModels.length > 0) {
        // 获取最后一个系统模型
        const lastSystemModel = systemModels[systemModels.length - 1];
        const systemModel = resolveSystemModel(lastSystemModel.id);
        if (systemModel) {
          model = systemModel.model;
          console.log("[提示词格式化] ✅ 使用默认系统模型（列表中的最后一个）:", lastSystemModel.id);
        }
      }
    }
    
    if (!model && !useCustomApi) {
      // 如果没有可用模型，使用简单格式化
      console.log("[提示词格式化] ⚠️  没有可用的 AI 模型，使用简单格式化");
      return simpleFormatPrompt(userInput);
    }
    
    const systemPrompt = "你是一个专业的提示词格式化专家。请将用户输入转换为规范的Markdown格式，保持清晰、专业、易读。";
    
    let responseText;
    
    if (useCustomApi) {
      try {
        console.log("[提示词格式化] 🔄 使用自定义 AI API 进行格式化...");
        responseText = await callCustomApi({
          url: customApiConfig.url,
          apiKey: customApiConfig.apiKey,
          model: customApiConfig.model,
          systemPrompt,
          userPrompt: formattingPrompt,
          abortSignal,
        });
        console.log("[提示词格式化] ✅ 自定义 AI API 调用成功");
      } catch (error) {
        if (error.name === 'AbortError' || abortSignal?.aborted) {
          throw error;
        }
        console.error("[提示词格式化] ❌ 自定义 API 调用失败:", error);
        return simpleFormatPrompt(userInput);
      }
    } else {
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
          temperature: 0.3,
          abortSignal,
        });
        responseText = response.text;
        console.log("[提示词格式化] ✅ AI SDK 调用成功");
      } catch (error) {
        if (error.name === 'AbortError' || abortSignal?.aborted) {
          throw error;
        }
        console.error("[提示词格式化] ❌ AI SDK 调用失败:", error);
        return simpleFormatPrompt(userInput);
      }
    }
    
    // 清理响应文本（移除可能的代码块标记）
    const cleanedText = responseText
      .replace(/```markdown\s*/gi, '')
      .replace(/```md\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    return {
      formattedPrompt: cleanedText || userInput,
    };
  } catch (error) {
    console.error("提示词格式化失败:", error);
    return simpleFormatPrompt(userInput);
  }
}

/**
 * 简单格式化策略（当 LLM 不可用时使用）
 * 
 * @param {string} userInput - 用户输入
 * @returns {Object} 格式化结果
 */
function simpleFormatPrompt(userInput) {
  // 简单处理：如果输入已经是Markdown格式，直接返回；否则添加基本格式
  if (userInput.includes('#') || userInput.includes('*') || userInput.includes('`')) {
    return {
      formattedPrompt: userInput,
    };
  }
  
  // 否则，将输入包装为Markdown段落
  return {
    formattedPrompt: userInput.split('\n').map(line => line.trim()).join('\n\n'),
  };
}
