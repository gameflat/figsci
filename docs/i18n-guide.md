# 多语言国际化指南

## 概述

FlowPilot 现已支持中文和英文双语切换，用户可以通过导航栏的语言切换按钮轻松切换界面语言。

## 技术实现

### 1. 核心组件

- **LocaleContext** (`contexts/locale-context.tsx`): 提供全局语言状态管理
- **LanguageSwitcher** (`components/language-switcher.tsx`): 语言切换按钮组件

### 2. 特性

- ✅ 自动检测浏览器语言（首次访问时）
- ✅ 本地存储用户语言偏好
- ✅ 支持嵌套翻译键（如 `common.title`）
- ✅ 自动更新 HTML lang 属性
- ✅ 零依赖，轻量级实现

## 使用方法

### 在组件中使用翻译

```tsx
import { useLocale } from "@/contexts/locale-context";

function MyComponent() {
  const { t, locale, setLocale } = useLocale();

  return (
    <div>
      <h1>{t("common.title")}</h1>
      <p>{t("common.description")}</p>
      <button onClick={() => setLocale(locale === "zh" ? "en" : "zh")}>
        Switch Language
      </button>
    </div>
  );
}
```

### 添加新的翻译

在 `contexts/locale-context.tsx` 中的 `zhTranslations` 和 `enTranslations` 对象中添加新的翻译键值对：

```typescript
// 中文翻译
const zhTranslations = {
  common: {
    newKey: "新的翻译",
  },
  // ...其他分类
};

// 英文翻译
const enTranslations = {
  common: {
    newKey: "New Translation",
  },
  // ...其他分类
};
```

### 翻译键的组织结构

翻译按照功能模块组织：

- `common`: 通用文本（标题、按钮等）
- `nav`: 导航相关
- `workspace`: 工作区相关
- `drawio`: DrawIO 编辑器相关
- `locale`: 语言切换相关

## 当前支持的语言

- 🇨🇳 中文 (zh)
- 🇬🇧 English (en)

## 扩展支持更多语言

如需添加新语言，请按以下步骤操作：

1. 在 `locale-context.tsx` 中更新 `Locale` 类型：
   ```typescript
   type Locale = "zh" | "en" | "ja"; // 添加日语
   ```

2. 创建新的翻译对象：
   ```typescript
   const jaTranslations = {
     common: { /* ... */ },
     // ...
   };
   ```

3. 更新 `getTranslation` 函数以支持新语言。

4. 更新 `LanguageSwitcher` 组件以支持更多语言选项。

## 最佳实践

1. **保持翻译键的一致性**: 使用点号分隔的命名空间（如 `module.feature.text`）
2. **避免硬编码文本**: 所有用户可见的文本都应该使用 `t()` 函数
3. **翻译完整性**: 确保所有语言的翻译键都有对应的值
4. **测试**: 切换语言后测试所有功能是否正常

## 示例

### 添加一个新的翻译页面

```tsx
"use client";
import { useLocale } from "@/contexts/locale-context";

export default function NewPage() {
  const { t } = useLocale();

  return (
    <div>
      <h1>{t("newPage.title")}</h1>
      <p>{t("newPage.description")}</p>
    </div>
  );
}
```

不要忘记在翻译文件中添加相应的键：

```typescript
// zhTranslations
newPage: {
  title: "新页面",
  description: "这是一个新页面的描述",
}

// enTranslations
newPage: {
  title: "New Page",
  description: "This is a description of the new page",
}
```

## 语言偏好持久化

用户的语言选择会自动保存到 localStorage，键名为 `flowpilot-locale`。下次访问时会自动恢复用户的语言偏好。

## 性能优化

- 翻译文件直接嵌入在 Context 中，无需额外的网络请求
- 使用 localStorage 缓存语言偏好，减少重复计算
- 避免闪烁：组件在初始化完成前不会渲染

## 故障排除

### 翻译键未找到

如果在控制台看到 `Translation key "xxx" not found` 警告：
1. 检查翻译键是否正确
2. 确认该键在两种语言的翻译对象中都存在
3. 检查键名的拼写和大小写

### 语言切换不生效

1. 确认 `LocaleProvider` 已在应用的根组件中正确包裹
2. 检查浏览器控制台是否有错误
3. 清除 localStorage 中的 `flowpilot-locale` 键，重新测试
