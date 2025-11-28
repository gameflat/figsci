/**
 * Smart Drawio 应用主页面组件
 * 
 * 这是应用的核心页面组件，包含所有主要功能的状态管理和业务逻辑。
 * 主要功能包括：
 * - 用户输入处理（文本/图片）
 * - LLM API 调用和流式响应处理
 * - 代码生成、解析和应用
 * - 配置管理（客户端配置和服务器端密码访问）
 * - 历史记录管理
 * - 代码优化和续写功能
 * - 可调节的分栏布局
 * 
 * @file app/page.js
 * @description Next.js App Router 主页面组件，包含完整的应用逻辑和 UI
 */

'use client';

// ========== React 核心 Hooks ==========
import { useState, useEffect, useRef } from 'react';

// ========== Next.js 功能 ==========
import dynamic from 'next/dynamic'; // 用于动态导入组件，避免 SSR 问题

// ========== 组件导入 ==========
import Chat from '@/components/Chat';                          // 聊天输入组件（支持文本和图片）
import CodeEditor from '@/components/CodeEditor';             // Monaco 代码编辑器组件
import ConfigManager from '@/components/ConfigManager';       // 配置管理弹窗组件
import ContactModal from '@/components/ContactModal';         // 联系方式弹窗组件
import HistoryModal from '@/components/HistoryModal';         // 历史记录弹窗组件
import AccessPasswordModal from '@/components/AccessPasswordModal'; // 访问密码设置弹窗组件
import OptimizationPanel from '@/components/OptimizationPanel'; // 高级优化面板组件
import Notification from '@/components/Notification';         // 通知组件

// ========== 工具库导入 ==========
import { getConfig, isConfigValid } from '@/lib/config';      // 配置管理工具函数
import { optimizeExcalidrawCode } from '@/lib/optimizeArrows'; // 代码优化工具函数
import { historyManager } from '@/lib/history-manager';       // 历史记录管理器
import { OPTIMIZATION_SYSTEM_PROMPT, createOptimizationPrompt, createContinuationPrompt } from '@/lib/prompts'; // 提示词相关函数

// ========== 动态导入 ==========
/**
 * 动态导入 DrawioCanvas 组件，禁用 SSR
 * 
 * DrawioCanvas 组件可能包含浏览器特定的 API（如 iframe），
 * 在服务器端渲染时会导致错误。通过动态导入并设置 ssr: false，
 * 确保该组件只在客户端渲染。
 */
const DrawioCanvas = dynamic(() => import('@/components/DrawioCanvas'), {
  ssr: false, // 禁用服务器端渲染
});

/**
 * 应用主页面组件
 * 
 * 这是应用的根组件，负责管理所有应用状态和业务逻辑。
 * 组件采用上下分栏布局：
 * - 上栏：头部（标题、配置状态、操作按钮）
 * - 中间：左右分栏（左侧：聊天输入和代码编辑器，右侧：图表画布）
 * - 下栏：页脚（版本信息）
 * 
 * @returns {JSX.Element} 返回应用的主页面结构
 */
