// -*- coding: utf-8 -*-
/**
 * AI Agents 工作流编排
 * 协调提示词格式化、Mermaid生成、Architect和Renderer的完整流程
 */

import { formatPrompt } from "./prompt-formatter";
import { generateMermaid } from "./mermaid-generator";
import { generateVisualSchema } from "./architect";
import { generateXml, generateSvg } from "./renderer";
import { getStaticSystemModelList, isSystemModelsEnabled } from "@/lib/system-models";

/**
 * 获取默认系统模型配置
 * 当未传入 modelRuntime 时，从环境变量获取系统模型配置
 * 使用 SYSTEM_MODELS 中倒数第一个模型（最后一个模型）
 * 
 * @returns {Object|null} 默认模型运行时配置，如果系统模型未启用则返回 null
 */
function getDefaultSystemModelRuntime() {
  // 检查系统模型是否启用
  if (!isSystemModelsEnabled()) {
    console.log("[工作流] 系统模型未启用，无法使用默认系统模型配置");
    return null;
  }

  // 获取系统模型列表
  const systemModels = getStaticSystemModelList();
  
  if (!systemModels || systemModels.length === 0) {
    console.log("[工作流] 系统模型列表为空，无法使用默认系统模型配置");
    return null;
  }

  // 获取倒数第一个模型（最后一个模型）
  const lastModel = systemModels[systemModels.length - 1];
  
  if (!lastModel || !lastModel.id) {
    console.log("[工作流] 无法获取有效的系统模型ID");
    return null;
  }

  console.log("[工作流] 使用默认系统模型配置:", {
    modelId: lastModel.id,
    label: lastModel.label,
    description: lastModel.description,
  });

  // 构建 modelRuntime 对象，格式与前端传递的格式一致
  return {
    useSystemModel: true,
    systemModelId: lastModel.id,
  };
}

/**
 * 执行完整的智能体工作流
 * 
 * 工作流步骤：
 * 1. 提示词格式化：将用户输入格式化为规范的Markdown格式
 * 2. Mermaid生成：根据用户输入生成Mermaid图表代码
 * 3. 合并输入：将格式化提示词和Mermaid合并
 * 4. The Architect：生成VISUAL SCHEMA
 * 5. The Renderer：将VISUAL SCHEMA转换为Draw.io XML
 * 
 * @param {Object} params
 * @param {string} params.userInput - 用户输入的原始内容
 * @param {string} [params.currentXml] - 当前画布的 XML（可选）
 * @param {Object} [params.modelRuntime] - 默认模型运行时配置（可选）
 * @param {Object} [params.architectModel] - Architect模型配置（可选，覆盖默认配置）
 * @param {Object} [params.rendererModel] - Renderer模型配置（可选，覆盖默认配置）
 * @param {"drawio" | "svg"} [params.renderMode="drawio"] - 渲染模式，决定输出XML还是SVG
 * @returns {Promise<{xml?: string, svg?: string, formattedPrompt?: string, mermaid?: string, visualSchema?: string, metadata?: Object}>}
 */
