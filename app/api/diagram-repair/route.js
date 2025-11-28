// -*- coding: utf-8 -*-
// AI SDK：用于非流式文本生成，修复图表时不需要流式输出
import { generateText } from "ai";
// resolveChatModel：根据前端传来的 runtime 配置解析出可直接调用的模型参数
import { resolveChatModel } from "@/lib/server-models";
// 系统提示：从统一的 prompts 模块导入
import { DIAGRAM_REPAIR_SYSTEM_MESSAGE } from "@/lib/prompts";
/**
 * buildUserPrompt
 * 构建用户提示，将无效 XML、当前 XML 和错误上下文组织成结构化的提示文本
 * @param {Object} params - 参数对象
 * @param {string} params.invalidXml - 最新一次模型输出的无效 XML（疑似异常）
 * @param {string} [params.currentXml] - 当前画布上的有效 XML（用于 edit 策略参考）
 * @param {string} [params.errorContext] - 运行时错误信息（帮助模型理解问题）
 * @returns {string} 格式化后的用户提示文本
 */
function buildUserPrompt({
  invalidXml,
  currentXml,
  errorContext
}) {
  // 构建提示文本的各个部分，按顺序组织信息
  const sections = [
    // 第一部分：展示有问题的 XML，这是需要修复的核心内容
    `最新一次模型输出（疑似异常）：
"""xml
${invalidXml ?? ""}
"""`
  ];
  // 第二部分：如果有错误上下文，添加运行时错误信息，帮助模型理解具体问题
  if (errorContext) {
    sections.push(`运行时错误：
"""log
${errorContext}
"""`);
  }
  // 第三部分：如果有当前有效的 XML，提供给模型作为 edit 策略的参考基准
  if (currentXml) {
    sections.push(`当前画布 XML（可用于 edit 参考）：
"""xml
${currentXml}
"""`);
  }
  // 用双换行符连接各部分，保持清晰的分隔
  return sections.join("\n\n");
}
/**
 * parseJsonBlock
 * 解析模型返回的文本，提取 JSON 对象并验证其结构
 * 如果模型没有返回 JSON 格式，尝试提取 XML 块作为降级方案
 * @param {string} text - 模型返回的原始文本
 * @returns {Object} 解析后的修复策略对象
 * @returns {string} returns.strategy - 修复策略："display" 或 "edit"
 * @returns {string} [returns.xml] - display 策略下的完整 XML（<root>...</root>）
 * @returns {Array} [returns.edits] - edit 策略下的搜索替换数组
 * @returns {string} [returns.notes] - 修复说明（中文，<60 字符）
 * @throws {Error} 当无法解析或验证失败时抛出错误
 */
function parseJsonBlock(text) {
  // 尝试从代码块中提取 JSON（模型可能用 ```json 包裹）
  const match = text.match(/```json([\s\S]*?)```/i);
  const rawJson = match ? match[1] : text.trim();
  if (!rawJson) {
    throw new Error("模型未返回 JSON 结果。");
  }
  const trimmed = rawJson.trim();
  try {
    // 解析 JSON 并验证基本结构
    const payload = JSON.parse(trimmed);
    if (!payload || typeof payload !== "object") {
      throw new Error("无法解析模型返回内容。");
    }
    // 验证 strategy 字段必须是 "display" 或 "edit"
    if (payload.strategy !== "display" && payload.strategy !== "edit") {
      throw new Error("JSON 缺少有效 strategy 字段。");
    }
    // display 策略必须包含 xml 字段
    if (payload.strategy === "display" && typeof payload.xml !== "string") {
      throw new Error("display 策略必须返回 xml 字段。");
    }
    // edit 策略必须包含 edits 数组
    if (payload.strategy === "edit" && !Array.isArray(payload.edits)) {
      throw new Error("edit 策略必须返回 edits 数组。");
    }
    return payload;
  } catch (error) {
    // 降级方案：如果 JSON 解析失败，尝试直接提取 XML 块
    // 这适用于模型直接返回 XML 而不是 JSON 的情况
    const xmlBlockMatch = text.match(/```xml([\s\S]*?)```/i) || text.match(/(<root[\s\S]*<\/root>)/i);
    if (xmlBlockMatch) {
      // 将提取的 XML 包装成 display 策略的格式
      return {
        strategy: "display",
        xml: xmlBlockMatch[1].trim(),
        notes: "模型返回裸 XML，已直接套用。"
      };
    }
    // 如果既没有 JSON 也没有 XML，抛出原始错误
    throw error;
  }
}
/**
 * POST /api/diagram-repair
 * 图表自动修复接口
 * 
 * 功能：当模型生成的 draw.io XML 格式错误或无法解析时，调用此接口进行自动修复
 * 
 * 请求体：
 * - invalidXml: 需要修复的无效 XML（必需）
 * - currentXml: 当前画布上的有效 XML（可选，用于 edit 策略参考）
 * - errorContext: 运行时错误信息（可选，帮助理解问题）
 * - modelRuntime: 模型运行时配置（必需）
 * 
 * 返回：
 * - strategy: "display"（完整重建）或 "edit"（局部修复）
 * - xml: display 策略下的完整 XML
 * - edits: edit 策略下的搜索替换数组
 * - notes: 修复说明
 */
async function POST(req) {
  try {
    // 解析请求体，提取修复所需的参数
    const {
      invalidXml,
      currentXml,
      errorContext,
      modelRuntime
    } = await req.json();
    
    // 验证必需参数：无效 XML 不能为空
    if (!invalidXml || invalidXml.trim().length === 0) {
      return Response.json(
        { error: "invalidXml 不能为空" },
        { status: 400 }
      );
    }
    
    // 验证必需参数：模型配置不能为空
    if (!modelRuntime) {
      return Response.json(
        { error: "缺少模型配置，无法执行自动修复。" },
        { status: 400 }
      );
    }
    
    // 根据 runtime 配置解析出真正的模型实例
    const resolved = resolveChatModel(modelRuntime);
    
    // 构建用户提示，组织所有上下文信息
    const userPrompt = buildUserPrompt({ invalidXml, currentXml, errorContext });
    
    // 调用模型生成修复方案（非流式，因为需要完整的 JSON 响应）
          const response = await generateText({
            model: resolved.model,
            system: DIAGRAM_REPAIR_SYSTEM_MESSAGE,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: userPrompt }]
        }
      ],
      temperature: 0 // 使用 0 温度确保修复结果的一致性
    });
    
    // 解析模型返回的文本，提取 JSON 对象
    const payload = parseJsonBlock(response.text);
    
    // 返回标准化的修复结果
    return Response.json({
      strategy: payload.strategy,
      xml: payload.xml,
      edits: payload.edits ?? [], // edit 策略下的搜索替换数组
      notes: payload.notes ?? "" // 修复说明（中文）
    });
  } catch (error) {
    // 错误处理：记录详细错误信息，返回用户友好的错误消息
    console.error("Diagram repair failed:", error);
    const message = error instanceof Error ? error.message : "未知错误";
    return Response.json({ error: message }, { status: 500 });
  }
}
// 导出 POST 处理函数，供 Next.js App Router 调用
export {
  POST
};