export default function Home() {
  // ========== 状态管理 ==========
  
  // ========== 配置相关状态 ==========
  /** 当前激活的 LLM 配置对象，包含 type, baseUrl, apiKey, model 等信息 */
  const [config, setConfig] = useState(null);
  
  /** 是否启用密码访问（服务器端配置模式） */
  const [usePassword, setUsePassword] = useState(false);
  
  // ========== 弹窗/面板显示状态 ==========
  /** 配置管理弹窗是否打开 */
  const [isConfigManagerOpen, setIsConfigManagerOpen] = useState(false);
  
  /** 联系方式弹窗是否打开 */
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  /** 历史记录弹窗是否打开 */
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  /** 访问密码设置弹窗是否打开 */
  const [isAccessPasswordModalOpen, setIsAccessPasswordModalOpen] = useState(false);
  
  /** 高级优化面板是否打开 */
  const [isOptimizationPanelOpen, setIsOptimizationPanelOpen] = useState(false);
  
  // ========== 生成代码相关状态 ==========
  /** 生成的代码（draw.io XML 格式），显示在代码编辑器中 */
  const [generatedCode, setGeneratedCode] = useState('');
  
  /** 处理后的 XML 代码，用于传递给 DrawioCanvas 组件渲染 */
  const [generatedXml, setGeneratedXml] = useState('');
  
  /** JSON 格式的元素数组（用于 Excalidraw，本项目主要使用 XML） */
  const [elements, setElements] = useState([]);
  
  // ========== 操作状态 ==========
  /** 是否正在生成代码（LLM API 调用中） */
  const [isGenerating, setIsGenerating] = useState(false);
  
  /** 是否正在应用代码到画布 */
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  
  /** 是否正在优化代码 */
  const [isOptimizingCode, setIsOptimizingCode] = useState(false);
  
  // ========== 错误状态 ==========
  /** API 调用错误信息（网络错误、配置错误等） */
  const [apiError, setApiError] = useState(null);
  
  /** 代码解析错误信息（JSON/XML 格式错误等） */
  const [jsonError, setJsonError] = useState(null);
  
  // ========== 用户输入相关状态 ==========
  /** 当前用户输入的文本内容（保存用于续写等功能） */
  const [currentInput, setCurrentInput] = useState('');
  
  /** 当前选择的图表类型（如 'auto', 'flowchart', 'architecture' 等） */
  const [currentChartType, setCurrentChartType] = useState('auto');
  
  // ========== 代码截断相关状态 ==========
  /** 生成的代码是否被截断（未完整生成） */
  const [isTruncated, setIsTruncated] = useState(false);
  
  /** 是否可以继续生成（当代码被截断时显示"继续生成"按钮） */
  const [canContinue, setCanContinue] = useState(false);
  
  // ========== 布局相关状态 ==========
  /** 左侧面板宽度（百分比，范围 20-80%） */
  const [leftPanelWidth, setLeftPanelWidth] = useState(25);
  
  /** 是否正在水平调整面板宽度（拖拽调整中） */
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
  
  // ========== 通知状态 ==========
  /** 通知消息状态对象，包含显示状态、标题、消息内容和类型 */
  const [notification, setNotification] = useState({
    isOpen: false,   // 通知是否显示
    title: '',       // 通知标题
    message: '',     // 通知消息内容
    type: 'info'     // 通知类型：'info', 'warning', 'error', 'success'
  });
  
  // ========== Refs ==========
  /** AbortController 引用，用于取消正在进行的 API 请求 */
  const abortControllerRef = useRef(null);

  // ========== 初始化逻辑 ==========
  
  /**
   * 组件挂载时的初始化逻辑
   * 
   * 功能：
   * 1. 加载保存的配置信息
   * 2. 加载密码访问状态
   * 3. 监听 localStorage 变化（跨标签页同步）
   * 4. 监听自定义事件（同标签页内的配置变化）
   * 
   * 依赖：[]（仅在组件挂载时执行一次）
   */
  useEffect(() => {
    // 从 localStorage 加载保存的配置
    const savedConfig = getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
    }

    // 从 localStorage 加载密码访问状态
    // 如果用户之前启用了密码访问，恢复该状态
    const passwordEnabled = localStorage.getItem('smart-excalidraw-use-password') === 'true';
    setUsePassword(passwordEnabled);

    /**
     * 处理 localStorage 存储变化事件
     * 
     * 用于跨标签页同步配置变化。当用户在其他标签页修改配置时，
     * 当前标签页会自动更新配置，无需刷新页面。
     * 
     * @param {StorageEvent} e - localStorage 变化事件对象
     */
    const handleStorageChange = (e) => {
      // 如果配置相关的键发生变化，重新加载配置
      if (e.key === 'smart-excalidraw-active-config' || e.key === 'smart-excalidraw-configs') {
        const newConfig = getConfig();
        setConfig(newConfig);
      }
      // 如果密码访问设置发生变化，更新状态
      if (e.key === 'smart-excalidraw-use-password') {
        const passwordEnabled = localStorage.getItem('smart-excalidraw-use-password') === 'true';
        setUsePassword(passwordEnabled);
      }
    };

    /**
     * 处理密码设置变化的自定义事件
     * 
     * 用于同标签页内的配置同步。当用户在 AccessPasswordModal 中
     * 修改密码设置时，会触发自定义事件，当前组件监听并更新状态。
     * 
     * @param {CustomEvent} e - 自定义事件对象，包含 usePassword 属性
     */
    const handlePasswordSettingsChanged = (e) => {
      setUsePassword(e.detail.usePassword);
    };

    // 注册事件监听器
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('password-settings-changed', handlePasswordSettingsChanged);

    // 清理函数：组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('password-settings-changed', handlePasswordSettingsChanged);
    };
  }, []);

  // ========== 工具函数 ==========
  
  /**
   * 后处理 draw.io XML 代码
   * 
   * 清理 LLM 生成的代码，移除可能的 markdown 代码块标记，
   * 确保返回纯净的 XML 代码。
   * 
   * 主要处理：
   * 1. 移除 markdown 代码块标记（```xml、```mxgraph 或 ```）
   * 2. 验证 XML 结构是否完整
   * 
   * @param {string} code - 待处理的代码字符串
   * @returns {string} 处理后的代码字符串
   * 
   * @example
   * // 输入（包含 markdown 标记）
   * "```xml\n<mxfile>...</mxfile>\n```"
   * 
   * // 输出（纯净的 XML）
   * "<mxfile>...</mxfile>"
   */
  const postProcessDrawioCode = (code) => {
    // 参数验证：如果代码为空或不是字符串，直接返回
    if (!code || typeof code !== 'string') return code;

    // 去除首尾空白字符
    let processed = code.trim();

    // 移除 markdown 代码块开始标记（如 ```xml、```mxgraph 或 ```）
    // 正则表达式说明：
    // - ^``` : 匹配开头的 ```
    // - (?:xml|mxgraph)? : 可选的 xml 或 mxgraph 标识符
    // - \s*\n? : 可选的空白字符和换行符
    // - /i : 不区分大小写
    processed = processed.replace(/^```(?:xml|mxgraph)?\s*\n?/i, '');
    
    // 移除 markdown 代码块结束标记（```）
    processed = processed.replace(/\n?```\s*$/, '');
    
    // 再次去除首尾空白字符
    processed = processed.trim();

    // 验证 XML 结构是否包含必需的 mxfile 标签
    // 如果缺少开始或结束标签，输出警告（但不影响返回）
    if (!processed.includes('<mxfile>') || !processed.includes('</mxfile>')) {
      console.warn('Generated code does not contain valid mxfile structure');
    }

    return processed;
  };


  // ========== 核心业务函数 ==========
  
  /**
   * 停止生成操作
   * 
   * 取消正在进行的 LLM API 请求，用于用户主动中断生成过程。
   * 通过 AbortController 的 abort() 方法取消 fetch 请求。
   */
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // 取消请求
      abortControllerRef.current = null;   // 清除引用
    }
    setIsGenerating(false);  // 更新生成状态
    setApiError(null);       // 清除错误信息
  };

  /**
   * 处理发送消息（单轮对话）
   * 
   * 这是应用的核心函数，负责处理用户输入并调用 LLM API 生成图表代码。
   * 
   * 主要流程：
   * 1. 验证配置（客户端配置或服务器端密码）
   * 2. 构建请求并调用 API
   * 3. 处理流式响应（SSE），实时更新代码
   * 4. 后处理生成的代码并应用到画布
   * 5. 保存到历史记录
   * 6. 错误处理
   * 
   * @param {string|Object} userMessage - 用户消息（文本字符串或包含图片的对象）
   * @param {string} chartType - 图表类型，默认为 'auto'
   * 
   * @example
   * // 文本输入
   * handleSendMessage("画一个简单的流程图", "flowchart")
   * 
   * // 图片输入
   * handleSendMessage({
   *   text: "根据这个图片生成架构图",
   *   image: { data: "base64...", mimeType: "image/png" }
   * }, "architecture")
   */
  const handleSendMessage = async (userMessage, chartType = 'auto') => {
    // ========== 配置验证 ==========
    // 检查是否使用密码访问（服务器端配置模式）
    const usePassword = typeof window !== 'undefined' && localStorage.getItem('smart-excalidraw-use-password') === 'true';
    // 获取访问密码（如果启用）
    const accessPassword = typeof window !== 'undefined' ? localStorage.getItem('smart-excalidraw-access-password') : '';

    // 验证配置是否可用
    // 如果未启用密码访问，且客户端配置无效，提示用户配置
    if (!usePassword && !isConfigValid(config)) {
      setNotification({
        isOpen: true,
        title: '配置提醒',
        message: '请先配置您的 LLM 提供商或启用访问密码',
        type: 'warning'
      });
      setIsConfigManagerOpen(true); // 打开配置管理器
      return; // 终止函数执行
    }

    // ========== 初始化状态 ==========
    // 保存当前输入和图表类型（用于续写等功能）
    setCurrentInput(userMessage);
    setCurrentChartType(chartType);
    
    // 设置生成状态，显示加载指示器
    setIsGenerating(true);
    
    // 清除之前的错误信息
    setApiError(null);   // 清除 API 错误
    setJsonError(null);  // 清除 JSON 解析错误

    // 创建新的 AbortController 用于取消本次请求
    // 每次生成时创建新的实例，确保可以正确取消当前请求
    abortControllerRef.current = new AbortController();

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (usePassword && accessPassword) {
        headers['x-access-password'] = accessPassword;
      }

      // Clean userInput if it contains image data
      let cleanedUserInput = userMessage;
      if (typeof userMessage === 'object' && userMessage.image) {
        cleanedUserInput = {
          text: userMessage.text,
          image: {
            data: userMessage.image.data,
            mimeType: userMessage.image.mimeType
          }
        };
      }

      console.log('[DEBUG] Sending to API:', {
        hasImage: !!cleanedUserInput?.image,
        imageDataLength: cleanedUserInput?.image?.data?.length,
        imageDataPreview: cleanedUserInput?.image?.data?.substring(0, 50),
        mimeType: cleanedUserInput?.image?.mimeType
      });

      // Call generate API with streaming
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          config: usePassword ? null : config,
          userInput: cleanedUserInput,
          chartType,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        // Parse error response body if available
        let errorMessage = '生成代码失败';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If response body is not JSON, use status-based messages
          switch (response.status) {
            case 400:
              errorMessage = '请求参数错误，请检查输入内容';
              break;
            case 401:
            case 403:
              errorMessage = 'API 密钥无效或权限不足，请检查配置';
              break;
            case 429:
              errorMessage = '请求过于频繁，请稍后再试';
              break;
            case 500:
            case 502:
            case 503:
              errorMessage = '服务器错误，请稍后重试';
              break;
            default:
              errorMessage = `请求失败 (${response.status})`;
          }
        }
        throw new Error(errorMessage);
      }

      // ========== 处理流式响应（Server-Sent Events, SSE）==========
      // 获取响应体的 ReadableStream 读取器
      const reader = response.body.getReader();
      // 创建文本解码器，用于将字节流解码为文本
      const decoder = new TextDecoder();
      
      // 累积的代码内容（随着流式传输不断增长）
      let accumulatedCode = '';
      // 缓冲区：用于存储不完整的行（跨块的行数据）
      let buffer = '';
      // 错误标志和错误消息
      let hasError = false;
      let errorMessage = '';

      // 循环读取流数据，直到流结束
      while (true) {
        // 读取下一个数据块
        const { done, value } = await reader.read();
        if (done) break; // 流结束，退出循环

        // 将字节数据解码为文本并追加到缓冲区
        // stream: true 表示后续可能还有更多数据，保留不完整的字符序列
        buffer += decoder.decode(value, { stream: true });
        
        // 按换行符分割缓冲区内容
        const lines = buffer.split('\n');
        // 保留最后一个可能不完整的行到缓冲区，等待下次数据
        buffer = lines.pop() || '';

        // 处理每一行数据
        for (const line of lines) {
          // 跳过空行和结束标记
          if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;

          // SSE 格式：数据行以 "data: " 开头
          if (line.startsWith('data: ')) {
            try {
              // 解析 JSON 数据（跳过 "data: " 前缀）
              const data = JSON.parse(line.slice(6));
              
              // 如果包含错误信息，设置错误标志并抛出异常
              if (data.error) {
                hasError = true;
                errorMessage = data.error;
                throw new Error(data.error);
              } 
              // 如果包含内容块，累积并实时更新代码编辑器
              else if (data.content) {
                accumulatedCode += data.content; // 累积内容
                
                // 后处理并设置清理后的代码到编辑器
                // 实时更新，用户可以看到代码逐步生成
                const processedCode = postProcessDrawioCode(accumulatedCode);
                setGeneratedCode(processedCode);
              }
            } catch (e) {
              // 如果是 API 返回的错误，抛出异常
              if (hasError && errorMessage) {
                throw new Error(errorMessage);
              }
              // SSE 解析错误：记录警告但不中断流
              // 某些非关键解析错误（如不完整的 JSON）可以忽略
              if (e.message && !e.message.includes('Unexpected') && !e.message.includes('JSON')) {
                console.warn('SSE parsing warning:', e.message);
              }
            }
          }
        }
      }

      // If there was an error, throw it
      if (hasError && errorMessage) {
        throw new Error(errorMessage);
      }

      // Check if we got any code
      if (!accumulatedCode || accumulatedCode.trim().length === 0) {
        throw new Error('未收到任何生成内容，请检查模型配置或重试');
      }

      // Try to parse and apply the generated code (already post-processed)
      const processedCode = postProcessDrawioCode(accumulatedCode);
      setGeneratedCode(processedCode);
      tryParseAndApply(processedCode);

      // Save to history (only for text input)
      if (userMessage && processedCode) {
        historyManager.addHistory({
          chartType,
          userInput: userMessage,
          generatedCode: processedCode,
          config: {
            name: config.name || config.type,
            model: config.model
          }
        });
      }
    } catch (error) {
      // ========== 错误处理 ==========
      console.error('Error generating code:', error);

      // 如果用户主动取消（点击停止按钮），静默退出，不显示错误
      if (error.name === 'AbortError') {
        console.log('Generation aborted by user');
        return;
      }

      // 根据错误类型设置友好的错误提示信息
      // 检查是否为网络错误
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        setApiError('网络连接失败，请检查网络连接和API配置');
      } 
      // 检查是否为连接重置错误
      else if (error.message && error.message.includes('连接被重置')) {
        setApiError(error.message);
      } 
      // 检查是否为网络连接失败错误
      else if (error.message && error.message.includes('网络连接失败')) {
        setApiError(error.message);
      } 
      // 检查是否为请求超时错误
      else if (error.message && error.message.includes('请求超时')) {
        setApiError(error.message);
      } 
      // 其他错误：使用错误消息或默认消息
      else {
        setApiError(error.message || '生成失败，请检查配置和网络连接');
      }
    } finally {
      // ========== 清理工作 ==========
      // 无论成功还是失败，都要重置生成状态
      setIsGenerating(false);
      // 清除 AbortController 引用
      abortControllerRef.current = null;
    }
  };

  /**
   * 尝试解析并应用代码到画布
   * 
   * 此函数负责解析 LLM 生成的代码（XML 或 JSON），并应用到画布上显示。
   * 支持的功能：
   * 1. XML 格式代码（draw.io mxGraph 格式）
   * 2. JSON 格式代码（Excalidraw 元素数组）
   * 3. 截断检测：检测代码是否被截断（不完整）
   * 
   * @param {string} code - 待解析的代码字符串
   */
  const tryParseAndApply = (code) => {
    try {
      // 清除之前的 JSON 错误信息
      setJsonError(null);
      
      // ========== 代码验证 ==========
      // 检查代码是否为空或仅包含空白字符
      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        setJsonError('生成的代码为空，请检查模型配置或重试');
        console.error('No array or XML found in generated code - code is empty');
        return;
      }

      // 清理代码：去除首尾空白字符
      const cleanedCode = code.trim();

      // 调试日志：输出代码预览
      console.log('[DEBUG] tryParseAndApply - code preview:', cleanedCode.substring(0, 200));

      // ========== 截断检测 ==========
      // 检测 XML 结构的各个层级标签是否存在
      // 开始标签检测
      const hasStart = cleanedCode.includes('<mxfile');
      const hasDiagram = cleanedCode.includes('<diagram');
      const hasModel = cleanedCode.includes('<mxGraphModel');
      const hasRoot = cleanedCode.includes('<root');

      // 结束标签检测
      const hasEndFile = cleanedCode.includes('</mxfile>');
      const hasEndDiagram = cleanedCode.includes('</diagram>');
      const hasEndModel = cleanedCode.includes('</mxGraphModel>');
      const hasEndRoot = cleanedCode.includes('</root>');

      // 检测任何层级的截断情况
      // 如果某个层级有开始标签但没有对应的结束标签，说明代码被截断了
      const isTruncatedCheck = (
        (hasStart && !hasEndFile) ||      // mxfile 层级截断
        (hasDiagram && !hasEndDiagram) ||  // diagram 层级截断
        (hasModel && !hasEndModel) ||      // mxGraphModel 层级截断
        (hasRoot && !hasEndRoot)           // root 层级截断
      );

      if (isTruncatedCheck) {
        setIsTruncated(true);
        setCanContinue(true);

        // 生成详细的错误信息
        const missingTags = [];
        if (hasStart && !hasEndFile) missingTags.push('</mxfile>');
        if (hasDiagram && !hasEndDiagram) missingTags.push('</diagram>');
        if (hasModel && !hasEndModel) missingTags.push('</mxGraphModel>');
        if (hasRoot && !hasEndRoot) missingTags.push('</root>');

        setJsonError(`代码生成被截断，缺少闭合标签：${missingTags.join(', ')}。请点击"继续生成"按钮完成剩余部分。`);

        // Still try to apply the incomplete XML for preview
        setGeneratedXml(cleanedCode);
        setElements([]);
        return;
      } else {
        // Reset truncation state if complete
        setIsTruncated(false);
        setCanContinue(false);
      }

      // Try to extract XML from anywhere in the code (more flexible)
      const xmlMatch = cleanedCode.match(/<mxfile[\s\S]*?<\/mxfile>/);
      if (xmlMatch) {
        console.log('[DEBUG] Found XML, length:', xmlMatch[0].length);
        setGeneratedXml(xmlMatch[0]);
        setElements([]);
        return;
      }

      // Try to parse as JSON array
      const arrayMatch = cleanedCode.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          const parsed = JSON.parse(arrayMatch[0]);
          if (Array.isArray(parsed)) {
            setElements(parsed);
            setGeneratedXml('');
            return;
          }
        } catch (error) {
          console.error('Failed to parse JSON:', error);
        }
      }

      // If nothing found, show error with more context
      console.log('[DEBUG] No XML or JSON found. Code length:', cleanedCode.length);
      console.log('[DEBUG] Code preview:', cleanedCode.substring(0, 500));
      
      // Check if it looks like an error message
      if (cleanedCode.toLowerCase().includes('error') || 
          cleanedCode.toLowerCase().includes('失败') || 
          cleanedCode.toLowerCase().includes('无法') ||
          cleanedCode.length < 50) {
        setJsonError(`代码生成失败：${cleanedCode.substring(0, 200)}`);
      } else {
        setJsonError('代码中未找到有效的 JSON 数组或 XML。LLM 可能返回了解释性文字而非代码。请检查提示词或重试。');
      }
      console.error('No array or XML found in generated code');
    } catch (error) {
      console.error('Failed to parse generated code:', error);
      if (error instanceof SyntaxError) {
        setJsonError('语法错误：' + error.message);
      } else {
        setJsonError('解析失败：' + error.message);
      }
    }
  };

  /**
   * 处理应用代码操作
   * 
   * 将代码编辑器中的代码应用到画布上显示。
   * 添加短暂的延迟以提升用户体验（视觉反馈）。
   */
  const handleApplyCode = async () => {
    setIsApplyingCode(true);
    try {
      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      tryParseAndApply(generatedCode);
    } catch (error) {
      console.error('Error applying code:', error);
    } finally {
      setIsApplyingCode(false);
    }
  };

  /**
   * 处理优化代码操作
   * 
   * 对于 XML 格式的代码，优化操作实际上是重新应用代码。
   * 添加短暂的延迟以提升用户体验。
   */
  const handleOptimizeCode = async () => {
    setIsOptimizingCode(true);
    try {
      // XML doesn't need optimization, just reapply
      await new Promise(resolve => setTimeout(resolve, 300));
      tryParseAndApply(generatedCode);
    } catch (error) {
      console.error('Error applying code:', error);
    } finally {
      setIsOptimizingCode(false);
    }
  };

  /**
   * 处理清空代码操作
   * 
   * 清空代码编辑器中的内容。
   */
  const handleClearCode = () => {
    setGeneratedCode('');
  };

  /**
   * 处理打开高级优化面板
   * 
   * 在打开优化面板前检查是否已有生成的代码。
   * 如果没有代码，显示提示并打开配置管理器。
   */
  const handleOpenOptimizationPanel = () => {
    if (!generatedCode.trim()) {
      setNotification({
        isOpen: true,
        title: '提示',
        message: '请先生成图表代码',
        type: 'warning'
      });
      return;
    }
    setIsOptimizationPanelOpen(true);
  };

  /**
   * 处理高级优化操作
   * 
   * 使用 AI 对生成的图表代码进行优化，根据用户提供的优化建议进行改进。
   * 流程与生成代码类似，但使用优化提示词和优化系统提示词。
   * 
   * @param {Array} suggestions - 优化建议数组
   */
  const handleAdvancedOptimize = async (suggestions) => {
    if (!generatedCode.trim()) {
      return;
    }

    setIsOptimizationPanelOpen(false);

    // Build optimization prompt
    const optimizationPrompt = createOptimizationPrompt(generatedCode, suggestions);

    // Use optimization system prompt
    const usePassword = typeof window !== 'undefined' && localStorage.getItem('smart-excalidraw-use-password') === 'true';
    const accessPassword = typeof window !== 'undefined' ? localStorage.getItem('smart-excalidraw-access-password') : '';

    if (!usePassword && !isConfigValid(config)) {
      setNotification({
        isOpen: true,
        title: '配置提醒',
        message: '请先配置您的 LLM 提供商或启用访问密码',
        type: 'warning'
      });
      setIsConfigManagerOpen(true);
      return;
    }

    setIsGenerating(true);
    setApiError(null);
    setJsonError(null);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (usePassword && accessPassword) {
        headers['x-access-password'] = accessPassword;
      }

      let finalConfig = usePassword ? null : config;
      if (usePassword && accessPassword) {
        // Server will use server-side config
        finalConfig = null;
      }

      // Call generate API with optimization prompt
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
        let errorMessage = '优化失败';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          errorMessage = `请求失败 (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      // Process streaming response
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
                const processedCode = postProcessDrawioCode(accumulatedCode);
                setGeneratedCode(processedCode);
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              if (e.message && !e.message.includes('Unexpected')) {
                setApiError('数据流解析错误：' + e.message);
              }
              console.error('Failed to parse SSE:', e);
            }
          }
        }
      }

      // Apply optimized code
      const processedCode = postProcessDrawioCode(accumulatedCode);
      setGeneratedCode(processedCode);
      tryParseAndApply(processedCode);

      setNotification({
        isOpen: true,
        title: '优化完成',
        message: '图表已成功优化',
        type: 'info'
      });
    } catch (error) {
      console.error('Error optimizing code:', error);

      // If user aborted, exit silently
      if (error.name === 'AbortError') {
        console.log('Optimization aborted by user');
        return;
      }

      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        setApiError('网络连接失败，请检查网络连接和API配置');
      } else if (error.message && error.message.includes('连接被重置')) {
        setApiError(error.message);
      } else if (error.message && error.message.includes('网络连接失败')) {
        setApiError(error.message);
      } else if (error.message && error.message.includes('请求超时')) {
        setApiError(error.message);
      } else {
        setApiError(error.message || '优化失败，请检查配置和网络连接');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  /**
   * 处理继续生成操作
   * 
   * 当生成的代码被截断（不完整）时，用户可以点击"继续生成"按钮
   * 来补全剩余的代码。使用续写系统提示词来完成剩余部分。
   */
  const handleContinueGeneration = async () => {
    if (!generatedCode.trim() || !isTruncated) {
      return;
    }

    const usePassword = typeof window !== 'undefined' && localStorage.getItem('smart-excalidraw-use-password') === 'true';
    const accessPassword = typeof window !== 'undefined' ? localStorage.getItem('smart-excalidraw-access-password') : '';

    if (!usePassword && !isConfigValid(config)) {
      setNotification({
        isOpen: true,
        title: '配置提醒',
        message: '请先配置您的 LLM 提供商或启用访问密码',
        type: 'warning'
      });
      setIsConfigManagerOpen(true);
      return;
    }

    setIsGenerating(true);
    setApiError(null);
    setJsonError(null);
    setCanContinue(false); // Disable continue button during generation

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (usePassword && accessPassword) {
        headers['x-access-password'] = accessPassword;
      }

      let finalConfig = usePassword ? null : config;

      // Build continuation prompt
      const continuationPrompt = createContinuationPrompt(generatedCode);

      // Call generate API with continuation prompt and flag
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          config: finalConfig,
          userInput: continuationPrompt,
          chartType: 'auto',
          isContinuation: true, // Flag to use CONTINUATION_SYSTEM_PROMPT
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorMessage = '续写失败';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          errorMessage = `请求失败 (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      // Process streaming response
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

                // 智能拼接：去除 LLM 可能重复的开始标签
                let continuationCode = accumulatedCode.trim();

                // 去除可能重复的 XML 声明和开始标签
                continuationCode = continuationCode.replace(/^<\?xml[^>]*>\s*/i, '');
                continuationCode = continuationCode.replace(/^<mxfile[^>]*>\s*/i, '');
                continuationCode = continuationCode.replace(/^<diagram[^>]*>\s*/i, '');
                continuationCode = continuationCode.replace(/^<mxGraphModel[^>]*>\s*/i, '');
                continuationCode = continuationCode.replace(/^<root>\s*/i, '');

                // 拼接：原代码 + 清理后的续写代码
                const completeCode = generatedCode + '\n' + continuationCode;
                const processedCode = postProcessDrawioCode(completeCode);
                setGeneratedCode(processedCode);
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      // Try to parse and apply the completed code
      // 智能拼接：去除 LLM 可能重复的开始标签
      let continuationCode = accumulatedCode.trim();

      // 去除可能重复的 XML 声明和开始标签
      continuationCode = continuationCode.replace(/^<\?xml[^>]*>\s*/i, '');
      continuationCode = continuationCode.replace(/^<mxfile[^>]*>\s*/i, '');
      continuationCode = continuationCode.replace(/^<diagram[^>]*>\s*/i, '');
      continuationCode = continuationCode.replace(/^<mxGraphModel[^>]*>\s*/i, '');
      continuationCode = continuationCode.replace(/^<root>\s*/i, '');

      // 拼接：原代码 + 清理后的续写代码
      const completeCode = generatedCode + '\n' + continuationCode;
      const processedCode = postProcessDrawioCode(completeCode);
      setGeneratedCode(processedCode);
      tryParseAndApply(processedCode);

      // Save to history
      if (processedCode) {
        historyManager.addHistory({
          chartType: currentChartType,
          userInput: currentInput + ' (续写)',
          generatedCode: processedCode,
          config: {
            name: config?.name || config?.type || 'server',
            model: config?.model || 'unknown'
          }
        });
      }
    } catch (error) {
      console.error('Error continuing generation:', error);

      // If user aborted, exit silently
      if (error.name === 'AbortError') {
        console.log('Continuation aborted by user');
        return;
      }

      // Check if it's a network error
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        setApiError('网络连接失败，请检查网络连接和API配置');
      } else if (error.message && error.message.includes('连接被重置')) {
        setApiError(error.message);
      } else if (error.message && error.message.includes('网络连接失败')) {
        setApiError(error.message);
      } else if (error.message && error.message.includes('请求超时')) {
        setApiError(error.message);
      } else {
        setApiError(error.message || '生成失败，请检查配置和网络连接');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  /**
   * 处理配置选择
   * 
   * 从配置管理器中选择配置后，更新当前激活的配置。
   * 
   * @param {Object} selectedConfig - 选中的配置对象
   */
  const handleConfigSelect = (selectedConfig) => {
    if (selectedConfig) {
      setConfig(selectedConfig);
    }
  };

  /**
   * 处理应用历史记录
   * 
   * 从历史记录中选择一条记录，恢复当时的输入和生成的代码。
   * 
   * @param {Object} history - 历史记录对象，包含 userInput, chartType, generatedCode 等
   */
  const handleApplyHistory = (history) => {
    setCurrentInput(history.userInput);
    setCurrentChartType(history.chartType);
    setGeneratedCode(history.generatedCode);
    tryParseAndApply(history.generatedCode);
  };

  /**
   * 处理水平拖拽调整面板宽度
   * 
   * 当用户按下调整条时，开始调整左侧面板和右侧画布的宽度比例。
   * 
   * @param {MouseEvent} e - 鼠标事件对象
   */
  const handleHorizontalMouseDown = (e) => {
    setIsResizingHorizontal(true);
    e.preventDefault();
  };

  /**
   * 处理面板宽度调整的鼠标事件
   * 
   * 当用户拖拽调整条时，监听鼠标移动和释放事件，实时更新面板宽度。
   * 面板宽度限制在 20% 到 80% 之间。
   * 
   * 依赖：isResizingHorizontal（当开始调整时触发）
   */
  useEffect(() => {
    /**
     * 处理鼠标移动事件
     * 
     * 根据鼠标位置计算左侧面板的宽度百分比。
     * 
     * @param {MouseEvent} e - 鼠标事件对象
     */
    const handleMouseMove = (e) => {
      if (!isResizingHorizontal) return;
      
      // 计算鼠标位置占窗口宽度的百分比
      const percentage = (e.clientX / window.innerWidth) * 100;
      
      // 限制面板宽度在 20% 到 80% 之间
      setLeftPanelWidth(Math.min(Math.max(percentage, 20), 80));
    };

    /**
     * 处理鼠标释放事件
     * 
     * 当用户释放鼠标时，停止调整操作。
     */
    const handleMouseUp = () => {
      setIsResizingHorizontal(false);
    };

    // 只有在调整状态下才添加事件监听器
    if (isResizingHorizontal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    // 清理函数：移除事件监听器
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingHorizontal]);

  // ========== JSX 渲染 ==========
  
  /**
   * 主页面 UI 结构
   * 
   * 布局说明：
   * - 整体采用 flex 垂直布局，全屏高度
   * - 顶部：头部区域（标题、配置状态、操作按钮）
   * - 中间：左右分栏布局（可调节宽度）
   *   - 左侧：聊天输入区和代码编辑器（50%-50%）
   *   - 中间：拖拽调整条
   *   - 右侧：图表画布
   * - 底部：页脚（版本信息）
   * - 多个弹窗组件（配置管理、历史记录、优化面板等）
   */
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ========== 头部区域 ========== */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Smart Drawio</h1>
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
              isTruncated={isTruncated}
              canContinue={canContinue}
              onContinue={handleContinueGeneration}
            />
          </div>
        </div>

        {/* Horizontal Resizer */}
        <div
          onMouseDown={handleHorizontalMouseDown}
          className="w-1 bg-gray-200 hover:bg-gray-400 cursor-col-resize transition-colors duration-200 flex-shrink-0"
        />

        {/* Right Panel - Drawio Canvas */}
        <div style={{ width: `${100 - leftPanelWidth}%`, height: '100%' }} className="bg-gray-50">
          <DrawioCanvas elements={elements} xml={generatedXml} />
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
          <span>Smart Drawio v0.1.0</span>
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
