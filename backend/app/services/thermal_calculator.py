import math
from typing import Dict, Tuple

class ThermalCalculator:
    """
    Computes green wall thermal performance offsets under steady-state conditions
    according to ASHRAE Handbook of Fundamentals and FAO-56 guidelines.
    """

    @staticmethod
    def calculate_latent_heat_dissipation(
        temperature_c: float,
        humidity: float,
        solar_radiation: float,
        wall_area_m2: float,
        leaf_area_index: float,
        crop_coefficient: float,
        wind_speed_m_s: float = 2.0
    ) -> Tuple[float, float]:
        """
        Estimates reference and crop-specific evapotranspiration (ET) using the
        FAO-56 Penman-Monteith formulation adapted for vertical surfaces.

        Assumptions:
        - Latent heat of vaporization (lambda) = 2.45 MJ/kg.
        - Psychrometric constant (gamma) = 0.066 kPa/°C.
        - Albedo of green wall canopy = 0.23.
        - Net radiation (Rn) estimated as 70% of incident solar radiation.
        - Ground heat flux (G) on vertical concrete backing is negligible (G = 0).
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
        rn = 0.7 * rs_mj  # Net radiation considering absorption and longwave balance
        
        # FAO-56 Penman-Monteith reference ET0 (mm/day)
        # Assuming typical vertical boundary layer aerodynamic resistance setup
        numerator_radiation = 0.408 * delta * rn
        numerator_aerodynamic = 0.066 * (900.0 / (temperature_c + 273.0)) * wind_speed_m_s * vpd
        denominator = delta + 0.066 * (1.0 + 0.34 * wind_speed_m_s)
        
        et0 = max(0.0, (numerator_radiation + numerator_aerodynamic) / denominator)
        
        # Crop-specific transpiration volume (Liters/day = mm * m²)
        transpired_volume_liters = wall_area_m2 * leaf_area_index * crop_coefficient * et0
        
        # Latent cooling energy (kWh/day)
        # 2.45 MJ/L * 0.277778 kWh/MJ = 0.680556 kWh/L
        latent_cooling_kwh = transpired_volume_liters * 2.45 * 0.277778
        
        return transpired_volume_liters, latent_cooling_kwh

    @staticmethod
    def calculate_canopy_shading_reduction(
        solar_radiation: float,
        wall_area_m2: float,
        leaf_area_index: float,
        extinction_coefficient: float,
        wall_absorptivity: float = 0.7
    ) -> float:
        """
        Calculates heat gain reduction from vegetative shading of the facade
        using Beer-Lambert Law of light extinction.

        Assumptions:
        - Bare wall solar absorptivity (alpha) = 0.7 (standard masonry).
        - Canopy light transmission decays exponentially with leaf area index (LAI).
        """
        # Convert solar radiation flux (W/m²) to daily total (kWh/m²/day)
        rs_kwh_m2 = solar_radiation * 0.024
        
        # Total solar energy incident on unshaded bare facade (kWh/day)
        bare_facade_heat_gain_kwh = wall_area_m2 * rs_kwh_m2 * wall_absorptivity
        
        # Transmitted solar fraction
        transmission_fraction = math.exp(-extinction_coefficient * leaf_area_index)
        
        # Thermal load blocked (shading offset in thermal kWh/day)
        shading_offset_thermal_kwh = bare_facade_heat_gain_kwh * (1.0 - transmission_fraction)
        
        return shading_offset_thermal_kwh

    @staticmethod
    def calculate_envelope_insulation_benefit(
        temperature_c: float,
        wall_area_m2: float,
        added_r_value: float,
        indoor_cooling_setpoint: float = 22.0,
        r_value_bare_wall: float = 0.5
    ) -> float:
        """
        Calculates conduction cooling load reduction using 1D steady-state heat transfer.

        Assumptions:
        - Bare concrete facade thermal resistance (R_wall) = 0.5 m²·K/W.
        - Indoor cooling setpoint = 22°C (ASHRAE Standard 55 thermal comfort baseline).
        - Calculation only yields positive offsets when outdoor temperature exceeds setpoint.
        """
        if temperature_c <= indoor_cooling_setpoint:
            return 0.0
            
        u_bare = 1.0 / r_value_bare_wall
        u_green = 1.0 / (r_value_bare_wall + added_r_value)
        
        # Convective heat transfer delta
        u_delta = u_bare - u_green
        temperature_delta = temperature_c - indoor_cooling_setpoint
        
        # Conduction rate offset (Watts)
        heat_flux_reduction_w = wall_area_m2 * u_delta * temperature_delta
        
        # Convert Watts to daily kWh
        insulation_offset_thermal_kwh = heat_flux_reduction_w * 24.0 / 1000.0
        
        return insulation_offset_thermal_kwh

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
        indoor_cooling_setpoint: float = 22.0
    ) -> Dict[str, float]:
        """
        Consolidates thermal offsets and applies system COP to compute electrical utility savings.
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
        shading_kwh = cls.calculate_canopy_shading_reduction(
            solar_radiation=solar_radiation,
            wall_area_m2=wall_area_m2,
            leaf_area_index=leaf_area_index,
            extinction_coefficient=extinction_coefficient
        )
        
        # Insulation calculations
        insulation_kwh = cls.calculate_envelope_insulation_benefit(
            temperature_c=temperature_c,
            wall_area_m2=wall_area_m2,
            added_r_value=added_r_value,
            indoor_cooling_setpoint=indoor_cooling_setpoint
        )
        
        # Total thermal cooling load offset (kWh thermal)
        total_thermal_offset_kwh = latent_kwh + shading_kwh + insulation_kwh
        
        # HVAC system electrical offset (kWh electrical)
        hvac_electrical_offset_kwh = total_thermal_offset_kwh / chiller_cop if chiller_cop > 0 else 0.0
        
        # Daily financial yield
        daily_savings_usd = hvac_electrical_offset_kwh * electricity_rate
        
        return {
            "cooling_offset_thermal_kwh": total_thermal_offset_kwh,
            "hvac_load_reduction_kwh": hvac_electrical_offset_kwh,
            "daily_financial_yield_usd": daily_savings_usd,
            "water_transpiration_liters": water_l,
            "latent_thermal_offset_kwh": latent_kwh,
            "shading_thermal_offset_kwh": shading_kwh,
            "insulation_thermal_offset_kwh": insulation_kwh
        }
