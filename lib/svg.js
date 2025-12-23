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
 * 从 XML 中提取所有已使用的 ID
 * @param {string} xml - Draw.io XML 字符串
 * @returns {Set<number>} 已使用的 ID 集合
 */
function extractUsedIds(xml) {
    if (!xml || typeof xml !== "string") {
        return new Set();
    }
    const idPattern = /id="(\d+)"/g;
    const ids = new Set();
    let match;
    while ((match = idPattern.exec(xml)) !== null) {
        const id = parseInt(match[1], 10);
        if (Number.isFinite(id) && id >= 0) {
            ids.add(id);
        }
    }
    return ids;
}

/**
 * Normalize inline SVG markup and convert to a draw.io-compatible <root> block containing an image cell.
 * This allows SVG artwork to be rendered on the existing draw.io canvas without losing editability of layout.
 * 
 * @param {string} svg - SVG 标记字符串
 * @param {string|null} existingXml - 可选的现有画布 XML，用于确保 ID 唯一性
 * @returns {{rootXml: string, dataUrl: string, dimensions: {width: number, height: number}}}
 */
export function buildSvgRootXml(svg, existingXml = null) {
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

    // 动态生成 ID，避免与现有节点冲突
    let cellId = 2;
    if (existingXml) {
        const usedIds = extractUsedIds(existingXml);
        // 从 ID 2 开始查找，直到找到一个未使用的 ID
        while (usedIds.has(cellId)) {
            cellId++;
            // 防止无限循环（虽然不太可能，但作为安全措施）
            if (cellId > 100000) {
                console.warn("警告：ID 生成达到上限，使用默认 ID 2");
                cellId = 2;
                break;
            }
        }
    }

    const rootXml = `<root><mxCell id="0"/><mxCell id="1" parent="0"/>` +
        `<mxCell id="${cellId}" value="" style="${style}" vertex="1" parent="1">` +
        `<mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry" />` +
        `</mxCell></root>`;

    return {
        rootXml,
        dataUrl,
        dimensions: { width, height },
    };
}
