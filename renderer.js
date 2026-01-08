// Grab HTML elements
const uploadBtn = document.getElementById('uploadBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const fileCountLabel = document.getElementById('fileCount');
const copyBtn = document.getElementById('copyBtn');
const copyText = copyBtn.querySelector('.btn-text');

// Grab Table Cells
const valRa = document.getElementById('val-ra');
const valRz = document.getElementById('val-rz');
const valRmr = document.getElementById('val-rmr');

let currentFilePaths = [];

console.log("Renderer loaded. Waiting for interaction...");

// 1. Handle Upload Button Click
uploadBtn.addEventListener('click', async () => {
    try {
        if (!window.api) {
            console.error("Error: window.api is missing.");
            return;
        }

        const files = await window.api.selectFiles();
        
        if (files.length > 0) {
            currentFilePaths = files;
            fileCountLabel.textContent = `${files.length} files loaded`;
            fileCountLabel.style.color = 'green';
            analyzeBtn.disabled = false;
        } else {
            fileCountLabel.textContent = "No files selected";
            analyzeBtn.disabled = true;
        }
    } catch (err) {
        console.error("Error in selectFiles:", err);
    }
});

// 2. Handle Analyze Button Click
analyzeBtn.addEventListener('click', async () => {
    if (currentFilePaths.length === 0) return;

    analyzeBtn.textContent = "Processing...";
    analyzeBtn.disabled = true;

    try {
        const data = await window.api.analyzeData(currentFilePaths);

        // Update the Table Cells
        valRa.textContent = data.Ra;
        valRz.textContent = data.Rz;
        valRmr.textContent = data.Rmr;

    } catch (error) {
        console.error("Error during analysis:", error);
        alert("Analysis failed. See console for details.");
    } finally {
        analyzeBtn.textContent = "Run Analysis";
        analyzeBtn.disabled = false;
    }
});

// 3. Handle Copy Button Click
copyBtn.addEventListener('click', () => {
    const ra = valRa.textContent;
    const rz = valRz.textContent;
    const rmr = valRmr.textContent;

    // Check if there is data to copy
    if(ra === '-' || rz === '-' || rmr === '-') {
        alert("Please run analysis first.");
        return;
    }

    // --- FIX FOR EXCEL PERCENTAGE ---
    // Excel expects "0.82" to display "82%".
    // We must divide the Rmr value by 100 before copying.
    let rmrForClipboard = rmr;
    const rmrNumber = parseFloat(rmr);

    if (!isNaN(rmrNumber)) {
        // Divide by 100 so Excel reads it correctly (e.g., 82.95 becomes 0.8295)
        rmrForClipboard = (rmrNumber / 100).toString();
    }
    // -------------------------------

    // Create a Tab-Separated String for Excel
    // \t = Tab (Next Column)
    const excelString = `${ra}\t${rz}\t${rmrForClipboard}`;

    // Write to Clipboard
    navigator.clipboard.writeText(excelString).then(() => {
        // Visual Feedback
        const originalText = copyText.textContent;
        const originalColor = copyBtn.style.color;

        copyText.textContent = "Copied!";
        copyBtn.classList.add('copied');

        // Reset after 2 seconds
        setTimeout(() => {
            copyText.textContent = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
});