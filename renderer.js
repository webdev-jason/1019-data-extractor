const uploadBtn = document.getElementById('uploadBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const fileCountLabel = document.getElementById('fileCount');

const valRa = document.getElementById('val-ra');
const valRz = document.getElementById('val-rz');
const valRmr = document.getElementById('val-rmr');

let currentFilePaths = [];

// 1. Handle Upload Button Click
uploadBtn.addEventListener('click', async () => {
    // Call the secure API exposed in preload.js
    const files = await window.api.selectFiles();
    
    if (files.length > 0) {
        currentFilePaths = files;
        fileCountLabel.textContent = `${files.length} files loaded`;
        fileCountLabel.style.color = 'green';
        analyzeBtn.disabled = false;
    } else {
        // User cancelled dialog
        fileCountLabel.textContent = "No files selected";
        analyzeBtn.disabled = true;
    }
});

// 2. Handle Analyze Button Click
analyzeBtn.addEventListener('click', async () => {
    if (currentFilePaths.length === 0) return;

    analyzeBtn.textContent = "Processing...";
    analyzeBtn.disabled = true;

    try {
        // Send paths to Python and wait for the response
        const data = await window.api.analyzeData(currentFilePaths);

        // Update the HTML elements with the received data
        valRa.textContent = data.Ra;
        valRz.textContent = data.Rz;
        valRmr.textContent = data.Rmr;

    } catch (error) {
        console.error("Error during analysis:", error);
        alert("An error occurred. Check the console (Ctrl + Shift + I) for details.");
    } finally {
        analyzeBtn.textContent = "Run Analysis";
        analyzeBtn.disabled = false;
    }
});