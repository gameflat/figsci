"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Clock,
  Download,
  ExternalLink,
  Heart,
  Share2,
  Star,
  Users,
  X,
  ZoomIn,
  Sparkles,
} from "lucide-react";

/**
 * @typedef {Object} TemplateDetailModalProps
 * @property {import("@/types/template").DiagramTemplate | null} template
 * @property {boolean} isOpen
 * @property {() => void} onClose
 * @property {(template: import("@/types/template").DiagramTemplate) => void} onUse
 * @property {() => void} [onPrevious]
 * @property {() => void} [onNext]
 * @property {boolean} [hasPrevious]
 * @property {boolean} [hasNext]
 */

/**
 * @param {TemplateDetailModalProps} props
 */
export function TemplateDetailModal({
  template,
  isOpen,
  onClose,
  onUse,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);

  // 键盘快捷键
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && hasPrevious && onPrevious) {
        onPrevious();
      } else if (e.key === "ArrowRight" && hasNext && onNext) {
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasPrevious, hasNext, onPrevious, onNext, onClose]);

  if (!template) return null;

  const difficultyConfig = {
    beginner: { label: "初级", color: "text-green-600 bg-green-50 border-green-200" },
    intermediate: { label: "中级", color: "text-blue-600 bg-blue-50 border-blue-200" },
    advanced: { label: "高级", color: "text-purple-600 bg-purple-50 border-purple-200" },
  };

  const difficulty = difficultyConfig[template.difficulty];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[1200px] h-[80vh] p-0 gap-0 overflow-hidden flex flex-col [&>button]:hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b bg-white/95 backdrop-blur-sm px-6 py-4">
          <DialogHeader className="flex-1">
            <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              {template.title}
              {template.isPopular && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  热门
                </span>
              )}
              {template.isNew && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  新品
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              {template.description}
            </DialogDescription>
          </DialogHeader>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2 ml-4">
            {onPrevious && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {onNext && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                disabled={!hasNext}
                className="h-9 w-9"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: Preview */}
          <div className="w-[500px] bg-slate-50 flex flex-col overflow-hidden border-r">
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <div className="flex items-center justify-center min-h-full py-4">
                <div
                  className={cn(
                    "relative w-full max-w-full rounded-xl border-2 border-slate-200 shadow-xl transition-transform duration-300 cursor-zoom-in",
                    imageZoomed && "scale-150 cursor-zoom-out"
                  )}
                  onClick={() => setImageZoomed(!imageZoomed)}
                  style={{
                    background: `linear-gradient(135deg, ${template.gradient.from} 0%, ${template.gradient.to} 100%)`,
                    aspectRatio: "16/10",
                  }}
                >
                  {template.previewUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center rounded-xl"
                      style={{ backgroundImage: `url(${template.previewUrl})` }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-6xl mb-4">{template.icon}</div>
                        <div className="text-2xl font-semibold">{template.title}</div>
                      </div>
                    </div>
                  )}

                  {/* Zoom Hint */}
                  <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
                    <ZoomIn className="h-3.5 w-3.5" />
                    点击{imageZoomed ? "缩小" : "放大"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex-1 bg-white flex flex-col overflow-hidden min-w-0">
            {/* Info Section */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6">
              {/* Meta Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 bg-slate-50">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="font-medium text-slate-700">
                      {template.estimatedTime}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-medium",
                      difficulty.color
                    )}
                  >
                    {difficulty.label}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{template.usageCount?.toLocaleString() || 0} 次使用</span>
                  </div>
                  {template.rating && (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span>{template.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t" />

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">模板说明</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {template.description}
                </p>
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">相关标签</h3>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Use Cases */}
              {template.useCases && template.useCases.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    适用场景
                  </h3>
                  <ul className="space-y-2">
                    {template.useCases.map((useCase, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Features */}
              {template.features && template.features.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    核心功能
                  </h3>
                  <ul className="space-y-2">
                    {template.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Author/Source */}
              {template.author && (
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                      {template.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {template.author}
                      </div>
                      <div className="text-xs text-slate-500">模板作者</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 border-t bg-white px-6 py-4 space-y-3">
              {/* Primary Action */}
              <Button
                onClick={() => {
                  onUse(template);
                  onClose();
                }}
                className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                style={{
                  backgroundImage: `linear-gradient(to right, ${template.gradient.from}, ${template.gradient.to})`,
                }}
              >
                使用此模板
              </Button>

              {/* Secondary Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                >
                  {isBookmarked ? (
                    <>
                      <BookmarkCheck className="h-4 w-4 mr-1.5" />
                      已收藏
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4 mr-1.5" />
                      收藏
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4 mr-1.5",
                      isLiked && "fill-red-500 text-red-500"
                    )}
                  />
                  {isLiked ? "已赞" : "点赞"}
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Tips */}
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  <strong>提示：</strong>使用 <kbd className="px-1.5 py-0.5 bg-white rounded border text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 bg-white rounded border text-[10px]">→</kbd> 快速浏览其他模板
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

