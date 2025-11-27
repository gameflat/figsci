"use client";

import { ArrowRight, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

/**
 * @typedef {Object} QuickActionDefinition
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} prompt
 * @property {string} badge
 * @property {ReactNode} [icon]
 * @property {Object} [attachment]
 * @property {string} attachment.path
 * @property {string} attachment.fileName
 * @property {string} attachment.mime
 */

/**
 * @typedef {Object} QuickActionBarProps
 * @property {QuickActionDefinition[]} actions
 * @property {boolean} [disabled]
 * @property {(action: QuickActionDefinition) => void | Promise<void>} onSelect
 * @property {"card" | "plain"} [variant]
 * @property {string} [title]
 * @property {string} [subtitle]
 */

/**
 * @param {QuickActionBarProps} props
 */
export function QuickActionBar({
    actions,
    disabled,
    onSelect,
    variant = "card",
    title = "快速示例",
    subtitle = "FlowPilot 专用",
}) {
    const containerClass =
        variant === "card"
            ? "rounded-2xl border bg-muted/20 p-3"
            : "rounded-2xl border border-dashed border-slate-200 bg-transparent p-0";

    const gridGap = variant === "card" ? "gap-2" : "gap-3";

    return (
        <div className={containerClass}>
            {title ? (
                <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                    <span>{title}</span>
                    <div className="flex items-center gap-1 text-[11px]">
                        <Workflow className="h-3.5 w-3.5" />
                        {subtitle}
                    </div>
                </div>
            ) : null}
            <div className={cn("grid sm:grid-cols-2", gridGap)}>
                {actions.map((action) => (
                    <button
                        key={action.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(action)}
                        className={cn(
                            "group flex h-full flex-col rounded-xl border bg-white/80 p-3 text-left shadow-sm transition hover:border-primary hover:bg-white",
                            disabled && "cursor-not-allowed opacity-60"
                        )}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {action.title}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {action.description}
                                </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:text-primary" />
                        </div>
                        <span className="mt-3 inline-flex w-fit rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600">
                            {action.badge}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

