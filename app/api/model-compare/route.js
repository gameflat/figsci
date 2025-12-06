// -*- coding: utf-8 -*-
// AI SDK：用于非流式文本生成，模型对比时不需要流式输出
import { generateText } from "ai";
// resolveChatModel：根据前端传来的 runtime 配置解析出可直接调用的模型参数
import { resolveChatModel } from "@/lib/server-models";
// resolveSystemModel：解析系统内置模型配置
import { resolveSystemModel, isSystemModelsEnabled, isSystemModel } from "@/lib/system-models";
// 系统提示：从统一的 prompts 模块导入
import { MODEL_COMPARE_SYSTEM_PROMPT_XML, MODEL_COMPARE_SYSTEM_PROMPT_SVG } from "@/lib/prompts";
/**
 * buildUserPrompt
 * 构建用户提示，将用户指令、当前 XML 和 Brief 组织成结构化的提示文本
 * @param {string} prompt - 用户的最新指令
 * @param {string} xml - 当前画布上的 XML（可选）
 * @param {string} brief - Figsci Brief 内容（可选）
 * @param {string} [renderMode="drawio"] - 渲染模式："drawio" 或 "svg"
 * @returns {string} 格式化后的用户提示文本
 */
function buildUserPrompt(prompt, xml, brief, renderMode = "drawio") {
  // 按顺序组织内容：先 Brief（如果有），再用户指令
  const sections = [];
  if (brief && brief.trim().length > 0) {
    sections.push(brief.trim());
  }
  sections.push(prompt.trim());
  
  // 构建结构化的提示文本，包含当前 XML 和用户指令
  return `当前图表 XML：
"""xml
${xml ?? ""}
"""

用户最新指令：
"""md
${sections.join("\n\n")}
"""

请输出 JSON（字段：summary, ${renderMode === "svg" ? "svg" : "xml"}），用于模型效果对比。`;
}
/**
 * extractJsonPayload
 * 从模型返回的文本中提取 JSON 对象并验证必需字段
 * @param {string} text - 模型返回的原始文本
 * @param {string} renderMode - 渲染模式："drawio" 或 "svg"
 * @returns {Object} 解析后的结果对象
 * @returns {string} returns.summary - 差异描述（中文，<=120 字符）
 * @returns {string} [returns.xml] - draw.io XML 字符串（drawio 模式必需）
 * @returns {string} [returns.svg] - SVG 字符串（svg 模式必需）
 * @returns {string} [returns.previewSvg] - 预览 SVG（可选）
 * @throws {Error} 当无法解析或缺少必需字段时抛出错误
 */
function extractJsonPayload(text, renderMode) {
  // 尝试从代码块中提取 JSON（模型可能用 ```json 包裹）
  // 如果没有代码块，尝试直接解析以 { 开头的文本
  const jsonBlockMatch = text.match(/```json([\s\S]*?)```/i);
  const jsonString = jsonBlockMatch ? jsonBlockMatch[1] : text.trim().startsWith("{") ? text.trim() : "";
  if (!jsonString) {
    throw new Error("模型未返回 JSON 结果，请重试或更换模型。");
  }
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new Error("无法解析模型返回的 JSON 内容。");
  }
  // 提取并验证各个字段
  const summary = typeof parsed.summary === "string" ? parsed.summary : "";
  const xml = typeof parsed.xml === "string" ? parsed.xml : void 0;
  const svg = typeof parsed.svg === "string" ? parsed.svg : void 0;
  const previewSvg = typeof parsed.previewSvg === "string" ? parsed.previewSvg : void 0;
  
  // 根据渲染模式验证必需字段
  if (renderMode === "svg" && !svg) {
    throw new Error("模型返回结果缺少 svg 字段。");
  }
  if (renderMode === "drawio" && !xml) {
    throw new Error("模型返回结果缺少 xml 字段。");
  }
  return {
    summary,
    xml,
    svg,
    previewSvg
  };
}
/**
 * exportDiagramPreview
 * 调用 draw.io 的导出 API，将 XML 转换为 PNG 预览图
 * 用于在模型对比界面中显示图表预览
 * @param {string} xml - draw.io XML 字符串
 * @returns {Promise<Object>} 包含 image 字段的对象（data URL 格式的 PNG），失败时返回空对象
 */
