# Troubleshooting Guide - Figsci_new

## Fixed: JSON Parse Error (Malformed LLM Output)

### Problem
When the LLM generates Excalidraw JSON code, sometimes it produces malformed JSON with syntax errors like:
```
JSON Parse error: Expected '}'
```

Common issues in LLM-generated JSON:
- Missing commas between properties
- Missing closing quotes
- Incomplete JSON (truncated response)
- Extra spaces or characters

### Root Cause
Large Language Models sometimes generate syntactically incorrect JSON, especially with:
- Complex nested structures
- Long responses that get truncated
- Multiple properties on the same line
- Non-English text in labels

### Solution Applied
Three improvements were made:

#### 1. JSON Repair Utility
**File**: `lib/json-repair.js`

Created a comprehensive JSON repair utility that:
- Fixes missing commas between properties
- Repairs missing quotes
- Removes comments
- Balances brackets/braces
- Extracts JSON arrays from mixed content
- Validates Excalidraw elements

#### 2. Automatic Repair on Parse
**File**: `app/page.js`

The `tryParseAndApply()` function now:
- Attempts to parse the original JSON first
- If that fails, automatically repairs common issues
- Validates the parsed elements
- Shows detailed error messages if repair fails

#### 3. Manual Edit Mode
**File**: `components/CodeEditor.jsx`

Added an **"Edit"** button that allows you to:
- Manually fix JSON syntax errors
- Save the corrected code
- Re-convert to diagram

### How to Use

#### Automatic Repair (Usually Works)
1. Generate your diagram as normal
2. If JSON has minor errors, it will be **automatically repaired**
3. You'll see in console: `✅ JSON successfully repaired and parsed`
4. The diagram renders normally

#### Manual Fix (When Automatic Fails)
1. Look at the middle panel (Excalidraw Code)
2. Click the **"Edit"** button
3. Fix the JSON syntax error (look for missing commas, quotes, etc.)
4. Click **"Save Changes"**
5. Click **"Convert to Diagram"**

### Common JSON Errors & Fixes

#### Missing Comma
```json
❌ "property1": "value1"
   "property2": "value2"

✅ "property1": "value1",
   "property2": "value2"
```

#### Missing Quote
```json
❌ "startArrowhead": "circle        "endArrowhead": "arrow"

✅ "startArrowhead": "circle",
   "endArrowhead": "arrow"
```

#### Trailing Comma
```json
❌ {
     "type": "rectangle",
     "x": 100,
   }

✅ {
     "type": "rectangle",
     "x": 100
   }
```

## Fixed: "Invalid configuration" Error

### Problem
When clicking "Generate Diagram" after saving API configuration, you got:
```
Invalid configuration. Please check your API settings.
```

### Root Cause
The page component was loading the config before the ConfigManager had a chance to initialize the default configuration in localStorage. This created a race condition where the page would have `config = null` even after a configuration was saved.

### Solution Applied
Two changes were made to fix this issue:

#### 1. Initialize configs in page component
**File**: `app/page.js`

Added `initializeConfigs()` call before loading config:
```javascript
useEffect(() => {
  // Initialize configs first, then load active config
  initializeConfigs();  // ← Added this
  const activeConfig = getActiveConfig();
  if (activeConfig) {
    setConfig(activeConfig);
  }
}, []);
```

#### 2. Listen for config updates
**File**: `app/page.js`

Added event listener to reload config when it changes:
```javascript
// Listen for config updates
const handleConfigsUpdated = () => {
  const updatedConfig = getActiveConfig();
  if (updatedConfig) {
    setConfig(updatedConfig);
  }
};
window.addEventListener('configsUpdated', handleConfigsUpdated);
```

#### 3. Added debug logging
**Files**: `app/page.js` and `app/api/generate/route.js`

Added console logging to help diagnose configuration issues:
- Client logs what config is being sent (with masked API key)
- Server logs what config is received and validation status

## How to Test the Fix

### Step 1: Restart the Development Server
```bash
# Stop the current server (Ctrl+C)
# Start it again
npm run dev
```

### Step 2: Clear Browser Data (Optional but Recommended)
1. Open browser DevTools (F12)
2. Go to Application tab → Local Storage
3. Delete all `figsci_*` entries
4. Refresh the page

### Step 3: Configure API
1. Click the **"+"** button in Config bar
2. Enter your details:
   - **Configuration Name**: My OpenAI
   - **Base URL**: `https://api.openai.com/v1`
   - **API Key**: `sk-...` (your key)
   - **Model**: `gpt-4o`
3. Click **Save**

### Step 4: Test Generation
1. Open browser DevTools (F12) → Console tab
2. Enter your Chinese text in the input area:
   ```
   生成一张以环城绿带生态系统服务价值评估为题的硕士论文开题报告的技术路线图
   ```
3. Select diagram type (or leave as "Auto Detect")
4. Click **"Generate Diagram"**
5. Check console logs - you should see:
   ```
   Sending request with config: { hasBaseUrl: true, hasApiKey: true, hasModel: true, ... }
   ```

## What to Look For in Console

### ✅ Success
Client-side log:
```javascript
Sending request with config: {
  hasBaseUrl: true,
  hasApiKey: true,
  hasModel: true,
  config: { id: "...", name: "...", baseUrl: "https://...", apiKey: "***", model: "gpt-4o" }
}
```

Server-side log (in terminal):
```javascript
API received config: {
  exists: true,
  hasBaseUrl: true,
  hasApiKey: true,
  hasModel: true,
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o'
}
```

### ❌ If Still Failing

#### Scenario 1: Config is null
Client log shows:
```javascript
hasBaseUrl: false,
hasApiKey: false,
hasModel: false
```

**Solution**: 
- Refresh the page after saving config
- Check browser localStorage has `figsci_configs` and `figsci_active_config`
- Try clearing localStorage and reconfiguring

#### Scenario 2: Config has wrong structure
Server log shows:
```javascript
Config validation failed
```

**Solution**:
- Make sure you filled in ALL fields (Name, Base URL, API Key, Model)
- Check that Base URL doesn't have trailing spaces
- Verify API Key is valid and starts with `sk-`

#### Scenario 3: API endpoint unreachable
You'll see network error instead of validation error.

**Solution**:
- Check your internet connection
- Verify the Base URL is correct
- Test the API key with curl:
  ```bash
  curl https://api.openai.com/v1/models \
    -H "Authorization: Bearer sk-YOUR_KEY"
  ```

## Common Issues & Solutions

### Issue: "Please configure your OpenAI API settings first"
**Cause**: The config state is null  
**Fix**: The page now initializes configs automatically. Just refresh.

### Issue: Config disappears after refresh
**Cause**: localStorage is being cleared or blocked  
**Fix**: 
- Check if browser is in private/incognito mode
- Check browser settings allow localStorage
- Check for browser extensions that clear storage

### Issue: Multiple configs but wrong one selected
**Cause**: Active config ID doesn't match saved configs  
**Fix**: 
- Use the dropdown in Config bar to select the right config
- Or delete all configs and create a fresh one

### Issue: Chinese text not generating diagrams
**Cause**: This is actually working! GPT-4o supports Chinese.  
**Note**: Generation may take 10-30 seconds for complex requests.

## Debug Checklist

Before reporting an issue, check:

- [ ] Development server is running (`npm run dev`)
- [ ] Browser console is open to see logs
- [ ] Config is saved (check localStorage)
- [ ] All config fields are filled in
- [ ] API key is valid (not expired)
- [ ] API endpoint is reachable
- [ ] No ad-blockers or extensions interfering
- [ ] Using a modern browser (Chrome 90+, Firefox 88+, Safari 14+)

## Still Having Issues?

### Check Browser Console
Look for error messages in the Console tab (F12).

### Check Terminal
Look for error messages where `npm run dev` is running.

### Check Network Tab
1. Open DevTools → Network tab
2. Click "Generate Diagram"
3. Look for the `/api/generate` request
4. Check the request payload and response

### Verify localStorage
1. Open DevTools → Application tab
2. Go to Local Storage → `http://localhost:3000`
3. Verify these keys exist:
   - `figsci_configs`: Array of config objects
   - `figsci_active_config`: ID string

Example `figsci_configs`:
```json
[{
  "id": "config_1234567890_abc123",
  "name": "My OpenAI",
  "type": "openai",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-...",
  "model": "gpt-4o"
}]
```

## Removing Debug Logs (Optional)

Once everything is working, you can remove the debug console.log statements:

### In `app/page.js`
Remove lines 49-55:
```javascript
// Delete these lines
console.log('Sending request with config:', {
  hasBaseUrl: !!config.baseUrl,
  hasApiKey: !!config.apiKey,
  hasModel: !!config.model,
  config: { ...config, apiKey: config.apiKey ? '***' : 'missing' }
});
```

### In `app/api/generate/route.js`
Remove lines 17-25 and 29-31:
```javascript
// Delete these lines
console.log('API received config:', { ... });
console.error('Config validation failed:', { ... });
```

---

**Last Updated**: November 18, 2025  
**Fix Applied**: Configuration initialization race condition resolved

