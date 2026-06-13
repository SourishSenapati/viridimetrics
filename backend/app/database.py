import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("viridimetrics.database")

# Read database URL from environment variable, default to SQLite fallback
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./viridimetrics.db")

# If PostgreSQL, make sure it is psycopg2 compatible
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

logger.info(f"Connecting to database: {DATABASE_URL}")

# Setup database engine
# SQLite requires 'check_same_thread=False'
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
