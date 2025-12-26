const XML_DECLARATION = /<\?xml.*?\?>/g;
const SVG_TAG = /<svg[\s>]/i;
const SVG_DIMENSION = /<svg[^>]*?(width|height)\s*=\s*["']([^"']+)["'][^>]*?/gi;
const SVG_VIEWBOX = /viewBox\s*=\s*["']\s*([0-9.+-]+)\s+[0-9.+-]+\s+([0-9.+-]+)\s+([0-9.+-]+)\s+([0-9.+-]+)\s*["']/i;
const SVG_EVENT_HANDLER = /\son[a-z]+\s*=/i;
const SVG_SCRIPT = /<script[\s>]/i;
const SVG_JAVASCRIPT_URI = /(href|xlink:href)\s*=\s*["']\s*javascript:/i;
const DEFAULT_CANVAS = { width: 800, height: 600 };
const MAX_SVG_VIEWPORT = { width: 760, height: 560 };
const MIN_SVG_SIZE = { width: 120, height: 80 };

/**
 * Convert an inline SVG markup string to a data URL that can be rendered with an <img /> tag.
 * Using an image element makes it easier to size with object-fit rules inside constrained containers.
 */
export function svgToDataUrl(svg) {
    if (!svg) {
        return null;
    }
    const trimmed = svg.trim();
    if (!trimmed) {
        return null;
    }
    const cleaned = trimmed.replace(XML_DECLARATION, "").trim();
    try {
        const encoded = encodeURIComponent(cleaned)
            .replace(/'/g, "%27")
            .replace(/"/g, "%22");
        return `data:image/svg+xml;charset=utf-8,${encoded}`;
    } catch {
        return null;
    }
}

function stripUnits(value) {
    if (!value) return null;
    const numeric = parseFloat(value.replace(/px/i, "").trim());
    return Number.isFinite(numeric) ? numeric : null;
}

function inferSvgDimensions(svg) {
    const dimensions = {};
    let match;

    while ((match = SVG_DIMENSION.exec(svg)) !== null) {
        const [, key, raw] = match;
        const parsed = stripUnits(raw);
        if (parsed && parsed > 0) {
            const dimensionKey = key === "width" ? "width" : "height";
            dimensions[dimensionKey] = parsed;
        }
    }

    if (dimensions.width && dimensions.height) {
        return { width: dimensions.width, height: dimensions.height };
    }

    const viewBoxMatch = svg.match(SVG_VIEWBOX);
    if (viewBoxMatch) {
        const width = parseFloat(viewBoxMatch[3]);
        const height = parseFloat(viewBoxMatch[4]);
        if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
            return { width, height };
        }
    }

    return null;
}

function assertSafeSvg(svg) {
    if (!SVG_TAG.test(svg)) {
        throw new Error("SVG 内容缺少 <svg> 根节点，无法渲染到画布。");
    }
    if (SVG_SCRIPT.test(svg) || SVG_EVENT_HANDLER.test(svg) || SVG_JAVASCRIPT_URI.test(svg)) {
        throw new Error("检测到潜在的脚本或事件处理器，出于安全原因拒绝加载该 SVG。");
    }
}

/**
 * Normalize inline SVG markup and convert to a draw.io-compatible <root> block containing an image cell.
 * This allows SVG artwork to be rendered on the existing draw.io canvas without losing editability of layout.
 */
export function buildSvgRootXml(svg) {
    if (!svg || typeof svg !== "string") {
        throw new Error("SVG 内容不能为空。");
    }

    const cleaned = svg.replace(XML_DECLARATION, "").trim();
    assertSafeSvg(cleaned);

    const dataUrl = svgToDataUrl(cleaned);
    if (!dataUrl) {
        throw new Error("SVG 内容无法编码为数据 URL。");
    }
    // 避免 style 中的分号破坏解析，使用纯 encodeURIComponent 形式的 data URI
    const styleImageUrl = `data:image/svg+xml,${encodeURIComponent(cleaned)}`;

    const inferred = inferSvgDimensions(cleaned) ?? {
        width: DEFAULT_CANVAS.width * 0.8,
        height: DEFAULT_CANVAS.height * 0.6,
    };

    const scale = Math.min(
        1,
        MAX_SVG_VIEWPORT.width / inferred.width,
        MAX_SVG_VIEWPORT.height / inferred.height
    );
    const width = Math.max(
        MIN_SVG_SIZE.width,
        Math.round(inferred.width * scale)
    );
    const height = Math.max(
        MIN_SVG_SIZE.height,
        Math.round(inferred.height * scale)
    );

    const x = Math.max(20, Math.round((DEFAULT_CANVAS.width - width) / 2));
    const y = Math.max(20, Math.round((DEFAULT_CANVAS.height - height) / 2));

    const style =
        `shape=image;imageAspect=1;aspect=fixed;verticalAlign=middle;` +
        `verticalLabelPosition=bottom;strokeColor=none;fillColor=none;` +
        `labelBackgroundColor=none;pointerEvents=1;image=${styleImageUrl};`;

    const rootXml = `<root><mxCell id="0"/><mxCell id="1" parent="0"/>` +
        `<mxCell id="2" value="" style="${style}" vertex="1" parent="1">` +
        `<mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry" />` +
        `</mxCell></root>`;

    return {
        rootXml,
        dataUrl,
        dimensions: { width, height },
    };
}

/**
 * 从 Draw.io XML 中提取 SVG 数据
 * 
 * 此函数主要用于 SVG 模式下，从 Draw.io XML（包含 SVG 作为 image cell）中提取 SVG 数据
 * 用于历史记录缩略图显示和"查看 SVG 预览"功能
 * 
 * @param {string} xml - Draw.io XML 字符串
 * @returns {{ svg: string | null, dataUrl: string | null }} 提取的 SVG 字符串和数据 URL，如果未找到则返回 null
 */
export function extractSvgFromDrawioXml(xml) {
    if (!xml || typeof xml !== "string") {
        return { svg: null, dataUrl: null };
    }

    try {
        // 使用 DOMParser 解析 XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "text/xml");
        
        // 检查解析错误
        const parseError = xmlDoc.querySelector("parsererror");
        if (parseError) {
            console.warn("[extractSvgFromDrawioXml] XML 解析失败:", parseError.textContent);
            return { svg: null, dataUrl: null };
        }

        // 查找所有 mxCell 元素
        const cells = xmlDoc.querySelectorAll("mxCell");
        
        for (const cell of cells) {
            const style = cell.getAttribute("style");
            if (!style) continue;

            // 查找 style 属性中包含 image=data:image/svg+xml 的 mxCell
            const imageMatch = style.match(/image=([^;]+)/);
            if (!imageMatch) continue;

            const imageValue = imageMatch[1];
            
            // 检查是否是 SVG data URL
            if (imageValue.startsWith("data:image/svg+xml")) {
                let svgData = imageValue;
                
                // 处理编码的 data URL
                // 格式1: data:image/svg+xml,<encoded>
                // 格式2: data:image/svg+xml;charset=utf-8,<encoded>
                // 格式3: data:image/svg+xml;base64,<base64>
                
                let encodedSvg = null;
                let isBase64 = false;
                
                if (imageValue.includes("base64,")) {
                    // Base64 编码的 SVG
                    const base64Index = imageValue.indexOf("base64,");
                    encodedSvg = imageValue.slice(base64Index + 7); // 跳过 "base64,"
                    isBase64 = true;
                } else if (imageValue.includes("charset=utf-8,")) {
                    // 带 charset 的 data URL
                    const charsetIndex = imageValue.indexOf("charset=utf-8,");
                    encodedSvg = imageValue.slice(charsetIndex + 14); // 跳过 "charset=utf-8,"
                } else {
                    // 普通的 data URL (data:image/svg+xml,<encoded>)
                    const commaIndex = imageValue.indexOf(",");
                    if (commaIndex !== -1) {
                        encodedSvg = imageValue.slice(commaIndex + 1);
                    }
                }
                
                if (encodedSvg) {
                    try {
                        if (isBase64) {
                            svgData = atob(encodedSvg);
                        } else {
                            svgData = decodeURIComponent(encodedSvg);
                        }
                    } catch (error) {
                        console.warn("[extractSvgFromDrawioXml] 解码失败:", error, { 
                            isBase64, 
                            encodedSvgPreview: encodedSvg.substring(0, 50) 
                        });
                        continue;
                    }
                }

                // 验证是否是有效的 SVG
                if (!svgData.trim().startsWith("<svg")) {
                    continue;
                }

                // 生成 data URL 用于显示
                const dataUrl = svgToDataUrl(svgData);
                
                return {
                    svg: svgData,
                    dataUrl: dataUrl || imageValue, // 如果转换失败，使用原始值
                };
            }
        }

        // 未找到 SVG image cell
        return { svg: null, dataUrl: null };
    } catch (error) {
        console.error("[extractSvgFromDrawioXml] 提取 SVG 失败:", error);
        return { svg: null, dataUrl: null };
    }
}
