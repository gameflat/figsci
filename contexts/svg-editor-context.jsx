"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import { nanoid } from "nanoid";
import { svgToDataUrl } from "@/lib/svg.js";

/**
 * @typedef {"select" | "rect" | "ellipse" | "line" | "text"} SvgTool
 */

/**
 * @typedef {Object} Transform
 * @property {number} [x]
 * @property {number} [y]
 * @property {number} [scaleX]
 * @property {number} [scaleY]
 * @property {number} [rotation]
 */

/**
 * @typedef {Object} SvgElementBase
 * @property {string} id
 * @property {string} [fill]
 * @property {string} [stroke]
 * @property {number} [strokeWidth]
 * @property {string} [strokeDasharray]
 * @property {string} [markerEnd]
 * @property {string} [markerStart]
 * @property {number} [opacity]
 * @property {Transform} [transform]
 * @property {boolean} [visible]
 * @property {boolean} [locked]
 */

/**
 * @typedef {SvgElementBase & {type: "rect", x: number, y: number, width: number, height: number, rx?: number, ry?: number}} RectElement
 */

/**
 * @typedef {SvgElementBase & {type: "ellipse", cx: number, cy: number, rx: number, ry: number}} EllipseElement
 */

/**
 * @typedef {SvgElementBase & {type: "line", x1: number, y1: number, x2: number, y2: number, startRef?: string | null, endRef?: string | null}} LineElement
 */

/**
 * @typedef {SvgElementBase & {type: "path", d: string}} PathElement
 */

/**
 * @typedef {SvgElementBase & {type: "text", x: number, y: number, text: string, fontSize?: number, fontWeight?: string, textAnchor?: "start" | "middle" | "end", dominantBaseline?: string}} TextElement
 */

/**
 * @typedef {RectElement | EllipseElement | LineElement | PathElement | TextElement} SvgElement
 */

/**
 * @typedef {Object} SvgDocument
 * @property {number} width
 * @property {number} height
 * @property {string | null} [viewBox]
 */

/**
 * @typedef {Object} HistoryEntry
 * @property {string} svg
 * @property {string | null} dataUrl
 * @property {number} timestamp
 */

/**
 * @typedef {Object} EditorSnapshot
 * @property {SvgDocument} doc
 * @property {SvgElement[]} elements
 * @property {string | null} [defs]
 */

const DEFAULT_DOC = {
    width: 960,
    height: 640,
    viewBox: "0 0 960 640",
};

const SvgEditorContext = createContext(null);

/**
 * @param {string | null | undefined} value
 * @param {number} [fallback=0]
 * @returns {number}
 */
