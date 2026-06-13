from typing import Dict
from pydantic import BaseModel, Field

class EnvironmentalBaselines(BaseModel):
    # Temperature constraints (ASHRAE extreme weather indices)
    dry_bulb_temperature_c: float = Field(..., ge=-20.0, le=55.0, description="Ambient Dry Bulb Temperature.")
    relative_humidity_percent: float = Field(..., ge=5.0, le=100.0, description="Relative humidity ratio.")
    solar_irradiance_w_m2: float = Field(..., ge=0.0, le=1200.0, description="Global Horizontal Irradiance.")

class EnvironmentalConditionsManager:
    """
    Manages and audits user-supplied meteorological datasets.
    In the MVP, this acts as the database-independent configuration validator,
    obviating the need for fragile IoT hardware bindings while preserving ASHRAE mathematical fidelity.
    """
    
    @staticmethod
    def validate_conditions(data: EnvironmentalBaselines) -> Dict[str, any]:
        """
        Validates conditions against psychrometric envelope limits.
        For example: Extreme solar radiation above 1100 W/m² triggers a high-load solar warning.
        """
        warnings = []
        
        # Check for non-condensing climate limits
        if data.dry_bulb_temperature_c > 45.0:
            warnings.append("High dry-bulb temperature exceeds standard ASHRAE design parameters.")
        if data.relative_humidity_percent > 90.0 and data.dry_bulb_temperature_c > 35.0:
            warnings.append("High humidity and heat index restricts stomatal transpiration rate due to low VPD.")
        if data.solar_irradiance_w_m2 > 1000.0:
            warnings.append("Extreme solar irradiance detected. Facade thermal stress exceeds normal limits.")

        return {
            "valid": True,
            "warnings": warnings,
            "validated_data": data.dict()
        }
