import { useCallback, useEffect, useRef } from "react";
import { EMPTY_MXFILE } from "@/lib/diagram-templates";
import { ensureRootXml, mergeRootXml } from "@/lib/utils";
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
    (rootXml) => {
      const baseXml = latestDiagramXmlRef.current || chartXML || EMPTY_MXFILE;
      const merged = mergeRootXml(baseXml, rootXml);
      latestDiagramXmlRef.current = merged;
      onDisplayChart(merged);
      updateActiveBranchDiagram(merged);
      return merged;
    },
    [chartXML, onDisplayChart, updateActiveBranchDiagram]
  );
  const tryApplyRoot = useCallback(
    async (xml) => {
      const normalized = ensureRootXml(xml);
      applyRootToCanvas(normalized);
    },
    [applyRootToCanvas]
  );
  const handleDiagramXml = useCallback(
    async (xml, _meta) => {
      await tryApplyRoot(xml);
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
