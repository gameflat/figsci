"use client";

import { LocaleProvider } from "@/contexts/locale-context";
import { ConversationProvider } from "@/contexts/conversation-context";
import { DiagramProvider } from "@/contexts/diagram-context";
import { SvgEditorProvider } from "@/contexts/svg-editor-context";

/**
 * 将所有需要跨路由保留状态的 Provider 聚合到一个客户端组件中，
 * 避免在不同页面间导航时 React 重新挂载导致状态丢失。
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AppProviders({ children }) {
    return (
        <LocaleProvider>
            <ConversationProvider>
                <DiagramProvider>
                    <SvgEditorProvider>{children}</SvgEditorProvider>
                </DiagramProvider>
            </ConversationProvider>
        </LocaleProvider>
    );
}

