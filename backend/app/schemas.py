from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict

class CalculateRequest(BaseModel):
    wall_area_m2: float = Field(..., gt=0.0, description="Surface area of the green wall in square meters.")
    plant_type: str = Field(..., description="Key of the selected plant species.")
    temperature_c: float = Field(..., description="Ambient temperature in degrees Celsius.")
    humidity: float = Field(..., ge=0.0, le=100.0, description="Relative humidity in percentage.")
    solar_radiation: float = Field(..., ge=0.0, description="Solar radiation in W/m².")
    cop: Optional[float] = Field(3.0, gt=0.0, description="HVAC Coefficient of Performance.")
    electricity_rate: Optional[float] = Field(0.15, ge=0.0, description="Cost of electricity in $/kWh.")
    facade_orientation: Optional[str] = Field("south", description="Facade orientation: south, north, east, or west.")
    regulatory_framework: Optional[str] = Field("none", description="Regulatory frameworks: none, nyc_ll97, boston_berdo, standard_tax.")
    is_premium_unlock: Optional[int] = Field(0, description="1 if premium metrics should be unlocked, else 0.")

class FinancialDetails(BaseModel):
    water_transpired_liters: float
    latent_cooling_kwh: float
    shading_savings_kwh: float
    insulation_savings_kwh: float
    daily_savings_usd: float
    monthly_savings_usd: float
    annual_savings_usd: float
    annual_co2_reduction_kg: float

class CalculateResponse(BaseModel):
    cooling_kwh: float = Field(..., description="Daily electrical energy saved in kWh/day.")
    cost_saved: float = Field(..., description="Daily monetary savings in dollars/day.")
    co2_saved: float = Field(..., description="Daily CO2 reduction in kg/day.")
    details: FinancialDetails
    
    # Audit & Comparison fields
    baseline_heat_gain: float
    vegetated_heat_gain: float
    net_reduction: float
    hvac_offset: float
    
    # Error bands / Confidence bounds
    confidence_range_low: float
    confidence_range_high: float
    
    # Provenance metadata
    package_id: Optional[str] = None
    equation_version: Optional[str] = None
    species_dataset_version: Optional[str] = None
    financial_model_version: Optional[str] = None
    weather_assumption_version: Optional[str] = None
    generated_at: Optional[str] = None
    
    # Enhanced attributes
    facade_orientation: Optional[str] = None
    regulatory_framework: Optional[str] = None
    avoided_carbon_fine: Optional[float] = None
    water_cost_usd: Optional[float] = None
    is_premium_unlock: int = 0

class SpeciesBase(BaseModel):
    key: str
    scientific_name: str
    common_name: str
    transpiration_rate_coeff: float
    shading_extinction_coeff: float
    added_r_value: float
    source_papers: Optional[str] = None

class SpeciesResponse(SpeciesBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class HistoryResponse(BaseModel):
    id: int
    wall_area_m2: float
    plant_type: str
    temperature_c: float
    humidity: float
    solar_radiation: float
    cooling_kwh: float
    cost_saved: float
    co2_saved: float
    
    # Audit & Comparison fields
    baseline_heat_gain: Optional[float] = None
    vegetated_heat_gain: Optional[float] = None
    net_reduction: Optional[float] = None
    hvac_offset: Optional[float] = None
    
    # Provenance details
    package_id: Optional[str] = None
    equation_version: Optional[str] = None
    species_dataset_version: Optional[str] = None
    financial_model_version: Optional[str] = None
    weather_assumption_version: Optional[str] = None
    
    # Enhanced attributes
    facade_orientation: Optional[str] = None
    regulatory_framework: Optional[str] = None
    avoided_carbon_fine: Optional[float] = None
    water_cost_usd: Optional[float] = None
    is_premium_unlock: Optional[int] = None
    
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
