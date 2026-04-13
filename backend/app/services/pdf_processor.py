import os
import pytesseract
import time
import concurrent.futures
from pdf2image import convert_from_path
from pypdf import PdfReader
from PIL import ImageOps

from app.config import SUPABASE_URL  # just to ensure config loads


TESSERACT_PATH = os.getenv("TESSERACT_PATH")
POPPLER_PATH = os.getenv("POPPLER_PATH")

if TESSERACT_PATH:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
OCR_TEXT_THRESHOLD = 50

def process_single_page(page_index, file_path):
    """Highly optimized single-page OCR worker"""
    
    # SPEED HACK 1: Lower DPI and use JPEG
    # 220 DPI creates massive image matrices. 120-150 DPI is the sweet spot 
    # where Tesseract can still read perfectly but the image is 50% smaller.
    images = convert_from_path(
        file_path,
        dpi=150,           
        fmt='jpeg',        # JPEG processes faster in RAM than PNG
        thread_count=2,    # Tell Poppler to use multiple threads just for extraction
        poppler_path=POPPLER_PATH,
        first_page=page_index + 1,
        last_page=page_index + 1,
    )
    
    # SPEED HACK 2: Grayscale
    # Reduces the image from 3 color channels (RGB) to 1, cutting Tesseract's math by 66%
    gray = ImageOps.grayscale(images[0])
    
    # SPEED HACK 3: Strict Tesseract Config
    # -l eng: Hardcode the language so it doesn't waste CPU guessing.
    # --oem 3: Use the default neural net engine.
    # --psm 6: Tell Tesseract to assume a uniform block of text. This skips the 
    # highly CPU-intensive "layout analysis" phase where it searches for columns and images.
    custom_config = r'-l eng --oem 3 --psm 6'
    
    ocr_text = pytesseract.image_to_string(gray, config=custom_config)
    return ocr_text.strip()


def extract_text_from_pdf(file_path: str) -> str:
    start_time = time.time()

    reader = PdfReader(file_path)
    full_text_dict = {} 
    pages_needing_ocr = []

    # Step 1: Lightning-fast digital text pass
    for page_index, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if len(text.strip()) >= OCR_TEXT_THRESHOLD:
            full_text_dict[page_index] = text.strip()
        else:
            pages_needing_ocr.append(page_index)

    # Step 2: Parallel OCR Processing
    if pages_needing_ocr:
        ocr_start_time = time.time()
        print(f"   ⚠️ {len(pages_needing_ocr)} pages sent to OCR multi-threading...")
        
        # SPEED HACK 4: Multi-threading
        # Hugging Face free tier has limited vCPUs. Max workers = 3 prevents 
        # the container from crashing while processing 3 pages simultaneously.
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_to_page = {
                executor.submit(process_single_page, page_idx, file_path): page_idx 
                for page_idx in pages_needing_ocr
            }
            
            for future in concurrent.futures.as_completed(future_to_page):
                page_idx = future_to_page[future]
                try:
                    ocr_result = future.result()
                    if ocr_result:
                        full_text_dict[page_idx] = ocr_result
                except Exception as exc:
                    print(f"❌ Page {page_idx + 1} OCR failed: {exc}")

        ocr_elapsed = round(time.time() - ocr_start_time, 2)
        print(f"   ✅ [OCR DONE] Processed {len(pages_needing_ocr)} image pages in {ocr_elapsed}s.")
    # Step 3: Reassemble the document in the correct page order
    ordered_text = [full_text_dict[i] for i in range(len(reader.pages)) if i in full_text_dict]
    
    elapsed = round(time.time() - start_time, 2)
    print(f"✅ [DONE] Extraction complete in {elapsed}s.")
    
    return "\n\n".join(ordered_text)