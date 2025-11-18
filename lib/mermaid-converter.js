/**
 * Convert Mermaid diagram to Excalidraw elements
 * Simplified converter that handles common Mermaid diagram types
 */

function parseFlowchart(lines) {
  const elements = [];
  const nodeMap = new Map();
  let yOffset = 100;
  let xOffset = 100;
  const nodeSpacing = 250;
  const levelSpacing = 180;

  // Parse nodes and connections
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('flowchart') || trimmed.startsWith('graph')) continue;

    // Match node definitions: A[Text] or A{Text} or A((Text)) etc.
    const nodeMatch = trimmed.match(/(\w+)([\[\{\(\<])([^\]\}\)\>]+)([\]\}\)\>])/g);
    if (nodeMatch) {
      nodeMatch.forEach((match) => {
        const parts = match.match(/(\w+)([\[\{\(\<])([^\]\}\)\>]+)([\]\}\)\>])/);
        if (parts) {
          const [, id, openBracket, text, closeBracket] = parts;

          if (!nodeMap.has(id)) {
            const shape = getShapeFromBrackets(openBracket, closeBracket);
            const x = xOffset + (nodeMap.size % 3) * nodeSpacing;
            const y = yOffset + Math.floor(nodeMap.size / 3) * levelSpacing;

            nodeMap.set(id, {
              id: `node_${id}_${Date.now()}_${Math.random()}`,
              type: shape.type,
              x,
              y,
              width: Math.max(140, text.length * 10),
              height: shape.type === 'diamond' ? 100 : 70,
              text: text.trim(),
            });
          }
        }
      });
    }

    // Match connections: A --> B or A -.-> B or A ==> B
    const connectionMatch = trimmed.match(/(\w+)\s*(-->|==>|-.->|\-\.-\>|\-\-\>)\s*(\w+)/);
    if (connectionMatch) {
      const [, fromId, arrowType, toId] = connectionMatch;

      // Ensure nodes exist
      if (!nodeMap.has(fromId)) {
        const x = xOffset + (nodeMap.size % 3) * nodeSpacing;
        const y = yOffset + Math.floor(nodeMap.size / 3) * levelSpacing;
        nodeMap.set(fromId, {
          id: `node_${fromId}_${Date.now()}_${Math.random()}`,
          type: 'rectangle',
          x, y,
          width: 140,
          height: 70,
          text: fromId,
        });
      }

      if (!nodeMap.has(toId)) {
        const x = xOffset + (nodeMap.size % 3) * nodeSpacing;
        const y = yOffset + Math.floor(nodeMap.size / 3) * levelSpacing;
        nodeMap.set(toId, {
          id: `node_${toId}_${Date.now()}_${Math.random()}`,
          type: 'rectangle',
          x, y,
          width: 140,
          height: 70,
          text: toId,
        });
      }
    }
  }

  // Convert nodes to Excalidraw elements
  nodeMap.forEach(node => {
    elements.push(createExcalidrawElement(node));
  });

  // Parse and create arrows
  for (const line of lines) {
    const trimmed = line.trim();
    const connectionMatch = trimmed.match(/(\w+)\s*(-->|==>|-.->|\-\.-\>|\-\-\>)\s*(\|([^\|]+)\|)?\s*(\w+)/);

    if (connectionMatch) {
      const [, fromId, arrowType, , label, toId] = connectionMatch;
      const fromNode = nodeMap.get(fromId);
      const toNode = nodeMap.get(toId);

      if (fromNode && toNode) {
        const arrow = createArrow(fromNode, toNode, label?.trim(), arrowType);
        elements.push(arrow);
      }
    }
  }

  return elements;
}

function getShapeFromBrackets(open, close) {
  if (open === '[' && close === ']') return { type: 'rectangle' };
  if (open === '{' && close === '}') return { type: 'diamond' };
  if (open === '(' && close === ')') return { type: 'ellipse' };
  if (open === '<' && close === '>') return { type: 'rectangle' };
  return { type: 'rectangle' };
}

function createExcalidrawElement(node) {
  return {
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    strokeColor: '#1e1e1e',
    backgroundColor: node.type === 'diamond' ? '#ffd43b' : '#a5d8ff',
    fillStyle: 'solid',
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    label: {
      text: node.text,
      fontSize: 16,
      fontFamily: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
    },
    id: node.id,
  };
}

