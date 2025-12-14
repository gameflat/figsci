// -*- coding: utf-8 -*-
// AI SDK：封装了流式/非流式文本生成以及统一 UI 流响应的工具函数
import { streamText, convertToModelMessages, generateText, createUIMessageStreamResponse } from "ai";
// zod v3：在服务端声明工具 schema，约束模型可调用的 function 结构
import { z } from "zod/v3";
// resolveChatModel：根据前端传来的 runtime 配置解析出可直接调用的模型参数
import { resolveChatModel } from "@/lib/server-models";
// resolveSystemModel：解析系统内置模型配置
import { resolveSystemModel, isSystemModelsEnabled, isSystemModel } from "@/lib/system-models";
// 系统提示词：从统一的 prompts 模块导入
import { getSystemMessage } from "@/lib/prompts";
// Next.js Route Handler 的最长执行时间（秒），避免 Vercel 上接口超时
// 设置为 300 秒（5 分钟）以支持复杂图表生成，需要配合 nginx 的 proxy_read_timeout 配置
export const maxDuration = 300;

/**
 * 从文本响应中解析 JSON 格式的操作指令
 * 用于不支持工具调用的 LLM
 * 
 * @param {string} text - LLM 的文本响应
 * @returns {Object|null} 解析后的操作指令，包含 action 和 params
 */
function parseTextResponseToAction(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }
  
  try {
    // 尝试从文本中提取 JSON 代码块
    // 支持 ```json ... ``` 格式
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    let jsonStr = jsonBlockMatch ? jsonBlockMatch[1] : null;
    
    // 如果没有找到 JSON 代码块，尝试直接解析整个文本
    if (!jsonStr) {
      // 尝试找到最外层的 JSON 对象
      const jsonMatch = text.match(/\{[\s\S]*"action"[\s\S]*"params"[\s\S]*\}/);
      jsonStr = jsonMatch ? jsonMatch[0] : null;
    }
    
    if (!jsonStr) {
      console.warn("无法从文本响应中提取 JSON:", text.substring(0, 200));
      return null;
    }
    
    // 解析 JSON
    const parsed = JSON.parse(jsonStr);
    
    // 验证必需字段
    if (!parsed.action || !parsed.params) {
      console.warn("JSON 缺少必需字段 action 或 params:", parsed);
      return null;
    }
    
    // 验证 action 是有效的操作类型
    const validActions = ['display_diagram', 'edit_diagram', 'display_svg', 'search_template'];
    if (!validActions.includes(parsed.action)) {
      console.warn("无效的 action 类型:", parsed.action);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error("解析文本响应失败:", error.message);
    // 尝试更宽松的解析
    try {
      // 提取 action
      const actionMatch = text.match(/"action"\s*:\s*"(\w+)"/);
      if (!actionMatch) return null;
      
      const action = actionMatch[1];
      
      // 根据 action 类型提取相应的参数
      if (action === 'display_diagram' || action === 'display_svg') {
        // 提取 xml 或 svg
        const contentKey = action === 'display_svg' ? 'svg' : 'xml';
        const contentMatch = text.match(new RegExp(`"${contentKey}"\\s*:\\s*"([\\s\\S]*?)(?:"|$)`));
        if (contentMatch) {
          // 尝试修复不完整的字符串
          let content = contentMatch[1];
          // 处理转义字符
          content = content.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
          return {
            action,
            params: { [contentKey]: content }
          };
        }
      } else if (action === 'edit_diagram') {
        // 编辑操作比较复杂，需要完整的 JSON 解析
        return null;
      } else if (action === 'search_template') {
        const queryMatch = text.match(/"query"\s*:\s*"([^"]*)"/);
        if (queryMatch) {
          return {
            action,
            params: { query: queryMatch[1] }
          };
        }
      }
    } catch (e) {
      console.error("备用解析也失败:", e.message);
    }
    return null;
  }
}

/**
 * 将解析后的操作指令转换为工具调用事件
 * 用于前端可以像处理正常工具调用一样处理
 * 
 * @param {Object} action - 解析后的操作指令
 * @returns {Object} 工具调用对象
 */
