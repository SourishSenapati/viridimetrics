from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.services.thermal_calculator import ThermalCalculator
from app.services.horticultural_reference import HorticulturalReference

class ScenarioConfig(BaseModel):
    name: str = Field(..., description="User label, e.g. 'Option A: 50m² Ivy'.")
    wall_area_m2: float = Field(..., gt=0.0)
    plant_type: str = Field(..., description="Species reference key.")
    leaf_area_index: float = Field(3.0, ge=0.5, le=10.0)
    chiller_cop: float = Field(3.0, gt=0.0)
    electricity_rate: float = Field(0.15, ge=0.0)

class ScenarioComparisonRequest(BaseModel):
    # Common outdoor meteorological parameters for comparison
    temperature_c: float = Field(..., description="Ambient temperature.")
    humidity: float = Field(..., ge=0.0, le=100.0)
    solar_radiation: float = Field(..., ge=0.0)
    
    scenarios: List[ScenarioConfig] = Field(..., min_items=2, max_items=5)

class ScenarioMetric(BaseModel):
    name: str
    wall_area_m2: float
    plant_type: str
    cooling_offset_thermal_kwh: float
    hvac_load_reduction_kwh: float
    daily_savings_usd: float
    water_transpiration_liters: float

class ComparisonResult(BaseModel):
    scenario_metrics: List[ScenarioMetric]
    delta_hvac_kwh: float
    delta_savings_usd: float
    optimal_scenario_name: str

class SimulationScenarios:
    """
    Simulation Lab scenario comparison engine.
    Computes thermodynamic delta offsets across competing building configurations.
    """
    @staticmethod
    def run_comparison(db: Session, req: ScenarioComparisonRequest) -> ComparisonResult:
        metrics: List[ScenarioMetric] = []
        
        for config in req.scenarios:
            # Load species data
            species = HorticulturalReference.get_profile_by_key(db, config.plant_type)
            if not species:
                # Fallback constants if not found in db
                crop_coef = 0.8
                ext_coef = 0.6
                r_val = 0.45
            else:
                crop_coef = species.transpiration_rate_coeff
                ext_coef = species.shading_extinction_coeff
                r_val = species.added_r_value

            # Calculate metrics
            results = ThermalCalculator.calculate_total_system_savings(
                wall_area_m2=config.wall_area_m2,
                leaf_area_index=config.leaf_area_index,
                temperature_c=req.temperature_c,
                humidity=req.humidity,
                solar_radiation=req.solar_radiation,
                crop_coefficient=crop_coef,
                extinction_coefficient=ext_coef,
                added_r_value=r_val,
                chiller_cop=config.chiller_cop,
                electricity_rate=config.electricity_rate
            )
            
            metrics.append(ScenarioMetric(
                name=config.name,
                wall_area_m2=config.wall_area_m2,
                plant_type=config.plant_type,
                cooling_offset_thermal_kwh=round(results["cooling_offset_thermal_kwh"], 2),
                hvac_load_reduction_kwh=round(results["hvac_load_reduction_kwh"], 2),
                daily_savings_usd=round(results["daily_financial_yield_usd"], 2),
                water_transpiration_liters=round(results["water_transpiration_liters"], 2)
            ))

        # Sort by daily savings to find the optimal yield
        sorted_metrics = sorted(metrics, key=lambda m: m.daily_savings_usd, reverse=True)
        optimal_name = sorted_metrics[0].name
        
        # Calculate deltas between the highest yielding and lowest yielding scenarios
        delta_kwh = sorted_metrics[0].hvac_load_reduction_kwh - sorted_metrics[-1].hvac_load_reduction_kwh
        delta_savings = sorted_metrics[0].daily_savings_usd - sorted_metrics[-1].daily_savings_usd

        return ComparisonResult(
            scenario_metrics=metrics,
            delta_hvac_kwh=round(delta_kwh, 2),
            delta_savings_usd=round(delta_savings, 2),
            optimal_scenario_name=optimal_name
        )
