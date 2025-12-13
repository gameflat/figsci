// -*- coding: utf-8 -*-
/**
 * 生成进度指示器组件
 * 
 * 在用户提交请求后显示详细的进度步骤，提升等待体验
 */
"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
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
 * 单个进度步骤行组件 - 用于浮动进度指示器
 * 
 * @param {Object} props
 * @param {string} props.phase - 阶段名称
 * @param {"completed" | "active" | "pending"} props.status - 状态
 * @param {number} [props.index] - 步骤序号
 */
function FloatingProgressStep({ phase, status, index }) {
  const config = PHASE_CONFIG[phase];
  if (!config) return null;

  const Icon = config.icon;
  const isCompleted = status === "completed";
  const isActive = status === "active";

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300",
        isCompleted && "bg-emerald-50/80",
        isActive && cn(config.bgColor, "animate-pulse-subtle"),
        !isCompleted && !isActive && "bg-slate-50/50"
      )}
    >
      {/* 状态图标 */}
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300",
          isCompleted && "bg-emerald-100 text-emerald-600",
          isActive && cn("bg-white/70", config.color),
          !isCompleted && !isActive && "bg-slate-100 text-slate-400"
        )}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : isActive ? (
          <Icon className="h-4 w-4 animate-pulse" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>

      {/* 步骤信息 */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-sm font-medium transition-colors duration-300",
            isCompleted && "text-emerald-700",
            isActive && config.color,
            !isCompleted && !isActive && "text-slate-400"
          )}
        >
          {config.label}
        </div>
        <div
          className={cn(
            "text-xs transition-colors duration-300 truncate",
            isCompleted && "text-emerald-600/70",
            isActive && "text-slate-500",
            !isCompleted && !isActive && "text-slate-400"
          )}
        >
          {isCompleted ? "已完成" : config.description}
        </div>
      </div>

      {/* 活动状态动画 */}
      {isActive && (
        <div className="flex space-x-1 ml-2">
          <div 
            className={cn("h-1.5 w-1.5 rounded-full animate-bounce", config.color.replace("text-", "bg-"))}
            style={{ animationDelay: "0ms" }} 
          />
          <div 
            className={cn("h-1.5 w-1.5 rounded-full animate-bounce", config.color.replace("text-", "bg-"))}
            style={{ animationDelay: "150ms" }} 
          />
          <div 
            className={cn("h-1.5 w-1.5 rounded-full animate-bounce", config.color.replace("text-", "bg-"))}
            style={{ animationDelay: "300ms" }} 
          />
        </div>
      )}

      {/* 完成状态勾选 */}
      {isCompleted && (
        <div className="text-emerald-500">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * 浮动进度提示组件 - 用于在消息列表底部显示
 * 保留所有已完成的步骤，让用户看到整个进度过程
 * 
 * @param {Object} props
 * @param {GenerationPhase} props.phase - 当前进度阶段
 * @param {boolean} [props.isVisible=true] - 是否可见（正在生成中）
 */
export function FloatingProgressIndicator({ phase = "idle", isVisible = true }) {
  // 追踪已完成的阶段历史
  const [completedPhases, setCompletedPhases] = useState([]);
  // 追踪上一次的阶段，用于检测变化
  const previousPhaseRef = useRef(phase);
  // 追踪开始时间
  const [startTime, setStartTime] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // 追踪是否已完成整个流程（用于在生成结束后保持显示）
  const [isFlowCompleted, setIsFlowCompleted] = useState(false);
  // 追踪最终完成时的阶段（用于在完成后显示最后一个步骤）
  const [finalPhase, setFinalPhase] = useState(null);
  // 追踪是否曾经开始过（用于判断是否需要显示）
  const [hasStarted, setHasStarted] = useState(false);

  // 当阶段变化时，处理状态更新
  // 注意：不要将 completedPhases 加入依赖数组，避免循环更新
  useEffect(() => {
    const prevPhase = previousPhaseRef.current;

    // 从 idle 变为非 idle：开始新的生成流程
    if (prevPhase === "idle" && phase !== "idle") {
      setCompletedPhases([]);
      setElapsedSeconds(0);
      setStartTime(Date.now());
      setIsFlowCompleted(false);
      setFinalPhase(null);
      setHasStarted(true);
    }
    // 从非 idle 变为 idle：生成流程结束
    else if (prevPhase !== "idle" && phase === "idle") {
      // 将最后一个活动阶段添加到已完成列表（使用函数式更新避免依赖 completedPhases）
      setCompletedPhases(prev => {
        if (prevPhase && !prev.includes(prevPhase)) {
          return [...prev, prevPhase];
        }
        return prev;
      });
      setFinalPhase(prevPhase);
      setIsFlowCompleted(true);
    }
    // 阶段变化（都是非 idle）：将上一个阶段标记为已完成
    else if (prevPhase !== phase && prevPhase !== "idle" && phase !== "idle") {
      setCompletedPhases(prev => {
        if (prev.includes(prevPhase)) return prev;
        return [...prev, prevPhase];
      });
    }

    previousPhaseRef.current = phase;
  }, [phase]); // 移除 completedPhases 依赖，避免循环更新

  // 更新计时器（仅在生成进行中时）
  useEffect(() => {
    if (phase === "idle" || !isVisible) {
      return;
    }

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedSeconds(Math.floor(elapsed / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isVisible, startTime]);

  // 判断是否应该显示组件
  // 1. 正在生成中（isVisible && phase !== "idle"）
  // 2. 或者已完成但有历史记录（isFlowCompleted && hasStarted）
  // 注意：完成后也要显示，所以 isFlowCompleted 条件不依赖 isVisible
  const shouldShow = (isVisible && phase !== "idle") || (isFlowCompleted && hasStarted);

  if (!shouldShow) {
    return null;
  }

  // 确定当前显示的阶段和配置
  const displayPhase = phase !== "idle" ? phase : finalPhase;
  const currentConfig = displayPhase ? PHASE_CONFIG[displayPhase] : null;
  
  // 如果已完成，即使没有 currentConfig 也应该显示
  if (!currentConfig && !isFlowCompleted) return null;

  // 计算进度
  const currentPhaseIndex = displayPhase ? PHASE_ORDER.indexOf(displayPhase) : PHASE_ORDER.length - 1;
  const progressPercent = isFlowCompleted 
    ? 100 
    : ((currentPhaseIndex + 1) / PHASE_ORDER.length) * 100;

  return (
    <div className="flex justify-start mb-5 animate-fade-in">
      <div
        className={cn(
          "w-full max-w-sm rounded-xl bg-white/95 border shadow-sm overflow-hidden transition-all duration-300",
          isFlowCompleted ? "border-emerald-200" : (currentConfig?.borderColor || "border-slate-200")
        )}
      >
        {/* 头部：标题和计时器/完成状态 */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            {isFlowCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <Sparkles className="h-4 w-4 text-slate-600" />
            )}
            <span className={cn(
              "text-sm font-medium",
              isFlowCompleted ? "text-emerald-700" : "text-slate-700"
            )}>
              {isFlowCompleted ? "生成完成" : "生成进度"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {isFlowCompleted ? (
              <span className="text-emerald-600 font-medium">耗时 {elapsedSeconds}s</span>
            ) : (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{elapsedSeconds}s</span>
              </>
            )}
          </div>
        </div>

        {/* 进度条 */}
        <div className="h-1 bg-slate-100">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out",
              isFlowCompleted ? "bg-emerald-500" : (displayPhase === "generating" ? "bg-emerald-500" : "bg-blue-500")
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 步骤列表 */}
        <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
          {/* 显示已完成的阶段 */}
          {completedPhases.map((completedPhase, index) => (
            <FloatingProgressStep
              key={`completed-${completedPhase}-${index}`}
              phase={completedPhase}
              status="completed"
              index={index + 1}
            />
          ))}

          {/* 如果还在进行中，显示当前活动阶段 */}
          {!isFlowCompleted && displayPhase && (
            <FloatingProgressStep
              key={`active-${displayPhase}`}
              phase={displayPhase}
              status="active"
              index={completedPhases.length + 1}
            />
          )}
        </div>

        {/* 底部：进度概览 */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/30">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {isFlowCompleted 
                ? `已完成 ${completedPhases.length} 个步骤`
                : `步骤 ${completedPhases.length + 1} / ${PHASE_ORDER.length}`
              }
            </span>
            <span className={cn(
              "font-medium",
              isFlowCompleted ? "text-emerald-600" : (currentConfig?.color || "text-slate-600")
            )}>
              {isFlowCompleted ? "全部完成 ✓" : (currentConfig?.description || "")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenerationProgressIndicator;
