class HistoryManager {
  constructor() {
    this.STORAGE_KEY = 'smart-excalidraw-history';
    this.histories = [];
    this.loaded = false;
  }

  ensureLoaded() {
    if (typeof window === 'undefined') return;
    if (!this.loaded) {
      this.loadHistories();
      this.loaded = true;
    }
  }

  loadHistories() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      this.histories = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load histories:', error);
      this.histories = [];
    }
  }

  saveHistories() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.histories));
    } catch (error) {
      console.error('Failed to save histories:', error);

      // 如果超出配额，则删除旧项目并重试
      if (error.name === 'QuotaExceededError' && this.histories.length > 5) {
        console.log('[DEBUG] Quota exceeded, removing old histories...');
        this.histories = this.histories.slice(0, 10);
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.histories));
        } catch (retryError) {
          console.error('Failed to save even after cleanup:', retryError);
        }
      }
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  addHistory(data) {
    this.ensureLoaded();

    // 从用户输入中移除图像数据以节省空间
    let cleanedUserInput = data.userInput;
    if (typeof cleanedUserInput === 'object' && cleanedUserInput.image) {
      cleanedUserInput = 'Image input omitted';
    }

    const history = {
      id: this.generateId(),
      chartType: data.chartType,
      userInput: cleanedUserInput,
      generatedCode: data.generatedCode,
      config: data.config,
      timestamp: Date.now()
    };
    this.histories.unshift(history);

    // 限制显示最近 20 条记录，以防止超出配额
    if (this.histories.length > 20) {
      this.histories = this.histories.slice(0, 20);
    }

    this.saveHistories();
    return history;
  }

  getHistories() {
    this.ensureLoaded();
    return [...this.histories];
  }

  deleteHistory(id) {
    this.ensureLoaded();
    this.histories = this.histories.filter(h => h.id !== id);
    this.saveHistories();
  }

  clearAll() {
    this.ensureLoaded();
    this.histories = [];
    this.saveHistories();
  }
}

export const historyManager = new HistoryManager();
