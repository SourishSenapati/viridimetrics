import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models import CalculationLog
from app.services.financial_yield_calculator import FinancialYieldCalculator, FinancialAnalyzerRequest
from app.services.simulation_scenarios import SimulationScenarios, ScenarioComparisonRequest, ScenarioConfig
from app.services.building_data_importer import BuildingDataImporter
from app.services.report_generator import ReportGenerator, ReportRequest

# Setup test DB session
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    # Create tables
    # Force registration of IngestionAuditLog by ensuring models are loaded
    from app.models import IngestionAuditLog
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create dynamic audit table if not created automatically
    from sqlalchemy import text
    db.execute(text(
        "CREATE TABLE IF NOT EXISTS ingestion_audit_logs ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "filename VARCHAR(255) NOT NULL,"
        "status VARCHAR(50) NOT NULL,"
        "rows_imported INTEGER NOT NULL,"
        "error_count INTEGER NOT NULL,"
        "details TEXT,"
        "timestamp DATETIME NOT NULL"
        ")"
    ))
    db.commit()
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_financial_yield_positive_roi():
    # Capital cost = $200/m2, maintenance = $5/m2, area = 100m2
    # Daily savings = 50 kWh/day, rate = $0.20/kWh
    # CapEx = $20,000, OpEx = $500, Savings = 50 * 365 * 0.20 = $3,650
    # Net annual cash flow = $3,150
    req = FinancialAnalyzerRequest(
        installation_cost_usd_per_m2=200.0,
        annual_maintenance_usd_per_m2=5.0,
        wall_area_m2=100.0,
        daily_electricity_savings_kwh=50.0,
        electricity_rate_usd_kwh=0.20,
        discount_rate_percent=6.0,
        project_lifetime_years=10
    )
    
    res = FinancialYieldCalculator.analyze_yield(req)
    assert res.initial_capital_expense_usd == 20000.0
    assert res.annual_operating_expense_usd == 500.0
    assert res.annual_utility_savings_usd == 3650.0
    assert res.net_annual_cash_flow_usd == 3150.0
    assert res.simple_payback_years == round(20000.0 / 3150.0, 2)
    assert res.net_present_value_usd > 0.0
    assert res.internal_rate_of_return_percent is not None
    assert res.internal_rate_of_return_percent > 0.0


def test_scenario_comparison(db_session):
    # Setup comparison request: Scenario A (50m2) vs Scenario B (150m2)
    req = ScenarioComparisonRequest(
        temperature_c=30.0,
        humidity=60.0,
        solar_radiation=500.0,
        scenarios=[
            ScenarioConfig(
                name="Scenario A: Small Ivy Wall",
                wall_area_m2=50.0,
                plant_type="hedera_helix",
                leaf_area_index=2.5,
                chiller_cop=3.0,
                electricity_rate=0.15
            ),
            ScenarioConfig(
                name="Scenario B: Large Ivy Wall",
                wall_area_m2=150.0,
                plant_type="hedera_helix",
                leaf_area_index=2.5,
                chiller_cop=3.0,
                electricity_rate=0.15
            )
        ]
    )
    
    res = SimulationScenarios.run_comparison(db_session, req)
    assert len(res.scenario_metrics) == 2
    assert res.delta_savings_usd > 0.0
    assert res.optimal_scenario_name == "Scenario B: Large Ivy Wall"


def test_building_data_ingest_pipeline(db_session):
    # CSV content with one valid row and one invalid row (to verify partial error logging)
    csv_data = (
        "wall_area_m2,plant_type,temperature_c,humidity,solar_radiation,cop,electricity_rate\n"
        "200.0,hedera_helix,32.0,50.0,600.0,3.0,0.15\n"
        "0.0,hedera_helix,22.0,50.0,600.0,3.0,0.15\n" # Invalid area (<=0)
    )
    
    res = BuildingDataImporter.parse_utility_csv_stream(db_session, csv_data, "utility_audit.csv")
    assert res["imported_rows"] == 1
    assert res["failed_rows"] == 1
    assert res["status"] == "PARTIAL"
    
    # Check that calculation was logged
    logs = db_session.query(CalculationLog).all()
    assert len(logs) == 1
    assert logs[0].wall_area_m2 == 200.0


def test_report_builder_institutional():
    req = ReportRequest(
        report_type="ESG_BOARD",
        wall_area_m2=150.0,
        plant_type="Common Ivy",
        annual_savings_usd=3500.0,
        annual_co2_reduction_kg=880.0,
        payback_years=5.5,
        initial_investment_usd=19250.0
    )
    res = ReportGenerator.generate_report(req)
    assert "formatted_html" in res
    assert "data_summary" in res
    assert "ESG BOARD" in res["formatted_html"]


def test_report_builder_engineering_validation_v1():
    req = ReportRequest(
        report_type="ENGINEERING_VALIDATION_V1",
        wall_area_m2=1100.0,
        plant_type="Common Ivy",
        annual_savings_usd=15600.0,
        annual_co2_reduction_kg=29640.0,
        payback_years=10.5,
        initial_investment_usd=495000.0
    )
    res = ReportGenerator.generate_report(req)
    assert "formatted_html" in res
    assert "data_summary" in res
    assert "Engineering Validation Report v1" in res["formatted_html"]
    assert "78,000 kWh/year" in res["formatted_html"]
