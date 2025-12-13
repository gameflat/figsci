// -*- coding: utf-8 -*-
/**
 * 生成进度指示器组件
 * 
 * 在用户提交请求后显示详细的进度步骤，提升等待体验
 */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  Search, 
  Send, 
  Brain, 
  Palette,
  CheckCircle2,
  Loader2
} from "lucide-react";

/**
 * 进度阶段枚举
 * @typedef {"idle" | "preparing" | "matching" | "sending" | "thinking" | "generating"} GenerationPhase
 */

/**
 * 进度阶段配置
 */
const PHASE_CONFIG = {
  preparing: {
    icon: Sparkles,
    label: "准备中",
    description: "正在准备请求数据...",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-200",
  },
  matching: {
    icon: Search,
    label: "智能匹配",
    description: "正在匹配最佳模板...",
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
  },
  sending: {
    icon: Send,
    label: "发送请求",
    description: "正在发送到 AI 模型...",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  thinking: {
    icon: Brain,
    label: "AI 思考中",
    description: "AI 正在分析需求...",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  generating: {
    icon: Palette,
    label: "生成图表",
    description: "正在生成流程图...",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
};

/**
 * 进度步骤顺序
 */
const PHASE_ORDER = ["preparing", "matching", "sending", "thinking", "generating"];

/**
 * 趣味提示语库 - 根据等待时长显示不同的鼓励语
 */
const ENCOURAGEMENT_TIPS = [
  { delay: 3000, text: "AI 正在认真思考中..." },
  { delay: 8000, text: "复杂的图表需要更多思考时间 🤔" },
  { delay: 15000, text: "正在精心绘制每一个细节..." },
  { delay: 25000, text: "快好了，请再等等 ⏳" },
  { delay: 40000, text: "AI 正在进行最后的润色..." },
  { delay: 60000, text: "这个图表比较复杂，感谢耐心等待 🙏" },
];

/**
 * 单个进度步骤组件
 * 
 * @param {Object} props
 * @param {string} props.phase - 当前阶段
 * @param {boolean} props.isActive - 是否为当前活动阶段
 * @param {boolean} props.isCompleted - 是否已完成
 * @param {boolean} props.isCompact - 是否紧凑模式
 */
function ProgressStep({ phase, isActive, isCompleted, isCompact }) {
  const config = PHASE_CONFIG[phase];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 transition-all duration-300",
        isCompact ? "gap-1.5" : "gap-2"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-300",
          isCompact ? "h-5 w-5" : "h-6 w-6",
          isCompleted 
            ? "bg-emerald-100 text-emerald-600" 
            : isActive 
              ? cn(config.bgColor, config.color)
              : "bg-slate-100 text-slate-400"
        )}
      >
        {isCompleted ? (
          <CheckCircle2 className={cn(isCompact ? "h-3 w-3" : "h-3.5 w-3.5")} />
        ) : isActive ? (
          <Icon className={cn(isCompact ? "h-3 w-3" : "h-3.5 w-3.5", "animate-pulse")} />
        ) : (
          <Icon className={cn(isCompact ? "h-3 w-3" : "h-3.5 w-3.5")} />
        )}
      </div>
      <span
        className={cn(
          "text-xs font-medium transition-colors duration-300",
          isCompleted 
            ? "text-emerald-600" 
            : isActive 
              ? config.color
              : "text-slate-400"
        )}
      >
        {config.label}
      </span>
    </div>
  );
}

/**
 * 生成进度指示器组件
 * 
 * @param {Object} props
 * @param {GenerationPhase} props.phase - 当前进度阶段
 * @param {boolean} [props.isVisible=true] - 是否可见
 * @param {string} [props.className] - 自定义类名
 * @param {"full" | "compact" | "minimal"} [props.variant="full"] - 显示变体
 */
