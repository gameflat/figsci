/**
 * Draw.io 图表代码生成 API 路由
 * 
 * 此路由是应用的核心 API 端点，负责根据用户输入生成符合顶级学术会议标准的 draw.io 图表 XML 代码。
 * 
 * 主要功能：
 * - 支持文本输入和图片输入（多模态）
 * - 支持两种配置方式：客户端配置和服务器端配置（通过访问密码）
 * - 支持续写功能：当生成的代码被截断时，可以继续完成剩余部分
 * - 使用流式响应（SSE）实时返回生成结果，提供更好的用户体验
 * 
 * @file app/api/generate/route.js
 * @description Next.js API 路由处理器，处理 POST 请求进行图表代码生成
 */

import { NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-client';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, CONTINUATION_SYSTEM_PROMPT } from '@/lib/prompts';

/**
 * 处理图表代码生成的 POST 请求
 * 
 * 接收用户输入（文本或图片），调用 LLM 生成符合学术标准的 draw.io XML 代码，
 * 并通过 Server-Sent Events (SSE) 流式返回生成结果。
 * 
 * 支持的配置方式：
 * 1. **客户端配置**：客户端在请求体中提供完整的 LLM 配置信息
 * 2. **服务器端配置**：客户端通过 `x-access-password` 请求头提供访问密码，
 *    服务器使用环境变量中的配置（适用于共享部署场景）
 * 
 * 支持的输入类型：
 * - **文本输入**：纯文本描述，支持所有图表类型
 * - **图片输入**：图片 + 文本描述，需要模型支持视觉能力（vision）
 * 
 * 支持的响应格式：
 * - **流式响应（SSE）**：正常情况下返回流式数据，实时传输生成内容
 * - **JSON 错误响应**：发生错误时返回 JSON 格式的错误信息
 * 
 * 支持的响应状态码：
 * - 200: 流式响应成功启动（正常情况）
 * - 400: 请求参数错误（缺少必需参数、模型不支持 vision 等）
 * - 401: 访问密码错误（服务器端配置模式下）
 * - 500: 服务器内部错误（配置不完整、LLM 调用失败等）
 * 
 * @param {Request} request - Next.js 请求对象，包含：
 *   - 请求体（JSON）：
 *     - config: LLM 配置对象（客户端配置模式下必需）
 *     - userInput: 用户输入（文本字符串或包含图片的对象）
 *     - chartType: 图表类型（如 'auto', 'flowchart', 'architecture' 等）
 *     - isContinuation: 是否为续写请求（布尔值，可选）
 *   - 请求头：
 *     - x-access-password: 访问密码（服务器端配置模式下使用）
 * @returns {Promise<Response>} 返回流式响应（SSE）或 JSON 错误响应
 * 
 * @example
 * // 客户端配置模式 - 文本输入
 * POST /api/generate
 * {
 *   "config": {
 *     "type": "openai",
 *     "baseUrl": "https://api.openai.com/v1",
 *     "apiKey": "sk-...",
 *     "model": "gpt-4"
 *   },
 *   "userInput": "画一个简单的流程图，包含开始、处理、结束三个步骤",
 *   "chartType": "flowchart"
 * }
 * 
 * @example
 * // 服务器端配置模式 - 图片输入
 * POST /api/generate
 * Headers: { "x-access-password": "your-password" }
 * {
 *   "config": null,
 *   "userInput": {
 *     "text": "根据这个图片生成对应的架构图",
 *     "image": {
 *       "data": "data:image/png;base64,iVBORw0KG...",
 *       "mimeType": "image/png"
 *     }
 *   },
 *   "chartType": "architecture"
 * }
 * 
 * @example
 * // 续写请求
 * POST /api/generate
 * {
 *   "config": {...},
 *   "userInput": "续写代码...", // 使用 createContinuationPrompt 生成
 *   "chartType": "auto",
 *   "isContinuation": true
 * }
 */
export async function POST(request) {
  try {
    // 从请求体中解析所有参数
    // config: LLM 提供商配置（客户端配置模式下必需）
    // userInput: 用户输入内容（文本字符串或包含图片的对象）
    // chartType: 图表类型（如 'auto', 'flowchart', 'architecture' 等）
    // isContinuation: 是否为续写请求，用于选择不同的系统提示词
    const { config, userInput, chartType, isContinuation } = await request.json();
    
    // 从请求头获取访问密码（用于服务器端配置模式）
    // 如果提供了访问密码，将使用服务器环境变量中的配置，而不是客户端配置
    const accessPassword = request.headers.get('x-access-password');

    // ========== 配置处理逻辑 ==========
    // 支持两种配置模式：客户端配置和服务器端配置
    
    // 初始化最终使用的配置，默认为客户端配置
    let finalConfig = config;
    
    // 如果提供了访问密码，使用服务器端配置模式
    if (accessPassword) {
      // 从环境变量获取服务器配置的访问密码
      // ACCESS_PASSWORD 应在 .env.local 或部署环境中配置
      const envPassword = process.env.ACCESS_PASSWORD;
      
      // 检查服务器是否配置了访问密码
      if (!envPassword) {
        return NextResponse.json(
          { error: '服务器未配置访问密码' },
          { status: 400 } // 400 Bad Request: 服务器配置错误
        );
      }
      
      // 验证访问密码是否正确
      if (accessPassword !== envPassword) {
        return NextResponse.json(
          { error: '访问密码错误' },
          { status: 401 } // 401 Unauthorized: 未授权访问
        );
      }
      
      // 使用服务器端环境变量中的 LLM 配置
      // 这种方式适用于共享部署，用户只需提供密码即可使用服务器配置的 LLM
      finalConfig = {
        type: process.env.SERVER_LLM_TYPE,           // 提供商类型（如 'openai', 'anthropic'）
        baseUrl: process.env.SERVER_LLM_BASE_URL,    // API 基础 URL
        apiKey: process.env.SERVER_LLM_API_KEY,      // API 密钥
        model: process.env.SERVER_LLM_MODEL,         // 模型名称
      };
      
      // 验证服务器端配置是否完整
      // type 和 apiKey 是必需的，缺少任意一个都无法调用 LLM API
      if (!finalConfig.type || !finalConfig.apiKey) {
        return NextResponse.json(
          { error: '服务器LLM配置不完整' },
          { status: 500 } // 500 Internal Server Error: 服务器配置不完整
        );
      }
    } else {
      // 客户端配置模式：验证必需的参数
      // 如果未提供访问密码，则必须提供客户端配置和用户输入
      if (!config || !userInput) {
        return NextResponse.json(
          { error: 'Missing required parameters: config, userInput' },
          { status: 400 } // 400 Bad Request: 缺少必需参数
        );
      }
    }

    // ========== 构建消息数组 ==========
    // 准备发送给 LLM 的消息内容，支持文本输入和图片输入（多模态）
    
    let userMessage; // 用户消息对象，包含角色和内容

    // 调试日志：记录接收到的用户输入信息
    console.log('[DEBUG] Received userInput:', {
      type: typeof userInput,
      hasImage: !!userInput?.image,
      imageDataLength: userInput?.image?.data?.length,
      mimeType: userInput?.image?.mimeType
    });

    // ========== 处理不同的输入类型 ==========
    // 支持两种输入类型：纯文本输入和图片+文本输入（多模态）
    
    if (typeof userInput === 'object' && userInput.image) {
      // 图片输入模式：用户提供了图片和文本描述
      
      // 检查当前配置的模型是否支持视觉能力（vision）
      // 通过模型名称判断，支持 vision 的模型包括：
      // - OpenAI: gpt-4o, gpt-4-turbo, gpt-4-vision-preview
      // - Anthropic: claude-3 系列（claude-3-opus, claude-3-sonnet, claude-3-haiku 等）
      // - 其他: 包含 'vision' 或 'vl' 关键词的模型
      const model = finalConfig.model.toLowerCase();
      const supportsVision =
        model.includes('vision') ||           // 通用 vision 关键词
        model.includes('gpt-4o') ||           // GPT-4o 系列
        model.includes('gpt-4-turbo') ||      // GPT-4 Turbo 系列
        model.includes('claude-3') ||         // Claude 3 系列
        model.includes('claude-sonnet') ||    // Claude Sonnet 系列
        model.includes('claude-opus') ||      // Claude Opus 系列
        model.includes('claude-haiku') ||     // Claude Haiku 系列
        model.includes('vl');                 // Vision Language 模型关键词

      // 调试日志：记录 API 配置和 vision 支持情况
      console.log('[DEBUG] API Configuration:', {
        type: finalConfig.type,
        baseUrl: finalConfig.baseUrl,
        model: finalConfig.model,
        supportsVision: supportsVision
      });

      // 如果模型不支持 vision，返回错误提示
      if (!supportsVision) {
        return NextResponse.json(
          { error: '当前模型不支持图片输入，请使用支持vision的模型（如 gpt-4o, gpt-4-vision-preview, claude-3-opus, claude-3-sonnet, claude-sonnet-4, qwen3-vl-30b-a3b-instruct 等）' },
          { status: 400 } // 400 Bad Request: 模型不支持该功能
        );
      }

      // 构建包含图片的用户消息
      // userInput 对象应包含：
      // - text: 文本描述
      // - image: 图片对象，包含 data（base64 编码）和 mimeType（如 'image/png'）
      const { text, image } = userInput;
      userMessage = {
        role: 'user', // 消息角色为 'user'
        content: USER_PROMPT_TEMPLATE(text, chartType), // 使用模板格式化用户文本输入
        image: {
          data: image.data,       // 图片的 base64 编码数据
          mimeType: image.mimeType // 图片的 MIME 类型（如 'image/png', 'image/jpeg'）
        }
      };

      // 调试日志：记录构建后的用户消息信息
      console.log('[DEBUG] Built userMessage:', {
        hasImage: !!userMessage?.image,
        imageDataLength: userMessage?.image?.data?.length,
        mimeType: userMessage?.image?.mimeType
      });
    } else {
      // 纯文本输入模式：用户只提供了文本描述
      userMessage = {
        role: 'user', // 消息角色为 'user'
        content: USER_PROMPT_TEMPLATE(userInput, chartType) // 使用模板格式化用户文本输入
        // 注意：userInput 在此处是字符串类型
      };
    }

    // ========== 选择系统提示词 ==========
    // 根据 isContinuation 标志选择不同的系统提示词：
    // - 正常生成：使用 SYSTEM_PROMPT（完整的图表生成规范）
    // - 续写请求：使用 CONTINUATION_SYSTEM_PROMPT（专门用于续写被截断的代码）
    const systemPrompt = isContinuation ? CONTINUATION_SYSTEM_PROMPT : SYSTEM_PROMPT;

    // 调试日志：输出系统提示词的摘要信息
    // 用于开发调试，了解当前使用的提示词类型和内容
    console.log('[DEBUG] System Prompt Info:', {
      type: isContinuation ? 'CONTINUATION' : 'SYSTEM',
      length: systemPrompt.length,
      firstLine: systemPrompt.split('\n')[0],
      hasMetaStructure: systemPrompt.includes('## 任务') || systemPrompt.includes('## Task')
    });

    // ========== 构建完整的消息数组 ==========
    // 消息数组包含系统提示词和用户消息，符合 OpenAI/Anthropic API 的消息格式
    const fullMessages = [
      { role: 'system', content: systemPrompt }, // 系统提示词：定义 LLM 的行为和输出格式
      userMessage                                  // 用户消息：包含实际的输入内容（文本或图片+文本）
    ];

    // 调试日志：输出完整的消息结构信息
    // 用于开发调试，验证消息格式是否正确
    console.log('[DEBUG] Messages Structure:', {
      totalMessages: fullMessages.length,
      systemRole: fullMessages[0].role,
      systemContentLength: fullMessages[0].content.length,
      systemContentPreview: fullMessages[0].content.substring(0, 150) + '...',
      userRole: fullMessages[1].role,
      userContentType: typeof fullMessages[1].content,
      userContentPreview: typeof fullMessages[1].content === 'string'
        ? fullMessages[1].content.substring(0, 100)
        : '[Multimodal content]'
    });

    // ========== 创建流式响应（Server-Sent Events, SSE）==========
    // 使用 SSE 技术实现流式传输，允许服务器实时推送生成内容给客户端
    // 相比传统的请求-响应模式，流式响应可以：
    // 1. 实时显示生成进度，提升用户体验
    // 2. 减少首字节时间（TTFB），更快响应
    // 3. 支持长文本生成，不需要等待完整响应
    
    const encoder = new TextEncoder(); // 用于将字符串编码为 UTF-8 字节流
    
    // 创建可读流（ReadableStream）用于 SSE 传输
    const stream = new ReadableStream({
      async start(controller) {
        // 标记流是否已关闭，防止重复关闭或写入已关闭的流
        let isClosed = false;

        // 辅助函数：安全地向流中写入数据
        // 确保在流已关闭时不会尝试写入，避免错误
        const safeEnqueue = (data) => {
          if (!isClosed) {
            try {
              controller.enqueue(data); // 将数据添加到流的队列中
            } catch (error) {
              // 如果写入失败（例如流已关闭），记录错误并标记流为已关闭
              console.error('Failed to enqueue data:', error);
              isClosed = true;
            }
          }
        };

        try {
          // 调用 LLM API，使用流式模式获取生成结果
          // callLLM 函数的第三个参数是一个回调函数，每当收到新的内容块时会被调用
          const result = await callLLM(finalConfig, fullMessages, (chunk) => {
            // 将每个内容块格式化为 SSE 格式并发送
            // SSE 格式：每行以 "data: " 开头，后跟 JSON 数据，以两个换行符结尾
            // 格式：data: {"content": "chunk"}\n\n
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
            safeEnqueue(encoder.encode(data)); // 编码并写入流
          });

          // 验证 LLM 返回的结果是否为空
          // 空响应可能表示模型配置错误、网络问题或模型本身的问题
          if (!result || result.trim().length === 0) {
            throw new Error('LLM 返回了空响应，请检查模型配置或重试');
          }

          // 发送完成信号，告诉客户端流式传输已完成
          // SSE 标准约定使用 "data: [DONE]\n\n" 作为结束标记
          safeEnqueue(encoder.encode('data: [DONE]\n\n'));
          
          // 关闭流，释放资源
          if (!isClosed) {
            controller.close();
            isClosed = true;
          }
        } catch (error) {
          // 捕获 LLM 调用过程中的所有错误
          console.error('Error in stream:', error);
          
          // 将错误信息作为 SSE 数据发送给客户端
          // 客户端可以根据错误信息显示给用户或进行重试
          const errorData = `data: ${JSON.stringify({ error: error.message || '生成失败，请检查配置和网络连接' })}\n\n`;
          safeEnqueue(encoder.encode(errorData));
          
          // 发送完成信号（即使发生错误也要发送，以便客户端知道流已结束）
          safeEnqueue(encoder.encode('data: [DONE]\n\n'));
          
          // 关闭流
          if (!isClosed) {
            controller.close();
            isClosed = true;
          }
        }
      },
    });

    // 返回 SSE 响应
    // 设置必要的响应头以支持 Server-Sent Events
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream', // SSE 的 MIME 类型
        'Cache-Control': 'no-cache',          // 禁止缓存，确保实时数据
        'Connection': 'keep-alive',           // 保持连接，支持长连接
      },
    });
  } catch (error) {
    // ========== 顶层错误处理 ==========
    // 捕获所有在流式响应创建之前发生的错误，例如：
    // - 请求体 JSON 解析失败
    // - 配置验证错误
    // - 其他未预期的异常
    // 
    // 注意：流式响应内部的错误已在流创建时处理，这里只处理流创建之前的错误
    
    console.error('Error generating code:', error);
    
    // 返回 JSON 格式的错误响应（非流式）
    // 这种情况通常发生在请求处理的前期阶段，尚未创建流式响应
    return NextResponse.json(
      { error: error.message || 'Failed to generate code' },
      { status: 500 } // 500 Internal Server Error: 服务器内部错误
    );
  }
}

