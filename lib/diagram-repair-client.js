/**
 * @typedef {import("@/types/model-config.d.ts").RuntimeModelConfig} RuntimeModelConfig
 */

/**
 * @typedef {"display" | "edit"} DiagramRepairStrategy
 */

/**
 * @typedef {Object} DiagramRepairRequest
 * @property {string} invalidXml
 * @property {string} [currentXml]
 * @property {string} [errorContext]
 * @property {RuntimeModelConfig} [modelRuntime]
 */

/**
 * @typedef {Object} DiagramRepairResponse
 * @property {DiagramRepairStrategy} strategy
 * @property {string} [xml]
 * @property {Array<{search: string, replace: string}>} [edits]
 * @property {string} [notes]
 */

/**
 * 调用后端修复接口并返回模型策略。
 * @param {DiagramRepairRequest} payload
 * @returns {Promise<DiagramRepairResponse>}
 */
export async function requestDiagramRepair(payload) {
    const response = await fetch("/api/diagram-repair", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            invalidXml: payload.invalidXml,
            currentXml: payload.currentXml,
            errorContext: payload.errorContext,
            modelRuntime: payload.modelRuntime,
        }),
    });

    if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: "repair_failed" }));
        throw new Error(
            typeof error === "string" ? error : "自动修复接口调用失败"
        );
    }

    /** @type {DiagramRepairResponse} */
    const data = await response.json();
    if (data.strategy !== "display" && data.strategy !== "edit") {
        throw new Error("无法识别的自动修复策略。");
    }
    return data;
}
