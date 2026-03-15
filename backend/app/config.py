import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Fetch environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()
HUGGINGFACEHUB_API_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN", "").strip()
GROQ_API_KEY = os.getenv("GROQ_API_KEY","").strip()

# Validate required variables
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials are missing. Check your .env file.")

if not HUGGINGFACEHUB_API_TOKEN:
    raise ValueError("HuggingFace API token is missing. Check your .env file.")

if not GROQ_API_KEY:
    raise ValueError("Groq API key is missing. Check your .env file.")