import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { DiagramProvider } from "@/contexts/diagram-context";
import { ConversationProvider } from "@/contexts/conversation-context";
import { LocaleProvider } from "@/contexts/locale-context";
import { SvgEditorProvider } from "@/contexts/svg-editor-context";
import "./globals.css";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});
export const metadata = {
  title: "FlowPilot | \u667A\u80FD\u6D41\u7A0B\u56FE",
  description: "\u5C06 draw.io \u4E0E\u5BF9\u8BDD\u5F0F AI \u52A9\u624B\u7ED3\u5408\u7684\u667A\u80FD\u5236\u56FE\u5DE5\u4F5C\u53F0 | Intelligent diagramming workbench combining draw.io with conversational AI assistant."
};
export default function RootLayout({
  children
}) {
  return <html lang="zh-CN">
            <body
    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
  >
                <LocaleProvider>
                    <ConversationProvider>
                        <DiagramProvider>
                            <SvgEditorProvider>{children}</SvgEditorProvider>
                        </DiagramProvider>
                    </ConversationProvider>
                </LocaleProvider>

                <Analytics />
            </body>
        </html>;
}
