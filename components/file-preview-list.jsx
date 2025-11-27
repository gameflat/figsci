"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
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
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewMap, setPreviewMap] = useState({});

    useEffect(() => {
        const nextMap = {};
        const revokeQueue = [];
        files.forEach((file) => {
            if (file.type.startsWith("image/")) {
                const key = `${file.name}-${file.size}-${file.lastModified}`;
                const objectUrl = URL.createObjectURL(file);
                nextMap[key] = objectUrl;
                revokeQueue.push(objectUrl);
            }
        });
        setPreviewMap(nextMap);
        return () => {
            revokeQueue.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [files]);

    if (files.length === 0) {
        return null;
    }

    const previewModal = selectedImage ? (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedImage(null)}
        >
            <button
                className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 transition-colors hover:bg-gray-200"
                onClick={() => setSelectedImage(null)}
                aria-label="关闭"
            >
                <X className="h-6 w-6" />
            </button>
            <div className="relative h-auto w-auto max-h-[90vh] max-w-[90vw]">
                <Image
                    src={selectedImage}
                    alt="预览"
                    width={1200}
                    height={900}
                    className="h-auto w-auto max-h-[90vh] max-w-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    ) : null;

    if (variant === "chip") {
        return (
            <>
                <div className="flex flex-wrap gap-1.5">
                    {files.map((file, index) => {
                        const key = `${file.name}-${file.size}-${file.lastModified}`;
                        const imageUrl =
                            file.type.startsWith("image/") && previewMap[key]
                                ? previewMap[key]
                                : null;
                        const extension = file.name.includes(".")
                            ? file.name.split(".").pop()
                            : "";
                        return (
                            <div
                                key={file.name + index}
                                className={cn(
                                    "group inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-xs text-slate-600 shadow-sm transition",
                                    "hover:border-slate-300 hover:shadow"
                                )}
                            >
                                {imageUrl ? (
                                    <button
                                        type="button"
                                        className="h-6 w-6 overflow-hidden rounded-full border border-slate-200 transition hover:border-slate-300"
                                        onClick={() => setSelectedImage(imageUrl)}
                                        aria-label={`预览 ${file.name}`}
                                    >
                                        <Image
                                            src={imageUrl}
                                            alt={file.name}
                                            width={24}
                                            height={24}
                                            className="h-full w-full object-cover"
                                            unoptimized
                                        />
                                    </button>
                                ) : (
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold uppercase text-white">
                                        {extension?.slice(0, 3)}
                                    </span>
                                )}
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
                {previewModal}
            </>
        );
    }

    return (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/40 p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span>参考图片</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {files.map((file, index) => {
                    const key = `${file.name}-${file.size}-${file.lastModified}`;
                    const imageUrl =
                        file.type.startsWith("image/") && previewMap[key]
                            ? previewMap[key]
                            : null;
                    return (
                        <div key={file.name + index} className="group relative">
                            <div
                                className="h-20 w-20 cursor-pointer overflow-hidden rounded-md border bg-muted"
                                onClick={() => imageUrl && setSelectedImage(imageUrl)}
                            >
                                {imageUrl ? (
                                    <Image
                                        src={imageUrl}
                                        alt={file.name}
                                        width={80}
                                        height={80}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center p-1 text-center text-[11px] text-slate-600">
                                        {file.name}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => onRemoveFile(file)}
                                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 opacity-0 transition-opacity group-hover:opacity-100"
                                aria-label="移除文件"
                            >
                                <X className="h-3 w-3 text-white" />
                            </button>
                        </div>
                    );
                })}
            </div>
            {previewModal}
        </div>
    );
}

