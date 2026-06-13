class AssumptionRegistry:
    """
    Centralized repository of building science assumptions, thermal constants,
    and methodology references for PE auditability.
    """
    # Thermodynamic Constants
    ASHRAE_DEFAULT_COP = 3.0
    DEFAULT_SETPOINT_TEMP = 22.0           # Indoor setpoint in °C (ASHRAE Standard 55)
    DEFAULT_WALL_ABSORPTIVITY = 0.7        # Bare wall solar absorption coefficient
    LATENT_HEAT_VAPORIZATION = 2.45        # lambda parameter in MJ/kg
    PSYCHROMETRIC_CONSTANT = 0.066         # gamma parameter in kPa/°C
    GREEN_WALL_ALBEDO = 0.23               # Canopy albedo ratio
    NET_RADIATION_FRACTION = 0.7           # Rn ratio of incoming solar radiation
    BARE_WALL_R_VALUE = 0.5                # Concrete R-value in m²·K/W
    WIND_SPEED_DEFAULT = 2.0               # Standard wind speed velocity in m/s
    CO2_EMISSION_FACTOR = 0.38             # kg CO2 saved per electrical kWh offset

    # Confidence Error Bands
    DEFAULT_UNCERTAINTY_BAND_PERCENT = 7.5 # +/- 7.5% expected value confidence bounds

    # Version Tracking for Calculations Provenance
    METHODOLOGY_VERSION = "v1.2"
    SPECIES_DATASET_VERSION = "v0.3"
    FINANCIAL_MODEL_VERSION = "v1.0"
    WEATHER_ASSUMPTION_VERSION = "v1.0"

    # Reference Citations
    FAO_56_REFERENCE = "Allen et al. (1998) FAO Irrigation and Drainage Paper No. 56"
    ASHRAE_REFERENCE = "ASHRAE Handbook of Fundamentals (2025) Chapter 18 (Heat Balance Method)"
