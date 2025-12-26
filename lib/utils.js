import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as pako from "pako";
import { EMPTY_MXFILE } from "@/lib/diagram-templates";

/**
 * Tailwind-friendly className combiner.
 * @param {...import("clsx").ClassValue} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format XML string with proper indentation and line breaks
 * @param xml - The XML string to format
 * @param indent - The indentation string (default: '  ')
 * @returns Formatted XML string
 */
export function formatXML(xml, indent = "  ") {
  let formatted = '';
  let pad = 0;

  // Remove existing whitespace between tags
  xml = xml.replace(/>\s*</g, '><').trim();

  // Split on tags
  const tags = xml.split(/(?=<)|(?<=>)/g).filter(Boolean);

  tags.forEach((node) => {
    if (node.match(/^<\/\w/)) {
      // Closing tag - decrease indent
      pad = Math.max(0, pad - 1);
      formatted += indent.repeat(pad) + node + '\n';
    } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
      // Opening tag
      formatted += indent.repeat(pad) + node;
      // Only add newline if next item is a tag
      const nextIndex = tags.indexOf(node) + 1;
      if (nextIndex < tags.length && tags[nextIndex].startsWith('<')) {
        formatted += '\n';
        if (!node.match(/^<\w[^>]*\/>$/)) {
          pad++;
        }
      }
    } else if (node.match(/^<\w[^>]*\/>$/)) {
      // Self-closing tag
      formatted += indent.repeat(pad) + node + '\n';
    } else if (node.startsWith('<')) {
      // Other tags (like <?xml)
      formatted += indent.repeat(pad) + node + '\n';
    } else {
      // Text content
      formatted += node;
    }
  });

  return formatted.trim();
}

/** 
 * Efficiently converts a potentially incomplete XML string to a legal XML string by closing any open tags properly.
 * Additionally, if an <mxCell> tag does not have an mxGeometry child (e.g. <mxCell id="3">),
 * it removes that tag from the output.
 * @param xmlString The potentially incomplete XML string
 * @returns A legal XML string with properly closed tags and removed incomplete mxCell elements.
 */
export function convertToLegalXml(xmlString) {
  // This regex will match either self-closing <mxCell .../> or a block element 
  // <mxCell ...> ... </mxCell>. Unfinished ones are left out because they don't match.
  const regex = /<mxCell\b[^>]*(?:\/>|>([\s\S]*?)<\/mxCell>)/g;
  let match;
  let result = "<root>\n";

  while ((match = regex.exec(xmlString)) !== null) {
    // match[0] contains the entire matched mxCell block
    // Indent each line of the matched block for readability.
    const formatted = match[0].split('\n').map(line => "    " + line.trim()).join('\n');
    result += formatted + "\n";
  }
  result += "</root>";

  return result;
}


/**
 * Replace nodes in a Draw.io XML diagram
 * @param currentXML - The original Draw.io XML string
 * @param nodes - The XML string containing new nodes to replace in the diagram
 * @returns The updated XML string with replaced nodes
 */
export function ensureRootXml(xml) {
  if (!xml) {
    return "<root></root>";
  }
  const trimmed = xml.trim();
  if (/^<root[\s>]/i.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/<root[\s\S]*<\/root>/i);
  if (match) {
    return match[0];
  }
  return `<root>${trimmed}</root>`;
}

export function replaceNodes(currentXML, nodes) {
  const normalizedRoot = ensureRootXml(nodes);
  if (!currentXML || currentXML.trim().length === 0) {
    return `<mxGraphModel>${normalizedRoot}</mxGraphModel>`;
  }
  const rootPattern = /<root[\s\S]*?<\/root>/i;
  if (rootPattern.test(currentXML)) {
    return currentXML.replace(rootPattern, normalizedRoot);
  }
  if (currentXML.includes("<mxGraphModel")) {
    return currentXML.replace("</mxGraphModel>", `${normalizedRoot}</mxGraphModel>`);
  }
  return `<mxGraphModel>${normalizedRoot}</mxGraphModel>`;
}

export function mergeRootXml(baseXml, newRootXml) {
  if (!baseXml || baseXml.trim().length === 0) {
    return replaceNodes("", newRootXml);
  }
  return replaceNodes(baseXml, newRootXml);
}

