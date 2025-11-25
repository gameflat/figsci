'use client';

import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { getHistory, deleteHistoryEntry, clearHistory } from '@/lib/history-manager';

export default function HistoryModal({ isOpen, onClose, onApplyHistory }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }

    // Listen for history updates
    const handleHistoryUpdated = () => loadHistory();
    window.addEventListener('historyUpdated', handleHistoryUpdated);

    return () => {
      window.removeEventListener('historyUpdated', handleHistoryUpdated);
    };
  }, [isOpen]);

  const loadHistory = () => {
    setHistory(getHistory());
  };

  const handleApply = (entry) => {
    onApplyHistory(entry);
    onClose();
  };

  const handleDelete = (entryId) => {
    if (confirm('Delete this history entry?')) {
      deleteHistoryEntry(entryId);
      loadHistory();
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all history? This cannot be undone.')) {
      clearHistory();
      loadHistory();
    }
=======
import { historyManager } from '../lib/history-manager.js';
import { CHART_TYPES } from '../lib/constants.js';
import ConfirmDialog from './ConfirmDialog';

export default function HistoryModal({ isOpen, onClose, onApply }) {
  const [histories, setHistories] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    if (isOpen) {
      loadHistories();
    }
  }, [isOpen]);

  const loadHistories = () => {
    const allHistories = historyManager.getHistories();
    setHistories(allHistories);
  };

  const handleApply = (history) => {
    onApply?.(history);
    onClose();
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: '确认删除',
      message: '确定要删除这条历史记录吗？',
      onConfirm: () => {
        historyManager.deleteHistory(id);
        loadHistories();
      }
    });
  };

  const handleClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: '确认清空',
      message: '确定要清空所有历史记录吗？此操作不可恢复。',
      onConfirm: () => {
        historyManager.clearAll();
        loadHistories();
      }
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    // Handle case where text might be an object (for image uploads)
    if (typeof text === 'object') {
      return text.text || '图片上传生成';
    }
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
>>>>>>> origin/figsci
  };

  if (!isOpen) return null;

  return (
<<<<<<< HEAD
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Generation History</h2>
          <div className="flex gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <svg
                  className="mx-auto h-16 w-16 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-lg font-medium">No history yet</p>
                <p className="text-sm mt-1">Your generation history will appear here</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
=======
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded border border-gray-300 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">历史记录</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {histories.length > 0 && (
            <div className="mb-4">
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
              >
                清空全部
              </button>
            </div>
          )}

          <div className="space-y-3">
            {histories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无历史记录
              </div>
            ) : (
              histories.map((history) => (
                <div
                  key={history.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300"
>>>>>>> origin/figsci
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
<<<<<<< HEAD
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {entry.chartType || 'auto'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {typeof entry.userInput === 'string'
                          ? entry.userInput
                          : entry.userInput?.text || 'Image input'}
                      </p>
                      {entry.config && (
                        <p className="text-xs text-gray-500 mt-1">
                          Model: {entry.config.model}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApply(entry)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
=======
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          {CHART_TYPES[history.chartType] || history.chartType}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(history.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mb-2">
                        {truncateText(history.userInput)}
                      </p>
                      {history.config && (
                        <div className="text-xs text-gray-500">
                          模型: {history.config.name} - {history.config.model}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleApply(history)}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
                      >
                        应用
                      </button>
                      <button
                        onClick={() => handleDelete(history.id)}
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                      >
                        删除
>>>>>>> origin/figsci
                      </button>
                    </div>
                  </div>
                </div>
<<<<<<< HEAD
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

=======
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={() => {
          confirmDialog.onConfirm?.();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type="danger"
      />
    </div>
  );
}
>>>>>>> origin/figsci
