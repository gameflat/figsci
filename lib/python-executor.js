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
  console.log("[Python 执行器] 用户提供的 Python 代码:");
  console.log("-".repeat(60));
  console.log(code);
  console.log("-".repeat(60));

  // 包装用户代码，确保输出 SVG
  const wrappedCode = wrapPythonCode(code);
  
  // 输出包装后的代码（用于调试，但可能很长，所以只输出前 500 行）
  const wrappedLines = wrappedCode.split('\n');
  if (wrappedLines.length > 500) {
    console.log("[Python 执行器] 包装后的代码（前 500 行）:");
    console.log("-".repeat(60));
    console.log(wrappedLines.slice(0, 500).join('\n'));
    console.log(`... (省略 ${wrappedLines.length - 500} 行)`);
    console.log("-".repeat(60));
  } else {
    console.log("[Python 执行器] 包装后的完整代码:");
    console.log("-".repeat(60));
    console.log(wrappedCode);
    console.log("-".repeat(60));
  }

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
    import matplotlib as mpl
    has_matplotlib = True
except ImportError:
    has_matplotlib = False
    print("WARNING: matplotlib 未安装，无法生成图表", file=sys.stderr)

# 配置学术绘图风格（符合顶级期刊标准：Nature、Science、Cell、NeurIPS、CVPR、ICML）
if has_matplotlib:
    # 字体配置：使用 Arial（符合期刊要求）
    # 优先使用 Arial，如果系统没有则使用 Helvetica，最后使用默认 sans-serif
    # 注意：用户代码可以通过 fontfamily 参数覆盖（如 plt.title(..., fontfamily='Times')）
    # 但推荐使用默认的 Arial 字体以符合期刊标准
    try:
        # 尝试设置 Arial
        mpl.rcParams['font.family'] = 'Arial'
        mpl.rcParams['font.sans-serif'] = ['Arial', 'Helvetica', 'DejaVu Sans', 'sans-serif']
    except:
        # 如果 Arial 不可用，使用系统默认 sans-serif
        mpl.rcParams['font.sans-serif'] = ['Helvetica', 'DejaVu Sans', 'sans-serif']
    
    # 字号配置（符合学术期刊标准）
    # 注意：这些是默认值，用户代码可以通过 fontsize 参数覆盖（如 plt.title(fontsize=16)）
    # 推荐使用这些默认值或在其范围内调整（标题 14-16pt，轴标签 12pt，图例 10pt）
    mpl.rcParams['font.size'] = 11  # 默认字号
    mpl.rcParams['axes.titlesize'] = 14  # 标题字号 14-16pt
    mpl.rcParams['axes.labelsize'] = 12  # 轴标签字号 12pt
    mpl.rcParams['xtick.labelsize'] = 10  # X 轴刻度标签字号 10pt
    mpl.rcParams['ytick.labelsize'] = 10  # Y 轴刻度标签字号 10pt
    mpl.rcParams['legend.fontsize'] = 10  # 图例字号 10pt
    
    # 图表质量配置（300 DPI 适合出版）
    # 注意：这些是默认值，用户代码可以通过 plt.figure(dpi=...) 覆盖
    # 但在最终保存 SVG 时，我们会强制使用 dpi=300 以确保出版质量
    mpl.rcParams['figure.dpi'] = 300
    mpl.rcParams['savefig.dpi'] = 300
    mpl.rcParams['savefig.format'] = 'svg'
    
    # 线条和标记样式
    # 注意：这些是默认值，用户代码可以通过 linewidth 参数覆盖（如 plt.plot(..., linewidth=2)）
    # 推荐使用 1.5-2pt 的线条粗细以符合学术标准
    mpl.rcParams['lines.linewidth'] = 1.5  # 线条粗细 1.5-2pt
    mpl.rcParams['lines.markersize'] = 6
    mpl.rcParams['axes.linewidth'] = 1.0  # 坐标轴线宽
    mpl.rcParams['grid.linewidth'] = 0.8  # 网格线宽
    
    # 配色方案：学术配色（灰度优先，色盲友好）
    # 主色调：灰度方案（#2C3E50 到 #F7F9FC）
    # 强调色：蓝色（#6c8ebf）、绿色（#82b366）、橙色（#d6b656）
    # 避免红绿搭配（色盲不友好）
    # 注意：此字典会暴露给用户代码，LLM 可以使用 academic_colors['primary'] 等来指定学术配色
    academic_colors = {
        'primary': '#2C3E50',      # 深灰（文字、边框、主色）
        'secondary': '#6c8ebf',    # 蓝色（强调）
        'tertiary': '#82b366',     # 绿色（成功/通过）
        'accent': '#d6b656',       # 橙色（警告/决策）
        'blue': '#6c8ebf',         # 蓝色（别名，便于使用）
        'green': '#82b366',        # 绿色（别名，便于使用）
        'orange': '#d6b656',       # 橙色（别名，便于使用）
        'background': '#F7F9FC',    # 浅灰背景
        'grid': '#E0E0E0'          # 网格颜色
    }
    
    # 设置默认颜色循环（学术配色）
    # 注意：如果用户代码明确指定了 color 参数，会覆盖此默认设置
    # 建议在代码中使用 academic_colors 字典来明确指定学术配色
    mpl.rcParams['axes.prop_cycle'] = mpl.cycler(
        color=[academic_colors['primary'], 
               academic_colors['secondary'], 
               academic_colors['tertiary'], 
               academic_colors['accent'],
               '#b85450',  # 红色（错误/重点，谨慎使用）
               '#8B6F47']  # 棕色（备选）
    )
    
    # 坐标轴和网格样式
    # 注意：用户代码可以通过 plt.grid() 参数覆盖网格样式
    # 推荐使用学术配色：坐标轴颜色使用 academic_colors['primary']，网格使用 academic_colors['grid']
    mpl.rcParams['axes.edgecolor'] = academic_colors['primary']
    mpl.rcParams['axes.labelcolor'] = academic_colors['primary']
    mpl.rcParams['xtick.color'] = academic_colors['primary']
    mpl.rcParams['ytick.color'] = academic_colors['primary']
    mpl.rcParams['grid.color'] = academic_colors['grid']
    mpl.rcParams['grid.alpha'] = 0.3  # 网格透明度 0.3
    mpl.rcParams['grid.linestyle'] = '--'
    mpl.rcParams['grid.linewidth'] = 0.8
    
    # 图表背景和边框
    mpl.rcParams['figure.facecolor'] = 'white'
    mpl.rcParams['axes.facecolor'] = 'white'
    mpl.rcParams['axes.axisbelow'] = True  # 网格在数据下方
    
    # 图例样式
    mpl.rcParams['legend.frameon'] = True
    mpl.rcParams['legend.framealpha'] = 0.9
    mpl.rcParams['legend.edgecolor'] = academic_colors['primary']
    mpl.rcParams['legend.facecolor'] = 'white'
    mpl.rcParams['legend.borderpad'] = 0.5
    
    # 默认图表尺寸（适合单栏：8×6 英寸）
    # 注意：用户代码可以通过 plt.figure(figsize=(w, h)) 覆盖
    # 推荐尺寸：单栏 8×6 英寸，双栏 12×6 英寸
    mpl.rcParams['figure.figsize'] = [8, 6]
    
    # 边距设置（确保有足够的空白边缘）
    # 注意：用户代码可以通过 plt.subplots_adjust() 或 plt.tight_layout() 覆盖
    # 推荐使用 plt.tight_layout() 自动调整边距
    mpl.rcParams['figure.subplot.left'] = 0.12
    mpl.rcParams['figure.subplot.right'] = 0.95
    mpl.rcParams['figure.subplot.bottom'] = 0.12
    mpl.rcParams['figure.subplot.top'] = 0.95
    
    # 文本渲染优化
    mpl.rcParams['text.antialiased'] = True
    mpl.rcParams['axes.unicode_minus'] = False  # 避免负号显示问题
    
    # 将学术配色字典暴露给用户代码，方便 LLM 使用
    # 用户代码可以通过 academic_colors['primary'] 等方式使用学术配色
    # 这样可以确保即使明确指定颜色，也使用学术配色而非默认颜色名（如 'red'）
    # 示例：plt.plot(x, y, color=academic_colors['primary'])

# 用户代码
# 注意：academic_colors 字典已在上方定义，可以直接使用
# 推荐使用 academic_colors['primary']、academic_colors['blue'] 等来指定颜色
# 这样可以确保使用学术配色，符合期刊标准
try:
${indentCode(userCode, 4)}
    
    # 尝试捕获 SVG 输出
    if has_matplotlib:
        # 检查是否有活动的图形
        if plt.get_fignums():
            buffer = io.StringIO()
            # 明确指定 DPI=300，确保即使用户代码设置了不同的 DPI，最终输出也符合出版标准
            # 这是强制性的，不能被子代码覆盖
            plt.savefig(buffer, format='svg', bbox_inches='tight', dpi=300)
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

