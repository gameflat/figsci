"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/**
 * 导出格式类型
 * @typedef {"drawio" | "png" | "svg"} ExportFormat
 */

/**
 * 格式选项配置
 */
const FORMAT_OPTIONS = [
    { value: "drawio", label: "Draw.io XML", extension: ".drawio" },
    { value: "png", label: "PNG 图片", extension: ".png" },
    { value: "svg", label: "SVG 图片", extension: ".svg" },
];

/**
 * SaveDialog 组件属性
 * @typedef {Object} SaveDialogProps
 * @property {boolean} open - 对话框显示状态
 * @property {(open: boolean) => void} onOpenChange - 状态变更回调
 * @property {(filename: string, format: ExportFormat) => void} onSave - 保存回调
 * @property {string} defaultFilename - 默认文件名
 */

/**
 * 保存对话框组件
 * 允许用户选择导出格式和文件名，然后保存图表到本地文件
 * 
 * @param {SaveDialogProps} props
 */
export function SaveDialog({
    open,
    onOpenChange,
    onSave,
    defaultFilename,
}) {
    const [filename, setFilename] = useState(defaultFilename);
    const [format, setFormat] = useState("drawio");

    // 对话框打开时重置文件名
    useEffect(() => {
        if (open) {
            setFilename(defaultFilename);
        }
    }, [open, defaultFilename]);

    /**
     * 处理保存操作
     */
    const handleSave = () => {
        const finalFilename = filename.trim() || defaultFilename;
        onSave(finalFilename, format);
        onOpenChange(false);
    };

    /**
     * 处理键盘事件（Enter 键保存）
     * @param {React.KeyboardEvent} e
     */
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
    };

    const currentFormat = FORMAT_OPTIONS.find((f) => f.value === format);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>保存图表</DialogTitle>
                    <DialogDescription>
                        选择格式和文件名以保存您的图表。
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {/* 格式选择 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">格式</label>
                        <Select
                            value={format}
                            onValueChange={(v) => setFormat(v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FORMAT_OPTIONS.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* 文件名输入 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">文件名</label>
                        <div className="flex items-stretch">
                            <Input
                                value={filename}
                                onChange={(e) => setFilename(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="输入文件名"
                                autoFocus
                                onFocus={(e) => e.target.select()}
                                className="rounded-r-none border-r-0 focus-visible:z-10"
                            />
                            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-muted text-sm text-muted-foreground font-mono">
                                {currentFormat?.extension || ".drawio"}
                            </span>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        取消
                    </Button>
                    <Button onClick={handleSave}>保存</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

