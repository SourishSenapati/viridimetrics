from datetime import datetime, timezone
from typing import Dict, Any
from app.services.assumption_registry import AssumptionRegistry

class CalculationProvenance:
    """
    Manages calculation package versioning metadata and unique ID mappings
    for PE validation tracking.
    """

    @staticmethod
    def generate_package_id(log_id: int) -> str:
        """
        Creates a structured, auditable package ID.
        """
        current_year = datetime.now().year
        return f"VRM-{current_year}-{log_id:06d}"

    @classmethod
    def get_provenance_header(cls) -> Dict[str, Any]:
        """
        Retrieves the baseline methodology version details.
        """
        return {
            "equation_version": AssumptionRegistry.METHODOLOGY_VERSION,
            "species_dataset_version": AssumptionRegistry.SPECIES_DATASET_VERSION,
            "financial_model_version": AssumptionRegistry.FINANCIAL_MODEL_VERSION,
            "weather_assumption_version": AssumptionRegistry.WEATHER_ASSUMPTION_VERSION,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
