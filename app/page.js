'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Chat from '@/components/Chat';
import CodeEditor from '@/components/CodeEditor';
import ConfigManager from '@/components/ConfigManager';
import ContactModal from '@/components/ContactModal';
import HistoryModal from '@/components/HistoryModal';
import AccessPasswordModal from '@/components/AccessPasswordModal';
import Notification from '@/components/Notification';
import OptimizationPanel from '@/components/OptimizationPanel';
import { getConfig, isConfigValid } from '@/lib/config';
import { optimizeExcalidrawCode } from '@/lib/optimization';
import { historyManager } from '@/lib/history-manager';
import { repairJson } from '@/lib/json-repair';
import { createOptimizationPrompt } from '@/lib/prompts';

// 动态导入 ExcalidrawCanvas 以避免 SSR 问题
const ExcalidrawCanvas = dynamic(() => import('@/components/ExcalidrawCanvas'), {
  ssr: false,
});

export default function Home() {
  const [config, setConfig] = useState(null);
  const [isConfigManagerOpen, setIsConfigManagerOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAccessPasswordModalOpen, setIsAccessPasswordModalOpen] = useState(false);
  const [isOptimizationPanelOpen, setIsOptimizationPanelOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [elements, setElements] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const [isOptimizingCode, setIsOptimizingCode] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(25); // 视口宽度百分比
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [currentInput, setCurrentInput] = useState('');
  const [currentChartType, setCurrentChartType] = useState('auto');
  const [usePassword, setUsePassword] = useState(false);
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const abortControllerRef = useRef(null);
  const isApplyingFromCodeRef = useRef(false);

  // 动态按需加载 convertToExcalidrawElements（只在浏览器端运行）
  let convertToExcalidrawElementsFn = null;
  const getConvertToExcalidrawElements = async () => {
    if (convertToExcalidrawElementsFn) return convertToExcalidrawElementsFn;
    const excalidrawModule = await import('@excalidraw/excalidraw');
    convertToExcalidrawElementsFn = excalidrawModule.convertToExcalidrawElements;
    return convertToExcalidrawElementsFn;
  };

  // 挂载时加载配置并监听配置更改
  useEffect(() => {
    const savedConfig = getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
    }

    // 加载密码访问状态
    const passwordEnabled = localStorage.getItem('smart-excalidraw-use-password') === 'true';
    setUsePassword(passwordEnabled);

    // 监听存储更改，以便在标签页之间同步
    const handleStorageChange = (e) => {
      if (e.key === 'smart-excalidraw-active-config' || e.key === 'smart-excalidraw-configs') {
        const newConfig = getConfig();
        setConfig(newConfig);
      }
      if (e.key === 'smart-excalidraw-use-password') {
        const passwordEnabled = localStorage.getItem('smart-excalidraw-use-password') === 'true';
        setUsePassword(passwordEnabled);
      }
    };

    // 监听 AccessPasswordModal（同一标签页）中的自定义事件
    const handlePasswordSettingsChanged = (e) => {
      setUsePassword(e.detail.usePassword);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('password-settings-changed', handlePasswordSettingsChanged);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('password-settings-changed', handlePasswordSettingsChanged);
    };
  }, []);

  // Excalidraw Code 后处理：移除 Markdown Wrappers、修复 Json Closures 问题、修复未转义的引号
  const postProcessExcalidrawCode = (code) => {
    if (!code || typeof code !== 'string') return code;

    let processed = code.trim();

    // 步骤 1：移除 Markdown Wrappers （```json、```javascript、```js 或仅 ```）
    processed = processed.replace(/^```(?:json|javascript|js)?\s*\n?/i, '');
    processed = processed.replace(/\n?```\s*$/, '');
    processed = processed.trim();

    // 步骤 1.5：修复常见的 JSON Closures 问题（末尾缺少引号/括号）
    processed = repairJson(processed);

    // 步骤 2：修复 JSON 字符串值中未转义的双引号
    // 这是一项复杂的任务——我们需要小心，避免破坏有效的 JSON 结构
    // 策略：解析 JSON 结构，仅修复字符串值中的引号
    try {
      // 首先，尝试直接解析，看看它是否已经有效
      JSON.parse(processed);
      return processed; // 已经是有效的 JSON，无需修复
    } catch (e) {
      // JSON 无效，请尝试修复未转义的引号
      // 此正则表达式查找字符串值并修复其中未转义的引号
      // 它查找："key": "包含未转义引号的值"
      processed = fixUnescapedQuotes(processed);
      // 修复引号后，尝试对 JSON Closures 进行最终修复
      processed = repairJson(processed);
      return processed;
    }
  };

  // 用于修复 JSON 字符串中未转义引号的辅助函数
  const fixUnescapedQuotes = (jsonString) => {
    let result = '';
    let inString = false;
    let escapeNext = false;
    let currentQuotePos = -1;
    
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];
      const prevChar = i > 0 ? jsonString[i - 1] : '';
      
      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        result += char;
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        if (!inString) {
          // string 开头
          inString = true;
          currentQuotePos = i;
          result += char;
        } else {
          // string 可能的结尾
          // 检查这是否为结构化引用（后面跟着 : 或 , 或 } 或 ] ）
          const nextNonWhitespace = jsonString.slice(i + 1).match(/^\s*(.)/);
          const nextChar = nextNonWhitespace ? nextNonWhitespace[1] : '';
          
          if (nextChar === ':' || nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === '') {
            //这是一个 string 的结束引用
            inString = false;
            result += char;
          } else {
            // 这是字符串中未转义的引号 - 请对其进行转义
            result += '\\"';
          }
        }
      } else {
        result += char;
      }
    }
    
    return result;
  };

  // 将 Excalidraw 画布中的元素转回 ExcalidrawElementSkeleton 结构
  const sceneElementsToSkeleton = (sceneElements) => {
    if (!Array.isArray(sceneElements)) return [];

    // 建立 frameId -> childrenIds 映射
    const frameChildrenMap = new Map();
    sceneElements.forEach((el) => {
      if (el.frameId && el.id) {
        if (!frameChildrenMap.has(el.frameId)) {
          frameChildrenMap.set(el.frameId, []);
        }
        frameChildrenMap.get(el.frameId).push(el.id);
      }
    });

    return sceneElements.map((el) => {
      // 跳过无效的元素
      if (!el || !el.type) {
        return null;
      }

      const base = {
        type: el.type,
        x: el.x,
        y: el.y,
      };

      if (el.id) base.id = el.id;

      if (typeof el.width === 'number') base.width = el.width;
      if (typeof el.height === 'number') base.height = el.height;

      if (el.strokeColor) base.strokeColor = el.strokeColor;
      if (el.backgroundColor) base.backgroundColor = el.backgroundColor;
      if (typeof el.strokeWidth === 'number') base.strokeWidth = el.strokeWidth;
      if (el.strokeStyle) base.strokeStyle = el.strokeStyle;
      if (el.fillStyle) base.fillStyle = el.fillStyle;
      if (typeof el.roughness === 'number') base.roughness = el.roughness;
      if (typeof el.opacity === 'number') base.opacity = el.opacity;
      if (typeof el.angle === 'number') base.angle = el.angle;
      if (typeof el.locked === 'boolean') base.locked = el.locked;
      if (el.link) base.link = el.link;
      if (Array.isArray(el.groupIds) && el.groupIds.length > 0) {
        base.groupIds = [...el.groupIds];
      }

      if (el.type === 'text') {
        if (typeof el.text === 'string') base.text = el.text;
        if (typeof el.fontSize === 'number') base.fontSize = el.fontSize;
        if (typeof el.fontFamily === 'number') base.fontFamily = el.fontFamily;
        if (el.textAlign) base.textAlign = el.textAlign;
        if (el.verticalAlign) base.verticalAlign = el.verticalAlign;
      }

      if (el.type === 'image') {
        if (el.fileId) base.fileId = el.fileId;
        if (el.scale) base.scale = el.scale;
        if (el.crop) base.crop = el.crop;
      }

      if (el.type === 'arrow') {
        if (el.startArrowhead) base.startArrowhead = el.startArrowhead;
        if (el.endArrowhead) base.endArrowhead = el.endArrowhead;
        if (el.startBinding && el.startBinding.elementId) {
          base.start = { id: el.startBinding.elementId };
        }
        if (el.endBinding && el.endBinding.elementId) {
          base.end = { id: el.endBinding.elementId };
        }
        if (el.label && el.label.text) {
          base.label = { text: el.label.text };
        }
      }

      if (el.type === 'frame') {
        const children = frameChildrenMap.get(el.id) || [];
        if (children.length > 0) {
          base.children = children;
        } else {
          // 如果没有 children，跳过这个 frame（无效的 frame）
          return null;
        }
        if (typeof el.name === 'string' && el.name) {
          base.name = el.name;
        }
      }

      return base;
    }).filter(el => el !== null); // 过滤掉 null 值
  };

  // 将画布元素序列化为可编辑的 JSON 代码
  const serializeSceneToCode = (sceneElements) => {
    const skeleton = sceneElementsToSkeleton(sceneElements);
    if (!skeleton.length) {
      return '[]';
    }
    
    // 确保 frame 元素有有效的 children 数组
    const cleanedSkeleton = skeleton.map(el => {
      if (el.type === 'frame') {
        // 确保 frame 有 children 属性，且是数组
        if (!el.children || !Array.isArray(el.children) || el.children.length === 0) {
          // 如果没有有效的 children，移除这个 frame
          return null;
        }
      }
      return el;
    }).filter(el => el !== null);
    
    return JSON.stringify(cleanedSkeleton, null, 2);
  };

  // 处理停止生成操作
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setApiError(null);
  };

  // 处理消息发送（单轮对话）
  const handleSendMessage = async (userMessage, chartType = 'auto', sourceType = 'text') => {
    const usePassword = typeof window !== 'undefined' && localStorage.getItem('smart-excalidraw-use-password') === 'true';
    const accessPassword = typeof window !== 'undefined' ? localStorage.getItem('smart-excalidraw-access-password') : '';

    if (!usePassword && !isConfigValid(config)) {
      setNotification({
        isOpen: true,
        title: 'Configuration reminder',
        message: 'Please configure your LLM provider or enable access passwords first',
        type: 'warning'
      });
      setIsConfigManagerOpen(true);
      return;
    }

    setCurrentInput(userMessage);
    setCurrentChartType(chartType);
    setIsGenerating(true);
    setApiError(null); // 清除之前的错误
    setJsonError(null); // 清除之前的 JSON 错误

    // 为此请求创建新的 AbortController
    abortControllerRef.current = new AbortController();

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (usePassword && accessPassword) {
        headers['x-access-password'] = accessPassword;
      }

      // 调用流式生成 API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          config: usePassword ? null : config,
          userInput: userMessage,
          chartType,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        // 如果可用，请解析错误响应正文
        let errorMessage = 'Code generation failed';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // 如果响应体不是 JSON 格式，则使用基于状态的消息
          switch (response.status) {
            case 400:
              errorMessage = 'The request parameters are incorrect. Please check your input';
              break;
            case 401:
            case 403:
              errorMessage = 'The API key is invalid or you do not have sufficient permissions. Please check your configuration';
              break;
            case 429:
              errorMessage = 'Too many requests, please try again later';
              break;
            case 500:
            case 502:
            case 503:
              errorMessage = 'Server error, please try again later';
              break;
            default:
              errorMessage = `Request failed (${response.status})`;
          }
        }
        throw new Error(errorMessage);
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedCode = '';
      let buffer = '';
      let hasError = false;
      let errorMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                hasError = true;
                errorMessage = data.error;
                throw new Error(data.error);
              } else if (data.content) {
                accumulatedCode += data.content;
                // 对清理后的代码进行后处理并将其设置为编辑器
                const processedCode = postProcessExcalidrawCode(accumulatedCode);
                setGeneratedCode(processedCode);
              }
            } catch (e) {
              // 如果是 API 错误，则抛出异常
              if (hasError && errorMessage) {
                throw new Error(errorMessage);
              }
              // SSE 解析错误 - 记录日志但不要中断流
              if (e.message && !e.message.includes('Unexpected')) {
                setApiError('Data stream parsing error: ' + e.message)
                console.warn('SSE parsing warning:', e.message);
              }
            }
          }
        }
      }

      // 如果出现错误，则抛出异常
      if (hasError && errorMessage) {
        throw new Error(errorMessage);
      }

      // 检查是否有任何代码
      if (!accumulatedCode || accumulatedCode.trim().length === 0) {
        throw new Error('No generated content received. Please check your model configuration or try again');
      }

      // 尝试解析并应用生成的代码（已进行后处理）
      const processedCode = postProcessExcalidrawCode(accumulatedCode);
      const optimizedCode = optimizeExcalidrawCode(processedCode);  // 自动优化一次
      setGeneratedCode(optimizedCode);
      tryParseAndApply(optimizedCode);

      // 保存到历史记录（仅限纯文本输入）
      if (sourceType === 'text' && userMessage && optimizedCode) {
        const userInputText = typeof userMessage === 'object' ? (userMessage.text || '') : userMessage;
        historyManager.addHistory({
          chartType,
          userInput: userInputText,
          generatedCode: optimizedCode,
          config: {
            name: config?.name || config?.type,
            model: config?.model
          }
        });
      }
    } catch (error) {
      // 如果用户中止操作，则静默退出
      if (error.name === 'AbortError') {
        console.log('Generation aborted by user');
        return;
      } else {
        console.error('Error generating code:', error);
        // 检查是否是网络错误
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
          setApiError('Network connection failed, please check your network connection');
        } else {
          setApiError(error.message);
        }
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // 尝试解析代码并将其应用到画布上
  const tryParseAndApply = async (code) => {
    try {
      // 清除之前的 JSON 错误
      setJsonError(null);
      
      // 检查代码是否为空或仅包含空格
      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        setJsonError('The generated code is empty. Please check your model configuration or try again');
        console.error('No array or Json found in generated code - code is empty');
        return;
      }

      const cleanedCode = code.trim();

      console.log('[DEBUG] tryParseAndApply - code preview:', cleanedCode.substring(0, 200));

      // 如果代码被其他文本包裹，则从代码中提取数组
      const arrayMatch = cleanedCode.match(/\[[\s\S]*\]/);
      if (!arrayMatch) {
        setJsonError('No valid JSON array found in the code');
        console.error('No array found in generated code');
        return;
      }

      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) {
        try {
          // 在转换前，确保 frame 元素格式正确
          const cleanedParsed = parsed.map(el => {
            if (el.type === 'frame') {
              // 确保 frame 有有效的 children 数组
              if (!el.children || !Array.isArray(el.children)) {
                console.warn('Frame element missing valid children array, skipping');
                return null;
              }
              // 确保 children 中的 id 在数组中存在
              const elementIds = new Set(parsed.filter(e => e.id).map(e => e.id));
              el.children = el.children.filter(id => elementIds.has(id));
              if (el.children.length === 0) {
                console.warn('Frame element has no valid children, skipping');
                return null;
              }
            }
            return el;
          }).filter(el => el !== null);
          
          const convertFn = await getConvertToExcalidrawElements();
          const fullElements = convertFn(cleanedParsed);
          // 标记为"来自代码应用"的更新，避免立刻又被 onChange 反向覆盖
          isApplyingFromCodeRef.current = true;
          setElements(fullElements);
          setTimeout(() => {
            isApplyingFromCodeRef.current = false;
          }, 0);
          setJsonError(null); // 成功时清除历史 Json 错误
        } catch (e) {
          console.error('Failed to convert skeleton to Excalidraw elements:', e);
          setJsonError('Unable to convert code to Excalidraw element: ' + e.message);
        }
      }
      
      // 检查一下它是不是错误信息
      if (cleanedCode.toLowerCase().includes('error') || 
          cleanedCode.toLowerCase().includes('失败') || 
          cleanedCode.toLowerCase().includes('无法') ||
          cleanedCode.length < 50) {
        setJsonError(`Code generation failed: ${cleanedCode.substring(0, 200)}`);
      } else {
        setJsonError('No valid JSON array was found in the code. LLM may have returned explanatory literals instead of code. Please check the prompt words or try again');
      }
    } catch (error) {
      console.error('Failed to parse generated code:', error);
      if (error instanceof SyntaxError) {
        setJsonError('Json Syntax error: ' + error.message);
      } else {
        setJsonError('Parsing failed: ' + error.message);
      }
    }
  };

  // 处理从编辑器应用代码的操作
  const handleApplyCode = async () => {
    setIsApplyingCode(true);
    try {
      // 模拟异步操作以提升用户体验
      await new Promise(resolve => setTimeout(resolve, 300));
      await tryParseAndApply(generatedCode);
    } catch (error) {
      console.error('Error applying code:', error);
    } finally {
      setIsApplyingCode(false);
    }
  };

  // 处理代码优化
  const handleOptimizeCode = async () => {
    setIsOptimizingCode(true);
    try {
      // 模拟异步操作以提升用户体验
      await new Promise(resolve => setTimeout(resolve, 500));
      const optimizedCode = optimizeExcalidrawCode(generatedCode);
      setGeneratedCode(optimizedCode);
      await tryParseAndApply(optimizedCode);
    } catch (error) {
      console.error('Error applying code:', error);
    } finally {
      setIsOptimizingCode(false);
    }
  };

  // 处理清除代码操作
  const handleClearCode = () => {
    setGeneratedCode('');
  };

  // 处理打开优化面板
  const handleOpenOptimizationPanel = () => {
    if (!generatedCode.trim()) {
      setNotification({
        isOpen: true,
        title: 'Reminder',
        message: 'Please generate the chart code first',
        type: 'warning'
      });
      return;
    }
    setIsOptimizationPanelOpen(true);
  };

  // 处理高级优化操作
  const handleAdvancedOptimize = async (suggestions) => {
    if (!generatedCode.trim()) {
      return;
    }

    setIsOptimizationPanelOpen(false);

    // 构建优化提示
    const optimizationPrompt = createOptimizationPrompt(generatedCode, suggestions);

    // 使用优化系统 prompt
    const usePassword = typeof window !== 'undefined' && localStorage.getItem('smart-excalidraw-use-password') === 'true';
    const accessPassword = typeof window !== 'undefined' ? localStorage.getItem('smart-excalidraw-access-password') : '';

    if (!usePassword && !isConfigValid(config)) {
      setNotification({
        isOpen: true,
        title: 'Configuration reminder',
        message: 'Please configure your LLM provider or enable access passwords first',
        type: 'warning'
      });
      setIsConfigManagerOpen(true);
      return;
    }

    setIsGenerating(true);
    setApiError(null);
    setJsonError(null);

    // 为此请求创建新的 AbortController
    abortControllerRef.current = new AbortController();

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (usePassword && accessPassword) {
        headers['x-access-password'] = accessPassword;
      }

      let finalConfig = usePassword ? null : config;
      if (usePassword && accessPassword) {
        // 服务器将使用服务器端配置
        finalConfig = null;
      }

      // 调用生成 API 并提示优化
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          config: finalConfig,
          userInput: optimizationPrompt,
          chartType: 'auto',
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorMessage = 'Optimization failed';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          errorMessage = `Request failed (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedCode = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulatedCode += data.content;
                const processedCode = postProcessExcalidrawCode(accumulatedCode);
                setGeneratedCode(processedCode);
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              if (e.message && !e.message.includes('Unexpected')) {
                setApiError('Data stream parsing error: ' + e.message);
              }
              console.error('Failed to parse SSE: ', e);
            }
          }
        }
      }

      // 应用优化代码
      const processedCode = postProcessExcalidrawCode(accumulatedCode);
      setGeneratedCode(processedCode);
      tryParseAndApply(processedCode);

      setNotification({
        isOpen: true,
        title: 'Optimization complete',
        message: 'The chart has been successfully optimized',
        type: 'info'
      });
    } catch (error) {
      console.error('Error optimizing code:', error);

      // 如果用户中止操作，则静默退出
      if (error.name === 'AbortError') {
        console.log('Optimization aborted by user');
        return;
      }

      // 检查是否是网络错误
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        setApiError('Network connection failed, please check your network connection');
      } else {
        setApiError(error.message);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // 从管理器处理配置选择
  const handleConfigSelect = (selectedConfig) => {
    if (selectedConfig) {
      setConfig(selectedConfig);
    }
  };

  // 处理应用历史记录操作
  const handleApplyHistory = async (history) => {
    // 设置当前输入时，请确保 userInput 始终为字符串
    const userInputText = typeof history.userInput === 'object'
      ? (history.userInput.text || 'Image upload request')
      : history.userInput;

    setCurrentInput(userInputText);
    setCurrentChartType(history.chartType);
    setGeneratedCode(history.generatedCode);
    await tryParseAndApply(history.generatedCode);
  };

  // 当用户在画布中直接编辑图形时，将变更反向同步回代码编辑器
  const handleCanvasElementsChange = (sceneElements) => {
    // 忽略由代码应用导致的 Excalidraw 初始 onChange
    if (isApplyingFromCodeRef.current) {
      return;
    }

    setElements(sceneElements);

    try {
      const codeFromCanvas = serializeSceneToCode(sceneElements);
      setGeneratedCode(codeFromCanvas);
      setJsonError(null);
    } catch (error) {
      console.error('Failed to serialize canvas elements: ', error);
      setJsonError('Failed to export code from canvas: ' + error.message);
    }
  };

  // 处理水平方向的尺寸调整（左侧面板与右侧面板）
  const handleHorizontalMouseDown = (e) => {
    setIsResizingHorizontal(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingHorizontal) return;
      
      const percentage = (e.clientX / window.innerWidth) * 100;
      
      // 可调节的范围
      setLeftPanelWidth(Math.min(Math.max(percentage, 20), 80));
    };

    const handleMouseUp = () => {
      setIsResizingHorizontal(false);
    };

    if (isResizingHorizontal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingHorizontal]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Figsci</h1>
          <p className="text-xs text-gray-500">AI 驱动的图表生成</p>
        </div>
        <div className="flex items-center space-x-3">
          {(usePassword || (config && isConfigValid(config))) && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded border border-green-300">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-900 font-medium">
                {usePassword ? '密码访问' : `${config.name || config.type} - ${config.model}`}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
            >
              历史记录
            </button>
            <button
              onClick={() => setIsAccessPasswordModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
            >
              访问密码
            </button>
            <button
              onClick={() => setIsConfigManagerOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-gray-900 rounded hover:bg-gray-800 transition-colors duration-200"
            >
              管理配置
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="flex flex-1 overflow-hidden pb-1">
        {/* Left Panel - Chat and Code Editor */}
        <div id="left-panel" style={{ width: `${leftPanelWidth}%` }} className="flex flex-col border-r border-gray-200 bg-white">
          {/* API Error Banner */}
          {apiError && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-start justify-between">
              <div className="flex items-start space-x-2 min-w-0 flex-1">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-red-800">请求失败</p>
                  <p className="text-xs text-red-700 mt-1 break-words">{apiError}</p>
                </div>
              </div>
              <button
                onClick={() => setApiError(null)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Input Section */}
          <div style={{ height: '50%' }} className="overflow-auto">
            <Chat
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              initialInput={currentInput}
              initialChartType={currentChartType}
              onStop={handleStopGeneration}
            />
          </div>

          {/* Code Editor Section */}
          <div style={{ height: '50%' }} className="overflow-hidden">
            <CodeEditor
              code={generatedCode}
              onChange={setGeneratedCode}
              onApply={handleApplyCode}
              onOptimize={handleOptimizeCode}
              onAdvancedOptimize={handleOpenOptimizationPanel}
              onClear={handleClearCode}
              jsonError={jsonError}
              onClearJsonError={() => setJsonError(null)}
              isGenerating={isGenerating}
              isApplyingCode={isApplyingCode}
              isOptimizingCode={isOptimizingCode}
            />
          </div>
        </div>

        {/* Horizontal Resizer */}
        <div
          onMouseDown={handleHorizontalMouseDown}
          className="w-1 bg-gray-200 hover:bg-gray-400 cursor-col-resize transition-colors duration-200 flex-shrink-0"
        />

        {/* Right Panel - Excalidraw Canvas */}
        <div style={{ width: `${100 - leftPanelWidth}%`, height: '100%' }} className="bg-gray-50">
          <ExcalidrawCanvas elements={elements} onElementsChange={handleCanvasElementsChange} />
        </div>
      </div>

      {/* Config Manager Modal */}
      <ConfigManager
        isOpen={isConfigManagerOpen}
        onClose={() => setIsConfigManagerOpen(false)}
        onConfigSelect={handleConfigSelect}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <span>Figsci v0.1.0</span>
          <span className="text-gray-400">|</span>
          <span>AI 驱动的智能科研图表生成工具</span>
        </div>
      </footer>

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onApply={handleApplyHistory}
      />

      {/* Access Password Modal */}
      <AccessPasswordModal
        isOpen={isAccessPasswordModalOpen}
        onClose={() => setIsAccessPasswordModalOpen(false)}
      />

      {/* Optimization Panel */}
      <OptimizationPanel
        isOpen={isOptimizationPanelOpen}
        onClose={() => setIsOptimizationPanelOpen(false)}
        onOptimize={handleAdvancedOptimize}
        isOptimizing={isGenerating}
      />

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* Notification */}
      <Notification
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
}
