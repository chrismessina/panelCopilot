function analyzeCurrentPage() {
    const headings = {
      h1: Array.from(document.getElementsByTagName('h1')).map(h => h.textContent.trim()),
      h2: Array.from(document.getElementsByTagName('h2')).map(h => h.textContent.trim()),
      h3: Array.from(document.getElementsByTagName('h3')).map(h => h.textContent.trim())
    };
  
    const metadata = {
      title: document.title,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      headings
    };
  
    chrome.runtime.sendMessage({
      type: 'PAGE_ANALYZED',
      data: metadata
    });
  }
  
  // Initial analysis
  analyzeCurrentPage();
  
  // Watch for DOM changes
  const observer = new MutationObserver(analyzeCurrentPage);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });