'use client';

import { useState, useEffect } from 'react';
import Chat from '@/components/Chat';
import CodeEditor from '@/components/CodeEditor';
import ExcalidrawCanvas from '@/components/ExcalidrawCanvas';
import ConfigManager from '@/components/ConfigManager';
import HistoryModal from '@/components/HistoryModal';
import { getActiveConfig, initializeConfigs } from '@/lib/config-manager';
import { addHistoryEntry } from '@/lib/history-manager';
import { extractJSONArray, validateExcalidrawElements } from '@/lib/json-repair';

export default function Home() {
  const [config, setConfig] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [excalidrawElements, setExcalidrawElements] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentInput, setCurrentInput] = useState(null);
  const [currentChartType, setCurrentChartType] = useState('auto');

  useEffect(() => {
    // Initialize configs first, then load active config
    initializeConfigs();
    const activeConfig = getActiveConfig();
    if (activeConfig) {
      setConfig(activeConfig);
    }

    // Listen for config updates
    const handleConfigsUpdated = () => {
      const updatedConfig = getActiveConfig();
      if (updatedConfig) {
        setConfig(updatedConfig);
      }
    };
    window.addEventListener('configsUpdated', handleConfigsUpdated);

    return () => {
      window.removeEventListener('configsUpdated', handleConfigsUpdated);
    };
  }, []);

  const handleSendMessage = async (userInput, chartType, sourceType) => {
    if (!config) {
      alert('Please configure your OpenAI API settings first');
      return;
    }

    // Debug: Log the config being sent
    console.log('Sending request with config:', {
      hasBaseUrl: !!config.baseUrl,
      hasApiKey: !!config.apiKey,
      hasModel: !!config.model,
      config: { ...config, apiKey: config.apiKey ? '***' : 'missing' }
    });

    setIsGenerating(true);
    setCurrentInput(userInput);
    setCurrentChartType(chartType);
    setGeneratedCode('');
    setExcalidrawElements([]);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          userInput,
          chartType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate diagram');
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedCode = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                throw new Error(parsed.error);
              }

              if (parsed.content) {
                accumulatedCode += parsed.content;
                setGeneratedCode(accumulatedCode);
              }
            } catch (e) {
              console.warn('Failed to parse chunk:', e);
            }
          }
        }
      }

      // Clean up the generated code and auto-apply
      const cleanedCode = cleanExcalidrawCode(accumulatedCode);
      setGeneratedCode(cleanedCode);

      // Auto-apply the code
      tryParseAndApply(cleanedCode);

      // Save to history
      addHistoryEntry({
        userInput,
        chartType,
        generatedCode: cleanedCode,
        config: {
          name: config.name,
          model: config.model,
        },
      });
    } catch (error) {
      console.error('Generation error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const tryParseAndApply = (code) => {
    try {
      // Use JSON repair utility to extract and parse
      const elements = extractJSONArray(code);

      if (!elements) {
        throw new Error('Could not extract JSON array from generated code');
      }

      // Validate elements
      const validation = validateExcalidrawElements(elements);
      if (!validation.valid) {
        console.error('Invalid Excalidraw elements:', validation.errors);
        alert(
          `Generated JSON has validation errors:\n${validation.errors.join('\n')}\n\nPlease try generating again.`
        );
        return;
      }

      console.log(`✅ Successfully parsed ${validation.elementCount} Excalidraw elements`);
      setExcalidrawElements(elements);
    } catch (error) {
      console.error('Failed to parse and apply code:', error);

      // Show user-friendly error message
      let errorMessage = 'Failed to parse the generated diagram code.\n\n';

      // Add line number if available
      if (error.errorLine) {
        errorMessage += `❌ Error at line ${error.errorLine}\n\n`;
      }

      if (error.errorContext) {
        errorMessage += `Error near:\n"${error.errorContext.trim()}"\n\n`;
      }

      errorMessage +=
        'This may be due to:\n' +
        '1. Missing comma between properties (most common)\n' +
        '2. The LLM generated malformed JSON\n' +
        '3. The response was incomplete\n\n' +
        'To fix:\n' +
        '✏️ Click "Edit" button in the middle panel\n' +
        '🔍 Look for line ' + (error.errorLine || 'with the error') + '\n' +
        '➕ Add missing commas or fix syntax\n' +
        '💾 Click "Save Changes" → "Convert to Diagram"\n\n' +
        'Or:\n' +
        '- Generate again (LLM may fix it automatically)\n' +
        '- Try a simpler prompt\n' +
        '- Check console (F12) for detailed error';

      alert(errorMessage);
    }
  };

  const handleApplyCode = () => {
    tryParseAndApply(generatedCode);
  };

  const handleClearCode = () => {
    if (confirm('Clear the generated code?')) {
      setGeneratedCode('');
      setExcalidrawElements([]);
    }
  };

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
  };

  const handleApplyHistory = (entry) => {
    setGeneratedCode(entry.generatedCode || '');
    setCurrentInput(entry.userInput);
    setCurrentChartType(entry.chartType);

    // Auto-apply if code exists
    if (entry.generatedCode) {
      tryParseAndApply(entry.generatedCode);
    }
  };

  const cleanExcalidrawCode = (code) => {
    // Remove markdown code fences
    let cleaned = code.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    // Trim whitespace
    cleaned = cleaned.trim();
    return cleaned;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Figsci</h1>
            <p className="text-sm text-gray-600">AI-Powered Diagram Generator</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              History
            </button>
          </div>
        </div>
        <ConfigManager onConfigChange={handleConfigChange} />
      </header>

      {/* Main Content - 3 Panel Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat Input */}
        <div className="w-1/3 min-w-[300px] max-w-[500px]">
          <Chat onSendMessage={handleSendMessage} isGenerating={isGenerating} />
        </div>

        {/* Middle Panel - Code Editor */}
        <div className="w-1/3 min-w-[300px]">
          <CodeEditor
            code={generatedCode}
            onChange={setGeneratedCode}
            onConvert={handleApplyCode}
            onClear={handleClearCode}
          />
        </div>

        {/* Right Panel - Excalidraw Canvas */}
        <div className="flex-1">
          <ExcalidrawCanvas elements={excalidrawElements} />
        </div>
      </main>

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onApplyHistory={handleApplyHistory}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>Figsci v0.2.0 - AI Diagram Generation Tool</p>
          <p>
            {generatedCode && (
              <span className="text-green-600 font-medium">✓ Code generated</span>
            )}
            {excalidrawElements.length > 0 && (
              <span className="text-blue-600 font-medium ml-4">
                ✓ {excalidrawElements.length} elements rendered
              </span>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
