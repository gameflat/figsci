import { generateText } from "ai";
import { resolveChatModel } from "@/lib/server-models";
const systemPrompt = `You are FlowPilot Diagram Repair, a specialist that only fixes malformed draw.io XML.
You must respond with a single JSON object and nothing else. Do NOT include code fences, markdown, or raw XML outside the JSON string fields.
Expected schema:
{
  "strategy": "display" | "edit",
  "xml": "<root>...</root>",
  "edits": [
    {"search": "line", "replace": "line"}
  ],
  "notes": "short Chinese summary (<60 chars)"
}

Rules:
- Prefer "edit" when the original XML is mostly valid and only a few lines must be corrected. The edits must reference the latest working XML exactly (including indentation).
- Use "display" only when the XML is severely corrupted and needs a clean rebuild. In this mode the xml field must contain a full <root>...</root> block ready to load.
- Never wrap the JSON in \`\`\` fences.
- Never output separate \`\`\`xml blocks; the xml must be a JSON string value.`;
function buildUserPrompt({
  invalidXml,
  currentXml,
  errorContext
}) {
  const sections = [
    `\u6700\u65B0\u4E00\u6B21\u6A21\u578B\u8F93\u51FA\uFF08\u7591\u4F3C\u5F02\u5E38\uFF09\uFF1A
"""xml
${invalidXml ?? ""}
"""`
  ];
  if (errorContext) {
    sections.push(`\u8FD0\u884C\u65F6\u9519\u8BEF\uFF1A
"""log
${errorContext}
"""`);
  }
  if (currentXml) {
    sections.push(`\u5F53\u524D\u753B\u5E03 XML\uFF08\u53EF\u7528\u4E8E edit \u53C2\u8003\uFF09\uFF1A
"""xml
${currentXml}
"""`);
  }
  return sections.join("\n\n");
}
function parseJsonBlock(text) {
  const match = text.match(/```json([\s\S]*?)```/i);
  const rawJson = match ? match[1] : text.trim();
  if (!rawJson) {
    throw new Error("\u6A21\u578B\u672A\u8FD4\u56DE JSON \u7ED3\u679C\u3002");
  }
  const trimmed = rawJson.trim();
  try {
    const payload = JSON.parse(trimmed);
    if (!payload || typeof payload !== "object") {
      throw new Error("\u65E0\u6CD5\u89E3\u6790\u6A21\u578B\u8FD4\u56DE\u5185\u5BB9\u3002");
    }
    if (payload.strategy !== "display" && payload.strategy !== "edit") {
      throw new Error("JSON \u7F3A\u5C11\u6709\u6548 strategy \u5B57\u6BB5\u3002");
    }
    if (payload.strategy === "display" && typeof payload.xml !== "string") {
      throw new Error("display \u7B56\u7565\u5FC5\u987B\u8FD4\u56DE xml \u5B57\u6BB5\u3002");
    }
    if (payload.strategy === "edit" && !Array.isArray(payload.edits)) {
      throw new Error("edit \u7B56\u7565\u5FC5\u987B\u8FD4\u56DE edits \u6570\u7EC4\u3002");
    }
    return payload;
  } catch (error) {
    const xmlBlockMatch = text.match(/```xml([\s\S]*?)```/i) || text.match(/(<root[\s\S]*<\/root>)/i);
    if (xmlBlockMatch) {
      return {
        strategy: "display",
        xml: xmlBlockMatch[1].trim(),
        notes: "\u6A21\u578B\u8FD4\u56DE\u88F8 XML\uFF0C\u5DF2\u76F4\u63A5\u5957\u7528\u3002"
      };
    }
    throw error;
  }
}
async function POST(req) {
  try {
    const {
      invalidXml,
      currentXml,
      errorContext,
      modelRuntime
    } = await req.json();
    if (!invalidXml || invalidXml.trim().length === 0) {
      return Response.json(
        { error: "invalidXml \u4E0D\u80FD\u4E3A\u7A7A" },
        { status: 400 }
      );
    }
    if (!modelRuntime) {
      return Response.json(
        { error: "\u7F3A\u5C11\u6A21\u578B\u914D\u7F6E\uFF0C\u65E0\u6CD5\u6267\u884C\u81EA\u52A8\u4FEE\u590D\u3002" },
        { status: 400 }
      );
    }
    const resolved = resolveChatModel(modelRuntime);
    const userPrompt = buildUserPrompt({ invalidXml, currentXml, errorContext });
    const response = await generateText({
      model: resolved.model,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: userPrompt }]
        }
      ],
      temperature: 0
    });
    const payload = parseJsonBlock(response.text);
    return Response.json({
      strategy: payload.strategy,
      xml: payload.xml,
      edits: payload.edits ?? [],
      notes: payload.notes ?? ""
    });
  } catch (error) {
    console.error("Diagram repair failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
export {
  POST
};
