
async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['openaiApiKey', 'ollamaApiKey', 'openaiEndpoint', 'ollamaEndpoint', 'defaultClient'], (items) => {
      resolve(items);
    });
  });
}

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
        let res = await chrome.sidePanel.open({tabId:tab.id});
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


// Function to call OpenAI API
async function callOpenAI(prompt) {
  const response = await fetch(config.openaiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openaiApiKey}`
    },
    body: JSON.stringify({
      prompt: prompt,
      max_tokens: 100
    })
  });
  const data = await response.json();
  return data.choices[0].text;
}

// Function to call Ollama API
async function callOllama(prompt,config) {
  const response = await fetch(config.ollamaEndpoint, {
    method: 'POST',
    referrerPolicy: 'no-referrer',
    headers: {
      'Content-Type': 'application/json',
      'Origin': null,
      //'Authorization': `Bearer ${config.ollamaApiKey}`
    },
    body: JSON.stringify({
      model: "qwen2.5:14b-instruct-q8_0",
      prompt: prompt,
      stream: false,
      options: {
        num_predict: 128 // (Default: 128, -1 = infinite generation, -2 = fill context)
      }
    })
  });
  console.log("response",response);
  console.log("status",response.status);
  const data = await response.json();
  let text = data.response;
  return text || "No response from Ollama";
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);
  if (message.action === 'generateHelp') {
    const prompt = message.entry;
    getConfig().then(config => {
      const client = message.client || config.defaultClient;
      if (client === 'openai') {
        callOpenAI(prompt)
          .then(result => {
            sendResponse({ result: result });
          })
          .catch(error => {
            console.error("Error during OpenAI help generation:", error);
            sendResponse({ error: 'Help generation failed' });
          });
      } else if (client === 'ollama') {
        callOllama(prompt,config)
          .then(result => {
            sendResponse({ result: result });
          })
          .catch(error => {
            console.error("Error during Ollama help generation:", error);
            sendResponse({ error: 'Help generation failed' });
          });
      } else {
        console.warn("Invalid client specified", client);
        sendResponse({ error: 'Invalid client specified' });
      }
    });
    return true; // Indicates that the response will be sent asynchronously
  } else {
    console.warn("This action is not for us:", message);
    //sendResponse({ error: 'Invalid action' });
    return false;
  }
});


// Clear all data when the extension is uninstalled or disabled
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
  