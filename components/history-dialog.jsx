"use client";

import Image from "next/image";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDiagram } from "@/contexts/diagram-context";

/**
 * @typedef {Object} HistoryDialogProps
 * @property {boolean} showHistory - 是否显示历史对话框
 * @property {(show: boolean) => void} onToggleHistory - 切换历史对话框显示状态
 */

/**
 * 图表历史对话框组件
 * 显示所有历史版本的缩略图，支持两步确认恢复操作
 * 
 * @param {HistoryDialogProps} props
 * @returns {JSX.Element}
 */
export function HistoryDialog({
    showHistory,
    onToggleHistory,
}) {
    const { loadDiagram: onDisplayChart, diagramHistory } = useDiagram();
    const [selectedIndex, setSelectedIndex] = useState(/** @type {number | null} */(null));

    const handleClose = () => {
        setSelectedIndex(null);
        onToggleHistory(false);
    };

    const handleConfirmRestore = () => {
        if (selectedIndex !== null) {
            // 跳过验证，因为历史快照是可信的
            onDisplayChart(diagramHistory[selectedIndex].xml, true);
            handleClose();
        }
    };

    return (
        <Dialog open={showHistory} onOpenChange={onToggleHistory}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>图表历史</DialogTitle>
                    <DialogDescription>
                        这里保存了每次 AI 修改前的图表版本。
                        <br />
                        点击图表选择版本，然后确认恢复。
                    </DialogDescription>
                </DialogHeader>

                {diagramHistory.length === 0 ? (
                    <div className="text-center p-4 text-gray-500">
                        暂无历史记录。发送消息创建图表历史。
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
                        {diagramHistory.map((item, index) => (
                            <div
                                key={index}
                                className={`border rounded-md p-2 cursor-pointer hover:border-primary transition-colors ${
                                    selectedIndex === index
                                        ? "border-primary ring-2 ring-primary"
                                        : ""
                                }`}
                                onClick={() => setSelectedIndex(index)}
                            >
                                <div className="aspect-video bg-white rounded overflow-hidden flex items-center justify-center">
                                    <Image
                                        src={item.svg}
                                        alt={`图表版本 ${index + 1}`}
                                        width={200}
                                        height={100}
                                        className="object-contain w-full h-full p-1"
                                        unoptimized
                                    />
                                </div>
                                <div className="text-xs text-center mt-1 text-gray-500">
                                    版本 {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <DialogFooter>
                    {selectedIndex !== null ? (
                        <>
                            <div className="flex-1 text-sm text-muted-foreground">
                                恢复到版本 {selectedIndex + 1}？
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setSelectedIndex(null)}
                            >
                                取消
                            </Button>
                            <Button onClick={handleConfirmRestore}>
                                确认恢复
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={handleClose}>
                            关闭
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

