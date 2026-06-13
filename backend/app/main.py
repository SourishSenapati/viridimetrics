import logging
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app.database import engine, Base, get_db
from app.models import Species, CalculationLog, IngestionAuditLog
from app.schemas import CalculateRequest, CalculateResponse, SpeciesResponse, HistoryResponse, FinancialDetails

# Import revised services
from app.services.thermal_calculator import ThermalCalculator
from app.services.horticultural_reference import HorticulturalReference, HorticulturalProfile
from app.services.simulation_scenarios import SimulationScenarios, ScenarioComparisonRequest, ComparisonResult
from app.services.financial_yield_calculator import FinancialYieldCalculator, FinancialAnalyzerRequest, FinancialAnalyzerResponse
from app.services.building_data_importer import BuildingDataImporter
from app.services.environmental_conditions_manager import EnvironmentalConditionsManager, EnvironmentalBaselines
from app.services.report_generator import ReportGenerator, ReportRequest

# Setup logger
logger = logging.getLogger("viridimetrics.main")
logging.basicConfig(level=logging.INFO)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Viridimetrics Commercial SaaS API",
    description="Institutional-grade cooling analytics suite for vertical green walls.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed database botanical constants on startup
def seed_database_species(db: Session):
    if db.query(Species).count() > 0:
        logger.info("Database already seeded with species.")
        return

    logger.info("Seeding plant species database with reference coefficients...")
    default_species = [
        Species(
            key="hedera_helix",
            scientific_name="Hedera helix",
            common_name="Common Ivy",
            transpiration_rate_coeff=0.8,
            shading_extinction_coeff=0.6,
            added_r_value=0.45,
            source_papers="Dzierżanowski et al. (2011), Przybysz et al. (2014)"
        ),
        Species(
            key="ficus_religiosa",
            scientific_name="Ficus religiosa",
            common_name="Sacred Fig / Peepal",
            transpiration_rate_coeff=1.2,
            shading_extinction_coeff=0.7,
            added_r_value=0.50,
            source_papers="Munam et al. (2025), Chaturvedi et al. (2013)"
        ),
        Species(
            key="alstonia_scholaris",
            scientific_name="Alstonia scholaris",
            common_name="Devil Tree",
            transpiration_rate_coeff=0.9,
            shading_extinction_coeff=0.65,
            added_r_value=0.45,
            source_papers="Munam et al. (2025), Chaturvedi et al. (2013)"
        ),
        Species(
            key="pinus_sylvestris",
            scientific_name="Pinus sylvestris",
            common_name="Scots Pine",
            transpiration_rate_coeff=0.5,
            shading_extinction_coeff=0.5,
            added_r_value=0.40,
            source_papers="Sæbø et al. (2012), Przybysz et al. (2014)"
        ),
        Species(
            key="betula_pendula",
            scientific_name="Betula pendula",
            common_name="Silver Birch",
            transpiration_rate_coeff=1.0,
            shading_extinction_coeff=0.6,
            added_r_value=0.45,
            source_papers="Sæbø et al. (2012)"
        )
    ]
    
    db.add_all(default_species)
    db.commit()
    logger.info("Successfully seeded database.")

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    try:
        seed_database_species(db)
    except Exception as e:
        logger.error(f"Error seeding database on startup: {e}")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "Viridimetrics Commercial SaaS Backend",
        "docs_url": "/docs"
    }

# 1. Thermal Calculator & Calculation Logs
@app.get("/api/species", response_model=List[SpeciesResponse])
def get_species_list(db: Session = Depends(get_db)):
    return db.query(Species).all()

@app.get("/api/history", response_model=List[HistoryResponse])
def get_calculation_history(db: Session = Depends(get_db)):
    return db.query(CalculationLog).order_by(CalculationLog.created_at.desc()).limit(50).all()

