"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { nanoid } from "nanoid";

/**
 * @typedef {import("@/types/ppt").PptBrief} PptBrief
 * @typedef {import("@/types/ppt").PptBlueprint} PptBlueprint
 * @typedef {import("@/types/ppt").PptStudioStep} PptStudioStep
 * @typedef {import("@/types/ppt").SlideBlueprint} SlideBlueprint
 * @typedef {import("@/types/ppt").SlideJob} SlideJob
 * @typedef {import("@/types/ppt").StyleOverrides} StyleOverrides
 *
 * @typedef {Object} PptStudioContextValue
 * @property {PptStudioStep} step
 * @property {(step: PptStudioStep) => void} setStep
 * @property {PptBrief} brief
 * @property {(patch: Partial<PptBrief>) => void} updateBrief
 * @property {PptBlueprint | null} blueprint
 * @property {(blueprint: PptBlueprint | null) => void} setBlueprint
 * @property {(slideId: string, patch: Partial<SlideBlueprint>) => void} updateSlideBlueprint
 * @property {(from: number, to: number) => void} reorderSlides
 * @property {(afterSlideId: string | null) => void} addSlideAfter
 * @property {(slideId: string) => void} removeSlide
 * @property {Record<string, SlideJob>} slideJobs
 * @property {(slideId: string, patch: Partial<SlideJob>) => void} updateSlideJob
 * @property {() => void} resetSlideJobs
 * @property {string | null} focusedSlideId
 * @property {(slideId: string | null) => void} setFocusedSlideId
 * @property {StyleOverrides} styleLocks
 * @property {(patch: Partial<StyleOverrides>) => void} updateStyleLocks
 * @property {number | null} lastSavedAt
 * @property {() => void} clearAll
 */

const STORAGE_KEY = "flowpilot.pptStudio.v1";

/** @type {PptBrief} */
const defaultBrief = {
    topic: "",
    audience: "",
    goal: "inform",
    tone: "balanced",
    slideCount: 8,
    keywords: [],
    narrativeFocus: "",
    referenceAssets: [],
    constraints: {
        palette: [],
        forbidden: [],
        mustInclude: [],
    },
};

/** @type {StyleOverrides} */
const defaultStyleLocks = {
    palette: [],
    typography: "",
    iconography: "",
    layoutTone:
        "全屏深色背景 + 玻璃拟态白色内容卡片 + 均衡留白 + 顶部标题条 + 轻微阴影",
};

/** @type {React.Context<PptStudioContextValue | undefined>} */
const PptStudioContext = createContext(undefined);

/**
 * @param {PptBlueprint} blueprint
 * @returns {PptBlueprint}
 */
const ensureSlideIds = (blueprint) => {
    const existingIds = new Set();
    return {
        ...blueprint,
        slides: blueprint.slides.map((slide) => {
            if (!slide.id || existingIds.has(slide.id)) {
                const id = nanoid(8);
                existingIds.add(id);
                return { ...slide, id };
            }
            existingIds.add(slide.id);
            return slide;
        }),
    };
};

/**
 * @param {{ children: React.ReactNode }} props
 */
