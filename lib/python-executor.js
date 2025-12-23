// -*- coding: utf-8 -*-
/**
 * Python 代码执行器
 * 
 * 提供安全的 Python 代码执行功能，支持生成数据可视化图表。
 * 使用 Node.js child_process 在隔离的进程中执行 Python 代码。
 */

import { spawn } from "child_process";

/**
 * Python 执行结果
 * @typedef {Object} PythonExecutionResult
 * @property {boolean} success - 是否执行成功
 * @property {string|null} svg - 生成的 SVG 内容（成功时）
 * @property {string|null} error - 错误信息（失败时）
 * @property {string|null} stdout - 标准输出（用于调试）
 * @property {string|null} stderr - 标准错误输出（用于调试）
 */

/**
 * 执行 Python 代码并生成 SVG 图表
 * 
 * @param {string} code - 要执行的 Python 代码
 * @param {Object} options - 执行选项
 * @param {number} [options.timeout=30000] - 超时时间（毫秒），默认 30 秒
 * @param {number} [options.maxOutputSize=10485760] - 最大输出大小（字节），默认 10MB
 * @returns {Promise<PythonExecutionResult>} 执行结果
 */
export async function executePythonCode(code, options = {}) {
  const {
    timeout = 30000, // 30 秒超时
    maxOutputSize = 10485760, // 10MB 最大输出
  } = options;

  // 验证输入
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    console.warn("[Python 执行器] 输入验证失败：代码为空");
    return {
      success: false,
      svg: null,
      error: "Python 代码不能为空",
      stdout: null,
      stderr: null,
    };
  }

  console.log("[Python 执行器] 开始执行，代码长度:", code.length, "字符");

  // 包装用户代码，确保输出 SVG
  const wrappedCode = wrapPythonCode(code);

  return new Promise((resolve) => {
    // 使用 spawn 创建 Python 进程
    // 注意：需要确保系统已安装 Python 3.x
    // 优先尝试 python3，如果失败则尝试 python（Windows 系统）
    const pythonCommand = process.platform === "win32" ? "python" : "python3";
    const pythonProcess = spawn(pythonCommand, ["-c", wrappedCode], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: false,
    });

    let stdout = "";
    let stderr = "";
    let outputSize = 0;
    let timeoutId = null;

    // 设置超时
    timeoutId = setTimeout(() => {
      pythonProcess.kill("SIGTERM");
      resolve({
        success: false,
        svg: null,
        error: `Python 代码执行超时（超过 ${timeout / 1000} 秒）。请检查代码是否有无限循环或长时间运行的操作。`,
        stdout: stdout.substring(0, 1000), // 只返回前 1000 字符用于调试
        stderr: stderr.substring(0, 1000),
      });
    }, timeout);

    // 捕获标准输出
    pythonProcess.stdout.on("data", (data) => {
      const chunk = data.toString();
      outputSize += Buffer.byteLength(chunk, "utf8");
      
      // 检查输出大小限制
      if (outputSize > maxOutputSize) {
        pythonProcess.kill("SIGTERM");
        clearTimeout(timeoutId);
        resolve({
          success: false,
          svg: null,
          error: `输出大小超过限制（${Math.round(maxOutputSize / 1024 / 1024)}MB）。请减少输出数据量。`,
          stdout: stdout.substring(0, 1000),
          stderr: stderr.substring(0, 1000),
        });
        return;
      }
      
      stdout += chunk;
    });

    // 捕获标准错误
    pythonProcess.stderr.on("data", (data) => {
      const chunk = data.toString();
      outputSize += Buffer.byteLength(chunk, "utf8");
      
      if (outputSize > maxOutputSize) {
        pythonProcess.kill("SIGTERM");
        clearTimeout(timeoutId);
        resolve({
          success: false,
          svg: null,
          error: `输出大小超过限制（${Math.round(maxOutputSize / 1024 / 1024)}MB）。请减少输出数据量。`,
          stdout: stdout.substring(0, 1000),
          stderr: stderr.substring(0, 1000),
        });
        return;
      }
      
      stderr += chunk;
    });

    // 处理进程退出
    pythonProcess.on("close", (code) => {
      clearTimeout(timeoutId);

      console.log("[Python 执行器] 进程退出，退出码:", code);
      console.log("[Python 执行器] 标准输出长度:", stdout.length, "字符");
      console.log("[Python 执行器] 标准错误长度:", stderr.length, "字符");

      // 检查是否有错误输出
      if (stderr.trim().length > 0 && code !== 0) {
        // 尝试从错误中提取有用的信息
        const errorMessage = extractPythonError(stderr);
        console.error("[Python 执行器] 执行失败:", errorMessage);
        resolve({
          success: false,
          svg: null,
          error: errorMessage,
          stdout: stdout.substring(0, 2000), // 限制输出大小用于调试
          stderr: stderr.substring(0, 2000),
        });
        return;
      }

      // 尝试从标准输出中提取 SVG
      const svg = extractSvgFromOutput(stdout);

      if (svg) {
        console.log("[Python 执行器] 成功提取 SVG，长度:", svg.length, "字符");
        // 验证 SVG 格式
        const isValidSvg = validateSvg(svg);
        if (isValidSvg) {
          console.log("[Python 执行器] SVG 格式验证通过");
          resolve({
            success: true,
            svg: svg,
            error: null,
            stdout: null, // 成功时不返回 stdout（可能很大）
            stderr: null,
          });
        } else {
          console.warn("[Python 执行器] SVG 格式验证失败");
          resolve({
            success: false,
            svg: null,
            error: "生成的 SVG 格式无效。请确保代码正确生成了有效的 SVG 内容。",
            stdout: stdout.substring(0, 1000),
            stderr: stderr.substring(0, 1000),
          });
        }
      } else {
        // 没有找到 SVG 输出
        console.warn("[Python 执行器] 未检测到 SVG 输出");
        resolve({
          success: false,
          svg: null,
          error: "代码执行成功，但未检测到 SVG 输出。请确保代码使用 matplotlib 或其他库生成了 SVG 格式的图表。\n\n提示：使用 `plt.savefig(buffer, format='svg')` 来生成 SVG。",
          stdout: stdout.substring(0, 1000),
          stderr: stderr.substring(0, 1000),
        });
      }
    });

    // 处理进程错误（如 Python 未安装）
    pythonProcess.on("error", (error) => {
      clearTimeout(timeoutId);
      let errorMessage = "Python 执行失败";
      
      if (error.message.includes("ENOENT") || error.message.includes("spawn")) {
        const commandHint = process.platform === "win32" ? "python" : "python3";
        errorMessage = `未找到 Python 3。请确保系统已安装 Python 3.x，并且 '${commandHint}' 命令可用。\n\n提示：在 Windows 上使用 'python'，在 Linux/Mac 上使用 'python3'。`;
      } else {
        errorMessage = `Python 进程启动失败: ${error.message}`;
      }
      
      resolve({
        success: false,
        svg: null,
        error: errorMessage,
        stdout: null,
        stderr: null,
      });
    });
  });
}

