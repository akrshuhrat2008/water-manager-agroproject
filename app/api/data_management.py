"""API для управления данными (регионы, нормы полива)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db, Region, CropNorm
from pydantic import BaseModel, Field

router = APIRouter()


class RegionCreate(BaseModel):
    """Модель для создания региона."""
    name: str
    name_ru: str
    name_tj: Optional[str] = None
    latitude: float
    longitude: float
    country: str = "Tajikistan"
    description: Optional[str] = None


class CropNormCreate(BaseModel):
    """Модель для создания нормы полива."""
    crop_id: str
    region_id: Optional[int] = None
    norm_per_ha_per_day: float = Field(..., gt=0)
    source: Optional[str] = None
    notes: Optional[str] = None


@router.get("/regions")
async def get_regions(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Получить список регионов."""
    query = db.query(Region)
    if active_only:
        query = query.filter(Region.is_active == 1)
    
    regions = query.all()
    return {
        "regions": [
            {
                "id": r.id,
                "name": r.name,
                "name_ru": r.name_ru,
                "name_tj": r.name_tj,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "country": r.country,
                "description": r.description
            }
            for r in regions
        ]
    }


@router.post("/regions")
async def create_region(
    region: RegionCreate,
    db: Session = Depends(get_db)
):
    """Создать новый регион."""
    existing = db.query(Region).filter(Region.name == region.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Регион с таким именем уже существует")
    
    new_region = Region(**region.dict())
    db.add(new_region)
    db.commit()
    db.refresh(new_region)
    return {"id": new_region.id, "message": "Регион создан"}


@router.get("/crop-norms")
async def get_crop_norms(
    crop_id: Optional[str] = None,
    region_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Получить нормы полива."""
    query = db.query(CropNorm).filter(CropNorm.is_active == 1)
    
    if crop_id:
        query = query.filter(CropNorm.crop_id == crop_id)
    if region_id:
        query = query.filter(CropNorm.region_id == region_id)
    
    norms = query.all()
    return {
        "norms": [
            {
                "id": n.id,
                "crop_id": n.crop_id,
                "region_id": n.region_id,
                "norm_per_ha_per_day": n.norm_per_ha_per_day,
                "source": n.source,
                "notes": n.notes
            }
            for n in norms
        ]
    }


@router.post("/crop-norms")
async def create_crop_norm(
    norm: CropNormCreate,
    db: Session = Depends(get_db)
):
    """Создать новую норму полива."""
    new_norm = CropNorm(**norm.dict())
    db.add(new_norm)
    db.commit()
    db.refresh(new_norm)
    return {"id": new_norm.id, "message": "Норма создана"}


@router.get("/crop-norms/{crop_id}/{region_name}")
async def get_norm_for_crop_region(
    crop_id: str,
    region_name: str,
    db: Session = Depends(get_db)
):
    """Получить норму полива для конкретной культуры и региона."""
    # Сначала ищем регион
    region = db.query(Region).filter(Region.name == region_name.lower()).first()
    
    if region:
        # Ищем специфичную норму для региона
        norm = db.query(CropNorm).filter(
            CropNorm.crop_id == crop_id,
            CropNorm.region_id == region.id,
            CropNorm.is_active == 1
        ).first()
        
        if norm:
            return {"norm": norm.norm_per_ha_per_day, "source": norm.source}
    
    # Если не найдена специфичная, ищем общую норму
    general_norm = db.query(CropNorm).filter(
        CropNorm.crop_id == crop_id,
        CropNorm.region_id.is_(None),
        CropNorm.is_active == 1
    ).first()
    
    if general_norm:
        return {"norm": general_norm.norm_per_ha_per_day, "source": general_norm.source}
    
    # Если ничего не найдено, возвращаем дефолтную норму
    from app.data.crops import CROPS
    default_norm = CROPS.get(crop_id, 50.0)
    return {"norm": default_norm, "source": "default"}


@router.post("/data/initialize")
async def initialize_data(db: Session = Depends(get_db)):
    """Инициализировать базу данных реальными данными Таджикистана."""
    from app.data.regions_tj import TAJIKISTAN_REGIONS, TAJIKISTAN_CROP_NORMS
    
    # Добавляем регионы
    regions_added = 0
    for region_data in TAJIKISTAN_REGIONS:
        existing = db.query(Region).filter(Region.name == region_data["name"]).first()
        if not existing:
            region = Region(**region_data)
            db.add(region)
            regions_added += 1
    
    db.commit()
    
    # Добавляем нормы полива
    norms_added = 0
    for crop_id, norms in TAJIKISTAN_CROP_NORMS.items():
        # Общая норма
        existing_general = db.query(CropNorm).filter(
            CropNorm.crop_id == crop_id,
            CropNorm.region_id.is_(None)
        ).first()
        
        if not existing_general:
            general_norm = CropNorm(
                crop_id=crop_id,
                region_id=None,
                norm_per_ha_per_day=norms.get("default", 50.0),
                source="Таджикистан - агрономические нормы"
            )
            db.add(general_norm)
            norms_added += 1
        
        # Нормы по регионам
        for region_name, norm_value in norms.items():
            if region_name == "default":
                continue
            
            region = db.query(Region).filter(Region.name == region_name).first()
            if region:
                existing = db.query(CropNorm).filter(
                    CropNorm.crop_id == crop_id,
                    CropNorm.region_id == region.id
                ).first()
                
                if not existing:
                    region_norm = CropNorm(
                        crop_id=crop_id,
                        region_id=region.id,
                        norm_per_ha_per_day=norm_value,
                        source="Таджикистан - региональные нормы"
                    )
                    db.add(region_norm)
                    norms_added += 1
    
    db.commit()
    
    return {
        "message": "Данные инициализированы",
        "regions_added": regions_added,
        "norms_added": norms_added
    }

