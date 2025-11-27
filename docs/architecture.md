# FlowPilot Studio Architecture

## 1. Layered Overview

Inspired by Google-scale frontend guidelines, the workspace now follows three concentric layers that keep responsibilities isolated and composable:

1. **App Layer (`app/`)** – Next.js routes, layouts, and page-level wiring. Only imports feature-facing entry points and framework providers.
2. **Feature Layer (`features/`)** – Vertical slices that own their state orchestration, hooks, and view primitives. Each feature exposes a narrow surface (usually a React component or hook) to the app layer.
3. **Shared Layer (`components/`, `lib/`, `contexts/`, `hooks/`, `types/`)** – Pure UI atoms, contexts, and utilities that can be reused by any feature without leaking business logic.

All new capability should land inside `features/<domain>` with colocated hooks/components/tests so that future contributors only need to open a single folder to evolve a feature.

## 2. Directory Layout

```
app/
components/
contexts/
features/
  chat-panel/
    components/
      intelligence-toolbar.tsx
      tool-panel-sidebar.tsx
    hooks/
      use-comparison-workbench.ts
      use-diagram-orchestrator.ts
    utils/
      attachments.ts
      messages.ts
    constants.ts
    types.ts
hooks/
lib/
public/
types/
```

Key points:
- **Feature isolation** – `features/chat-panel` encapsulates everything specific to conversational tooling (state machines, UI chrome, helpers). Nothing outside the folder needs to know how comparison previews or auto-repair behave.
- **Shared contexts** – `contexts/diagram-context` and `contexts/conversation-context` remain source-of-truth providers. Feature hooks consume their APIs instead of duplicating logic.
- **Pure UI atoms** – `components/` keeps generic UI such as `ChatMessageDisplay`, `ChatInputOptimized`, etc. They receive data/handlers via props and remain unaware of orchestration details.

## 3. Chat Panel Decomposition

The original `ChatPanelOptimized` (≈2000 LOC) mixed transport logic, comparison flows, auto-repair, and UI markup. It has been decomposed as follows:

### Hooks
- `useDiagramOrchestrator`
  - Owns Draw.io XML lifecycle (apply/validate/auto-repair) and exposes `handleDiagramXml`, `tryApplyRoot`, and ref utilities for feature consumers.
  - Centralizes runtime error handling so any consumer just calls a single function to sync canvas state.
- `useComparisonWorkbench`
  - Manages model comparison workflows: branch creation, preview/apply/retry flows, notice queue, configuration modal state, and request plumbing.
  - Returns "guard" helpers (`ensureBranchSelectionSettled`, `releaseBranchRequirement`, `notifyComparison`) so other UI actions can short-circuit when comparison decisions are pending.

### Components
- `IntelligenceToolbar` – Renders the smart-tool toggle group with a clear API.
- `ToolPanelSidebar` – Shared shell for side panels (brief, calibration, templates) keeping markup out of the main file.

### Utilities & Constants
- `constants.ts` – Hosts FlowPilot calibration prompt, toolbar metadata, and curated quick actions so designers can tweak content without touching component logic.
- `utils/messages.ts` & `utils/attachments.ts` – Side-effect helpers for cloning chat history and serializing user uploads.

### Entry Component (`components/chat-panel-optimized.tsx`)
Now focused on wiring:
- Consumes feature hooks and contexts.
- Handles UI-only concerns (form inputs, toggles, stacked cards).
- Delegates heavy flows to hooks/components via props.

Net result: `ChatPanelOptimized` shrank by ~60%, and each behavior can evolve independently.

## 4. Extending the System

When adding features, follow this workflow:
1. **Create a feature slice** under `features/<domain>/` with colocated hooks and view primitives.
2. **Use context contracts** instead of reaching into unrelated modules. For example, branch operations must go through `useConversationManager`.
3. **Expose minimal entry points** – export a hook or component that the app layer can consume; keep everything else private to the feature.
4. **Prefer composition** – when UI grows, add presentational components (like the new toolbar/banner/sidebar) rather than expanding container files.
5. **Document flows** – update this doc when new modules/flows are added so future contributors understand the dependency graph quickly.

## 5. Cleanup Notes

- Removed legacy, unused components from `components/_unused` to keep the surface area lean.
- Normalized quick actions/templates through `features/chat-panel/constants.ts`, making it trivial to add or reorder presets without touching logic.

## 6. Future Guidelines

- Keep feature folders self-sufficient: every nontrivial hook should live beside the UI that consumes it.
- Use TypeScript types from `features/.../types.ts` for cross-file contracts; only promote a type to `types/` if multiple features need it.
- When dealing with async workflows, centralize side effects inside hooks that can be unit-tested in isolation.
- Before touching `app/` routes, consider whether the work actually belongs to a feature slice.

This structure keeps the project aligned with large-scale frontend practices: clear boundaries, discoverable modules, and the ability to iterate on features without spelunking through unrelated files.
