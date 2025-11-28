// -*- coding: utf-8 -*-
/**
 * FlowPilot 主页面组件
 * 
 * 这是应用的主页面，集成了以下功能：
 * - Draw.io 图表编辑器（drawio 模式）
 * - SVG 工作室（svg 模式）
 * - 智能聊天面板（AI 助手）
 * - 响应式布局（移动端检测和提示）
 * - 可调整大小的聊天面板（拖拽调整）
 * - 渲染模式切换（drawio ↔ svg）
 */

// Next.js 客户端组件指令：此组件需要在客户端运行
// 因为使用了 useState、useEffect 等 React Hooks 和浏览器 API
"use client";

// React 核心：状态管理和副作用处理
import React, { useState, useEffect } from "react";

// Draw.io 嵌入组件：用于在页面中嵌入 Draw.io 编辑器
import { DrawIoEmbed } from "react-drawio";

// 聊天面板组件：优化的聊天界面，支持 AI 对话和图表生成
import ChatPanelOptimized from "@/components/chat-panel-optimized";

// Context Hooks：从全局状态管理中获取数据和函数
import { useDiagram } from "@/contexts/diagram-context";  // 图表状态（XML、导出函数等）
import { useLocale } from "@/contexts/locale-context";     // 国际化（翻译函数）

// 工具函数：条件类名合并工具（类似 clsx）
import { cn } from "@/lib/utils";

// 图标库：Lucide React 图标组件
import { MessageSquare, Minimize2 } from "lucide-react";

// Draw.io 诊断 Hook：监控 Draw.io 编辑器的运行状态和错误
import { useDrawioDiagnostics } from "@/hooks/use-drawio-diagnostics";

// 工作区导航组件：顶部导航栏
import { WorkspaceNav } from "@/components/workspace-nav";

// SVG 工作室组件：SVG 模式的编辑器界面
import { SvgStudio } from "@/components/svg-studio";

/**
 * 主页面组件
 * 
 * 负责渲染整个工作区界面，包括：
 * - 图表编辑器（Draw.io 或 SVG 工作室）
 * - 可调整大小的聊天面板
 * - 移动端检测和提示
 * - 渲染模式切换
 * 
 * @returns {JSX.Element} 主页面 JSX 结构
 */
