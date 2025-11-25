import { NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-client';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, CONTINUATION_SYSTEM_PROMPT } from '@/lib/prompts';

/**
 * POST /api/generate
 * Generate Draw.io diagram based on user input
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
          { error: '服务器未配置访问密码' },
          { status: 400 }
        );
      }
      if (accessPassword !== envPassword) {
        return NextResponse.json(
          { error: '访问密码错误' },
          { status: 401 }
        );
      }
      // Use server-side config
      finalConfig = {
        type: process.env.SERVER_LLM_TYPE,
        baseUrl: process.env.SERVER_LLM_BASE_URL,
        apiKey: process.env.SERVER_LLM_API_KEY,
        model: process.env.SERVER_LLM_MODEL,
      };
      if (!finalConfig.type || !finalConfig.apiKey) {
        return NextResponse.json(
          { error: '服务器LLM配置不完整' },
          { status: 500 }
        );
      }
    } else if (!config || !userInput) {
      return NextResponse.json(
        { error: 'Missing required parameters: config, userInput' },
        { status: 400 }
      );
    }

    // Build messages array
    let userMessage;

    console.log('[DEBUG] Received userInput:', {
      type: typeof userInput,
      hasImage: !!userInput?.image,
      imageDataLength: userInput?.image?.data?.length,
      mimeType: userInput?.image?.mimeType
    });

    // Handle different input types
    if (typeof userInput === 'object' && userInput.image) {
      // Check if model supports vision
      const model = finalConfig.model.toLowerCase();
      const supportsVision =
        model.includes('vision') ||
        model.includes('gpt-4o') ||
        model.includes('gpt-4-turbo') ||
        model.includes('claude-3') ||
        model.includes('claude-sonnet') ||
        model.includes('claude-opus') ||
        model.includes('claude-haiku');

      console.log('[DEBUG] API Configuration:', {
        type: finalConfig.type,
        baseUrl: finalConfig.baseUrl,
        model: finalConfig.model,
        supportsVision: supportsVision
      });

      if (!supportsVision) {
        return NextResponse.json(
          { error: '当前模型不支持图片输入，请使用支持vision的模型（如 gpt-4o, gpt-4-vision-preview, claude-3-opus, claude-3-sonnet, claude-sonnet-4 等）' },
          { status: 400 }
        );
      }

      // Image input with text and image data
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
      // Regular text input
      userMessage = {
        role: 'user',
        content: USER_PROMPT_TEMPLATE(userInput, chartType)
      };
    }

    // Choose system prompt based on continuation flag
    const systemPrompt = isContinuation ? CONTINUATION_SYSTEM_PROMPT : SYSTEM_PROMPT;

    // 调试：输出 system prompt 摘要
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

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await callLLM(finalConfig, fullMessages, (chunk) => {
            // Send each chunk as SSE
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          });

          // Check if result is empty or contains error
          if (!result || result.trim().length === 0) {
            throw new Error('LLM 返回了空响应，请检查模型配置或重试');
          }

          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Error in stream:', error);
          // Send error as SSE data
          const errorData = `data: ${JSON.stringify({ error: error.message || '生成失败，请检查配置和网络连接' })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          // Send done signal after error
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
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