function actionToToolCall(action) {
  return {
    toolCallId: `call_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    toolName: action.action,
    input: action.params
  };
}

/**
 * 玻尔平台光子扣费辅助函数
 * 
 * 在 AI 生成完成后调用，根据 token 使用量或消息数量进行扣费
 * 支持三种收费模式：
 * - fixed: 固定收费（仅在任务成功完成时收取）
 * - token: 按 token 收费（无论任务是否完成都收取）
 * - mixed: 混合收费（固定费用仅在成功时收取，token 费用总是收取）
 * 
 * @param {Request} req - Next.js 请求对象（用于获取 Cookie）
 * @param {Object} usage - Token 使用量信息
 * @param {number} usage.inputTokens - 输入 token 数
 * @param {number} usage.outputTokens - 输出 token 数
 * @param {number} usage.totalTokens - 总 token 数
 * @param {boolean} isTaskCompleted - 任务是否成功完成（用于决定是否收取固定费用）
 */
async function chargePhotonIfEnabled(req, usage, isTaskCompleted = true) {
  // 检查是否启用光子扣费
  const enablePhotonCharge = process.env.NEXT_PUBLIC_ENABLE_PHOTON_CHARGE === 'true';
  
  if (!enablePhotonCharge) {
    console.log("光子扣费未启用，跳过扣费");
    return;
  }
  
  try {
    // 获取收费模式：'fixed'、'token' 或 'mixed'
    const chargeMode = process.env.BOHRIUM_CHARGE_MODE || 'fixed';
    
    // 计算固定费用和 token 费用
    const chargePerRequest = parseInt(process.env.BOHRIUM_CHARGE_PER_REQUEST || '1');
    const chargePerKToken = parseFloat(process.env.BOHRIUM_CHARGE_PER_1K_TOKEN || '1');
    const totalTokens = usage.totalTokens || 0;
    const tokenCharge = Math.ceil((totalTokens / 1000) * chargePerKToken);
    
    let eventValue = 0;
    
    // 根据收费模式和任务完成状态计算最终扣费金额
    if (chargeMode === 'token') {
      // 纯 token 计费模式：无论任务是否完成，都按 token 收费
      eventValue = tokenCharge;
      console.log("Token 计费模式：", { tokenCharge, isTaskCompleted });
    } else if (chargeMode === 'mixed') {
      // 混合计费模式：
      // - Token 费用：无论任务是否完成都收取
      // - 固定费用：仅在任务成功完成时收取
      eventValue = tokenCharge; // Token 费用总是收取
      if (isTaskCompleted) {
        eventValue += chargePerRequest; // 任务成功完成时加上固定费用
      }
      console.log("混合计费模式：", { 
        tokenCharge, 
        fixedCharge: isTaskCompleted ? chargePerRequest : 0, 
        totalCharge: eventValue,
        isTaskCompleted 
      });
    } else {
      // 固定计费模式（默认）：仅在任务成功完成时收取固定费用
      if (isTaskCompleted) {
        eventValue = chargePerRequest;
      } else {
        console.log("固定计费模式：任务未完成，跳过扣费");
        return;
      }
      console.log("固定计费模式：", { fixedCharge: eventValue, isTaskCompleted });
    }
    
    // 如果计算出的扣费金额为 0 或负数，跳过扣费
    if (eventValue <= 0) {
      console.log("扣费金额为 0，跳过扣费");
      return;
    }
    
    // 获取用户 AK（从 Cookie）
    const cookies = req.headers.get('cookie');
    let accessKey = null;
    let clientName = null;
    
    if (cookies) {
      const cookieMap = Object.fromEntries(
        cookies.split('; ').map(c => {
          const [key, ...v] = c.split('=');
          return [key, v.join('=')];
        })
      );
      accessKey = cookieMap['appAccessKey'];
      clientName = cookieMap['clientName'];
    }
    
    // 如果没有用户 AK，使用开发者 AK（仅用于开发调试）
    if (!accessKey) {
      accessKey = process.env.BOHRIUM_DEV_ACCESS_KEY;
      clientName = process.env.BOHRIUM_CLIENT_NAME;
      console.warn("未从 Cookie 中获取到用户 AK，使用开发者 AK 进行调试");
    }
    
    // 如果没有 AK，跳过扣费
    if (!accessKey) {
      console.warn("未配置 AK，跳过光子扣费");
      return;
    }
    
    // 获取 SKU ID
    const skuId = process.env.BOHRIUM_SKU_ID;
    if (!skuId) {
      console.warn("未配置 BOHRIUM_SKU_ID，跳过光子扣费");
      return;
    }
    
    // 生成 bizNo
    const bizNo = parseInt(`${Date.now()}${Math.floor(Math.random() * 10000)}`);
    
    // 调用光子扣费 API
    const chargeUrl = "https://openapi.dp.tech/openapi/v1/api/integral/consume";
    const requestBody = {
      bizNo: bizNo,
      changeType: 1,
      eventValue: eventValue,
      skuId: parseInt(skuId),
      scene: "appCustomizeCharge"
    };
    
    const headers = {
      "accessKey": accessKey,
      "Content-Type": "application/json"
    };
    
    if (clientName) {
      headers["x-app-key"] = clientName;
    }
    
    console.log("发起光子扣费请求：", {
      bizNo: bizNo,
      eventValue: eventValue,
      chargeMode: chargeMode,
      tokenUsage: usage
    });
    
    const response = await fetch(chargeUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error("解析光子扣费响应失败：", responseText);
      return;
    }
    
    if (responseData.code === 0) {
      console.log("光子扣费成功：", {
        bizNo: bizNo,
        eventValue: eventValue
      });
    } else {
      console.error("光子扣费失败：", responseData);
    }
    
  } catch (error) {
    // 扣费失败不应该影响主流程，只记录错误
    console.error("光子扣费异常（不影响主流程）：", error);
  }
}
/**
 * POST /api/chat
 * Figsci 图表生成 API 路由
 * 
 * 此路由是应用的核心 API 端点，负责根据用户输入生成符合标准的 draw.io 图表 XML 代码或 SVG。
 * 
 * 主要功能：
 * - 支持文本输入和图片输入（多模态）
 * - 支持两种配置方式：客户端配置和服务器端配置（通过访问密码）
 * - 支持续写功能：当生成的代码被截断时，可以继续完成剩余部分
 * - 使用流式响应（SSE）实时返回生成结果，提供更好的用户体验
 * 
 * 支持的配置方式：
 * 1. **客户端配置**：客户端在请求体中提供完整的模型配置信息
 * 2. **服务器端配置**：客户端通过 `x-access-password` 请求头提供访问密码，
 *    服务器使用环境变量中的配置（适用于共享部署场景）
 * 
 * 支持的输入类型：
 * - **文本输入**：纯文本描述，支持所有图表类型
 * - **图片输入**：图片 + 文本描述，需要模型支持视觉能力（vision）
 * 
 * @param {Request} req - Next.js 请求对象
 * @returns {Promise<Response>} 返回流式响应（SSE）或 JSON 错误响应
 */
async function POST(req) {
  try {
    // ========== 解析请求参数 ==========
    // 从请求体中解析所有参数
    // useSystemModel: 是否使用系统内置模型
    // systemModelId: 系统模型 ID（当 useSystemModel 为 true 时使用）
    const { messages, xml, modelRuntime, enableStreaming, renderMode, isContinuation, useSystemModel, systemModelId } = await req.json();
    
    // 从请求头获取访问密码（用于服务器端配置模式）
    // 如果提供了访问密码，将使用服务器环境变量中的配置，而不是客户端配置
    const accessPassword = req.headers.get('x-access-password');
    
    // ========== 配置处理逻辑 ==========
    // 支持三种配置模式：
    // 1. 系统内置模型（useSystemModel: true）- 推荐方式
    // 2. 访问密码模式（x-access-password）- 兼容旧版
    // 3. 客户端自定义配置（modelRuntime）- 用户自己的 API Key
    
    let finalModelRuntime = modelRuntime;
    let resolvedModel = null;
    let isUsingSystemModel = false;
    
    // 模式1：使用系统内置模型
    if (useSystemModel && systemModelId) {
      // 检查系统模型功能是否启用
      if (!isSystemModelsEnabled()) {
        return Response.json(
          { error: "系统内置模型功能未启用" },
          { status: 400 }
        );
      }
      
      // 验证请求的模型是否为有效的系统模型
      if (!isSystemModel(systemModelId)) {
        return Response.json(
          { error: `请求的系统模型不存在: ${systemModelId}` },
          { status: 400 }
        );
      }
      
      // 解析系统模型配置（从服务端环境变量获取 API Key 等敏感信息）
      resolvedModel = resolveSystemModel(systemModelId);
      
      if (!resolvedModel) {
        return Response.json(
          { error: "系统模型配置不完整，请检查服务端环境变量配置" },
          { status: 500 }
        );
      }
      
      isUsingSystemModel = true;
      console.log("使用系统内置模型:", systemModelId);
    }
    // 模式2：如果提供了访问密码，使用服务器端配置模式
    else if (accessPassword) {
      // 从环境变量获取服务器配置的访问密码
      // ACCESS_PASSWORD 应在 .env.local 或部署环境中配置
      const envPassword = process.env.ACCESS_PASSWORD;
      
      // 检查服务器是否配置了访问密码
      if (!envPassword) {
        return Response.json(
          { error: "服务器未配置访问密码" },
          { status: 400 } // 400 Bad Request: 服务器配置错误
        );
      }
      
      // 验证访问密码是否正确
      if (accessPassword !== envPassword) {
        return Response.json(
          { error: "访问密码错误" },
          { status: 401 } // 401 Unauthorized: 未授权访问
        );
      }
      
      // 使用服务器端环境变量中的模型配置
      // 这种方式适用于共享部署，用户只需提供密码即可使用服务器配置的模型
      finalModelRuntime = {
        baseUrl: process.env.SERVER_LLM_BASE_URL,
        apiKey: process.env.SERVER_LLM_API_KEY,
        modelId: process.env.SERVER_LLM_MODEL,
        provider: process.env.SERVER_LLM_PROVIDER || "openai"
      };
      
      // 验证服务器端配置是否完整
      // baseUrl、apiKey 和 modelId 是必需的，缺少任意一个都无法调用模型 API
      if (!finalModelRuntime.baseUrl || !finalModelRuntime.apiKey || !finalModelRuntime.modelId) {
        return Response.json(
          { error: "服务器模型配置不完整，请检查环境变量" },
          { status: 500 } // 500 Internal Server Error: 服务器配置不完整
        );
      }
    }
    // 模式3：客户端配置模式
    else {
      // 如果未提供系统模型或访问密码，则必须提供客户端配置
      if (!modelRuntime) {
        return Response.json(
          { error: "缺少模型配置。请选择系统模型、配置自定义模型，或使用 x-access-password 请求头。" },
          { status: 400 } // 400 Bad Request: 缺少必需参数
        );
      }
    }
    
    // ========== 错误处理函数 ==========
    // 将底层错误翻译成更友好的中文提示，便于前端直接展示
    // 注意：errorHandler 需要在 finalModelRuntime 定义之后创建，以便访问正确的配置信息
    let errorHandler = function(error) {
      console.error("Stream error:", error);
      if (error == null) {
        return "未知错误";
      }
      if (typeof error === "string") {
        return error;
      }
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
          // 这一句的意思是：API 接口未找到。请检查 Base URL 配置是否正确。当前配置: xxx（如果 finalModelRuntime?.baseUrl 是 undefined，则显示"未知"），用于提示用户可能是 Base URL 配置错误导致的 404。
          return `API 接口未找到。请检查 Base URL 配置是否正确。当前配置: ${finalModelRuntime?.baseUrl || "未知"}`;
        }
        if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
          return "API Key 无效或已过期，请检查配置。";
        }
        if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
          return "API Key 权限不足，请检查配置。";
        }
        return errorMessage;
      }
      return JSON.stringify(error);
    };
    
    // 若未显式指定 renderMode，默认为 draw.io XML 输出
    const outputMode = renderMode === "svg" ? "svg" : "drawio";
    // Next.js 会为 Request 注入 AbortSignal，这里透传给下游模型调用
    const abortSignal = req.signal;
    
    // ========== 检测工具调用支持 ==========
    // 从运行时配置或解析后的模型配置中获取 supportsToolCalls 标志
    // 默认为 true，除非明确设置为 false
    const supportsToolCalls = resolvedModel?.supportsToolCalls ?? finalModelRuntime?.supportsToolCalls ?? true;
    
    console.log("Tool calls support:", {
      modelId: resolvedModel?.id || finalModelRuntime?.modelId,
      supportsToolCalls: supportsToolCalls
    });
    
    // ========== 选择系统提示词 ==========
    // 根据 isContinuation 标志、outputMode 和 supportsToolCalls 选择不同的系统提示词：
    // - 正常生成：使用标准系统提示（完整的图表生成规范）
    // - 续写请求：使用续写系统提示（专门用于续写被截断的代码）
    // - 不支持工具调用：使用特殊的 JSON 输出格式提示词
    // 从统一的 prompts 模块获取系统提示词
    const systemMessage = getSystemMessage(outputMode, isContinuation || false, supportsToolCalls);
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Missing messages payload." },
        { status: 400 }
      );
    }
    // 取出用户最新一条消息，用于生成 "当前图 + 用户输入" 的提示
    const lastMessage = messages[messages.length - 1];
    const lastMessageText = lastMessage.parts?.find((part) => part.type === "text")?.text || "";
    const safeUserText = typeof lastMessageText === "string" && lastMessageText.trim().length > 0 ? lastMessageText : "（用户未提供文字内容，可能仅上传了附件）";
    const fileParts = lastMessage.parts?.filter((part) => part.type === "file") || [];
    
    // ========== 多模态输入验证 ==========
    // 如果用户提供了图片附件，检查模型是否支持视觉能力（vision）
    if (fileParts.length > 0) {
      const modelId = finalModelRuntime.modelId?.toLowerCase() || "";
      // 检查模型是否支持 vision
      // 支持 vision 的模型包括：
      // - OpenAI: gpt-4o, gpt-4-turbo, gpt-4-vision-preview
      // - Anthropic: claude-3 系列（claude-3-opus, claude-3-sonnet, claude-3-haiku 等）
      // - Google: gemini-pro-vision, gemini-1.5-pro
      // - 其他: 包含 'vision' 或 'vl' 关键词的模型
      const supportsVision =
        modelId.includes("vision") ||           // 通用 vision 关键词
        modelId.includes("gpt-4o") ||           // GPT-4o 系列
        modelId.includes("gpt-4-turbo") ||      // GPT-4 Turbo 系列
        modelId.includes("gpt-4-vision") ||     // GPT-4 Vision 系列
        modelId.includes("claude-3") ||         // Claude 3 系列
        modelId.includes("claude-sonnet") ||    // Claude Sonnet 系列
        modelId.includes("claude-opus") ||      // Claude Opus 系列
        modelId.includes("claude-haiku") ||     // Claude Haiku 系列
        modelId.includes("gemini") ||           // Gemini 系列（通常支持 vision）
        modelId.includes("vl");                 // Vision Language 模型关键词
      
      // 如果模型不支持 vision，返回错误提示
      if (!supportsVision) {
        return Response.json(
          { 
            error: "当前模型不支持图片输入，请使用支持 vision 的模型（如 gpt-4o, gpt-4-turbo, gpt-4-vision-preview, claude-3-opus, claude-3-sonnet, gemini-pro-vision 等）" 
          },
          { status: 400 } // 400 Bad Request: 模型不支持该功能
        );
      }
      
      // 调试日志：记录 vision 支持情况
      console.log("[DEBUG] Vision support check:", {
        modelId: finalModelRuntime.modelId,
        supportsVision: supportsVision,
        imageCount: fileParts.length
      });
    }
    const formattedTextContent = `
当前图表 XML:
"""xml
${xml || ""}
"""
用户输入:
"""md
${safeUserText}
"""
渲染模式: ${outputMode === "svg" ? "svg" : "drawio-xml"}`;
    // 转换为 AI SDK 统一消息格式，便于后续直接传给模型
    const modelMessages = convertToModelMessages(messages);
    // sanitizeContent：保证空字符串/空附件不会让模型报错，必要时注入中文占位
    const sanitizeContent = (content) => {
      const placeholder = "（空内容占位，防止空文本导致错误）";
      if (typeof content === "string") {
        return content.trim().length > 0 ? content : placeholder;
      }
      if (Array.isArray(content)) {
        let hasText = false;
        const mapped = content.map((part) => {
          if (part?.type === "text") {
            const txt = typeof part.text === "string" ? part.text.trim() : "";
            hasText = true;
            return {
              ...part,
              text: txt.length > 0 ? part.text : placeholder
            };
          }
          return part;
        });
        if (!hasText) {
          mapped.push({ type: "text", text: placeholder });
        }
        return mapped;
      }
      if (content == null || content === false) {
        return placeholder;
      }
      return content;
    };
    // 为除 tool 角色外的消息套用占位策略，避免模型遇到空内容
    let enhancedMessages = modelMessages.map((msg) => {
      if (msg.role === "tool") {
        return msg;
      }
      const safeContent = sanitizeContent(msg.content);
      return { ...msg, content: safeContent };
    });
    if (enhancedMessages.length >= 1) {
      const lastModelMessage = enhancedMessages[enhancedMessages.length - 1];
      if (lastModelMessage.role === "user") {
        // 将 “当前 XML + 用户输入 + 附件” 合并成结构化内容供模型理解
        const contentParts = [
          { type: "text", text: formattedTextContent }
        ];
        for (const filePart of fileParts) {
          contentParts.push({
            type: "image",
            image: filePart.url,
            mimeType: filePart.mediaType
          });
        }
        enhancedMessages = [
          ...enhancedMessages.slice(0, -1),
          { ...lastModelMessage, content: contentParts }
        ];
      }
    }
    // 根据当前 runtime 解析出真正的模型 ID、baseUrl 与 provider 元信息
    // 如果使用系统模型，resolvedModel 已经在前面解析过了
    // 否则使用 finalModelRuntime（可能是客户端配置或服务器端配置）
    if (!resolvedModel) {
      resolvedModel = resolveChatModel(finalModelRuntime);
    }
    // 调试日志：记录配置和消息信息
    console.log("Enhanced messages:", enhancedMessages, "model:", resolvedModel.id);
    console.log("Model runtime config:", {
      modelId: resolvedModel.id,
      isSystemModel: isUsingSystemModel,
      baseUrl: isUsingSystemModel ? "[系统配置]" : finalModelRuntime?.baseUrl,
      hasApiKey: isUsingSystemModel ? true : !!finalModelRuntime?.apiKey,
      enableStreaming: enableStreaming ?? true,
      renderMode: outputMode,
      isContinuation: isContinuation || false,
      isServerConfig: !!accessPassword
    });
    // 记录耗时，用于日志 & metadata；并统一配置模型调用参数
    const startTime = Date.now();
    const useStreaming = enableStreaming ?? true;
    
    // ========== 定义工具配置 ==========
    // 只有在支持工具调用时才定义 tools
    const toolsConfig = supportsToolCalls ? (outputMode === "svg" ? {
      display_svg: {
        description: `在画布上显示 SVG 图表。返回一个完整的自包含 SVG（不要流式输出部分内容）。

**SVG 要求：**
- 必须包含 width/height 或 viewBox，尺寸约为 800x600
- 禁止使用外部资源、脚本或事件处理器
- 使用安全的内联样式
- 所有元素保持在视口内`,
        inputSchema: z.object({
          svg: z.string().describe("完整的自包含 SVG 标记，尺寸适合单一视口，无外部资源、脚本或事件处理器")
        })
      }
    } : {
      // 客户端工具，将在客户端执行
      display_diagram: {
        description: `在 draw.io 画布上显示图表。只需传入 <root> 标签内的节点（包括 <root> 标签本身）。

**关键 XML 语法要求：**

1. **必需的根结构：**
<root>
  <mxCell id="0" />
  <mxCell id="1" parent="0" />
  <!-- 你的图表元素从这里开始 -->
</root>

2. **特殊字符必须转义：**
- & → &amp;
- < → &lt;
- > → &gt;
- " → &quot;

3. **样式格式（严格）：**
- 必须以分号结尾
- 等号两侧不能有空格
- 示例: style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"

4. **必需属性：**
- 每个 mxCell: id, parent（id="0" 除外）
- 每个 mxGeometry: as="geometry"
- 自闭合标签: /> 前有空格

5. **节点示例：**
<mxCell id="2" value="我的节点" style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontFamily=Arial;fontSize=11;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="120" height="60" as="geometry" />
</mxCell>

6. **连接线示例：**
<mxCell id="5" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;endArrow=block;endFill=1;" edge="1" parent="1" source="2" target="3">
  <mxGeometry relative="1" as="geometry" />
</mxCell>

**常见错误（避免）：**
❌ <mxCell value="用户 & 管理员"/> → 使用 &amp;
❌ <mxCell value="x < 10"/> → 使用 &lt;
❌ style="rounded=1" → 缺少结尾分号
❌ <mxGeometry x="10" y="20"/> → 缺少 as="geometry"
❌ <mxCell id="2" vertex="1" parent="1"/> → 缺少 <mxGeometry>

**输出前检查清单：**
✓ 根元素 id="0" 和 id="1" 存在
✓ 所有特殊字符已转义
✓ 所有样式以分号结尾
✓ 所有 ID 唯一
✓ 所有元素有 parent（id="0" 除外）
✓ 所有 mxGeometry 有 as="geometry"
✓ 所有标签正确闭合
✓ 每个节点包含 fontFamily=Arial;

**重要：** 图表将实时渲染到 draw.io 画布。`,
        inputSchema: z.object({
          xml: z.string().describe("格式良好的 XML 字符串，遵循上述所有语法规则，将显示在 draw.io 上")
        })
      },
      edit_diagram: {
        description: `通过精确匹配和替换来编辑当前图表的特定部分。使用此工具进行局部修改，无需重新生成整个 XML。

**重要：保持编辑简洁：**
- 只包含需要更改的行，加上 1-2 行上下文（如需要）
- 将大的更改拆分为多个小的编辑
- 每个 search 必须包含完整的行（不要截断到行中间）
- 只匹配第一个 - 确保足够具体以定位正确的元素`,
        inputSchema: z.object({
          edits: z.array(z.object({
            search: z.string().describe("要搜索的精确行（包括空格和缩进）"),
            replace: z.string().describe("替换内容")
          })).describe("按顺序应用的搜索/替换对数组")
        })
      },
      // 模板搜索工具：让 LLM 自主决定是否需要使用模板
      search_template: {
        description: `搜索并获取适合当前需求的图表模板，获取专业的绘图指导和配色方案。

**仅在以下情况使用此工具：**
1. 用户明确要求"使用模板"或"参考模板"
2. 需要创建全新的复杂图表且当前画布为空
3. 用户描述的图表类型有明确的最佳实践（如：技术路线图、实验流程图、架构图等）

**不要在以下情况使用：**
- 用户要求修改现有图表的内容、颜色、布局等
- 简单的图表调整请求
- 当前画布已有内容，且用户要求在此基础上继续完善
- 用户只是询问问题而非要求绘图

**工具返回内容：**
- 模板的详细绘图指导
- 推荐的配色方案
- 布局和结构建议
- 示例节点样式

调用此工具后，请根据返回的模板指导生成图表。`,
        inputSchema: z.object({
          query: z.string().describe("用户的绘图需求描述，用于匹配最合适的模板"),
          templateType: z.string().optional().describe("期望的模板类型，可选值：process（流程图）、structure（架构图）、schematic（示意图）、comparison（对比图）、timeline（时间线）")
        })
      }
    }) : undefined; // 不支持工具调用时不传递 tools
    
    const commonConfig = {
      // model: google("gemini-2.5-flash-preview-05-20"),
      // model: google("gemini-2.5-pro"),
      system: systemMessage,
      model: resolvedModel.model,
      // model: model,
      // providerOptions: {
      //   google: {
      //     thinkingConfig: {
      //       thinkingBudget: 128,
      //     },
      //   }
      // },
      // providerOptions: {
      //   openai: {
      //     reasoningEffort: "minimal"
      //   },
      // },
      messages: enhancedMessages,
      abortSignal,
      // 传递 AbortSignal 以支持取消请求
      // tools：严格定义当前模式下允许的工具，保障前端解析一致
      // 当不支持工具调用时，tools 为 undefined，不会传递给模型
      ...(toolsConfig && { tools: toolsConfig }),
      temperature: 0
    };
    // ========== 不支持工具调用的特殊处理 ==========
    // 当模型不支持工具调用时，强制使用非流式响应，因为我们需要解析完整的文本响应
    const actualUseStreaming = supportsToolCalls ? (enableStreaming ?? true) : false;
    
    if (!supportsToolCalls) {
      console.log("模型不支持工具调用，使用非流式响应并解析 JSON 格式的文本输出");
    }
    
    if (actualUseStreaming && supportsToolCalls) {
      // 流式输出：直接借助 AI SDK 的 streamText + toUIMessageStreamResponse
      // 仅在支持工具调用时使用流式输出
      const result = await streamText(commonConfig);
      return result.toUIMessageStreamResponse({
        onError: errorHandler,
        // 在流式响应结束时添加 token 使用信息到 message metadata
        onFinish: async ({ responseMessage, messages: messages2, finishReason }) => {
          const endTime = Date.now();
          const durationMs = endTime - startTime;
          const usage = await result.usage;
          const totalUsage = await result.totalUsage;
          
          // 判断任务是否成功完成
          // finishReason 为 'stop' 或 'tool-calls' 表示正常完成
          // 其他情况（如 'length'、'error'、'cancelled' 等）表示任务未正常完成
          const isTaskCompleted = finishReason === 'stop' || finishReason === 'tool-calls';
          
          console.log("Stream finished:", {
            usage: {
              inputTokens: usage.inputTokens,
              outputTokens: usage.outputTokens,
              totalTokens: (usage.inputTokens || 0) + (usage.outputTokens || 0)
            },
            totalUsage: {
              inputTokens: totalUsage.inputTokens,
              outputTokens: totalUsage.outputTokens,
              totalTokens: (totalUsage.inputTokens || 0) + (totalUsage.outputTokens || 0)
            },
            durationMs,
            finishReason,
            isTaskCompleted
          });
          
          // ========== 光子扣费 ==========
          // 在 AI 生成完成后进行光子扣费
          // 使用 totalUsage 进行扣费，因为它包含了整个对话的 token 使用量
          // 传入 isTaskCompleted 参数，用于区分固定费用和 token 费用的收取逻辑
          await chargePhotonIfEnabled(req, {
            inputTokens: totalUsage.inputTokens,
            outputTokens: totalUsage.outputTokens,
            totalTokens: (totalUsage.inputTokens || 0) + (totalUsage.outputTokens || 0)
          }, isTaskCompleted);
        },
        // 提取 metadata 发送到客户端
        messageMetadata: ({ part }) => {
          if (part.type === "finish") {
            return {
              usage: {
                inputTokens: part.totalUsage?.inputTokens || 0,
                outputTokens: part.totalUsage?.outputTokens || 0,
                totalTokens: (part.totalUsage?.inputTokens || 0) + (part.totalUsage?.outputTokens || 0)
              },
              durationMs: Date.now() - startTime
            };
          }
          if (part.type === "finish-step") {
            return {
              usage: {
                inputTokens: part.usage?.inputTokens || 0,
                outputTokens: part.usage?.outputTokens || 0,
                totalTokens: (part.usage?.inputTokens || 0) + (part.usage?.outputTokens || 0)
              },
              durationMs: Date.now() - startTime
            };
          }
          return void 0;
        }
      });
    } else {
      // 非流式输出：一次性生成后，手工拼装 SSE 事件
      const result = await generateText(commonConfig);
      const endTime = Date.now();
      const durationMs = endTime - startTime;
      
      // ========== 不支持工具调用时解析文本响应 ==========
      // 从文本响应中提取 JSON 格式的操作指令
      let parsedToolCalls = [];
      let textOutput = result.text || "";
      
      if (!supportsToolCalls && result.text) {
        console.log("尝试从文本响应中解析操作指令...");
        const parsedAction = parseTextResponseToAction(result.text);
        
        if (parsedAction) {
          console.log("成功解析操作指令:", {
            action: parsedAction.action,
            hasParams: !!parsedAction.params
          });
          
          // 将解析的操作转换为工具调用格式
          const toolCall = actionToToolCall(parsedAction);
          parsedToolCalls.push(toolCall);
          
          // 对于不支持工具调用的情况，不输出原始文本
          // 因为原始文本是 JSON 格式，用户不需要看到
          textOutput = "";
        } else {
          console.warn("无法从文本响应中解析操作指令，将原样返回文本");
        }
      }
      
      // 合并原生工具调用和解析出的工具调用
      const allToolCalls = [
        ...(result.toolCalls || []),
        ...parsedToolCalls
      ];
      
      // 判断任务是否成功完成
      // finishReason 为 'stop' 或 'tool-calls' 表示正常完成
      // 对于不支持工具调用的模型，如果成功解析出操作指令，也认为是成功完成
      const hasToolCalls = allToolCalls.length > 0;
      const isTaskCompleted = result.finishReason === 'stop' || result.finishReason === 'tool-calls' || hasToolCalls;
      
      console.log("Generation finished (non-streaming):", {
        usage: {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: (result.usage.inputTokens || 0) + (result.usage.outputTokens || 0)
        },
        durationMs,
        toolCalls: allToolCalls.length,
        parsedFromText: parsedToolCalls.length,
        finishReason: result.finishReason,
        isTaskCompleted,
        supportsToolCalls
      });
      
      // ========== 光子扣费 ==========
      // 在 AI 生成完成后进行光子扣费
      // 传入 isTaskCompleted 参数，用于区分固定费用和 token 费用的收取逻辑
      await chargePhotonIfEnabled(req, {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        totalTokens: (result.usage.inputTokens || 0) + (result.usage.outputTokens || 0)
      }, isTaskCompleted);
      
      // 手动构建 UI Message Stream 的事件顺序
      const chunks = [];
      const messageId = `msg-${Date.now()}`;
      chunks.push({
        type: "start",
        messageId,
        messageMetadata: {
          usage: {
            inputTokens: result.usage.inputTokens || 0,
            outputTokens: result.usage.outputTokens || 0,
            totalTokens: (result.usage.inputTokens || 0) + (result.usage.outputTokens || 0)
          },
          durationMs
        }
      });
      // 只有在有文本输出且不是 JSON 操作指令时才输出文本
      if (textOutput && textOutput.length > 0) {
        chunks.push({ type: "text-start", id: messageId });
        chunks.push({ type: "text-delta", id: messageId, delta: textOutput });
        chunks.push({ type: "text-end", id: messageId });
      }
      // 输出所有工具调用（包括原生的和解析出的）
      if (allToolCalls.length > 0) {
        for (const toolCall of allToolCalls) {
          chunks.push({
            type: "tool-input-available",
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.toolName,
            input: toolCall.input
            // 注意这里使用 input 而不是 args
          });
        }
      }
      // 如果成功解析出工具调用，修改 finishReason 为 'tool-calls'
      const finalFinishReason = (parsedToolCalls.length > 0 && result.finishReason === 'stop') 
        ? 'tool-calls' 
        : result.finishReason;
      
      chunks.push({
        type: "finish",
        finishReason: finalFinishReason,
        messageMetadata: {
          usage: {
            inputTokens: result.usage.inputTokens || 0,
            outputTokens: result.usage.outputTokens || 0,
            totalTokens: (result.usage.inputTokens || 0) + (result.usage.outputTokens || 0)
          },
          durationMs,
          finishReason: finalFinishReason
        }
      });
      const stream = new ReadableStream({
        start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(chunk);
          }
          controller.close();
        }
      });
      return createUIMessageStreamResponse({
        stream,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });
    }
  } catch (error) {
    // ========== 顶层错误处理 ==========
    // 捕获所有在流式响应创建之前发生的错误，例如：
    // - 请求体 JSON 解析失败
    // - 配置验证错误
    // - 其他未预期的异常
    // 
    // 注意：流式响应内部的错误已在流创建时处理，这里只处理流创建之前的错误
    console.error("Error in chat route:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? error.stack : void 0;
    console.error("Error details:", { errorMessage, errorDetails });
    return Response.json(
      {
        error: "内部服务器错误",
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { details: errorDetails })
      },
      { status: 500 } // 500 Internal Server Error: 服务器内部错误
    );
  }
}
export { POST };
