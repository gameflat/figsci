"use client";
import { useCallback, useMemo, useState } from "react";
import { usePptStudio } from "@/contexts/ppt-studio-context";
import { requestSlideRender } from "../utils/api-client";
function useSlideGeneration({
  modelRuntime
}) {
  const {
    blueprint,
    slideJobs,
    updateSlideJob,
    styleLocks,
    setStep
  } = usePptStudio();
  const [isRunning, setIsRunning] = useState(false);
  const [lastError, setLastError] = useState(null);
  const slides = blueprint?.slides ?? [];
  const pendingSlideIds = useMemo(
    () => slides.filter((slide) => {
      const job = slideJobs[slide.id];
      return !job || job.status !== "ready";
    }).map((slide) => slide.id),
    [slides, slideJobs]
  );
  const runGeneration = useCallback(
    async (targets, renderMode = "drawio") => {
      if (!blueprint) {
        throw new Error("\u5C1A\u672A\u751F\u6210 PPT \u9AA8\u67B6\u3002");
      }
      if (!modelRuntime) {
        throw new Error("\u8BF7\u5148\u914D\u7F6E\u53EF\u7528\u7684\u6A21\u578B\u63A5\u53E3\u3002");
      }
      if (targets.length === 0) {
        return;
      }
      setIsRunning(true);
      setLastError(null);
      setStep("render");
      targets.forEach(
        (slide) => updateSlideJob(slide.id, {
          status: "queued",
          error: void 0,
          result: void 0
        })
      );
      const queue = [...targets];
      const concurrency = Math.min(3, queue.length);
      const getContextForSlide = (slideId) => {
        const index = slides.findIndex((slide) => slide.id === slideId);
        const previous = index > 0 ? slides[index - 1] : null;
        const next = index < slides.length - 1 ? slides[index + 1] : null;
        return {
          storyArc: blueprint.storyArc,
          themeGuidelines: blueprint.themeGuidelines,
          previousSlide: previous ? {
            title: previous.title,
            narrative: previous.narrative,
            bullets: previous.bullets
          } : null,
          nextSlide: next ? {
            title: next.title,
            narrative: next.narrative
          } : null
        };
      };
      const runWorker = async () => {
        while (queue.length > 0) {
          const current = queue.shift();
          if (!current) {
            break;
          }
          updateSlideJob(current.id, {
            status: "generating",
            startedAt: Date.now(),
            error: void 0
          });
          try {
            const context = getContextForSlide(current.id);
            const result = await requestSlideRender({
              slide: current,
              blueprintContext: context,
              styleLocks,
              modelRuntime,
              renderMode
            });
            updateSlideJob(current.id, {
              status: "ready",
              finishedAt: Date.now(),
              error: void 0,
              result
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002";
            updateSlideJob(current.id, {
              status: "failed",
              finishedAt: Date.now(),
              error: message
            });
            setLastError(message);
          }
        }
      };
      const workers = Array.from({ length: concurrency }).map(
        () => runWorker()
      );
      await Promise.all(workers);
      setIsRunning(false);
    },
    [blueprint, modelRuntime, slides, styleLocks, updateSlideJob, setStep]
  );
  const generateSlides = useCallback(
    async (slideIds, renderMode = "drawio") => {
      if (!blueprint) {
        throw new Error("\u5C1A\u672A\u751F\u6210 PPT \u9AA8\u67B6\u3002");
      }
      const targets = slideIds?.length ? slides.filter((slide) => slideIds.includes(slide.id)) : slides;
      await runGeneration(targets, renderMode);
    },
    [blueprint, slides, runGeneration]
  );
  const generatePendingSlides = useCallback(async (renderMode = "drawio") => {
    if (!blueprint) return;
    const targets = slides.filter(
      (slide) => pendingSlideIds.includes(slide.id)
    );
    await runGeneration(targets, renderMode);
  }, [blueprint, slides, pendingSlideIds, runGeneration]);
  return {
    generateSlides,
    generatePendingSlides,
    isRunning,
    lastError,
    runGeneration
  };
}
export {
  useSlideGeneration
};
