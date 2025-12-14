// -*- coding: utf-8 -*-
/**
 * 模板搜索 API
 * 
 * 供 LLM 工具调用使用，根据用户需求搜索最匹配的模板
 * 返回详细的绘图指导信息
 */

import { DIAGRAM_TEMPLATES } from "@/data/templates";

/**
 * POST /api/search-template
 * 
 * 根据查询内容搜索并返回最匹配的模板及其绘图指导
 * 
 * @param {Request} req
 * @returns {Promise<Response>}
 */
export async function POST(req) {
  try {
    const { query, templateType } = await req.json();
    
    if (!query || typeof query !== "string") {
      return Response.json(
        { error: "缺少必需参数：query" },
        { status: 400 }
      );
    }
    
    // 搜索匹配的模板
    const matchedTemplates = searchTemplates(query, templateType);
    
    if (matchedTemplates.length === 0) {
      return Response.json({
        success: false,
        message: "未找到匹配的模板，请直接根据用户需求绘制图表",
        templates: []
      });
    }
    
    // 返回最匹配的模板及其绘图指导
    const bestMatch = matchedTemplates[0];
    const guidance = buildDrawingGuidance(bestMatch);
    
    return Response.json({
      success: true,
      template: {
        id: bestMatch.id,
        title: bestMatch.title,
        description: bestMatch.description,
        category: bestMatch.category,
      },
      guidance: guidance,
      // 如果有其他备选模板也返回
      alternatives: matchedTemplates.slice(1, 3).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
      }))
    });
    
  } catch (error) {
    console.error("模板搜索失败:", error);
    return Response.json(
      { error: "模板搜索失败", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 搜索匹配的模板
 * 
 * @param {string} query - 用户查询
 * @param {string} [templateType] - 期望的模板类型
 * @returns {Array} 匹配的模板列表（按相关性排序）
 */
function searchTemplates(query, templateType) {
  const queryLower = query.toLowerCase();
  
  // 计算每个模板的匹配分数
  const scoredTemplates = DIAGRAM_TEMPLATES.map(template => {
    let score = 0;
    
    // 类型匹配（高权重）
    if (templateType && template.category === templateType) {
      score += 50;
    }
    
    // 标题匹配
    if (template.title.toLowerCase().includes(queryLower)) {
      score += 30;
    }
    
    // 描述匹配
    if (template.description.toLowerCase().includes(queryLower)) {
      score += 20;
    }
    
    // 标签匹配
    const matchedTags = template.tags.filter(tag => 
      queryLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(queryLower)
    );
    score += matchedTags.length * 15;
    
    // 使用场景匹配
    if (template.useCases) {
      const matchedUseCases = template.useCases.filter(uc => 
        queryLower.includes(uc.toLowerCase()) || uc.toLowerCase().includes(queryLower)
      );
      score += matchedUseCases.length * 10;
    }
    
    // 关键词匹配
    const keywords = extractKeywords(queryLower);
    keywords.forEach(keyword => {
      if (template.title.toLowerCase().includes(keyword)) score += 5;
      if (template.description.toLowerCase().includes(keyword)) score += 3;
      template.tags.forEach(tag => {
        if (tag.toLowerCase().includes(keyword)) score += 4;
      });
    });
    
    // 热门模板加分
    if (template.isPopular) {
      score += 5;
    }
    
    return { ...template, score };
  });
  
  // 按分数排序，过滤掉分数为 0 的模板
  return scoredTemplates
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * 提取查询中的关键词
 * 
 * @param {string} query - 查询字符串
 * @returns {string[]} 关键词列表
 */
function extractKeywords(query) {
  // 常见的绘图相关关键词
  const keywordPatterns = [
    "流程", "架构", "路线", "时序", "思维导图", "神经网络", "实验",
    "系统", "分层", "对比", "比较", "时间线", "甘特", "进度",
    "数据", "pipeline", "workflow", "process", "architecture",
    "roadmap", "timeline", "network", "diagram", "chart"
  ];
  
  return keywordPatterns.filter(kw => query.includes(kw));
}

/**
 * 构建绘图指导信息
 * 
 * @param {Object} template - 模板对象
 * @returns {Object} 绘图指导
 */
function buildDrawingGuidance(template) {
  // 基础绘图指导
  const guidance = {
    // 原始提示词
    prompt: template.prompt,
    
    // 布局建议
    layout: getLayoutSuggestion(template),
    
    // 配色方案
    colorScheme: getColorScheme(template),
    
    // 节点样式建议
    nodeStyles: getNodeStyles(template),
    
    // 连接线样式
    edgeStyles: getEdgeStyles(template),
    
    // 字体规范
    typography: {
      fontFamily: "Arial",
      titleSize: "14",
      labelSize: "11",
      noteSize: "10"
    },
    
    // 间距规范
    spacing: {
      nodeGap: "80-100",
      groupGap: "60",
      padding: "24"
    }
  };
  
  // 如果模板有 brief 配置，添加额外指导
  if (template.brief) {
    guidance.intent = template.brief.intent;
    guidance.tone = template.brief.tone;
    guidance.focus = template.brief.focus;
  }
  
  // 添加特性说明
  if (template.features) {
    guidance.features = template.features;
  }
  
  return guidance;
}

/**
 * 获取布局建议
 */
function getLayoutSuggestion(template) {
  const categoryLayouts = {
    process: {
      direction: "vertical",
      description: "自上而下的流程布局，节点垂直排列",
      canvasRange: { x: "0-800", y: "0-600" },
      startPosition: { x: 320, y: 60 }
    },
    structure: {
      direction: "layered",
      description: "分层结构布局，使用容器分组相关元素",
      canvasRange: { x: "0-800", y: "0-600" },
      startPosition: { x: 40, y: 40 }
    },
    schematic: {
      direction: "horizontal",
      description: "横向三段式布局（左：问题，中：方法，右：结果）",
      canvasRange: { x: "0-800", y: "0-600" },
      startPosition: { x: 40, y: 100 }
    },
    comparison: {
      direction: "parallel",
      description: "并列对比布局，左右或上下对称排列",
      canvasRange: { x: "0-800", y: "0-600" },
      startPosition: { x: 100, y: 100 }
    },
    timeline: {
      direction: "horizontal",
      description: "时间轴布局，从左到右按时间顺序排列",
      canvasRange: { x: "0-800", y: "0-600" },
      startPosition: { x: 40, y: 250 }
    }
  };
  
  return categoryLayouts[template.category] || categoryLayouts.process;
}

/**
 * 获取配色方案
 */
function getColorScheme(template) {
  // 学术风格配色方案
  const academicSchemes = {
    // 蓝色系（默认，适合大多数图表）
    blue: {
      primary: { fill: "#dae8fc", stroke: "#6c8ebf", font: "#333333" },
      secondary: { fill: "#f5f5f5", stroke: "#666666", font: "#333333" },
      accent: { fill: "#fff2cc", stroke: "#d6b656", font: "#333333" },
      success: { fill: "#d5e8d4", stroke: "#82b366", font: "#333333" },
      warning: { fill: "#ffe6cc", stroke: "#d79b00", font: "#333333" },
      error: { fill: "#f8cecc", stroke: "#b85450", font: "#333333" }
    },
    // 灰度（适合黑白打印）
    grayscale: {
      primary: { fill: "#F7F9FC", stroke: "#2C3E50", font: "#2C3E50" },
      secondary: { fill: "#ECEFF1", stroke: "#607D8B", font: "#37474F" },
      accent: { fill: "#CFD8DC", stroke: "#455A64", font: "#263238" }
    },
    // 科技风（深色边框）
    tech: {
      primary: { fill: "#E3F2FD", stroke: "#1565C0", font: "#0D47A1" },
      secondary: { fill: "#FFF3E0", stroke: "#E65100", font: "#BF360C" },
      accent: { fill: "#E8F5E9", stroke: "#2E7D32", font: "#1B5E20" }
    }
  };
  
  // 根据模板类型选择配色
  if (template.category === "schematic" || template.brief?.tone === "academic") {
    return academicSchemes.grayscale;
  }
  
  return academicSchemes.blue;
}

/**
 * 获取节点样式建议
 */
function getNodeStyles(template) {
  return {
    // 标准节点
    standard: {
      style: "rounded=1;whiteSpace=wrap;html=1;fontFamily=Arial;fontSize=11;",
      width: 120,
      height: 60
    },
    // 决策节点
    decision: {
      style: "rhombus;whiteSpace=wrap;html=1;fontFamily=Arial;fontSize=11;",
      width: 120,
      height: 80
    },
    // 开始/结束节点
    terminal: {
      style: "ellipse;whiteSpace=wrap;html=1;fontFamily=Arial;fontSize=11;",
      width: 80,
      height: 80
    },
    // 数据存储节点
    storage: {
      style: "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fontFamily=Arial;fontSize=11;",
      width: 80,
      height: 100
    },
    // 容器/分组
    container: {
      style: "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=30;collapsible=0;fontFamily=Arial;fontSize=12;",
      width: 200,
      height: 150
    },
    // 文本标注
    text: {
      style: "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontFamily=Arial;fontSize=12;fontStyle=1;",
      width: 200,
      height: 30
    }
  };
}

/**
 * 获取连接线样式建议
 */
function getEdgeStyles(template) {
  return {
    // 标准连接线
    standard: {
      style: "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=1;endArrow=block;endFill=1;strokeColor=#2C3E50;"
    },
    // 虚线连接
    dashed: {
      style: "edgeStyle=orthogonalEdgeStyle;dashed=1;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=1;endArrow=open;endFill=0;strokeColor=#666666;"
    },
    // 无箭头连接
    plain: {
      style: "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=1;endArrow=none;strokeColor=#999999;"
    },
    // 双向箭头
    bidirectional: {
      style: "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=1;startArrow=block;startFill=1;endArrow=block;endFill=1;strokeColor=#2C3E50;"
    }
  };
}

