import { NextResponse } from 'next/server';
import { callOpenAI, processMessage, validateConfig } from '@/lib/openai-client';
import { SYSTEM_PROMPT, getUserPrompt } from '@/lib/prompts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/generate
 * Generate Excalidraw diagram from user input using OpenAI
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { config, userInput, chartType } = body;

    // Debug: Log received config
    console.log('API received config:', {
      exists: !!config,
      hasBaseUrl: !!config?.baseUrl,
      hasApiKey: !!config?.apiKey,
      hasModel: !!config?.model,
      baseUrl: config?.baseUrl,
      model: config?.model,
    });

    // Validate configuration
    if (!validateConfig(config)) {
      console.error('Config validation failed:', {
        config: config ? { ...config, apiKey: '***' } : null
      });
      return NextResponse.json(
        { error: 'Invalid configuration. Please check your API settings.' },
        { status: 400 }
      );
    }

    // Validate user input
    if (!userInput) {
      return NextResponse.json({ error: 'User input is required' }, { status: 400 });
    }

    // Build messages array
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
    ];

    // Handle different input types
    if (typeof userInput === 'string') {
      // Text input - use the getUserPrompt function
      const userPrompt = getUserPrompt(userInput, chartType || 'auto');

      messages.push({
        role: 'user',
        content: userPrompt,
      });
    } else if (userInput.image) {
      // Image input (multimodal)
      const textContent =
        userInput.text || 'Please analyze this image and convert it to Excalidraw format diagram.';
      const userMessage = processMessage({
        text: textContent,
        image: userInput.image,
      });
      messages.push(userMessage);
    } else {
      return NextResponse.json({ error: 'Invalid input format' }, { status: 400 });
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callOpenAI(config, messages, (chunk) => {
            // Send each chunk to the client
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          });

          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('OpenAI API error:', error);
          const errorData = `data: ${JSON.stringify({ error: error.message })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

