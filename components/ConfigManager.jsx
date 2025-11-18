'use client';

import { useState, useEffect } from 'react';
import {
  getConfigs,
  getActiveConfig,
  setActiveConfig,
  addConfig,
  updateConfig,
  deleteConfig,
  initializeConfigs,
} from '@/lib/config-manager';

export default function ConfigManager({ onConfigChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [activeConfigId, setActiveConfigId] = useState(null);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o',
  });

  useEffect(() => {
    initializeConfigs();
    loadConfigs();

    // Listen for config updates
    const handleConfigsUpdated = () => loadConfigs();
    window.addEventListener('configsUpdated', handleConfigsUpdated);

    return () => {
      window.removeEventListener('configsUpdated', handleConfigsUpdated);
    };
  }, []);

  const loadConfigs = () => {
    const allConfigs = getConfigs();
    const active = getActiveConfig();
    setConfigs(allConfigs);
    setActiveConfigId(active?.id || null);
  };

  const handleSelectConfig = (configId) => {
    setActiveConfig(configId);
    setActiveConfigId(configId);
    const config = configs.find((c) => c.id === configId);
    if (config && onConfigChange) {
      onConfigChange(config);
    }
  };

  const handleAddConfig = () => {
    setEditingConfig(null);
    setFormData({
      name: '',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o',
    });
    setIsOpen(true);
  };

  const handleEditConfig = (config) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
    });
    setIsOpen(true);
  };

  const handleSaveConfig = () => {
    if (!formData.name || !formData.baseUrl || !formData.apiKey || !formData.model) {
      alert('Please fill in all fields');
      return;
    }

    if (editingConfig) {
      updateConfig(editingConfig.id, formData);
    } else {
      const newConfig = addConfig({ ...formData, type: 'openai' });
      handleSelectConfig(newConfig.id);
    }

    setIsOpen(false);
    loadConfigs();
  };

  const handleDeleteConfig = (configId) => {
    if (configs.length <= 1) {
      alert('Cannot delete the last configuration');
      return;
    }

    if (confirm('Are you sure you want to delete this configuration?')) {
      deleteConfig(configId);
      loadConfigs();
    }
  };

  const activeConfig = configs.find((c) => c.id === activeConfigId);

  return (
    <div className="relative">
      {/* Config Selector */}
      <div className="flex items-center gap-2 p-2 bg-gray-100 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">Config:</span>
        <select
          value={activeConfigId || ''}
          onChange={(e) => handleSelectConfig(e.target.value)}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        >
          {configs.map((config) => (
            <option key={config.id} value={config.id}>
              {config.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAddConfig}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          title="Add new configuration"
        >
          +
        </button>
        {activeConfig && (
          <>
            <button
              onClick={() => handleEditConfig(activeConfig)}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              title="Edit configuration"
            >
              Edit
            </button>
            {configs.length > 1 && (
              <button
                onClick={() => handleDeleteConfig(activeConfig.id)}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                title="Delete configuration"
              >
                Delete
              </button>
            )}
          </>
        )}
      </div>

      {/* Config Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingConfig ? 'Edit Configuration' : 'Add Configuration'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Configuration Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My OpenAI Config"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                <input
                  type="text"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="gpt-4o"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveConfig}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

