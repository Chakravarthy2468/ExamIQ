import io
import fitz # PyMuPDF
import cv2
import numpy as np
from PIL import Image
import pytesseract

def parse_pdf(file_path: str) -> str:
    """Extract text from a PDF. Fallback to OCR if page has no text."""
    doc = fitz.open(file_path)
    full_text = []
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text()
        
        # Simple heuristic: if there's very little text, maybe it's a scanned image
        if len(text.strip()) < 50:
            text = perform_ocr_on_page(page)
            
        full_text.append(text)
        
    return "\n".join(full_text)

def perform_ocr_on_page(page: fitz.Page) -> str:
    """Render PDF page to image and perform OCR."""
    try:
        pix = page.get_pixmap(dpi=300)
        img_bytes = pix.tobytes("png")
        nparr = np.frombuffer(img_bytes, np.uint8)
        img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Preprocessing for OCR
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        # Apply threshold to make text clearer
        _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
        
        pil_img = Image.fromarray(thresh)
        text = pytesseract.image_to_string(pil_img)
        return text
    except Exception as e:
        # Graceful fallback if Tesseract is not installed
        print(f"OCR failed: {e}")
        return ""
