"""Скрипт для инициализации данных при первом запуске."""
from app.database import init_db, SessionLocal
from app.data.regions_tj import TAJIKISTAN_REGIONS, TAJIKISTAN_CROP_NORMS
from app.database import Region, CropNorm


def initialize_default_data():
    """Инициализировать базу данных реальными данными Таджикистана."""
    init_db()
    db = SessionLocal()
    
    try:
        # Проверяем, есть ли уже данные
        existing_regions = db.query(Region).count()
        if existing_regions > 0:
            print("Данные уже инициализированы")
            return
        
        # Добавляем регионы
        for region_data in TAJIKISTAN_REGIONS:
            region = Region(**region_data)
            db.add(region)
        
        db.commit()
        
        # Добавляем нормы полива
        for crop_id, norms in TAJIKISTAN_CROP_NORMS.items():
            # Общая норма
            general_norm = CropNorm(
                crop_id=crop_id,
                region_id=None,
                norm_per_ha_per_day=norms.get("default", 50.0),
                source="Таджикистан - агрономические нормы"
            )
            db.add(general_norm)
            
            # Нормы по регионам
            for region_name, norm_value in norms.items():
                if region_name == "default":
                    continue
                
                region = db.query(Region).filter(Region.name == region_name).first()
                if region:
                    region_norm = CropNorm(
                        crop_id=crop_id,
                        region_id=region.id,
                        norm_per_ha_per_day=norm_value,
                        source="Таджикистан - региональные нормы"
                    )
                    db.add(region_norm)
        
        db.commit()
        print("Данные успешно инициализированы")
        
    except Exception as e:
        print(f"Ошибка при инициализации: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    initialize_default_data()

