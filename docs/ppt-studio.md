# AI PPT Studio — Implementation Blueprint

This document describes how to extend **FlowPilot Studio** with an end‑to‑end, production‑ready “AI 生成 PPT” capability. The solution is scoped so it can be fully implemented inside this repository without relying on speculative tech.

---

## 1. Product Goals & Success Criteria
- **One coherent workflow** that accepts PPT requirements, drafts a slide skeleton, lets users edit slide content, and finally renders multiple diagrams/slides in parallel.
- **Quality > novelty**: Each slide must be stylistically aligned (same palette, typography hints) and narratively consistent.
- **Zero broken UI**: Works on desktop (existing breakpoints ≥768px). Mobile still blocked, but the PPT studio UI must follow the established Tailwind/shadcn visual system.
- **Deterministic deliverables**: Users can export both draw.io XMLs and a `.pptx`. No placeholders, no “TODO” copy.

---

## 2. User Flow Overview
1. **Entry point** – “AI PPT Studio (实验功能)” button in the existing right sidebar (below QuickActionBar). Opens a dedicated workspace at `/ppt`.
2. **Brief intake** – Multi-field form captures topic, audience, tone, slide count, visual constraints, assets (optional images/diagrams to reference).
3. **Blueprint generation** – `/api/ppt/blueprint` calls LLM to create:
   - Story arc summary
   - Slide list with title, bullet intents, visual suggestions, narrative links
   - Global visual directives (palette, typography hints, iconography)
4. **Blueprint editing** – Users edit slide-by-slide (inline inputs). Changes stored in local context + autosaved draft (`localStorage` key `ppt-blueprint-draft`).
5. **Parallel slide rendering** – After confirmation, client batches requests to `/api/ppt/render-slide` (one per slide) with shared context. Progress indicators show per-slide status.
6. **Review & export** – Each slide shows: textual content, draw.io preview (iframe), status controls (retry, edit prompt). Users can export:
   - Zipped draw.io XMLs
   - A `.pptx` assembled via `pptxgenjs` (done server-side upon request)

---

## 3. UI & Interaction Spec
### 3.1 Navigation & Entry
- Add a **split-button** to the IntelligenceToolbar: primary continues current behavior, secondary dropdown adds “生成 PPT（实验室）”.
- Clicking opens `/ppt` (new route). Layout reuses `app/layout.tsx` shell; introduces horizontal tab header: `画图工作室 | PPT 工作室`.

### 3.2 PPT Workspace Layout
```
lg:grid lg:grid-cols-[360px_minmax(0,1fr)]
```
- **Left column** – Stepper:
  1. Brief (form inside `Card`)
  2. Blueprint (accordion list)
  3. Slides (progress list; clickable to focus)
- **Right column** – Contextual canvas:
  - Step 1: large form with autosave indicator
  - Step 2: blueprint editor with split view (story arc summary + slide list)
  - Step 3: slide detail view (preview, prompt tweaks, retry button, export controls)

### 3.3 Interactions
- **Validation**: Step button disabled until required fields complete (topic, slide count, goal).
- **Blueprint editing**: Each slide entry uses `Card` with title input, `Textarea` (bullets), extra fields for “视觉提示 / 关联上一页”. Provide reorder via drag handle (`dnd-kit` minimal).
- **Parallel generation**: On confirmation, show toast summarizing job (“共 8 页，正在生成…”). Each slide card displays statuses:
  - `idle | queued | generating | ready | failed`
  - includes progress ring + small logs (token usage, timestamp)
- **Retry**: `重生成` button reuses slide blueprint + (optional) user prompt override.
- **Style controls**: Side rail letting user lock palette/icons; writes into shared context object passed to every render call.

---

## 4. Data Model
```ts
export type PptBrief = {
  topic: string;
  audience: string;
  goal: "inform" | "pitch" | "training" | "report";
  tone: "formal" | "balanced" | "energetic";
  slideCount: number;
  keywords?: string[];
  assets?: { id: string; url: string; type: "image" | "diagram" }[];
  constraints?: { palette?: string[]; fonts?: string[]; avoid?: string[] };
};

export type SlideBlueprint = {
  id: string;
  title: string;
  narrative: string;
  bullets: string[];
  visualIdea: string;
  transitionNote?: string; // ties to previous slide
  status: "draft" | "edited";
};

export type Blueprint = {
  storyArc: string;
  themeGuidelines: { palette: string[]; typography: string; iconography: string };
  slides: SlideBlueprint[];
};

export type SlideJob = {
  slideId: string;
  prompt: string;
  seedXml?: string;
  status: "idle" | "queued" | "generating" | "ready" | "failed";
  result?: { xml: string; previewSvg: string; reasoning: string };
  error?: string;
};
```

State stored in a dedicated context `PptStudioContext` (Zustand or React reducer) with actions:
- `setBrief`, `setBlueprint`, `updateSlide`, `reorderSlides`
- `queueSlides(slideIds: string[])`, `updateSlideJob(jobPatch)`
- `completeSlide(slideId, result)` etc.

Persistence: keep `brief` + `blueprint` drafts in `localStorage`, but generation results live only in runtime state (to avoid stale draws).

---

