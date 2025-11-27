/**
 * DrawIO降级逻辑测试示例
 * 
 * 这个测试文件展示了如何测试DrawIO降级逻辑
 * 实际运行需要配置测试环境（如Jest + React Testing Library）
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useDrawioFallback } from "../use-drawio-fallback";

describe("useDrawioFallback", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it("应该使用主URL初始化", () => {
        const { result } = renderHook(() =>
            useDrawioFallback({
                primaryUrl: "https://embed.diagrams.net",
                fallbackUrl: "https://app.diagrams.net",
            })
        );

        expect(result.current.currentUrl).toBe("https://embed.diagrams.net");
        expect(result.current.isLoading).toBe(true);
        expect(result.current.isFallback).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it("加载成功时应该清除loading状态", () => {
        const { result } = renderHook(() =>
            useDrawioFallback({
                primaryUrl: "https://embed.diagrams.net",
            })
        );

        act(() => {
            result.current.handleLoad();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it("超时后应该自动降级到备用URL", async () => {
        const onFallback = jest.fn();
        const { result } = renderHook(() =>
            useDrawioFallback({
                primaryUrl: "https://embed.diagrams.net",
                fallbackUrl: "https://app.diagrams.net",
                timeout: 10000,
                onFallback,
            })
        );

        // 初始状态
        expect(result.current.currentUrl).toBe("https://embed.diagrams.net");
        expect(result.current.isFallback).toBe(false);

        // 等待超时
        act(() => {
            jest.advanceTimersByTime(10000);
        });

        await waitFor(() => {
            expect(result.current.currentUrl).toBe("https://app.diagrams.net");
            expect(result.current.isFallback).toBe(true);
            expect(result.current.isLoading).toBe(true);
            expect(onFallback).toHaveBeenCalledWith(
                "https://embed.diagrams.net",
                "https://app.diagrams.net"
            );
        });
    });

    it("手动触发错误时应该降级", () => {
        const { result } = renderHook(() =>
            useDrawioFallback({
                primaryUrl: "https://embed.diagrams.net",
                fallbackUrl: "https://app.diagrams.net",
            })
        );

        act(() => {
            nt.handleError("加载失败");
        });

        expect(result.current.currentUrl).toBe("https://app.diagrams.net");
        expect(result.current.isFallback).toBe(true);
        expect(result.current.isLoading).toBe(true);
    });

    it("备用URL也失败时应该显示错误", async () => {
        const { result } = renderHook(() =>
            useDrawioFallback({
                primaryUrl: "https://embed.diagrams.net",
                fallbackUrl: "https://app.diagrams.net",
                timeout: 5000,
            })
        );

        // 第一次超时，触发降级
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        await waitFor(() => {
            expect(result.current.isFallback).toBe(true);
        });

        // 第二次超时，备用URL也失败
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        await waitFor(() => {
            expect(result.current.error).toContain("超时");
            expect(result.current.isLoading).toBe(false);
        });
    });

    it("重试应该切换回主URL", () => {
        const { result } = renderHook(() =>
            useDrawioFallback({
                primaryUrl: "https://embed.diagrams.net",
                fallbackUrl: "https://app.diagrams.net",
            })
        );

        // 先触发降级
        act(() => {
            result.current.handleError();
        });

        expect(result.current.isFallback).toBe(true);

        // 重试主URL
        act(() => {
            result.current.retryPrimary();
        });

        expect(result.current.currentUrl).toBe("https://embed.diagrams.net");
        expect(result.current.isFallback).toBe(false);
        expect(result.current.isLoading).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it("禁用降级时不应该切换URL", async () => {
        const { result } = renderHook(() =>
            useDrawioFallback({
                primaryUrl: "https://embed.diagrams.net",
                fallbackUrl: "https://app.diagrams.net",
                timeout: 5000,
                enableFallback: false,
            })
        );

        // 触发超时
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        await waitFor(() => {
            expect(result.current.currentUrl).toBe("https://embed.diagrams.net");
            expect(result.current.isFallback).toBe(false);
            expect(result.current.error).toContain("超时");
        });
    });
});
