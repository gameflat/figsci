/**
 * Next.js App Router 根布局组件
 * 
 * 此文件定义了应用的根布局（Root Layout），是所有页面的容器组件。
 * 在 Next.js App Router 架构中，layout.js 用于定义共享的布局结构、全局样式和元数据。
 * 
 * 主要功能：
 * - 字体优化：使用 Next.js 的字体优化功能，自动优化 Google 字体的加载
 * - 全局样式：导入全局 CSS 样式文件
 * - SEO 元数据：定义应用的基本元数据（标题、描述）
 * - HTML 结构：定义应用的根 HTML 和 body 结构
 * 
 * @file app/layout.js
 * @description Next.js App Router 根布局组件，定义应用的全局结构和样式
 */

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * Geist Sans 字体配置
 * 
 * 使用 Next.js 的字体优化功能导入 Google 字体（Geist Sans）。
 * Next.js 会自动优化字体加载，包括：
 * - 自动下载字体文件到本地，减少外部请求
 * - 自动生成字体显示策略，减少布局偏移（CLS）
 * - 自动生成 font-display 策略，优化字体渲染
 * - 在构建时进行字体优化，提升性能
 * 
 * @type {import('next/font/google').Font}
 * 
 * 配置选项说明：
 * - variable: CSS 变量名，用于在 CSS 和 Tailwind 中引用此字体
 * - subsets: 字符集子集，'latin' 包含基本拉丁字符，减少字体文件大小
 */
const geistSans = Geist({
  variable: "--font-geist-sans", // CSS 变量名，可在 CSS 中使用 var(--font-geist-sans)
  subsets: ["latin"],             // 仅加载拉丁字符集，减小字体文件大小
});

/**
 * Geist Mono 字体配置
 * 
 * 使用 Next.js 的字体优化功能导入 Google 字体（Geist Mono）。
 * Geist Mono 是等宽字体，适用于代码编辑器等场景。
 * 
 * @type {import('next/font/google').Font}
 * 
 * 配置选项说明：
 * - variable: CSS 变量名，用于在 CSS 和 Tailwind 中引用此字体
 * - subsets: 字符集子集，'latin' 包含基本拉丁字符
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono", // CSS 变量名，可在 CSS 中使用 var(--font-geist-mono)
  subsets: ["latin"],            // 仅加载拉丁字符集，减小字体文件大小
});

/**
 * 应用元数据
 * 
 * Next.js App Router 使用导出的 metadata 对象来生成页面的 HTML 元标签。
 * 这些元数据会：
 * - 自动添加到 <head> 标签中
 * - 用于 SEO 优化（搜索引擎优化）
 * - 用于社交媒体分享时的预览信息
 * 
 * @type {import('next').Metadata}
 * 
 * 注意：这是根布局的元数据，所有页面都会继承这些基本元数据。
 * 各个页面可以通过导出自己的 metadata 来覆盖或扩展这些值。
 */
export const metadata = {
  title: "Smart Drawio",           // 应用标题，会显示在浏览器标签页上
  description: "AI 驱动的图表生成", // 应用描述，用于 SEO 和社交媒体分享
};

/**
 * 根布局组件
 * 
 * 这是 Next.js App Router 的根布局组件，是所有页面的容器。
 * 所有页面内容（children）都会渲染在此布局内部。
 * 
 * 布局特点：
 * - 必须是默认导出（export default）
 * - 必须接受 children prop
 * - 必须返回 <html> 和 <body> 标签
 * - 在此文件中定义的样式和配置会应用到所有页面
 * 
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件（通常是页面内容）
 * @returns {JSX.Element} 返回包含应用结构的 JSX 元素
 * 
 * @example
 * // 页面结构示例
 * <html>
 *   <head>
 *     <!-- Next.js 自动生成的 meta 标签 -->
 *   </head>
 *   <body className="...">
 *     <!-- 所有页面的内容都会渲染在这里 -->
 *   </body>
 * </html>
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* 
        HTML lang 属性：指定文档的主要语言
        当前设置为 'en'（英语），如果需要支持中文，可以改为 'zh-CN'
      */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 
          className 说明：
          
          1. ${geistSans.variable}：
             - 将 Geist Sans 字体变量添加到 body 的 className 中
             - 这使得字体变量在整个应用中都可用
             - 在 CSS 中可以通过 var(--font-geist-sans) 引用
             - 在 Tailwind 中可以通过 font-sans 使用（已在 globals.css 中映射）
          
          2. ${geistMono.variable}：
             - 将 Geist Mono 字体变量添加到 body 的 className 中
             - 在 CSS 中可以通过 var(--font-geist-mono) 引用
             - 在 Tailwind 中可以通过 font-mono 使用（已在 globals.css 中映射）
          
          3. antialiased：
             - Tailwind CSS 工具类，启用字体抗锯齿
             - 等价于 CSS: -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
             - 使文字在屏幕上显示更平滑、清晰
          
          注意：
          - 虽然这里定义了字体变量，但在 globals.css 中 body 使用的是 Arial 字体
          - 字体变量仍然可以在其他组件中通过 Tailwind 的 font-sans 或 font-mono 使用
        */}
        {children}
        {/* 
          子组件渲染：
          - 所有页面的内容都会渲染在这个位置
          - Next.js 会自动将路由对应的页面组件作为 children 传入
        */}
      </body>
    </html>
  );
}
