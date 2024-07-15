import io
import js
from PyPDF2 import PdfReader, PdfWriter
from pyodide.ffi import create_proxy

def update_output(message):
    js.document.querySelector("#output").innerHTML += f"<p>{message}</p>"

def update_progress(percent, status):
    progress_container = js.document.querySelector("#progress-container")
    progress_bar_fill = js.document.querySelector("#progress-bar-fill")
    progress_status = js.document.querySelector("#progress-status")
    
    progress_container.style.display = "block"
    progress_bar_fill.style.width = f"{percent}%"
    progress_status.innerHTML = status

def create_download_link(file_content, filename):
    blob = js.Blob.new([file_content], {type: "application/pdf"})
    url = js.URL.createObjectURL(blob)
    link = f'<a href="{url}" download="{filename}" class="download-link">{filename}</a>'
    js.document.querySelector("#download-links").innerHTML += link

def split_pdf(event):
    update_output("PDFの分割を開始します...")
    file_input = js.document.querySelector("#file-input")
    if not file_input.files:
        update_output("ファイルが選択されていません。")
        return

    file = file_input.files.item(0)
    array_buffer = io.BytesIO(file.to_bytes())

    try:
        pdf = PdfReader(array_buffer)
        total_pages = len(pdf.pages)
        update_output(f"総ページ数: {total_pages}")

        js.document.querySelector("#download-links").innerHTML = ""  # Clear previous links

        for i in range(0, total_pages, 10):
            output = PdfWriter()
            for j in range(i, min(i+10, total_pages)):
                output.add_page(pdf.pages[j])
            
            output_stream = io.BytesIO()
            output.write(output_stream)
            output_stream.seek(0)

            filename = f"split_{i//10+1}.pdf"
            create_download_link(output_stream.getvalue(), filename)
            
            progress_percent = min(100, int((i + 10) / total_pages * 100))
            update_progress(progress_percent, f"処理中... {i+1} / {total_pages} ページ")
            
            update_output(f"分割されたPDF {i//10+1} を作成しました (ページ {i+1} - {min(i+10, total_pages)})")

        update_progress(100, "完了")
        update_output("PDFの分割が完了しました。下のリンクからダウンロードしてください。")
    except Exception as e:
        update_output(f"エラーが発生しました: {str(e)}")
        update_progress(100, "エラー")
   
