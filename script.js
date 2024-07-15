console.log('PDF.js loaded:', typeof pdfjsLib !== 'undefined');
console.log('PDF-lib loaded:', typeof PDFLib !== 'undefined');
console.log('JSZip loaded:', typeof JSZip !== 'undefined');

// PDF.jsのワーカーを設定
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

let splitPDFs = []; // 分割されたPDFを保存する配列

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    document.getElementById('split-button').addEventListener('click', splitPDF);
    document.getElementById('bulk-download-button').addEventListener('click', bulkDownload);
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

    const pageCountInput = document.getElementById('page-count');
    const pageCount = parseInt(pageCountInput.value, 10);
    if (isNaN(pageCount) || pageCount < 1) {
        updateOutput("無効なページ数です。1以上の数値を入力してください。");
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

        splitPDFs = []; // リセット

        for (let i = 0; i < totalPages; i += pageCount) {
            const subDoc = await PDFLib.PDFDocument.create();
            const copiedPages = await subDoc.copyPages(pdfDoc, Array.from({length: Math.min(pageCount, totalPages - i)}, (_, j) => i + j));
            copiedPages.forEach(page => subDoc.addPage(page));

            const pdfBytes = await subDoc.save();
            splitPDFs.push({name: `split_${Math.floor(i / pageCount) + 1}.pdf`, data: pdfBytes});
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            createDownloadLink(url, `split_${Math.floor(i / pageCount) + 1}.pdf`);

            updateProgress(Math.min(100, (i + pageCount) / totalPages * 100), `処理中... ${i + 1} / ${totalPages} ページ`);
        }

        updateOutput(`PDFの分割が完了しました。${pageCount}ページごとに分割されています。下のリンクからダウンロードしてください。`);
        document.getElementById('bulk-download-button').style.display = 'block';
    } catch (error) {
        console.error('Error during PDF processing:', error);
        updateOutput(`エラーが発生しました: ${error.message}`);
    }
}

async function bulkDownload() {
    const zip = new JSZip();
    splitPDFs.forEach(pdf => {
        zip.file(pdf.name, pdf.data);
    });
    
    const content = await zip.generateAsync({type: "blob"});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "split_pdfs.zip";
    link.click();
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
