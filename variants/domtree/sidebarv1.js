// Serialize the DOM tree in the active tab
function serializeDOMTree(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.trim();
    return text ? { "#text": text } : null;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }
  // Skip <script> tags
  if (node.tagName.toLowerCase() === "script") {
    return null;
  };
  const element = {
    tag: node.tagName.toLowerCase(),
    attributes: {},
    children: []
  };

  // Include meaningful attributes (id and class)
  if (node.id) element.attributes.id = node.id;
  if (node.className) element.attributes.class = node.className;

  // Recursively serialize child nodes
  node.childNodes.forEach((child) => {
    const serializedChild = serializeDOMTree(child);
    if (serializedChild) {
      element.children.push(serializedChild);
    }
  });

  return element;
}

// Inject and execute the serialization script on the active tab
function fetchPageDOM() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    chrome.scripting.executeScript(
      {
        target: { tabId: activeTab.id },
        func: () => {
          // Serialize the DOM
          const serializeDOMTree = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent.trim();
              return text ? { "#text": text } : null;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) {
              return null;
            }
            if (node.tagName.toLowerCase() === "script") {
              return null;
             };

            const element = {
              tag: node.tagName.toLowerCase(),
              attributes: {},
              children: []
            };

            if (node.id) element.attributes.id = node.id;
            if (node.className) element.attributes.class = node.className;

            node.childNodes.forEach((child) => {
              const serializedChild = serializeDOMTree(child);
              if (serializedChild) {
                element.children.push(serializedChild);
              }
            });

            return element;
          };

          // Return serialized DOM as JSON
          return JSON.stringify(serializeDOMTree(document.body), null, 2);
        }
      },
      (results) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          alert("Failed to fetch DOM. Ensure the page is not a restricted URL.");
          return;
        }

        // Render the DOM tree in the sidebar
        const domTree = results[0].result;
        displayDOMTree(domTree);
      }
    );
  });
}

// Display the serialized DOM in the sidebar
function displayDOMTree(domTree) {
  const container = document.getElementById("dom-tree");

  // Clear previous content
  container.innerHTML = "";

  // Create a textarea to display the DOM tree
  const textArea = document.createElement("textarea");
  textArea.style.width = "100%";
  textArea.style.height = "300px";
  textArea.style.fontFamily = "monospace";
  textArea.style.marginBottom = "10px";
  textArea.value = domTree;

  // Create a copy button
  const copyButton = document.createElement("button");
  copyButton.textContent = "Copy DOM to Clipboard";
  copyButton.style.display = "block";

  copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(domTree);
    alert("DOM tree copied to clipboard!");
  });

  container.appendChild(textArea);
  container.appendChild(copyButton);
}

// Initialize the DOM Explorer
document.addEventListener("DOMContentLoaded", fetchPageDOM);