export function GenerationProgressIndicator({ 
  phase = "idle",
  isVisible = true,
  className,
  variant = "full"
}) {
  // 追踪开始时间，用于显示鼓励语
  const [startTime] = useState(() => Date.now());
  const [currentTip, setCurrentTip] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // 计算当前阶段索引
  const currentPhaseIndex = useMemo(
    () => PHASE_ORDER.indexOf(phase),
    [phase]
  );

  // 更新计时器和鼓励语
  useEffect(() => {
    if (phase === "idle" || !isVisible) {
      setCurrentTip("");
      setElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedSeconds(Math.floor(elapsed / 1000));
      
      // 根据等待时长选择合适的鼓励语
      const applicableTip = ENCOURAGEMENT_TIPS
        .filter(tip => elapsed >= tip.delay)
        .pop();
      
      if (applicableTip) {
        setCurrentTip(applicableTip.text);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isVisible, startTime]);

  // 不显示时返回 null
  if (!isVisible || phase === "idle") {
    return null;
  }

  const config = PHASE_CONFIG[phase];
  if (!config) return null;

  const Icon = config.icon;

  // 最简模式：只显示一个加载指示器和当前状态
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
          config.bgColor,
          config.color,
          config.borderColor,
          "border",
          className
        )}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>{config.description}</span>
      </div>
    );
  }

  // 紧凑模式：显示步骤进度条
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-2 shadow-sm border border-slate-200/60",
          className
        )}
      >
        {PHASE_ORDER.slice(0, 4).map((p, index) => (
          <React.Fragment key={p}>
            <ProgressStep
              phase={p}
              isActive={p === phase}
              isCompleted={index < currentPhaseIndex}
              isCompact
            />
            {index < 3 && (
              <div
                className={cn(
                  "h-0.5 w-3 rounded-full transition-colors duration-300",
                  index < currentPhaseIndex ? "bg-emerald-400" : "bg-slate-200"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // 完整模式：显示详细信息
  return (
    <div
      className={cn(
        "w-full rounded-xl bg-white/95 border shadow-sm overflow-hidden transition-all duration-300",
        config.borderColor,
        className
      )}
    >
      {/* 进度条 */}
      <div className="h-1 bg-slate-100">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out",
            phase === "generating" ? "bg-emerald-500" : "bg-blue-500"
          )}
          style={{
            width: `${((currentPhaseIndex + 1) / PHASE_ORDER.length) * 100}%`,
          }}
        />
      </div>

      <div className="px-4 py-3">
        {/* 当前状态 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                config.bgColor
              )}
            >
              <Icon className={cn("h-5 w-5", config.color, "animate-pulse")} />
            </div>
            <div>
              <div className={cn("text-sm font-semibold", config.color)}>
                {config.label}
              </div>
              <div className="text-xs text-slate-500">
                {config.description}
              </div>
            </div>
          </div>
          
          {/* 计时器 */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>{elapsedSeconds}s</span>
          </div>
        </div>

        {/* 步骤指示器 */}
        <div className="mt-3 flex items-center justify-between">
          {PHASE_ORDER.map((p, index) => (
            <React.Fragment key={p}>
              <ProgressStep
                phase={p}
                isActive={p === phase}
                isCompleted={index < currentPhaseIndex}
                isCompact={false}
              />
              {index < PHASE_ORDER.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300",
                    index < currentPhaseIndex ? "bg-emerald-400" : "bg-slate-200"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* 鼓励语 */}
        {currentTip && (
          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 text-center animate-fade-in">
            {currentTip}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 浮动进度提示组件 - 用于在消息列表底部显示
 * 
 * @param {Object} props
 * @param {GenerationPhase} props.phase - 当前进度阶段
 * @param {boolean} [props.isVisible=true] - 是否可见
 */
export function FloatingProgressIndicator({ phase = "idle", isVisible = true }) {
  if (!isVisible || phase === "idle") {
    return null;
  }

  const config = PHASE_CONFIG[phase];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="flex justify-start mb-5 animate-fade-in">
      <div
        className={cn(
          "inline-flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm border transition-all duration-300",
          config.bgColor,
          config.borderColor
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              "bg-white/60"
            )}
          >
            <Icon className={cn("h-4 w-4", config.color, "animate-pulse")} />
          </div>
          <div>
            <div className={cn("text-sm font-medium", config.color)}>
              {config.label}
            </div>
            <div className="text-xs text-slate-500">
              {config.description}
            </div>
          </div>
        </div>
        
        {/* 加载动画 */}
        <div className="flex space-x-1 ml-2">
          <div 
            className={cn("h-2 w-2 rounded-full animate-bounce", config.color.replace("text-", "bg-"))}
            style={{ animationDelay: "0ms" }} 
          />
          <div 
            className={cn("h-2 w-2 rounded-full animate-bounce", config.color.replace("text-", "bg-"))}
            style={{ animationDelay: "150ms" }} 
          />
          <div 
            className={cn("h-2 w-2 rounded-full animate-bounce", config.color.replace("text-", "bg-"))}
            style={{ animationDelay: "300ms" }} 
          />
        </div>
      </div>
    </div>
  );
}

export default GenerationProgressIndicator;
