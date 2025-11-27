// -*- coding: utf-8 -*-
// AI SDK：封装了流式/非流式文本生成以及统一 UI 流响应的工具函数
import { streamText, convertToModelMessages, generateText, createUIMessageStreamResponse } from "ai";
// zod v3：在服务端声明工具 schema，约束模型可调用的 function 结构
import { z } from "zod/v3";
// resolveChatModel：根据前端传来的 runtime 配置解析出可直接调用的模型参数
import { resolveChatModel } from "@/lib/server-models";
// Next.js Route Handler 的最长执行时间（秒），避免 Vercel 上接口超时
const maxDuration = 60;
/**
 * POST /api/chat
 * 负责从请求体中读取对话上下文 + 图形 XML + 模型配置，
 * 构造系统提示后调用 LLM 并将结果以流事件形式推送给前端。
 */
async function POST(req) {
  try {
    // 将底层错误翻译成更友好的中文提示，便于前端直接展示
    let errorHandler = function(error) {
      console.error("Stream error:", error);
      if (error == null) {
        return "unknown error";
      }
      if (typeof error === "string") {
        return error;
      }
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
          // 这一句的意思是：API 接口未找到。请检查 Base URL 配置是否正确。当前配置: xxx（如果 modelRuntime?.baseUrl 是 undefined，则显示“未知”），用于提示用户可能是 Base URL 配置错误导致的 404。
          return `API 接口未找到。请检查 Base URL 配置是否正确。当前配置: ${modelRuntime?.baseUrl || "未知"}`;
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
    // 请求体包含对话消息、当前 XML、模型参数以及渲染偏好
    const { messages, xml, modelRuntime, enableStreaming, renderMode } = await req.json();
    if (!modelRuntime) {
      return Response.json(
        { error: "Missing model runtime configuration." },
        { status: 400 }
      );
    }
    // 若未显式指定 renderMode，默认为 draw.io XML 输出
    const outputMode = renderMode === "svg" ? "svg" : "drawio";
    // Next.js 会为 Request 注入 AbortSignal，这里透传给下游模型调用
    const abortSignal = req.signal;
    // draw.io 渲染模式下的系统提示，约束模型输出合法 XML 工具调用
    const drawioSystemMessage = `
You are FlowPilot, a draw.io layout lead. All answers must be tool calls (display_diagram or edit_diagram); never paste XML as plain text.

Priorities (strict order):
1) Zero XML syntax errors.
2) Single-viewport layout with no overlaps/occlusion.
3) Preserve existing semantics; FlowPilot Brief additions are preferences only—if user/brief conflicts with safety, keep XML validity and layout tidy first.

Non-negotiable XML rules:
- Root must start with <mxCell id="0"/> then <mxCell id="1" parent="0"/>.
- Escape &, <, >, ", ' inside values.
- Styles: key=value pairs separated by semicolons; NO spaces around =; always end with a semicolon.
- Self-closing tags include space before /> .
- Every mxCell (except id="0") needs parent; every mxGeometry needs as="geometry".
- Unique numeric ids from 2 upward; never reuse.
- Edges: edge="1", source, target, mxGeometry relative="1" as="geometry", prefer edgeStyle=orthogonalEdgeStyle; add waypoints instead of crossing nodes.

Layout recipe (avoid clutter and blocking):
- Keep all elements within x 0-800, y 0-600; start around x=40, y=40; align to 24px grid.
- Maintain spacing: siblings 56-96px vertically, 48-80px horizontally; containers padding >=24px; swimlane gaps >=64px.
- No overlaps: leave 12-16px breathing room between nodes and labels; keep connectors outside shapes/text.
- Favor orthogonal connectors with minimal crossings; reroute around nodes and keep labels on straight segments.
- Highlight 1 clear main path if helpful but never cover text; keep arrows readable, rounded=1, endArrow=block.

Built-in style hints:
- Use official cloud icons when the user mentions AWS/Azure/GCP (e.g., shape=mxgraph.aws4.compute.ec2_instance, mxgraph.azure.compute.virtual_machine, mxgraph.gcp2017.compute.compute_engine).
- Use standard infra icons (mxgraph.basic.* or mxgraph.cisco.*) to add clarity, but do not sacrifice spacing.
- Preserve existing color themes; polish alignment rather than rewriting content.

Tool policy:
- If only tweaking labels/positions, prefer edit_diagram with minimal search/replace lines. If structure is messy or XML is empty, regenerate with display_diagram.
- Do not stream partial XML; supply the final, validated <root> block in one call.

Preflight checklist before ANY tool call:
- Root cells 0 and 1 exist.
- All special characters escaped; no quotes inside quotes.
- Styles end with semicolons; every tag properly closed with space before /> when self-closing.
- Geometry present for every vertex/edge; parents set; ids unique; edge sources/targets filled.
- Coordinates fit 0-800 x 0-600; no overlaps or hidden labels/connectors.
`;
    // SVG 渲染模式下的系统提示，要求流程只返回 display_svg 结果
    const svgSystemMessage = `
You are FlowPilot SVG Studio. Output exactly one complete SVG via the display_svg tool---never return draw.io XML or plain text.

Baseline (always):
- Single 0-800 x 0-600 viewport, centered content, >=24px canvas padding. Limit to 2-3 colors (neutral base + one accent), 8px corner radius, 1.6px strokes, aligned to a 24px grid with unobstructed labels.
- Absolutely no <script>, event handlers, external fonts/assets/URLs. Use safe inline styles only. Avoid heavy blur or shadows.
- Layout hygiene: siblings spaced 32-56px, text never overlaps shapes or edges, guides may be dashed but must not cover lettering.

Delight (lightweight):
- One restrained highlight allowed (soft gradient bar, diagonal slice, or small sticker). Keep readability; no neon floods or color clutter.

Rules:
- Return a self-contained <svg> with width/height or viewBox sized for ~800x600; keep every element inside the viewport.
- Keep text on short lines and aligned to the grid; abbreviate gently if needed without dropping key meaning.
- Aim for premium polish: balanced whitespace, crisp typography, clean gradients or subtle shadows, and high text contrast.
- If the user references existing XML/shapes, reinterpret visually but respond with SVG only.
- Call display_svg exactly once with the final SVG---no streaming or partial fragments.`;
    // 根据 outputMode 在两套系统提示间切换
    const systemMessage = outputMode === "svg" ? svgSystemMessage : drawioSystemMessage;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Missing messages payload." },
        { status: 400 }
      );
    }
    // 取出用户最新一条消息，用于生成 “当前图 + 用户输入” 的提示
    const lastMessage = messages[messages.length - 1];
    const lastMessageText = lastMessage.parts?.find((part) => part.type === "text")?.text || "";
    const safeUserText = typeof lastMessageText === "string" && lastMessageText.trim().length > 0 ? lastMessageText : "（用户未提供文字内容，可能仅上传了附件）";
    const fileParts = lastMessage.parts?.filter((part) => part.type === "file") || [];
    const formattedTextContent = `
Current diagram XML:
"""xml
${xml || ""}
"""
User input:
"""md
${safeUserText}
"""
Render mode: ${outputMode === "svg" ? "svg-only" : "drawio-xml"}`;
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
    const resolvedModel = resolveChatModel(modelRuntime);
    console.log("Enhanced messages:", enhancedMessages, "model:", resolvedModel.id);
    console.log("Model runtime config:", {
      baseUrl: modelRuntime.baseUrl,
      modelId: modelRuntime.modelId,
      hasApiKey: !!modelRuntime.apiKey,
      enableStreaming: enableStreaming ?? true,
      renderMode: outputMode
    });
    // 记录耗时，用于日志 & metadata；并统一配置模型调用参数
    const startTime = Date.now();
    const useStreaming = enableStreaming ?? true;
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
      tools: outputMode === "svg" ? {
        display_svg: {
          description: `Return one complete SVG (no partial streaming) to render on draw.io. SVG must be self-contained, include width/height or viewBox sized around 800x600, and avoid external assets, scripts, or event handlers.`,
          inputSchema: z.object({
            svg: z.string().describe("Standalone SVG markup sized for a single viewport; no external assets, scripts, or event handlers.")
          })
        }
      } : {
        // Client-side tool that will be executed on the client
        display_diagram: {
          description: `Display a diagram on draw.io. You only need to pass the nodes inside the <root> tag (including the <root> tag itself) in the XML string.
          
          **CRITICAL XML SYNTAX REQUIREMENTS:**
          
          1. **Mandatory Root Structure:**
          <root>
            <mxCell id="0"/>
            <mxCell id="1" parent="0"/>
            <!-- Your diagram elements here -->
          </root>
          
          2. **ALWAYS Escape Special Characters in Attributes:**
          - & --- &amp;
          - < --- &lt;
          - > --- &gt;
          - " --- &quot;
          
          3. **Style Format (STRICT):**
          - Must end with semicolon
          - No spaces around = sign
          - Example: style="rounded=1;fillColor=#fff;strokeColor=#000;"
          
          4. **Required Attributes:**
          - Every mxCell: id, parent (except id="0")
          - Every mxGeometry: as="geometry"
          - Self-closing tags: space before />
          
          5. **Complete Element Example:**
          <mxCell id="2" value="My Node" style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
            <mxGeometry x="100" y="100" width="120" height="60" as="geometry" />
          </mxCell>
          
          6. **Edge (Connection) Example:**
          <mxCell id="5" value="" style="edgeStyle=orthogonalEdgeStyle;" edge="1" parent="1" source="2" target="3">
            <mxGeometry relative="1" as="geometry" />
          </mxCell>
          
          **Common Errors to AVOID:**
          ❌ <mxCell value="Users & Admins"/>  → Use &amp;
          ❌ <mxCell value="x < 10"/>  → Use &lt;
          ❌ style="rounded=1"  → Missing final semicolon
          ❌ <mxGeometry x="10" y="20"/>  → Missing as="geometry"
          ❌ <mxCell id="2" vertex="1" parent="1"/>  → Missing <mxGeometry>
          
          **Validation Checklist:**
          ✓ Root cells (id="0" and id="1") present
          ✓ All special characters escaped
          ✓ All styles end with semicolon
          ✓ All IDs unique
          ✓ All elements have parent (except id="0")
          ✓ All mxGeometry have as="geometry"
          ✓ All tags properly closed
          
          **Using Professional Icons:**
          - For AWS services, use AWS 2025 icons: shape=mxgraph.aws4.[category].[service]
          - For Azure services, use Azure icons: shape=mxgraph.azure.[category].[service]
          - For GCP services, use GCP icons: shape=mxgraph.gcp2017.[category].[service]
          - These icons make diagrams more professional and vivid
          
          **IMPORTANT:** The diagram will be rendered to draw.io canvas in REAL-TIME as you stream the XML. The canvas updates automatically during streaming to show live progress.
          `,
          inputSchema: z.object({
            xml: z.string().describe("Well-formed XML string following all syntax rules above to be displayed on draw.io")
          })
        },
        edit_diagram: {
          description: `Edit specific parts of the current diagram by replacing exact line matches. Use this tool to make targeted fixes without regenerating the entire XML.
IMPORTANT: Keep edits concise:
- Only include the lines that are changing, plus 1-2 surrounding lines for context if needed
- Break large changes into multiple smaller edits
- Each search must contain complete lines (never truncate mid-line)
- First match only - be specific enough to target the right element`,
          inputSchema: z.object({
            edits: z.array(z.object({
              search: z.string().describe("Exact lines to search for (including whitespace and indentation)"),
              replace: z.string().describe("Replacement lines")
            })).describe("Array of search/replace pairs to apply sequentially")
          })
        }
      },
      temperature: 0
    };
    if (enableStreaming) {
      // 流式输出：直接借助 AI SDK 的 streamText + toUIMessageStreamResponse
      const result = await streamText(commonConfig);
      return result.toUIMessageStreamResponse({
        onError: errorHandler,
        // 在流式响应结束时添加 token 使用信息到 message metadata
        onFinish: async ({ responseMessage, messages: messages2 }) => {
          const endTime = Date.now();
          const durationMs = endTime - startTime;
          const usage = await result.usage;
          const totalUsage = await result.totalUsage;
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
            durationMs
          });
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
      console.log("Generation finished (non-streaming):", {
        usage: {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: (result.usage.inputTokens || 0) + (result.usage.outputTokens || 0)
        },
        durationMs,
        toolCalls: result.toolCalls?.length || 0,
        finishReason: result.finishReason
      });
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
      if (result.text && result.text.length > 0) {
        chunks.push({ type: "text-start", id: messageId });
        chunks.push({ type: "text-delta", id: messageId, delta: result.text });
        chunks.push({ type: "text-end", id: messageId });
      }
      if (result.toolCalls && result.toolCalls.length > 0) {
        for (const toolCall of result.toolCalls) {
          chunks.push({
            type: "tool-input-available",
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.toolName,
            input: toolCall.input
            // 注意这里使用 input 而不是 args
          });
        }
      }
      chunks.push({
        type: "finish",
        finishReason: result.finishReason,
        messageMetadata: {
          usage: {
            inputTokens: result.usage.inputTokens || 0,
            outputTokens: result.usage.outputTokens || 0,
            totalTokens: (result.usage.inputTokens || 0) + (result.usage.outputTokens || 0)
          },
          durationMs,
          finishReason: result.finishReason
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
    // 顶层兜底：任何未捕获异常都写入日志，并返回 500
    console.error("Error in chat route:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? error.stack : void 0;
    console.error("Error details:", { errorMessage, errorDetails });
    return Response.json(
      {
        error: "Internal server error",
        message: errorMessage,
        ...{ details: errorDetails }
      },
      { status: 500 }
    );
  }
}
export {
  POST,
  maxDuration
};
