import { NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-client';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, CONTINUATION_SYSTEM_PROMPT } from '@/lib/prompts';

/**
 * POST /api/generate
 * 基于用户输入生成 Excalidraw 图表
 */
export async function POST(request) {
  try {
    const { config, userInput, chartType, isContinuation } = await request.json();
    const accessPassword = request.headers.get('x-access-password');

    // Check if using server-side config with access password
    let finalConfig = config;
    if (accessPassword) {
      const envPassword = process.env.ACCESS_PASSWORD;
      if (!envPassword) {
        return NextResponse.json(
          { error: 'The server is not configured with an access password' },
          { status: 400 }
        );
      }
      if (accessPassword !== envPassword) {
        return NextResponse.json(
          { error: 'Incorrect access password' },
          { status: 401 }
        );
      }
      // 使用服务端配置
      finalConfig = {
        type: process.env.SERVER_LLM_TYPE,
        baseUrl: process.env.SERVER_LLM_BASE_URL,
        apiKey: process.env.SERVER_LLM_API_KEY,
        model: process.env.SERVER_LLM_MODEL,
      };
      if (!finalConfig.type || !finalConfig.apiKey) {
        return NextResponse.json(
          { error: 'Server LLM configuration incomplete' },
          { status: 500 }
        );
      }
    } else if (!config || !userInput) {
      return NextResponse.json(
        { error: 'Missing required parameters: config, userInput' },
        { status: 400 }
      );
    }

    let userMessage;

    console.log('[DEBUG] Received userInput:', {
      type: typeof userInput,
      hasImage: !!userInput?.image,
      imageDataLength: userInput?.image?.data?.length,
      mimeType: userInput?.image?.mimeType
    });

    // 处理不同的输入类型
    if (typeof userInput === 'object' && userInput.image) {
      // 检查模型是否支持视觉
      const model = finalConfig.model.toLowerCase();
      const supportsVision =
        model.includes('vision') ||
        model.includes('gpt-4o') ||
        model.includes('gpt-4-turbo') ||
        model.includes('claude-3') ||
        model.includes('claude-sonnet') ||
        model.includes('claude-opus') ||
        model.includes('claude-haiku') ||
        model.includes('vl');

      console.log('[DEBUG] API Configuration:', {
        type: finalConfig.type,
        baseUrl: finalConfig.baseUrl,
        model: finalConfig.model,
        supportsVision: supportsVision
      });

      if (!supportsVision) {
        return NextResponse.json(
          { error: 'The current model does not support image input. Please use a model that supports vision (such as gpt-4o, gpt-4-vision-preview, claude-3-opus, claude-3-sonnet, claude-sonnet-4, qwen-vl, etc)' },
          { status: 400 }
        );
      }

      // 多模态输入（文本+图片）
      const { text, image } = userInput;
      userMessage = {
        role: 'user',
        content: USER_PROMPT_TEMPLATE(text, chartType),
        image: {
          data: image.data,
          mimeType: image.mimeType
        }
      };

      console.log('[DEBUG] Built userMessage:', {
        hasImage: !!userMessage?.image,
        imageDataLength: userMessage?.image?.data?.length,
        mimeType: userMessage?.image?.mimeType
      });
    } else {
      // 纯文本输入
      userMessage = {
        role: 'user',
        content: USER_PROMPT_TEMPLATE(userInput, chartType)
      };
    }

    // 基于是否是继续对话，选择合适的系统 Prompt
    const systemPrompt = isContinuation ? CONTINUATION_SYSTEM_PROMPT : SYSTEM_PROMPT;

    // 调试：输出系统 Prompt 摘要
    console.log('[DEBUG] System Prompt Info:', {
      type: isContinuation ? 'CONTINUATION' : 'SYSTEM',
      length: systemPrompt.length,
      firstLine: systemPrompt.split('\n')[0],
      hasMetaStructure: systemPrompt.includes('## 任务') || systemPrompt.includes('## Task')
    });

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      userMessage
    ];

    // 调试：输出消息结构
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

    // 为 SSE 创建一个可读流
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        
        // 安全地 enqueue 数据
        const safeEnqueue = (data) => {
          try {
            if (!isClosed) {
              controller.enqueue(encoder.encode(data));
            }
          } catch (error) {
            // Controller 可能已经关闭（客户端断开连接等）
            if (error.message && error.message.includes('closed')) {
              isClosed = true;
            } else {
              console.error('Error enqueueing data:', error);
            }
          }
        };
        
        // 安全地关闭 controller
        const safeClose = () => {
          try {
            if (!isClosed) {
              controller.close();
              isClosed = true;
            }
          } catch (error) {
            // Controller 已经关闭，忽略错误
            isClosed = true;
          }
        };
        
        try {
          await callLLM(finalConfig, fullMessages, (chunk) => {
            // 检查是否已关闭
            if (isClosed) return;
            
            // 将每个数据块以 SSE 格式发送
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
            safeEnqueue(data);
          });

          // 发送完成信号
          if (!isClosed) {
            safeEnqueue('data: [DONE]\n\n');
            safeClose();
          }
        } catch (error) {
          console.error('Error in stream:', error);
          
          // 只有在 controller 未关闭时才发送错误
          if (!isClosed) {
            // 以 SSE 数据形式发送错误
            const errorData = `data: ${JSON.stringify({ error: error.message || 'Generation failed. Please check your configuration and network connection' })}\n\n`;
            safeEnqueue(errorData);
            safeClose();
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error generating code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate code' },
      { status: 500 }
    );
  }
}

