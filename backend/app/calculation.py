import math
from typing import Dict, Tuple

def calculate_evapotranspiration(
    temperature_c: float,
    humidity: float,
    solar_radiation: float,
    wall_area_m2: float,
    leaf_area_index: float,
    plant_coeff: float
) -> Tuple[float, float]:
    """
    Estimates the daily volume of water transpired by the green wall and the
    resulting latent cooling effect using a simplified Penman-Monteith model.

    Inputs:
    - temperature_c: Ambient temperature in degrees Celsius (T)
    - humidity: Relative humidity in percent (RH, 0 to 100)
    - solar_radiation: Average daily solar radiation in W/m² (Rs)
    - wall_area_m2: Green wall surface area (Area)
    - leaf_area_index: Canopy Leaf Area Index (LAI)
    - plant_coeff: Crop/Plant coefficient (Kc), represents stomatal resistance scaling

    Outputs:
    - (water_transpired_liters_day, latent_cooling_kwh_day)
    """
    # 1. Saturation vapor pressure (es) in kPa using Tetens equation
    es = 0.61078 * math.exp((17.27 * temperature_c) / (temperature_c + 237.3))
    
    # 2. Actual vapor pressure (ea) in kPa
    ea = es * (max(0.0, min(100.0, humidity)) / 100.0)
    
    # 3. Vapor Pressure Deficit (VPD) in kPa
    vpd = max(0.0, es - ea)
    
    # 4. Slope of the saturation vapor pressure curve (Delta) in kPa/°C
    delta = (4098.0 * es) / ((temperature_c + 237.3) ** 2)
    
    # 5. Psychrometric constant (gamma) in kPa/°C
    gamma = 0.066
    
    # 6. Convert solar radiation from average W/m² to daily total MJ/m²/day
    # Rs (W/m²) * 24 hours * 3600 seconds * 10^-6 = Rs * 0.0864 MJ/m²/day
    rs_mj = solar_radiation * 0.0864
    
    # Estimate net radiation (Rn) as 70% of solar radiation
    rn = 0.7 * rs_mj
    
    # 7. Simplified Penman-Monteith reference ET0 (mm/day)
    # Assuming standard wind speed of 2.0 m/s at 2m height:
    # ET0 = (0.408 * Delta * Rn + gamma * (900 / (T + 273)) * u * VPD) / (Delta + gamma * (1 + 0.34 * u))
    # With u = 2.0:
    # ET0 = (0.408 * Delta * Rn + gamma * (1800 / (T + 273)) * VPD) / (Delta + 1.68 * gamma)
    u_wind = 2.0
    numerator_radiation = 0.408 * delta * rn
    numerator_aerodynamic = gamma * (900.0 / (temperature_c + 273.0)) * u_wind * vpd
    denominator = delta + gamma * (1.0 + 0.34 * u_wind)
    
    et0 = max(0.0, (numerator_radiation + numerator_aerodynamic) / denominator)
    
    # 8. Transpiration volume (Liters/day) = Area * LAI * Kc * ET0
    # Note: 1 mm depth is equivalent to 1 Liter/m²
    transpired_volume = wall_area_m2 * leaf_area_index * plant_coeff * et0
    
    # 9. Latent cooling energy (kWh/day)
    # Latent heat of vaporization lambda = 2.45 MJ/L
    # 1 MJ = 0.277778 kWh
    latent_heat_mj = transpired_volume * 2.45
    latent_cooling_kwh = latent_heat_mj * 0.277778
    
    return transpired_volume, latent_cooling_kwh

