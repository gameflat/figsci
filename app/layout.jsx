// -*- coding: utf-8 -*-
/**
 * FlowPilot 根布局组件
 * 
 * 这是 Next.js App Router 的根布局文件，定义了整个应用的基础结构：
 * - 字体配置（Geist Sans 和 Geist Mono）
 * - 全局 Context Provider 嵌套结构
 * - 页面元数据（SEO）
 * - 全局样式导入
 * - Vercel Analytics 集成
 */

// Next.js 字体优化：从 Google Fonts 加载 Geist 字体族
// 使用 next/font/google 可以自动优化字体加载，减少布局偏移（CLS）
import { Geist, Geist_Mono } from "next/font/google";

// Vercel Analytics：用于收集和分析应用的使用数据
// 提供页面访问量、性能指标等数据
import { Analytics } from "@vercel/analytics/react";

// Context Providers：应用状态管理的上下文提供者
// DiagramProvider：图表状态管理（当前图表 XML、渲染模式等）
import { DiagramProvider } from "@/contexts/diagram-context";
// ConversationProvider：对话状态管理（消息历史、当前对话等）
import { ConversationProvider } from "@/contexts/conversation-context";
// LocaleProvider：国际化状态管理（当前语言、语言切换等）
import { LocaleProvider } from "@/contexts/locale-context";
// SvgEditorProvider：SVG 编辑器状态管理（SVG 内容、编辑历史等）
import { SvgEditorProvider } from "@/contexts/svg-editor-context";

// 全局样式：导入应用的主题系统、颜色变量、基础样式等
import "./globals.css";

/**
 * Geist Sans 字体配置
 * 
 * Geist 是 Vercel 设计的现代无衬线字体，具有良好的可读性和现代感
 * 
 * @property {string} variable - CSS 变量名，用于在 CSS 中引用此字体
 *                               对应 globals.css 中的 --font-geist-sans
 * @property {string[]} subsets - 字体子集，只加载拉丁字符集以优化性能
 *                               减少字体文件大小，加快加载速度
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

/**
 * Geist Mono 字体配置
 * 
 * Geist Mono 是 Geist 的等宽字体版本，适用于代码显示和需要对齐的场景
 * 
 * @property {string} variable - CSS 变量名，用于在 CSS 中引用此字体
 *                               对应 globals.css 中的 --font-geist-mono
 * @property {string[]} subsets - 字体子集，只加载拉丁字符集以优化性能
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

/**
 * 页面元数据（Metadata）
 * 
 * Next.js App Router 使用 metadata 对象来定义页面的 SEO 信息
 * 这些信息会被用于：
 * - HTML <head> 中的 <title> 和 <meta> 标签
 * - 社交媒体分享时的预览卡片（Open Graph）
 * - 搜索引擎优化（SEO）
 * 
 * @property {string} title - 页面标题，显示在浏览器标签页和搜索结果中
 *                            格式：主标题 | 副标题
 * @property {string} description - 页面描述，用于 SEO 和社交媒体分享
 *                                  包含中英文双语描述，提高国际化友好度
 */
export const metadata = {
  title: "FlowPilot | 智能流程图",
  description: "将 draw.io 与对话式 AI 助手结合的智能制图工作台 | Intelligent diagramming workbench combining draw.io with conversational AI assistant."
};

/**
 * 根布局组件（Root Layout）
 * 
 * 这是 Next.js App Router 的根布局组件，所有页面都会包裹在这个组件中
 * 负责：
 * - 定义 HTML 文档结构（<html>、<body>）
 * - 配置全局字体变量
 * - 嵌套所有 Context Provider（按依赖顺序）
 * - 集成 Vercel Analytics
 * 
 * @param {React.ReactNode} children - 子页面内容，由 Next.js 自动传入
 * @returns {JSX.Element} 根布局的 JSX 结构
 */
export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      {/* 
        body 元素配置：
        - className 包含字体变量类名，使字体在 CSS 中可用
        - antialiased：Tailwind CSS 工具类，启用字体抗锯齿，提升文字显示质量
      */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 
          Context Provider 嵌套结构（从外到内）：
          
          1. LocaleProvider（最外层）
             - 管理语言设置和国际化状态
             - 所有其他 Provider 都可以访问语言信息
          
          2. ConversationProvider
             - 管理对话历史和消息状态
             - 依赖 LocaleProvider 以支持多语言消息
          
          3. DiagramProvider
             - 管理图表状态（XML、渲染模式等）
             - 依赖 ConversationProvider 以关联对话和图表
          
          4. SvgEditorProvider（最内层）
             - 管理 SVG 编辑器状态
             - 依赖 DiagramProvider 以获取当前图表数据
          
          注意：Provider 的嵌套顺序很重要，内层 Provider 可以访问外层 Provider 的状态
        */}
        <LocaleProvider>
          <ConversationProvider>
            <DiagramProvider>
              <SvgEditorProvider>{children}</SvgEditorProvider>
            </DiagramProvider>
          </ConversationProvider>
        </LocaleProvider>

        {/* 
          Vercel Analytics 组件
          - 自动收集页面访问数据
          - 在生产环境中启用，开发环境通常不收集数据
          - 无需额外配置，部署到 Vercel 后自动工作
        */}
        <Analytics />
      </body>
    </html>
  );
}
