import { encodeDiagramXml } from "@/lib/utils";
const VIEWER_BASE = process.env.NEXT_PUBLIC_DRAWIO_VIEWER_URL || "https://viewer.diagrams.net";
function buildViewerUrl(xml, title) {
  try {
    const encoded = encodeDiagramXml(xml);
    const safeTitle = encodeURIComponent(title || "FlowPilot Slide");
    return `${VIEWER_BASE}/?target=blank&lightbox=1&layers=1&nav=1&title=${safeTitle}#R${encoded}`;
  } catch (error) {
    console.error("Failed to encode diagram xml for viewer:", error);
    return null;
  }
}
export {
  buildViewerUrl
};
