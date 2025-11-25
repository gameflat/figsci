'use client';

import { useState } from 'react';

const PRESET_SUGGESTIONS = [
  { id: 'layout', label: '统一布局方向', description: '统一所有元素的布局方向（自上而下或从左到右）' },
  { id: 'merge', label: '合并重复元素', description: '识别并合并功能相似或重复的容器和元素组' },
  { id: 'edge', label: '规范连接线样式', description: '统一所有箭头和连接线的标签样式、字体大小' },
  { id: 'text', label: '优化文本换行', description: '优化节点内文本的换行，使用 HTML 标签改善可读性' },
  { id: 'style', label: '统一元素样式', description: '统一相同类型元素的颜色、边框、字体等样式' },
  { id: 'container', label: '调整容器层级', description: '优化 swimlane 容器的嵌套层级和组织结构' },
  { id: 'simplify', label: '精简冗余节点', description: '删除不必要的元素，合并功能相似的节点' },
  { id: 'annotation', label: '添加注释标注', description: '添加 (a), (b), (c) 等编号标注和说明文字' },
  { id: 'shadow', label: '添加阴影效果', description: '为关键元素添加阴影(shadow=1)，增强立体感和视觉层次' },
  { id: 'gradient', label: '添加渐变填充', description: '使用渐变色(gradientColor)提升视觉吸引力，更加精美' },
  { id: 'rounded', label: '优化圆角样式', description: '统一圆角大小(arcSize)，使图表更现代专业' },
  { id: 'legend', label: '自动生成图例', description: '如果缺失图例，自动添加符合学术标准的图例说明' },
  { id: 'colorblind', label: '色盲友好检查', description: '验证并调整配色方案，确保色盲友好（避免红绿组合）' },
  { id: 'grid', label: '网格对齐验证', description: '确保所有坐标是10的倍数，严格网格对齐' },
  { id: 'spacing', label: '优化留白边距', description: '调整元素间距和图表边距，确保至少10%留白，不拥挤' },
  { id: 'labelBg', label: '专业标注样式', description: '为连接线标签添加白色背景和边框，提高可读性' },
];

export default function OptimizationPanel({ isOpen, onClose, onOptimize, isOptimizing }) {
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [customSuggestion, setCustomSuggestion] = useState('');

  if (!isOpen) return null;

  const handleToggleSuggestion = (id) => {
    setSelectedSuggestions(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleOptimize = () => {
    const suggestions = [];
    
    // Add preset suggestions
    selectedSuggestions.forEach(id => {
      const preset = PRESET_SUGGESTIONS.find(s => s.id === id);
      if (preset) {
        suggestions.push(preset.label + '：' + preset.description);
      }
    });
    
    // Add custom suggestion
    if (customSuggestion.trim()) {
      suggestions.push(customSuggestion.trim());
    }
    
    if (suggestions.length === 0) {
      alert('请至少选择一个优化建议或输入自定义建议');
      return;
    }
    
    onOptimize(suggestions);
  };

  const handleClose = () => {
    if (!isOptimizing) {
      setSelectedSuggestions([]);
      setCustomSuggestion('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">高级优化</h2>
          <button
            onClick={handleClose}
            disabled={isOptimizing}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Preset Suggestions */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">预设优化建议</h3>
            <div className="space-y-2">
              {PRESET_SUGGESTIONS.map(suggestion => (
                <label
                  key={suggestion.id}
                  className="flex items-start p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedSuggestions.includes(suggestion.id)}
                    onChange={() => handleToggleSuggestion(suggestion.id)}
                    disabled={isOptimizing}
                    className="mt-1 mr-3 h-4 w-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{suggestion.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{suggestion.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Suggestion */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">自定义优化建议</h3>
            <textarea
              value={customSuggestion}
              onChange={(e) => setCustomSuggestion(e.target.value)}
              disabled={isOptimizing}
              placeholder="输入您的自定义优化建议..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none text-sm"
              rows={4}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={isOptimizing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isOptimizing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>优化中...</span>
              </>
            ) : (
              <span>开始优化</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
