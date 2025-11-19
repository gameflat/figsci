# Figsci - AI-Powered Diagram Generator

![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0.1-black.svg)
![React](https://img.shields.io/badge/React-19.0.0-61dafb.svg)

Figsci is a lightweight, AI-powered diagram generation tool that converts text descriptions, documents, and images into beautiful, editable diagrams using Excalidraw.

## ✨ Features

- 🤖 **AI-Powered Generation**: Uses GPT-4o to generate diagrams from natural language
- 📝 **Multiple Input Types**: Support for text input, file upload (.txt, .md), and image upload
- 🎨 **25+ Diagram Types**: Flowcharts, mind maps, sequence diagrams, architecture diagrams, and more
- 🖼️ **Interactive Canvas**: Fully interactive Excalidraw canvas with draggable, editable elements
- 💾 **History Management**: Save and restore previous diagram generations
- ⚙️ **Flexible Configuration**: Support for multiple OpenAI-compatible API endpoints
- 📱 **Responsive Layout**: Three-panel layout for optimal workflow

## 🏗️ Project Structure

```
figsci_new/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.js          # API endpoint for diagram generation
│   ├── globals.css               # Global styles
│   ├── layout.js                 # Root layout component
│   └── page.js                   # Main page with state management
├── components/
│   ├── Chat.jsx                  # User input component (text/file/image)
│   ├── CodeEditor.jsx            # Excalidraw JSON code viewer
│   ├── ConfigManager.jsx         # API configuration manager
│   ├── ExcalidrawCanvas.jsx      # Interactive diagram canvas
│   ├── HistoryModal.jsx          # Generation history modal
│   └── ImageUpload.jsx           # Image upload component
├── lib/
│   ├── config-manager.js         # Configuration persistence (localStorage)
│   ├── constants.js              # Application constants
│   ├── history-manager.js        # History persistence (localStorage)
│   ├── image-utils.js            # Image processing utilities
│   ├── openai-client.js          # OpenAI API client with streaming
│   └── prompts.js                # System and user prompts
├── package.json
├── tailwind.config.js
├── postcss.config.mjs
├── next.config.mjs
├── jsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or npm 9+
- OpenAI API key or compatible API endpoint

### Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd /Users/clement/VScodeProjects/Figsci_new/figsci_new
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

   This will install all required packages:
   - `next` (v16.0.1) - React framework
   - `react` & `react-dom` (v19.0.0) - React library
   - `@excalidraw/excalidraw` (v0.18.0) - Diagram canvas
   - `tailwindcss` - CSS framework
   - Development dependencies for linting and build

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### First-Time Setup

1. Click the **"+"** button in the Config bar at the top
2. Fill in your API configuration:
   - **Configuration Name**: A friendly name (e.g., "My OpenAI")
   - **Base URL**: API endpoint (default: `https://api.openai.com/v1`)
   - **API Key**: Your OpenAI API key
   - **Model**: Model to use (default: `gpt-4o`)
3. Click **Save**

## 📖 How to Use

### Workflow

The application follows a simple three-step workflow:

```
1. Input (Left Panel)     →    2. Generate (Middle Panel)    →    3. Render (Right Panel)
   User provides                   LLM generates                   Canvas displays
   text/file/image                 Excalidraw JSON                 interactive diagram
```

### Step-by-Step Guide

1. **Choose Input Type** (Left Panel):
   - **Text Input**: Describe your diagram in natural language
   - **File Upload**: Upload a `.txt` or `.md` file
   - **Image Upload**: Upload an existing diagram image (JPG, PNG, GIF, WebP)

2. **Select Diagram Type**:
   Choose from 25+ diagram types or use "Auto Detect":
   - Flowchart
   - Mind Map
   - Organization Chart
   - Sequence Diagram
   - Class Diagram (UML)
   - ER Diagram
   - Gantt Chart
   - Timeline
   - Architecture Diagram
   - And more...

3. **Generate Diagram**:
   Click **"Generate Diagram"** button. The system will:
   - Send your input to the LLM (GPT-4o)
   - Stream the generated Excalidraw JSON code
   - Automatically convert and render the diagram

4. **Interact with Canvas** (Right Panel):
   - Drag elements to reposition
   - Click to edit text
   - Use Excalidraw tools to modify
   - Export diagram (PNG, SVG, etc.)

### Example Prompts

**Flowchart**:
```
Create a flowchart showing the user authentication process with login, 
password verification, and success/failure paths.
```

**Mind Map**:
```
Create a mind map about machine learning with branches for supervised learning, 
unsupervised learning, and reinforcement learning.
```

**Architecture Diagram**:
```
Design a microservices architecture with API Gateway, user service, 
order service, and database layers.
```

## 🔧 Configuration

### API Configuration

The application supports multiple API configurations:

- **OpenAI Official API**: `https://api.openai.com/v1`
- **OpenAI-Compatible APIs**: Any endpoint that supports the OpenAI chat completion format
- **Custom Endpoints**: Third-party services like Azure OpenAI, etc.

You can create multiple configurations and switch between them easily.

### Environment Variables (Optional)

While the app uses localStorage for configuration, you can set default values:

```bash
# .env.local (optional)
NEXT_PUBLIC_DEFAULT_API_URL=https://api.openai.com/v1
NEXT_PUBLIC_DEFAULT_MODEL=gpt-4o
```

## 🛠️ Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

### Key Technologies

- **Next.js 16**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **Excalidraw**: Interactive diagramming library
- **Tailwind CSS**: Utility-first CSS framework
- **OpenAI API**: GPT-4o for diagram generation

## 🐛 Error Prevention

This project fixes several common errors from the previous version:

### ❌ Error 1: `USER_PROMPT_TEMPLATE.replace is not a function`
**Cause**: Exported constant instead of function  
**Fix**: Changed to `getUserPrompt()` function in `lib/prompts.js`

### ❌ Error 2: React list key warning in ConfigManager
**Cause**: Missing unique keys in mapped lists  
**Fix**: Added `key={config.id}` to all mapped elements

### ❌ Error 3: SSR mismatch with Excalidraw
**Cause**: Excalidraw not compatible with server-side rendering  
**Fix**: Used `dynamic` import with `{ ssr: false }` in ExcalidrawCanvas

### ❌ Error 4: Module import errors
**Cause**: Incorrect module paths and imports  
**Fix**: Proper use of `@/` path aliases via jsconfig.json

## 📦 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Other Platforms

The application can be deployed to any platform that supports Next.js:
- Vercel (recommended)
- Netlify
- Railway
- Docker containers

## 🎯 Features in Detail

### Automatic Diagram Conversion

The system automatically:
1. Receives user input (text/file/image)
2. Constructs optimized prompts for the LLM
3. Streams generated Excalidraw JSON in real-time
4. Parses and validates the JSON
5. Converts skeleton elements to full Excalidraw elements
6. Renders interactive diagram on canvas
7. Auto-zooms to fit content

### History Management

- Saves up to 50 recent generations
- Stores input, output, model, and timestamp
- One-click restore previous diagrams
- Persistent storage using localStorage

### Multi-Modal Input

- **Text**: Natural language descriptions
- **File**: Upload markdown or text documents
- **Image**: Upload diagrams and convert to Excalidraw format (requires vision model)

## 🔐 Security Notes

- API keys are stored in browser localStorage only
- No keys are sent to any server except your configured API endpoint
- Clear browser data to remove stored configurations

## 🤝 Contributing

This is a demonstration project. To contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is provided as-is for educational purposes.

## 🙏 Acknowledgments

- [Excalidraw](https://excalidraw.com/) - Amazing diagramming library
- [OpenAI](https://openai.com/) - GPT-4o API
- [Next.js](https://nextjs.org/) - React framework
- Original inspiration from `smart-excalidraw-next` project

## 📞 Support

If you encounter issues:
1. Check that your API key is valid
2. Verify your API endpoint is accessible
3. Check browser console for error messages
4. Ensure you have a stable internet connection

## 🔄 Version History

### v0.2.0 (Current)
- ✅ Fixed all error messages from v0.1
- ✅ Lightweight project structure
- ✅ Improved error handling
- ✅ Better component organization
- ✅ Enhanced documentation

### v0.1.0 (Previous - figsci)
- Initial release with errors
- Basic functionality working
- Multiple error messages in console

---

Made with ❤️ using Next.js, React, and Excalidraw