export async function executeWorkflow({ 
  userInput, 
  currentXml, 
  modelRuntime,
  architectModel,
  rendererModel,
  renderMode = "drawio"
}) {
  const metadata = {
    startTime: Date.now(),
    steps: {},
  };
  
  try {
    // 如果未传入 modelRuntime，尝试使用默认系统模型配置
    let effectiveModelRuntime = modelRuntime;
    if (!effectiveModelRuntime) {
      const defaultSystemModel = getDefaultSystemModelRuntime();
      if (defaultSystemModel) {
        effectiveModelRuntime = defaultSystemModel;
        console.log("[工作流] 使用默认系统模型配置作为所有步骤的模型");
      } else {
        console.log("[工作流] 未传入 modelRuntime 且无法获取默认系统模型配置，各步骤将使用自己的默认配置");
      }
    }
    // 步骤 1: 提示词格式化
    console.log("[工作流] 步骤 1/5: 提示词格式化...");
    const formatStartTime = Date.now();
    const formatResult = await formatPrompt({
      userInput,
      currentXml,
      modelRuntime: effectiveModelRuntime,
    });
    metadata.steps.formatPrompt = {
      duration: Date.now() - formatStartTime,
      success: true,
    };
    console.log("[工作流] ✅ 步骤 1/5 完成: 提示词格式化");
    
    const formattedPrompt = formatResult.formattedPrompt;
    
    // 步骤 2: Mermaid生成
    console.log("[工作流] 步骤 2/5: Mermaid生成...");
    const mermaidStartTime = Date.now();
    let mermaidResult;
    try {
      mermaidResult = await generateMermaid({
        userInput: formattedPrompt,
        modelRuntime: effectiveModelRuntime,
      });
      metadata.steps.generateMermaid = {
        duration: Date.now() - mermaidStartTime,
        success: true,
        hasMermaid: !!mermaidResult.mermaid,
        isValid: mermaidResult.isValid !== false, // 默认为 true（如果未返回该字段）
      };
      if (mermaidResult.mermaid && mermaidResult.isValid === false) {
        console.log("[工作流] ✅ 步骤 2/5 完成: Mermaid生成（格式无效，将不传递给 Architect）");
      } else {
        console.log("[工作流] ✅ 步骤 2/5 完成: Mermaid生成", mermaidResult.mermaid ? "(已生成)" : "(跳过)");
      }
    } catch (error) {
      console.warn("[工作流] ⚠️  步骤 2/5 Mermaid生成失败，继续执行:", error.message);
      mermaidResult = { mermaid: "", isValid: false };
      metadata.steps.generateMermaid = {
        duration: Date.now() - mermaidStartTime,
        success: false,
        error: error.message,
      };
    }
    
    // 只有当 Mermaid 有效时才传递给 Architect
    // 如果格式无效，只传递格式化的提示词
    const mermaid = (mermaidResult.isValid !== false && mermaidResult.mermaid) ? mermaidResult.mermaid : "";
    
    // 步骤 3: The Architect - 生成VISUAL SCHEMA
    console.log("[工作流] 步骤 3/5: The Architect生成VISUAL SCHEMA...");
    const architectStartTime = Date.now();
    let architectResult;
    try {
      architectResult = await generateVisualSchema({
        formattedPrompt,
        mermaid,
        modelRuntime: architectModel || effectiveModelRuntime,
      });
      metadata.steps.generateVisualSchema = {
        duration: Date.now() - architectStartTime,
        success: true,
      };
      console.log("[工作流] ✅ 步骤 3/5 完成: VISUAL SCHEMA生成");
    } catch (error) {
      console.error("[工作流] ❌ 步骤 3/5 Architect失败:", error);
      metadata.steps.generateVisualSchema = {
        duration: Date.now() - architectStartTime,
        success: false,
        error: error.message,
      };
      throw error;
    }
    
    const visualSchema = architectResult.visualSchema;
    
    // 步骤 4: The Renderer - 根据renderMode生成XML或SVG
    const isSvgMode = renderMode === "svg";
    console.log(`[工作流] 步骤 4/5: The Renderer生成${isSvgMode ? "SVG" : "XML"}...`);
    const rendererStartTime = Date.now();
    let rendererResult;
    try {
      if (isSvgMode) {
        // SVG模式：生成SVG
        rendererResult = await generateSvg({
          visualSchema,
          modelRuntime: rendererModel || effectiveModelRuntime,
        });
        metadata.steps.generateSvg = {
          duration: Date.now() - rendererStartTime,
          success: true,
        };
        console.log("[工作流] ✅ 步骤 4/5 完成: SVG生成");
      } else {
        // Draw.io模式：生成XML
        rendererResult = await generateXml({
          visualSchema,
          modelRuntime: rendererModel || effectiveModelRuntime,
        });
        metadata.steps.generateXml = {
          duration: Date.now() - rendererStartTime,
          success: true,
        };
        console.log("[工作流] ✅ 步骤 4/5 完成: XML生成");
      }
    } catch (error) {
      console.error(`[工作流] ❌ 步骤 4/5 Renderer失败:`, error);
      if (isSvgMode) {
        metadata.steps.generateSvg = {
          duration: Date.now() - rendererStartTime,
          success: false,
          error: error.message,
        };
      } else {
        metadata.steps.generateXml = {
          duration: Date.now() - rendererStartTime,
          success: false,
          error: error.message,
        };
      }
      throw error;
    }
    
    // 步骤 5: 完成
    metadata.totalDuration = Date.now() - metadata.startTime;
    metadata.success = true;
    
    console.log("[工作流] ✅ 所有步骤完成，总耗时:", metadata.totalDuration, "ms");
    
    // 根据renderMode返回相应的结果
    const result = {
      formattedPrompt,
      // 只有当 Mermaid 有效时才返回
      mermaid: (mermaid && mermaidResult?.isValid !== false) ? mermaid : undefined,
      visualSchema,
      metadata,
    };
    
    if (isSvgMode) {
      result.svg = rendererResult.svg;
    } else {
      result.xml = rendererResult.xml;
    }
    
    return result;
  } catch (error) {
    metadata.totalDuration = Date.now() - metadata.startTime;
    metadata.success = false;
    metadata.error = error.message;
    
    console.error("[工作流] ❌ 工作流执行失败:", error);
    throw error;
  }
}

