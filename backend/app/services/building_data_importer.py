import csv
import io
from datetime import datetime
from typing import Any, Dict, List, Tuple
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models import CalculationLog

class BuildingDataImporter:
    """
    Handles secure ingestion of utility meter streams, energy audits,
    and HVAC schedule datasets in CSV/text streams.
    """
    
    @staticmethod
    def parse_utility_csv_stream(
        db: Session,
        csv_content: str,
        filename: str
    ) -> Dict[str, Any]:
        """
        Parses utility rows and bulk-loads calculations/baselines.
        Expected schema:
          timestamp, wall_area_m2, plant_type, temperature_c, humidity, solar_radiation, cop, electricity_rate

        Validates physical properties and registers records.
        """
        reader = csv.DictReader(io.StringIO(csv_content))
        
        parsed_records = 0
        error_count = 0
        error_details: List[str] = []
        
        for idx, row in enumerate(reader):
            try:
                # Basic key validations
                req_keys = ["wall_area_m2", "plant_type", "temperature_c", "humidity", "solar_radiation"]
                missing = [k for k in req_keys if k not in row or not row[k]]
                if missing:
                    raise ValueError(f"Line {idx+1}: Missing columns: {', '.join(missing)}")
                
                # Coerce and bound numerical metrics
                area = float(row["wall_area_m2"])
                temp = float(row["temperature_c"])
                hum = float(row["humidity"])
                solar = float(row["solar_radiation"])
                plant = str(row["plant_type"]).strip()
                
                if area <= 0.0:
                    raise ValueError(f"Line {idx+1}: Wall Area must be positive. Found {area}")
                if not (0.0 <= hum <= 100.0):
                    raise ValueError(f"Line {idx+1}: Humidity must be between 0 and 100. Found {hum}")
                if solar < 0.0:
                    raise ValueError(f"Line {idx+1}: Solar radiation cannot be negative. Found {solar}")

                # Optional columns default to standards
                cop = float(row.get("cop", 3.0))
                rate = float(row.get("electricity_rate", 0.15))
                
                # Mock calculation mapping to bypass dependency cycle,
                # since this service is used to populate logs tables directly from meter data.
                # In production, this can invoke the full calculate pipeline.
                from app.services.thermal_calculator import ThermalCalculator
                results = ThermalCalculator.calculate_total_system_savings(
                    wall_area_m2=area,
                    leaf_area_index=3.0,
                    temperature_c=temp,
                    humidity=hum,
                    solar_radiation=solar,
                    crop_coefficient=0.8,  # Reference IvyKc baseline
                    extinction_coefficient=0.6,
                    added_r_value=0.45,
                    chiller_cop=cop,
                    electricity_rate=rate
                )

                # Append to database log
                log_entry = CalculationLog(
                    wall_area_m2=area,
                    plant_type=plant,
                    temperature_c=temp,
                    humidity=hum,
                    solar_radiation=solar,
                    cooling_kwh=round(results["hvac_load_reduction_kwh"], 2),
                    cost_saved=round(results["daily_financial_yield_usd"], 2),
                    co2_saved=round(results["hvac_load_reduction_kwh"] * 0.38, 2)
                )
                
                db.add(log_entry)
                parsed_records += 1

            except Exception as e:
                error_count += 1
                error_details.append(str(e))
                if len(error_details) >= 15:  # Limit error logs threshold
                    error_details.append("Ingestion interrupted: too many warnings.")
                    break
        
        if parsed_records > 0 and error_count < 15:
            db.commit()
            
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
