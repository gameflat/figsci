// -*- coding: utf-8 -*-
/**
 * 数据文件解析工具
 * 支持 Excel (.xlsx, .xls) 和 CSV 文件解析，转换为 Markdown 表格格式
 */

import Papa from 'papaparse';

// 动态导入 xlsx，避免 Next.js 构建问题
// 在 Next.js API 路由中，使用 require 来导入 CommonJS 模块
const XLSX = (() => {
  if (typeof window === 'undefined') {
    // 服务端环境：使用 require
    try {
      return require('xlsx');
    } catch (error) {
      console.error('无法加载 xlsx 模块:', error);
      throw new Error('xlsx 模块未安装，请运行 pnpm install');
    }
  } else {
    // 客户端环境（不应该在这里使用）
    throw new Error('数据文件解析只能在服务端执行');
  }
})();

/**
 * 获取配置限制
 * @returns {{ maxFileSize: number, maxRows: number, maxCols: number }}
 */
function getLimits() {
  const maxFileSize = parseInt(process.env.MAX_DATA_FILE_SIZE || '10485760', 10); // 默认 10MB
  const maxRows = parseInt(process.env.MAX_DATA_FILE_ROWS || '1000', 10); // 默认 1000 行
  const maxCols = parseInt(process.env.MAX_DATA_FILE_COLS || '50', 10); // 默认 50 列
  return { maxFileSize, maxRows, maxCols };
}

/**
 * 将二维数组转换为 Markdown 表格格式
 * 
 * @param {Array<Array<string>>} data - 二维数组，第一行为表头
 * @param {Object} options - 选项
 * @param {number} [options.maxRows] - 最大行数
 * @param {number} [options.maxCols] - 最大列数
 * @returns {string} Markdown 表格字符串
 */
export function convertToMarkdownTable(data, options = {}) {
  if (!data || data.length === 0) {
    return '';
  }

  const { maxRows, maxCols } = getLimits();
  const limitRows = options.maxRows ?? maxRows;
  const limitCols = options.maxCols ?? maxCols;

  // 限制行数和列数
  const limitedData = data.slice(0, limitRows + 1); // +1 因为第一行是表头
  const hasMoreRows = data.length > limitRows + 1;

  // 处理每一行，限制列数并转义特殊字符
  const processedData = limitedData.map((row, rowIndex) => {
    const limitedRow = row.slice(0, limitCols);
    const hasMoreCols = row.length > limitCols;

    // 转义 Markdown 表格中的特殊字符
    const escapedRow = limitedRow.map(cell => {
      if (cell === null || cell === undefined) {
        return '';
      }
      // 将单元格值转换为字符串
      const cellStr = String(cell).trim();
      // 转义管道符和换行符
      return cellStr
        .replace(/\|/g, '\\|')
        .replace(/\n/g, ' ')
        .replace(/\r/g, '');
    });

    // 如果列数被截断，在最后一列添加提示
    if (hasMoreCols && rowIndex === 0) {
      escapedRow[escapedRow.length - 1] += ' (更多列...)';
    }

    return escapedRow;
  });

  // 构建 Markdown 表格
  const lines = [];
  
  // 表头
  if (processedData.length > 0) {
    lines.push('| ' + processedData[0].join(' | ') + ' |');
    // 分隔线
    lines.push('| ' + processedData[0].map(() => '---').join(' | ') + ' |');
  }

  // 数据行
  for (let i = 1; i < processedData.length; i++) {
    lines.push('| ' + processedData[i].join(' | ') + ' |');
  }

  // 如果行数被截断，添加提示
  if (hasMoreRows) {
    lines.push('');
    lines.push(`*注：数据已截断，仅显示前 ${limitRows} 行，共 ${data.length - 1} 行数据*`);
  }

  return lines.join('\n');
}

/**
 * 解析 Excel 文件
 * 
 * @param {Buffer} buffer - Excel 文件缓冲区
 * @param {Object} options - 选项
 * @param {string} [options.sheetName] - 工作表名称（默认使用第一个工作表）
 * @param {number} [options.maxRows] - 最大行数
 * @param {number} [options.maxCols] - 最大列数
 * @returns {Promise<{ data: Array<Array<string>>, sheetName: string, totalRows: number }>}
 */