def calculate_shading_benefit(
    solar_radiation: float,
    wall_area_m2: float,
    leaf_area_index: float,
    shading_extinction_coeff: float
) -> float:
    """
    Calculates the solar shading cooling load offset in kWh/day.
    Shading reduces solar radiation transmitted to the masonry wall.

    Inputs:
    - solar_radiation: Average daily solar radiation in W/m² (Rs)
    - wall_area_m2: Green wall surface area (Area)
    - leaf_area_index: Leaf Area Index (LAI)
    - shading_extinction_coeff: Canopy light extinction coefficient (k_ext)

    Outputs:
    - shading_cooling_offset_kwh_day (thermal)
    """
    # Convert Rs from W/m² to daily kWh/m²/day
    # Rs * 24 hours * 10^-3 kW/W = Rs * 0.024 kWh/m²/day
    solar_kwh_m2_day = solar_radiation * 0.024
    
    # Base solar load incident on bare wall (assume bare wall solar absorptivity alpha = 0.7)
    alpha_wall = 0.7
    bare_solar_load = wall_area_m2 * solar_kwh_m2_day * alpha_wall
    
    # Transmission fraction through canopy (Beer-Lambert Law)
    transmission = math.exp(-shading_extinction_coeff * leaf_area_index)
    
    # Thermal energy blocked (shading benefit)
    shading_thermal_offset = bare_solar_load * (1.0 - transmission)
    
    return shading_thermal_offset

def calculate_wall_insulation(
    temperature_c: float,
    wall_area_m2: float,
    added_r_value: float
) -> float:
    """
    Calculates the wall insulation cooling load offset in kWh/day.
    Uses 1D steady-state conduction. Assumes indoor temperature of 22°C.

    Inputs:
    - temperature_c: Outdoor ambient temperature in °C
    - wall_area_m2: Green wall surface area
    - added_r_value: Added thermal resistance (R-value) in m²·K/W

    Outputs:
    - insulation_cooling_offset_kwh_day (thermal)
    """
    t_indoor = 22.0
    if temperature_c <= t_indoor:
        return 0.0
    
    # Base wall thermal resistance (R_wall) in m²·K/W (assume standard brick/concrete wall)
    r_wall_bare = 0.5
    u_bare = 1.0 / r_wall_bare
    
    # Green wall insulated resistance
    u_green = 1.0 / (r_wall_bare + added_r_value)
    
    # Heat transfer rate difference (W) = Area * (U_bare - U_green) * (T_out - T_in)
    u_diff = u_bare - u_green
    t_diff = temperature_c - t_indoor
    heat_transfer_diff_w = wall_area_m2 * u_diff * t_diff
    
    # Convert Watts to daily kWh
    insulation_thermal_offset = heat_transfer_diff_w * 24.0 / 1000.0
    
    return insulation_thermal_offset

def calculate_total_cooling(
    latent_kwh: float,
    shading_kwh: float,
    insulation_kwh: float,
    cop: float
) -> float:
    """
    Combines the latent, shading, and insulation thermal offsets and divides
    by the HVAC system COP to yield the actual electrical energy saved.

    Inputs:
    - latent_kwh: Latent heat offset (thermal kWh/day)
    - shading_kwh: Shading offset (thermal kWh/day)
    - insulation_kwh: Insulation offset (thermal kWh/day)
    - cop: HVAC Coefficient of Performance (COP)

    Outputs:
    - electrical_savings_kwh_day
    """
    total_thermal_offset = latent_kwh + shading_kwh + insulation_kwh
    if cop <= 0.0:
        return 0.0
    return total_thermal_offset / cop

def calculate_cost_savings(
    electrical_savings_kwh: float,
    electricity_rate: float
) -> Dict[str, float]:
    """
    Converts daily electrical savings into daily, monthly, and annual monetary
    savings, along with annual carbon emissions reductions.

    Inputs:
    - electrical_savings_kwh: Saved electricity in kWh/day
    - electricity_rate: Rate in $/kWh (e.g. 0.15)

    Outputs:
    - Dict containing:
      - 'daily_savings_usd'
      - 'monthly_savings_usd'
      - 'annual_savings_usd'
      - 'annual_co2_reduction_kg'
    """
    daily_savings = electrical_savings_kwh * electricity_rate
    
    # 30.4375 is the average number of days in a month (365 / 12)
    monthly_savings = daily_savings * 30.4375
    annual_savings = daily_savings * 365.0
    
    # US EPA standard grid emission factor: 0.38 kg CO2 / kWh
    annual_co2_reduction = electrical_savings_kwh * 365.0 * 0.38
    
    return {
        "daily_savings_usd": daily_savings,
        "monthly_savings_usd": monthly_savings,
        "annual_savings_usd": annual_savings,
        "annual_co2_reduction_kg": annual_co2_reduction
    }
