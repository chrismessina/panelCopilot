

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

//IA local:
import { env,pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers';

env.backends.onnx.wasm.numThreads = 1;

//env.wasm.numThreads=1;

let textGenerationPipeline = null;

chrome.runtime.onInstalled.addListener(async () => {
    //const model = 'Xenova/distilgpt2';
    //const model = '/onnx-community/Llama-3.2-1B-Instruct' //faltan ficheros
    //const model = 'Xenova/gpt2';
    //const model ='Xenova/Phi-3-mini-4k-instruct';  //unsoported
    //const model = 'Xenova/bloom-560m'; 
    //const model = 'Xenova/llama2.c-stories15M'; 
    //const model = 'onnx-community/Qwen2.5-0.5B-Instruct' //faltan ficheros
    //const model = 'Xenova/Qwen1.5-0.5B-Chat';
    const model = 'Xenova/gpt-neo-125M';


    console.log('Starting model initialization...');
    textGenerationPipeline = await pipeline('text-generation', model, {
      progress_callback: (status) => {
        console.log('Model loading status:', status);
      }
    });
    console.log('Model loaded successfully', textGenerationPipeline);
    //now test the model, output result to console:
    const output = await textGenerationPipeline('The capital of France is');
    console.log('Model test output:', output[0].generated_text);
    console.log(output);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);
  if (message.action === 'generateHelp' && textGenerationPipeline) {
    console.log("Calling pipeline with entry:", message.entry);
    textGenerationPipeline(message.entry, { max_length: 100, num_return_sequences: 3, do_sample: true, top_k: 5 })
      .then(output => {
        console.log("Pipeline output:", output);
        sendResponse({ result: output[0].generated_text });
      })
      .catch(error => {
        console.error("Error during help generation:", error);
        sendResponse({ error: 'Help generation failed' });
      });
    return true; // Indicates that the response will be sent asynchronously
  } else {
    console.warn("Invalid action or uninitialized pipeline");
    sendResponse({ error: 'Invalid action or uninitialized pipeline' });
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
  