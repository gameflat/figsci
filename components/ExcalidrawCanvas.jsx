'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';
import '@excalidraw/excalidraw/index.css';

// Dynamically import Excalidraw with no SSR
const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
);

// Dynamically import convertToExcalidrawElements
const getConvertFunction = async () => {
  const excalidrawModule = await import('@excalidraw/excalidraw');
  return excalidrawModule.convertToExcalidrawElements;
};

export default function ExcalidrawCanvas({ elements }) {
  const [convertToExcalidrawElements, setConvertFunction] = useState(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);

  // Load convert function on mount
  useEffect(() => {
    getConvertFunction().then((fn) => {
      setConvertFunction(() => fn);
    });
  }, []);

  // Convert elements to Excalidraw format using useMemo
  const convertedElements = useMemo(() => {
    if (!elements || elements.length === 0 || !convertToExcalidrawElements) {
      return [];
    }

    try {
      console.log('Converting elements:', elements.length);
      const converted = convertToExcalidrawElements(elements);
      console.log('Converted to Excalidraw elements:', converted.length);
      return converted;
    } catch (error) {
      console.error('Failed to convert elements:', error);
      return [];
    }
  }, [elements, convertToExcalidrawElements]);

  // Auto zoom to fit content when API is ready and elements change
  useEffect(() => {
    if (excalidrawAPI && convertedElements.length > 0) {
      // Small delay to ensure elements are rendered
      setTimeout(() => {
        try {
          excalidrawAPI.scrollToContent(convertedElements, {
            fitToContent: true,
            animate: true,
            duration: 300,
          });
        } catch (error) {
          console.error('Failed to zoom to content:', error);
        }
      }, 100);
    }
  }, [excalidrawAPI, convertedElements]);

  // Generate unique key when elements change to force remount
  const canvasKey = useMemo(() => {
    if (convertedElements.length === 0) return 'empty';
    // Create a hash from elements to detect changes
    return JSON.stringify(convertedElements.map((el) => el.id)).slice(0, 50);
  }, [convertedElements]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Diagram Canvas</h2>
        {convertedElements.length > 0 && (
          <span className="text-sm text-gray-500">{convertedElements.length} elements</span>
        )}
      </div>

      {/* Canvas - Full height container */}
      <div className="flex-1 overflow-hidden">
        {convertedElements.length > 0 ? (
          <div className="w-full h-full">
            <Excalidraw
              key={canvasKey}
              excalidrawAPI={(api) => setExcalidrawAPI(api)}
              initialData={{
                elements: convertedElements,
                appState: {
                  viewBackgroundColor: '#ffffff',
                  currentItemFontFamily: 1,
                },
                scrollToContent: true,
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
                />
              </svg>
              <p className="text-lg font-medium">No diagram yet</p>
              <p className="text-sm mt-1">Generate and convert code to see the diagram here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

