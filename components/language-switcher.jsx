"use client";
import React from "react";
import { Languages } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";

/**
 * @param {{ className?: string }} props
 */
export function LanguageSwitcher({ className }) {
  const { locale, setLocale, t } = useLocale();

  const toggleLocale = () => {
    setLocale(locale === "zh" ? "en" : "zh");
  };

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300",
        className
      )}
      title={t("locale.switchTo")}
    >
      <Languages className="h-4 w-4" />
      <span>{locale === "zh" ? "中文" : "EN"}</span>
    </button>
  );
}
