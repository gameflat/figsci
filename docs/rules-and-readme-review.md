# 规则文件和 README 检查报告

## 📋 检查日期
2024-12-06

## 📊 检查范围

### 规则文件（.cursor/rules/）
- ✅ ai-agents-workflow.mdc
- ✅ api-routes.mdc
- ✅ chinese-first.mdc
- ✅ code-comments.mdc
- ✅ data-persistence.mdc
- ✅ dependency-management.mdc
- ✅ environment-variables.mdc
- ✅ error-handling.mdc
- ✅ file-naming.mdc
- ✅ internationalization.mdc
- ✅ performance-optimization.mdc
- ✅ project-structure.mdc
- ✅ react-components.mdc
- ✅ security.mdc
- ✅ state-management.mdc
- ✅ template-system.mdc
- ✅ testing.mdc
- ✅ type-definitions.mdc
- ✅ ui-ux-design.mdc

### README 文件
- ✅ README.md
- ✅ README_CN.md

---

## 🔍 发现的问题和改进建议

### 1. 规则文件需要补充的内容

#### 1.1 缺少光子扣费功能规范 ⚠️

**问题**：项目已集成玻尔平台光子扣费功能，但规则文件中没有相关规范。

**建议**：创建新规则文件 `.cursor/rules/photon-charge.mdc`

**内容应包括**：
- 光子扣费功能的基本概念和使用场景
- 环境变量配置规范（BOHRIUM_* 相关变量）
- API 路由实现规范（`/api/photon/charge` 和 `/api/photon/pre-charge`）
- 客户端工具函数使用规范（`lib/photon-client.js`）
- 扣费模式说明（fixed/token/mixed）
- 错误处理和降级策略
- 开发调试指南

#### 1.2 API 路由规范需要补充 ⚠️

**问题**：`api-routes.mdc` 中缺少一些重要 API 端点的说明。

**建议**：在 `api-routes.mdc` 中补充以下 API 端点：

1. **光子扣费相关**：
   - `POST /api/photon/charge` - 光子扣费
   - `POST /api/photon/pre-charge` - 预扣费检查

2. **模板匹配相关**：
   - `POST /api/template-match` - 智能模板匹配
   - `POST /api/search-template` - 模板搜索

3. **系统模型相关**：
   - `GET /api/system-models` - 获取系统内置模型列表

4. **模型管理相关**：
   - `GET /api/models` - 获取模型列表
   - `POST /api/configs` - 配置管理

5. **认证相关**：
   - `POST /api/auth/validate` - 认证验证

#### 1.3 环境变量规范需要更新 ⚠️

**问题**：`environment-variables.mdc` 中缺少光子扣费相关的环境变量说明。

**建议**：在 `environment-variables.mdc` 中补充：

```javascript
// ===== 玻尔平台光子扣费配置 =====
// 是否启用光子扣费功能
NEXT_PUBLIC_ENABLE_PHOTON_CHARGE=false

// SKU ID（必需，如果启用扣费）
BOHRIUM_SKU_ID=

// 开发者 Access Key（用于开发调试）
BOHRIUM_DEV_ACCESS_KEY=

// 扣费模式：'fixed' | 'token' | 'mixed'
BOHRIUM_CHARGE_MODE=fixed

// 固定扣费金额
BOHRIUM_CHARGE_PER_REQUEST=1

// 基于 Token 的扣费金额
BOHRIUM_CHARGE_PER_1K_TOKEN=1

// 用户界面显示配置
NEXT_PUBLIC_BOHRIUM_CHARGE_MODE=fixed
NEXT_PUBLIC_PHOTON_CHARGE_PER_MESSAGE=1
NEXT_PUBLIC_PHOTON_CHARGE_PER_1K_TOKEN=1
```

#### 1.4 项目结构规范需要更新 ⚠️

**问题**：`project-structure.mdc` 中缺少新功能的目录说明。

**建议**：更新 `project-structure.mdc`，补充：

- `app/api/photon/` - 光子扣费 API 路由
- `lib/photon-client.js` - 光子扣费客户端工具
- `lib/charge-utils.js` - 扣费信息工具函数
- `components/photon-charge-notice.jsx` - 扣费提示组件

---

### 2. README 文件需要更新的内容

#### 2.1 README_CN.md 需要补充 ⚠️

**问题**：中文 README 中提到了光子扣费配置，但功能说明不够详细。

**建议**：在 `README_CN.md` 中补充：

1. **在"核心特性"部分添加**：
   ```markdown
   - 💰 **光子扣费**：支持玻尔平台光子自动扣费，灵活配置扣费模式
   ```

