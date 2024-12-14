// sidebar.js
const headersList = document.getElementById('headerList');

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'updateHeaders') {
    headersList.innerHTML = message.headers
      .map(text => `<div class="header-item">${text}</div>`)
      .join('');
  }
});
alert('Hello from sidebar.js');
chrome.runtime.sendMessage({ type: 'SIDEBAR_OPENED' });

// Optionally, add an event listener to notify when the sidebar is closed
window.addEventListener('unload', () => {
    alert('Sidebar closing');
    chrome.runtime.sendMessage({ type: 'SIDEBAR_CLOSED' });
});