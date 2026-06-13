import pytest
from app.calculation import (
    calculate_evapotranspiration,
    calculate_shading_benefit,
    calculate_wall_insulation,
    calculate_total_cooling,
    calculate_cost_savings
)

def test_warm_sunny_day():
    # Setup standard input parameters for a hot, sunny day
    temperature = 32.0   # °C
    humidity = 45.0      # %
    solar_rad = 700.0    # W/m²
    area = 200.0         # m²
    lai = 3.5            # Leaf Area Index
    plant_kc = 0.85      # Ivy-like plant coefficient
    ext_coeff = 0.6      # Shading coefficient
    r_added = 0.45       # R-value m²K/W
    cop = 3.0
    elec_rate = 0.15     # $/kWh

    # 1. Test evapotranspiration
    water_l, latent_kwh = calculate_evapotranspiration(
        temperature, humidity, solar_rad, area, lai, plant_kc
    )
    assert water_l > 0.0
    assert latent_kwh > 0.0
    
    # 2. Test shading
    shading_kwh = calculate_shading_benefit(
        solar_rad, area, lai, ext_coeff
    )
    assert shading_kwh > 0.0

    # 3. Test wall insulation
    insulation_kwh = calculate_wall_insulation(
        temperature, area, r_added
    )
    assert insulation_kwh > 0.0

    # 4. Test total HVAC savings
    electrical_savings = calculate_total_cooling(
        latent_kwh, shading_kwh, insulation_kwh, cop
    )
    assert electrical_savings == (latent_kwh + shading_kwh + insulation_kwh) / cop

    # 5. Test financial model
    financials = calculate_cost_savings(electrical_savings, elec_rate)
    assert financials["daily_savings_usd"] == electrical_savings * elec_rate
    assert financials["monthly_savings_usd"] == financials["daily_savings_usd"] * 30.4375
    assert financials["annual_savings_usd"] == financials["daily_savings_usd"] * 365.0
    assert financials["annual_co2_reduction_kg"] == electrical_savings * 365.0 * 0.38


def test_cool_overcast_day():
    # Setup cool day below indoor setpoint (22°C)
    temperature = 18.0   # °C
    humidity = 80.0      # %
    solar_rad = 80.0     # W/m²
    area = 100.0         # m²
    lai = 2.0
    plant_kc = 0.5
    r_added = 0.45

    # Conduction should be 0 since Tout (18) <= Tin (22)
    insulation_kwh = calculate_wall_insulation(
        temperature, area, r_added
    )
    assert insulation_kwh == 0.0

    # Water transpired should be very low due to low radiation and low temperature
    water_l, latent_kwh = calculate_evapotranspiration(
        temperature, humidity, solar_rad, area, lai, plant_kc
    )
    assert water_l >= 0.0


def test_zero_area():
    # Setup calculations for wall area = 0
    water_l, latent_kwh = calculate_evapotranspiration(30.0, 50.0, 500.0, 0.0, 3.0, 0.8)
    shading_kwh = calculate_shading_benefit(500.0, 0.0, 3.0, 0.6)
    insulation_kwh = calculate_wall_insulation(30.0, 0.0, 0.4)

    assert water_l == 0.0
    assert latent_kwh == 0.0
    assert shading_kwh == 0.0
    assert insulation_kwh == 0.0
