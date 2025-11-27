"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, Search, Sparkles, Star, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TemplateCard, TemplateCardSkeleton } from "@/components/template-card";
import { TemplateDetailModal } from "@/components/template-detail-modal";
import { DIAGRAM_TEMPLATES } from "@/data/templates";

/**
 * @typedef {Object} TemplateGalleryProps
 * @property {(template: import("@/types/template").DiagramTemplate) => void} onSelectTemplate
 * @property {"default" | "compact"} [variant]
 * @property {() => void} [onExpand]
 */

// Category metadata
const CATEGORIES = [
  { id: "all", label: "全部", icon: "✨", count: 0 },
  { id: "business", label: "商业策略", icon: "🏢", count: 0 },
  { id: "development", label: "软件开发", icon: "💻", count: 0 },
  { id: "product", label: "产品设计", icon: "📊", count: 0 },
  { id: "security", label: "IT安全", icon: "🛡️", count: 0 },
  { id: "creative", label: "创意工坊", icon: "🎨", count: 0 },
];

const RECENT_KEY = "flowpilot_recent_templates";

/**
 * @param {TemplateGalleryProps} props
 */
export function TemplateGallery({
  onSelectTemplate,
  variant = "default",
  onExpand,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [difficulty, setDifficulty] = useState("all");
  const [onlyPopular, setOnlyPopular] = useState(false);
  const [onlyNew, setOnlyNew] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  const [sortBy, setSortBy] = useState("popular");
  const [visibleCount, setVisibleCount] = useState(12);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [recentTemplateIds, setRecentTemplateIds] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTemplateId, setDetailTemplateId] = useState(null);

  const isCompact = variant === "compact";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(RECENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentTemplateIds(parsed);
        }
      } catch (error) {
        console.warn("Failed to parse recent templates:", error);
      }
    }
  }, []);

  const updateRecent = (templateId) => {
    setRecentTemplateIds((prev) => {
      const next = [templateId, ...prev.filter((id) => id !== templateId)].slice(0, 6);
      if (typeof window !== "undefined") {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  // Calculate category counts
  const categoriesWithCounts = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      ...cat,
      count:
        cat.id === "all"
          ? DIAGRAM_TEMPLATES.length
          : DIAGRAM_TEMPLATES.filter((t) => t.category === cat.id).length,
    }));
  }, []);

  useEffect(() => {
    setVisibleCount(12);
  }, [selectedCategory, difficulty, onlyPopular, onlyNew, activeTag, searchQuery]);

  // Top tags for quick filters
  const topTags = useMemo(() => {
    const counts = {};
    DIAGRAM_TEMPLATES.forEach((t) => {
      t.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, []);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = DIAGRAM_TEMPLATES.slice();

    if (selectedCategory !== "all") {
      result = result.filter((t) => t.category === selectedCategory);
    }

    if (difficulty !== "all") {
      result = result.filter((t) => t.difficulty === difficulty);
    }

    if (onlyPopular) {
      result = result.filter((t) => t.isPopular);
    }

    if (onlyNew) {
      result = result.filter((t) => t.isNew);
    }

    if (activeTag) {
      result = result.filter((t) => t.tags.includes(activeTag));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    result = result.sort((a, b) => {
      if (sortBy === "alphabetical") {
        return a.title.localeCompare(b.title, "zh-CN");
      }
      if (sortBy === "quickest") {
        const toMinutes = (val) => parseInt(val, 10) || 99;
        return toMinutes(a.estimatedTime) - toMinutes(b.estimatedTime);
      }
      if (sortBy === "newest") {
        const aDate = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bDate = b.createdAt ? Date.parse(b.createdAt) : 0;
        return bDate - aDate;
      }
      // popular
      const aScore = (a.usageCount ?? 0) + (a.isPopular ? 100 : 0);
      const bScore = (b.usageCount ?? 0) + (b.isPopular ? 100 : 0);
      return bScore - aScore;
    });

    return result;
  }, [selectedCategory, difficulty, onlyPopular, onlyNew, activeTag, searchQuery, sortBy]);

  // Selected template for preview
  useEffect(() => {
    if (filteredTemplates.length === 0) {
      setSelectedTemplateId(null);
      return;
    }
    if (!selectedTemplateId || !filteredTemplates.find((t) => t.id === selectedTemplateId)) {
      setSelectedTemplateId(filteredTemplates[0].id);
    }
  }, [filteredTemplates, selectedTemplateId]);

  const selectedTemplate = useMemo(
    () => filteredTemplates.find((t) => t.id === selectedTemplateId) || null,
    [filteredTemplates, selectedTemplateId]
  );

  const detailTemplate = useMemo(
    () => DIAGRAM_TEMPLATES.find((t) => t.id === detailTemplateId) || null,
    [detailTemplateId]
  );

  const detailTemplateIndex = useMemo(() => {
    if (!detailTemplateId) return -1;
    return filteredTemplates.findIndex((t) => t.id === detailTemplateId);
  }, [filteredTemplates, detailTemplateId]);

  const handleOpenDetail = (template) => {
    setDetailTemplateId(template.id);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    // Keep the ID for a moment to allow smooth closing animation
    setTimeout(() => setDetailTemplateId(null), 200);
  };

  const handleNextTemplate = () => {
    if (detailTemplateIndex < filteredTemplates.length - 1) {
      setDetailTemplateId(filteredTemplates[detailTemplateIndex + 1].id);
    }
  };

  const handlePreviousTemplate = () => {
    if (detailTemplateIndex > 0) {
      setDetailTemplateId(filteredTemplates[detailTemplateIndex - 1].id);
    }
  };

  const recentTemplates = recentTemplateIds
    .map((id) => DIAGRAM_TEMPLATES.find((t) => t.id === id))
    .filter(Boolean);

  const handleUseTemplate = (template) => {
    onSelectTemplate(template);
    updateRecent(template.id);
  };

  const resetFilters = () => {
    setSelectedCategory("all");
    setDifficulty("all");
    setOnlyPopular(false);
    setOnlyNew(false);
    setActiveTag(null);
    setSortBy("popular");
    setSearchQuery("");
  };

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar filters - Hidden in compact mode */}
      {!isCompact && (
        <aside className="hidden w-[260px] shrink-0 flex-col border-r bg-slate-50/80 px-4 py-4 md:flex">
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
              筛选
              <button
                className="text-xs text-blue-600 hover:text-blue-700"
                onClick={resetFilters}
              >
                重置
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-[12px] font-medium text-slate-500">分类</div>
              <div className="space-y-1">
                {categoriesWithCounts.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition",
                      selectedCategory === category.id
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      {category.label}
                    </span>
                    <span className="text-xs text-slate-500">{category.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[12px] font-medium text-slate-500">难度</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "不限" },
                  { id: "beginner", label: "初级" },
                  { id: "intermediate", label: "中级" },
                  { id: "advanced", label: "高级" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setDifficulty(item.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      difficulty === item.id
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[12px] font-medium text-slate-500">快速标签</div>
              <div className="flex flex-wrap gap-2">
                {topTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition",
                      activeTag === tag
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[12px] font-medium text-slate-500">偏好</div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600"
                    checked={onlyPopular}
                    onChange={(e) => setOnlyPopular(e.target.checked)}
                  />
                  只看热门
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600"
                    checked={onlyNew}
                    onChange={(e) => setOnlyNew(e.target.checked)}
                  />
                  只看新品
                </label>
              </div>
            </div>

            {recentTemplates.length > 0 && (
              <div className="space-y-2">
                <div className="text-[12px] font-medium text-slate-500">最近使用</div>
                <div className="space-y-1">
                  {recentTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        handleUseTemplate(template);
                      }}
                      className="flex w-full items-center justify-between rounded-md border px-2.5 py-2 text-left text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      <span className="line-clamp-1">{template.title}</span>
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className={cn("border-b bg-gradient-to-r from-slate-50 to-white px-4 py-4", isCompact && "border-none bg-transparent px-0 py-0 pb-3")}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className={cn("text-xl font-semibold text-slate-900", isCompact && "hidden")}>
                模板库
              </h2>
              {!isCompact && (
                <p className="mt-1 text-sm text-slate-600">
                  选择一个模板快速开始，或从空白画布创建
                </p>
              )}
            </div>
            {!isCompact && (
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  className="gap-1"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                  网格
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  className="gap-1"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                  列表
                </Button>
              </div>
            )}
          </div>

          {/* Search + sort */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder={isCompact ? "搜索模板..." : "搜索模板名称、标签或描述…"}
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {isCompact && onExpand && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExpand}
                className="shrink-0 text-slate-500 hover:text-slate-700 gap-1 px-2"
                title="全屏查看"
              >
                <span className="text-lg">⛶</span>
                <span className="text-xs">全屏库</span>
              </Button>
            )}
            {!isCompact && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="hidden text-xs text-slate-500 sm:inline">排序</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="popular">最热</option>
                  <option value="newest">最新</option>
                  <option value="quickest">最快上手</option>
                  <option value="alphabetical">按名称</option>
                </select>
                <span className="hidden text-xs text-slate-500 sm:inline">
                  共 {filteredTemplates.length} 个结果
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* List/Grid */}
          <div className={cn("flex-1 overflow-y-auto px-4 py-4", isCompact && "px-3 py-3")}>
            {isLoading ? (
              <div
                className={cn(
                  "grid gap-4",
                  viewMode === "grid" ? (isCompact ? "grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3") : "grid-cols-1"
                )}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <TemplateCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredTemplates.length > 0 ? (
              <>
                {viewMode === "grid" ? (
                  <div className={cn("grid gap-4", isCompact ? "grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3")}>
                    {filteredTemplates.slice(0, visibleCount).map((template, index) => (
                      <div
                        key={template.id}
                        style={{
                          animation: `fadeInUp 0.25s ease forwards`,
                          animationDelay: `${index * 0.04}s`,
                          opacity: 0,
                        }}
                      >
                        <TemplateCard
                          template={template}
                          onUse={handleUseTemplate}
                          onHover={(t) => setSelectedTemplateId(t.id)}
                          onClick={handleOpenDetail}
                          compact={isCompact}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {filteredTemplates.slice(0, visibleCount).map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        variant="list"
                        onUse={handleUseTemplate}
                        onHover={(t) => setSelectedTemplateId(t.id)}
                        onClick={handleOpenDetail}
                      />
                    ))}
                  </div>
                )}

                {visibleCount < filteredTemplates.length && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setVisibleCount((prev) => prev + 12)}
                    >
                      加载更多（{filteredTemplates.length - visibleCount}）
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
                <div className="mb-3 text-4xl">🔍</div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">
                  未找到匹配的模板
                </h3>
                <p className="mb-3 text-xs text-slate-600">
                  尝试调整筛选条件或搜索其他关键词
                </p>
                {searchQuery && (
                  <Button variant="secondary" size="sm" onClick={resetFilters}>
                    清除筛选
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Preview panel - Hidden in compact mode */}
          {!isCompact && (
            <div className="hidden w-[320px] shrink-0 border-l bg-slate-50/70 px-4 py-4 xl:flex xl:flex-col">
              {selectedTemplate ? (
                <>
                  <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                    预览
                  </div>
                  <div className="rounded-xl border bg-white shadow-sm">
                    <div
                      className="relative h-40 overflow-hidden rounded-t-xl"
                      style={{
                        background: `linear-gradient(135deg, ${selectedTemplate.gradient.from} 0%, ${selectedTemplate.gradient.to} 100%)`,
                      }}
                    >
                      {selectedTemplate.previewUrl ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-90"
                          style={{ backgroundImage: `url(${selectedTemplate.previewUrl})` }}
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                    <div className="space-y-2 px-4 py-3">
                      <div className="flex items-center gap-2">
                        {selectedTemplate.isPopular && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            <Star className="h-3 w-3" />
                            热门
                          </span>
                        )}
                        {selectedTemplate.isNew && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                            新品
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
                          {selectedTemplate.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-3">
                          {selectedTemplate.description}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                          ⏱ {selectedTemplate.estimatedTime}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          难度：
                          {selectedTemplate.difficulty === "beginner"
                            ? "初级"
                            : selectedTemplate.difficulty === "intermediate"
                              ? "中级"
                              : "高级"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTemplate.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleUseTemplate(selectedTemplate)}
                      >
                        使用此模板
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  选择左侧模板查看详情
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CSS for animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Detail Modal */}
      <TemplateDetailModal
        template={detailTemplate}
        isOpen={detailModalOpen}
        onClose={handleCloseDetail}
        onUse={handleUseTemplate}
        onNext={handleNextTemplate}
        onPrevious={handlePreviousTemplate}
        hasNext={detailTemplateIndex < filteredTemplates.length - 1}
        hasPrevious={detailTemplateIndex > 0}
      />
    </div>
  );
}