## 5. Backend APIs
### 5.1 `POST /api/ppt/blueprint`
**Request**
```json
{
  "brief": { ...PptBrief },
  "modelRuntime": { ...existing chat config }
}
```
**Implementation**
- Use `resolveChatModel` + `streamText` similar to `/api/chat`. Prompt instructs LLM to output strict JSON conforming to `Blueprint`. Validate via `zod` before returning.
- Temperature low (0.3) for determinism.
- Response: `Blueprint` object.

### 5.2 `POST /api/ppt/render-slide`
**Request**
```json
{
  "slide": SlideBlueprint,
  "blueprintContext": {
      "storyArc": string,
      "themeGuidelines": { ... },
      "previousSlideSummary": string | null
  },
  "modelRuntime": {...},
  "styleLocks": {...optional user overrides...}
}
```
**Implementation**
- Reuse draw.io generation logic: feed combined prompt (story arc + slide narrative + style directives) into LLM.
- `tools.display_diagram` remains the path for returning XML.
- For concurrency, allow `Promise.allSettled` on client; server route remains stateless.
- Response: `SlideJobResult` with `xml`, `svg` (converted server-side using existing `extractDiagramXML` helper) plus `notes`.

### 5.3 `POST /api/ppt/export`
**Request** – array of `{ slideId, title, xml }`.
**Implementation**
- Use `pptxgenjs` in the API route:
  - Convert each draw.io SVG to PNG using `@resvg/resvg-js` (already used?) or `sharp`.
  - Place PNG into PPT slide background, add textual bullets (optional).
- Return `application/vnd.openxmlformats-officedocument.presentationml.presentation` stream.
**Fallback** – if conversion libs too heavy for edge runtime, mark route as `dynamic = "force-static"` + `runtime = "nodejs"` and rely on Node environment (Vercel supports).

---

## 6. Prompt Engineering
### Blueprint Prompt
- System: “你是资深演示文稿策略顾问… output MUST be valid JSON schema…”.
- Include:
  - Slide count
  - Audience/tone
  - Must reference previous/next slide connections.
- Validate JSON; if invalid, re-ask model once.

### Slide Rendering Prompt
- System emphasises: maintain palette, reuse iconography, keep within draw.io bounds.
- User content merges:
  - Slide blueprint (title, bullets)
  - Global theme guidelines
  - Transition note + previous slide summary
  - Style locks from UI
- Encourage consistent layout by providing deterministic anchor positions (e.g., grid).

---

## 7. Parallel Generation & Error Handling
- Client orchestrator (`usePptOrchestrator`) similar to `useDiagramOrchestrator`:
  - Accepts `slideIds[]`, batches `maxConcurrent = 3` to prevent API throttling.
  - Emits events for UI progress + logging.
- Failed slide retains blueprint + error reason; user can edit and retry.
- Provide “Abort All” button: cancels outstanding fetches via `AbortController`.
  
---

## 8. Implementation Plan
1. **Foundations**
   - Create `/app/(studios)/ppt/page.tsx` + route-specific layout.
   - Add navigation entry + feature flag (e.g., `NEXT_PUBLIC_ENABLE_PPT=1`).
   - Implement `PptStudioContext` with reducer + persistence hooks.
2. **Step 1 UI (Brief form)**
   - Build form component with validations (`react-hook-form` + `zod`).
   - Autosave to localStorage on change.
3. **Blueprint API + UI**
   - Implement `/api/ppt/blueprint` route.
   - Create `useBlueprintGenerator` hook (wraps `useMutation` from `react-query` or custom).
   - Render accordion-based editor with inline inputs + reorder.
4. **Slide Orchestrator**
   - Define `SlideJobs` state + `usePptOrchestrator` for queueing/generation/abort.
   - Build slide list UI with status badges, preview placeholders.
5. **Rendering API & Preview**
   - `/api/ppt/render-slide` reuses diagram prompt logic.
   - On success, load `xml` into hidden draw.io frame via `DrawIoEmbed` to fetch `svg` preview, or convert server-side.
6. **Export Layer**
   - Implement `/api/ppt/export`.
   - Front-end export bar offering: download PPT, download zipped XML.
7. **Polish & QA**
   - Instrument logging (Sentry/Breadcrumb?). At least console + toast error.
   - Add integration tests for API schema validation (Vitest).
   - Manual QA checklist: blueprint editing, concurrent regen, export.

---

## 9. Technical Risks & Mitigations
- **LLM JSON drift** – Guard by validating with `zod` + fallback `response.text()` re-parse attempt.
- **draw.io iframe load** – Use a dedicated hidden embed for PPT mode to avoid interfering with main canvas; or server render to SVG.
- **PPT export size** – Batch convert images to 1280x720; compress PNG.
- **API concurrency limits** – Limit concurrent slide renders to 3-4; queue rest.

---

## 10. Next Steps
1. Confirm enabling flag + navigation design with stakeholders.
2. Estimate LLM/token costs per PPT (blueprint + slides) to update pricing.
3. Implement according to plan above (roughly 2 dev-weeks).

Once these steps are complete, FlowPilot Studio will ship a fully functional, user-ready AI PPT feature rather than a prototype.