export async function parseExcelFile(buffer, options = {}) {
  try {
    // 读取工作簿
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel 文件中没有工作表');
    }

    // 选择工作表
    const sheetName = options.sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      throw new Error(`工作表 "${sheetName}" 不存在`);
    }

    // 转换为 JSON 数组（第一行为表头）
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // 使用数组格式，第一行为表头
      defval: '', // 空单元格默认值
      raw: false, // 不保留原始值，进行格式化
    });

    if (!jsonData || jsonData.length === 0) {
      throw new Error('工作表为空');
    }

    // 确保所有行的列数一致（以第一行为准）
    const headerLength = jsonData[0]?.length || 0;
    const normalizedData = jsonData.map(row => {
      const normalizedRow = Array(headerLength).fill('');
      for (let i = 0; i < Math.min(row.length, headerLength); i++) {
        normalizedRow[i] = row[i] ?? '';
      }
      return normalizedRow;
    });

    const totalRows = normalizedData.length - 1; // 减去表头

    return {
      data: normalizedData,
      sheetName,
      totalRows,
    };
  } catch (error) {
    console.error('Excel 文件解析失败:', error);
    throw new Error(`Excel 文件解析失败: ${error.message}`);
  }
}

/**
 * 解析 CSV 文件
 * 
 * @param {Buffer} buffer - CSV 文件缓冲区
 * @param {Object} options - 选项
 * @param {string} [options.encoding] - 文件编码（默认 'utf8'）
 * @param {string} [options.delimiter] - 分隔符（自动检测）
 * @param {number} [options.maxRows] - 最大行数
 * @param {number} [options.maxCols] - 最大列数
 * @returns {Promise<{ data: Array<Array<string>>, totalRows: number }>}
 */
export async function parseCsvFile(buffer, options = {}) {
  try {
    const encoding = options.encoding || 'utf8';
    const text = buffer.toString(encoding);

    if (!text || text.trim().length === 0) {
      throw new Error('CSV 文件为空');
    }

    // 使用 PapaParse 解析 CSV
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: false, // 不使用表头模式，返回数组格式
        skipEmptyLines: true, // 跳过空行
        delimiter: options.delimiter || '', // 空字符串表示自动检测
        encoding: encoding,
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            const errorMessages = results.errors.map(e => e.message).join('; ');
            console.warn('CSV 解析警告:', errorMessages);
          }

          if (!results.data || results.data.length === 0) {
            reject(new Error('CSV 文件解析后没有数据'));
            return;
          }

          // 确保所有行的列数一致（以第一行为准）
          const headerLength = results.data[0]?.length || 0;
          const normalizedData = results.data.map(row => {
            const normalizedRow = Array(headerLength).fill('');
            for (let i = 0; i < Math.min(row.length, headerLength); i++) {
              normalizedRow[i] = row[i] ?? '';
            }
            return normalizedRow;
          });

          const totalRows = normalizedData.length - 1; // 减去表头

          resolve({
            data: normalizedData,
            totalRows,
          });
        },
        error: (error) => {
          console.error('CSV 文件解析失败:', error);
          reject(new Error(`CSV 文件解析失败: ${error.message}`));
        },
      });
    });
  } catch (error) {
    console.error('CSV 文件解析失败:', error);
    throw new Error(`CSV 文件解析失败: ${error.message}`);
  }
}

/**
 * 从 DataURL 中提取文件内容
 * 支持标准格式：data:mime/type;base64,data
 * 支持带参数格式：data:mime/type;filename=xxx;base64,data
 * 
 * @param {string} dataUrl - DataURL 字符串
 * @returns {Promise<{ buffer: Buffer, mimeType: string, fileName: string }>}
 */
