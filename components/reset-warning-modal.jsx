"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

/**
 * @typedef {Object} ResetWarningModalProps
 * @property {boolean} open
 * @property {(open: boolean) => void} onOpenChange
 * @property {() => void} onClear
 */

/**
 * @param {ResetWarningModalProps} props
 */
export function ResetWarningModal({
    open,
    onOpenChange,
    onClear,
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>确认清空全部内容？</DialogTitle>
                    <DialogDescription>
                        这将清空当前对话并重置图表，该操作无法撤销。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        取消
                    </Button>
                    <Button variant="destructive" onClick={onClear}>
                        清空全部
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

