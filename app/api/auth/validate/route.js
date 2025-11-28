// -*- coding: utf-8 -*-
/**
 * 访问密码验证 API 路由
 * 
 * 此路由用于验证客户端提交的访问密码是否与服务器配置的密码匹配。
 * 主要用于保护应用的访问权限，确保只有拥有正确密码的用户才能使用应用。
 * 
 * @file app/api/auth/validate/route.js
 * @description Next.js API 路由处理器，处理 POST 请求进行密码验证
 */

import { NextResponse } from 'next/server';

/**
 * 处理密码验证的 POST 请求
 * 
 * 接收客户端发送的密码，与环境变量中配置的访问密码进行比对，
 * 返回验证结果。支持以下响应：
 * - 200: 密码验证成功
 * - 400: 服务器未配置访问密码（配置错误）
 * - 401: 密码错误（验证失败）
 * - 500: 服务器内部错误（请求解析失败等）
 * 
 * @param {Request} request - Next.js 请求对象，包含客户端提交的数据
 * @returns {Promise<NextResponse>} 返回包含验证结果的 JSON 响应
 * 
 * @example
 * // 请求体示例
 * {
 *   "password": "user_provided_password"
 * }
 * 
 * // 成功响应示例
 * {
 *   "valid": true,
 *   "message": "密码验证成功"
 * }
 * 
 * // 失败响应示例
 * {
 *   "valid": false,
 *   "message": "密码错误"
 * }
 */
export async function POST(request) {
  try {
    // 从请求体中解析客户端提交的密码
    // request.json() 返回一个 Promise，需要 await 等待解析完成
    const { password } = await request.json();

    // 从环境变量中获取服务器配置的访问密码
    // ACCESS_PASSWORD 应在 .env.local 或部署环境中配置
    const accessPassword = process.env.ACCESS_PASSWORD;

    // 检查服务器是否配置了访问密码
    // 如果未配置，说明系统配置有误，返回 400 错误
    if (!accessPassword) {
      return NextResponse.json(
        { valid: false, message: '服务器未配置访问密码' },
        { status: 400 } // 400 Bad Request: 客户端请求语法错误或服务器无法理解
      );
    }

    // 将客户端提交的密码与服务器配置的密码进行严格比对
    // 使用 === 进行精确匹配（包括类型检查）
    if (password === accessPassword) {
      // 密码匹配成功，返回验证通过的结果
      // 状态码默认为 200，表示请求成功处理
      return NextResponse.json({ valid: true, message: '密码验证成功' });
    }

    // 密码不匹配，返回验证失败的结果
    // 401 Unauthorized: 表示客户端未通过身份验证
    return NextResponse.json(
      { valid: false, message: '密码错误' },
      { status: 401 }
    );
  } catch (error) {
    // 捕获所有可能的错误，例如：
    // - JSON 解析失败（请求体格式错误）
    // - 网络错误
    // - 其他未预期的异常
    // 返回通用的服务器错误响应
    // 500 Internal Server Error: 服务器内部错误
    return NextResponse.json(
      { valid: false, message: '验证失败' },
      { status: 500 }
    );
  }
}
