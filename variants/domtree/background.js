// Set the side panel to open when the toolbar button is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Error setting panel behavior:", error));

// Add a context menu to open the side panel
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openSidePanel",
    title: "Open Lateral Panel",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openSidePanel") {
    console.log("vamos");
    // Open the side panel in the current window
    chrome.sidePanel
      .open({ windowId: tab?.windowId })
      .catch((error) => console.error("Error opening side panel:", error));
  }
});
