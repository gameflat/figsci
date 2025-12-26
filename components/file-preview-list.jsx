"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} FilePreviewListProps
 * @property {File[]} files
 * @property {(fileToRemove: File) => void} onRemoveFile
 * @property {"grid" | "chip"} [variant]
 */

/**
 * @param {FilePreviewListProps} props
 */
export function FilePreviewList({
    files,
    onRemoveFile,
    variant = "grid",
}) {
    if (files.length === 0) {
        return null;
    }

    if (variant === "chip") {
        return (
            <div className="flex flex-wrap gap-1.5">
                {files.map((file, index) => {
                    const extension = file.name.includes(".")
                        ? file.name.split(".").pop()
                        : "";
                    return (
                        <div
                            key={file.name + index}
                            className={cn(
                                "group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-xs text-slate-600 shadow-sm transition",
                                "hover:border-slate-300 hover:shadow"
                            )}
                        >
                            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold uppercase text-white">
                                {extension?.slice(0, 3) || "FILE"}
                            </span>
                            <span className="max-w-[140px] truncate">{file.name}</span>
                            <button
                                type="button"
                                onClick={() => onRemoveFile(file)}
                                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                aria-label={`移除 ${file.name}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/40 p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span>已上传文件</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {files.map((file, index) => {
                    const extension = file.name.includes(".")
                        ? file.name.split(".").pop()
                        : "";
                    return (
                        <div
                            key={file.name + index}
                            className="group relative inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm transition hover:border-slate-300 hover:shadow"
                        >
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[10px] font-semibold uppercase text-white">
                                {extension?.slice(0, 3) || "FILE"}
                            </span>
                            <span className="max-w-[200px] truncate">{file.name}</span>
                            <button
                                type="button"
                                onClick={() => onRemoveFile(file)}
                                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                aria-label={`移除 ${file.name}`}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