export default function Home() {
  // ========== Context Hooks ==========
  // 从图表上下文获取 Draw.io 引用、导出处理函数和运行时错误设置函数
  const { drawioRef, handleDiagramExport, setRuntimeError } = useDiagram();
  
  // 从国际化上下文获取翻译函数
  const { t } = useLocale();
  
  // ========== 状态管理 ==========
  // 移动端检测：判断当前是否为移动设备（屏幕宽度 < 768px）
  const [isMobile, setIsMobile] = useState(false);
  
  // Draw.io 错误状态：存储 Draw.io 加载失败的错误信息
  const [drawioError, setDrawioError] = useState(null);
  
  // Draw.io 加载状态：标识 Draw.io 编辑器是否正在加载
  const [isDrawioLoading, setIsDrawioLoading] = useState(true);
  
  // 聊天面板可见性：控制聊天面板的显示/隐藏
  const [isChatVisible, setIsChatVisible] = useState(true);
  
  // 聊天面板宽度百分比：控制聊天面板占据的宽度（26%-50%）
  const [chatWidthPercent, setChatWidthPercent] = useState(34);
  
  // 调整大小状态：标识用户是否正在拖拽调整聊天面板大小
  const [isResizingChat, setIsResizingChat] = useState(false);
  
  // 渲染模式：当前使用的编辑器模式（"drawio" 或 "svg"）
  const [renderMode, setRenderMode] = useState("drawio");
  
  // ========== Refs ==========
  // RAF 引用：用于节流调整大小操作，避免频繁更新状态导致性能问题
  const resizeRafRef = React.useRef(null);
  
  // 待处理的聊天宽度百分比：在 RAF 中使用的临时值，避免状态更新冲突
  const pendingChatPercentRef = React.useRef(chatWidthPercent);
  
  // Draw.io 基础 URL：Draw.io 编辑器的嵌入地址
  // 注意：URL 末尾有一个空格，可能是配置错误，但保持原样
  const drawioBaseUrl = "https://embed.diagrams.net ";
  // ========== Draw.io 诊断 Hook ==========
  // 监控 Draw.io 编辑器的运行状态，捕获运行时错误和加载信号
  useDrawioDiagnostics({
    baseUrl: drawioBaseUrl,
    // 运行时错误回调：当 Draw.io 发生运行时错误时调用
    onRuntimeError: (payload) => {
      // 只在 drawio 模式下处理错误
      if (renderMode !== "drawio") return;
      // 将错误信息设置到图表上下文中
      setRuntimeError(payload);
    },
    // 运行时信号回调：监听 Draw.io 的生命周期事件
    onRuntimeSignal: (event) => {
      // 只在 drawio 模式下处理信号
      if (renderMode !== "drawio") return;
      // 当编辑器加载完成时，清除错误状态
      if (event?.event === "load") {
        setRuntimeError(null);
      }
    }
  });
  // ========== 副作用（useEffect）==========
  
  /**
   * 移动端检测
   * 监听窗口大小变化，检测是否为移动设备（宽度 < 768px）
   */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    // 立即执行一次检测
    checkMobile();
    // 监听窗口大小变化
    window.addEventListener("resize", checkMobile);
    // 清理：组件卸载时移除事件监听器
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  /**
   * Draw.io 加载超时检测
   * 如果 Draw.io 在 15 秒内未加载完成，显示超时错误
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      // 只在 drawio 模式且仍在加载时触发超时
      if (isDrawioLoading && renderMode === "drawio") {
        setDrawioError(t("drawio.loadTimeout"));
        setIsDrawioLoading(false);
      }
    }, 15e3); // 15 秒超时
    // 清理：组件卸载或依赖变化时清除定时器
    return () => {
      clearTimeout(timeout);
    };
  }, [isDrawioLoading, t]);
  
  // ========== 事件处理函数 ==========
  
  /**
   * Draw.io 加载完成处理函数
   * 当 Draw.io 编辑器成功加载时调用，清除加载状态和错误状态
   */
  const handleDrawioLoad = () => {
    setIsDrawioLoading(false);
    setDrawioError(null);
  };
  
  // ========== 计算值 ==========
  // 判断是否显示 Draw.io 编辑器（根据渲染模式）
  const showDrawio = renderMode === "drawio";
  // ========== 移动端提前返回 ==========
  // 如果是移动设备，显示提示信息而不是完整的工作区
  // 因为 Draw.io 和复杂的布局在移动端体验不佳
  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-100">
        {/* 工作区导航栏 */}
        <WorkspaceNav />
        {/* 移动端提示内容 */}
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="text-center rounded-2xl border border-gray-200 bg-white/90 p-8 shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-800">
              {t("workspace.mobileWarning")}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {t("workspace.mobileHint")}
            </p>
          </div>
        </div>
      </div>
    );
  }
  // ========== 主内容区域引用 ==========
  // 用于获取主内容区域的 DOM 元素，用于计算拖拽位置和滚动控制
  const mainContentRef = React.useRef(null);
  
  /**
   * 初始滚动定位
   * 组件挂载时，将页面滚动到主内容区域
   */
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, []);
  
  /**
   * 聊天面板拖拽调整大小
   * 当用户开始拖拽调整聊天面板大小时，监听鼠标/触摸移动事件
   */
  useEffect(() => {
    // 如果不在调整大小状态，直接返回
    if (!isResizingChat) return;
    
    /**
     * 处理拖拽移动事件
     * 根据鼠标/触摸位置计算新的聊天面板宽度百分比
     */
    const handleMove = (event) => {
      // 如果主内容区域不存在或聊天面板不可见，直接返回
      if (!mainContentRef.current || !isChatVisible) return;
      
      // 获取主内容区域的边界矩形
      const rect = mainContentRef.current.getBoundingClientRect();
      // 计算鼠标相对于主内容区域的 X 坐标
      const offsetX = event.clientX - rect.left;
      
      // 最小宽度限制（像素）
      const minChatPx = 320;      // 聊天面板最小宽度：320px
      const minCanvasPx = 520;    // 画布区域最小宽度：520px
      
      // 限制 X 坐标在有效范围内
      // 确保画布区域至少有 minCanvasPx 宽度，聊天面板至少有 minChatPx 宽度
      const clampedX = Math.min(
        Math.max(offsetX, minCanvasPx),
        rect.width - minChatPx
      );
      
      // 计算聊天面板的宽度百分比
      // 从右侧计算：聊天面板宽度 = 总宽度 - 鼠标位置
      const nextChatPercent = (rect.width - clampedX) / rect.width * 100;
      
      // 限制百分比在 26%-50% 之间
      const clampedPercent = Math.min(
        50,  // 最大 50%
        Math.max(26, nextChatPercent)  // 最小 26%
      );
      
      // 节流：如果变化小于 0.25%，不更新（避免频繁渲染）
      if (Math.abs(clampedPercent - pendingChatPercentRef.current) < 0.25) {
        return;
      }
      
      // 更新待处理的百分比值
      pendingChatPercentRef.current = clampedPercent;
      
      // 使用 requestAnimationFrame 节流状态更新
      // 避免在拖拽过程中频繁触发 React 重新渲染
      if (resizeRafRef.current === null) {
        resizeRafRef.current = window.requestAnimationFrame(() => {
          setChatWidthPercent(pendingChatPercentRef.current);
          resizeRafRef.current = null;
        });
      }
    };
    
    /**
     * 处理拖拽结束事件
     * 当用户释放鼠标/触摸时调用，结束调整大小状态
     */
    const handleUp = () => {
      setIsResizingChat(false);
      // 恢复文本选择功能
      document.body.classList.remove("select-none");
    };
    
    // 注册全局事件监听器
    // 使用 passive: true 提升滚动性能
    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerup", handleUp, { passive: true });
    window.addEventListener("pointercancel", handleUp, { passive: true });  // 触摸取消事件
    window.addEventListener("blur", handleUp);      // 窗口失去焦点时结束拖拽
    window.addEventListener("mouseleave", handleUp);  // 鼠标离开窗口时结束拖拽
    
    // 清理：移除所有事件监听器
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      window.removeEventListener("blur", handleUp);
      window.removeEventListener("mouseleave", handleUp);
    };
  }, [isResizingChat, isChatVisible]);
  
  /**
   * 聊天面板隐藏时的清理
   * 当聊天面板被隐藏时，自动结束调整大小状态
   */
  useEffect(() => {
    if (!isChatVisible) {
      setIsResizingChat(false);
      document.body.classList.remove("select-none");
    }
  }, [isChatVisible]);
  
  /**
   * 同步待处理的聊天宽度百分比
   * 当 chatWidthPercent 状态更新时，同步到 ref 中
   */
  useEffect(() => {
    pendingChatPercentRef.current = chatWidthPercent;
  }, [chatWidthPercent]);
  
  /**
   * 组件卸载时的清理
   * 取消未完成的 requestAnimationFrame，避免内存泄漏
   */
  useEffect(() => {
    return () => {
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
      }
    };
  }, []);
  /**
   * 开始调整聊天面板大小
   * 当用户在调整条上按下鼠标/触摸时调用
   * 
   * @param {PointerEvent} event - 指针事件对象
   */
  const handleResizeChatStart = (event) => {
    // 如果聊天面板不可见，或不是主鼠标按钮（左键），直接返回
    if (!isChatVisible || event.button !== 0) return;
    
    // 阻止默认行为（如文本选择）
    event.preventDefault();
    
    // 捕获指针事件，确保即使指针移出元素也能继续接收事件
    event.currentTarget.setPointerCapture?.(event.pointerId);
    
    // 禁用文本选择，提升拖拽体验
    document.body.classList.add("select-none");
    
    // 开始调整大小状态
    setIsResizingChat(true);
  };
  
  // ========== 常量 ==========
  // 调整条宽度：用于分隔画布和聊天面板的拖拽条宽度
  const RESIZER_WIDTH = 10;
  
  // ========== 计算样式 ==========
  // 网格列模板：根据聊天面板可见性动态计算布局
  // 如果聊天面板可见：画布 | 调整条 | 聊天面板
  // 如果聊天面板隐藏：只有画布（1fr）
  const gridTemplateColumns = isChatVisible 
    ? `${100 - chatWidthPercent}fr ${RESIZER_WIDTH}px ${chatWidthPercent}fr` 
    : "1fr";
  // ========== JSX 渲染 ==========
  return (
    <div className="bg-gray-100">
      <section className="flex min-h-screen flex-col">
        {/* 
          工作区导航栏（当前被注释掉）
          如果需要显示顶部导航，取消注释即可
        */}
        {/* <WorkspaceNav /> */}
        
        {/* 
          主内容区域：使用 CSS Grid 布局
          - 根据聊天面板可见性动态调整列布局
          - 使用动态高度（h-dvh）确保占满视口
        */}
        <div
          ref={mainContentRef}
          className={cn(
            "grid h-dvh min-h-0 flex-1",
            !isChatVisible && "grid-cols-1"
          )}
          style={{ gridTemplateColumns }}
        >
          {/* 
            画布区域：包含编辑器（Draw.io 或 SVG 工作室）和切换按钮
            - relative：为绝对定位的切换按钮提供定位上下文
            - min-w-0：防止 flex 子元素溢出
          */}
          <div className="relative flex h-full min-h-0 min-w-0 p-1">
            {/* 
              聊天面板切换按钮容器
              - pointer-events-none：容器本身不接收鼠标事件
              - 根据聊天面板可见性调整定位方式：
                * 可见时：绝对定位在画布右上角
                * 隐藏时：固定定位在页面右上角
            */}
            <div
              className={cn(
                "pointer-events-none",
                isChatVisible 
                  ? "absolute right-4 top-4 z-30" 
                  : "fixed right-6 top-24 z-40"
              )}
            >
              {/* 
                聊天面板切换按钮
                - 点击后切换聊天面板的显示/隐藏状态
                - 根据当前状态显示不同的图标和文本
              */}
              <button
                type="button"
                aria-label={isChatVisible ? t("workspace.focusCanvas") : t("workspace.showChat")}
                onClick={() => setIsChatVisible((prev) => !prev)}
                className={cn(
                  "pointer-events-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition",
                  // 聊天面板可见时的样式：灰色边框，白色背景
                  isChatVisible 
                    ? "border-gray-200 bg-white/90 text-gray-700 shadow-sm hover:bg-white" 
                    // 聊天面板隐藏时的样式：蓝色背景，更突出
                    : "border-blue-500 bg-blue-600 text-white shadow-lg hover:bg-blue-500/90"
                )}
              >
                {isChatVisible ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5" />
                    {t("workspace.focusCanvas")}
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-3.5 w-3.5" />
                    {t("workspace.showChat")}
                  </>
                )}
              </button>
            </div>
            {/* 
              编辑器区域：根据渲染模式显示不同的编辑器
            */}
            {showDrawio ? (
              // ========== Draw.io 模式 ==========
              drawioError ? (
                /* 
                  Draw.io 加载错误提示
                  当 Draw.io 加载失败时显示错误信息和解决方案
                */
                <div className="flex items-center justify-center h-full bg-white rounded border-2 border-red-200">
                  <div className="text-center p-8 max-w-md">
                    <h2 className="text-xl font-semibold text-red-600 mb-4">
                      {t("drawio.loadFailed")}
                    </h2>
                    <p className="text-gray-700 mb-4">{drawioError}</p>
                    {/* 解决方案列表 */}
                    <div className="text-sm text-gray-600 text-left bg-gray-50 p-4 rounded">
                      <p className="font-semibold mb-2">{t("drawio.solutions")}</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>{t("drawio.solution1")}</li>
                        <li>{t("drawio.solution2")}</li>
                        {/* 环境变量配置示例 */}
                        <li className="ml-4 font-mono text-xs bg-white p-2 rounded mt-2">
                          NEXT_PUBLIC_DRAWIO_BASE_URL=https://app.diagrams.net
                        </li>
                        <li>{t("drawio.solution3")}</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* 
                    Draw.io 加载中提示
                    在编辑器加载期间显示加载动画
                  */}
                  {isDrawioLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">{t("drawio.loadingEditor")}</p>
                      </div>
                    </div>
                  )}
                  {/* 
                    Draw.io 嵌入组件
                    - ref：用于访问 Draw.io 实例，执行导出等操作
                    - baseUrl：Draw.io 编辑器的基础 URL
                    - onExport：图表导出时的回调函数
                    - onLoad：编辑器加载完成时的回调函数
                    - urlParameters：Draw.io URL 参数配置
                      * spin：显示加载动画
                      * libraries：禁用形状库（减少加载时间）
                      * saveAndExit：禁用保存并退出按钮
                      * noExitBtn：隐藏退出按钮
                  */}
                  <DrawIoEmbed
                    ref={drawioRef}
                    baseUrl={drawioBaseUrl}
                    onExport={handleDiagramExport}
                    onLoad={handleDrawioLoad}
                    urlParameters={{
                      spin: true,
                      libraries: false,
                      saveAndExit: false,
                      noExitBtn: true
                    }}
                  />
                </>
              )
            ) : (
              // ========== SVG 模式 ==========
              /* 
                SVG 工作室组件
                当渲染模式为 "svg" 时显示 SVG 编辑器
              */
              <div className="flex h-full w-full rounded-xl border border-slate-200 bg-white/90">
                <SvgStudio />
              </div>
            )}
          </div>
          {/* 
            调整条（Resizer）
            用于拖拽调整聊天面板宽度的分隔条
            - 只在聊天面板可见且屏幕宽度 >= lg 时显示
            - 使用 pointer 事件支持触摸和鼠标操作
          */}
          {isChatVisible && (
            <div
              role="separator"
              aria-orientation="vertical"
              onPointerDown={handleResizeChatStart}
              className={cn(
                "hidden h-full items-center justify-center border-x border-slate-100 bg-white/60 transition hover:bg-slate-100 active:bg-slate-200 lg:flex cursor-col-resize",
                // 调整大小时的高亮样式
                isResizingChat && "bg-blue-50 border-blue-200"
              )}
              style={{ width: RESIZER_WIDTH }}
            >
              {/* 调整条的视觉指示器 */}
              <div className="h-10 w-1 rounded-full bg-slate-300" />
            </div>
          )}
          
          {/* 
            聊天面板区域
            - 只在聊天面板可见且屏幕宽度 >= lg 时显示
            - 使用过渡动画实现平滑的显示/隐藏效果
          */}
          {isChatVisible && (
            <div
              className={cn(
                "hidden h-full min-h-0 p-1 transition-all duration-300 lg:block",
                isChatVisible 
                  ? "opacity-100" 
                  : "pointer-events-none opacity-0 translate-x-4"
              )}
            >
              {/* 
                优化的聊天面板组件
                - onCollapse：折叠回调，隐藏聊天面板
                - isCollapsible：允许折叠
                - renderMode：当前渲染模式（drawio/svg）
                - onRenderModeChange：渲染模式切换回调
              */}
              <ChatPanelOptimized
                onCollapse={() => setIsChatVisible(false)}
                isCollapsible
                renderMode={renderMode}
                onRenderModeChange={setRenderMode}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
