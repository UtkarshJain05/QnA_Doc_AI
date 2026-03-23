import os
import pytesseract

from pdf2image import convert_from_path
from pypdf import PdfReader
from PIL import ImageOps

from app.config import SUPABASE_URL  # just to ensure config loads


TESSERACT_PATH = os.getenv("TESSERACT_PATH")
POPPLER_PATH = os.getenv("POPPLER_PATH")

if TESSERACT_PATH:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

OCR_TEXT_THRESHOLD = 50


def extract_text_from_pdf(file_path: str) -> str:
    """
    Hybrid PDF text extraction:
    1. Try direct text extraction (digital PDFs)
    2. Fallback to OCR for image-based pages
    """

    reader = PdfReader(file_path)

    full_text = []

    for page_index, page in enumerate(reader.pages):

        text = page.extract_text() or ""

        if len(text.strip()) >= OCR_TEXT_THRESHOLD:
            full_text.append(text.strip())
        
        else:
            # OCR fallback for this specific page
            images = convert_from_path(
                file_path,
                dpi=220,
                poppler_path=POPPLER_PATH,
                first_page=page_index + 1,
                last_page=page_index + 1,
            )

            ocr_text = ""

            for img in images:
                gray = ImageOps.grayscale(img)

                ocr_text += pytesseract.image_to_string(
                    gray,
                    config="--oem 3 --psm 6",
                )
                

            if ocr_text.strip():
                full_text.append(ocr_text.strip())

    return "\n\n".join(full_text)