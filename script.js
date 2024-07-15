console.log('PDF.js loaded:', typeof pdfjsLib !== 'undefined');
console.log('PDF-lib loaded:', typeof PDFLib !== 'undefined');

// PDF.jsのワーカーを設定
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    document.getElementById('split-button').addEventListener('click', splitPDF);
});

async function splitPDF() {
    console.log('splitPDF function called');
    if (typeof PDFLib === 'undefined') {
        console.error('PDFLib is not loaded');
        updateOutput("PDFライブラリの読み込みに失敗しました。ページを再読み込みしてください。");
        return;
    }

    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    if (!file) {
        updateOutput("ファイルが選択されていません。");
        return;
    }

    updateOutput("PDFの分割を開始します...");
    try {
        const arrayBuffer = await file.arrayBuffer();
        console.log('File loaded into ArrayBuffer');
        
        // PDF-libを使用してPDFを読み込む
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        console.log('PDF loaded');
        const totalPages = pdfDoc.getPageCount();
        updateOutput(`総ページ数: ${totalPages}`);

        for (let i = 0; i < totalPages; i += 10) {
            const subDoc = await PDFLib.PDFDocument.create();
            const copiedPages = await subDoc.copyPages(pdfDoc, Array.from({length: Math.min(10, totalPages - i)}, (_, j) => i + j));
            copiedPages.forEach(page => subDoc.addPage(page));

            const pdfBytes = await subDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            createDownloadLink(url, `split_${Math.floor(i / 10) + 1}.pdf`);

            updateProgress(Math.min(100, (i + 10) / totalPages * 100), `処理中... ${i + 1} / ${totalPages} ページ`);
        }

        updateOutput("PDFの分割が完了しました。下のリンクからダウンロードしてください。");
    } catch (error) {
        console.error('Error during PDF processing:', error);
        updateOutput(`エラーが発生しました: ${error.message}`);
    }
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
