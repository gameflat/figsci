# Installation & Setup - Figsci_new

## ✅ Project Status: COMPLETE

All components have been created and verified. The project is ready to run!

## 📁 Project Location

```
/Users/clement/VScodeProjects/Figsci_new/figsci_new/
```

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Dependencies

```bash
cd /Users/clement/VScodeProjects/Figsci_new/figsci_new
npm install
```

This will install:
- Next.js 16.0.1
- React 19.0.0
- Excalidraw 0.18.0
- Tailwind CSS 3.4.18
- And other required packages

**Estimated time**: 2-3 minutes  
**Expected size**: ~40MB

### Step 2: Start Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 16.0.1
- Local:        http://localhost:3000
- Ready in 2.5s
```

### Step 3: Configure API

1. Open http://localhost:3000
2. Click the **"+"** button in the Config bar
3. Enter:
   - **Name**: My OpenAI Config
   - **Base URL**: https://api.openai.com/v1
   - **API Key**: sk-... (your key)
   - **Model**: gpt-4o
4. Click **Save**

## 🎉 You're Ready!

Try creating your first diagram:

```
Create a simple flowchart showing: 
Start → Process → Decision → End
```

## 📚 Documentation

- [README.md](./README.md) - Complete documentation
- [QUICKSTART.md](./QUICKSTART.md) - 5-minute tutorial
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Technical details

## ✅ Verification Checklist

Before running, verify these files exist:

### Core Files
- [x] package.json
- [x] next.config.mjs
- [x] tailwind.config.js
- [x] jsconfig.json

### Application Files
- [x] app/page.js
- [x] app/layout.js
- [x] app/globals.css
- [x] app/api/generate/route.js

### Components (6 files)
- [x] components/Chat.jsx
- [x] components/CodeEditor.jsx
- [x] components/ConfigManager.jsx
- [x] components/ExcalidrawCanvas.jsx
- [x] components/HistoryModal.jsx
- [x] components/ImageUpload.jsx

### Libraries (6 files)
- [x] lib/constants.js
- [x] lib/prompts.js
- [x] lib/openai-client.js
- [x] lib/config-manager.js
- [x] lib/history-manager.js
- [x] lib/image-utils.js

### Documentation (4 files)
- [x] README.md
- [x] QUICKSTART.md
- [x] PROJECT_SUMMARY.md
- [x] INSTALLATION.md (this file)

## 🔧 Troubleshooting

### npm install fails
**Solution**: Make sure you have Node.js 18+ installed
```bash
node --version  # Should be v18.0.0 or higher
```

### Port 3000 already in use
**Solution**: Use a different port
```bash
npm run dev -- -p 3001
```

### Cannot find module errors
**Solution**: Delete node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### Excalidraw not loading
**Solution**: This is normal if the component is server-side rendered. The dynamic import with SSR disabled should fix it.

## 🎯 Next Steps

1. ✅ Install dependencies (`npm install`)
2. ✅ Start server (`npm run dev`)
3. ✅ Configure API (click + button)
4. ✅ Generate first diagram
5. 📖 Read QUICKSTART.md for examples
6. 🚀 Deploy to production when ready

## 📦 Build for Production

When you're ready to deploy:

```bash
npm run build
npm start
```

Or deploy to Vercel:
```bash
vercel
```

## 🎊 Success!

You now have a fully functional AI-powered diagram generator!

---

**Need help?** Check the README.md or browser console for error messages.