async function exportDiagramPreview(xml) {
  // 如果 XML 为空，直接返回空对象
  if (!xml || xml.trim().length === 0) {
    return {};
  }
  try {
    // 构建 draw.io 导出 API 的请求参数
    const params = new URLSearchParams();
    params.set("format", "png");
    params.set("embedImages", "1"); // 嵌入图片
    params.set("border", "0"); // 无边框
    params.set("base64", "1"); // 返回 base64 编码
    params.set("spin", "0"); // 不旋转
    params.set("scale", "1"); // 缩放比例
    params.set("w", "800"); // 宽度
    params.set("h", "600"); // 高度
    params.set("xml", xml); // XML 内容
    
    // 从环境变量获取 draw.io 基础 URL，默认使用官方服务
    const drawioBaseUrl = process.env.NEXT_PUBLIC_DRAWIO_BASE_URL || "https://app.diagrams.net";
    
    // 调用 draw.io 导出 API
    const response = await fetch(`${drawioBaseUrl}/export3`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    
    // 如果请求失败，返回空对象（不抛出错误，避免影响对比流程）
    if (!response.ok) {
      return {};
    }
    
    const text = (await response.text()).trim();
    if (!text) {
      return {};
    }
    
    // 如果返回的不是 data URL 格式，添加前缀
    const dataUrl = text.startsWith("data:") ? text : `data:image/png;base64,${text}`;
    return { image: dataUrl };
  } catch (error) {
    // 静默处理错误，返回空对象（不影响对比流程）
    console.error("Failed to export diagram preview:", error);
    return {};
  }
}
/**
 * POST /api/model-compare
 * 模型对比接口
 * 
 * 功能：同时调用多个模型生成图表，用于对比不同模型的效果
 * 
 * 请求体：
 * - models: 模型配置数组（必需），每个模型包含 id、label、runtime
 * - prompt: 用户指令（必需）
 * - xml: 当前画布 XML（可选）
 * - brief: Figsci Brief 内容（可选）
 * - attachments: 附件数组（可选）
 * - renderMode: 渲染模式，"drawio" 或 "svg"（默认 "drawio"）
 * 
 * 返回：
 * - results: 结果数组，每个元素包含：
 *   - id, label, provider: 模型标识信息
 *   - status: "ok" 或 "error"
 *   - summary: 差异描述（成功时）
 *   - xml/svg: 生成的图表内容（成功时）
 *   - previewImage: 预览图（成功时，drawio 模式）
 *   - usage: token 使用信息（成功时）
 *   - durationMs: 耗时（毫秒）
 *   - error: 错误消息（失败时）
 */
async function POST(req) {
  try {
    // 解析请求体，提取对比所需的参数
    const {
      models,
      prompt,
      xml,
      brief,
      attachments,
      renderMode = "drawio"
    } = await req.json();
    
    // 获取请求的 AbortSignal，用于支持取消操作
    const abortSignal = req.signal;
    
    // 验证必需参数：用户指令不能为空
    if (!prompt || prompt.trim().length === 0) {
      return Response.json(
        { error: "prompt 不能为空。" },
        { status: 400 }
      );
    }
    // 规范化模型配置数组
    // 1. 如果是字符串数组，转换为对象数组
    // 2. 支持系统模型（isSystemModel: true）和自定义模型（runtime 配置）
    const normalizedModels = (Array.isArray(models) ? models : []).map(
      (item) => typeof item === "string" ? { id: item } : item
    ).filter(
      (item) => {
        if (!item?.id || item.id.trim().length === 0) {
          return false;
        }
        // 系统模型：检查 isSystemModel 标志
        if (item.isSystemModel) {
          return isSystemModelsEnabled() && isSystemModel(item.id);
        }
        // 自定义模型：需要完整的 runtime 配置
        return Boolean(
          item?.runtime && 
          typeof item.runtime.baseUrl === "string" && 
          typeof item.runtime.apiKey === "string" && 
          typeof item.runtime.modelId === "string"
        );
      }
    );
    
    // 验证至少需要一个有效的模型配置
    if (normalizedModels.length === 0) {
      return Response.json(
        { error: "至少需要选择一个模型进行对比。" },
        { status: 400 }
      );
    }
    
    // 确定渲染模式
    const mode = renderMode === "svg" ? "svg" : "drawio";
    
    // 构建用户提示
    const userPrompt = buildUserPrompt(prompt, xml ?? "", brief, mode);
    const normalizedUserPrompt = userPrompt.trim();
    
    // 验证提示内容不为空
    if (!normalizedUserPrompt) {
      return Response.json(
        { error: "生成请求缺少有效提示词内容。" },
        { status: 400 }
      );
    }
    
    // 处理附件，转换为 AI SDK 支持的多媒体消息格式
    const attachmentParts = attachments?.flatMap(
      (file) => file?.url && file?.mediaType ? [
        {
          type: "image",
          image: file.url,
          mimeType: file.mediaType
        }
      ] : []
    ) ?? [];
    // 并行调用所有模型生成图表，使用 Promise.all 提高效率
    const results = await Promise.all(
      normalizedModels.map(async (model) => {
        const startTime = Date.now();
        try {
          // 解析模型配置，获取可直接调用的模型实例
          // 系统模型：从服务端环境变量获取配置
          // 自定义模型：使用客户端传入的 runtime 配置
          let resolved;
          if (model.isSystemModel) {
            resolved = resolveSystemModel(model.id);
            if (!resolved) {
              throw new Error(`系统模型配置不完整: ${model.id}`);
            }
          } else {
            resolved = resolveChatModel(model.runtime);
          }
          
          // 调用模型生成图表（非流式，因为需要完整的 JSON 响应）
          const response = await generateText({
            model: resolved.model,
            system: mode === "svg" ? MODEL_COMPARE_SYSTEM_PROMPT_SVG : MODEL_COMPARE_SYSTEM_PROMPT_XML,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: userPrompt },
                  ...attachmentParts // 包含附件（如果有）
                ]
              }
            ],
            temperature: 0.1, // 使用较低温度确保结果的一致性
            abortSignal // 传递 AbortSignal 以支持取消请求
          });
          
          const endTime = Date.now();
          const durationMs = endTime - startTime;
          
          // 解析模型返回的 JSON 对象
          const payload = extractJsonPayload(response.text, mode);
          
          // 如果是 drawio 模式，生成预览图
          const preview = payload.xml ? await exportDiagramPreview(payload.xml) : {};
          
          // 获取 token 使用信息
          const usage = response.usage;
          
          // 返回成功结果
          return {
            id: resolved.id,
            label: model.label ?? resolved.label,
            provider: resolved.provider,
            status: "ok",
            summary: payload.summary, // 差异描述
            xml: payload.xml, // draw.io XML（drawio 模式）
            svg: payload.svg, // SVG（svg 模式）
            previewSvg: payload.previewSvg, // 预览 SVG（可选）
            previewImage: preview.image, // PNG 预览图（drawio 模式）
            // token 使用信息
            usage: {
              inputTokens: usage.inputTokens || 0,
              outputTokens: usage.outputTokens || 0,
              totalTokens: (usage.inputTokens || 0) + (usage.outputTokens || 0)
            },
            durationMs // 耗时（毫秒）
          };
        } catch (error) {
          // 错误处理：记录错误但继续处理其他模型
          const endTime = Date.now();
          const durationMs = endTime - startTime;
          const message = error instanceof Error ? error.message : "模型调用失败";
          
          // 返回错误结果（不抛出异常，确保其他模型的结果能正常返回）
          return {
            id: model.id,
            label: model.label ?? model.id,
            provider: "unknown",
            status: "error",
            error: message,
            durationMs
          };
        }
      })
    );
    
    // 返回所有模型的结果数组
    return Response.json({ results });
  } catch (error) {
    // 全局错误处理：记录详细错误信息，返回用户友好的错误消息
    console.error("Model compare route error:", error);
    return Response.json(
      { error: "内部服务器错误" },
      { status: 500 }
    );
  }
}
// 导出 POST 处理函数，供 Next.js App Router 调用
export {
  POST
};
