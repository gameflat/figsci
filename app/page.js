'use client';

import { useState, useEffect } from 'react';
import Chat from '@/components/Chat';
import CodeEditor from '@/components/CodeEditor';
import ExcalidrawCanvas from '@/components/ExcalidrawCanvas';
import ConfigManager from '@/components/ConfigManager';
import HistoryModal from '@/components/HistoryModal';
import { getActiveConfig } from '@/lib/config-manager';
import { addHistoryEntry } from '@/lib/history-manager';

export default function Home() {
  const [config, setConfig] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [excalidrawElements, setExcalidrawElements] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentInput, setCurrentInput] = useState(null);
  const [currentChartType, setCurrentChartType] = useState('auto');

  useEffect(() => {
    // Load active config on mount
    const activeConfig = getActiveConfig();
    if (activeConfig) {
      setConfig(activeConfig);
    }
  }, []);

  const handleSendMessage = async (userInput, chartType, sourceType) => {
    if (!config) {
      alert('Please configure your OpenAI API settings first');
      return;
    }

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
      // Remove markdown code fences if present
      let cleanCode = code.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Try to extract JSON array
      const arrayMatch = cleanCode.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        const elements = JSON.parse(arrayMatch[0]);
        if (Array.isArray(elements)) {
          setExcalidrawElements(elements);
        }
      }
    } catch (error) {
      console.error('Failed to parse code:', error);
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
