import { generateText } from "ai";
import { resolveChatModel } from "@/lib/server-models";
const comparisonSystemPromptXml = `You are FlowPilot \u7684\u6A21\u578B\u5BF9\u6BD4\u6E32\u67D3\u5668\u3002
\u4F60\u7684\u4EFB\u52A1\u662F\u57FA\u4E8E\u7528\u6237\u8F93\u5165\u4E0E\u5F53\u524D draw.io XML\uFF0C\u5728\u4E0D\u4F9D\u8D56\u5916\u90E8\u5DE5\u5177\u7684\u60C5\u51B5\u4E0B\u76F4\u63A5\u8F93\u51FA\u6700\u65B0\u7684 draw.io \u56FE\u8868 XML\u3002
\u8BF7\u4E25\u683C\u9075\u5B88\u4EE5\u4E0B\u8981\u6C42\uFF1A
1. \u603B\u662F\u8FD4\u56DE JSON \u5BF9\u8C61\uFF08\u4F7F\u7528 \`\`\`json \u5305\u88F9\uFF09\uFF0C\u5305\u542B\u5B57\u6BB5 summary\uFF08<=120 \u5B57\u4E2D\u6587\u63CF\u8FF0\u5DEE\u5F02\u70B9\uFF09\u4E0E xml\uFF08\u5B8C\u6574 draw.io XML \u5B57\u7B26\u4E32\uFF09\u3002
2. xml \u5B57\u6BB5\u5FC5\u987B\u4EE5 <mxfile \u5F00\u59CB\uFF0C\u5305\u542B <mxGraphModel>\uFF0C\u5E76\u63A7\u5236\u6240\u6709\u8282\u70B9\u5750\u6807\u5728 0-800 \xD7 0-600 \u8303\u56F4\u5185\u3002
3. \u4E0D\u8981\u6DFB\u52A0\u4EFB\u4F55\u989D\u5916\u89E3\u91CA\u3001Markdown \u6216\u793A\u4F8B\uFF0C\u53EA\u8F93\u51FA\u4E0A\u8FF0 JSON\u3002`;
const comparisonSystemPromptSvg = `You are FlowPilot \u7684\u6A21\u578B\u5BF9\u6BD4\u6E32\u67D3\u5668\uFF08SVG \u6A21\u5F0F\uFF09\u3002
\u4F60\u7684\u4EFB\u52A1\u662F\u57FA\u4E8E\u7528\u6237\u8F93\u5165\u4E0E\u5F53\u524D draw.io XML\uFF0C\u8F93\u51FA\u4E00\u4EFD\u9AD8\u6E05 SVG\u3002
\u8BF7\u4E25\u683C\u9075\u5B88\u4EE5\u4E0B\u8981\u6C42\uFF1A
1. \u603B\u662F\u8FD4\u56DE JSON \u5BF9\u8C61\uFF08\u4F7F\u7528 \`\`\`json \u5305\u88F9\uFF09\uFF0C\u5305\u542B\u5B57\u6BB5 summary\uFF08<=120 \u5B57\u4E2D\u6587\u63CF\u8FF0\u5DEE\u5F02\u70B9\uFF09\u4E0E svg\uFF08\u5B8C\u6574\u81EA\u5305\u542B SVG \u5B57\u7B26\u4E32\uFF09\u3002\u5982\u6709\u9700\u8981\uFF0C\u53EF\u9644\u52A0 previewSvg \u5B57\u6BB5\u3002
2. SVG \u753B\u5E03\u63A7\u5236\u5728 0-800 \xD7 0-600 \u8303\u56F4\u5185\uFF0C\u7559\u51FA\u81F3\u5C11 24px \u8FB9\u8DDD\uFF0C\u5143\u7D20\u4E0D\u91CD\u53E0\uFF0C\u6587\u5B57\u4E0D\u88AB\u906E\u6321\uFF0C\u65E0 <script> \u6216\u4E8B\u4EF6\u5C5E\u6027\u3002
3. \u4E0D\u8981\u6DFB\u52A0\u4EFB\u4F55\u989D\u5916\u89E3\u91CA\u3001Markdown \u6216\u793A\u4F8B\uFF0C\u53EA\u8F93\u51FA\u4E0A\u8FF0 JSON\u3002`;
function buildUserPrompt(prompt, xml, brief, renderMode = "drawio") {
  const sections = [];
  if (brief && brief.trim().length > 0) {
    sections.push(brief.trim());
  }
  sections.push(prompt.trim());
  return `\u5F53\u524D\u56FE\u8868 XML\uFF1A
"""xml
${xml ?? ""}
"""

\u7528\u6237\u6700\u65B0\u6307\u4EE4\uFF1A
"""md
${sections.join("\n\n")}
"""

\u8BF7\u8F93\u51FA JSON\uFF08\u5B57\u6BB5\uFF1Asummary, ${renderMode === "svg" ? "svg" : "xml"}\uFF09\uFF0C\u7528\u4E8E\u6A21\u578B\u6548\u679C\u5BF9\u6BD4\u3002`;
}
function extractJsonPayload(text, renderMode) {
  const jsonBlockMatch = text.match(/```json([\s\S]*?)```/i);
  const jsonString = jsonBlockMatch ? jsonBlockMatch[1] : text.trim().startsWith("{") ? text.trim() : "";
  if (!jsonString) {
    throw new Error("\u6A21\u578B\u672A\u8FD4\u56DE JSON \u7ED3\u679C\uFF0C\u8BF7\u91CD\u8BD5\u6216\u66F4\u6362\u6A21\u578B\u3002");
  }
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new Error("\u65E0\u6CD5\u89E3\u6790\u6A21\u578B\u8FD4\u56DE\u7684 JSON \u5185\u5BB9\u3002");
  }
  const summary = typeof parsed.summary === "string" ? parsed.summary : "";
  const xml = typeof parsed.xml === "string" ? parsed.xml : void 0;
  const svg = typeof parsed.svg === "string" ? parsed.svg : void 0;
  const previewSvg = typeof parsed.previewSvg === "string" ? parsed.previewSvg : void 0;
  if (renderMode === "svg" && !svg) {
    throw new Error("\u6A21\u578B\u8FD4\u56DE\u7ED3\u679C\u7F3A\u5C11 svg \u5B57\u6BB5\u3002");
  }
  if (renderMode === "drawio" && !xml) {
    throw new Error("\u6A21\u578B\u8FD4\u56DE\u7ED3\u679C\u7F3A\u5C11 xml \u5B57\u6BB5\u3002");
  }
  return {
    summary,
    xml,
    svg,
    previewSvg
  };
}
async function exportDiagramPreview(xml) {
  if (!xml || xml.trim().length === 0) {
    return {};
  }
  try {
    const params = new URLSearchParams();
    params.set("format", "png");
    params.set("embedImages", "1");
    params.set("border", "0");
    params.set("base64", "1");
    params.set("spin", "0");
    params.set("scale", "1");
    params.set("w", "800");
    params.set("h", "600");
    params.set("xml", xml);
    const drawioBaseUrl = process.env.NEXT_PUBLIC_DRAWIO_BASE_URL || "https://app.diagrams.net";
    const response = await fetch(`${drawioBaseUrl}/export3`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    if (!response.ok) {
      return {};
    }
    const text = (await response.text()).trim();
    if (!text) {
      return {};
    }
    const dataUrl = text.startsWith("data:") ? text : `data:image/png;base64,${text}`;
    return { image: dataUrl };
  } catch (error) {
    console.error("Failed to export diagram preview:", error);
    return {};
  }
}
async function POST(req) {
  try {
    const {
      models,
      prompt,
      xml,
      brief,
      attachments,
      renderMode = "drawio"
    } = await req.json();
    const abortSignal = req.signal;
    if (!prompt || prompt.trim().length === 0) {
      return Response.json(
        { error: "prompt \u4E0D\u80FD\u4E3A\u7A7A\u3002" },
        { status: 400 }
      );
    }
    const normalizedModels = (Array.isArray(models) ? models : []).map(
      (item) => typeof item === "string" ? { id: item } : item
    ).filter(
      (item) => Boolean(
        item?.id && item.id.trim().length > 0 && item?.runtime && typeof item.runtime.baseUrl === "string" && typeof item.runtime.apiKey === "string" && typeof item.runtime.modelId === "string"
      )
    );
    if (normalizedModels.length === 0) {
      return Response.json(
        { error: "\u81F3\u5C11\u9700\u8981\u9009\u62E9\u4E00\u4E2A\u6A21\u578B\u8FDB\u884C\u5BF9\u6BD4\u3002" },
        { status: 400 }
      );
    }
    const mode = renderMode === "svg" ? "svg" : "drawio";
    const userPrompt = buildUserPrompt(prompt, xml ?? "", brief, mode);
    const normalizedUserPrompt = userPrompt.trim();
    if (!normalizedUserPrompt) {
      return Response.json(
        { error: "\u751F\u6210\u8BF7\u6C42\u7F3A\u5C11\u6709\u6548\u63D0\u793A\u8BCD\u5185\u5BB9\u3002" },
        { status: 400 }
      );
    }
    const attachmentParts = attachments?.flatMap(
      (file) => file?.url && file?.mediaType ? [
        {
          type: "image",
          image: file.url,
          mimeType: file.mediaType
        }
      ] : []
    ) ?? [];
    const results = await Promise.all(
      normalizedModels.map(async (model) => {
        const startTime = Date.now();
        try {
          const resolved = resolveChatModel(model.runtime);
          const response = await generateText({
            model: resolved.model,
            system: mode === "svg" ? comparisonSystemPromptSvg : comparisonSystemPromptXml,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: userPrompt },
                  ...attachmentParts
                ]
              }
            ],
            temperature: 0.1,
            abortSignal
            // 传递 AbortSignal 以支持取消请求
          });
          const endTime = Date.now();
          const durationMs = endTime - startTime;
          const payload = extractJsonPayload(response.text, mode);
          const preview = payload.xml ? await exportDiagramPreview(payload.xml) : {};
          const usage = response.usage;
          return {
            id: resolved.id,
            label: model.label ?? resolved.label,
            provider: resolved.provider,
            status: "ok",
            summary: payload.summary,
            xml: payload.xml,
            svg: payload.svg,
            previewSvg: payload.previewSvg,
            previewImage: preview.image,
            // 添加 token 使用信息
            usage: {
              inputTokens: usage.inputTokens || 0,
              outputTokens: usage.outputTokens || 0,
              totalTokens: (usage.inputTokens || 0) + (usage.outputTokens || 0)
            },
            durationMs
          };
        } catch (error) {
          const endTime = Date.now();
          const durationMs = endTime - startTime;
          const message = error instanceof Error ? error.message : "\u6A21\u578B\u8C03\u7528\u5931\u8D25";
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
    return Response.json({ results });
  } catch (error) {
    console.error("Model compare route error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export {
  POST
};
