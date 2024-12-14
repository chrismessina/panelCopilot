chrome.runtime.onInstalled.addListener(init);

function init() { 
    console.log('Hello from service_worker install!'); 
     // Setup side panel behavior on install
     // only if manifest is not enough.
     //chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
     //.catch(err => console.error('Failed to set panel behavior:', err));
}    

chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started');
  });

  chrome.action.onClicked.addListener((tab) => {
    console.log('Hello from sidePanel Open!');
    try {
        // Open side panel
        chrome.sidePanel.open({ windowId: tab.windowId });

        // Inject content script
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        }).then(() => {
            // Notify content script that the sidebar is opened
            chrome.runtime.sendMessage({ type: 'SIDEBAR_OPENED', tabId: tab.id });
        }).catch(err => {
            console.error('Failed to inject script:', err);
        });
    } catch (err) {
        console.error('Failed to open side panel:', err);
    }
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.headers) {
      chrome.runtime.sendMessage({
        type: 'updateHeaders',
        headers: message.headers,
        tabId: sender.tab.id
      });
    }
  });


  // service_worker.js