export async function extractFileFromDataUrl(dataUrl) {
  try {
    // 检查基本格式
    if (!dataUrl.startsWith('data:')) {
      throw new Error('无效的 DataURL 格式：必须以 data: 开头');
    }

    // 查找 base64, 的位置（base64 数据开始的位置）
    const base64Index = dataUrl.indexOf(';base64,');
    if (base64Index === -1) {
      throw new Error('无效的 DataURL 格式：缺少 ;base64, 分隔符');
    }

    // 提取 MIME 类型（data: 之后到第一个分号之前）
    const mimeTypePart = dataUrl.substring(5, base64Index); // 5 = 'data:'.length
    // MIME 类型可能包含参数，只取第一部分（如 "image/png;charset=utf-8" -> "image/png"）
    const mimeType = mimeTypePart.split(';')[0].trim();

    // 提取 base64 数据（base64, 之后的所有内容）
    const base64Data = dataUrl.substring(base64Index + 8); // 8 = ';base64,'.length

    if (!base64Data || base64Data.length === 0) {
      throw new Error('无效的 DataURL 格式：base64 数据为空');
    }

    // 尝试提取 filename 参数（如果存在）
    let fileName = null;
    const filenameMatch = mimeTypePart.match(/filename=([^;]+)/);
    if (filenameMatch) {
      try {
        fileName = decodeURIComponent(filenameMatch[1]);
      } catch (e) {
        // 如果解码失败，使用原始值
        fileName = filenameMatch[1];
      }
    }

    // 解码 Base64
    const buffer = Buffer.from(base64Data, 'base64');

    // 如果没有从参数中提取到文件名，从 MIME 类型推断
    if (!fileName) {
      fileName = 'data';
      if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
        fileName = mimeType.includes('xls') ? 'data.xls' : 'data.xlsx';
      } else if (mimeType.includes('csv')) {
        fileName = 'data.csv';
      }
    }

    return { buffer, mimeType, fileName };
  } catch (error) {
    console.error('DataURL 解析失败:', error);
    throw new Error(`DataURL 解析失败: ${error.message}`);
  }
}

/**
 * 解析数据文件（自动识别类型）
 * 
 * @param {string} dataUrl - DataURL 字符串
 * @param {string} fileName - 文件名（用于类型推断）
 * @param {Object} options - 选项
 * @returns {Promise<{ markdown: string, fileName: string, totalRows: number, sheetName?: string }>}
 */
export async function parseDataFile(dataUrl, fileName, options = {}) {
  const { maxFileSize } = getLimits();

  // 从 DataURL 提取文件内容
  const { buffer, mimeType } = await extractFileFromDataUrl(dataUrl);

  // 检查文件大小
  if (buffer.length > maxFileSize) {
    throw new Error(`文件大小超过限制（${Math.round(maxFileSize / 1024 / 1024)}MB）`);
  }

  // 根据文件扩展名或 MIME 类型判断文件类型
  const fileExt = fileName?.toLowerCase().split('.').pop() || '';
  const isExcel = fileExt === 'xlsx' || fileExt === 'xls' || 
                  mimeType.includes('excel') || 
                  mimeType.includes('spreadsheet');
  const isCsv = fileExt === 'csv' || mimeType.includes('csv') || 
                mimeType.includes('text/plain');

  let parseResult;
  let displayFileName = fileName || 'data';

  try {
    if (isExcel) {
      parseResult = await parseExcelFile(buffer, options);
      displayFileName = fileName || `${parseResult.sheetName || 'sheet'}.xlsx`;
    } else if (isCsv) {
      parseResult = await parseCsvFile(buffer, options);
      displayFileName = fileName || 'data.csv';
    } else {
      throw new Error(`不支持的文件类型。支持的类型：.xlsx, .xls, .csv`);
    }

    // 转换为 Markdown 表格
    const markdown = convertToMarkdownTable(parseResult.data, options);

    return {
      markdown,
      fileName: displayFileName,
      totalRows: parseResult.totalRows,
      sheetName: parseResult.sheetName,
    };
  } catch (error) {
    console.error('数据文件解析失败:', error);
    throw error;
  }
}