@app.post("/api/calculate", response_model=CalculateResponse)
def calculate_hvac_offset(req: CalculateRequest, db: Session = Depends(get_db)):
    """
    Solves deterministic Penman-Monteith, Beer-Lambert, and steady-state 1D heat equations.
    """
    species = HorticulturalReference.get_profile_by_key(db, req.plant_type)
    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plant species '{req.plant_type}' is not registered."
        )

    cop_val = req.cop if req.cop is not None else 3.0
    rate_val = req.electricity_rate if req.electricity_rate is not None else 0.15

    # Invoke ThermalCalculator service
    results = ThermalCalculator.calculate_total_system_savings(
        wall_area_m2=req.wall_area_m2,
        leaf_area_index=3.0,
        temperature_c=req.temperature_c,
        humidity=req.humidity,
        solar_radiation=req.solar_radiation,
        crop_coefficient=float(species.transpiration_rate_coeff),
        extinction_coefficient=float(species.shading_extinction_coeff),
        added_r_value=float(species.added_r_value),
        chiller_cop=cop_val,
        electricity_rate=rate_val
    )

    # Convert annual details
    financials = FinancialYieldCalculator.analyze_yield(FinancialAnalyzerRequest(
        installation_cost_usd_per_m2=450.00,  # Seed baseline assumptions
        annual_maintenance_usd_per_m2=25.00,
        wall_area_m2=req.wall_area_m2,
        daily_electricity_savings_kwh=results["hvac_load_reduction_kwh"],
        electricity_rate_usd_kwh=rate_val,
        discount_rate_percent=8.0,
        project_lifetime_years=15
    ))

    # Log calculations to database
    log_entry = CalculationLog(
        wall_area_m2=req.wall_area_m2,
        plant_type=species.scientific_name,
        temperature_c=req.temperature_c,
        humidity=req.humidity,
        solar_radiation=req.solar_radiation,
        cooling_kwh=round(results["hvac_load_reduction_kwh"], 2),
        cost_saved=round(results["daily_financial_yield_usd"], 2),
        co2_saved=round(results["hvac_load_reduction_kwh"] * 0.38, 2)
    )
    
    try:
        db.add(log_entry)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log calculation: {e}")
        db.rollback()

    annual_co2_kg = round(results["hvac_load_reduction_kwh"] * 365.0 * 0.38, 2)

    return CalculateResponse(
        cooling_kwh=round(results["hvac_load_reduction_kwh"], 2),
        cost_saved=round(results["daily_financial_yield_usd"], 2),
        co2_saved=round(results["hvac_load_reduction_kwh"] * 0.38, 2),
        details=FinancialDetails(
            water_transpired_liters=round(results["water_transpiration_liters"], 2),
            latent_cooling_kwh=round(results["latent_thermal_offset_kwh"], 2),
            shading_savings_kwh=round(results["shading_thermal_offset_kwh"], 2),
            insulation_savings_kwh=round(results["insulation_thermal_offset_kwh"], 2),
            daily_savings_usd=round(results["daily_financial_yield_usd"], 2),
            monthly_savings_usd=round(financials.annual_utility_savings_usd / 12, 2),
            annual_savings_usd=round(financials.annual_utility_savings_usd, 2),
            annual_co2_reduction_kg=annual_co2_kg
        )
    )

# 2. Plant Library Creation
@app.post("/api/species/create", response_model=SpeciesResponse)
def add_new_botanical_profile(profile: HorticulturalProfile, db: Session = Depends(get_db)):
    existing = HorticulturalReference.get_profile_by_key(db, profile.key)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Botanical profile with key '{profile.key}' already exists."
        )
    return HorticulturalReference.create_profile(db, profile)

# 3. Simulation Lab Scenario Comparison
@app.post("/api/scenarios/compare", response_model=ComparisonResult)
def compare_layouts_scenarios(req: ScenarioComparisonRequest, db: Session = Depends(get_db)):
    return SimulationScenarios.run_comparison(db, req)

# 4. Cost Estimator & ROI Analyzer
@app.post("/api/financial/analyze", response_model=FinancialAnalyzerResponse)
def analyze_investment_financials(req: FinancialAnalyzerRequest):
    return FinancialYieldCalculator.analyze_yield(req)

# 5. Building Data Import
@app.post("/api/ingest")
async def ingest_utility_meter_data(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type is not supported. Please upload CSV formats only."
        )
    
    contents = await file.read()
    csv_text = contents.decode("utf-8")
    
    results = BuildingDataImporter.parse_utility_csv_stream(db, csv_text, file.filename)
    return results

# 6. Environmental Conditions Explorer (Sensors Audit warnings)
@app.post("/api/conditions/validate")
def audit_meteorological_limits(req: EnvironmentalBaselines):
    return EnvironmentalConditionsManager.validate_conditions(req)

# 7. Executive Report Generator
@app.post("/api/reports/generate")
def compile_institutional_report(req: ReportRequest):
    return ReportGenerator.generate_report(req)

@app.post("/api/seed")
def force_seed_database(db: Session = Depends(get_db)):
    seed_database_species(db)
    return {"message": "Database seeded."}
