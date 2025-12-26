// -*- coding: utf-8 -*-
/**
 * Python 代码执行 API
 * 
 * 安全执行 Python 代码，主要用于生成数据分析图表（折线图、散点图、热力图等）
 * 使用 child_process 执行 Python 代码，并返回生成的 SVG 图像
 */

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

// 从环境变量获取配置，提供默认值
const PYTHON_EXECUTION_TIMEOUT = parseInt(process.env.PYTHON_EXECUTION_TIMEOUT || '30000', 10); // 默认30秒
const PYTHON_EXECUTION_MEMORY_LIMIT = process.env.PYTHON_EXECUTION_MEMORY_LIMIT || '512m'; // 默认512MB

/**
 * 生成安全的 Python 代码包装器
 * 限制危险操作，确保代码安全执行
 * 
 * @param {string} userCode - 用户提供的 Python 代码
 * @returns {string} 包装后的安全 Python 代码
 */
function wrapPythonCode(userCode) {
  // 将用户代码的每一行添加正确的缩进（8个空格，因为 with 块需要4个空格，with 内部又需要4个空格）
  const indentedUserCode = userCode
    .split('\n')
    .map(line => {
      // 如果行不为空，添加8个空格的缩进
      if (line.trim().length > 0) {
        return '        ' + line;
      }
      // 空行保持原样
      return line;
    })
    .join('\n');
  
  return `# -*- coding: utf-8 -*-
import sys
import io
import json
import base64
from contextlib import redirect_stdout, redirect_stderr

# 确保使用 UTF-8 编码
if sys.version_info[0] >= 3:
    import locale
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# 禁用危险模块（但保留 sys 的基础功能）
# 注意：不能删除 sys 模块，因为很多库依赖它，但可以限制某些危险属性
forbidden_modules = ['os', 'subprocess', 'shutil', 'socket', 'urllib', 'http', 'requests', 'ftplib', 'smtplib']
for module in forbidden_modules:
    if module in sys.modules:
        del sys.modules[module]

# 重定向标准输出和错误
stdout_capture = io.StringIO()
stderr_capture = io.StringIO()

try:
    with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
        # 用户代码（已添加正确缩进）
${indentedUserCode}
        
        # 检查是否有 matplotlib 图形
        import matplotlib
        matplotlib.use('SVG')
        import matplotlib.pyplot as plt
        
        # 如果图形已创建，保存为 SVG
        if plt.get_fignums():
            svg_buffer = io.StringIO()
            plt.savefig(svg_buffer, format='svg', bbox_inches='tight')
            svg_content = svg_buffer.getvalue()
            plt.close('all')
            
            result = {
                "success": True,
                "svg": svg_content,
                "stdout": stdout_capture.getvalue(),
                "stderr": stderr_capture.getvalue()
            }
        else:
            result = {
                "success": True,
                "svg": None,
                "stdout": stdout_capture.getvalue(),
                "stderr": stderr_capture.getvalue(),
                "message": "代码执行成功，但未生成图形。请确保使用 matplotlib 或 seaborn 创建图形。"
            }
except Exception as e:
    result = {
        "success": False,
        "error": str(e),
        "stdout": stdout_capture.getvalue(),
        "stderr": stderr_capture.getvalue()
    }

# 输出 JSON 结果
print(json.dumps(result))
`;
}

/**
 * POST /api/execute-python
 * 执行 Python 代码并返回生成的 SVG 图像
 * 
 * @param {Request} req - Next.js 请求对象
 * @returns {Promise<NextResponse>} 返回执行结果，包含 SVG 或错误信息
 */
export async function POST(req) {
  let tempFile = null;
  
  try {
    const { code } = await req.json();
    
    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json(
        { error: "缺少必需的参数：code" },
        { status: 400 }
      );
    }
    
    // 包装用户代码以确保安全执行
    const wrappedCode = wrapPythonCode(code);
    
    // 创建临时文件保存 Python 代码
    const tempDir = tmpdir();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    tempFile = join(tempDir, `python_exec_${timestamp}_${randomStr}.py`);
    
    await writeFile(tempFile, wrappedCode, 'utf-8');
    
    // 构建 Python 执行命令
    // 使用 timeout 命令限制执行时间（如果可用）
    // 注意：Windows 可能不支持 timeout，需要处理
    const isWindows = process.platform === 'win32';
    let command;
    
    if (isWindows) {
      // Windows: 使用 Python 直接执行，超时在 Node.js 层面控制
      command = `python "${tempFile}"`;
    } else {
      // Linux/Mac: 使用 timeout 命令限制执行时间
      const timeoutSeconds = Math.ceil(PYTHON_EXECUTION_TIMEOUT / 1000);
      command = `timeout ${timeoutSeconds}s python3 "${tempFile}"`;
    }
    
    console.log("[Python执行] 开始执行 Python 代码", {
      tempFile,
      timeout: PYTHON_EXECUTION_TIMEOUT,
      platform: process.platform
    });
    
    // 执行 Python 代码
    const startTime = Date.now();
    let execResult;
    
    try {
      // 设置超时
      execResult = await Promise.race([
        execAsync(command, {
          maxBuffer: 10 * 1024 * 1024, // 10MB 输出缓冲区
          env: {
            ...process.env,
            PYTHONUNBUFFERED: '1', // 确保输出实时
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('执行超时')), PYTHON_EXECUTION_TIMEOUT)
        )
      ]);
    } catch (error) {
      // 处理超时或执行错误
      if (error.message === '执行超时') {
        return NextResponse.json(
          { 
            error: "代码执行超时",
            message: `执行时间超过 ${PYTHON_EXECUTION_TIMEOUT / 1000} 秒限制`
          },
          { status: 408 } // 408 Request Timeout
        );
      }
      throw error;
    }
    
    const duration = Date.now() - startTime;
    console.log("[Python执行] 执行完成", { duration, hasOutput: !!execResult.stdout });
    
    // 解析执行结果
    const output = execResult.stdout.trim();
    const errorOutput = execResult.stderr.trim();
    
    // 尝试从输出中提取 JSON 结果
    let result;
    try {
      // 查找 JSON 对象（可能在输出的最后）
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // 如果没有找到 JSON，可能是纯文本输出
        result = {
          success: false,
          error: "无法解析执行结果",
          stdout: output,
          stderr: errorOutput
        };
      }
    } catch (parseError) {
      // JSON 解析失败
      result = {
        success: false,
        error: "执行结果格式错误",
        stdout: output,
        stderr: errorOutput,
        parseError: parseError.message
      };
    }
    
    // 清理临时文件
    try {
      await unlink(tempFile);
      tempFile = null;
    } catch (cleanupError) {
      console.warn("[Python执行] 清理临时文件失败:", cleanupError);
    }
    
    // 返回结果
    if (result.success) {
      return NextResponse.json({
        success: true,
        svg: result.svg,
        stdout: result.stdout,
        stderr: result.stderr,
        message: result.message,
        duration
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "代码执行失败",
          stdout: result.stdout,
          stderr: result.stderr || errorOutput,
          duration
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("[Python执行] 执行异常:", error);
    
    // 清理临时文件
    if (tempFile) {
      try {
        await unlink(tempFile);
      } catch (cleanupError) {
        console.warn("[Python执行] 清理临时文件失败:", cleanupError);
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Python 代码执行失败",
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