export function PptStudioProvider({ children }) {
    const [brief, setBrief] = useState(defaultBrief);
    const [blueprint, setBlueprintState] = useState(null);
    const [step, setStep] = useState("brief");
    const [slideJobs, setSlideJobs] = useState({});
    const [focusedSlideId, setFocusedSlideId] = useState(null);
    const [styleLocks, setStyleLocks] = useState(defaultStyleLocks);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.brief) {
                    setBrief({
                        ...defaultBrief,
                        ...parsed.brief,
                        constraints: {
                            ...defaultBrief.constraints,
                            ...parsed.brief.constraints,
                        },
                    });
                }
                if (parsed.blueprint) {
                    setBlueprintState(ensureSlideIds(parsed.blueprint));
                    setStep(parsed.step ?? "blueprint");
                }
                if (parsed.styleLocks) {
                    setStyleLocks({
                        ...defaultStyleLocks,
                        ...parsed.styleLocks,
                    });
                }
                if (parsed.lastSavedAt) {
                    setLastSavedAt(parsed.lastSavedAt);
                }
            }
        } catch (error) {
            console.error("Failed to hydrate PPT studio state:", error);
        } finally {
            setIsHydrated(true);
        }
    }, []);

    useEffect(() => {
        if (!isHydrated) return;
        try {
            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    brief,
                    blueprint,
                    styleLocks,
                    step,
                    lastSavedAt: Date.now(),
                })
            );
            setLastSavedAt(Date.now());
        } catch (error) {
            console.error("Failed to persist PPT studio state:", error);
        }
    }, [brief, blueprint, styleLocks, step, isHydrated]);

    const updateBrief = useCallback((patch) => {
        setBrief((prev) => ({
            ...prev,
            ...patch,
            constraints: {
                ...prev.constraints,
                ...(patch.constraints ?? {}),
            },
        }));
    }, []);

    const setBlueprint = useCallback((next) => {
        setBlueprintState(next ? ensureSlideIds(next) : null);
        setSlideJobs({});
        if (next) {
            setFocusedSlideId(next.slides[0]?.id ?? null);
        }
    }, []);

    const updateSlideBlueprint = useCallback(
        (slideId, patch) => {
            setBlueprintState((prev) => {
                if (!prev) return prev;
                const slides = prev.slides.map((slide) =>
                    slide.id === slideId
                        ? {
                              ...slide,
                              ...patch,
                              status: "edited",
                          }
                        : slide
                );
                return { ...prev, slides };
            });
        },
        []
    );

    const reorderSlides = useCallback((from, to) => {
        setBlueprintState((prev) => {
            if (!prev) return prev;
            const slides = [...prev.slides];
            const [moved] = slides.splice(from, 1);
            slides.splice(to, 0, moved);
            return { ...prev, slides };
        });
    }, []);

    const addSlideAfter = useCallback((afterSlideId) => {
        setBlueprintState((prev) => {
            if (!prev) return prev;
            /** @type {SlideBlueprint} */
            const newSlide = {
                id: nanoid(8),
                title: "新增幻灯片",
                narrative: "请在此描述这一页要表达的关键信息。",
                bullets: ["关键要点 1", "关键要点 2"],
                visualIdea: "矩阵或示意图",
                status: "edited",
            };
            const slides = [...prev.slides];
            if (!afterSlideId) {
                slides.unshift(newSlide);
            } else {
                const index = slides.findIndex((slide) => slide.id === afterSlideId);
                if (index === -1) {
                    slides.push(newSlide);
                } else {
                    slides.splice(index + 1, 0, newSlide);
                }
            }
            return { ...prev, slides };
        });
    }, []);

    const removeSlide = useCallback((slideId) => {
        setBlueprintState((prev) => {
            if (!prev) return prev;
            const slides = prev.slides.filter((slide) => slide.id !== slideId);
            setSlideJobs((jobs) => {
                const clone = { ...jobs };
                delete clone[slideId];
                return clone;
            });
            return { ...prev, slides };
        });
    }, []);

    const updateSlideJob = useCallback((slideId, patch) => {
        setSlideJobs((prev) => {
            const existing =
                prev[slideId] || {
                    slideId,
                    status: "idle",
                };
            return {
                ...prev,
                [slideId]: {
                    ...existing,
                    ...patch,
                },
            };
        });
    }, []);

    const resetSlideJobs = useCallback(() => {
        setSlideJobs({});
    }, []);

    const updateStyleLocks = useCallback(
        (patch) => {
            setStyleLocks((prev) => ({
                ...prev,
                ...patch,
            }));
        },
        []
    );

    const clearAll = useCallback(() => {
        setBrief(defaultBrief);
        setBlueprintState(null);
        setSlideJobs({});
        setStep("brief");
        setStyleLocks(defaultStyleLocks);
        setFocusedSlideId(null);
        setLastSavedAt(Date.now());
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    const value = useMemo(
        () => ({
            step,
            setStep,
            brief,
            updateBrief,
            blueprint,
            setBlueprint,
            updateSlideBlueprint,
            reorderSlides,
            addSlideAfter,
            removeSlide,
            slideJobs,
            updateSlideJob,
            resetSlideJobs,
            focusedSlideId,
            setFocusedSlideId,
            styleLocks,
            updateStyleLocks,
            lastSavedAt,
            clearAll,
        }),
        [
            step,
            brief,
            blueprint,
            reorderSlides,
            slideJobs,
            focusedSlideId,
            styleLocks,
            lastSavedAt,
            updateBrief,
            setBlueprint,
            updateSlideBlueprint,
            addSlideAfter,
            removeSlide,
            updateSlideJob,
            resetSlideJobs,
            updateStyleLocks,
            clearAll,
        ]
    );

    return (
        <PptStudioContext.Provider value={value}>
            {children}
        </PptStudioContext.Provider>
    );
}

export function usePptStudio() {
    const context = useContext(PptStudioContext);
    if (!context) {
        throw new Error("usePptStudio must be used within PptStudioProvider");
    }
    return context;
}
