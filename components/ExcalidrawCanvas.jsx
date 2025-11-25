'use client';

<<<<<<< HEAD
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
=======
import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';
import '@excalidraw/excalidraw/index.css';

// Dynamically import Excalidraw with no SSR
const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
);

export default function ExcalidrawCanvas({ elements, onElementsChange }) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [internalElements, setInternalElements] = useState([]);

  // 同步外部传入的 elements 到内部状态
  useEffect(() => {
    if (!elements || elements.length === 0) {
      setInternalElements([]);
    } else {
      setInternalElements(elements);
    }
  }, [elements]);

  // Auto zoom to fit content when API is ready and elements change
  useEffect(() => {
    if (excalidrawAPI && internalElements.length > 0) {
      // Small delay to ensure elements are rendered
      setTimeout(() => {
        excalidrawAPI.scrollToContent(internalElements, {
          fitToContent: true,
          animate: true,
          duration: 300,
        });
      }, 100);
    }
  }, [excalidrawAPI, internalElements]);

  // Generate unique key when elements change to force remount
  const canvasKey = useMemo(() => {
    if (internalElements.length === 0) return 'empty';
    // Create a hash from elements to detect changes
    return JSON.stringify(internalElements.map(el => el.id)).slice(0, 50);
  }, [internalElements]);

  const handleChange = (nextElements, appState, files) => {
    setInternalElements(nextElements);
    if (onElementsChange) {
      onElementsChange(nextElements, appState, files);
    }
  };

  return (
    <div className="w-full h-full">
      <Excalidraw
        key={canvasKey}
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        onChange={handleChange}
        initialData={{
          elements: internalElements,
          appState: {
            viewBackgroundColor: '#ffffff',
            // 使用打印体字体和较“硬”的线条，以符合学术风格
            currentItemFontFamily: 2,
            currentItemRoughness: 0,
          },
          scrollToContent: true,
        }}
      />
>>>>>>> origin/figsci
    </div>
  );
}

