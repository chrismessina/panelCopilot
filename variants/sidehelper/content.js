// content.js
let observer = null;

function setupObserver() {
    if (observer) return; // Already observing
    
    function findHeaders() {
        const headers = document.getElementsByTagName('h1');
        const headerTexts = Array.from(headers).map(h => h.textContent);
        chrome.runtime.sendMessage({headers: headerTexts});
    }

    const debouncedFindHeaders = debounce(findHeaders, 250);
    
    observer = new MutationObserver(debouncedFindHeaders);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Initial scan
    findHeaders();
}

function teardownObserver() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
}

// Listen for sidebar state changes
alert('Hello from content.js, installing listeners');
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    alert("got message: " + message.type);
    if (message.type === 'SIDEBAR_OPENED') {
        setupObserver();
    } else if (message.type === 'SIDEBAR_CLOSED') {
        teardownObserver();
    }
});

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}