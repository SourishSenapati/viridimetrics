import csv
import io
from datetime import datetime
from typing import Any, Dict, List, Tuple, cast
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models import CalculationLog
from app.services.assumption_registry import AssumptionRegistry
from app.services.calculation_provenance import CalculationProvenance

class BuildingDataImporter:
    """
    Handles secure ingestion of pilot building datasets.
    Strictly accepts: monthly utility bills, weather data, facade dimensions, and plant species.
    Rejects any unapproved columns to preserve auditability constraints.
    """

    ALLOWED_COLUMNS = {
        "month",
        "chiller_kwh_utility",
        "electricity_rate",
        "temperature_c",
        "humidity",
        "solar_radiation",
        "wall_area_m2",
        "plant_type"
    }
    
    @classmethod
    def parse_utility_csv_stream(
        cls,
        db: Session,
        csv_content: str,
        filename: str
    ) -> Dict[str, Any]:
        """
        Parses pilot building data stream.
        """
        f_stream = io.StringIO(csv_content)
        reader = csv.DictReader(f_stream)
        
        # Enforce header constraints
        headers = reader.fieldnames if reader.fieldnames else []
        unapproved = [h for h in headers if h not in cls.ALLOWED_COLUMNS]
        if unapproved:
            raise ValueError(f"Ingestion rejected: Unapproved columns detected: {', '.join(unapproved)}")
            
        parsed_records = 0
        error_count = 0
        error_details: List[str] = []
        
        for idx, row in enumerate(reader):
            try:
                # Basic key validations
                req_keys = ["wall_area_m2", "plant_type", "temperature_c", "humidity", "solar_radiation", "electricity_rate"]
                missing = [k for k in req_keys if k not in row or not row[k]]
                if missing:
                    raise ValueError(f"Line {idx+1}: Missing required columns: {', '.join(missing)}")
                
                # Coerce and bound numerical metrics
                area = float(row["wall_area_m2"])
                temp = float(row["temperature_c"])
                hum = float(row["humidity"])
                solar = float(row["solar_radiation"])
                rate = float(row["electricity_rate"])
                plant = str(row["plant_type"]).strip()
                
                if area <= 0.0:
                    raise ValueError(f"Line {idx+1}: Wall Area must be positive. Found {area}")
                if not (0.0 <= hum <= 100.0):
                    raise ValueError(f"Line {idx+1}: Humidity must be between 0 and 100. Found {hum}")
                if solar < 0.0:
                    raise ValueError(f"Line {idx+1}: Solar radiation cannot be negative. Found {solar}")
                if rate < 0.0:
                    raise ValueError(f"Line {idx+1}: Electricity rate cannot be negative. Found {rate}")

                # Optional utility draw values
                month = row.get("month", "Unknown")
                chiller_kwh = float(row.get("chiller_kwh_utility", 0.0)) if row.get("chiller_kwh_utility") else 0.0

                # Run calculation using default ASHRAE COP
                from app.services.thermal_calculator import ThermalCalculator
                results = ThermalCalculator.calculate_total_system_savings(
                    wall_area_m2=area,
                    leaf_area_index=3.0,
                    temperature_c=temp,
                    humidity=hum,
                    solar_radiation=solar,
                    crop_coefficient=0.8,  # Reference ivy Kc
                    extinction_coefficient=0.6,
                    added_r_value=0.45,
                    chiller_cop=AssumptionRegistry.ASHRAE_DEFAULT_COP,
                    electricity_rate=rate
                )

                # Log calculation results to database
                log_entry = CalculationLog(
                    wall_area_m2=area,
                    plant_type=plant,
                    temperature_c=temp,
                    humidity=hum,
                    solar_radiation=solar,
                    cooling_kwh=round(results["hvac_load_reduction_kwh"], 2),
                    cost_saved=round(results["daily_financial_yield_usd"], 2),
                    co2_saved=round(results["hvac_load_reduction_kwh"] * AssumptionRegistry.CO2_EMISSION_FACTOR, 2),
                    
                    # heat balances
                    baseline_heat_gain=round(results["baseline_heat_gain"], 2),
                    vegetated_heat_gain=round(results["vegetated_heat_gain"], 2),
                    net_reduction=round(results["net_reduction"], 2),
                    hvac_offset=round(results["hvac_offset"], 2),
                    
                    # methodology versions
                    equation_version=AssumptionRegistry.METHODOLOGY_VERSION,
                    species_dataset_version=AssumptionRegistry.SPECIES_DATASET_VERSION,
                    financial_model_version=AssumptionRegistry.FINANCIAL_MODEL_VERSION,
                    weather_assumption_version=AssumptionRegistry.WEATHER_ASSUMPTION_VERSION
                )
                
                db.add(log_entry)
                db.commit()
                db.refresh(log_entry)
                
                # Update with formal package ID
                package_id_str = CalculationProvenance.generate_package_id(cast(int, log_entry.id))
                setattr(log_entry, "package_id", package_id_str)
                db.commit()
                
                parsed_records += 1

            except Exception as e:
                db.rollback()
                error_count += 1
                error_details.append(str(e))
                if len(error_details) >= 15:
                    error_details.append("Ingestion interrupted: too many errors.")
                    break
        
        # Log to IngestionAuditLogs table in DB (dynamic query)
        try:
            db.execute(
                text("INSERT INTO ingestion_audit_logs (filename, status, rows_imported, error_count, details, timestamp) VALUES (:fn, :st, :ri, :ec, :dt, :ts)"),
                {
                    "fn": filename,
                    "st": "SUCCESS" if error_count == 0 else "PARTIAL_SUCCESS",
                    "ri": parsed_records,
                    "ec": error_count,
                    "dt": ", ".join(error_details[:5]),
                    "ts": datetime.now()
                }
            )
            db.commit()
        except Exception as audit_err:
            print(f"Failed to write import audits: {audit_err}")
            db.rollback()

        return {
            "status": "COMPLETED" if error_count == 0 else "FAILED_PARSING" if parsed_records == 0 else "PARTIAL",
            "imported_rows": parsed_records,
            "failed_rows": error_count,
            "errors": error_details[:10]
        }
