'use client';

import { useState, useEffect, useRef } from 'react';

export default function DrawioCanvas({ elements, xml }) {
  const iframeRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Escape special XML characters
  const escapeXml = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Convert JSON elements to draw.io XML format
  const convertToDrawioXML = (elements) => {
    if (!elements || elements.length === 0) {
      return `<mxfile><diagram id="empty" name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>`;
    }

    let cellId = 2;
    let cells = '';

    elements.forEach(el => {
      const id = cellId++;

      if (el.type === 'rectangle') {
        cells += `<mxCell id="${id}" value="${escapeXml(el.label?.text)}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${el.backgroundColor || '#ffffff'};strokeColor=${el.strokeColor || '#000000'};" vertex="1" parent="1"><mxGeometry x="${el.x}" y="${el.y}" width="${el.width || 120}" height="${el.height || 60}" as="geometry"/></mxCell>`;
      } else if (el.type === 'ellipse') {
        cells += `<mxCell id="${id}" value="${escapeXml(el.label?.text)}" style="ellipse;whiteSpace=wrap;html=1;fillColor=${el.backgroundColor || '#ffffff'};strokeColor=${el.strokeColor || '#000000'};" vertex="1" parent="1"><mxGeometry x="${el.x}" y="${el.y}" width="${el.width || 120}" height="${el.height || 80}" as="geometry"/></mxCell>`;
      } else if (el.type === 'diamond') {
        cells += `<mxCell id="${id}" value="${escapeXml(el.label?.text)}" style="rhombus;whiteSpace=wrap;html=1;fillColor=${el.backgroundColor || '#ffffff'};strokeColor=${el.strokeColor || '#000000'};" vertex="1" parent="1"><mxGeometry x="${el.x}" y="${el.y}" width="${el.width || 120}" height="${el.height || 80}" as="geometry"/></mxCell>`;
      } else if (el.type === 'text') {
        cells += `<mxCell id="${id}" value="${escapeXml(el.text)}" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;" vertex="1" parent="1"><mxGeometry x="${el.x}" y="${el.y}" width="${el.width || 100}" height="${el.height || 30}" as="geometry"/></mxCell>`;
      } else if (el.type === 'arrow') {
        const startX = el.x || 0;
        const startY = el.y || 0;
        const endX = startX + (el.width || 100);
        const endY = startY + (el.height || 0);
        cells += `<mxCell id="${id}" value="${escapeXml(el.label?.text)}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${startX}" y="${startY}" as="sourcePoint"/><mxPoint x="${endX}" y="${endY}" as="targetPoint"/></mxGeometry></mxCell>`;
      }
    });

    return `<mxfile><diagram id="generated" name="Page-1"><mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells}</root></mxGraphModel></diagram></mxfile>`;
  };

  // Load diagram into draw.io iframe
  const loadDiagram = (xml) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          action: 'load',
          xml: xml,
          autosave: 1
        }),
        '*'
      );
    }
  };

  // Listen for messages from draw.io iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.length > 0) {
        try {
          const msg = JSON.parse(event.data);

          if (msg.event === 'init') {
            setIsReady(true);
          } else if (msg.event === 'export') {
            console.log('Diagram exported:', msg.data);
          } else if (msg.event === 'save') {
            console.log('Diagram saved:', msg.xml);
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fallback: force ready state after timeout if init event doesn't fire
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isReady) {
        console.warn('Draw.io init timeout, forcing ready state');
        setIsReady(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isReady]);

  // Load diagram when xml or elements change
  useEffect(() => {
    if (isReady) {
      let diagramXml;

      if (xml) {
        // Use XML directly
        diagramXml = xml;
      } else if (elements && elements.length > 0) {
        // Convert JSON to XML
        diagramXml = convertToDrawioXML(elements);
      } else {
        // Load empty diagram on initial load
        diagramXml = convertToDrawioXML([]);
      }

      loadDiagram(diagramXml);
    }
  }, [xml, elements, isReady]);

  return (
    <div className="w-full h-full">
      <iframe
        ref={iframeRef}
        src="https://embed.diagrams.net/?embed=1&proto=json&ui=min"
        className="w-full h-full border-0"
        allow="fullscreen"
      />
    </div>
  );
}
