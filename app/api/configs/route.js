// -*- coding: utf-8 -*-
/**
 * LLM 配置连接测试 API 路由
 * 
 * 此路由用于测试 LLM 提供商配置的有效性，验证 API 连接是否正常。
 * 主要用于配置管理界面，允许用户在保存配置前验证配置是否正确。
 * 通过调用提供商的 API 来获取可用模型列表，从而验证配置的有效性。
 * 
 * @file app/api/configs/route.js
 * @description Next.js API 路由处理器，处理 POST 请求进行 LLM 配置连接测试
 */

import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/llm-client';

/**
 * 处理 LLM 配置连接测试的 POST 请求
 * 
 * 接收客户端提交的 LLM 提供商配置信息，调用测试函数验证配置的有效性。
 * 测试过程会尝试连接到提供商的 API 并获取可用模型列表，以验证配置是否正确。
 * 
 * 支持的响应状态码：
 * - 200: 连接测试完成（无论成功或失败，都会返回测试结果）
 * - 400: 请求参数错误（缺少必需的 config 参数）
 * - 500: 服务器内部错误（测试过程中发生未预期的异常）
 * 
 * @param {Request} request - Next.js 请求对象，包含客户端提交的配置数据
 * @returns {Promise<NextResponse>} 返回包含测试结果的 JSON 响应
 * 
 * @example
 * // 请求体示例
 * {
 *   "config": {
 *     "type": "openai",
 *     "baseUrl": "https://api.openai.com/v1",
 *     "apiKey": "sk-...",
 *     "model": "gpt-4"
 *   }
 * }
 * 
 * // 成功响应示例
 * {
 *   "success": true,
 *   "message": "连接成功，找到 10 个可用模型",
 *   "models": ["gpt-4", "gpt-3.5-turbo", ...]
 * }
 * 
 * // 失败响应示例
 * {
 *   "success": false,
 *   "message": "连接失败: API key 无效"
 * }
 */
export async function POST(request) {
  try {
    // 从请求体中解析客户端提交的 LLM 配置信息
    // config 对象应包含：type（提供商类型）、baseUrl（API 地址）、apiKey（API 密钥）、model（模型名称）
    const { config } = await request.json();

    // 验证必需的参数是否存在
    // 如果缺少 config 参数，返回 400 错误，提示客户端提供完整的配置信息
    if (!config) {
      return NextResponse.json(
        { error: 'Missing required parameter: config' },
        { status: 400 } // 400 Bad Request: 请求参数不完整
      );
    }

    // 调用测试连接函数，验证配置的有效性
    // testConnection 函数会尝试连接到 LLM 提供商的 API 并获取可用模型列表
    // 返回结果包含 success 状态、消息和可选的模型列表
    const result = await testConnection(config);

    // 返回测试结果
    // 无论测试成功或失败，都会返回结果对象，由客户端根据 success 字段判断
    // 状态码为 200，表示请求处理成功（测试本身的结果在返回数据中体现）
    return NextResponse.json(result);
  } catch (error) {
    // 捕获所有可能的错误，例如：
    // - JSON 解析失败（请求体格式错误）
    // - testConnection 函数内部异常
    // - 网络连接问题
    // - 其他未预期的错误
    console.error('Error testing connection:', error);

    // 返回通用的服务器错误响应
    // 包含错误信息，便于客户端显示给用户和开发者调试
    // 500 Internal Server Error: 服务器内部错误
    return NextResponse.json(
      {
        success: false, // 明确标识测试失败
        message: error.message || '连接测试失败' // 使用错误消息或默认消息
      },
      { status: 500 }
    );
  }
}