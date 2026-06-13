from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from app.models import Species

class HorticulturalProfile(BaseModel):
    """
    Validation schema for commercial plant reference data.
    Every field is mathematically justified to influence facade thermal heat transfer.
    """
    key: str = Field(..., description="Unique URL-friendly slug identification key.")
    scientific_name: str = Field(..., description="Binomial botanical taxonomy name.")
    common_name: str = Field(..., description="Standard commercial landscape trade name.")
    
    # 1. crop_coefficient (Kc): Determines stomatal transpiration water mass rate (FAO-56 standard)
    crop_coefficient: float = Field(..., ge=0.1, le=1.5, description="FAO-56 Crop Coefficient for transpiration scaling.")
    
    # 2. leaf_area_index (LAI): Standard density ratio of leaves to wall area (m²/m²)
    leaf_area_index: float = Field(..., ge=0.5, le=10.0, description="Canopy leaf area density index.")
    
    # 3. drought_tolerance: Integer rating of plant stomatal survival threshold
    drought_tolerance: int = Field(..., ge=1, le=5, description="Drought survival index. 1=High irrigation required, 5=Xeric resilient.")
    
    # 4. solar_absorption: Albedo complement (1 - Albedo), fraction of radiation absorbed as heat or plant biology
    solar_absorption: float = Field(..., ge=0.5, le=0.95, description="Solar absorption fraction (Complement of surface albedo).")
    
    # 5. extinction_coefficient (k_ext): Coefficient of Beer-Lambert light attenuation
    extinction_coefficient: float = Field(..., ge=0.3, le=0.9, description="Light extinction coefficient for shading density.")
    
    # 6. added_r_value: Thickness/resistance of vegetation substrate or air-pocket insulating buffer (m²K/W)
    added_r_value: float = Field(..., ge=0.1, le=1.2, description="Added envelope thermal resistance (m²·K/W).")
    
    source_papers: Optional[str] = Field(None, description="Botanical literature database references.")

    @field_validator('key')
    @classmethod
    def validate_key_slug(cls, v: str) -> str:
        if not v.replace('_', '').isalnum():
            raise ValueError("Species key must be alphanumeric and slug-friendly.")
        return v.lower()

class HorticulturalReference:
    """
    Horticultural taxonomy service for database queries and record validations.
    """
    @staticmethod
    def get_profile_by_key(db: Session, key: str) -> Optional[Species]:
        return db.query(Species).filter(Species.key == key).first()

    @staticmethod
    def list_profiles(db: Session, search: Optional[str] = None) -> List[Species]:
        query = db.query(Species)
        if search:
            query = query.filter(
                (Species.common_name.ilike(f"%{search}%")) |
                (Species.scientific_name.ilike(f"%{search}%")) |
                (Species.key.ilike(f"%{search}%"))
            )
        return query.all()

    @staticmethod
    def create_profile(db: Session, profile: HorticulturalProfile) -> Species:
        db_profile = Species(
            key=profile.key,
            scientific_name=profile.scientific_name,
            common_name=profile.common_name,
            transpiration_rate_coeff=profile.crop_coefficient,
            shading_extinction_coeff=profile.extinction_coefficient,
            added_r_value=profile.added_r_value,
            source_papers=profile.source_papers
        )
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        return db_profile
