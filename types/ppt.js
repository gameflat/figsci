import { z } from "zod";
const styleOverridesSchema = z.object({
  palette: z.array(z.string()).default([]),
  typography: z.string().optional(),
  iconography: z.string().optional(),
  layoutTone: z.string().optional()
});
const pptBriefSchema = z.object({
  topic: z.string().min(3, "\u8BF7\u63CF\u8FF0\u6F14\u793A\u4E3B\u9898"),
  audience: z.string().min(2, "\u8BF7\u63CF\u8FF0\u76EE\u6807\u542C\u4F17"),
  goal: z.enum(["inform", "pitch", "training", "report"]),
  tone: z.enum(["formal", "balanced", "energetic"]),
  slideCount: z.number().int().min(3).max(30),
  keywords: z.array(z.string()).default([]),
  narrativeFocus: z.string().optional(),
  referenceAssets: z.array(z.string()).default([]),
  constraints: z.object({
    palette: z.array(z.string()).default([]),
    forbidden: z.array(z.string()).default([]),
    mustInclude: z.array(z.string()).default([])
  }).default({
    palette: [],
    forbidden: [],
    mustInclude: []
  })
});
const slideBlueprintSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  narrative: z.string().min(1),
  bullets: z.array(z.string()).default([]),
  visualIdea: z.string().min(1),
  transitionNote: z.string().optional(),
  status: z.enum(["draft", "edited"]).default("draft")
});
const blueprintSchema = z.object({
  storyArc: z.string().min(1),
  themeGuidelines: z.object({
    palette: z.array(z.string()).default([]),
    typography: z.string(),
    iconography: z.string().optional(),
    layoutPrinciples: z.array(z.string()).default([])
  }),
  slides: z.array(slideBlueprintSchema).min(1)
});
const slideJobResultSchema = z.object({
  xml: z.string(),
  reasoning: z.string().optional(),
  previewUrl: z.string().optional().nullable()
});
const slideJobSchema = z.object({
  slideId: z.string(),
  prompt: z.string().optional(),
  seedXml: z.string().optional(),
  status: z.enum(["idle", "queued", "generating", "ready", "failed"]),
  startedAt: z.number().optional(),
  finishedAt: z.number().optional(),
  error: z.string().optional(),
  result: slideJobResultSchema.optional()
});
export {
  blueprintSchema,
  pptBriefSchema,
  slideBlueprintSchema,
  slideJobResultSchema,
  slideJobSchema,
  styleOverridesSchema
};