/**
 * 包装用户代码，确保能够捕获 SVG 输出
 * 
 * @param {string} userCode - 用户提供的 Python 代码
 * @returns {string} 包装后的完整 Python 代码
 */
function wrapPythonCode(userCode) {
  return `
import sys
import io
import traceback

# 尝试导入 matplotlib
try:
    import matplotlib
    matplotlib.use('SVG')
    import matplotlib.pyplot as plt
    has_matplotlib = True
except ImportError:
    has_matplotlib = False
    print("WARNING: matplotlib 未安装，无法生成图表", file=sys.stderr)

# 用户代码
try:
${indentCode(userCode, 4)}
    
    # 尝试捕获 SVG 输出
    if has_matplotlib:
        # 检查是否有活动的图形
        if plt.get_fignums():
            buffer = io.StringIO()
            plt.savefig(buffer, format='svg', bbox_inches='tight')
            svg_content = buffer.getvalue()
            buffer.close()
            
            # 输出 SVG 标记
            print("SVG_OUTPUT_START")
            print(svg_content, end='')
            print("SVG_OUTPUT_END")
        else:
            print("ERROR: 未检测到 matplotlib 图形。请确保代码中调用了 plt.plot()、plt.bar() 等绘图函数。", file=sys.stderr)
    else:
        print("ERROR: matplotlib 未安装，无法生成 SVG 图表。", file=sys.stderr)
        
except Exception as e:
    # 捕获所有异常并输出到 stderr
    print(f"ERROR: {type(e).__name__}: {str(e)}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)
`;
}

