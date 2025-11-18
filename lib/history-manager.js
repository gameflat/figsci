/**
 * History Manager - Manage generation history with localStorage
 */

const STORAGE_KEY = 'figsci_history';
const MAX_HISTORY_ITEMS = 50;

/**
 * Get all history entries
 * @returns {Array} Array of history entries
 */
export function getHistory() {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
}

/**
 * Add new history entry
 * @param {Object} entry - History entry object
 */
export function addHistoryEntry(entry) {
  if (typeof window === 'undefined') return;

  try {
    let history = getHistory();

    // Add timestamp and ID
    const newEntry = {
      ...entry,
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    // Add to beginning of array
    history.unshift(newEntry);

    // Limit history size
    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent('historyUpdated'));
  } catch (error) {
    console.error('Failed to add history entry:', error);
  }
}

/**
 * Delete history entry
 * @param {string} entryId - Entry ID to delete
 */
export function deleteHistoryEntry(entryId) {
  if (typeof window === 'undefined') return;

  try {
    let history = getHistory();
    history = history.filter((entry) => entry.id !== entryId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent('historyUpdated'));
  } catch (error) {
    console.error('Failed to delete history entry:', error);
  }
}

/**
 * Clear all history
 */
export function clearHistory() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('historyUpdated'));
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}
