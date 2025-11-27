# DrawIO 自动降级功能文档

## 功能概述

当主 DrawIO URL 加载失败时，系统会自动切换到备用 URL，确保用户始终能够使用图表编辑器。

## 核心特性

### 1. 自动降级
- 主 URL 加载超时（默认 15 秒）自动切换到备用 URL
- 支持手动触发降级（通过 `handleError` 方法）
- 降级后会重置加载状态，尝试加载备用 URL

### 2. 智能监控
- 实时监控加载状态
- 超时检测机制
- 错误捕获和处理

### 3. 手动控制
- 支持手动重试主 URL
- 支持禁用自动降级
- 提供加载成功/失败的回调

## 使用方法

### 基础使用

```tsx
import { useDrawioFallback } from "@/hooks/use-drawio-fallback";
import { DrawIoEmbed } from "react-drawio";

function MyComponent() {
    const {
        currentUrl,
        isLoading,
        error,
        isFallback,
        handleLoad,
    } = useDrawioFallback({
        primaryUrl: process.env.NEXT_PUBLIC_DRAWIO_BASE_URL,
        fallbackUrl: "https://app.diagrams.net",
    });

    if (error) {
        return <div>加载失败: {error}</div>;
    }

    return (
        <>
            {isLoading && <div>加载中...</div>}
            {isFallback && <div>使用备用 URL</div>}
            <DrawIoEmbed
                baseUrl={currentUrl}
                onLoad={handleLoad}
            />
        </>
    );
}
```

### 高级配置

```tsx
const {
    currentUrl,
    isLoading,
    error,
    isFallback,
    retryPrimary,
    handleLoad,
    handleError,
} = useDrawioFallback({
    // 主 URL（优先使用）
    primaryUrl: process.env.NEXT_PUBLIC_DRAWIO_BASE_URL,
    
    // 备用 URL（降级时使用）
    fallbackUrl: "https://app.diagrams.net",
    
    // 超时时间（毫秒）
    timeout: 20000,
    
    // 是否启用自动降级
    enableFallback: true,
    
    // 降级时的回调
    onFallback: (from, to) => {
        console.warn(`降级: ${from} -> ${to}`);
        // 可以在这里发送日志到监控系统
    },
});
```

### 完整示例

```tsx
"use client";

import { useDrawioFallback } from "@/hooks/use-drawio-fallback";
import { DrawIoEmbed } from "react-drawio";

export default function DiagramEditor() {
    const {
        currentUrl,
        isLoading,
        error,
        isFallback,
        retryPrimary,
        handleLoad,
        handleError,
    } = useDrawioFallback({
        primaryUrl: process.env.NEXT_PUBLIC_DRAWIO_BASE_URL,
        fallbackUrl: "https://app.diagrams.net",
        timeout: 15000,
        onFallback: (from, to) => {
            // 发送降级事件到分析系统
            analytics.track("drawio_fallback", { from, to });
        },
    });

    return (
        <div className="h-screen">
            {/* 加载状态 */}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner" />
                    <p>
                        加载 DrawIO 编辑器...
                        {isFallback && " (使用备用 URL)"}
                    </p>
                </div>
            )}

            {/* 错误状态 */}
            {error && (
                <div className="error-container">
                    <h2>加载失败</h2>
                    <p>{error}</p>
                    
                    {/* 如果已经降级，显示重试按钮 */}
                    {isFallback && (
                        <button onClick={retryPrimary}>
                            重试主 URL
                        </button>
                    )}
                    
                    <div className="solutions">
                        <h3>解决方案:</h3>
                        <ol>
                            <li>检查网络连接</li>
                            <li>尝试使用 VPN</li>
                            <li>配置环境变量使用其他 URL</li>
                        </ol>
                    </div>
                </div>
            )}

            {/* DrawIO 编辑器 */}
            {!error && (
                <DrawIoEmbed
                    baseUrl={currentUrl}
                    onLoad={handleLoad}
                    onError={(err) => handleError(err.message)}
                    urlParameters={{
                        spin: true,
                        libraries: false,
                        saveAndExit: false,
                        noExitBtn: true,
                    }}
                />
            )}
        </div>
    );
}
```

## API 参考

### useDrawioFallback 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `primaryUrl` | `string` | `process.env.NEXT_PUBLIC_DRAWIO_BASE_URL \|\| "https://embed.diagrams.net"` | 主 DrawIO URL |
| `fallbackUrl` | `string` | `"https://app.diagrams.net"` | 备用 DrawIO URL |
| `timeout` | `number` | `15000` | 加载超时时间（毫秒） |
| `enableFallback` | `boolean` | `true` | 是否启用自动降级 |
| `onFallback` | `(from: string, to: string) => void` | `undefined` | 降级时的回调函数 |