function parseNumber(value, fallback = 0) {
    if (!value) return fallback;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * @param {string | null | undefined} value
 * @returns {number | undefined}
 */
function parseOptionalNumber(value) {
    if (!value) return undefined;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * @param {string | null} transform
 * @returns {Transform | undefined}
 */
function parseTransform(transform) {
    if (!transform) return undefined;
    const result = {};
    const translateMatch = transform.match(/translate\(([^)]+)\)/);
    if (translateMatch?.[1]) {
        const [x, y] = translateMatch[1].split(/[, ]+/).map(parseFloat);
        if (Number.isFinite(x)) result.x = x;
        if (Number.isFinite(y)) result.y = y;
    }
    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
    if (scaleMatch?.[1]) {
        const [sx, sy] = scaleMatch[1].split(/[, ]+/).map(parseFloat);
        if (Number.isFinite(sx)) result.scaleX = sx;
        if (Number.isFinite(sy)) result.scaleY = sy;
    }
    const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
    if (rotateMatch?.[1]) {
        const angle = parseFloat(rotateMatch[1]);
        if (Number.isFinite(angle)) result.rotation = angle;
    }
    return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * @param {Transform | undefined} transform
 * @returns {string | undefined}
 */
function serializeTransform(transform) {
    if (!transform) return undefined;
    const segments = [];
    if (Number.isFinite(transform.x) || Number.isFinite(transform.y)) {
        const x = transform.x ?? 0;
        const y = transform.y ?? 0;
        segments.push(`translate(${x} ${y})`);
    }
    if (
        Number.isFinite(transform.scaleX) ||
        Number.isFinite(transform.scaleY)
    ) {
        const sx = transform.scaleX ?? 1;
        const sy = transform.scaleY ?? sx;
        segments.push(`scale(${sx} ${sy})`);
    }
    if (Number.isFinite(transform.rotation)) {
        segments.push(`rotate(${transform.rotation})`);
    }
    return segments.length > 0 ? segments.join(" ") : undefined;
}

/**
 * @param {SvgElement} element
 * @returns {string}
 */
function elementToMarkup(element) {
    const common = [
        element.fill !== undefined ? `fill="${element.fill}"` : 'fill="none"',
        element.stroke !== undefined ? `stroke="${element.stroke}"` : "",
        element.strokeWidth !== undefined
            ? `stroke-width="${element.strokeWidth}"`
            : "",
        element.strokeDasharray ? `stroke-dasharray="${element.strokeDasharray}"` : "",
        element.markerEnd ? `marker-end="${element.markerEnd}"` : "",
        element.markerStart ? `marker-start="${element.markerStart}"` : "",
        element.opacity != null ? `opacity="${element.opacity}"` : "",
    ]
        .filter(Boolean)
        .join(" ");

    const transform = serializeTransform(element.transform);
    const transformAttr = transform ? ` transform="${transform}"` : "";

    switch (element.type) {
        case "rect":
            return `<rect id="${element.id}" x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}"${element.rx ? ` rx="${element.rx}"` : ""}${element.ry ? ` ry="${element.ry}"` : ""} ${common}${transformAttr} />`;
        case "ellipse":
            return `<ellipse id="${element.id}" cx="${element.cx}" cy="${element.cy}" rx="${element.rx}" ry="${element.ry}" ${common}${transformAttr} />`;
        case "line":
            return `<line id="${element.id}" x1="${element.x1}" y1="${element.y1}" x2="${element.x2}" y2="${element.y2}"${element.startRef ? ` data-start-ref="${element.startRef}"` : ""}${element.endRef ? ` data-end-ref="${element.endRef}"` : ""} ${common}${transformAttr} />`;
        case "path":
            return `<path id="${element.id}" d="${element.d}" ${common}${transformAttr} />`;
        case "text":
            return `<text id="${element.id}" x="${element.x}" y="${element.y}" ${element.fontSize ? `font-size="${element.fontSize}"` : ""} ${element.fontWeight ? `font-weight="${element.fontWeight}"` : ""} ${element.textAnchor ? `text-anchor="${element.textAnchor}"` : ""} ${common}${transformAttr}>${element.text}</text>`;
        default:
            return "";
    }
}

/**
 * @param {SvgDocument} doc
 * @param {SvgElement[]} elements
 * @returns {string}
 */
function buildSvgMarkup(doc, elements) {
    const viewBox =
        doc.viewBox && doc.viewBox.trim().length > 0
            ? doc.viewBox
            : `0 0 ${doc.width} ${doc.height}`;
    const body = elements
        .filter((el) => el.visible !== false)
        .map(elementToMarkup)
        .join("\n");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${doc.width}" height="${doc.height}" viewBox="${viewBox}">${body}</svg>`;
}

/**
 * @param {Element} node
 * @param {string} [inheritedTransform]
 * @returns {SvgElement | null}
 */
function parseElement(node, inheritedTransform) {
    const nodeTransform = node.getAttribute("transform");
    const combinedTransform = [inheritedTransform, nodeTransform]
        .filter(Boolean)
        .join(" ")
        .trim();
    const transform = parseTransform(combinedTransform || null);
    switch (node.tagName.toLowerCase()) {
        case "rect":
            return {
                id: node.getAttribute("id") || nanoid(),
                type: "rect",
                x: parseNumber(node.getAttribute("x")),
                y: parseNumber(node.getAttribute("y")),
                width: parseNumber(node.getAttribute("width")),
                height: parseNumber(node.getAttribute("height")),
                rx: parseOptionalNumber(node.getAttribute("rx")),
                ry: parseOptionalNumber(node.getAttribute("ry")),
                fill: node.getAttribute("fill") || undefined,
                stroke: node.getAttribute("stroke") || undefined,
                strokeWidth: parseOptionalNumber(node.getAttribute("stroke-width")),
                strokeDasharray: node.getAttribute("stroke-dasharray") || undefined,
                markerEnd: node.getAttribute("marker-end") || undefined,
                markerStart: node.getAttribute("marker-start") || undefined,
                opacity: parseOptionalNumber(node.getAttribute("opacity")),
                transform,
                visible: node.getAttribute("data-visible") !== "false",
                locked: node.getAttribute("data-locked") === "true",
            };
        case "circle": {
            const r = parseNumber(node.getAttribute("r"));
            return {
                id: node.getAttribute("id") || nanoid(),
                type: "ellipse",
                cx: parseNumber(node.getAttribute("cx")),
                cy: parseNumber(node.getAttribute("cy")),
                rx: r,
                ry: r,
                fill: node.getAttribute("fill") || undefined,
                stroke: node.getAttribute("stroke") || undefined,
                strokeWidth: parseOptionalNumber(node.getAttribute("stroke-width")),
                strokeDasharray: node.getAttribute("stroke-dasharray") || undefined,
                markerEnd: node.getAttribute("marker-end") || undefined,
                markerStart: node.getAttribute("marker-start") || undefined,
                opacity: parseOptionalNumber(node.getAttribute("opacity")),
                transform,
                visible: node.getAttribute("data-visible") !== "false",
                locked: node.getAttribute("data-locked") === "true",
            };
        }
        case "ellipse":
            return {
                id: node.getAttribute("id") || nanoid(),
                type: "ellipse",
                cx: parseNumber(node.getAttribute("cx")),
                cy: parseNumber(node.getAttribute("cy")),
                rx: parseNumber(node.getAttribute("rx")),
                ry: parseNumber(node.getAttribute("ry")),
                fill: node.getAttribute("fill") || undefined,
                stroke: node.getAttribute("stroke") || undefined,
                strokeWidth: parseOptionalNumber(node.getAttribute("stroke-width")),
                strokeDasharray: node.getAttribute("stroke-dasharray") || undefined,
                markerEnd: node.getAttribute("marker-end") || undefined,
                markerStart: node.getAttribute("marker-start") || undefined,
                opacity: parseOptionalNumber(node.getAttribute("opacity")),
                transform,
                visible: node.getAttribute("data-visible") !== "false",
                locked: node.getAttribute("data-locked") === "true",
            };
        case "line":
            return {
                id: node.getAttribute("id") || nanoid(),
                type: "line",
                x1: parseNumber(node.getAttribute("x1")),
                y1: parseNumber(node.getAttribute("y1")),
                x2: parseNumber(node.getAttribute("x2")),
                y2: parseNumber(node.getAttribute("y2")),
                startRef: node.getAttribute("data-start-ref"),
                endRef: node.getAttribute("data-end-ref"),
                stroke: node.getAttribute("stroke") || undefined,
                strokeWidth: parseOptionalNumber(node.getAttribute("stroke-width")),
                strokeDasharray: node.getAttribute("stroke-dasharray") || undefined,
                markerEnd: node.getAttribute("marker-end") || undefined,
                markerStart: node.getAttribute("marker-start") || undefined,
                opacity: parseOptionalNumber(node.getAttribute("opacity")),
                transform,
                visible: node.getAttribute("data-visible") !== "false",
                locked: node.getAttribute("data-locked") === "true",
            };
        case "path":
            return {
                id: node.getAttribute("id") || nanoid(),
                type: "path",
                d: node.getAttribute("d") || "",
                fill: node.getAttribute("fill") || undefined,
                stroke: node.getAttribute("stroke") || undefined,
                strokeWidth: parseOptionalNumber(node.getAttribute("stroke-width")),
                strokeDasharray: node.getAttribute("stroke-dasharray") || undefined,
                markerEnd: node.getAttribute("marker-end") || undefined,
                markerStart: node.getAttribute("marker-start") || undefined,
                opacity: parseOptionalNumber(node.getAttribute("opacity")),
                transform,
                visible: node.getAttribute("data-visible") !== "false",
                locked: node.getAttribute("data-locked") === "true",
            };
        case "polyline":
        case "polygon": {
            const points = node.getAttribute("points");
            if (!points) return null;
            const coords = points.trim().split(/\s+|,/);
            let d = "";
            for (let i = 0; i < coords.length; i += 2) {
                const x = parseFloat(coords[i]);
                const y = parseFloat(coords[i + 1]);
                if (Number.isFinite(x) && Number.isFinite(y)) {
                    d += (i === 0 ? "M" : "L") + `${x} ${y} `;
                }
            }
            if (node.tagName.toLowerCase() === "polygon") {
                d += "Z";
            }
            return {
                id: node.getAttribute("id") || nanoid(),
                type: "path",
                d: d.trim(),
                fill: node.getAttribute("fill") || "none",
                stroke: node.getAttribute("stroke") || undefined,
                strokeWidth: parseOptionalNumber(node.getAttribute("stroke-width")),
                strokeDasharray: node.getAttribute("stroke-dasharray") || undefined,
                markerEnd: node.getAttribute("marker-end") || undefined,
                markerStart: node.getAttribute("marker-start") || undefined,
                opacity: parseOptionalNumber(node.getAttribute("opacity")),
                transform,
                visible: node.getAttribute("data-visible") !== "false",
                locked: node.getAttribute("data-locked") === "true",
            };
        }
        case "text":
            return {
                id: node.getAttribute("id") || nanoid(),
                type: "text",
                x: parseNumber(node.getAttribute("x")),
                y: parseNumber(node.getAttribute("y")),
                text: node.textContent || "",
                fontSize: parseOptionalNumber(node.getAttribute("font-size")),
                fontWeight: node.getAttribute("font-weight") || undefined,
                textAnchor: node.getAttribute("text-anchor") || undefined,
                dominantBaseline: node.getAttribute("dominant-baseline") || undefined,
                fill: node.getAttribute("fill") || undefined,
                stroke: node.getAttribute("stroke") || undefined,
                strokeWidth: parseOptionalNumber(node.getAttribute("stroke-width")),
                strokeDasharray: node.getAttribute("stroke-dasharray") || undefined,
                markerEnd: node.getAttribute("marker-end") || undefined,
                markerStart: node.getAttribute("marker-start") || undefined,
                opacity: parseOptionalNumber(node.getAttribute("opacity")),
                transform,
                visible: node.getAttribute("data-visible") !== "false",
                locked: node.getAttribute("data-locked") === "true",
            };
        default:
            return null;
    }
}

/**
 * @param {string} svg
 * @returns {string}
 */
function decodeSvgContent(svg) {
    const trimmed = svg.trim();
    if (trimmed.startsWith("data:image/svg+xml")) {
        const commaIndex = trimmed.indexOf(",");
        const payload = commaIndex >= 0 ? trimmed.slice(commaIndex + 1) : trimmed;
        try {
            return decodeURIComponent(payload);
        } catch {
            return trimmed;
        }
    }
    return trimmed;
}

/**
 * @param {string} svg
 * @returns {{doc: SvgDocument, elements: SvgElement[], defs?: string | null, valid: boolean}}
 */
function parseSvgMarkup(svg) {
    console.log("Parsing SVG...", svg.slice(0, 200));
    const normalized = decodeSvgContent(svg);
    const parser = new DOMParser();
    const parsed = parser.parseFromString(normalized, "image/svg+xml");
    const svgEl = parsed.querySelector("svg");
    if (!svgEl) {
        console.warn("SVG 内容缺少 <svg> 根节点，忽略载入。内容片段：", normalized.slice(0, 120));
        return {
            doc: { ...DEFAULT_DOC },
            elements: [],
            defs: null,
            valid: false,
        };
    }
    const widthAttr = svgEl.getAttribute("width");
    const heightAttr = svgEl.getAttribute("height");
    const viewBox = svgEl.getAttribute("viewBox");
    const [vbX, vbY, vbW, vbH] = (viewBox || "")
        .split(/[\s,]+/)
        .map((value) => parseFloat(value))
        .filter((value) => Number.isFinite(value));
    const width =
        parseNumber(widthAttr, Number.isFinite(vbW) ? vbW : DEFAULT_DOC.width) || DEFAULT_DOC.width;
    const height =
        parseNumber(heightAttr, Number.isFinite(vbH) ? vbH : DEFAULT_DOC.height) || DEFAULT_DOC.height;

    const elements = [];
    const defsEl = svgEl.querySelector("defs");
    const defs = defsEl ? defsEl.innerHTML : null;
    const walker = (nodeList, inheritedTransform) => {
        for (const node of nodeList) {
            if (!(node instanceof Element)) continue;

            // STOP recursion for non-renderable containers
            const tagName = node.tagName.toLowerCase();
            if (["defs", "symbol", "marker", "pattern", "mask", "clippath", "style", "script", "title", "desc", "metadata"].includes(tagName)) {
                continue;
            }

            const parsedElement = parseElement(node, inheritedTransform);
            const nextTransform = [inheritedTransform, node.getAttribute("transform")]
                .filter(Boolean)
                .join(" ")
                .trim();
            if (parsedElement) {
                elements.push(parsedElement);
            }
            if (node.children && node.children.length > 0) {
                walker(Array.from(node.children), nextTransform || undefined);
            }
        }
    };
    walker(Array.from(svgEl.children));
    console.log(`Parsed ${elements.length} elements from SVG.`);

    return {
        doc: { width, height, viewBox: viewBox || `0 0 ${width} ${height}` },
        elements,
        defs,
        valid: true,
    };
}

/**
 * @param {{children: React.ReactNode}} props
 */
export function SvgEditorProvider({ children }) {
    const [doc, setDoc] = useState(DEFAULT_DOC);
    const [elements, setElements] = useState([]);
    const [tool, setTool] = useState("select");
    const [selectedId, setSelectedId] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [history, setHistory] = useState([]);
    const [activeHistoryIndex, setActiveHistoryIndex] = useState(-1);
    const [past, setPast] = useState([]);
    const [future, setFuture] = useState([]);
    const [defsMarkup, setDefsMarkup] = useState(null);

    /**
     * @param {SvgElement[]} [customElements]
     * @param {SvgDocument} [customDoc]
     * @param {string | null} [customDefs]
     * @returns {EditorSnapshot}
     */
    const takeSnapshot = useCallback(
        (customElements, customDoc, customDefs) => ({
            doc: { ...(customDoc ?? doc) },
            elements: (customElements ?? elements).map((el) => ({ ...el })),
            defs: customDefs ?? defsMarkup,
        }),
        [doc, elements, defsMarkup]
    );

    /**
     * @param {SvgElement[]} [customElements]
     * @param {SvgDocument} [customDoc]
     * @param {string | null} [customDefs]
     */
    const pushHistorySnapshot = useCallback(
        (customElements, customDoc, customDefs) => {
            setPast((prev) => {
                const next = [...prev, takeSnapshot(customElements, customDoc, customDefs)];
                return next.slice(-50);
            });
            setFuture([]);
        },
        [takeSnapshot]
    );

    /**
     * @param {Partial<SvgDocument>} partial
     */
    const updateDoc = useCallback(
        (partial) => {
            pushHistorySnapshot();
            setDoc((prev) => {
                const next = { ...prev, ...partial };
                const targetWidth = partial.width ?? prev.width;
                const targetHeight = partial.height ?? prev.height;
                const viewBoxMatchesSize =
                    prev.viewBox === `0 0 ${prev.width} ${prev.height}` || !prev.viewBox;
                if (viewBoxMatchesSize && (partial.width || partial.height)) {
                    next.viewBox = `0 0 ${targetWidth} ${targetHeight}`;
                }
                return next;
            });
        },
        [pushHistorySnapshot]
    );

    /**
     * @param {string} snapshotSvg
     */
    const addHistory = useCallback(
        (snapshotSvg) => {
            const dataUrl = svgToDataUrl(snapshotSvg);
            setHistory((prev) => {
                const next = [...prev, { svg: snapshotSvg, dataUrl, timestamp: Date.now() }];
                setActiveHistoryIndex(next.length - 1);
                return next;
            });
        },
        []
    );

    /**
     * @returns {string}
     */
    const exportSvgMarkup = useCallback(() => {
        const viewBox =
            doc.viewBox && doc.viewBox.trim().length > 0
                ? doc.viewBox
                : `0 0 ${doc.width} ${doc.height}`;
        const defsContent = defsMarkup ? `<defs>${defsMarkup}</defs>` : "";
        const body = elements
            .filter((el) => el.visible !== false)
            .map(elementToMarkup)
            .join("\n");
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${doc.width}" height="${doc.height}" viewBox="${viewBox}">${defsContent}${body}</svg>`;
    }, [doc, elements, defsMarkup]);

    /**
     * @param {Omit<SvgElement, "id"> | SvgElement} element
     * @returns {string}
     */
    const addElement = useCallback(
        (element) => {
            pushHistorySnapshot();
            const next =
                "id" in element && element.id
                    ? element
                    : { ...element, id: nanoid() };
            if (next.visible === undefined) next.visible = true;
            if (next.locked === undefined) next.locked = false;
            setElements((prev) => [...prev, next]);
            setSelectedId(next.id);
            return next.id;
        },
        [pushHistorySnapshot]
    );

    /**
     * @param {string} id
     * @param {Partial<SvgElement> | ((element: SvgElement) => SvgElement)} updater
     * @param {{record?: boolean}} [options]
     */
    const updateElement = useCallback(
        (id, updater, options) => {
            if (options?.record !== false) {
                pushHistorySnapshot();
            }
            setElements((prev) => {
                let delta = null;
                /**
                 * @param {SvgElement} el
                 * @returns {{x: number, y: number} | null}
                 */
                const getPosition = (el) => {
                    switch (el.type) {
                        case "rect":
                            return { x: el.x, y: el.y };
                        case "ellipse":
                            return { x: el.cx, y: el.cy };
                        case "line":
                            return null;
                        case "text":
                            return { x: el.x, y: el.y };
                        case "path":
                            return { x: el.transform?.x ?? 0, y: el.transform?.y ?? 0 };
                        default:
                            return null;
                    }
                };
                const updated = prev.map((item) => {
                    if (item.id !== id) return item;
                    const next =
                        typeof updater === "function"
                            ? updater(item)
                            : { ...item, ...updater };
                    if (item.type !== "line") {
                        const prevPos = getPosition(item);
                        const nextPos = getPosition(next);
                        if (prevPos && nextPos) {
                            delta = {
                                dx: (nextPos.x ?? 0) - (prevPos.x ?? 0),
                                dy: (nextPos.y ?? 0) - (prevPos.y ?? 0),
                            };
                        }
                    }
                    return next;
                });
                if (delta && (delta.dx !== 0 || delta.dy !== 0)) {
                    return updated.map((item) => {
                        if (item.type === "line" && (item.startRef === id || item.endRef === id)) {
                            return {
                                ...item,
                                x1: item.x1 + (item.startRef === id ? delta.dx : 0),
                                y1: item.y1 + (item.startRef === id ? delta.dy : 0),
                                x2: item.x2 + (item.endRef === id ? delta.dx : 0),
                                y2: item.y2 + (item.endRef === id ? delta.dy : 0),
                            };
                        }
                        return item;
                    });
                }
                return updated;
            });
        },
        [pushHistorySnapshot]
    );

    /**
     * @param {string} id
     * @param {number} dx
     * @param {number} dy
     * @param {{record?: boolean}} [options]
     */
    const moveElement = useCallback(
        (id, dx, dy, options) => {
            if (options?.record) {
                pushHistorySnapshot();
            }
            setElements((prev) =>
                prev.map((element) => {
                    if (element.id === id) {
                        switch (element.type) {
                            case "rect":
                                return { ...element, x: element.x + dx, y: element.y + dy };
                            case "ellipse":
                                return { ...element, cx: element.cx + dx, cy: element.cy + dy };
                            case "line":
                                return {
                                    ...element,
                                    x1: element.x1 + dx,
                                    y1: element.y1 + dy,
                                    x2: element.x2 + dx,
                                    y2: element.y2 + dy,
                                };
                            case "text":
                                return { ...element, x: element.x + dx, y: element.y + dy };
                            case "path": {
                                const transform = {
                                    ...(element.transform || {}),
                                    x: (element.transform?.x || 0) + dx,
                                    y: (element.transform?.y || 0) + dy,
                                };
                                return { ...element, transform };
                            }
                            default:
                                return element;
                        }
                    }
                    if (
                        element.type === "line" &&
                        (element.startRef === id || element.endRef === id)
                    ) {
                        return {
                            ...element,
                            x1: element.x1 + (element.startRef === id ? dx : 0),
                            y1: element.y1 + (element.startRef === id ? dy : 0),
                            x2: element.x2 + (element.endRef === id ? dx : 0),
                            y2: element.y2 + (element.endRef === id ? dy : 0),
                        };
                    }
                    return element;
                })
            );
        },
        [pushHistorySnapshot]
    );

    /**
     * @param {string} id
     */
    const removeElement = useCallback(
        (id) => {
            pushHistorySnapshot();
            setElements((prev) => prev.filter((item) => item.id !== id));
            setSelectedId((prev) => (prev === id ? null : prev));
        },
        [pushHistorySnapshot]
    );

    /**
     * @param {string} id
     * @returns {string | null}
     */
    const duplicateElement = useCallback(
        (id) => {
            const original = elements.find((el) => el.id === id);
            if (!original) return null;
            pushHistorySnapshot();
            const clone = {
                ...original,
                id: nanoid(),
            };
            switch (clone.type) {
                case "rect":
                    clone.x += 12;
                    clone.y += 12;
                    break;
                case "ellipse":
                    clone.cx += 12;
                    clone.cy += 12;
                    break;
                case "line":
                    clone.x1 += 12;
                    clone.x2 += 12;
                    clone.y1 += 12;
                    clone.y2 += 12;
                    break;
                case "text":
                    clone.x += 12;
                    clone.y += 12;
                    break;
                case "path":
                    clone.transform = {
                        ...(clone.transform || {}),
                        x: (clone.transform?.x || 0) + 12,
                        y: (clone.transform?.y || 0) + 12,
                    };
                    break;
                default:
                    break;
            }
            setElements((prev) => [...prev, clone]);
            setSelectedId(clone.id);
            return clone.id;
        },
        [elements, pushHistorySnapshot]
    );

    /**
     * @param {Iterable<string>} ids
     * @returns {string[]}
     */
    const duplicateMany = useCallback(
        (ids) => {
            const idList = Array.from(ids);
            if (idList.length === 0) return [];
            pushHistorySnapshot();
            const created = [];
            setElements((prev) => {
                const next = [...prev];
                idList.forEach((id) => {
                    const original = prev.find((el) => el.id === id);
                    if (!original) return;
                    const clone = {
                        ...original,
                        id: nanoid(),
                    };
                    switch (clone.type) {
                        case "rect":
                            clone.x += 12;
                            clone.y += 12;
                            break;
                        case "ellipse":
                            clone.cx += 12;
                            clone.cy += 12;
                            break;
                        case "line":
                            clone.x1 += 12;
                            clone.x2 += 12;
                            clone.y1 += 12;
                            clone.y2 += 12;
                            break;
                        case "text":
                            clone.x += 12;
                            clone.y += 12;
                            break;
                        case "path":
                            clone.transform = {
                                ...(clone.transform || {}),
                                x: (clone.transform?.x || 0) + 12,
                                y: (clone.transform?.y || 0) + 12,
                            };
                            break;
                        default:
                            break;
                    }
                    created.push(clone.id);
                    next.push(clone);
                });
                return next;
            });
            setSelectedId(created.length === 1 ? created[0] : null);
            setSelectedIds(new Set(created));
            return created;
        },
        [elements, pushHistorySnapshot]
    );

    /**
     * @param {Iterable<string>} ids
     */
    const removeMany = useCallback(
        (ids) => {
            const idList = Array.from(ids);
            if (idList.length === 0) return;
            pushHistorySnapshot();
            setElements((prev) => prev.filter((item) => !idList.includes(item.id)));
            setSelectedId(null);
            setSelectedIds(new Set());
        },
        [pushHistorySnapshot]
    );

    /**
     * @param {string} svg
     * @param {{saveHistory?: boolean}} [options]
     */
    const loadSvgMarkup = useCallback(
        (svg, options) => {
            try {
                const content = svg.trim();
                if (!content.toLowerCase().includes("<svg")) {
                    console.warn("忽略非 SVG 内容载入：", content.slice(0, 120));
                    return;
                }
                const parsed = parseSvgMarkup(svg);
                if (!parsed.valid) {
                    return;
                }
                setDoc(parsed.doc);
                setElements(parsed.elements);
                setDefsMarkup(parsed.defs ?? null);
                setSelectedId(null);
                pushHistorySnapshot(parsed.elements, parsed.doc, parsed.defs ?? null);
                if (options?.saveHistory !== false) {
                    const snapshot = buildSvgMarkup(parsed.doc, parsed.elements);
                    addHistory(snapshot);
                }
            } catch (error) {
                console.error("解析 SVG 失败：", error);
            }
        },
        [addHistory, pushHistorySnapshot]
    );

    const clearSvg = useCallback(() => {
        pushHistorySnapshot();
        setDoc(DEFAULT_DOC);
        setElements([]);
        setDefsMarkup(null);
        setSelectedId(null);
        setHistory([]);
        setActiveHistoryIndex(-1);
        setPast([]);
        setFuture([]);
    }, [pushHistorySnapshot]);

    /**
     * @param {number} index
     */
    const restoreHistoryAt = useCallback((index) => {
        const entry = history[index];
        if (!entry) return;
        try {
            const parsed = parseSvgMarkup(entry.svg);
            setDoc(parsed.doc);
            setElements(
                parsed.elements.map((el) => ({
                    ...el,
                    visible: el.visible !== false,
                    locked: el.locked === true,
                }))
            );
            setSelectedId(null);
            setActiveHistoryIndex(index);
        } catch (error) {
            console.error("恢复历史失败：", error);
        }
    }, [history]);

    const undo = useCallback(() => {
        setPast((prev) => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            setFuture((f) => [takeSnapshot(), ...f].slice(0, 50));
            setDoc(last.doc);
            setElements(last.elements);
            setSelectedId(null);
            return prev.slice(0, -1);
        });
    }, [takeSnapshot]);

    const redo = useCallback(() => {
        setFuture((prev) => {
            if (prev.length === 0) return prev;
            const next = prev[0];
            setPast((p) => [...p, takeSnapshot()].slice(-50));
            setDoc(next.doc);
            setElements(next.elements);
            setSelectedId(null);
            return prev.slice(1);
        });
    }, [takeSnapshot]);

    const value = useMemo(
        () => ({
            doc,
            elements,
            tool,
            setTool,
            updateDoc,
            selectedId,
            setSelectedId,
            selectedIds,
            setSelectedIds,
            addElement,
            updateElement,
            moveElement,
            loadSvgMarkup,
            exportSvgMarkup,
            clearSvg,
            removeElement,
            duplicateElement,
            duplicateMany,
            removeMany,
            history,
            activeHistoryIndex,
            restoreHistoryAt,
            undo,
            redo,
            commitSnapshot: () => pushHistorySnapshot(),
            defsMarkup,
        }),
        [
            doc,
            elements,
            tool,
            selectedId,
            selectedIds,
            addElement,
            updateElement,
            moveElement,
            updateDoc,
            loadSvgMarkup,
            exportSvgMarkup,
            clearSvg,
            removeElement,
            duplicateElement,
            duplicateMany,
            removeMany,
            history,
            activeHistoryIndex,
            restoreHistoryAt,
            undo,
            redo,
            pushHistorySnapshot,
            defsMarkup,
        ]
    );

    return (
        <SvgEditorContext.Provider value={value}>
            {children}
        </SvgEditorContext.Provider>
    );
}

export function useSvgEditor() {
    const context = useContext(SvgEditorContext);
    if (!context) {
        throw new Error("useSvgEditor must be used within SvgEditorProvider");
    }
    return context;
}
