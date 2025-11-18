'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Excalidraw with SSR disabled
const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false }
);

export default function ExcalidrawCanvas({ elements }) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [convertedElements, setConvertedElements] = useState([]);
  const [key, setKey] = useState(Date.now());

  useEffect(() => {
    if (!elements || elements.length === 0) {
      setConvertedElements([]);
      return;
    }

    // Convert skeleton elements to full Excalidraw elements
    const convert = async () => {
      try {
        const { convertToExcalidrawElements } = await import('@excalidraw/excalidraw');
        const converted = convertToExcalidrawElements(elements);
        setConvertedElements(converted);

        // Force remount to ensure clean rendering
        setKey(Date.now());
      } catch (error) {
        console.error('Failed to convert elements:', error);
      }
    };

    convert();
  }, [elements]);

  useEffect(() => {
    if (excalidrawAPI && convertedElements.length > 0) {
      // Auto-zoom to fit content
      setTimeout(() => {
        try {
          excalidrawAPI.scrollToContent(convertedElements, {
            fitToContent: true,
            animate: true,
          });
        } catch (error) {
          console.error('Failed to zoom to content:', error);
        }
      }, 100);
    }
  }, [excalidrawAPI, convertedElements]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Diagram Canvas</h2>
        {convertedElements.length > 0 && (
          <span className="text-sm text-gray-500">{convertedElements.length} elements</span>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        {convertedElements.length > 0 ? (
          <Excalidraw
            key={key}
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            initialData={{
              elements: convertedElements,
              appState: {
                viewBackgroundColor: '#ffffff',
                currentItemStrokeColor: '#1e1e1e',
                currentItemBackgroundColor: '#a5d8ff',
                currentItemFillStyle: 'solid',
                currentItemStrokeWidth: 2,
                currentItemRoughness: 1,
                currentItemOpacity: 100,
                currentItemFontFamily: 1,
                currentItemFontSize: 16,
                currentItemTextAlign: 'center',
                gridSize: null,
                zenModeEnabled: false,
              },
            }}
            UIOptions={{
              canvasActions: {
                loadScene: false,
                export: { saveFileToDisk: true },
                toggleTheme: true,
              },
            }}
          />
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