/**
 * 完全替换画布内容（用于 display_diagram 工具调用）
 * 与 mergeRootXml 不同，此函数会完全替换整个画布，而不是尝试合并
 * 
 * @param {string} baseXml - 当前画布的 XML（用于提取 mxGraphModel 标签属性）
 * @param {string} newRootXml - 新的 root XML 内容
 * @returns {string} 替换后的完整 XML（始终返回完整的 mxfile 格式）
 */
export function replaceRootXml(baseXml, newRootXml) {
  const normalizedRoot = ensureRootXml(newRootXml);
  
  // 检查是否是完整的 mxfile 格式（包含 <mxfile> 和 <diagram> 标签）
  const isFullFormat = baseXml && baseXml.includes('<mxfile>') && baseXml.includes('<diagram');
  
  if (isFullFormat) {
    // 完整格式：保持 <mxfile> 和 <diagram> 结构，只替换 <mxGraphModel> 内的 <root>
    const mxGraphModelMatch = baseXml.match(/<mxGraphModel[^>]*>[\s\S]*?<\/mxGraphModel>/i);
    if (mxGraphModelMatch) {
      const mxGraphModelTag = mxGraphModelMatch[0].match(/<mxGraphModel[^>]*>/i);
      const startTag = mxGraphModelTag ? mxGraphModelTag[0] : '<mxGraphModel>';
      const newMxGraphModel = `${startTag}${normalizedRoot}</mxGraphModel>`;
      return baseXml.replace(/<mxGraphModel[^>]*>[\s\S]*?<\/mxGraphModel>/i, newMxGraphModel);
    }
  }
  
  // 如果 baseXml 为空或不是完整格式，使用 EMPTY_MXFILE 作为基础模板
  // 从 EMPTY_MXFILE 提取 <mxfile> 和 <diagram> 结构，然后替换 <mxGraphModel> 内的 <root>
  const mxGraphModelMatch = EMPTY_MXFILE.match(/<mxGraphModel[^>]*>[\s\S]*?<\/mxGraphModel>/i);
  if (mxGraphModelMatch) {
    const mxGraphModelTag = mxGraphModelMatch[0].match(/<mxGraphModel[^>]*>/i);
    const startTag = mxGraphModelTag ? mxGraphModelTag[0] : '<mxGraphModel>';
    const newMxGraphModel = `${startTag}${normalizedRoot}</mxGraphModel>`;
    return EMPTY_MXFILE.replace(/<mxGraphModel[^>]*>[\s\S]*?<\/mxGraphModel>/i, newMxGraphModel);
  }
  
  // 兜底：如果所有方法都失败，返回简单的 mxGraphModel 格式（但这不是理想情况）
  return `<mxGraphModel>${normalizedRoot}</mxGraphModel>`;
}

/**
 * Replace specific parts of XML content using search and replace pairs
 * @param xmlContent - The original XML string
 * @param searchReplacePairs - Array of {search: string, replace: string} objects
 * @returns The updated XML string with replacements applied
 */
export function replaceXMLParts(xmlContent, searchReplacePairs) {
  // Format the XML first to ensure consistent line breaks
  let result = formatXML(xmlContent);
  let nextSearchHintLine = 0;

  for (const { search, replace } of searchReplacePairs) {
    // Also format the search content for consistency
    const formattedSearch = formatXML(search);
    const searchLines = formattedSearch.split('\n');

    // Split into lines for exact line matching
    const resultLines = result.split('\n');

    // Remove trailing empty line if exists (from the trailing \n in search content)
    if (searchLines[searchLines.length - 1] === '') {
      searchLines.pop();
    }

    const searchStartCandidates = Array.from(
      new Set([Math.max(0, nextSearchHintLine), 0])
    );

    // Try to find exact match starting from lastProcessedIndex
    let matchFound = false;
    let matchStartLine = -1;
    let matchEndLine = -1;

    const tryMatch = (startLine, comparator) => {
      for (let i = Math.max(0, startLine); i <= resultLines.length - searchLines.length; i++) {
        let matches = true;

        for (let j = 0; j < searchLines.length; j++) {
          if (!comparator(resultLines[i + j], searchLines[j])) {
            matches = false;
            break;
          }
        }

        if (matches) {
          matchStartLine = i;
          matchEndLine = i + searchLines.length;
          matchFound = true;
          return true;
        }
      }

      return false;
    };

    // First try: exact match
    for (const startLine of searchStartCandidates) {
      if (tryMatch(startLine, (a, b) => a === b)) {
        break;
      }
    }

    // Second try: line-trimmed match (fallback)
    if (!matchFound) {
      for (const startLine of searchStartCandidates) {
        if (tryMatch(startLine, (a, b) => a.trim() === b.trim())) {
          break;
        }
      }
    }

    // Third try: substring match as last resort (for single-line XML)
    if (!matchFound) {
      // Try to find as a substring in the entire content
      const searchStr = formattedSearch.trim();
      const resultStr = result;
      const index = resultStr.indexOf(searchStr);

      if (index !== -1) {
        // Found as substring - replace it
        result = resultStr.substring(0, index) + replace.trim() + resultStr.substring(index + searchStr.length);
        // Re-format after substring replacement
        result = formatXML(result);
        nextSearchHintLine = 0;
        continue; // Skip the line-based replacement below
      }
    }

    if (!matchFound) {
      throw new Error(`Search pattern not found in the diagram. The pattern may not exist in the current structure.`);
    }

    // Replace the matched lines
    const replaceLines = replace.split('\n');

    // Remove trailing empty line if exists
    if (replaceLines[replaceLines.length - 1] === '') {
      replaceLines.pop();
    }

    // Perform the replacement
    const newResultLines = [
      ...resultLines.slice(0, matchStartLine),
      ...replaceLines,
      ...resultLines.slice(matchEndLine)
    ];

    result = newResultLines.join('\n');

    // Update hint to resume searching near the current edit while still allowing earlier matches when needed
    nextSearchHintLine = matchStartLine + replaceLines.length;
  }

  return result;
}

