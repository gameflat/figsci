"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";

/**
 * @typedef {import("ai").UIMessage} Message
 *
 * @typedef {Object} ConversationBranchMeta
 * @property {"root" | "comparison" | "manual" | "history"} type
 * @property {"drawio" | "svg"} [renderMode] - 渲染模式（仅根分支）
 * @property {string} [comparisonRequestId]
 * @property {string} [comparisonResultId]
 * @property {string} [label]
 *
 * @typedef {Object} ConversationBranch
 * @property {string} id
 * @property {string | null} parentId
 * @property {string} label
 * @property {string} createdAt
 * @property {Message[]} messages
 * @property {string | null} diagramXml
 * @property {ConversationBranchMeta} [meta]
 *
 * @typedef {Object} CreateBranchInput
 * @property {string} [label]
 * @property {string | null} [diagramXml]
 * @property {boolean} [inheritMessages]
 * @property {ConversationBranchMeta} [meta]
 * @property {string} [parentId]
 * @property {boolean} [activate]
 * @property {Message[]} [seedMessages]
 *
 * @typedef {Object} ConversationContextValue
 * @property {Record<string, ConversationBranch>} branches
 * @property {ConversationBranch[]} branchList
 * @property {ConversationBranch[]} branchTrail
 * @property {string} activeBranchId
 * @property {ConversationBranch} activeBranch
 * @property {"drawio" | "svg"} activeRenderMode - 当前活跃的渲染模式
 * @property {(input?: CreateBranchInput) => ConversationBranch | null} createBranch
 * @property {(branchId: string) => ConversationBranch | null} switchBranch
 * @property {(renderMode: "drawio" | "svg") => ConversationBranch | null} switchRenderMode - 切换渲染模式
 * @property {(messages: Message[]) => void} updateActiveBranchMessages
 * @property {(diagramXml: string | null) => void} updateActiveBranchDiagram
 * @property {() => void} resetActiveBranch
 */

const ROOT_BRANCH_ID_DRAWIO = "branch-root-drawio";
const ROOT_BRANCH_ID_SVG = "branch-root-svg";
// 为了向后兼容，保留旧的 ROOT_BRANCH_ID，默认指向 Draw.io 模式
const ROOT_BRANCH_ID = ROOT_BRANCH_ID_DRAWIO;

/** @type {React.Context<ConversationContextValue | undefined>} */
const ConversationContext = createContext(undefined);

