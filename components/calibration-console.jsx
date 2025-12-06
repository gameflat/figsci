"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * @typedef {Object} CalibrationConsoleProps
 * @property {boolean} [disabled]
 * @property {() => Promise<void>} onAiCalibrate
 */

/**
 * @param {CalibrationConsoleProps} props
 */
export function CalibrationConsole({
    disabled = false,
    onAiCalibrate,
}) {
    const [isAiRunning, setIsAiRunning] = useState(false);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState(null);

    const helperText =
        "使用 AI 校准来优化流程图布局。AI 会分析节点关系并自动调整位置，提供专业的排版建议。";

    const runAiCalibration = async () => {
        if (isAiRunning || disabled) return;
        setError(null);
        setStatusMessage(null);
        setIsAiRunning(true);
        try {
            await onAiCalibrate();
            setStatusMessage("已向大模型发出校准指令，稍后在对话区查看新布局。");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "AI 校准失败，请稍后再试。"
            );
        } finally {
            setIsAiRunning(false);
        }
    };

    return (
        <div className="rounded-2xl border bg-white/90 p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Figsci 校准舱
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        {helperText}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        size="sm"
                        onClick={runAiCalibration}
                        disabled={disabled || isAiRunning}
                        className="inline-flex items-center gap-2"
                    >
                        {isAiRunning ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Wand2 className="h-4 w-4" />
                        )}
                        {isAiRunning ? "推送中…" : "AI 校准"}
                    </Button>
                </div>
            </div>

            {statusMessage ? (
                <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-2 text-xs text-sky-700">
                    {statusMessage}
                </div>
            ) : null}

            {error ? (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600">
                    {error}
                </div>
            ) : null}
        </div>
    );
}

