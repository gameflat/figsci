# Smart Drawio Next

> Generate **editable, professional, publication-ready** Draw.io diagrams in seconds using natural language or reference images.

## Live Demo

Try it online: https://smart-drawio-next.vercel.app/

(Requires your own API Key)

## Preview

![Transformer](./public/images/transformer.png)
![Swin-Transformer](./public/images/swin.png)
![CLIP](./public/images/clip.png)
![ProSST](./public/images/prosst.png)

## Project Overview

[smart-drawio-next](https://github.com/yunshenwuchuxun/smart-drawio-next) combines Next.js 16, Draw.io embed, and streaming LLM calls to enable you to:

- Generate structured diagrams automatically using natural language descriptions or uploaded screenshots
- Fine-tune generated JSON/XML code in Monaco Editor
- Sync results to the embedded Draw.io canvas with one click for visual adjustments
- Use the advanced optimization panel to let AI clean up layouts, unify styles, or add annotations

The project includes built-in features like multi-model configuration, access passwords, history tracking, and notification system, making it ready to deploy as a personal productivity tool or internal team service.

## Key Features

- **Native LLM Drawing Experience**: Streaming generation progress display with "Continue Generation" support for long content; manually specify 20+ diagram types or let the model auto-select (`lib/constants.js`)
- **Multimodal Input**: Drag-and-drop PNG/JPG/WebP/GIF (≤5 MB) or use file selection, paired with Vision models to convert existing diagrams into editable format (`components/ImageUpload`)
- **Dual Canvas Synchronization**: Monaco Editor for viewing/modifying raw code, Draw.io iframe for rendering and fine-tuning; supports reapplying code at any time (`components/CodeEditor` + `components/DrawioCanvas`)
- **Smart Optimization Pipeline**: One-click fixes for arrow anchors, line widths, and other common issues (`lib/optimizeArrows`), or use the advanced optimization panel to check/customize requirements for AI processing (`components/OptimizationPanel`)
- **Configuration Manager**: Create, copy, import/export any number of OpenAI/Anthropic-compatible configurations in the UI, with online model list testing (`components/ConfigManager`)
- **History & Notifications**: Last 20 generation records saved in browser localStorage for instant replay (`lib/history-manager`); notifications and confirmation dialogs enhance overall UX

## Interface & Modules

1. **Interaction Area (Chat + ImageUpload)**
   - Select diagram type, enter natural language, or upload reference images
   - Support for mid-generation stop, continue generation, and API error display

2. **Generated Code Area (CodeEditor)**
   - Monaco Editor displays JSON/XML with clear, optimize, advanced optimize, and apply actions
   - Instant error prompts for JSON parsing failures

3. **Canvas Area (DrawioCanvas / ExcalidrawCanvas)**
   - Embedded Draw.io iframe renders generated XML for continued visual fine-tuning
   - Can also map JSON elements to Draw.io components

4. **Auxiliary Modals**
   - `ConfigManager`: Multi-configuration management, online testing, import/export
   - `AccessPasswordModal`: Enable access password and validation
   - `HistoryModal`, `ContactModal`, `OptimizationPanel`, etc.

## Tech Stack

- **Frontend Framework**: Next.js 16 (App Router) + React 19
- **Canvas**: Draw.io embed
- **Editor**: @monaco-editor/react
- **Styling**: Tailwind CSS v4 (experimental) + custom design system
- **LLM Integration**: OpenAI/Anthropic-compatible APIs, Server Actions + Edge API routes
- **State Persistence**: localStorage (configuration, history, access password toggle)

## Quick Start

### Requirements

- Node.js ≥ 18.18 (Next.js 16 official requirement)
- pnpm ≥ 8 (recommended; adjust commands for other package managers)
- Valid OpenAI/Anthropic-compatible API Key (or server-side configuration with access password enabled)

### Installation & Launch

```bash
# Clone repository
git clone https://github.com/yunshenwuchuxun/smart-drawio-next.git
cd smart-drawio-next

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit http://localhost:3000 to start using.

### Common Scripts

| Command       | Description                                      |
|---------------|--------------------------------------------------|
| `pnpm dev`    | Start development environment (with webpack overlay) |
| `pnpm build`  | Production build                                 |
| `pnpm start`  | Start in production mode (requires `pnpm build` first) |
| `pnpm lint`   | Run ESLint                                       |

## LLM Configuration & Access Password

### Frontend Multi-Configuration Management (Default)

1. Click **"Configure LLM"** in the top-right corner
2. Select provider (OpenAI / Anthropic / Compatible Proxy)
3. Fill in `Base URL`, `API Key`, `Model`, etc., and click "Test Connection" for real-time validation
4. After saving, you can switch, clone, export, or import configurations from the list; all data is stored only in browser localStorage

### Server-Side Unified Configuration (Access Password Mode, Optional)

To let users share the same API Key, enable access password on the server:

1. Copy example configuration: `cp .env.example .env`
2. Fill in the following variables in `.env`:

| Variable Name         | Description                                           |
|-----------------------|-------------------------------------------------------|
| `ACCESS_PASSWORD`     | Access password users need to enter                   |
| `SERVER_LLM_TYPE`     | `openai` or `anthropic`                               |
| `SERVER_LLM_BASE_URL` | Compatible API endpoint (e.g., `https://api.openai.com/v1`) |
| `SERVER_LLM_API_KEY`  | Backend-held Key, stays on server only                |
| `SERVER_LLM_MODEL`    | Default model name to use                             |

3. After restarting the service, users can click "Access Password" in the frontend to enter the password and enable it, allowing `/api/generate` to automatically read server-side configuration; when enabled, it takes priority over local configuration.

> ✅ Access password is only validated server-side; the real API Key is never transmitted to the browser.

## FAQ

- **Will my API Key be uploaded?**
  No. Local configuration is saved in browser localStorage and only sent to your own server when calling `/api/generate`, which then requests external LLMs.

- **What if generation is truncated?**
  When the response is too long, a "Continue Generation" button will automatically appear. Clicking it sends `isContinuation=true` to `/api/generate` with context.

- **Image recognition fails?**
  Please select a Vision-capable model (e.g., GPT-4o, GPT-4.1, claude-3.5-sonnet, etc.) and ensure the image is under 5 MB in a common format.

- **History taking up space?**
  History keeps a maximum of 20 records; you can manually delete or clear all in the "History" modal.

- **Access password shows "not configured"?**
  You need to set both `ACCESS_PASSWORD` and a complete set of `SERVER_LLM_*` variables, otherwise the validation endpoint returns "Server access password not configured."

## Academic Standards Compliance

This tool is specifically designed for **top-tier academic conferences** (顶会标准) and enforces publication-quality standards:

### Typography
- Font: Arial/Helvetica (sans-serif)
- Sizes: 14-16pt (titles), 10-12pt (body text), 9-10pt (legends)

### Color Schemes
- **Grayscale** (primary): #F7F9FC, #2C3E50 - print-friendly
- **Blue**: #dae8fc, #3498DB - semantic differentiation
- **Green**: #d5e8d4, #82b366 - success/pass states
- **Yellow**: #fff2cc, #d6b656 - warnings/decisions
- **Red**: #f8cecc, #E74C3C - errors/bottlenecks

### Layout Rules
- Grid alignment (10px multiples)
- Consistent spacing (40-60px minimum between elements)
- 10% margins around diagrams
- 4:3 or 16:9 aspect ratios

### Supported Diagram Types (20+)
- Flowcharts, Architecture Diagrams, UML (Class/Sequence/Activity)
- ER Diagrams, State Machines, Network Topologies
- Data Flow Diagrams, Mind Maps, Gantt Charts
- Neural Network Architectures, and more

## Project Structure

```
/
├── app/
│   ├── layout.js                    # Root layout with fonts
│   ├── page.js                      # Main application page
│   ├── globals.css                  # Global styles
│   └── api/
│       ├── generate/route.js        # LLM diagram generation endpoint
│       ├── auth/validate/route.js   # Password validation
│       ├── models/route.js          # Model listing endpoint
│       └── configs/route.js         # Configuration management
├── components/
│   ├── Chat.jsx                     # User input interface
│   ├── CodeEditor.jsx               # Monaco editor wrapper
│   ├── DrawioCanvas.jsx             # Draw.io iframe integration
│   ├── ConfigManager.jsx            # Multi-config management UI
│   ├── OptimizationPanel.jsx       # Advanced optimization UI
│   ├── HistoryModal.jsx             # Generation history viewer
│   └── ui/                          # Reusable UI components
├── lib/
│   ├── prompts.js                   # System prompts (550+ lines)
│   ├── llm-client.js                # LLM API client
│   ├── constants.js                 # Chart type definitions
│   ├── config-manager.js            # Multi-config storage
│   ├── history-manager.js           # History persistence
│   └── optimizeArrows.js            # Arrow optimization logic
└── public/
    └── images/                      # Example diagrams
```

## Contributing

1. This project is modified from: https://github.com/liujuntao123/smart-excalidraw-next
2. Special thanks to all contributors who maintain public benefit services!
3. If this project helps you, please support it by:
   - ⭐ Starring the repository
   - 💬 Sharing with others who might need it

## License

MIT License – Free to use, copy, and distribute with attribution.
