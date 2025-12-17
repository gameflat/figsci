import { convertToLegalXml } from "@/lib/utils.js";

/**
 * @typedef {"empty-input" | "parser-error" | "duplicate-id" | "missing-id"} DiagramValidationErrorCode
 */

/**
 * @typedef {Object} DiagramValidationError
 * @property {DiagramValidationErrorCode} code
 * @property {string} message
 * @property {number} [line]
 * @property {number} [column]
 * @property {string} [snippet]
 */

/**
 * @typedef {Object} DiagramValidationResult
 * @property {boolean} isValid
 * @property {string} normalizedXml
 * @property {DiagramValidationError[]} errors
 */

const DRAWIO_RUNTIME_ERROR_PATTERNS = [
    /非绘图文件/i,
    /not a diagram file/i,
    /attributes?\s+construct\s+error/i,
    /d\.setid\s+is\s+not\s+function/i,
    /xml\s+apply\s+error/i,
    /mxgraph/i,
];

function extractLineAndColumn(message) {
    const match = message.match(/line\s+(\d+).+column\s+(\d+)/i);
    if (!match) {
        return {};
    }
    return {
        line: Number.parseInt(match[1], 10),
        column: Number.parseInt(match[2], 10),
    };
}

export function normalizeGeneratedXml(xml) {
    if (!xml || xml.trim().length === 0) {
        return "<root></root>";
    }

    const trimmed = xml.trim();
    if (/^<root[\s>]/i.test(trimmed)) {
        return trimmed;
    }
    if (trimmed.includes("<mxGraphModel")) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(trimmed, "text/xml");
            const parserError = doc.querySelector("parsererror");
            if (!parserError) {
                const root = doc.querySelector("mxGraphModel > root");
                if (root) {
                    return root.outerHTML;
                }
            }
        } catch {
            // Fallback to regex-based sanitization below
        }
    }
    return convertToLegalXml(trimmed);
}

/**
 * 验证 XML 是否可以被 draw.io 接受。
 * @param {string} xml
 * @returns {DiagramValidationResult}
 */
export function validateDiagramXml(xml) {
    const normalizedXml = normalizeGeneratedXml(xml);
    const errors = [];

    if (!normalizedXml.trim()) {
        errors.push({
            code: "empty-input",
            message: "生成的 XML 内容为空，无法应用到画布。",
        });
        return { isValid: false, normalizedXml, errors };
    }

    const wrapped = normalizedXml.startsWith("<root")
        ? normalizedXml
        : `<root>${normalizedXml}</root>`;

    const parser = new DOMParser();
    const doc = parser.parseFromString(
        `<mxGraphModel>${wrapped}</mxGraphModel>`,
        "text/xml"
    );
    const parserError = doc.querySelector("parsererror");
    if (parserError) {
        const text = parserError.textContent ?? "未知的 XML 解析错误";
        errors.push({
            code: "parser-error",
            message: text.replace(/\s+/g, " ").trim(),
            ...extractLineAndColumn(text),
            snippet: parserError.innerHTML ?? undefined,
        });
        return { isValid: false, normalizedXml, errors };
    }

    const idSet = new Set();
    const mxCells = doc.querySelectorAll("mxGraphModel > root > mxCell");
    mxCells.forEach((cell) => {
        const id = cell.getAttribute("id");
        if (!id) {
            errors.push({
                code: "missing-id",
                message:
                    "检测到缺少 id 属性的 mxCell，draw.io 无法识别该元素。",
                snippet: cell.outerHTML.slice(0, 120),
            });
            return;
        }
        if (idSet.has(id) && id !== "0" && id !== "1") {
            errors.push({
                code: "duplicate-id",
                message: `发现重复的 mxCell id="${id}"，这会导致 draw.io 载入失败。`,
                snippet: cell.outerHTML.slice(0, 120),
            });
        } else {
            idSet.add(id);
        }
    });

    // 验证 mxPoint 元素：检查所有 mxPoint 的格式和位置
    const mxPoints = doc.querySelectorAll("mxPoint");
    mxPoints.forEach((point) => {
        const x = point.getAttribute("x");
        const y = point.getAttribute("y");
        const parent = point.parentElement;
        
        // 检查 mxPoint 是否在正确的位置（应该在 Array > points 中，Array 在 mxGeometry 中）
        const isInGeometry = parent?.tagName === "Array" && 
                            parent?.getAttribute("as") === "points" &&
                            parent?.parentElement?.tagName === "mxGeometry";
        
        if (!isInGeometry) {
            errors.push({
                code: "invalid-mxpoint-location",
                message: "mxPoint 元素必须位于 <mxGeometry><Array as=\"points\"> 内部，不能作为 mxCell 的直接子元素。",
                snippet: point.outerHTML,
            });
        }
        
        // 检查 x 和 y 属性是否存在且为有效数字
        if (!x || !y) {
            errors.push({
                code: "missing-mxpoint-attribute",
                message: `mxPoint 必须包含 x 和 y 属性，当前: x="${x}", y="${y}"`,
                snippet: point.outerHTML,
            });
        } else {
            // 验证 x 和 y 是否为纯数字（不包含单位或其他字符）
            const xNum = parseFloat(x);
            const yNum = parseFloat(y);
            if (isNaN(xNum) || isNaN(yNum) || x !== String(xNum) || y !== String(yNum)) {
                errors.push({
                    code: "invalid-mxpoint-value",
                    message: `mxPoint 的 x 和 y 属性必须是纯数字，不能包含单位或其他字符。当前: x="${x}", y="${y}"`,
                    snippet: point.outerHTML,
                });
            }
        }
    });

    return {
        isValid: errors.length === 0,
        normalizedXml,
        errors,
    };
}

export function isDrawioRuntimeErrorMessage(message) {
    if (!message) {
        return false;
    }
    return DRAWIO_RUNTIME_ERROR_PATTERNS.some((pattern) =>
        pattern.test(message)
    );
}
