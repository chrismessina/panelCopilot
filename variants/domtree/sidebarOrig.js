function getDomTree(node) {
  const element = {
    tag: node.tagName ? node.tagName.toLowerCase() : "text",
    children: []
  };

  if (node.tagName) {
    for (const child of node.children) {
      element.children.push(getDomTree(child));
    }
  } else if (node.nodeType === Node.TEXT_NODE) {
    element.tag = node.textContent.trim() || "empty text";
  }

  return element;
}

function renderTree(node, container) {
  const listItem = document.createElement("li");
  listItem.textContent = node.tag;
  container.appendChild(listItem);

  if (node.children.length > 0) {
    const sublist = document.createElement("ul");
    node.children.forEach((child) => renderTree(child, sublist));
    container.appendChild(sublist);
  }
}

async function generateDomTree() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const domTree = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const serializeDomTree = (node) => {
        const element = {
          tag: node.tagName ? node.tagName.toLowerCase() : "text",
          children: []
        };

        if (node.tagName) {
          for (const child of node.children) {
            element.children.push(serializeDomTree(child));
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          element.tag = node.textContent.trim() || "empty text";
        }

        return element;
      };

      return serializeDomTree(document.body);
    }
  });

  const tree = domTree[0].result;
  const container = document.getElementById("dom-tree");
  container.innerHTML = "";
  renderTree(tree, container);
}

generateDomTree();

