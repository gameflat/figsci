"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { zhTranslations, enTranslations } from "@/locales/translations";

/**
 * @typedef {import("@/locales/translations").Locale} Locale
 * @typedef {Object} LocaleContextValue
 * @property {Locale} locale
 * @property {(locale: Locale) => void} setLocale
 * @property {(key: string, params?: Record<string, string | number>) => string} t
 */

/** @type {React.Context<LocaleContextValue | undefined>} */
const LocaleContext = createContext(undefined);

// 本地存储 key
const LOCALE_STORAGE_KEY = "flowpilot-locale";

/**
 * @param {{ children: React.ReactNode }} props
 */
export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState("zh");
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化语言设置
  useEffect(() => {
    const savedLocale = /** @type {Locale | null} */ (
      localStorage.getItem(LOCALE_STORAGE_KEY)
    );
    if (savedLocale && (savedLocale === "zh" || savedLocale === "en")) {
      setLocaleState(savedLocale);
    } else {
      // 检测浏览器语言
      const browserLang = navigator.language.toLowerCase();
      const detectedLocale = browserLang.startsWith("zh") ? "zh" : "en";
      setLocaleState(detectedLocale);
    }
    setIsInitialized(true);
  }, []);

  const setLocale = (newLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    // 更新 html lang 属性
    document.documentElement.lang = newLocale === "zh" ? "zh-CN" : "en";
  };

  const t = (key, params) => {
    let translation = getTranslation(key, locale);
    
    // 支持参数替换，如 {count}
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(
          new RegExp(`\\{${paramKey}\\}`, 'g'),
          String(paramValue)
        );
      });
    }
    
    return translation;
  };

  // 避免闪烁，等待初始化完成
  if (!isInitialized) {
    return null;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}

// 翻译函数
/**
 * @param {string} key
 * @param {Locale} locale
 * @returns {string}
 */
function getTranslation(key, locale) {
  const translations = locale === "zh" ? zhTranslations : enTranslations;
  
  // 支持嵌套键，如 "common.title"
  const keys = key.split(".");
  let value = translations;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Translation key "${key}" not found for locale "${locale}"`);
      return key;
    }
  }
  
  return typeof value === "string" ? value : key;
}
