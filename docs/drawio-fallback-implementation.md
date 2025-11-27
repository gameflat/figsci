# DrawIO 自动降级功能实现说明

## 概述

本次实现为项目添加了 DrawIO 加载失败时的自动降级功能，当主 URL 无法加载时，系统会自动切换到备用 URL，提升用户体验和系统可靠性。

## 实现的文件

### 1. 核心 Hook: `hooks/use-drawio-fallback.ts`

这是整个降级逻辑的核心，提供了以下功能：

```typescript
const {
    currentUrl,      // 当前使用的 URL
    isLoading,       // 加载状态
    error,           // 错误信息
    isFallback,      // 是否在使用备用 URL
    retryPrimary,    // 重试主 URL
    handleLoad,      // 处理加载成功
    handleError,     // 处理加载失败
} = useDrawioFallback({
    primaryUrl: "https://embed.diagrams.net",
    fallbackUrl: "https://app.diagrams.net",
    timeout: 15000,
    enableFallback: true,
    onFallback: (from, to) => console.log(`降级: ${from} -> ${to}`),
});
```

**核心特性：**
- ✅ 自动超时检测（默认 15 秒）
- ✅ 自动切换到备用 URL
- ✅ 手动重试主 URL
- ✅ 降级事件回调
- ✅ 可禁用自动降级
- ✅ 完整的 TypeScript 类型支持

### 2. 页面集成: `app/page.tsx`

在主页面中集成了降级逻辑：

**主要改动：**

1. **导入新 Hook**
   ```typescript
   import { useDrawioFallback } from "@/hooks/use-drawio-fallback";
   ```

2. **使用降级逻辑**
   ```typescript
   const {
       currentUrl: drawioBaseUrl,
       isLoading: isDrawioLoading,
       error: drawioError,
       isFallback,
       retryPrimary,
       handleLoad: handleDrawioLoadSuccess,
       handleError: handleDrawioLoadError,
   } = useDrawioFallback({
       primaryUrl: process.env.NEXT_PUBLIC_DRAWIO_BASE_URL,
       fallbackUrl: "https://app.diagrams.net",
       timeout: 15000,
       enableFallback: true,
       onFallback: (from, to) => {
           console.warn(`DrawIO自动降级: ${from} -> ${to}`);
       },
   });
   ```

3. **错误状态显示优化**
   - 显示降级警告信息
   - 提供"重试主URL"按钮（仅在降级后显示）
   - 加载时显示是否使用备用URL

4. **与诊断系统集成**
   ```typescript
   useDrawioDiagnostics({
       baseUrl: drawioBaseUrl,
       onRuntimeError: (payload) => {
           setRuntimeError(payload);
           // 严重错误时触发降级
           if (payload.type === "merge" || payload.message?.includes("Error")) {
               handleDrawioLoadError(payload.message);
           }
       },
       // ...
   });
   ```

### 3. 测试文件: `hooks/__tests__/use-drawio-fallback.test.tsx`

完整的单元测试，覆盖所有场景：

- ✅ 主 URL 加载成功
- ✅ 主 URL 超时自动降级
- ✅ 手动触发降级
- ✅ 备用 URL 也失败的情况
- ✅ 重试主 URL
- ✅ 禁用降级功能

### 4. 文档: `docs/drawio-fallback.md`

完整的使用文档，包含：
- 功能概述
- 使用方法和示例
- API 参考
- 工作流程图
- 最佳实践
- 故障排查指南

## 工作流程

```
用户打开页面
    ↓
加载主 URL (embed.diagrams.net)
    ↓
  成功? ──Yes──> 正常使用
    ↓
   No
    ↓
超时或错误?
    ↓
自动切换到备用 URL (app.diagrams.net)
    ↓
  成功? ──Yes──> 使用备用 URL，显示降级提示
    ↓
   No
    ↓
显示错误信息，提供重试按钮
```

## 使用示例

### 场景 1: 正常加载

```
1. 用户访问页面
2. 开始加载 https://embed.diagrams.net
3. 5 秒后加载成功
4. 用户正常使用编辑器
```

### 场景 2: 主 URL 超时，自动降级

```
1. 用户访问页面
2. 开始加载 https://embed.diagrams.net
3. 15 秒后超时，无响应
4. 自动切换到 https://app.diagrams.net
5. 3 秒后加载成功
6. 显示 "加载中... (使用备用URL)"
7. 用户可以正常使用，看到降级提示
```

### 场景 3: 两个 URL 都失败

```
1. 用户访问页面
2. 开始加载主 URL，15 秒后超时
3. 自动切换到备用 URL
4. 备用 URL 也在 15 秒后超时
5. 显示详细错误信息和解决方案
6. 提供"重试主URL"按钮
```

### 场景 4: 用户手动重试

