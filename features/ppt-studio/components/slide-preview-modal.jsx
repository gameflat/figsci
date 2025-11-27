"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { buildViewerUrl } from "../utils/viewer";
import { cn } from "@/lib/utils";
function SlidePreviewModal({
  open,
  onOpenChange,
  slides,
  slideJobs,
  initialSlideId
}) {
  const readySlides = useMemo(() => {
    return slides.map((slide) => {
      const job = slideJobs[slide.id];
      const xml = job?.result?.xml;
      const viewerUrl = xml ? buildViewerUrl(xml, slide.title) : null;
      return {
        slide,
        viewerUrl,
        status: job?.status ?? "idle"
      };
    }).filter((entry) => entry.viewerUrl);
  }, [slides, slideJobs]);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasSlides = readySlides.length > 0;
  const currentEntry = readySlides[activeIndex];
  useEffect(() => {
    if (!open || !hasSlides) {
      return;
    }
    if (initialSlideId) {
      const idx = readySlides.findIndex(
        (entry) => entry.slide.id === initialSlideId
      );
      if (idx >= 0) {
        setActiveIndex(idx);
        return;
      }
    }
    setActiveIndex(0);
  }, [open, initialSlideId, readySlides, hasSlides]);
  const goPrev = useCallback(() => {
    if (!hasSlides) return;
    setActiveIndex(
      (prev) => prev === 0 ? readySlides.length - 1 : prev - 1
    );
  }, [hasSlides, readySlides.length]);
  const goNext = useCallback(() => {
    if (!hasSlides) return;
    setActiveIndex(
      (prev) => prev === readySlides.length - 1 ? 0 : prev + 1
    );
  }, [hasSlides, readySlides.length]);
  useEffect(() => {
    if (!open || !hasSlides) {
      return;
    }
    const handleKey = (event) => {
      if (event.key === "ArrowRight") {
        goNext();
      } else if (event.key === "ArrowLeft") {
        goPrev();
      } else if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, hasSlides, goNext, goPrev, onOpenChange]);
  return <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
    className="border-none bg-transparent p-0 text-white data-[state=open]:translate-x-0 data-[state=open]:translate-y-0 data-[state=open]:scale-100"
    style={{
      position: "fixed",
      width: "100vw",
      height: "100vh",
      left: "0",
      top: "0",
      maxWidth: "100vw",
      margin: 0,
      borderRadius: 0
    }}
  >
                <div className="flex h-full w-full flex-col bg-slate-950/95 p-4 text-white sm:p-8 lg:p-12">
                <DialogHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
                    <DialogTitle className="text-lg font-semibold">
                        幻灯片预览
                        {hasSlides && <span className="ml-2 text-sm text-slate-300">
                                第 {activeIndex + 1} / {readySlides.length} 页
                            </span>}
                    </DialogTitle>
                    <Button
    type="button"
    variant="ghost"
    size="icon"
    className="text-slate-200 hover:bg-white/10"
    onClick={() => onOpenChange(false)}
  >
                        <X className="h-5 w-5" />
                    </Button>
                </DialogHeader>
                {!hasSlides ? <div className="flex flex-1 items-center justify-center text-sm text-slate-300">
                        暂无已生成的幻灯片，请先执行生成。
                    </div> : <div className="flex h-full flex-col pt-6">
                        <div className="relative flex-1 rounded-3xl border border-white/10 bg-black/60 p-6">
                            <iframe
    src={currentEntry.viewerUrl ?? void 0}
    title={currentEntry.slide.title}
    className="h-full w-full rounded-2xl border border-black/30 bg-white shadow-2xl"
  />
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6">
                                <Button
    type="button"
    variant="outline"
    size="icon"
    className={cn(
      "pointer-events-auto rounded-full border-white/40 bg-black/40 text-white shadow-lg hover:bg-black/60"
    )}
    onClick={goPrev}
  >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-6">
                                <Button
    type="button"
    variant="outline"
    size="icon"
    className={cn(
      "pointer-events-auto rounded-full border-white/40 bg-black/40 text-white shadow-lg hover:bg-black/60"
    )}
    onClick={goNext}
  >
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="mt-6 flex items-start justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm">
                            <div className="max-w-4xl">
                                <p className="text-lg font-semibold text-white">
                                    {currentEntry.slide.title}
                                </p>
                                <p className="mt-1 text-slate-300">
                                    {currentEntry.slide.narrative}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                                    支持方向键切换
                                </span>
                                <Button
    type="button"
    variant="outline"
    size="sm"
    className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
    onClick={() => onOpenChange(false)}
  >
                                    退出全屏
                                </Button>
                            </div>
                        </div>
                    </div>}
                </div>
            </DialogContent>
        </Dialog>;
}
export {
  SlidePreviewModal
};