/**
 * 缩进代码
 * 
 * @param {string} code - 要缩进的代码
 * @param {number} spaces - 缩进空格数
 * @returns {string} 缩进后的代码
 */
function indentCode(code, spaces) {
  const indent = " ".repeat(spaces);
  return code
    .split("\n")
    .map((line) => (line.trim().length > 0 ? indent + line : line))
    .join("\n");
}

/**
 * 从输出中提取 SVG 内容
 * 
 * @param {string} output - Python 进程的标准输出
 * @returns {string|null} 提取的 SVG 内容，如果未找到则返回 null
 */
function extractSvgFromOutput(output) {
  if (!output || typeof output !== "string") {
    return null;
  }

  // 查找 SVG_OUTPUT_START 和 SVG_OUTPUT_END 标记之间的内容
  const startMarker = "SVG_OUTPUT_START";
  const endMarker = "SVG_OUTPUT_END";

  const startIndex = output.indexOf(startMarker);
  const endIndex = output.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    // 如果没有找到标记，尝试直接查找 SVG 标签
    const svgMatch = output.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      return svgMatch[0];
    }
    return null;
  }

  // 提取标记之间的内容
  const svgContent = output.substring(
    startIndex + startMarker.length,
    endIndex
  ).trim();

  return svgContent || null;
}

/**
 * 验证 SVG 格式
 * 
 * @param {string} svg - SVG 内容
 * @returns {boolean} 是否为有效的 SVG
 */
function validateSvg(svg) {
  if (!svg || typeof svg !== "string") {
    return false;
  }

  // 基本验证：检查是否包含 SVG 标签
  const hasSvgTag = /<svg[\s>]/i.test(svg);
  const hasClosingTag = /<\/svg>/i.test(svg);

  return hasSvgTag && hasClosingTag;
}

/**
 * 从 Python 错误输出中提取友好的错误信息
 * 
 * @param {string} stderr - Python 标准错误输出
 * @returns {string} 友好的错误信息
 */
function extractPythonError(stderr) {
  if (!stderr || typeof stderr !== "string") {
    return "Python 代码执行失败";
  }

  // 尝试提取关键错误信息
  const lines = stderr.split("\n");
  
  // 查找常见的错误模式
  for (const line of lines) {
    // SyntaxError
    if (line.includes("SyntaxError")) {
      const match = line.match(/SyntaxError: (.+)/);
      if (match) {
        return `Python 语法错误: ${match[1]}`;
      }
    }
    
    // NameError
    if (line.includes("NameError")) {
      const match = line.match(/NameError: (.+)/);
      if (match) {
        return `Python 名称错误: ${match[1]}`;
      }
    }
    
    // ImportError
    if (line.includes("ImportError")) {
      const match = line.match(/ImportError: (.+)/);
      if (match) {
        return `Python 导入错误: ${match[1]}\n\n提示：请确保所需的 Python 库已安装（如 matplotlib、pandas 等）。`;
      }
    }
    
    // TypeError
    if (line.includes("TypeError")) {
      const match = line.match(/TypeError: (.+)/);
      if (match) {
        return `Python 类型错误: ${match[1]}`;
      }
    }
    
    // ValueError
    if (line.includes("ValueError")) {
      const match = line.match(/ValueError: (.+)/);
      if (match) {
        return `Python 值错误: ${match[1]}`;
      }
    }
    
    // 通用错误
    if (line.includes("ERROR:")) {
      const match = line.match(/ERROR: (.+)/);
      if (match) {
        return match[1];
      }
    }
  }

  // 如果无法提取特定错误，返回前几行
  const errorLines = lines
    .filter((line) => line.trim().length > 0)
    .slice(0, 5)
    .join("\n");

  return errorLines || "Python 代码执行失败，请检查代码是否正确。";
}

