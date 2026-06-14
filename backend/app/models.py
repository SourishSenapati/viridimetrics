from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base

class Species(Base):
    __tablename__ = "species"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    scientific_name = Column(String, nullable=False)
    common_name = Column(String, nullable=False)
    transpiration_rate_coeff = Column(Float, nullable=False)  # Kc coefficient
    shading_extinction_coeff = Column(Float, nullable=False)  # k_ext coefficient
    added_r_value = Column(Float, nullable=False)             # Added R-value (m²K/W)
    source_papers = Column(String, nullable=True)             # Comma-separated list of papers

class CalculationLog(Base):
    __tablename__ = "calculation_logs"

    id = Column(Integer, primary_key=True, index=True)
    wall_area_m2 = Column(Float, nullable=False)
    plant_type = Column(String, nullable=False)
    temperature_c = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    solar_radiation = Column(Float, nullable=False)
    cooling_kwh = Column(Float, nullable=False)
    cost_saved = Column(Float, nullable=False)
    co2_saved = Column(Float, nullable=False)
    
    # Heat Balance Audit Fields
    baseline_heat_gain = Column(Float, nullable=True)
    vegetated_heat_gain = Column(Float, nullable=True)
    net_reduction = Column(Float, nullable=True)
    hvac_offset = Column(Float, nullable=True)
    
    # Calculation Provenance Fields
    package_id = Column(String, nullable=True)
    equation_version = Column(String, nullable=True)
    species_dataset_version = Column(String, nullable=True)
    financial_model_version = Column(String, nullable=True)
    weather_assumption_version = Column(String, nullable=True)
    
    # Enhanced Pilot & Compliance Fields
    facade_orientation = Column(String, nullable=True)
    regulatory_framework = Column(String, nullable=True)
    avoided_carbon_fine = Column(Float, nullable=True)
    water_cost_usd = Column(Float, nullable=True)
    is_premium_unlock = Column(Integer, default=0, nullable=False) # 0 = Standard, 1 = Premium Unlocked
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

class IngestionAuditLog(Base):
    __tablename__ = "ingestion_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    status = Column(String, nullable=False)
    rows_imported = Column(Integer, nullable=False)
    error_count = Column(Integer, nullable=False)
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
