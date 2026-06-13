import sys
import os

# 1. Map SQLite DB to /tmp on Vercel to bypass read-only filesystem errors
if os.getenv("VERCEL") and not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:////tmp/viridimetrics.db"

# 2. Inject backend directory to PYTHONPATH
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(base_dir, "backend")
sys.path.insert(0, backend_dir)

# 3. Expose FastAPI app instance
from app.main import app
