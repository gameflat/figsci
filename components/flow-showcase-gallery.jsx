"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} FlowShowcaseGalleryProps
 * @property {import("@/features/chat-panel/constants").FlowShowcasePreset[]} presets
 * @property {boolean} [disabled]
 * @property {(preset: import("@/features/chat-panel/constants").FlowShowcasePreset) => void} onSelect
 */

/**
 * @param {FlowShowcaseGalleryProps} props
 */
export function FlowShowcaseGallery({
    presets,
    disabled = false,
    onSelect,
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Sparkles className="h-4 w-4 text-amber-500" />
                流程图样板间
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
                {presets.map((preset) => (
                    <button
                        key={preset.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(preset)}
                        className={cn(
                            "group flex h-full flex-col rounded-2xl border border-slate-200 bg-white/80 p-3 text-left shadow-sm transition hover:border-slate-900 hover:shadow-md",
                            disabled && "cursor-not-allowed opacity-60"
                        )}
                    >
                        <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                            <div
                                className="aspect-[16/9] w-full"
                                style={{
                                    backgroundImage: `linear-gradient(135deg, ${preset.accent.from}, ${preset.accent.to})`,
                                }}
                            >
                                <div className="absolute inset-0 flex flex-col justify-between p-3 text-white">
                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-white/80">
                                        {preset.previewLabel}
                                    </div>
                                    <p className="text-sm font-semibold">
                                        {preset.caption}
                                    </p>
                                </div>
                                <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/20 blur-xl" />
                            </div>
                        </div>
                        <div className="mt-3 flex flex-col gap-1">
                            <p className="text-sm font-semibold text-slate-900">
                                {preset.title}
                            </p>
                            <p className="text-xs text-slate-600">
                                {preset.description}
                            </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {preset.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-600 transition group-hover:border-slate-900 group-hover:text-slate-900">
                            一键套用
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

