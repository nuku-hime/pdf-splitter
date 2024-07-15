// PDF.jsのワーカーを設定
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

document.getElementById('split-button').addEventListener('click', splitPDF);

async function splitPDF() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    if (!file) {
        updateOutput("ファイルが選択されていません。");
        return;
    }

    updateOutput("PDFの分割を開始します...");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const totalPages = pdf.numPages;
    updateOutput(`総ページ数: ${totalPages}`);

    for (let i = 1; i <= totalPages; i += 10) {
        const pdfDoc = await PDFLib.PDFDocument.create();
        const copiedPages = await pdfDoc.copyPages(pdf, Array.from({length: Math.min(10, totalPages - i + 1)}, (_, j) => i + j - 1));
        copiedPages.forEach(page => pdfDoc.addPage(page));

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        createDownloadLink(url, `split_${Math.floor(i / 10) + 1}.pdf`);

        updateProgress(Math.min(100, (i + 10) / totalPages * 100), `処理中... ${i} / ${totalPages} ページ`);
    }

    updateOutput("PDFの分割が完了しました。下のリンクからダウンロードしてください。");
}

function updateOutput(message) {
    document.getElementById('output').innerHTML += `<p>${message}</p>`;
}

function updateProgress(percent, status) {
    const progressContainer = document.getElementById('progress-container');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressStatus = document.getElementById('progress-status');
    
    progressContainer.style.display = 'block';
    progressBarFill.style.width = `${percent}%`;
    progressStatus.innerHTML = status;
}

function createDownloadLink(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.className = 'download-link';
    link.textContent = filename;
    document.getElementById('download-links').appendChild(link);
}
