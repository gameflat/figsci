/**
 * LLM 模型列表获取 API 路由
 * 
 * 此路由用于从配置的 LLM 提供商获取可用的模型列表。
 * 主要用于配置管理界面，允许用户查看并选择可用的模型进行配置。
 * 
 * 支持的提供商类型：
 * - OpenAI: 使用 OpenAI 兼容的 API（如 OpenAI、OpenRouter、DeepSeek 等）
 * - Anthropic: 使用 Anthropic 兼容的 API
 * 
 * 此路由通过查询提供商的模型列表端点来获取可用模型，并统一格式化返回结果。
 * 
 * @file app/api/models/route.js
 * @description Next.js API 路由处理器，处理 GET 请求获取 LLM 提供商可用模型列表
 */

import { NextResponse } from 'next/server';
import { fetchModels } from '@/lib/llm-client';

/**
 * 处理获取模型列表的 GET 请求
 * 
 * 接收查询参数中的 LLM 提供商配置信息，调用提供商 API 获取可用模型列表。
 * 模型列表通常用于配置管理界面，帮助用户了解并选择可用的模型。
 * 
 * 请求参数（URL 查询参数）：
 * - type: 提供商类型（必需），支持 'openai' 或 'anthropic'
 * - baseUrl: API 基础 URL（必需），例如 'https://api.openai.com/v1'
 * - apiKey: API 密钥（必需），用于认证
 * 
 * 支持的响应状态码：
 * - 200: 成功获取模型列表
 * - 400: 请求参数错误（缺少必需参数）
 * - 500: 服务器内部错误（API 调用失败、网络错误等）
 * 
 * @param {Request} request - Next.js 请求对象，包含查询参数
 * @returns {Promise<NextResponse>} 返回包含模型列表的 JSON 响应
 * 
 * @example
 * // 请求示例 - 获取 OpenAI 模型列表
 * GET /api/models?type=openai&baseUrl=https://api.openai.com/v1&apiKey=sk-...
 * 
 * // 成功响应示例
 * {
 *   "models": [
 *     { "id": "gpt-4", "name": "gpt-4" },
 *     { "id": "gpt-3.5-turbo", "name": "gpt-3.5-turbo" },
 *     ...
 *   ]
 * }
 * 
 * @example
 * // 请求示例 - 获取 Anthropic 模型列表
 * GET /api/models?type=anthropic&baseUrl=https://api.anthropic.com&apiKey=sk-ant-...
 * 
 * @example
 * // 错误响应示例 - 缺少参数
 * {
 *   "error": "Missing required parameters: type, baseUrl, apiKey"
 * }
 */
export async function GET(request) {
  try {
    // 从请求 URL 的查询参数中提取配置信息
    // 查询参数格式：?type=openai&baseUrl=https://api.openai.com/v1&apiKey=sk-...
    const { searchParams } = new URL(request.url);
    
    // 获取必需的三個查询参数
    const type = searchParams.get('type');        // 提供商类型：'openai' 或 'anthropic'
    const baseUrl = searchParams.get('baseUrl');  // API 基础 URL
    const apiKey = searchParams.get('apiKey');    // API 密钥（用于认证）

    // 验证必需的参数是否都已提供
    // 这三个参数都是必需的，缺少任意一个都无法调用提供商的 API
    if (!type || !baseUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameters: type, baseUrl, apiKey' },
        { status: 400 } // 400 Bad Request: 请求参数不完整
      );
    }

    // 调用 fetchModels 函数获取可用模型列表
    // 该函数会根据提供商类型（type）调用相应的 API 端点
    // - OpenAI: GET {baseUrl}/models (使用 Bearer token 认证)
    // - Anthropic: GET {baseUrl}/models (使用 x-api-key 认证)
    // 函数会统一格式化返回结果，确保模型列表的结构一致
    const models = await fetchModels(type, baseUrl, apiKey);

    // 返回模型列表
    // 返回格式：{ models: [{ id: "...", name: "..." }, ...] }
    return NextResponse.json({ models });
  } catch (error) {
    // 捕获所有可能的错误，例如：
    // - fetchModels 函数内部异常（API 调用失败）
    // - 网络连接错误
    // - API 认证失败（401/403）
    // - 提供商 API 返回错误
    // - 不支持提供商类型
    console.error('Error fetching models:', error);

    // 返回错误响应
    // 包含错误信息，便于客户端显示给用户和开发者调试
    // 500 Internal Server Error: 服务器内部错误
    return NextResponse.json(
      { error: error.message || 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

