import pymupdf

def extract_lines_from_pdf(pdf_bytes: bytes) -> str: # maybe list[str] later
    doc = pymupdf.Document(stream=pdf_bytes)
    return doc.get_page_text(0)
