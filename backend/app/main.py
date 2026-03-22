from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="QnA Doc API",
    description="RAG-based PDF Question Answering system using Supabase and Groq",
    version="1.0.0"
)

# Allow frontend applications to call this AP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes
app.include_router(router)

# Health check endpoint
@app.get("/")
def health_check():
    return {"status": "running"}