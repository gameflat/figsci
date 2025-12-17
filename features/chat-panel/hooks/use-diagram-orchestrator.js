import { useCallback, useEffect, useRef } from "react";
import { EMPTY_MXFILE } from "@/lib/diagram-templates";
import { ensureRootXml, mergeRootXml, replaceRootXml } from "@/lib/utils";
function useDiagramOrchestrator({
  chartXML,
  onDisplayChart,
  updateActiveBranchDiagram
}) {
  const latestDiagramXmlRef = useRef(chartXML || EMPTY_MXFILE);
  useEffect(() => {
    if (chartXML && chartXML.length > 0) {
      latestDiagramXmlRef.current = chartXML;
    }
  }, [chartXML]);
  const applyRootToCanvas = useCallback(
    (rootXml, shouldReplace = false) => {
      console.log("[applyRootToCanvas] 开始", { shouldReplace, rootXmlLength: rootXml?.length });
      let result;
      if (shouldReplace) {
        // 替换模式：使用 replaceRootXml 函数来构建完整的 XML
        // 这样确保格式正确，并且能正确替换画布内容
        const baseXml = latestDiagramXmlRef.current || chartXML || EMPTY_MXFILE;
        console.log("[applyRootToCanvas] 替换模式", { baseXmlLength: baseXml?.length });
        result = replaceRootXml(baseXml, rootXml);
        console.log("[applyRootToCanvas] replaceRootXml 完成", { resultLength: result?.length, resultPreview: result.substring(0, 200) });
      } else {
        // 合并模式：基于现有 XML 进行合并（用于编辑操作）
        const baseXml = latestDiagramXmlRef.current || chartXML || EMPTY_MXFILE;
        result = mergeRootXml(baseXml, rootXml);
      }
      latestDiagramXmlRef.current = result;
      // 调用 onDisplayChart 更新画布
      console.log("[applyRootToCanvas] 调用 onDisplayChart");
      onDisplayChart(result);
      updateActiveBranchDiagram(result);
      console.log("[applyRootToCanvas] 完成");
      return result;
    },
    [chartXML, onDisplayChart, updateActiveBranchDiagram]
  );
  const tryApplyRoot = useCallback(
    async (xml, shouldReplace = false) => {
      const normalized = ensureRootXml(xml);
      applyRootToCanvas(normalized, shouldReplace);
    },
    [applyRootToCanvas]
  );
  const handleDiagramXml = useCallback(
    async (xml, meta) => {
      // 如果 origin 是 "display"（来自 display_diagram 工具），则替换整个画布
      // 其他情况（如编辑）使用合并逻辑
      const shouldReplace = meta?.origin === "display";
      console.log("[handleDiagramXml] 处理 XML", { xmlLength: xml?.length, shouldReplace, origin: meta?.origin });
      try {
        await tryApplyRoot(xml, shouldReplace);
        console.log("[handleDiagramXml] tryApplyRoot 完成");
      } catch (error) {
        console.error("[handleDiagramXml] 错误:", error);
        throw error;
      }
    },
    [tryApplyRoot]
  );
  const updateLatestDiagramXml = useCallback((xml) => {
    latestDiagramXmlRef.current = xml;
  }, []);
  const getLatestDiagramXml = useCallback(() => {
    return latestDiagramXmlRef.current || chartXML || EMPTY_MXFILE;
  }, [chartXML]);
  return {
    handleDiagramXml,
    tryApplyRoot,
    updateLatestDiagramXml,
    getLatestDiagramXml
  };
}
export {
  useDiagramOrchestrator
};
