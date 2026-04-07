"""Сервис для работы с данными о нормах и регионах."""
from sqlalchemy.orm import Session
from typing import Optional
from app.database import Region, CropNorm


class DataService:
    """Сервис для получения реальных данных."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_region_coordinates(self, region_name: str) -> Optional[dict]:
        """Получить координаты региона."""
        region = self.db.query(Region).filter(
            Region.name == region_name.lower(),
            Region.is_active == 1
        ).first()
        
        if region:
            return {
                "latitude": region.latitude,
                "longitude": region.longitude,
                "name_ru": region.name_ru
            }
        return None
    
    def get_crop_norm(self, crop_id: str, region_name: Optional[str] = None) -> float:
        """Получить норму полива для культуры и региона."""
        region_id = None
        if region_name:
            region = self.db.query(Region).filter(
                Region.name == region_name.lower(),
                Region.is_active == 1
            ).first()
            if region:
                region_id = region.id
        
        # Сначала ищем специфичную норму для региона
        if region_id:
            norm = self.db.query(CropNorm).filter(
                CropNorm.crop_id == crop_id,
                CropNorm.region_id == region_id,
                CropNorm.is_active == 1
            ).first()
            if norm:
                return norm.norm_per_ha_per_day
        
        # Если не найдена, ищем общую норму
        general_norm = self.db.query(CropNorm).filter(
            CropNorm.crop_id == crop_id,
            CropNorm.region_id.is_(None),
            CropNorm.is_active == 1
        ).first()
        
        if general_norm:
            return general_norm.norm_per_ha_per_day
        
        # Если ничего не найдено, возвращаем дефолт
        from app.data.crops import CROPS
        return CROPS.get(crop_id, 50.0)

