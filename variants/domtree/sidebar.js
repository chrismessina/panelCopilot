let currentScreenshot = ""; // Store the latest screenshot data URL
let currentYAML = ""; // Store the latest YAML

// Serialize the DOM to YAML format
function serializeToCompactYAML(node, depth = 0) {
  const indent = "  ".repeat(depth);
  let yaml = "";

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.trim();
    return text ? `${indent}- "${text}"` : null;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  if (node.tagName.toLowerCase() === "script") {
    return null;
  }

  yaml += `${indent}${node.tagName.toLowerCase()}:`;

  const attributes = [];
  if (node.id) attributes.push(`id: "${node.id}"`);
  if (node.className) attributes.push(`class: "${node.className}"`);

  if (attributes.length > 0) {
    yaml += `\n${indent}  attributes:\n${indent}    ${attributes.join(`\n${indent}    `)}`;
  }

  const children = Array.from(node.childNodes)
    .map((child) => serializeToCompactYAML(child, depth + 1))
    .filter((child) => child !== null);

  if (children.length > 0) {
    yaml += `\n${children.join("\n")}`;
  } else if (attributes.length === 0) {
    yaml += " {}";
  }

  return yaml;
}

// Fetch and serialize the DOM to YAML
function fetchPageYAML() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    chrome.scripting.executeScript(
      {
        target: { tabId: activeTab.id },
        func: () => {
          const serializeToCompactYAML = (node, depth = 0) => {
            const indent = "  ".repeat(depth);
            let yaml = "";

            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent.trim();
              return text ? `${indent}- "${text}"` : null;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) {
              return null;
            }

            if (node.tagName.toLowerCase() === "script") {
              return null;
            }

            yaml += `${indent}${node.tagName.toLowerCase()}:`;

            const attributes = [];
            if (node.id) attributes.push(`id: "${node.id}"`);
            if (node.className) attributes.push(`class: "${node.className}"`);

            if (attributes.length > 0) {
              yaml += `\n${indent}  attributes:\n${indent}    ${attributes.join(`\n${indent}    `)}`;
            }

            const children = Array.from(node.childNodes)
              .map((child) => serializeToCompactYAML(child, depth + 1))
              .filter((child) => child !== null);

            if (children.length > 0) {
              yaml += `\n${children.join("\n")}`;
            } else if (attributes.length === 0) {
              yaml += " {}";
            }

            return yaml;
          };

          return serializeToCompactYAML(document.body);
        }
      },
      (results) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          alert("Failed to fetch DOM. Ensure the page is not a restricted URL.");
          return;
        }

        currentYAML = results[0].result; // Store YAML
        alert("DOM serialized successfully!");
      }
    );
  });
}

// Capture a screenshot of the current tab
function captureTabScreenshot() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        alert("Failed to capture screenshot.");
        return;
      }

      currentScreenshot = dataUrl; // Store screenshot
      const container = document.getElementById("screenshot-container");
      container.innerHTML = ""; // Clear old screenshot

      const img = document.createElement("img");
      img.src = dataUrl;
      img.style.maxWidth = "100%";
      container.appendChild(img);
      alert("Screenshot captured successfully!");
    });
  });
}

// Copy YAML to clipboard
function copyYAMLToClipboard() {
  if (!currentYAML) {
    alert("No YAML available. Please serialize the DOM first.");
    return;
  }
  navigator.clipboard.writeText(currentYAML).then(() => {
    alert("YAML copied to clipboard!");
  });
}

// Copy screenshot to clipboard
function copyScreenshotToClipboard() {
  if (!currentScreenshot) {
    alert("No screenshot available. Please capture one first.");
    return;
  }

  fetch(currentScreenshot)
    .then((res) => res.blob())
    .then((blob) => {
      const item = new ClipboardItem({ "image/png": blob });
      navigator.clipboard.write([item]);
      alert("Screenshot copied to clipboard!");
    });
}

// Add event listeners for buttons
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("serialize-dom").addEventListener("click", fetchPageYAML);
  document.getElementById("capture-screenshot").addEventListener("click", captureTabScreenshot);
  document.getElementById("copy-yaml").addEventListener("click", copyYAMLToClipboard);
  document.getElementById("copy-screenshot").addEventListener("click", copyScreenshotToClipboard);
});