/**
 * 检查字符串是否是有效的 base64 编码
 * @param {string} str - 要检查的字符串
 * @returns {boolean}
 */
function isValidBase64(str) {
  if (!str || typeof str !== 'string') {
    return false;
  }
  // Base64 字符串只包含 A-Z, a-z, 0-9, +, /, = 字符
  // 并且长度必须是 4 的倍数（可能包含末尾的 = 填充）
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(str)) {
    return false;
  }
  // 尝试解码，如果失败则不是有效的 base64
  try {
    atob(str);
    return true;
  } catch {
    return false;
  }
}

export function extractDiagramXML(xml_svg_string) {
  try {
    // 如果输入已经是 XML 格式（不是 SVG），直接返回
    if (xml_svg_string && typeof xml_svg_string === 'string') {
      const trimmed = xml_svg_string.trim();
      // 检查是否是直接的 XML 格式（包含 <root> 或 <mxfile> 或 <mxGraphModel>）
      if (trimmed.startsWith('<root>') || 
          trimmed.startsWith('<mxfile>') || 
          trimmed.startsWith('<mxGraphModel>') ||
          trimmed.includes('<root>') ||
          trimmed.includes('<mxfile>') ||
          trimmed.includes('<mxGraphModel>')) {
        console.log("[extractDiagramXML] 检测到直接 XML 格式，直接返回");
        return trimmed;
      }
    }

    // 检查是否是 data:image/svg+xml;base64, 格式
    if (!xml_svg_string || typeof xml_svg_string !== 'string' || !xml_svg_string.startsWith('data:image/svg+xml;base64,')) {
      console.warn("[extractDiagramXML] 输入格式不是预期的 SVG base64 格式，尝试作为 XML 返回:", xml_svg_string?.substring(0, 100));
      // 如果不是预期格式，尝试直接返回（可能是纯 XML）
      return xml_svg_string || '';
    }

    // 1. 提取 base64 部分
    const base64Part = xml_svg_string.slice(26); // 跳过 "data:image/svg+xml;base64," 前缀
    
    // 验证 base64 字符串是否有效
    if (!isValidBase64(base64Part)) {
      console.error("[extractDiagramXML] Base64 字符串无效:", base64Part.substring(0, 50));
      throw new Error("输入的 base64 字符串格式无效，无法解码");
    }

    // 2. 解码 base64 字符串
    const svgString = atob(base64Part);
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.querySelector('svg');

    if (!svgElement) {
      throw new Error("No SVG element found in the input string.");
    }
    // 3. 提取 'content' 属性
    const encodedContent = svgElement.getAttribute('content');

    if (!encodedContent) {
      throw new Error("SVG element does not have a 'content' attribute.");
    }

    // 4. 解码 HTML 实体
    function decodeHtmlEntities(str) {
      const textarea = document.createElement('textarea'); // Use built-in element
      textarea.innerHTML = str;
      return textarea.value;
    }
    const xmlContent = decodeHtmlEntities(encodedContent);

    // 5. 解析 XML 内容
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    const diagramElement = xmlDoc.querySelector('diagram');

    if (!diagramElement) {
      throw new Error("No diagram element found");
    }
    // 6. 提取 base64 数据
    const base64EncodedData = diagramElement.textContent;

    if (!base64EncodedData) {
      throw new Error("No encoded data found in the diagram element");
    }

    // 7. 验证 base64 数据是否有效
    if (!isValidBase64(base64EncodedData)) {
      console.error("[extractDiagramXML] Diagram base64 数据无效:", base64EncodedData.substring(0, 50));
      throw new Error("Diagram 中的 base64 数据格式无效，无法解码");
    }

    // 8. 解码 base64 数据
    const binaryString = atob(base64EncodedData);

    // 9. 将二进制字符串转换为 Uint8Array
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 10. 使用 pako 解压数据（相当于使用 wbits=-15 参数调用 zlib.decompress 函数）
    const decompressedData = pako.inflate(bytes, { windowBits: -15 });

    // 11. 将解压缩后的数据转换为字符串
    const decoder = new TextDecoder('utf-8');
    const decodedString = decoder.decode(decompressedData);

    // 解码 URL 编码的内容（相当于 Python 的 urllib.parse.unquote 函数）
    const urlDecodedString = decodeURIComponent(decodedString);

    return urlDecodedString;

  } catch (error) {
    console.error("Error extracting diagram XML:", error);
    // 如果提取失败，尝试直接返回输入（可能是纯 XML）
    if (xml_svg_string && typeof xml_svg_string === 'string') {
      const trimmed = xml_svg_string.trim();
      if (trimmed.startsWith('<') || trimmed.includes('<root>') || trimmed.includes('<mxfile>') || trimmed.includes('<mxGraphModel>')) {
        console.log("[extractDiagramXML] 提取失败，但输入看起来是 XML 格式，直接返回");
        return trimmed;
      }
    }
    throw error; // Re-throw for caller handling
  }
}