```
1. 在使用备用 URL 的状态下
2. 用户点击"重试主URL"按钮
3. 切换回主 URL 并重新尝试加载
4. 如果成功，切换回主 URL 使用
```

## 配置说明

### 环境变量

在 `.env.local` 中配置：

```bash
# 主 DrawIO URL
NEXT_PUBLIC_DRAWIO_BASE_URL=https://embed.diagrams.net

# 或使用其他 URL
NEXT_PUBLIC_DRAWIO_BASE_URL=https://app.diagrams.net

# 或使用自托管版本
NEXT_PUBLIC_DRAWIO_BASE_URL=https://your-drawio.com
```

### 代码配置

在 `app/page.tsx` 中调整参数：

```typescript
useDrawioFallback({
    primaryUrl: process.env.NEXT_PUBLIC_DRAWIO_BASE_URL,
    fallbackUrl: "https://app.diagrams.net",  // 修改备用 URL
    timeout: 20000,                            // 调整超时时间
    enableFallback: true,                      // 启用/禁用降级
    onFallback: (from, to) => {
        // 自定义降级处理
        analytics.track('drawio_fallback', { from, to });
    },
});
```

## 监控和日志

### 控制台日志

系统会在关键操作时输出日志：

```javascript
// 降级时
[DrawIO Fallback] 主URL加载失败: https://embed.diagrams.net，切换到备用URL: https://app.diagrams.net

// 超时时
[DrawIO Fallback] 加载超时 (15000ms): https://embed.diagrams.net

// 成功时
[DrawIO Fallback] 加载成功: https://app.diagrams.net (备用URL)

// 重试时
[DrawIO Fallback] 重试主URL: https://embed.diagrams.net
```

### 集成监控系统（可选）

```typescript
useDrawioFallback({
    onFallback: (from, to) => {
        // 发送到分析系统
        gtag('event', 'drawio_fallback', { from, to });
        
        // 发送到错误监控
        Sentry.captureMessage('DrawIO fallback occurred', {
            level: 'warning',
            extra: { from, to },
        });
    },
});
```

## 用户体验改进

### 1. 加载状态

```tsx
{isDrawioLoading && (
    <div className="loading">
        <Spinner />
        <p>
            加载编辑器...
            {isFallback && " (使用备用URL)"}
        </p>
    </div>
)}
```

### 2. 降级警告

```tsx
{isFallback && !error && (
    <div className="warning">
        ⚠️ 已自动切换到备用服务器
    </div>
)}
```

### 3. 错误处理

```tsx
{error && isFallback && (
    <div className="error">
        <h2>加载失败</h2>
        <p>{error}</p>
        <p>已尝试备用URL但仍然失败</p>
        <button onClick={retryPrimary}>
            重试主URL
        </button>
    </div>
)}
```

## 测试清单

- [ ] 主 URL 正常加载
- [ ] 主 URL 超时自动降级
- [ ] 备用 URL 加载成功
- [ ] 两个 URL 都失败时的错误提示
- [ ] 重试主 URL 功能
- [ ] 降级时的用户提示
- [ ] 控制台日志输出
- [ ] 移动端兼容性
- [ ] 环境变量配置生效

## 常见问题

### Q: 如何禁用自动降级？

A: 在调用 `useDrawioFallback` 时设置 `enableFallback: false`

```typescript
useDrawioFallback({
    enableFallback: false,
});
```

### Q: 如何调整超时时间？

A: 修改 `timeout` 参数（单位：毫秒）

```typescript
useDrawioFallback({
    timeout: 30000, // 30秒
});
```

### Q: 如何使用自己的备用 URL？

A: 修改 `fallbackUrl` 参数

```typescript
useDrawioFallback({
    fallbackUrl: "https://your-drawio-backup.com",
});
```

### Q: 降级后如何自动切换回主 URL？

A: 可以在 `onFallback` 回调中设置定时器

```typescript
useDrawioFallback({
    onFallback: () => {
        // 5分钟后自动重试主URL
        setTimeout(() => {
            retryPrimary();
        }, 5 * 60 * 1000);
    },
});
```

## 未来改进

- [ ] 支持多个备用 URL（级联降级）
- [ ] 记录降级历史到 localStorage
- [ ] 智能选择最快的 URL
- [ ] 健康检查机制
- [ ] 自动恢复到主 URL
- [ ] A/B 测试不同 URL 的性能

## 相关资源

- [DrawIO 官方文档](https://www.diagrams.net/doc/)
- [react-drawio GitHub](https://github.com/jgraph/react-drawio)
- [自托管 DrawIO](https://github.com/jgraph/docker-drawio)
- [DrawIO 配置文档](./DRAWIO_ENV_CONFIG.md)

## 贡献者

- 实现时间: 2025-01-19
- 版本: 1.0.0