2. **在"配置说明"部分补充**：
   ```markdown
   # 可选：玻尔平台光子扣费（详见文档）
   NEXT_PUBLIC_ENABLE_PHOTON_CHARGE=false
   BOHRIUM_SKU_ID=your-sku-id
   BOHRIUM_DEV_ACCESS_KEY=your-access-key
   BOHRIUM_CHARGE_MODE=fixed
   BOHRIUM_CHARGE_PER_REQUEST=1
   BOHRIUM_CHARGE_PER_1K_TOKEN=1
   ```

3. **在"文档"部分添加链接**：
   ```markdown
   - [玻尔平台光子扣费集成](./docs/bohrium-photon-integration.md) - 光子扣费功能完整指南
   - [光子扣费快速开始](./docs/bohrium-photon-quickstart.md) - 5 分钟快速配置
   ```

#### 2.2 README.md 需要补充 ⚠️

**问题**：英文 README 中完全缺少光子扣费功能的说明。

**建议**：在 `README.md` 中补充：

1. **在"Core Features"部分添加**：
   ```markdown
   - 💰 **Photon Charging**: Automatic charging via Bohrium Platform Photon with flexible billing modes
   ```

2. **在"Configuration"部分补充**：
   ```markdown
   # Optional: Bohrium Platform Photon Charge (see documentation)
   NEXT_PUBLIC_ENABLE_PHOTON_CHARGE=false
   BOHRIUM_SKU_ID=your-sku-id
   BOHRIUM_DEV_ACCESS_KEY=your-access-key
   BOHRIUM_CHARGE_MODE=fixed
   BOHRIUM_CHARGE_PER_REQUEST=1
   BOHRIUM_CHARGE_PER_1K_TOKEN=1
   ```

3. **在"Documentation"部分添加链接**：
   ```markdown
   - [Bohrium Photon Integration](./docs/bohrium-photon-integration.md) - Complete guide for photon charging
   - [Photon Quick Start](./docs/bohrium-photon-quickstart.md) - 5-minute setup guide
   ```

#### 2.3 两个 README 都需要更新技术栈 ⚠️

**问题**：技术栈部分可能缺少一些新依赖。

**建议**：检查并更新技术栈部分，确保包含所有主要依赖。

---

### 3. 其他建议

#### 3.1 创建 API 端点索引文档 📝

**建议**：创建 `docs/api-endpoints.md`，列出所有 API 端点及其用途：

```markdown
# API 端点索引

## 核心功能
- `POST /api/chat` - 图表生成（主要 API）
- `POST /api/diagram-repair` - 图表修复
- `POST /api/model-compare` - 模型对比

## 模板相关
- `POST /api/template-match` - 智能模板匹配
- `POST /api/search-template` - 模板搜索

## 模型管理
- `GET /api/models` - 获取模型列表
- `GET /api/system-models` - 获取系统内置模型列表
- `POST /api/configs` - 配置管理

## 光子扣费
- `POST /api/photon/charge` - 光子扣费
- `POST /api/photon/pre-charge` - 预扣费检查

## 认证
- `POST /api/auth/validate` - 认证验证
```

#### 3.2 统一文档链接格式 📝

**建议**：确保所有文档链接格式一致，使用相对路径。

---

## ✅ 优先级建议

### 高优先级（必须修复）
1. ✅ 在 README.md 中补充光子扣费功能说明
2. ✅ 更新 `environment-variables.mdc` 添加光子扣费环境变量
3. ✅ 更新 `api-routes.mdc` 补充所有 API 端点

### 中优先级（建议修复）
1. ⚠️ 创建 `photon-charge.mdc` 规则文件
2. ⚠️ 更新 `project-structure.mdc` 补充新功能目录
3. ⚠️ 在 README_CN.md 中完善光子扣费功能说明

### 低优先级（可选）
1. 📝 创建 API 端点索引文档
2. 📝 统一文档链接格式

---

## 📝 总结

### 规则文件状态
- ✅ 大部分规则文件完整且规范
- ⚠️ 缺少光子扣费功能规范
- ⚠️ API 路由规范需要补充
- ⚠️ 环境变量规范需要更新

### README 文件状态
- ✅ 中文 README 基本完整，但需要完善光子扣费说明
- ⚠️ 英文 README 缺少光子扣费功能说明
- ⚠️ 两个 README 都需要更新技术栈部分

### 建议行动
1. 立即更新 README.md 添加光子扣费功能
2. 更新环境变量规范文档
3. 补充 API 路由规范
4. 创建光子扣费功能规范文档（可选但推荐）

