# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Drawio Next is a Next.js 16 application that generates editable Draw.io diagrams from natural language descriptions or reference images using LLM streaming. It combines Next.js App Router, Draw.io embed, and streaming LLM calls to create professional scientific diagrams.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (with webpack overlay)
pnpm dev

# Production build
pnpm build

# Start production server (requires build first)
pnpm start

# Run linter
pnpm lint
```

## Architecture

### Core Data Flow

1. **User Input** → Chat component (text or image upload)
2. **API Request** → `/api/generate` route with streaming SSE
3. **LLM Processing** → `lib/llm-client.js` handles OpenAI/Anthropic APIs
4. **Code Generation** → Streams Draw.io XML or JSON back to client
5. **Rendering** → Monaco Editor displays code, DrawioCanvas renders diagram

### Key Components Structure

**Main Page** (`app/page.js`):
- Single-page client component managing all state
- Split-panel layout: left (Chat + CodeEditor), right (DrawioCanvas)
- Handles streaming responses, truncation detection, and continuation logic
- Manages config, history, and access password state

**API Routes**:
- `/api/generate` - Main LLM generation endpoint with SSE streaming
- `/api/auth/validate` - Access password validation
- `/api/configs` - Server-side config management
- `/api/models` - Fetch available models from provider

**LLM Client** (`lib/llm-client.js`):
- Unified interface for OpenAI and Anthropic APIs
- Handles multimodal input (text + images) with provider-specific formatting
- Streaming support with chunk callbacks
- 120-second timeout with proper error handling

### Configuration System

Two modes of operation:

1. **Client-side configs** (default): Users manage multiple LLM configs in browser localStorage via ConfigManager
2. **Server-side config** (optional): Single shared config via `.env` with ACCESS_PASSWORD protection

Priority: Access password mode overrides client configs when enabled.

### State Management

All state in `app/page.js` using React hooks:
- `config` - Active LLM configuration
- `generatedCode` - Current XML/JSON code in editor
- `generatedXml` - Parsed XML for Draw.io canvas
- `elements` - Parsed JSON elements (alternative format)
- `isGenerating` - Streaming in progress
- `isTruncated` / `canContinue` - Handles incomplete LLM responses

### Streaming & Truncation Handling

The app detects incomplete XML by checking for missing closing tags (`</mxfile>`, `</diagram>`, `</mxGraphModel>`, `</root>`). When truncated:
1. Sets `isTruncated=true` and shows "继续生成" button
2. User clicks continue → sends `isContinuation=true` flag to API
3. API uses `CONTINUATION_SYSTEM_PROMPT` instead of `SYSTEM_PROMPT`
4. Smart concatenation removes duplicate opening tags from continuation

### Prompt System

Located in `lib/prompts.js`:
- `SYSTEM_PROMPT` - Main generation instructions
- `CONTINUATION_SYSTEM_PROMPT` - For completing truncated output
- `OPTIMIZATION_SYSTEM_PROMPT` - For advanced optimization
- `USER_PROMPT_TEMPLATE` - Formats user input with chart type

### History Management

`lib/history-manager.js` provides localStorage-based history:
- Stores last 20 generations
- Includes chartType, userInput, generatedCode, and config metadata
- Accessible via HistoryModal component

## Important Implementation Details

### Image Upload Flow

1. `ImageUpload` component converts image to base64
2. Validates size (≤5MB) and format (PNG/JPG/WebP/GIF)
3. Sends as `{ text, image: { data, mimeType } }` to API
4. API checks model supports vision (gpt-4o, claude-3, etc.)
5. `llm-client.js` formats for provider:
   - OpenAI: `image_url` with data URI
   - Anthropic: `image` block with base64 source

### XML Post-Processing

`postProcessDrawioCode()` in `app/page.js`:
- Removes markdown code fences (```xml, ```mxgraph)
- Validates presence of `<mxfile>` structure
- Called on every chunk during streaming

### Error Handling

- Network errors show in red banner at top of left panel
- JSON parsing errors show in CodeEditor with specific messages
- API errors propagate through SSE as `{ error: "message" }`
- Timeout after 120 seconds with user-friendly messages

## File Organization

```
app/
  api/
    generate/route.js       # Main LLM generation endpoint
    auth/validate/route.js  # Password validation
    configs/route.js        # Config management
    models/route.js         # Model fetching
  page.js                   # Main application page
  layout.js                 # Root layout

components/
  Chat.jsx                  # User input with chart type selector
  CodeEditor.jsx            # Monaco editor with actions
  DrawioCanvas.jsx          # Draw.io iframe integration
  ConfigManager.jsx         # Multi-config management UI
  ImageUpload.jsx           # Image upload with preview
  OptimizationPanel.jsx     # Advanced optimization options
  HistoryModal.jsx          # History browser
  AccessPasswordModal.jsx   # Password access UI
  ui/                       # Reusable UI components

lib/
  llm-client.js             # OpenAI/Anthropic API client
  prompts.js                # System and user prompts
  constants.js              # Chart types (20+ options)
  config-manager.js         # Config CRUD in localStorage
  history-manager.js        # History CRUD in localStorage
  optimizeArrows.js         # Arrow optimization utilities
  image-utils.js            # Image processing helpers
```

## Environment Variables

Optional server-side configuration (`.env`):

```bash
ACCESS_PASSWORD=your-secure-password
SERVER_LLM_TYPE=openai|anthropic
SERVER_LLM_BASE_URL=https://api.openai.com/v1
SERVER_LLM_API_KEY=sk-xxx
SERVER_LLM_MODEL=gpt-4
```

When set, users can enable "访问密码" mode to use shared server config instead of providing their own API keys.

## Chart Types

23 chart types defined in `lib/constants.js`:
- auto (LLM chooses)
- flowchart, mindmap, orgchart, sequence, class, er, gantt, timeline, tree, network, architecture, dataflow, state, swimlane, concept, fishbone, swot, pyramid, funnel, venn, matrix, infographic

## Technology Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Canvas**: Draw.io embed (iframe)
- **Editor**: @monaco-editor/react
- **Styling**: Tailwind CSS v4 (experimental)
- **LLM**: OpenAI/Anthropic compatible APIs with streaming
- **Storage**: localStorage for configs, history, and settings
