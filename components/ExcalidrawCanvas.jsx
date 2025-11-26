'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';
import '@excalidraw/excalidraw/index.css';

// 动态导入 Excalidraw，无需 SSR
const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
);

// 动态导入 convertToExcalidrawElements
const getConvertFunction = async () => {
  const excalidrawModule = await import('@excalidraw/excalidraw');
  return excalidrawModule.convertToExcalidrawElements;
};

export default function ExcalidrawCanvas({ elements, onElementsChange }) {
  const [convertToExcalidrawElements, setConvertFunction] = useState(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [internalElements, setInternalElements] = useState([]);

  // 挂载点加载转换函数
  useEffect(() => {
    getConvertFunction().then(fn => {
      setConvertFunction(() => fn);
    });
  }, []);

  // 同步外部传入的 elements 到内部状态
  useEffect(() => {
    if (!elements || elements.length === 0) {
      setInternalElements([]);
    } else {
      setInternalElements(elements);
    }
  }, [elements]);

  // 将元素转换为 Excalidraw 格式
  const convertedElements = useMemo(() => {
    if (!elements || elements.length === 0) {
      return [];
    }

    // 检查元素是否已经是完整的 Excalidraw 元素（有 versionNonce 等属性）
    // 如果是完整元素，直接使用；如果是 skeleton，需要转换
    const isFullElement = elements.length > 0 && (
      'versionNonce' in elements[0] || 
      'version' in elements[0] ||
      elements.some(el => el.type === 'frame' && !('children' in el))
    );

    if (isFullElement || !convertToExcalidrawElements) {
      // 已经是完整元素，直接使用
      return elements;
    }

    try {
      // 过滤掉可能存在的 frame 元素，因为 convertToExcalidrawElements 可能不支持直接转换 frame
      // frame 应该通过 children 关系在 skeleton 中定义
      const filteredElements = elements.filter(el => {
        // 如果元素是 frame 类型但没有 children 属性，可能是完整元素，需要过滤
        if (el.type === 'frame' && !('children' in el)) {
          console.warn('Skipping frame element without children in skeleton format');
          return false;
        }
        return true;
      });
      
      return convertToExcalidrawElements(filteredElements);
    } catch (error) {
      console.error('Failed to convert elements:', error);
      // 如果转换失败，尝试直接使用原始元素
      return elements;
    }
  }, [elements, convertToExcalidrawElements]);

  // 当 API 准备就绪且元素发生变化时，自动缩放以适应内容
  useEffect(() => {
    if (excalidrawAPI && internalElements.length > 0) {
      // 稍作延迟以确保元素渲染完成
      setTimeout(() => {
        excalidrawAPI.scrollToContent(internalElements, {
          fitToContent: true,
          animate: true,
          duration: 300,
        });
      }, 100);
    }
  }, [excalidrawAPI, internalElements]);

  // 当元素更改时生成唯一键以强制重新挂载
  const canvasKey = useMemo(() => {
    if (internalElements.length === 0) return 'empty';
    // 从元素创建哈希表以检测更改
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
          elements: convertedElements.length > 0 ? convertedElements : internalElements,
          appState: {
            viewBackgroundColor: '#ffffff',
            // 使用打印体字体和较"硬"的线条，以符合学术风格
            currentItemFontFamily: 2,
            currentItemRoughness: 0,
          },
          scrollToContent: true,
        }}
      />
    </div>
  );
}

