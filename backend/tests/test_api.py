import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app, seed_database_species

from sqlalchemy.pool import StaticPool

# Setup in-memory SQLite database for testing with a StaticPool to persist tables
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Seed default species for test cases
    seed_database_species(db)
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_get_species(client):
    response = client.get("/api/species")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    # Check that common ivy is in the list
    keys = [item["key"] for item in data]
    assert "hedera_helix" in keys

def test_calculate_endpoint(client):
    payload = {
        "wall_area_m2": 150.0,
        "plant_type": "hedera_helix",
        "temperature_c": 30.0,
        "humidity": 50.0,
        "solar_radiation": 500.0,
        "cop": 3.0,
        "electricity_rate": 0.15
    }
    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert "cooling_kwh" in res_data
    assert "cost_saved" in res_data
    assert "co2_saved" in res_data
    assert "details" in res_data
    
    # Financial details check
    details = res_data["details"]
    assert details["water_transpired_liters"] > 0.0
    assert details["daily_savings_usd"] > 0.0

    # Verify that the calculation is stored in the database logs
    history_response = client.get("/api/history")
    assert history_response.status_code == 200
    history_data = history_response.json()
    assert len(history_data) == 1
    assert history_data[0]["wall_area_m2"] == 150.0
    assert "Hedera helix" in history_data[0]["plant_type"]
