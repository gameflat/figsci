import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as pako from "pako";

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

export function extractDiagramXML(xml_svg_string) {
  try {
    // 1. Parse the SVG string (using built-in DOMParser in a browser-like environment)
    const svgString = atob(xml_svg_string.slice(26));
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.querySelector('svg');

    if (!svgElement) {
      throw new Error("No SVG element found in the input string.");
    }
    // 2. Extract the 'content' attribute
    const encodedContent = svgElement.getAttribute('content');

    if (!encodedContent) {
      throw new Error("SVG element does not have a 'content' attribute.");
    }

    // 3. Decode HTML entities (using a minimal function)
    function decodeHtmlEntities(str) {
      const textarea = document.createElement('textarea'); // Use built-in element
      textarea.innerHTML = str;
      return textarea.value;
    }
    const xmlContent = decodeHtmlEntities(encodedContent);

    // 4. Parse the XML content
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    const diagramElement = xmlDoc.querySelector('diagram');

    if (!diagramElement) {
      throw new Error("No diagram element found");
    }
    // 5. Extract base64 encoded data
    const base64EncodedData = diagramElement.textContent;

    if (!base64EncodedData) {
      throw new Error("No encoded data found in the diagram element");
    }

    // 6. Decode base64 data
    const binaryString = atob(base64EncodedData);

    // 7. Convert binary string to Uint8Array
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 8. Decompress data using pako (equivalent to zlib.decompress with wbits=-15)
    const decompressedData = pako.inflate(bytes, { windowBits: -15 });

    // 9. Convert the decompressed data to a string
    const decoder = new TextDecoder('utf-8');
    const decodedString = decoder.decode(decompressedData);

    // Decode URL-encoded content (equivalent to Python's urllib.parse.unquote)
    const urlDecodedString = decodeURIComponent(decodedString);

    return urlDecodedString;

  } catch (error) {
    console.error("Error extracting diagram XML:", error);
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
