'use client';

import { useState } from 'react';
import { CHART_TYPES } from '@/lib/constants';
import ImageUpload from './ImageUpload';

export default function Chat({ onSendMessage, isGenerating }) {
  const [activeTab, setActiveTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [chartType, setChartType] = useState('auto');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  const handleSend = () => {
    if (activeTab === 'text' && textInput.trim()) {
      onSendMessage(textInput, chartType, 'text');
    } else if (activeTab === 'file' && uploadedFile) {
      onSendMessage(uploadedFile.content, chartType, 'file');
    } else if (activeTab === 'image' && uploadedImage) {
      onSendMessage(
        {
          text: textInput || 'Convert this diagram to Excalidraw format',
          image: uploadedImage,
        },
        chartType,
        'image'
      );
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedFile({
        name: file.name,
        content: event.target.result,
      });
    };
    reader.readAsText(file);
  };

  const handleImageUpload = (imageData) => {
    setUploadedImage(imageData);
  };

  const canSend = () => {
    if (isGenerating) return false;
    if (activeTab === 'text') return textInput.trim().length > 0;
    if (activeTab === 'file') return uploadedFile !== null;
    if (activeTab === 'image') return uploadedImage !== null;
    return false;
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Input</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'text'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Text Input
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'file'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          File Upload
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'image'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Image Upload
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your diagram
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="E.g., Create a flowchart showing the user authentication process..."
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isGenerating}
              />
            </div>
          </div>
        )}

        {activeTab === 'file' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload text file (.txt, .md)
              </label>
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
              />
              {uploadedFile && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">File:</span> {uploadedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {uploadedFile.content.length} characters
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="space-y-4">
            <ImageUpload onImageUpload={handleImageUpload} disabled={isGenerating} />
            {uploadedImage && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional instructions (optional)
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="E.g., Focus on the main workflow, simplify the diagram..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={isGenerating}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Diagram Type</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isGenerating}
          >
            {CHART_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSend}
          disabled={!canSend()}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            canSend()
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isGenerating ? 'Generating...' : 'Generate Diagram'}
        </button>
      </div>
    </div>
  );
}

