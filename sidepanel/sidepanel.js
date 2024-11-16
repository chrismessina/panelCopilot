
class BrowsingHistory {
    constructor(maxSize = 100) {
      this.maxSize = maxSize;
      this.entries = [];
    }
  
    addEntry(entry) {
      const existingIndex = this.entries.findIndex(e => e.url === entry.url);
      if (existingIndex !== -1) {
        this.entries.splice(existingIndex, 1);
      }
  
      this.entries.unshift({
        ...entry,
        id: Date.now()
      });
      
      if (this.entries.length > this.maxSize) {
        this.entries.pop();
      }
  
      this.saveToStorage();
    }
  
    clear() {
      this.entries = [];
      this.saveToStorage();
    }
  
    getEntries() {
      return this.entries;
    }
  
    async saveToStorage() {
      await chrome.storage.local.set({ history: this.entries });
    }
  
    async loadFromStorage() {
      const data = await chrome.storage.local.get(['history']);
      if (data.history) {
        this.entries = data.history;
      }
    }
  }
  
  class SidepanelManager {
    constructor() {
      this.history = new BrowsingHistory();
      this.currentTabId = null;
    }
  
    async initialize() {
      await this.history.loadFromStorage();
      this.setupEventListeners();
      this.updateUI();
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTabId = tab.id;
      this.injectAnalyzer(tab.id);
    }
  
    setupEventListeners() {
      chrome.runtime.onMessage.addListener((message, sender) => {
        if (message.type === 'PAGE_ANALYZED') {
          this.history.addEntry(message.data);
          this.updateUI();
        }
      });
  
      document.getElementById('clear-history').addEventListener('click', () => {
        this.history.clear();
        this.updateUI();
      });
  
      chrome.tabs.onActivated.addListener(({ tabId }) => {
        this.currentTabId = tabId;
        this.injectAnalyzer(tabId);
      });
  
      chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (tabId === this.currentTabId && changeInfo.status === 'complete') {
          this.injectAnalyzer(tabId);
        }
      });
    }
  
    async injectAnalyzer(tabId) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['page-analyzer.js']
        });
      } catch (error) {
        console.error('Injection failed:', error);
      }
    }
  
    updateUI() {
      const container = document.getElementById('history-container');
      container.innerHTML = '';
      
      this.history.getEntries().forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = 'history-entry';
        entryElement.innerHTML = `
          <div class="entry-header">
            <div class="entry-title">${entry.title}</div>
            <div class="entry-time">${new Date(entry.timestamp).toLocaleString()}</div>
          </div>
          <div class="entry-url">${entry.url}</div>
          <div class="entry-headings">
            ${entry.headings.h1.map(h => `<div class="h1">${h}</div>`).join('')}
            ${entry.headings.h2.map(h => `<div class="h2">${h}</div>`).join('')}
            ${entry.headings.h3.map(h => `<div class="h3">${h}</div>`).join('')}
          </div>
        `;
        container.appendChild(entryElement);
      });
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const manager = new SidepanelManager();
    manager.initialize();
  });


/*
document.addEventListener('DOMContentLoaded', () => {
    const titleElement = document.getElementById('title');
    titleElement.textContent = "Loading...";
  
    // Initially fetch the stored title if it is already available
    chrome.storage.local.get(['pageTitle'], (result) => {
      if (result.pageTitle) {
        titleElement.textContent = result.pageTitle;
      } else {
        titleElement.textContent = "No title found.";
      }
    });
  
    // Listen for changes in storage to update the title
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.pageTitle) {
        titleElement.textContent = changes.pageTitle.newValue;
      }
    });
  });
*/
  