function createArrow(fromNode, toNode, label, arrowType) {
  const startX = fromNode.x + fromNode.width / 2;
  const startY = fromNode.y + fromNode.height / 2;
  const endX = toNode.x + toNode.width / 2;
  const endY = toNode.y + toNode.height / 2;

  const arrow = {
    type: 'arrow',
    x: startX,
    y: startY,
    width: endX - startX,
    height: endY - startY,
    strokeColor: '#1e1e1e',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    start: {
      type: 'rectangle',
      x: fromNode.x,
      y: fromNode.y,
      width: fromNode.width,
      height: fromNode.height,
      id: fromNode.id,
    },
    end: {
      type: 'rectangle',
      x: toNode.x,
      y: toNode.y,
      width: toNode.width,
      height: toNode.height,
      id: toNode.id,
    },
    startArrowhead: null,
    endArrowhead: 'arrow',
    id: `arrow_${Date.now()}_${Math.random()}`,
  };

  if (arrowType === '-.->') {
    arrow.strokeStyle = 'dashed';
  }

  if (label) {
    arrow.label = {
      text: label,
      fontSize: 14,
    };
  }

  return arrow;
}

function parseSequenceDiagram(lines) {
  const elements = [];
  const participants = new Map();
  let yOffset = 100;
  const xSpacing = 300;
  let messageY = 220;

  // Parse participants
  for (const line of lines) {
    const trimmed = line.trim();
    const participantMatch = trimmed.match(/participant\s+(\w+)(?:\s+as\s+(.+))?/);

    if (participantMatch) {
      const [, id, label] = participantMatch;
      const x = 100 + participants.size * xSpacing;

      participants.set(id, {
        id: `participant_${id}_${Date.now()}`,
        x,
        y: yOffset,
        label: label || id,
      });
    }
  }

  // Create participant boxes
  participants.forEach(p => {
    elements.push({
      type: 'rectangle',
      x: p.x,
      y: p.y,
      width: 150,
      height: 60,
      strokeColor: '#1e1e1e',
      backgroundColor: '#b2f2bb',
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 1,
      opacity: 100,
      label: {
        text: p.label,
        fontSize: 16,
        fontFamily: 1,
        textAlign: 'center',
        verticalAlign: 'middle',
      },
      id: p.id,
    });
  });

  // Parse messages
  for (const line of lines) {
    const trimmed = line.trim();
    const messageMatch = trimmed.match(/(\w+)\s*(->>|-->>|->|-->)\s*(\w+)\s*:\s*(.+)/);

    if (messageMatch) {
      const [, from, arrowType, to, message] = messageMatch;
      const fromP = participants.get(from);
      const toP = participants.get(to);

      if (fromP && toP) {
        const startX = fromP.x + 75;
        const endX = toP.x + 75;

        elements.push({
          type: 'arrow',
          x: startX,
          y: messageY,
          width: endX - startX,
          height: 0,
          strokeColor: '#1e1e1e',
          backgroundColor: 'transparent',
          strokeWidth: 2,
          roughness: 1,
          opacity: 100,
          label: {
            text: message.trim(),
            fontSize: 14,
          },
          startArrowhead: null,
          endArrowhead: 'arrow',
          strokeStyle: arrowType.includes('--') ? 'dashed' : 'solid',
          id: `message_${Date.now()}_${Math.random()}`,
        });

        messageY += 80;
      }
    }
  }

  return elements;
}

export function convertMermaidToExcalidraw(mermaidCode) {
  if (!mermaidCode || typeof mermaidCode !== 'string') {
    throw new Error('Invalid Mermaid code');
  }

  const lines = mermaidCode.split('\n').map(l => l.trim()).filter(l => l);

  if (lines.length === 0) {
    throw new Error('Empty Mermaid code');
  }

  const firstLine = lines[0].toLowerCase();

  // Determine diagram type and parse accordingly
  if (firstLine.includes('flowchart') || firstLine.includes('graph')) {
    return parseFlowchart(lines);
  } else if (firstLine.includes('sequencediagram')) {
    return parseSequenceDiagram(lines);
  } else {
    // Default to flowchart parsing for unknown types
    return parseFlowchart(lines);
  }
}

export function validateMermaid(mermaidCode) {
  if (!mermaidCode || typeof mermaidCode !== 'string') {
    return { valid: false, error: 'Invalid input' };
  }

  const trimmed = mermaidCode.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Empty diagram' };
  }

  const lines = trimmed.split('\n');
  const firstLine = lines[0].toLowerCase();

  const validTypes = ['flowchart', 'graph', 'sequencediagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie', 'mindmap', 'timeline'];
  const hasValidType = validTypes.some(type => firstLine.includes(type.toLowerCase()));

  if (!hasValidType) {
    return { valid: false, error: 'Unknown diagram type' };
  }

  return { valid: true };
}
