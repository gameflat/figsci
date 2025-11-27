import { NextResponse } from "next/server";
import { generateText } from "ai";
import { z } from "zod";
import { resolveChatModel } from "@/lib/server-models";
import { buildSvgRootXml } from "@/lib/svg";
import {
  slideBlueprintSchema,
  styleOverridesSchema,
  blueprintSchema
} from "@/types/ppt";
const requestSchema = z.object({
  slide: slideBlueprintSchema,
  blueprintContext: z.object({
    storyArc: z.string(),
    themeGuidelines: blueprintSchema.shape.themeGuidelines,
    previousSlide: z.object({
      title: z.string(),
      narrative: z.string(),
      bullets: z.array(z.string())
    }).nullable().optional(),
    nextSlide: z.object({
      title: z.string(),
      narrative: z.string()
    }).nullable().optional()
  }),
  styleLocks: styleOverridesSchema,
  renderMode: z.enum(["drawio", "svg"]).default("drawio").optional(),
  modelRuntime: z.object({
    modelId: z.string(),
    baseUrl: z.string(),
    apiKey: z.string(),
    label: z.string().optional()
  })
});
const SYSTEM_MESSAGE = `
You are a senior presentation designer for FlowPilot Studio, creating clean, professional slides using draw.io format.

GOLDEN RULES OF CLEAN SLIDE DESIGN:

1. SIMPLICITY FIRST - "Less is More"
   - ONE main idea per slide - never overcrowd
   - Maximum 3-5 bullet points or 2-3 content blocks
   - Generous white space (40-50% of canvas should be empty)
   - Simple, clean layouts - avoid complexity

2. VISUAL HIERARCHY
   - Clear title at top (28-36px, bold)
   - One focal point per slide (largest element)
   - Supporting content smaller and secondary
   - Use size, color, and position to guide eye flow

3. CANVAS & SPACING
   - Canvas: 1280\xD7720 (16:9 ratio)
   - Margins: 60-80px from edges (generous breathing room)
   - Element spacing: 30-40px minimum between content blocks
   - Consistent alignment (left/center/right - pick one per slide)

4. CLEAN LAYOUT OPTIONS (Choose ONE per slide):
   
   SIMPLE LAYOUTS (Prefer these):
   \u2022 Title + 3-5 Bullets: Classic, clean list format
   \u2022 Title + Single Visual: One large image/diagram with caption
   \u2022 Title + 2-Column Split: Left text, right visual (or vice versa)
   \u2022 Title + Centered Quote/Stat: Large impactful number or text
   
   DATA LAYOUTS (When showing metrics):
   \u2022 Title + 2-4 KPI Cards: Simple metric boxes with numbers
   \u2022 Title + Single Chart: One clean graph with key insight
   
   PROCESS LAYOUTS (Only for workflows):
   \u2022 Title + 3-4 Step Boxes: Linear horizontal flow
   \u2022 Title + Simple Timeline: Minimal, clean progression

5. VISUAL STYLING - Keep it Clean
   - Colors: Use 2-3 from themeGuidelines palette MAX
   - Background: White or very light solid color (no busy patterns)
   - Cards/Boxes: Rounded corners (12px), subtle shadow (1-2px blur)
   - Lines: Minimal use, thin (1-2px), muted colors
   - Icons: Simple, consistent style, not too many

6. TYPOGRAPHY - Readable & Clear
   - Title: 28-36px bold
   - Body text: 16-20px regular
   - Captions: 12-14px light
   - Line height: 1.5-1.6 for readability
   - Max 2 font sizes per slide (title + body)

7. WHAT TO AVOID - Common Clutter Mistakes
   \u2717 Multiple competing visual elements
   \u2717 Dense text blocks (break into bullets)
   \u2717 Decorative borders or frames
   \u2717 Too many colors (stick to 2-3)
   \u2717 Complex diagrams with many connections
   \u2717 Small text crammed together
   \u2717 Background patterns or textures
   \u2717 More than one layout pattern per slide

8. ACCESSIBILITY
   - Text contrast: Minimum 4.5:1 (7:1 for key info)
   - Font size: Minimum 16px for body text
   - Clear hierarchy with size and weight

OUTPUT FORMAT:
XML:
<mxfile>...</mxfile>

NOTES:
- Brief explanation of layout choice
`;
const SYSTEM_MESSAGE_SVG = `
You are a senior presentation designer for FlowPilot Studio, creating clean, professional slides using SVG format.

GOLDEN RULES OF CLEAN SLIDE DESIGN:

1. SIMPLICITY FIRST
   - ONE main idea per slide
   - Maximum 3-5 content elements
   - 40-50% white space
   - Clean, uncluttered layouts

2. VISUAL HIERARCHY
   - Clear title (28-36px bold)
   - One focal point
   - Supporting elements smaller
   - Logical eye flow

3. CANVAS & SPACING
   - ViewBox: 1280\xD7720
   - Margins: 60-80px from edges
   - Element spacing: 30-40px minimum
   - Consistent alignment

4. SIMPLE LAYOUTS (Choose ONE):
   \u2022 Title + Bullets (3-5 items)
   \u2022 Title + Single Visual
   \u2022 Title + 2-Column (text + image)
   \u2022 Title + Centered Stat/Quote
   \u2022 Title + 2-4 KPI Cards
   \u2022 Title + 3-4 Step Boxes

5. CLEAN STYLING
   - 2-3 colors maximum
   - White/light background
   - Rounded corners (12px), subtle shadows
   - Minimal lines and decorations

6. TYPOGRAPHY
   - Title: 28-36px bold
   - Body: 16-20px regular
   - Line height: 1.5-1.6

7. AVOID CLUTTER
   \u2717 Multiple layouts on one slide
   \u2717 Dense text
   \u2717 Too many colors
   \u2717 Decorative elements
   \u2717 Complex diagrams

8. ACCESSIBILITY
   - Contrast: 4.5:1 minimum
   - Text: \u226516px

OUTPUT FORMAT:
SVG:
<svg viewBox="0 0 1280 720">...</svg>

NOTES:
- Layout rationale
`;
function extractPayload(text, mode) {
  const notesSection = text.split(/NOTES:/i)[1]?.trim();
  if (mode === "svg") {
    const svgMatch = text.match(/<svg[\s\S]+<\/svg>/i);
    if (!svgMatch) {
      throw new Error("\u672A\u68C0\u6D4B\u5230\u6709\u6548\u7684 SVG \u5185\u5BB9\u3002");
    }
    const svg = svgMatch[0];
    const { rootXml } = buildSvgRootXml(svg);
    const mxfile = `<mxfile><diagram name="Page-1" id="page-1"><mxGraphModel>${rootXml}</mxGraphModel></diagram></mxfile>`;
    return { xml: mxfile, notes: notesSection };
  }
  const xmlMatch = text.match(/<mxfile[\s\S]+<\/mxfile>/i);
  if (!xmlMatch) {
    throw new Error("\u672A\u68C0\u6D4B\u5230\u6709\u6548\u7684 mxfile \u5185\u5BB9\u3002");
  }
  return { xml: xmlMatch[0], notes: notesSection };
}
async function POST(req) {
  try {
    const payload = requestSchema.parse(await req.json());
    const { slide, blueprintContext, styleLocks, renderMode = "drawio", modelRuntime } = payload;
    const resolvedModel = resolveChatModel(modelRuntime);
    const layoutGuidance = `
SLIDE DESIGN GUIDELINES:

\u2713 DO:
- Keep it simple - one clear message per slide
- Use generous white space (at least 40% empty)
- Choose ONE layout pattern that fits the content
- Limit to 3-5 content items maximum
- Use clear visual hierarchy (title > main content > details)
- Maintain 60-80px margins from canvas edges
- Space elements 30-40px apart minimum

\u2717 DON'T:
- Combine multiple layout patterns
- Cram too much information
- Use decorative elements without purpose
- Apply more than 2-3 colors
- Create dense or cluttered arrangements
- Use small text (<16px) for body content

LAYOUT SELECTION (Pick the simplest one that works):
1. Bullet List - For lists, features, key points
2. Single Visual - For showing one diagram/image
3. Two-Column - For comparison or text + visual
4. Centered Stat - For highlighting one number/quote
5. KPI Cards - For showing 2-4 metrics
6. Step Boxes - For sequential process (3-4 steps max)

Remember: Professional slides are CLEAN and SIMPLE, not fancy or complex.
`.trim();
    const userPrompt = `
Create a ${renderMode === "svg" ? "clean SVG" : "clean draw.io"} slide following minimalist design principles.

SLIDE CONTENT:
${JSON.stringify(
      {
        title: slide.title,
        narrative: slide.narrative,
        bullets: slide.bullets,
        visualIdea: slide.visualIdea
      },
      null,
      2
    )}

THEME & CONSTRAINTS:
${JSON.stringify(
      {
        palette: blueprintContext.themeGuidelines.palette,
        typography: blueprintContext.themeGuidelines.typography,
        styleLocks
      },
      null,
      2
    )}

${layoutGuidance}

INSTRUCTIONS:
1. Choose the SIMPLEST layout that fits this content
2. Keep generous white space - don't fill every corner
3. Use clear hierarchy: large title, medium content, small details
4. Limit colors to 2-3 from the palette
5. Ensure clean, professional appearance - avoid clutter
`;
    const result = await generateText({
      model: resolvedModel.model,
      system: renderMode === "svg" ? SYSTEM_MESSAGE_SVG : SYSTEM_MESSAGE,
      prompt: userPrompt,
      temperature: 0.15
    });
    const { xml, notes } = extractPayload(result.text, renderMode === "svg" ? "svg" : "drawio");
    return NextResponse.json({
      result: {
        xml,
        reasoning: notes ?? ""
      }
    });
  } catch (error) {
    console.error("[ppt/render-slide] Failed:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "\u8F93\u5165\u53C2\u6570\u4E0D\u5408\u6CD5", details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "\u751F\u6210\u5E7B\u706F\u7247\u5931\u8D25\u3002";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
export {
  POST
};
