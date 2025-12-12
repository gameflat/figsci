"use client";

import { Sparkles, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * @typedef {"drawio" | "svg"} RenderMode
 */

/**
 * @typedef {Object} RenderModeToggleProps
 * @property {RenderMode} value
 * @property {(mode: RenderMode) => void} [onChange]
 * @property {boolean} [disabled]
 * @property {string} [className]
 * @property {boolean} [iconOnly]
 */

const MODES = [
    {
        id: "drawio",
        label: "draw.io",
        hint: "生成可编辑的 draw.io 文件，便于继续细调",
        Icon: Palette,
    },
    {
        id: "svg",
        label: "SVG",
        hint: "生成干净的矢量图，方便粘贴到文档或幻灯片",
        Icon: Sparkles,
    },
];

/**
 * @param {RenderModeToggleProps} props
 */
export function RenderModeToggle({
    value,
    onChange,
    disabled = false,
    className,
    iconOnly = false,
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/90 text-[11px] font-semibold shadow-sm p-1",
                disabled && "cursor-not-allowed opacity-70",
                className
            )}
        >
            {MODES.map((mode, index) => {
                const isActive = value === mode.id;
                const Icon = mode.Icon;
                const button = (
                    <button
                        key={mode.id}
                        type="button"
                        aria-label={mode.label}
                        aria-pressed={isActive}
                        onClick={() => {
                            if (disabled) return;
                            onChange?.(mode.id);
                        }}
                        disabled={disabled}
                        className={cn(
                            "flex items-center py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 flex-shrink-0 rounded-full",
                            iconOnly
                                ? "px-3 min-w-[36px] justify-center"
                                : "gap-1 px-2.5 whitespace-nowrap",
                            isActive
                                ? "bg-slate-900 text-white shadow-sm"
                                : "text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        {!iconOnly && <span className="whitespace-nowrap">{mode.label}</span>}
                    </button>
                );

                return (
                    <Tooltip key={mode.id}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="top">{mode.hint}</TooltipContent>
                    </Tooltip>
                );
            })}
        </div>
    );
}