const createBranchId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `branch-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

/**
 * 根据渲染模式获取根分支ID
 * @param {"drawio" | "svg"} renderMode
 * @returns {string}
 */
const getRootBranchId = (renderMode) => {
    return renderMode === "svg" ? ROOT_BRANCH_ID_SVG : ROOT_BRANCH_ID_DRAWIO;
};

/**
 * 为指定模式创建根分支
 * @param {"drawio" | "svg"} renderMode
 * @returns {ConversationBranch}
 */
const createRootBranchForMode = (renderMode) => ({
    id: getRootBranchId(renderMode),
    parentId: null,
    label: renderMode === "svg" ? "SVG模式主干" : "Draw.io模式主干",
    createdAt: new Date().toISOString(),
    messages: [],
    diagramXml: null,
    meta: { type: "root", renderMode },
});

/** @returns {ConversationBranch} */
const createRootBranch = () => createRootBranchForMode("drawio");

const cloneMessages = (messages) => messages.map((message) => ({ ...message }));

/**
 * @param {{ children: React.ReactNode }} props
 */
export function ConversationProvider({ children }) {
    // 初始化时，为两种模式创建根分支
    const [branches, setBranches] = useState(() => {
        const drawioRoot = createRootBranchForMode("drawio");
        const svgRoot = createRootBranchForMode("svg");
        return {
            [drawioRoot.id]: drawioRoot,
            [svgRoot.id]: svgRoot,
        };
    });
    const [branchOrder, setBranchOrder] = useState([ROOT_BRANCH_ID_DRAWIO, ROOT_BRANCH_ID_SVG]);
    const [activeBranchId, setActiveBranchId] = useState(ROOT_BRANCH_ID_DRAWIO);
    const pendingBranchRef = useRef(null);

    // 根据当前活跃分支推断渲染模式
    const activeRenderMode = useMemo(() => {
        const currentBranch = branches[activeBranchId];
        if (currentBranch?.meta?.renderMode) {
            return currentBranch.meta.renderMode;
        }
        // 根据分支ID判断
        if (activeBranchId === ROOT_BRANCH_ID_SVG || activeBranchId.startsWith("branch-") && branches[activeBranchId]?.parentId === ROOT_BRANCH_ID_SVG) {
            // 检查是否是SVG模式的分支（通过遍历父分支链）
            let current = branches[activeBranchId];
            const visited = new Set();
            while (current && !visited.has(current.id)) {
                visited.add(current.id);
                if (current.id === ROOT_BRANCH_ID_SVG || current.meta?.renderMode === "svg") {
                    return "svg";
                }
                if (current.id === ROOT_BRANCH_ID_DRAWIO || current.meta?.renderMode === "drawio") {
                    return "drawio";
                }
                current = current.parentId ? branches[current.parentId] : null;
            }
            return "svg";
        }
        return "drawio";
    }, [activeBranchId, branches]);

    const activeBranch =
        branches[activeBranchId] ?? branches[ROOT_BRANCH_ID_DRAWIO] ?? createRootBranchForMode("drawio");

    const branchList = useMemo(
        () =>
            branchOrder
                .map((id) => branches[id])
                .filter(Boolean),
        [branchOrder, branches]
    );

    const branchTrail = useMemo(() => {
        const trail = [];
        let current = activeBranch;
        const guard = new Set();
        while (current && !guard.has(current.id)) {
            guard.add(current.id);
            trail.unshift(current);
            current =
                current.parentId && branches[current.parentId]
                    ? branches[current.parentId]
                    : undefined;
        }
        return trail;
    }, [activeBranch, branches]);

    const updateActiveBranchMessages = useCallback(
        (messages) => {
            setBranches((prev) => {
                const branch = prev[activeBranchId];
                if (!branch) {
                    return prev;
                }
                if (branch.messages === messages) {
                    return prev;
                }
                return {
                    ...prev,
                    [activeBranchId]: {
                        ...branch,
                        messages,
                    },
                };
            });
        },
        [activeBranchId]
    );

    const updateActiveBranchDiagram = useCallback(
        (diagramXml) => {
            setBranches((prev) => {
                const branch = prev[activeBranchId];
                if (!branch) {
                    return prev;
                }
                if (branch.diagramXml === diagramXml) {
                    return prev;
                }
                return {
                    ...prev,
                    [activeBranchId]: {
                        ...branch,
                        diagramXml,
                    },
                };
            });
        },
        [activeBranchId]
    );

    const resetActiveBranch = useCallback(() => {
        setBranches((prev) => {
            const branch = prev[activeBranchId];
            if (!branch) {
                return prev;
            }
            return {
                ...prev,
                [activeBranchId]: {
                    ...branch,
                    messages: [],
                },
            };
        });
    }, [activeBranchId]);

    const createBranch = useCallback(
        (input) => {
            const sourceId = input?.parentId ?? activeBranchId;
            const inheritMessages =
                input?.inheritMessages === undefined ? true : input.inheritMessages;
            const labelFromInput = input?.label?.trim();
            const shouldActivate =
                input?.activate === undefined ? true : input.activate;
            const newId = createBranchId();
            pendingBranchRef.current = null;

            // 边界检查：确保 source branch 存在
            const parent = branches[sourceId];
            if (!parent) {
                console.error(`无法创建分支：父分支 ${sourceId} 不存在`);
                return null;
            }

            // 边界检查：验证 seedMessages 数组
            const seedMessages =
                input?.seedMessages && Array.isArray(input.seedMessages) && input.seedMessages.length > 0
                    ? cloneMessages(input.seedMessages)
                    : null;

            // 边界检查：验证 meta 对象
            const meta = input?.meta ?? { type: "manual" };
            if (!meta.type) {
                meta.type = "manual";
            }

            setBranches((prev) => {
                const branchMessages = seedMessages
                    ? seedMessages
                    : inheritMessages
                      ? [...parent.messages]
                      : [];
                      
                const branch = {
                    id: newId,
                    parentId: sourceId,
                    label:
                        labelFromInput && labelFromInput.length > 0
                            ? labelFromInput
                            : `分支 ${branchOrder.length}`,
                    createdAt: new Date().toISOString(),
                    messages: branchMessages,
                    diagramXml:
                        input?.diagramXml !== undefined
                            ? input.diagramXml
                            : parent.diagramXml ?? null,
                    meta,
                };
                pendingBranchRef.current = branch;
                return {
                    ...prev,
                    [branch.id]: branch,
                };
            });
            setBranchOrder((prev) => [...prev, newId]);
            if (shouldActivate) {
                setActiveBranchId(newId);
            }

            return pendingBranchRef.current;
        },
        [activeBranchId, branchOrder, branches]
    );

    const switchBranch = useCallback(
        /**
         * @param {string} branchId
         * @returns {ConversationBranch | null}
         */
        (branchId) => {
            if (!branches[branchId]) {
                console.warn(`Branch ${branchId} 不存在，无法切换。`);
                return null;
            }
            setActiveBranchId(branchId);
            return branches[branchId];
        },
        [branches]
    );

    /**
     * 切换渲染模式
     * @param {"drawio" | "svg"} renderMode
     * @returns {ConversationBranch | null}
     */
    const switchRenderMode = useCallback(
        (renderMode) => {
            const targetRootId = getRootBranchId(renderMode);
            const targetRoot = branches[targetRootId];
            
            // 如果目标根分支不存在，创建它
            if (!targetRoot) {
                console.log(`[ConversationContext] 创建 ${renderMode} 模式的根分支`);
                const newRoot = createRootBranchForMode(renderMode);
                setBranches((prev) => ({
                    ...prev,
                    [newRoot.id]: newRoot,
                }));
                setBranchOrder((prev) => {
                    if (!prev.includes(newRoot.id)) {
                        return [...prev, newRoot.id];
                    }
                    return prev;
                });
                setActiveBranchId(newRoot.id);
                return newRoot;
            }
            
            // 切换到目标根分支
            setActiveBranchId(targetRootId);
            return targetRoot;
        },
        [branches]
    );

    const value = useMemo(
        () => ({
            branches,
            branchList,
            branchTrail,
            activeBranchId,
            activeBranch,
            activeRenderMode,
            createBranch,
            switchBranch,
            switchRenderMode,
            updateActiveBranchMessages,
            updateActiveBranchDiagram,
            resetActiveBranch,
        }),
        [
            branches,
            branchList,
            branchTrail,
            activeBranchId,
            activeBranch,
            activeRenderMode,
            createBranch,
            switchBranch,
            switchRenderMode,
            updateActiveBranchMessages,
            updateActiveBranchDiagram,
            resetActiveBranch,
        ]
    );

    return (
        <ConversationContext.Provider value={value}>
            {children}
        </ConversationContext.Provider>
    );
}

export function useConversationManager() {
    const context = useContext(ConversationContext);
    if (!context) {
        throw new Error(
            "useConversationManager 必须在 ConversationProvider 中使用。"
        );
    }
    return context;
}
