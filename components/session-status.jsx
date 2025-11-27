"use client";

import { Activity, Layers, Paperclip, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} SessionStatusProps
 * @property {"submitted" | "streaming" | "ready" | "error"} status
 * @property {string} providerLabel
 * @property {number} diagramVersions
 * @property {number} attachmentCount
 * @property {number} exchanges
 * @property {"panel" | "inline"} [variant]
 * @property {string} [className]
 */

const STATUS_COPY = {
    streaming: {
        label: "生成中",
        tone: "bg-amber-100 text-amber-800 border-amber-200",
    },
    submitted: {
        label: "排队中",
        tone: "bg-blue-100 text-blue-800 border-blue-200",
    },
    ready: {
        label: "空闲",
        tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    error: {
        label: "需要关注",
        tone: "bg-rose-100 text-rose-900 border-rose-200",
    },
};

const META_ICONS = {
    versions: Layers,
    attachments: Paperclip,
    exchanges: Activity,
};

/**
 * @param {SessionStatusProps} props
 */
export function SessionStatus({
    status,
    providerLabel,
    diagramVersions,
    attachmentCount,
    exchanges,
    variant = "panel",
    className,
}) {
    const statusCopy = STATUS_COPY[status] ?? STATUS_COPY.ready;
    const meta = [
        {
            id: "versions",
            label: "图表版本",
            value: diagramVersions > 0 ? diagramVersions : "—",
            icon: META_ICONS.versions,
        },
        {
            id: "attachments",
            label: "附件",
            value: attachmentCount > 0 ? attachmentCount : "无",
            icon: META_ICONS.attachments,
        },
        {
            id: "exchanges",
            label: "对话轮次",
            value: exchanges,
            icon: META_ICONS.exchanges,
        },
    ];
    const inlineMeta = meta.filter(({ id }) => {
        if (id === "attachments") {
            return attachmentCount > 0;
        }
        if (id === "versions") {
            return diagramVersions > 0;
        }
        return true;
    });

    if (variant === "inline") {
        return (
            <div
                className={cn(
                    "flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-tight text-slate-500",
                    className
                )}
            >
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>{statusCopy.label}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-sm font-semibold text-slate-900">
                        {providerLabel}
                    </span>
                </div>
                {inlineMeta.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500">
                        {inlineMeta.map(({ id, label, value, icon: Icon }) => (
                            <span
                                key={id}
                                className="inline-flex items-center gap-1 whitespace-nowrap"
                            >
                                <Icon className="h-3 w-3 text-slate-400" />
                                <span className="font-medium text-slate-700">{value}</span>
                                <span className="hidden text-[10px] uppercase tracking-wide text-slate-400 md:inline">
                                    {label}
                                </span>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "rounded-2xl border bg-white/80 px-4 py-3 text-sm shadow-sm",
                className
            )}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        会话状态
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span
                            className={cn(
                                "rounded-full border px-3 py-1 text-xs font-medium",
                                statusCopy.tone
                            )}
                        >
                            {statusCopy.label}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                            {providerLabel}
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {meta.map(({ id, label, value, icon: Icon }) => (
                        <div key={id} className="flex items-center gap-2">
                            <div className="rounded-full bg-gray-100 p-1.5">
                                <Icon className="h-3.5 w-3.5 text-gray-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] uppercase tracking-wide">
                                    {label}
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                    {value}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

