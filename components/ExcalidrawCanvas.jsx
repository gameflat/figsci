'use client';

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
    </div>
  );
}

