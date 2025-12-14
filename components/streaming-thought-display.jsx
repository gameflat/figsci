// -*- coding: utf-8 -*-
/**
 * 流式思考显示组件
 * 
 * 用于替代固定步骤进度指示器，显示类似 GPT/Claude 的流式思考过程
 * 让用户看到 LLM 的实时思考内容，而非固定的进度步骤
 */
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  Brain, 
  Sparkles, 
  Loader2,
  CheckCircle2,
  Palette,
  Search
} from "lucide-react";

/**
 * 思考状态枚举
 * @typedef {"idle" | "thinking" | "tool_calling" | "generating" | "completed"} ThinkingStatus
 */

/**
 * 工具调用信息
 * @typedef {Object} ToolCallInfo
 * @property {string} toolName - 工具名称
 * @property {string} [status] - 工具状态
 */

/**
 * 流式思考显示组件
 * 
 * @param {Object} props
 * @param {string} [props.content] - 当前显示的思考内容（LLM 的文本输出）
 * @param {boolean} [props.isStreaming=false] - 是否正在流式输出
 * @param {ThinkingStatus} [props.status="idle"] - 当前状态
 * @param {ToolCallInfo} [props.toolCall] - 当前工具调用信息
 * @param {string} [props.className] - 自定义类名
 */
export function StreamingThoughtDisplay({ 
  content = "",
  isStreaming = false,
  status = "idle",
  toolCall = null,
  className
}) {
  // 追踪开始时间
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(null);

  // 根据状态获取配置 - useMemo 必须在所有条件返回之前调用（React Hooks 规则）
  const statusConfig = useMemo(() => {
    switch (status) {
      case "thinking":
        return {
          icon: Brain,
          label: "思考中",
          description: "AI 正在分析您的需求...",
          color: "text-violet-600",
          bgColor: "bg-violet-50",
          borderColor: "border-violet-200",
          iconAnimate: true
        };
      case "tool_calling":
        return {
          icon: toolCall?.toolName === "search_template" ? Search : Sparkles,
          label: getToolLabel(toolCall?.toolName),
          description: getToolDescription(toolCall?.toolName),
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          iconAnimate: true
        };
      case "generating":
        return {
          icon: Palette,
          label: "生成图表",
          description: "正在绘制图表...",
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
          iconAnimate: true
        };
      case "completed":
        return {
          icon: CheckCircle2,
          label: "完成",
          description: "图表生成完成",
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
          iconAnimate: false
        };
      default:
        return {
          icon: Brain,
          label: "处理中",
          description: "请稍候...",
          color: "text-slate-600",
          bgColor: "bg-slate-50",
          borderColor: "border-slate-200",
          iconAnimate: true
        };
    }
  }, [status, toolCall]);

  // 开始/停止计时 - useEffect 也必须在条件返回之前调用
  useEffect(() => {
    if (status !== "idle" && status !== "completed") {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setElapsedSeconds(Math.floor(elapsed / 1000));
      }, 1000);

      return () => clearInterval(timer);
    } else if (status === "idle") {
      startTimeRef.current = null;
      setElapsedSeconds(0);
    }
  }, [status]);

  // 不显示时返回 null - 条件返回必须在所有 Hooks 之后
  if (status === "idle") {
    return null;
  }

  const Icon = statusConfig.icon;

  return (
    <div className={cn("flex justify-start mb-4 animate-fade-in", className)}>
      <div
        className={cn(
          "max-w-md rounded-xl border shadow-sm overflow-hidden transition-all duration-300",
          statusConfig.borderColor,
          "bg-white/95"
        )}
      >
        {/* 头部：状态和计时 */}
        <div className={cn(
          "flex items-center justify-between px-4 py-2.5 border-b border-slate-100",
          statusConfig.bgColor
        )}>
          <div className="flex items-center gap-2">
            <Icon 
              className={cn(
                "h-4 w-4",
                statusConfig.color,
                statusConfig.iconAnimate && "animate-pulse"
              )} 
            />
            <span className={cn("text-sm font-medium", statusConfig.color)}>
              {statusConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {status !== "completed" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{elapsedSeconds}s</span>
              </>
            ) : (
              <span className="text-emerald-600 font-medium">
                耗时 {elapsedSeconds}s
              </span>
            )}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="px-4 py-3">
          {/* 状态描述 */}
          <p className="text-sm text-slate-600 leading-relaxed">
            {content || statusConfig.description}
            {isStreaming && status !== "completed" && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-slate-400 animate-blink align-middle" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 简化版思考指示器 - 内联显示
 * 
 * @param {Object} props
 * @param {ThinkingStatus} [props.status="idle"]
 * @param {string} [props.className]
 */
export function InlineThinkingIndicator({ status = "idle", className }) {
  if (status === "idle" || status === "completed") {
    return null;
  }

  const config = {
    thinking: { icon: Brain, text: "思考中...", color: "text-violet-600" },
    tool_calling: { icon: Sparkles, text: "调用工具...", color: "text-blue-600" },
    generating: { icon: Palette, text: "生成中...", color: "text-emerald-600" },
  }[status] || { icon: Brain, text: "处理中...", color: "text-slate-600" };

  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", config.color, className)}>
      <Icon className="h-3 w-3 animate-pulse" />
      <span>{config.text}</span>
    </span>
  );
}

/**
 * 获取工具调用的显示标签
 * 
 * @param {string} toolName
 * @returns {string}
 */
function getToolLabel(toolName) {
  const labels = {
    search_template: "搜索模板",
    display_diagram: "渲染图表",
    edit_diagram: "编辑图表",
    display_svg: "渲染 SVG",
  };
  return labels[toolName] || "调用工具";
}

/**
 * 获取工具调用的描述
 * 
 * @param {string} toolName
 * @returns {string}
 */
function getToolDescription(toolName) {
  const descriptions = {
    search_template: "正在搜索最适合的模板...",
    display_diagram: "正在将图表渲染到画布...",
    edit_diagram: "正在应用修改到图表...",
    display_svg: "正在渲染 SVG 图表...",
  };
  return descriptions[toolName] || "正在执行工具调用...";
}

export default StreamingThoughtDisplay;