### useDrawioFallback 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `currentUrl` | `string` | 当前使用的 DrawIO URL |
| `isLoading` | `boolean` | 是否正在加载 |
| `error` | `string \| null` | 错误信息 |
| `isFallback` | `boolean` | 是否已降级到备用 URL |
| `retryPrimary` | `() => void` | 重试主 URL |
| `handleLoad` | `() => void` | 手动触发加载成功 |
| `handleError` | `(message?: string) => void` | 手动触发加载失败 |

## 工作流程

```
┌─────────────────┐
│  开始加载主 URL  │
└────────┬────────┘
         │
         ├─ 加载成功 ──> handleLoad() ──> 完成
         │
         ├─ 加载超时 ─┐
         │            │
         └─ 加载错误 ─┤
                      │
                      ▼
         ┌─────────────────────┐
         │  是否启用降级？     │
         └────────┬────────────┘
                  │
        是 ───────┤
                  │         否 ──> 显示错误
                  ▼
         ┌─────────────────┐
         │ 切换到备用 URL  │
         └────────┬────────┘
                  │
                  ├─ 加载成功 ──> handleLoad() ──> 完成
                  │
                  └─ 加载失败 ──> 显示错误
```

## 环境变量配置

在 `.env.local` 文件中配置主 URL：

```bash
# 使用官方嵌入版本（默认）
NEXT_PUBLIC_DRAWIO_BASE_URL=https://embed.diagrams.net

# 或使用完整应用版本
NEXT_PUBLIC_DRAWIO_BASE_URL=https://app.diagrams.net

# 或使用自托管版本
NEXT_PUBLIC_DRAWIO_BASE_URL=https://drawio.yourdomain.com
```

## 监控和日志

### 控制台日志

Hook 会在关键节点输出日志：

```javascript
// 降级时
[DrawIO Fallback] 主URL加载失败: https://embed.diagrams.net，切换到备用URL: https://app.diagrams.net

// 加载超时
[DrawIO Fallback] 加载超时 (15000ms): https://embed.diagrams.net

// 加载成功
[DrawIO Fallback] 加载成功: https://app.diagrams.net (备用URL)

// 重试
[DrawIO Fallback] 重试主URL: https://embed.diagrams.net
```

### 集成监控系统

```tsx
useDrawioFallback({
    onFallback: (from, to) => {
        // 发送到 Google Analytics
        gtag('event', 'drawio_fallback', {
            from_url: from,
            to_url: to,
        });
        
        // 发送到 Sentry
        Sentry.captureMessage('DrawIO URL fallback', {
            level: 'warning',
            extra: { from, to },
        });
        
        // 发送到自定义日志系统
        logger.warn('DrawIO fallback', { from, to });
    },
});
```

## 最佳实践

### 1. 合理设置超时时间

```tsx
// 网络较慢的环境，增加超时时间
useDrawioFallback({
    timeout: 30000, // 30秒
});

// 网络较快的环境，减少超时时间
useDrawioFallback({
    timeout: 10000, // 10秒
});
```

### 2. 提供友好的用户反馈

```tsx
{isLoading && (
    <div>
        <p>正在加载编辑器...</p>
        {isFallback && (
            <p className="text-yellow-600">
                主服务器无响应，正在尝试备用服务器
            </p>
        )}
    </div>
)}
```

### 3. 允许用户手动切换

```tsx
<div>
    <p>当前使用: {isFallback ? "备用服务器" : "主服务器"}</p>
    {isFallback && (
        <button onClick={retryPrimary}>
            切换回主服务器
        </button>
    )}
</div>
```

### 4. 记录降级统计

```tsx
const [fallbackCount, setFallbackCount] = useState(0);

useDrawioFallback({
    onFallback: () => {
        setFallbackCount(prev => prev + 1);
        // 如果降级次数过多，提醒用户
        if (fallbackCount >= 3) {
            alert("您的网络可能存在问题，建议检查网络设置");
        }
    },
});
```

## 故障排查

### 问题：两个 URL 都加载失败

**可能原因：**
- 网络连接问题
- 防火墙/代理拦截
- DrawIO 服务全部不可用

**解决方案：**
1. 检查网络连接
2. 尝试使用 VPN
3. 配置自托管的 DrawIO 服务
4. 检查浏览器控制台错误

### 问题：频繁触发降级

**可能原因：**
- 超时时间设置过短
- 主 URL 服务不稳定
- 网络延迟过高

**解决方案：**
1. 增加超时时间
2. 直接使用备用 URL 作为主 URL
3. 部署自己的 DrawIO 服务

### 问题：降级后无法切换回主 URL

**可能原因：**
- `retryPrimary` 方法未正确调用
- 状态管理问题

**解决方案：**
```tsx
// 确保正确使用 retryPrimary
<button onClick={() => {
    console.log("Retrying primary URL");
    retryPrimary();
}}>
    重试
</button>
```

## 相关资源

- [DrawIO 官方文档](https://www.diagrams.net/doc/)
- [react-drawio 库](https://github.com/jgraph/drawio)
- [自托管 DrawIO](https://github.com/jgraph/docker-drawio)
