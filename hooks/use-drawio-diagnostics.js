"use client";

import { useEffect } from "react";
import { isDrawioRuntimeErrorMessage } from "@/lib/diagram-validation.js";

/**
 * @typedef {Object} RuntimeErrorPayload
 * @property {string} type
 * @property {string} message
 * @property {any} [rawEvent]
 */

/**
 * @typedef {Object} UseDrawioDiagnosticsOptions
 * @property {string} [baseUrl]
 * @property {(error: RuntimeErrorPayload) => void} [onRuntimeError]
 * @property {(event: any) => void} [onRuntimeSignal]
 */

/**
 * @param {string} origin
 * @param {string} [expected]
 * @returns {boolean}
 */
function isFromDrawio(origin, expected) {
    if (!origin) {
        return false;
    }
    const normalizedOrigin = origin.toLowerCase();
    if (normalizedOrigin.includes("embed.diagrams.net")) {
        return true;
    }
    if (!expected) {
        return false;
    }
    try {
        const expectedUrl = new URL(expected);
        return normalizedOrigin.startsWith(expectedUrl.origin.toLowerCase());
    } catch {
        return false;
    }
}

/**
 * @param {MessageEvent} event
 * @returns {any}
 */
function parseMessage(event) {
    if (typeof event.data === "string") {
        try {
            return JSON.parse(event.data);
        } catch {
            return event.data;
        }
    }
    return event.data;
}

/**
 * @param {UseDrawioDiagnosticsOptions} options
 */
export function useDrawioDiagnostics({
    baseUrl,
    onRuntimeError,
    onRuntimeSignal,
}) {
    useEffect(() => {
        /**
         * @param {MessageEvent} event
         */
        const handler = (event) => {
            if (!isFromDrawio(event.origin ?? "", baseUrl)) {
                return;
            }
            const payload = parseMessage(event);
            if (!payload) {
                return;
            }

            if (typeof payload?.event === "string") {
                onRuntimeSignal?.(payload);
                if (
                    payload.event === "status" &&
                    typeof payload?.message === "string" &&
                    isDrawioRuntimeErrorMessage(payload.message)
                ) {
                    onRuntimeError?.({
                        type: "status",
                        message: payload.message,
                        rawEvent: payload,
                    });
                    return;
                }

                if (
                    payload.event === "merge" &&
                    typeof payload?.error === "string" &&
                    payload.error.length > 0
                ) {
                    onRuntimeError?.({
                        type: "merge",
                        message: payload.error,
                        rawEvent: payload,
                    });
                    return;
                }
            }

            if (
                typeof payload === "string" &&
                isDrawioRuntimeErrorMessage(payload)
            ) {
                onRuntimeError?.({
                    type: "raw",
                    message: payload,
                    rawEvent: payload,
                });
            }
        };

        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, [baseUrl, onRuntimeError, onRuntimeSignal]);
}

