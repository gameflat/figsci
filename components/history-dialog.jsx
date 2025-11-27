"use client";

import Image from "next/image";
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
 * @property {boolean} showHistory
 * @property {(show: boolean) => void} onToggleHistory
 * @property {Array<{ svg: string }>} [items]
 * @property {(index: number) => void} [onRestore]
 */

/**
 * @param {HistoryDialogProps} props
 */
export function HistoryDialog({
    showHistory,
    onToggleHistory,
    items,
    onRestore,
}) {
    const { restoreDiagramAt, diagramHistory } = useDiagram();
    const historyItems = items ?? diagramHistory;
    const handleRestore = onRestore ?? restoreDiagramAt;

    return (
        <Dialog open={showHistory} onOpenChange={onToggleHistory}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>图表历史</DialogTitle>
                    <DialogDescription>
                        这里保留了每次 AI 修改前的图表。
                        <br />
                        点击任意缩略图即可恢复。
                    </DialogDescription>
                </DialogHeader>

                {historyItems.length === 0 ? (
                    <div className="text-center p-4 text-gray-500">
                        暂无历史记录，发送消息后会自动保存版本。
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
                        {historyItems.map((item, index) => (
                            <div
                                key={index}
                                className="border rounded-md p-2 cursor-pointer hover:border-primary transition-colors"
                                onClick={() => {
                                    handleRestore(index);
                                    onToggleHistory(false);
                                }}
                            >
                                <div className="aspect-video bg-white rounded overflow-hidden flex items-center justify-center">
                                    <div className="relative h-full w-full">
                                        <Image
                                            src={item.svg}
                                            alt={`图表版本 ${index + 1}`}
                                            fill
                                            className="object-contain p-1"
                                            sizes="(max-width: 640px) 50vw, 200px"
                                            unoptimized
                                        />
                                    </div>
                                </div>
                                <div className="text-xs text-center mt-1 text-gray-500">
                                    版本 {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onToggleHistory(false)}
                    >
                        关闭
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

