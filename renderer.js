// Grab HTML elements
const uploadBtn = document.getElementById('uploadBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const fileList = document.getElementById('fileList');

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
        
        fileList.innerHTML = '';

        if (files.length > 0) {
            currentFilePaths = files.map(f => f.path);
            
            files.forEach(file => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="col-name" title="${file.name}">${file.name}</span>
                    <span class="col-date">${file.date}</span>
                    <span class="col-time">${file.time}</span>
                `;
                fileList.appendChild(li);
            });

            analyzeBtn.disabled = false;
        } else {
            fileList.innerHTML = '<li class="empty-msg">No files selected. Click \'Select Files\' to begin.</li>';
            analyzeBtn.disabled = true;
            currentFilePaths = [];
        }

        valRa.textContent = "-";
        valRz.textContent = "-";
        valRmr.textContent = "-";

    } catch (err) {
        console.error("Error in selectFiles:", err);
    }
});

// 2. Handle Analyze Button Click
analyzeBtn.addEventListener('click', async () => {
    if (currentFilePaths.length === 0) return;

    // State: Processing
    analyzeBtn.textContent = "⏳ Processing...";
    analyzeBtn.disabled = true;

    try {
        const data = await window.api.analyzeData(currentFilePaths);

        valRa.textContent = data.Ra;
        valRz.textContent = data.Rz;
        valRmr.textContent = data.Rmr;

    } catch (error) {
        console.error("Error during analysis:", error);
        alert("Analysis failed. See console for details.");
    } finally {
        // State: Reset back to default
        analyzeBtn.textContent = "⚙️ Run Analysis";
        analyzeBtn.disabled = false;
    }
});

// 3. Handle Copy Button Click
copyBtn.addEventListener('click', () => {
    const ra = valRa.textContent;
    const rz = valRz.textContent;
    const rmr = valRmr.textContent;

    if(ra === '-' || rz === '-' || rmr === '-') {
        alert("Please run analysis first.");
        return;
    }

    let rmrForClipboard = rmr;
    const rmrNumber = parseFloat(rmr);

    if (!isNaN(rmrNumber)) {
        rmrForClipboard = (rmrNumber / 100).toString();
    }

    const excelString = `${ra}\t${rz}\t${rmrForClipboard}`;

    navigator.clipboard.writeText(excelString).then(() => {
        const originalText = copyText.textContent;
        
        copyText.textContent = "Copied!";
        copyBtn.classList.add('copied');

        setTimeout(() => {
            copyText.textContent = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
});