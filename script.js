// A simple debouncing function to limit how often a function is executed
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// 3.4.1. Core Application Setup
const mermaidCodeEl = document.getElementById('mermaid-code');
const mermaidPreviewEl = document.getElementById('mermaid-preview');
const downloadButton = document.getElementById('download-button');
const INITIAL_DIAGRAM_CODE = `graph TD;
    A --> B(Process);
    B --> C{Decision};
    C --> D[End A];
    C --> E;
`;

mermaidCodeEl.value = INITIAL_DIAGRAM_CODE;

// 3.4.2. The Live Render Function (debounced)
const renderDiagram = debounce(async () => {
    const graphDefinition = mermaidCodeEl.value;
    try {
        const { svg } = await window.mermaid.render('mermaid-preview-id', graphDefinition);
        mermaidPreviewEl.innerHTML = svg;
    } catch (error) {
        console.error('Mermaid render error:', error);
        mermaidPreviewEl.innerHTML = `<p style="color:red;">Error rendering diagram. Check your syntax.</p>`;
    }
}, 300); // 300ms debounce delay

// 3.4.3. SVG-to-PNG Conversion Function
const convertSvgToPng = async (svgElement) => {
    // Step 1: Serialize the SVG element into an XML data string
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;

    // Step 2 & 3: Load the XML data string into an Image object
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // Step 4: Create a temporary canvas and draw the SVG image onto it
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 2048;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // Step 5: Convert the canvas content to a PNG data URL
            try {
                const pngDataUrl = canvas.toDataURL('image/png', 1.0);
                resolve(pngDataUrl);
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = reject;
        img.src = svgUrl;
    });
};

// 3.4.4. The Client-Side Download Trigger
const triggerDownload = (dataUrl, filename) => {
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a); // Required for Firefox to work
    a.click();
    document.body.removeChild(a);
};

// 3.4.5. Event Handlers
document.addEventListener('DOMContentLoaded', () => {
    renderDiagram(); // Initial render on page load
    mermaidCodeEl.addEventListener('input', renderDiagram);
});

downloadButton.addEventListener('click', async () => {
    const svgElement = mermaidPreviewEl.querySelector('svg');
    if (!svgElement) {
        alert('No diagram to download. Please enter some valid Mermaid code.');
        return;
    }
    
    try {
        const pngDataUrl = await convertSvgToPng(svgElement);
        triggerDownload(pngDataUrl, 'mermaid-diagram.png');
    } catch (error) {
        console.error('Download error:', error);
        alert('An error occurred during image conversion.');
    }
});
