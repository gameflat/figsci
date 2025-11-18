/**
 * Application constants
 */

export const CHART_TYPES = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'flowchart', label: 'Flowchart' },
  { value: 'mindmap', label: 'Mind Map' },
  { value: 'orgchart', label: 'Organization Chart' },
  { value: 'sequence', label: 'Sequence Diagram' },
  { value: 'class', label: 'Class Diagram' },
  { value: 'er', label: 'ER Diagram' },
  { value: 'gantt', label: 'Gantt Chart' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'tree', label: 'Tree Diagram' },
  { value: 'network', label: 'Network Topology' },
  { value: 'architecture', label: 'Architecture Diagram' },
  { value: 'dataflow', label: 'Data Flow Diagram' },
  { value: 'state', label: 'State Diagram' },
  { value: 'swimlane', label: 'Swimlane Diagram' },
  { value: 'concept', label: 'Concept Map' },
  { value: 'fishbone', label: 'Fishbone Diagram' },
  { value: 'swot', label: 'SWOT Analysis' },
  { value: 'pyramid', label: 'Pyramid Diagram' },
  { value: 'funnel', label: 'Funnel Diagram' },
  { value: 'venn', label: 'Venn Diagram' },
  { value: 'matrix', label: 'Matrix Diagram' },
  { value: 'infographic', label: 'Infographic' },
];

export const DEFAULT_CONFIG = {
  name: 'Default OpenAI',
  type: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o',
};
