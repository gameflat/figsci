// -*- coding: utf-8 -*-
/**
 * Python 代码执行 API
 * 
 * 提供安全的 Python 代码执行功能，用于生成数据可视化图表。
 * 此 API 由前端的 execute_python 工具调用触发。
 */

import { executePythonCode } from "@/lib/python-executor";

/**
 * POST /api/python-execute
 * 执行 Python 代码并返回 SVG 结果
 * 
 * @param {Request} req - Next.js 请求对象
 * @returns {Promise<Response>} 返回执行结果（JSON）
 */
export async function POST(req) {
  try {
    const { code, description } = await req.json();

    // 验证参数
    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return Response.json(
        { error: "缺少必需的参数：code" },
        { status: 400 }
      );
    }

    // 记录执行开始
    console.log("\n" + "=".repeat(60));
    console.log("【Python 执行器】开始执行 Python 代码");
    console.log("-".repeat(60));
    if (description) {
      console.log(`描述: ${description}`);
    }
    console.log(`代码长度: ${code.length} 字符`);
    console.log("=".repeat(60) + "\n");

    // 执行 Python 代码
    const result = await executePythonCode(code, {
      timeout: 30000, // 30 秒超时
      maxOutputSize: 10485760, // 10MB 最大输出
    });

    // 记录执行结果
    if (result.success) {
      console.log("\n" + "✅".repeat(30));
      console.log("【Python 执行器】执行成功");
      console.log("-".repeat(60));
      console.log(`SVG 长度: ${result.svg?.length || 0} 字符`);
      console.log("✅".repeat(30) + "\n");
    } else {
      console.log("\n" + "❌".repeat(30));
      console.log("【Python 执行器】执行失败");
      console.log("-".repeat(60));
      console.log(`错误: ${result.error}`);
      if (result.stderr) {
        console.log(`标准错误: ${result.stderr.substring(0, 500)}`);
      }
      console.log("❌".repeat(30) + "\n");
    }

    // 返回结果
    return Response.json(result);
  } catch (error) {
    console.error("Python 执行 API 错误:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Response.json(
      {
        success: false,
        svg: null,
        error: `内部服务器错误: ${errorMessage}`,
        stdout: null,
        stderr: null,
      },
      { status: 500 }
    );
  }
}

