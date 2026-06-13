import math
from typing import Dict, Tuple
from app.services.assumption_registry import AssumptionRegistry

class ThermalCalculator:
    """
    Computes green wall thermal performance offsets under steady-state conditions
    according to ASHRAE Handbook of Fundamentals and FAO-56 guidelines.
    Uses centralized constants from the AssumptionRegistry.
    """

    @staticmethod
    def calculate_latent_heat_dissipation(
        temperature_c: float,
        humidity: float,
        solar_radiation: float,
        wall_area_m2: float,
        leaf_area_index: float,
        crop_coefficient: float,
        wind_speed_m_s: float = AssumptionRegistry.WIND_SPEED_DEFAULT
    ) -> Tuple[float, float]:
        """
        Estimates reference and crop-specific evapotranspiration (ET) using the
        FAO-56 Penman-Monteith formulation adapted for vertical surfaces.
        """
        # Saturation vapor pressure (es) in kPa via Tetens equation
        es = 0.61078 * math.exp((17.27 * temperature_c) / (temperature_c + 237.3))
        
        # Actual vapor pressure (ea) in kPa
        ea = es * (max(0.0, min(100.0, humidity)) / 100.0)
        
        # Vapor pressure deficit (VPD) in kPa
        vpd = max(0.0, es - ea)
        
        # Slope of vapor pressure curve (Delta) in kPa/°C
        delta = (4098.0 * es) / ((temperature_c + 237.3) ** 2)
        
        # Convert solar radiation from W/m² (flux) to daily MJ/m²/day (energy)
        rs_mj = solar_radiation * 0.0864
        rn = AssumptionRegistry.NET_RADIATION_FRACTION * rs_mj
        
        # FAO-56 Penman-Monteith reference ET0 (mm/day)
        numerator_radiation = 0.408 * delta * rn
        numerator_aerodynamic = (
            AssumptionRegistry.PSYCHROMETRIC_CONSTANT 
            * (900.0 / (temperature_c + 273.0)) 
            * wind_speed_m_s 
            * vpd
        )
        denominator = delta + AssumptionRegistry.PSYCHROMETRIC_CONSTANT * (1.0 + 0.34 * wind_speed_m_s)
        
        et0 = max(0.0, (numerator_radiation + numerator_aerodynamic) / denominator)
        
        # Crop-specific transpiration volume (Liters/day = mm * m²)
        transpired_volume_liters = wall_area_m2 * leaf_area_index * crop_coefficient * et0
        
        # Latent cooling energy (kWh/day)
        latent_cooling_kwh = (
            transpired_volume_liters 
            * AssumptionRegistry.LATENT_HEAT_VAPORIZATION 
            * 0.277778
        )
        
        return transpired_volume_liters, latent_cooling_kwh

    @staticmethod
    def calculate_canopy_shading_reduction(
        solar_radiation: float,
        wall_area_m2: float,
        leaf_area_index: float,
        extinction_coefficient: float,
        wall_absorptivity: float = AssumptionRegistry.DEFAULT_WALL_ABSORPTIVITY
    ) -> Tuple[float, float, float]:
        """
        Calculates solar heat gains under bare and shaded vegetated scenarios.
        Returns: Tuple[bare_solar_gain_kwh, vegetated_solar_gain_kwh, shading_offset_thermal_kwh]
        """
        # Convert solar radiation flux (W/m²) to daily total (kWh/m²/day)
        rs_kwh_m2 = solar_radiation * 0.024
        
        # Solar energy absorbed by unshaded bare facade (kWh/day)
        bare_solar_gain_kwh = wall_area_m2 * rs_kwh_m2 * wall_absorptivity
        
        # Transmitted solar fraction via Beer-Lambert law
        transmission_fraction = math.exp(-extinction_coefficient * leaf_area_index)
        
        # Solar energy absorbed by shaded facade
        vegetated_solar_gain_kwh = bare_solar_gain_kwh * transmission_fraction
        
        # Blocked thermal load (kWh/day)
        shading_offset_thermal_kwh = bare_solar_gain_kwh - vegetated_solar_gain_kwh
        
        return bare_solar_gain_kwh, vegetated_solar_gain_kwh, shading_offset_thermal_kwh

    @staticmethod
    def calculate_envelope_insulation_benefit(
        temperature_c: float,
        wall_area_m2: float,
        added_r_value: float,
        indoor_cooling_setpoint: float = AssumptionRegistry.DEFAULT_SETPOINT_TEMP,
        r_value_bare_wall: float = AssumptionRegistry.BARE_WALL_R_VALUE
    ) -> Tuple[float, float, float]:
        """
        Calculates conduction heat gains under bare and insulated vegetated scenarios.
        Returns: Tuple[bare_conduction_gain_kwh, vegetated_conduction_gain_kwh, insulation_offset_thermal_kwh]
        """
        if temperature_c <= indoor_cooling_setpoint:
            return 0.0, 0.0, 0.0
            
        u_bare = 1.0 / r_value_bare_wall
        u_green = 1.0 / (r_value_bare_wall + added_r_value)
        temperature_delta = temperature_c - indoor_cooling_setpoint
        
        # Conduction gains (kWh/day)
        bare_conduction_gain_kwh = wall_area_m2 * u_bare * temperature_delta * 24.0 / 1000.0
        vegetated_conduction_gain_kwh = wall_area_m2 * u_green * temperature_delta * 24.0 / 1000.0
        
        # Reduction offset
        insulation_offset_thermal_kwh = bare_conduction_gain_kwh - vegetated_conduction_gain_kwh
        
        return bare_conduction_gain_kwh, vegetated_conduction_gain_kwh, insulation_offset_thermal_kwh

    @classmethod
    def calculate_total_system_savings(
        cls,
        wall_area_m2: float,
        leaf_area_index: float,
        temperature_c: float,
        humidity: float,
        solar_radiation: float,
        crop_coefficient: float,
        extinction_coefficient: float,
        added_r_value: float,
        chiller_cop: float,
        electricity_rate: float,
        indoor_cooling_setpoint: float = AssumptionRegistry.DEFAULT_SETPOINT_TEMP
    ) -> Dict[str, float]:
        """
        Consolidates heat balances and applies chiller COP to compute electrical offsets and error bands.
        """
        # Latent heat calculations
        water_l, latent_kwh = cls.calculate_latent_heat_dissipation(
            temperature_c=temperature_c,
            humidity=humidity,
            solar_radiation=solar_radiation,
            wall_area_m2=wall_area_m2,
            leaf_area_index=leaf_area_index,
            crop_coefficient=crop_coefficient
        )
        
        # Shading calculations
        bare_solar, veg_solar, shading_kwh = cls.calculate_canopy_shading_reduction(
            solar_radiation=solar_radiation,
            wall_area_m2=wall_area_m2,
            leaf_area_index=leaf_area_index,
            extinction_coefficient=extinction_coefficient
        )
        
        # Insulation calculations
        bare_cond, veg_cond, insulation_kwh = cls.calculate_envelope_insulation_benefit(
            temperature_c=temperature_c,
            wall_area_m2=wall_area_m2,
            added_r_value=added_r_value,
            indoor_cooling_setpoint=indoor_cooling_setpoint
        )
        
        # Baseline and Vegetated total heat gains
        baseline_heat_gain = bare_solar + bare_cond
        vegetated_heat_gain = veg_solar + veg_cond - latent_kwh
        
        # Net thermal cooling reduction (kWh thermal/day)
        net_reduction = baseline_heat_gain - vegetated_heat_gain
        
        # HVAC system electrical offset (kWh electrical/day)
        hvac_offset = net_reduction / chiller_cop if chiller_cop > 0 else 0.0
        
        # Daily financial yield
        daily_savings_usd = hvac_offset * electricity_rate
        
        # Confidence Range Bounds (Uncertainty bands)
        err_fraction = AssumptionRegistry.DEFAULT_UNCERTAINTY_BAND_PERCENT / 100.0
        confidence_low = hvac_offset * (1.0 - err_fraction)
        confidence_high = hvac_offset * (1.0 + err_fraction)
        
        return {
            "cooling_offset_thermal_kwh": net_reduction,
            "hvac_load_reduction_kwh": hvac_offset,
            "daily_financial_yield_usd": daily_savings_usd,
            "water_transpiration_liters": water_l,
            "latent_thermal_offset_kwh": latent_kwh,
            "shading_thermal_offset_kwh": shading_kwh,
            "insulation_thermal_offset_kwh": insulation_kwh,
            
            # Baseline vs Vegetated detailed results
            "baseline_heat_gain": baseline_heat_gain,
            "vegetated_heat_gain": vegetated_heat_gain,
            "net_reduction": net_reduction,
            "hvac_offset": hvac_offset,
            
            # Error bands
            "confidence_range_low": confidence_low,
            "confidence_range_high": confidence_high
        }
