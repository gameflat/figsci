# Smart Drawio Next

> 用自然语言或参考图片，几秒钟生成==可编辑的专业科研== Draw.io 图表。

## 在线网站

进入在线网站直接使用：https://smart-drawio-next.vercel.app/

(需要自己有API-Key)

## 效果预览

![Transformer](./public/images/transformer.png)
![Swin-Transformer](./public/images/swin.png)
![CLIP](./public/images/clip.png)
![ProSST](./public/images/prosst.png)

## 项目简介

[smart-drawio-next](https://github.com/yunshenwuchuxun/smart-drawio-next) 将 Next.js 16、Draw.io embed 以及流式大模型调用组合在一起，让你可以：

- 使用自然语言描述或上传截图，自动生成结构化图表；
- 在 Monaco Editor 中微调生成的 JSON / XML 代码；
- 将结果一键同步到内嵌的 draw.io 画布进行可视化调整；
- 通过高级优化面板让 AI 继续清理布局、统一样式或添加注释。

项目已经内置了多模型配置、访问密码、历史记录、通知系统等配套功能，可以直接部署为个人效率工具或团队内部服务。

## 功能亮点

- **LLM 原生绘图体验**：流式显示生成进度，支持“继续生成”拆分长内容；可手动指定 20+ 图表类型或让模型自动选择（`lib/constants.js`）。
- **多模态输入**：拖拽 PNG/JPG/WebP/GIF（≤5 MB）或使用文件选择，配合 Vision 模型将已有图纸转成可编辑信息（`components/ImageUpload`）。
- **双画布联动**：Monaco 编辑器负责查看/修改原始代码，draw.io iframe 负责渲染与微调；支持随时重新应用代码（`components/CodeEditor` + `components/DrawioCanvas`）。
- **智能优化链路**：一键修复箭头锚点、线条宽度等常见问题（`lib/optimizeArrows`），或通过高级优化面板勾选/自定义需求交给 AI 再处理（`components/OptimizationPanel`）。
- **配置管理器**：UI 里即可创建、复制、导入/导出任意数量的 OpenAI/Anthropic 兼容配置，支持在线测试模型列表（`components/ConfigManager`）。
- **历史记录 & 通知**：最近 20 条生成记录保存在浏览器 localStorage，可随时回放（`lib/history-manager`）；通知、确认弹窗等提升整体 UX。

## 界面与模块

1. **交互区（Chat + ImageUpload）**  
   - 选择图表类型、输入自然语言或上传参考图片；  
   - 支持中途停止、继续生成、查看 API 错误提示。
2. **生成代码区（CodeEditor）**  
   - Monaco Editor 展示 JSON / XML，提供清空、优化、高级优化、应用等动作；  
   - JSON 解析失败会即时提示错误来源。
3. **画布区（DrawioCanvas / ExcalidrawCanvas）**  
   - 内嵌 draw.io iframe，生成后的 XML 可直接渲染并继续可视化微调；  
   - 也可将 JSON 元素映射成 Draw.io 组件。
4. **辅助弹窗**  
   - `ConfigManager`：多配置管理、在线测试、导入导出；  
   - `AccessPasswordModal`：启用访问密码与验证；  
   - `HistoryModal`、`ContactModal`、`OptimizationPanel` 等。

## 技术栈

- **前端框架**：Next.js 16 (App Router) + React 19
- **画布**：Draw.io embed
- **编辑器**：@monaco-editor/react
- **样式**：Tailwind CSS v4 (实验版) + 自定义设计系统
- **LLM 接入**：OpenAI / Anthropic 兼容接口，Server Actions + Edge API 路由
- **状态持久化**：localStorage（配置、历史、访问密码开关）

## 快速开始

### 环境要求

- Node.js ≥ 18.18（Next.js 16 官方要求）
- pnpm ≥ 8（推荐，其他包管理器需自行调整命令）
- 可用的 OpenAI / Anthropic 兼容 API Key（或已启用访问密码的服务器端配置）

### 安装与启动

```bash
# 克隆仓库
git clone https://github.com/yunshenwuchuxun/smart-drawio-next.git
cd smart-drawio-next

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000 即可体验。

### 常用脚本

| 命令        | 说明                                   |
|-------------|----------------------------------------|
| `pnpm dev`  | 启动开发环境（含 webpack overlay）      |
| `pnpm build`| 生产构建                               |
| `pnpm start`| 以生产模式启动（需先执行 `pnpm build`） |
| `pnpm lint` | 运行 ESLint                            |

## LLM 配置与访问密码

### 前端多配置管理（默认方式）

1. 打开右上角 **“配置 LLM”**。
2. 选择提供商（OpenAI / Anthropic / 兼容中转）。
3. 填写 `Base URL`、`API Key`、`Model` 等信息，可点击“测试连接”实时校验。
4. 保存后即可在列表中切换、克隆、导出或导入配置，所有数据仅存于浏览器 localStorage。

### 服务端统一配置（访问密码模式，可选）

若想让用户共享同一套 Key，可在服务器启用访问密码：

1. 复制示例配置：`cp .env.example .env`。
2. 在 `.env` 中填入以下变量：

| 变量名                | 作用说明                                                  |
|-----------------------|-----------------------------------------------------------|
| `ACCESS_PASSWORD`     | 用户需要输入的访问密码                                    |
| `SERVER_LLM_TYPE`     | `openai` 或 `anthropic`                                   |
| `SERVER_LLM_BASE_URL` | 兼容接口地址（如 `https://api.openai.com/v1`）           |
| `SERVER_LLM_API_KEY`  | 后端持有的 Key，仅驻留服务器                              |
| `SERVER_LLM_MODEL`    | 默认使用的模型名称                                        |

3. 重启服务后，用户在前端点击“访问密码”输入密码并启用，即可让 `/api/generate` 自动读取服务端配置；启用后优先级高于本地配置。

> ✅ 访问密码只会在服务器端验证，真实的 API Key 不会透传到浏览器。

## 常见问题

- **API Key 会被上传吗？**  
  不会。本地配置保存在浏览器 localStorage，只在调用 `/api/generate` 时随请求发送给自身服务端，再由服务端去请求外部 LLM。

- **生成被截断怎么办？**  
  当响应过长时会自动提示“继续生成”按钮。点击后会携带上下文向 `/api/generate` 发送 `isContinuation=true`。

- **图片识别失败？**  
  请选择支持 Vision 的模型（如 GPT-4o、GPT-4.1、claude-3.5-sonnet 等），并确保图片小于 5 MB 且为常见格式。

- **历史记录占空间？**  
  历史记录最多保留 20 条，可在“历史记录”弹窗中手动删除或一键清空。

- **访问密码提示未配置？**  
  需要同时设置 `ACCESS_PASSWORD` 与一整套 `SERVER_LLM_*` 变量，否则校验接口会返回 “服务器未配置访问密码”。

## 贡献

1. 项目在此项目上修改：https://github.com/liujuntao123/smart-excalidraw-next
2. 十分感谢L站所有开公益站的佬友！
3. 如果这个项目对你有帮助，欢迎通过以下方式支持：
   - ⭐ 给项目点个 Star
   - 💬 分享给更多需要的人

## 许可证

MIT License – 可在保留版权声明的前提下自由使用、复制与分发。
