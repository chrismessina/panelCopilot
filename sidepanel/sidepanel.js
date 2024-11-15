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
  