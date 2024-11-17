document.getElementById('save').addEventListener('click', () => {
  const openaiApiKey = document.getElementById('openaiApiKey').value;
  const ollamaApiKey = document.getElementById('ollamaApiKey').value;
  const openaiEndpoint = document.getElementById('openaiEndpoint').value;
  const ollamaEndpoint = document.getElementById('ollamaEndpoint').value;
  const defaultClient = document.getElementById('defaultClient').value;

  chrome.storage.sync.set({
    openaiApiKey,
    ollamaApiKey,
    openaiEndpoint,
    ollamaEndpoint,
    defaultClient
  }, () => {
    alert('Options saved.');
  });
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['openaiApiKey', 'ollamaApiKey', 'openaiEndpoint', 'ollamaEndpoint', 'defaultClient'], (items) => {
    document.getElementById('openaiApiKey').value = items.openaiApiKey || '';
    document.getElementById('ollamaApiKey').value = items.ollamaApiKey || '';
    document.getElementById('openaiEndpoint').value = items.openaiEndpoint || '';
    document.getElementById('ollamaEndpoint').value = items.ollamaEndpoint || '';
    document.getElementById('openaiEndpoint').value = items.openaiEndpoint || 'https://api.openai.com/v1/completions';
    document.getElementById('ollamaEndpoint').value = items.ollamaEndpoint || 'http://localhost:11434/api/generate';
    document.getElementById('defaultClient').value = items.defaultClient || 'ollama';
  });
});