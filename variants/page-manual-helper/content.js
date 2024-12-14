import * as tf from '@tensorflow/tfjs';

async function loadModel() {
    // Load the TensorFlow.js model
    const model = await tf.loadLayersModel(chrome.runtime.getURL('model/model.json'));
    return model;
}

function extractPageSummary() {
    // Extract metadata and visible content from the page
    const title = document.title || "No title found";
    const description = document.querySelector("meta[name='description']")?.content || "No description found";
    const keywords = document.querySelector("meta[name='keywords']")?.content || "No keywords found";
    const mainContent = document.querySelector("main")?.innerText || "No main content found";

    return `Title: ${title}\nDescription: ${description}\nKeywords: ${keywords}\nMain Content: ${mainContent}`;
}

async function generateUserManual(summary) {
    // Load the model
    const model = await loadModel();

    // Preprocess input
    const inputTensor = tf.tensor([summary.length]); // Mock example, replace with tokenizer

    // Generate output
    const outputTensor = model.predict(inputTensor);

    // Postprocess output
    const outputText = outputTensor.dataSync().toString();
    return outputText;
}

async function displayManual() {
    const summary = extractPageSummary();
    const manual = await generateUserManual(summary);

    const sidebar = document.createElement('div');
    sidebar.id = 'manual-sidebar';
    sidebar.style = \`
        position: fixed;
        top: 0;
        right: 0;
        width: 300px;
        height: 100%;
        background: white;
        border-left: 1px solid #ccc;
        overflow-y: scroll;
        z-index: 10000;
        padding: 10px;
        font-family: Arial, sans-serif;
    \`;
    sidebar.innerHTML = \`
        <h3>User Manual</h3>
        <pre>\${manual}</pre>
    \`;
    document.body.appendChild(sidebar);
}

displayManual();