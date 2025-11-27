import { NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { resolveChatModel } from "@/lib/server-models";
import {
  pptBriefSchema,
  blueprintSchema
} from "@/types/ppt";
const requestSchema = z.object({
  brief: pptBriefSchema,
  modelRuntime: z.object({
    modelId: z.string(),
    baseUrl: z.string(),
    apiKey: z.string(),
    label: z.string().optional()
  })
});
const SYSTEM_PROMPT = `
You are a senior presentation strategist and content architect specializing in creating comprehensive, detailed slide deck blueprints.

YOUR MISSION:
Transform presentation briefs into rich, detailed blueprints that tell compelling stories with depth and substance.

CRITICAL REQUIREMENTS:

1. STORY ARCHITECTURE
   - Craft a complete narrative arc with clear progression
   - Strong opening hook that captures attention
   - Logical flow building towards key insights
   - Memorable closing with clear takeaways and call-to-action
   - Each slide must advance the story meaningfully

2. RICH SLIDE CONTENT - Be Specific and Detailed
   
   For EACH slide, provide:
   
   a) Title (8-12 words)
      - Descriptive and engaging, not generic
      - Should communicate the slide's key message
      - Examples: "3 Key Metrics Driving 40% Growth" vs "Metrics"
   
   b) Narrative (40-80 words)
      - WHY this slide matters in the overall story
      - WHAT specific insight or message it conveys
      - HOW it connects to the broader presentation goal
      - Include context, implications, or supporting rationale
      - Be concrete with examples, numbers, or scenarios when relevant
   
   c) Bullet Points (4-5 items, each 8-15 words)
      - NOT generic placeholders like "Key point 1"
      - Specific, actionable, or data-driven statements
      - Use concrete examples, metrics, or outcomes
      - Each bullet should be a complete thought
      - Examples:
         \u2713 "Reduced customer onboarding time from 3 days to 4 hours"
         \u2713 "Automated workflow handles 85% of routine support tickets"
         \u2717 "Improved efficiency"
         \u2717 "Better user experience"
   
   d) Visual Idea (20-40 words)
      - Specific visualization recommendation
      - Describe the layout, data representation, or imagery style
      - Mention key elements to highlight
      - Example: "Side-by-side comparison chart showing before/after metrics with callout boxes highlighting the 3 biggest improvements. Use progress bars for visual impact."
   
   e) Transition Note (15-30 words)
      - Explain how this slide flows from the previous one
      - Set up the logical bridge to the next topic
      - Maintain narrative continuity

3. CONTENT DEPTH GUIDELINES
   
   Opening Slides:
   - Hook with compelling problem statement or opportunity
   - Include specific context: who's affected, scale of impact
   - Use concrete examples or scenarios
   
   Body Slides:
   - Each slide should unpack ONE main idea thoroughly
   - Support claims with specific details, examples, or data points
   - Show cause-and-effect relationships
   - Explain implications and benefits
   
   Closing Slides:
   - Synthesize key insights (not just repeat titles)
   - Specific next steps or recommendations
   - Clear call-to-action with timeline or owners

4. AVOID GENERIC CONTENT
   \u2717 Don't use: "Key benefits", "Main features", "Overview"
   \u2713 Instead: "3 Cost Savings Averaging $50K Per Quarter", "Auto-Scheduling Reduces Meeting Conflicts by 70%"
   
   \u2717 Don't use: "Bullet point 1", "Item A", "Point 1"
   \u2713 Instead: Specific statements with concrete details

5. VISUAL CONSISTENCY
   - Cohesive color palette (2-3 primary + neutrals)
   - Typography hierarchy (title/body/caption sizes)
   - Consistent iconography style
   - Layout principles for clarity

6. TECHNICAL REQUIREMENTS
   - Output ONLY valid JSON matching the schema
   - No markdown formatting or explanations
   - Strictly adhere to user's slide count specification
   - All fields must be fully populated with meaningful content

QUALITY CHECKLIST:
\u25A1 Every narrative explains WHY and HOW, not just WHAT
\u25A1 Every bullet is specific and concrete
\u25A1 No generic placeholders or vague statements
\u25A1 Story flows logically from slide to slide
\u25A1 Opening hooks attention, closing drives action
\u25A1 Visual ideas are detailed and implementable
`;
function extractJsonPayload(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("\u6A21\u578B\u672A\u8FD4\u56DE\u6709\u6548 JSON\u3002");
  }
  return text.slice(start, end + 1);
}
async function POST(req) {
  try {
    const payload = requestSchema.parse(await req.json());
    const { brief, modelRuntime } = payload;
    const resolvedModel = resolveChatModel(modelRuntime);
    const userPrompt = `
Create a comprehensive, detailed presentation blueprint based on this brief.

PRESENTATION BRIEF:
${JSON.stringify(brief, null, 2)}

CONTENT DEPTH REQUIREMENTS:

1. Make every slide RICH and SPECIFIC:
   - Narratives must explain the full context and importance (40-80 words each)
   - Bullets must be concrete and detailed (8-15 words each)
   - Visual ideas must describe exact layout and elements (20-40 words)
   - NO generic placeholders like "Key point" or "Overview"

2. Tell a COMPLETE STORY:
   - Opening: Set up the problem/opportunity with specific context
   - Middle: Develop ideas with supporting details and examples
   - Closing: Synthesize insights and provide clear next steps

3. Use SPECIFICS over GENERICS:
   - Include metrics, timelines, examples, or scenarios
   - Replace vague terms with concrete descriptions
   - Show cause-and-effect relationships

4. Ensure NARRATIVE FLOW:
   - Each slide should logically follow the previous one
   - Transition notes must explain the connection
   - Build towards a cohesive conclusion

OUTPUT: Complete JSON blueprint with ${brief.slideCount} detailed slides.
`;
    const result = await generateText({
      model: resolvedModel.model,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.4
    });
    const raw = extractJsonPayload(result.text);
    const modelPayload = JSON.parse(raw);
    const normalized = normalizeBlueprintResponse(modelPayload, brief.slideCount);
    const parsed = blueprintSchema.parse(normalized);
    return NextResponse.json({ blueprint: parsed });
  } catch (error) {
    console.error("[ppt/blueprint] Failed to generate blueprint:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "\u8F93\u5165\u53C2\u6570\u4E0D\u5408\u6CD5", details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "\u751F\u6210 PPT \u9AA8\u67B6\u5931\u8D25\u3002";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
const DEFAULT_THEME = {
  palette: ["#0B5CFF", "#111827", "#F4F6FB"],
  typography: "Sans-serif, \u7C97\u7EC6\u5BF9\u6BD4\u6807\u9898\uFF0C\u6B63\u6587\u5DE6\u5BF9\u9F50",
  iconography: "\u53CC\u8272\u7EBF\u6027\u56FE\u6807\uFF0C\u7B80\u6D01\u51E0\u4F55\u56FE\u5F62",
  layoutPrinciples: [
    "\u4FDD\u6301\u7EDF\u4E00\u8FB9\u8DDD\u4E0E\u6805\u683C",
    "\u6807\u9898\u4E0E\u5173\u952E\u4FE1\u606F\u5DE6\u5BF9\u9F50",
    "\u786E\u4FDD\u6240\u6709\u5143\u7D20\u5728\u5355\u5C4F\u5185\u53EF\u8BFB"
  ]
};
function coerceString(value, fallback = "") {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
    return fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value && typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      const trimmed = value.text.trim();
      return trimmed || fallback;
    }
    try {
      const candidate = JSON.stringify(value);
      return candidate.length > 0 ? candidate : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}
function normalizePalette(input) {
  if (!Array.isArray(input)) {
    return DEFAULT_THEME.palette;
  }
  const sanitized = input.map((item) => coerceString(item)).map((token) => token.replace(/['\"]+/g, "").trim()).filter(Boolean);
  return sanitized.length > 0 ? sanitized : DEFAULT_THEME.palette;
}
function normalizeBullets(input) {
  if (Array.isArray(input)) {
    const bullets = input.map((item) => coerceString(item)).filter(Boolean);
    if (bullets.length > 0) {
      return bullets;
    }
  }
  const fallback = coerceString(input);
  if (fallback) {
    return fallback.split(/[\n，,]/g).map((token) => token.trim()).filter(Boolean);
  }
  return ["\u5173\u952E\u8981\u70B9 1", "\u5173\u952E\u8981\u70B9 2"];
}
function normalizeSlides(rawSlides, expectedCount) {
  const list = Array.isArray(rawSlides) ? rawSlides : [];
  const trimmed = typeof expectedCount === "number" && expectedCount > 0 ? list.slice(0, expectedCount) : list;
  if (trimmed.length === 0) {
    return Array.from({ length: expectedCount ?? 6 }).map((_, index) => ({
      id: `slide-${index + 1}`,
      title: `\u5E7B\u706F\u7247 ${index + 1}`,
      narrative: "\u63CF\u8FF0\u8FD9\u4E00\u9875\u7684\u53D9\u4E8B\u91CD\u70B9\u3002",
      bullets: ["\u5173\u952E\u8981\u70B9 1", "\u5173\u952E\u8981\u70B9 2"],
      visualIdea: "\u7ED3\u6784\u5316\u56FE\u793A",
      transitionNote: "",
      status: "draft"
    }));
  }
  return trimmed.map((slide, index) => {
    const safe = slide && typeof slide === "object" ? slide : {};
    const narrative = coerceString(safe.narrative) || coerceString(safe.summary) || "\u63CF\u8FF0\u8FD9\u4E00\u9875\u7684\u53D9\u4E8B\u91CD\u70B9\u3002";
    const visualIdea = coerceString(safe.visualIdea) || coerceString(safe.visualConcept) || "\u7ED3\u6784\u5316\u56FE\u793A";
    return {
      id: coerceString(safe.id, `slide-${index + 1}`) || `slide-${index + 1}`,
      title: coerceString(safe.title, `\u5E7B\u706F\u7247 ${index + 1}`),
      narrative,
      bullets: normalizeBullets(safe.bullets ?? safe.bulletPoints),
      visualIdea,
      transitionNote: coerceString(safe.transitionNote),
      status: "draft"
    };
  });
}
function normalizeThemeGuidelines(theme) {
  if (!theme || typeof theme !== "object") {
    return DEFAULT_THEME;
  }
  const safe = theme;
  return {
    palette: normalizePalette(safe.palette),
    typography: coerceString(safe.typography) || coerceString(safe.fontStyle) || DEFAULT_THEME.typography,
    iconography: coerceString(safe.iconography) || coerceString(safe.iconStyle) || DEFAULT_THEME.iconography,
    layoutPrinciples: Array.isArray(safe.layoutPrinciples) && safe.layoutPrinciples.length > 0 ? safe.layoutPrinciples.map((item) => coerceString(item)).filter(Boolean) : DEFAULT_THEME.layoutPrinciples
  };
}
function normalizeBlueprintResponse(payload, expectedCount) {
  return {
    storyArc: coerceString(payload?.storyArc) || coerceString(payload?.narrativeArc) || "\u4ECE\u95EE\u9898\u3001\u89E3\u51B3\u65B9\u6848\u5230\u843D\u5730\u4EF7\u503C\u7684\u53D9\u4E8B\u4E3B\u7EBF\u3002",
    themeGuidelines: normalizeThemeGuidelines(payload?.themeGuidelines),
    slides: normalizeSlides(payload?.slides, expectedCount)
  };
}
export {
  POST
};
