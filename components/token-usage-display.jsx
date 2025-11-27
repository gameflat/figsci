"use client";

import { Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} TokenUsageDisplayProps
 * @property {Object} [usage]
 * @property {number} [usage.inputTokens]
 * @property {number} [usage.outputTokens]
 * @property {number} [usage.totalTokens]
 * @property {number} [durationMs]
 * @property {string} [className]
 * @property {boolean} [compact]
 */

/**
 * TokenUsageDisplay - 紧凑美观的 Token 使用信息展示组件
 * 
 * 用于展示 AI 模型的 token 使用量和生成耗时
 * 
 * @param {TokenUsageDisplayProps} props
 */
export function TokenUsageDisplay({
    usage,
    durationMs,
    className,
    compact = false,
}) {
    // 如果没有任何数据，不显示
    if (!usage && durationMs === undefined) {
        return null;
    }

    // 格式化数字（千分位）
    const formatNumber = (num) => {
        if (num === undefined || num === null) return "-";
        return new Intl.NumberFormat("zh-CN").format(num);
    };

    // 格式化时间
    const formatDuration = (ms) => {
        if (ms === undefined || ms === null) return "-";
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    if (compact) {
        // 紧凑模式：单行展示
        return (
            <div
                className={cn(
                    "inline-flex items-center gap-3 rounded-md border border-slate-200/60 bg-slate-50/50 px-2.5 py-1 text-[10px] text-slate-600",
                    className
                )}
            >
                {usage && (
                    <div className="flex items-center gap-1.5">
                        <Zap className="h-3 w-3 text-amber-500" strokeWidth={2.5} />
                        <span className="font-medium text-slate-700">
                            {formatNumber(usage.totalTokens)}
                        </span>
                        <span className="text-slate-400">tokens</span>
                    </div>
                )}
                {durationMs !== undefined && (
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-blue-500" strokeWidth={2.5} />
                        <span className="font-medium text-slate-700">
                            {formatDuration(durationMs)}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    // 标准模式：详细展示
    return (
        <div
            className={cn(
                "grid grid-cols-2 gap-2 rounded-lg border border-slate-200/60 bg-gradient-to-br from-slate-50/80 to-white p-2.5",
                className
            )}
        >
            {/* Token 使用 */}
            {usage && (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        <Zap className="h-2.5 w-2.5" strokeWidth={3} />
                        <span>Token</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-slate-800">
                            {formatNumber(usage.totalTokens)}
                        </span>
                        <span className="text-[10px] text-slate-500">总计</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-slate-500">
                        <span>
                            输入 <span className="font-semibold text-slate-600">{formatNumber(usage.inputTokens)}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>
                            输出 <span className="font-semibold text-slate-600">{formatNumber(usage.outputTokens)}</span>
                        </span>
                    </div>
                </div>
            )}

            {/* 耗时 */}
            {durationMs !== undefined && (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        <Clock className="h-2.5 w-2.5" strokeWidth={3} />
                        <span>耗时</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-slate-800">
                            {formatDuration(durationMs)}
                        </span>
                    </div>
                    <div className="text-[9px] text-slate-500">
                        {durationMs < 1000 && "极速响应"}
                        {durationMs >= 1000 && durationMs < 5000 && "快速生成"}
                        {durationMs >= 5000 && durationMs < 10000 && "正常速度"}
                        {durationMs >= 10000 && "复杂任务"}
                    </div>
                </div>
            )}
        </div>
    );
}

