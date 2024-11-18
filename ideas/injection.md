## Simple Extracción con un `executeScript`

```javascript
chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: "MAIN",
        func: () => {
            // Aquí puedes acceder directamente al DOM de la página
            const pageContent = document.documentElement.innerHTML;
            console.log(pageContent);
            // También puedes acceder a window, document y otras APIs del navegador
            return pageContent;
        }
    });
});
```

Las extracciones con debugger ya las hemos usado en commit `dd9661bbf10283298b1acebe4886c3adb9d61f3d`.

En particular, hemos hecho una extracción de dato estructurado con más detalle:

```javascript
JSON.stringify({
    meta: {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content,
        language: document.documentElement.lang,
        canonical: document.querySelector('link[rel="canonical"]')?.href
    },
    mainContent: document.querySelector('main')?.innerText,
    headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({
        level: h.tagName,
        text: h.innerText,
        isVisible: window.getComputedStyle(h).display !== 'none'
    })),
    interactiveElements: {
        forms: [...document.forms].map(f => ({
            id: f.id,
            action: f.action,
            fields: [...f.elements].map(e => ({
                name: e.name,
                type: e.type,
                value: e.type === 'password' ? null : e.value
            }))
        })),
        buttons: [...document.querySelectorAll('button,input[type="button"]')].map(b => ({
            text: b.innerText || b.value,
            isVisible: window.getComputedStyle(b).display !== 'none'
        }))
    },
    selection: window.getSelection().toString(),
    activeElement: document.activeElement.tagName
});
```

## Extracción con un `MutationObserver`

```javascript
function gatherPageContext() {
    return {
        meta: {
            title: document.title,
            url: window.location.href,
            lang: document.documentElement.lang,
            description: document.querySelector('meta[name="description"]')?.content
        },
        content: {
            headings: Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => ({
                level: h.tagName,
                text: h.textContent.trim()
            })),
            mainContent: document.querySelector('main')?.textContent || document.body.textContent,
            links: Array.from(document.links).map(l => ({
                text: l.textContent,
                href: l.href
            })),
            forms: Array.from(document.forms).map(f => ({
                id: f.id,
                fields: Array.from(f.elements).map(e => ({
                    type: e.type,
                    name: e.name,
                    value: e.type === 'password' ? null : e.value
                }))
            }))
        },
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollY: window.scrollY
        },
        selection: window.getSelection().toString()
    };
}
```

## Extracción de Datos del Viewport y Accesibilidad

```javascript
chrome.action.onClicked.addListener(async (tab) => {
    const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
            const styles = getComputedStyle(document.body);
            return {
                styles: {
                    colors: {
                        background: styles.backgroundColor,
                        text: styles.color
                    }
                },
                metrics: {
                    viewport: {
                        width: visualViewport.width,
                        height: visualViewport.height,
                        scale: visualViewport.scale
                    },
                    scrollPosition: {
                        x: window.scrollX,
                        y: window.scrollY
                    }
                },
                accessibility: {
                    ariaLabels: Array.from(document.querySelectorAll('[aria-label]')).map(el => ({
                        element: el.tagName,
                        label: el.getAttribute('aria-label')
                    }))
                },
                performance: performance.getEntriesByType('navigation')[0],
                resourceUsage: performance.memory
            };
        }
    });
});
```

## Capturar Simplemente el PNG

```javascript
chrome.action.onClicked.addListener(async (tab) => {
    const screenshot = await chrome.tabs.captureVisibleTab(null, {
        format: 'png',
        quality: 100
    });
    // Process screenshot data URL
});
```

## Comprobar si el Usuario Usa Mucho la Página

```javascript
// Add to permissions: "history"
chrome.action.onClicked.addListener(async (tab) => {
    const history = await chrome.history.getVisits({
        url: tab.url
    });
    // Analyze user's interaction patterns with this page
});
```

## Capturar como MHTML

### Manifest.json Additions

```json
{
    "permissions": [
        "pageCapture"
    ]
}
```

### Background.js

```javascript
chrome.action.onClicked.addListener(async (tab) => {
    try {
        // Capture entire page as MHTML
        const blob = await chrome.pageCapture.saveAsMHTML({ tabId: tab.id });
        
        // Convert blob to text
        const mhtmlText = await blob.text();
        
        // Store for analysis
        await chrome.storage.local.set({
            pageSnapshot: {
                url: tab.url,
                timestamp: Date.now(),
                mhtml: mhtmlText
            }
        });
 
    } catch (error) {
        console.error('Page capture failed:', error);
    }
});
```

## Usar Contenido Declarativo

```javascript
chrome.runtime.onInstalled.addListener(() => {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        // Activate on pages with specific elements
                        css: ['article', 'main', 'form'],
                        // Optional URL pattern
                        pageUrl: { schemes: ['https'] }
                    }),
                    new chrome.declarativeContent.PageStateMatcher({
                        // Activate on pages with headings
                        css: ['h1', 'h2', 'h3']
                    })
                ],
                actions: [
                    new chrome.declarativeContent.ShowAction()
                ]
            }
        ]);
    });
});
```