export function encodeDiagramXml(xml) {
  if (!xml || xml.trim().length === 0) {
    throw new Error("XML 内容不能为空");
  }

  const urlEncoded = encodeURIComponent(xml);
  const encoder = new TextEncoder();
  const utf8 = encoder.encode(urlEncoded);
  const compressed = pako.deflate(utf8, { level: 9, windowBits: -15 });

  let binary = "";
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]);
  }

  return btoa(binary);
}

export function decodeDiagramXml(encoded) {
  try {
    if (!encoded || encoded.trim().length === 0) {
      return null;
    }
    
    // 验证 base64 字符串是否有效
    if (!isValidBase64(encoded)) {
      console.error("[decodeDiagramXml] Base64 字符串无效:", encoded.substring(0, 50));
      // 如果输入看起来像是 XML，直接返回
      const trimmed = encoded.trim();
      if (trimmed.startsWith('<') || trimmed.includes('<root>') || trimmed.includes('<mxfile>') || trimmed.includes('<mxGraphModel>')) {
        console.log("[decodeDiagramXml] 输入看起来是 XML 格式，直接返回");
        return trimmed;
      }
      return null;
    }
    
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decompressed = pako.inflate(bytes, { windowBits: -15 });
    const decoder = new TextDecoder("utf-8");
    const decoded = decoder.decode(decompressed);
    return decodeURIComponent(decoded);
  } catch (error) {
    console.error("Failed to decode diagram xml:", error);
    // 如果解码失败，尝试直接返回输入（可能是纯 XML）
    if (encoded && typeof encoded === 'string') {
      const trimmed = encoded.trim();
      if (trimmed.startsWith('<') || trimmed.includes('<root>') || trimmed.includes('<mxfile>') || trimmed.includes('<mxGraphModel>')) {
        console.log("[decodeDiagramXml] 解码失败，但输入看起来是 XML 格式，直接返回");
        return trimmed;
      }
    }
    return null;
  }
}

export function toBase64Xml(xml) {
  if (!xml || xml.trim().length === 0) {
    throw new Error("XML 内容不能为空");
  }
  try {
    if (typeof window === "undefined") {
      return Buffer.from(xml, "utf-8").toString("base64");
    }
    return window.btoa(unescape(encodeURIComponent(xml)));
  } catch (error) {
    console.error("Failed to encode XML to base64:", error);
    throw error;
  }
}
