# Quick Start Guide - Figsci

Get up and running with Figsci in 5 minutes!

## 🚀 Installation (2 minutes)

```bash
# Navigate to project directory
cd /Users/clement/VScodeProjects/Figsci_new/figsci_new

# Install all dependencies
npm install

# Start development server
npm run dev
```

## ⚙️ Configuration (1 minute)

1. Open [http://localhost:3000](http://localhost:3000)
2. Click the **"+"** button in the top Config bar
3. Enter your API details:
   - Name: `My OpenAI`
   - Base URL: `https://api.openai.com/v1`
   - API Key: `sk-...` (your OpenAI key)
   - Model: `gpt-4o`
4. Click **Save**

## 🎨 Create Your First Diagram (2 minutes)

### Example 1: Simple Flowchart

1. In the left panel, enter:
   ```
   Create a flowchart for making tea: 
   boil water → add tea bag → steep 3 minutes → remove bag → enjoy
   ```

2. Select **"Flowchart"** from Diagram Type dropdown

3. Click **"Generate Diagram"**

4. Watch as the code appears in the middle panel

5. The diagram automatically renders on the right canvas!

### Example 2: Mind Map

1. Switch to **Text Input** tab

2. Enter:
   ```
   Create a mind map about web development with these branches:
   - Frontend (React, Vue, Angular)
   - Backend (Node.js, Python, Java)
   - Database (SQL, NoSQL)
   - DevOps (Docker, CI/CD)
   ```

3. Select **"Mind Map"** from Diagram Type

4. Click **"Generate Diagram"**

### Example 3: Architecture Diagram

1. Enter:
   ```
   Design a three-tier web application architecture:
   - Presentation Layer: User Interface
   - Business Layer: API Gateway, Microservices
   - Data Layer: PostgreSQL, Redis Cache
   ```

2. Select **"Architecture Diagram"**

3. Click **"Generate Diagram"**

## 🖼️ Upload Image to Convert

1. Click **"Image Upload"** tab

2. Click **"Choose File"** and select a diagram image

3. Optionally add instructions like:
   ```
   Simplify this diagram and make it more professional
   ```

4. Click **"Generate Diagram"**

## 💡 Tips

### Getting Better Results

- **Be specific**: "Create a flowchart with 5 steps for user login" is better than "make a login diagram"
- **Include details**: Mention colors, labels, relationships
- **Choose right type**: Select the appropriate diagram type instead of "Auto Detect"

### Editing Diagrams

Once generated, you can:
- ✏️ Click elements to edit text
- 🖱️ Drag elements to reposition
- 🎨 Use Excalidraw tools to add shapes
- 💾 Export as PNG, SVG, or JSON

### Managing History

- Click **"History"** button to see past generations
- Click **"Apply"** to restore a previous diagram
- Click **"Clear All"** to remove history

## 🔧 Troubleshooting

### "Please configure your OpenAI API settings first"
→ You haven't set up an API configuration yet. Follow the Configuration section above.

### "Failed to generate diagram"
→ Check your API key is valid and has credits. Check browser console for details.

### Diagram not showing
→ Click the **"Convert to Diagram"** button in the middle panel.

### Elements overlapping
→ The AI sometimes generates overlapping elements. You can drag them apart manually.

## 📚 Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Explore all 25+ diagram types
- Try uploading documents and images
- Experiment with different models (GPT-4, Claude, etc.)

## 🎯 Common Use Cases

### For Students
- Create study notes as mind maps
- Visualize algorithms as flowcharts
- Design system architectures for projects

### For Developers
- Document API workflows
- Design database schemas (ER diagrams)
- Plan system architectures

### For Managers
- Create project timelines (Gantt charts)
- Visualize organizational structures
- Present SWOT analyses

---

**Happy Diagramming! 🎉**

Need help? Check the [README.md](./README.md) or examine error messages in the browser console.

