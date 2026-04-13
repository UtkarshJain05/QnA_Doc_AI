import asyncio
import time
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import os
import uuid

from app.services.pdf_processor import extract_text_from_pdf
from app.services.rag_pipeline import (
    ask_question,
    ingest_pdf_text,
    delete_session_data,
)

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


# -------------------------
# Ask Endpoint
# -------------------------

class QueryRequest(BaseModel):
    question: str
    session_id: str


@router.post("/ask")
async def ask(request: QueryRequest):
    answer = ask_question(request.question, request.session_id)
    return {
    "answer": answer,
    "session_id": request.session_id
    }


# -------------------------
# Upload Endpoint
# -------------------------

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    # ⏱️ START THE CLOCK HERE
    start_time = time.time()

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed.",
        )
    
    session_id = str(uuid.uuid4())
    safe_filename = f"{session_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum allowed size is 20MB.",
        )
    
    # Save file locally
    with open(file_path, "wb") as buffer:
        buffer.write(file_bytes)

    try:
        print(f"⏱️ Handoff to background thread: Text Extraction")
        # ⚡ OPTIMIZED: Push heavy CPU parsing to a background thread
        raw_text = await asyncio.to_thread(extract_text_from_pdf, file_path)

        if not raw_text.strip():
            raise HTTPException(
                status_code=422,
                detail="No text could be extracted from this PDF.",
            )

        # ⚡ OPTIMIZED: Push heavy network embeddings to a background thread
        print(f"⏱️ Handoff to background thread: RAG Ingestion")
        chunks_created = await asyncio.to_thread(
            ingest_pdf_text, raw_text, session_id, file.filename, file_path
        )
    except HTTPException:
        raise

    except Exception as e:
        error_msg = str(e)
        # Check if the error is the chunk limit error
        if "too large" in error_msg.lower() or "too big" in error_msg.lower():
            # Explicitly raise a 413 error so the frontend can catch it
            raise HTTPException(status_code=413, detail=error_msg)
        
        # Otherwise, throw a normal 500 error
        raise HTTPException(status_code=500, detail=error_msg)

    finally:
        # ALWAYS delete file
        if os.path.exists(file_path):
            os.remove(file_path)
            print("Temporary PDF deleted:", file_path)
        
    # ⏱️ STOP THE CLOCK RIGHT BEFORE THE RETURN
    end_time = time.time()
    elapsed_time = round(end_time - start_time, 2) # Rounds to 2 decimal places
    print(f"🚀 PDF Processing completed in: {elapsed_time} seconds")

    return {
        "message": "PDF processed successfully",
        "chunks_created": chunks_created,
        "session_id": session_id,
    }


# -------------------------
# Delete Session Endpoint
# -------------------------

@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    delete_session_data(session_id)
    return {"message": "Session deleted successfully"}