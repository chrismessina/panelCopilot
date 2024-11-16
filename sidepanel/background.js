

  chrome.action.onClicked.addListener(async (tab) => {
    console.log("actionOnClicked", tab);
    if (tab) {
        const pr= chrome.sidePanel.setOptions({
            tabId: tab.id,
            path: 'sidepanel.html',
            enabled: true
        });
        console.log("pr", pr);
        //console.log("open in tab.id", tab.id);
        // Open the side panel actually
        res = await chrome.sidePanel.open({tabId:tab.id});
        //and fulfill the promise now
        res = await pr;
        //or open global using windowID, but it must be defined in the manifest
        //res = await chrome.sidePanel.open({windowId:tab.windowId});
        console.log("res", res);
            // activeTab permission is granted when the user invokes the extension
            const [result] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => document.title,
            });
            console.log("result", result);
            // Store the page title in local storage
            await chrome.storage.local.set({ pageTitle: result.result });
            console.log("result.result", result.result);
            // Configure the side panel for this tab
  
    }
});
  
  // Listen for tab updates to detect navigation changes
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.log("tabsOnUpdated", tabId, changeInfo, tab);
    if (changeInfo.status === 'complete') {
      const currentTitle = tab.title;
      chrome.storage.local.set({ pageTitle: tab.title });
      // Compare the tab title to the stored title to determine if navigation happened
      chrome.storage.local.get(['pageTitle'], (result) => {
        if (result.pageTitle && result.pageTitle !== currentTitle) {
          // Close the side panel since user navigated away
          // no sabemos como cerrarlo, porque close no existe
          //chrome.sidePanel.close();
        }
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.title,
      }).then(([{ result: title }]) => {
        // Store the page title in local storage for use in the side panel
        chrome.storage.local.set({ pageTitle: title });
      }).catch((error) => {
        console.error(error);
        // Disable the side panel for this tab if we cannot access the URL
        chrome.sidePanel.setOptions({
          tabId: tab.id,
          enabled: false
        });
      });
  });
  }; //if
})

chrome.runtime.onSuspend.addListener(() => {
  chrome.storage.local.clear();
});

// Optional: Clear old data on startup
chrome.runtime.onStartup.addListener(() => {
  // Clear data older than X days
  chrome.storage.local.get(null, (items) => {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    Object.entries(items).forEach(([key, value]) => {
      if (value.timestamp && (now - value.timestamp) > maxAge) {
        chrome.storage.local.remove(key);
      }
    });
  });
});
  