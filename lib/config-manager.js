/**
 * Configuration Manager - Handle API configurations with localStorage
 */

import { DEFAULT_CONFIG } from './constants';

const STORAGE_KEY = 'figsci_configs';
const ACTIVE_KEY = 'figsci_active_config';

/**
 * Initialize configurations with default if none exist
 */
export function initializeConfigs() {
  if (typeof window === 'undefined') return;

  const configs = getConfigs();
  if (configs.length === 0) {
    const defaultConfig = {
      ...DEFAULT_CONFIG,
      id: generateId(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultConfig]));
    localStorage.setItem(ACTIVE_KEY, defaultConfig.id);
  }
}

/**
 * Get all configurations
 * @returns {Array} Array of configuration objects
 */
export function getConfigs() {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load configs:', error);
    return [];
  }
}

/**
 * Get active configuration
 * @returns {Object|null} Active configuration or null
 */
export function getActiveConfig() {
  if (typeof window === 'undefined') return null;

  try {
    const activeId = localStorage.getItem(ACTIVE_KEY);
    const configs = getConfigs();
    return configs.find((c) => c.id === activeId) || configs[0] || null;
  } catch (error) {
    console.error('Failed to get active config:', error);
    return null;
  }
}

/**
 * Set active configuration by ID
 * @param {string} configId - Configuration ID
 */
export function setActiveConfig(configId) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(ACTIVE_KEY, configId);
  window.dispatchEvent(new CustomEvent('configsUpdated'));
}

/**
 * Add new configuration
 * @param {Object} config - Configuration object (without ID)
 * @returns {Object} Created configuration with ID
 */
export function addConfig(config) {
  if (typeof window === 'undefined') return null;

  const configs = getConfigs();
  const newConfig = {
    ...config,
    id: generateId(),
  };
  configs.push(newConfig);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  window.dispatchEvent(new CustomEvent('configsUpdated'));
  return newConfig;
}

/**
 * Update existing configuration
 * @param {string} configId - Configuration ID
 * @param {Object} updates - Fields to update
 */
export function updateConfig(configId, updates) {
  if (typeof window === 'undefined') return;

  const configs = getConfigs();
  const index = configs.findIndex((c) => c.id === configId);

  if (index !== -1) {
    configs[index] = { ...configs[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    window.dispatchEvent(new CustomEvent('configsUpdated'));
  }
}

/**
 * Delete configuration
 * @param {string} configId - Configuration ID
 */
export function deleteConfig(configId) {
  if (typeof window === 'undefined') return;

  let configs = getConfigs();
  configs = configs.filter((c) => c.id !== configId);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));

  // If deleted config was active, set first config as active
  const activeId = localStorage.getItem(ACTIVE_KEY);
  if (activeId === configId && configs.length > 0) {
    setActiveConfig(configs[0].id);
  }

  window.dispatchEvent(new CustomEvent('configsUpdated'));
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
  return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
