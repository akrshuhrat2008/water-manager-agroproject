"""API endpoints для расчета водопользования."""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.models.schemas import WaterCalculationRequest, WaterCalculationResponse
from app.services.water_calc import WaterCalculationService
from app.services.weather import WeatherService
from app.services.export import ExportService
from app.services.data_service import DataService
from app.database import get_db

router = APIRouter()

# Инициализация сервисов с реальным API погоды
import os
use_mock = os.getenv("USE_MOCK_WEATHER", "false").lower() == "true"
use_scientific = os.getenv("USE_SCIENTIFIC_METHOD", "true").lower() == "true"

weather_service = WeatherService(use_mock=use_mock)
water_calc_service = WaterCalculationService(
    weather_service=weather_service,
    use_scientific_method=use_scientific
)
export_service = ExportService()


@router.post("/calculate", response_model=WaterCalculationResponse)
async def calculate_water(
    request: WaterCalculationRequest,
    db: Session = Depends(get_db)
):
    """
    Рассчитать потребность в воде для фермерского хозяйства.
    
    Args:
        request: Параметры расчета
        
    Returns:
        Результаты расчета
    """
    try:
        # Валидация культуры
        from app.data.crops import CROPS, GROWTH_COEFFICIENT
        
        if request.crop not in CROPS:
            raise HTTPException(
                status_code=400,
                detail=f"Неизвестная культура: {request.crop}. Доступные: {list(CROPS.keys())}"
            )
        
        if request.growth_stage not in GROWTH_COEFFICIENT:
            raise HTTPException(
                status_code=400,
                detail=f"Неизвестная фаза роста: {request.growth_stage}. Доступные: {list(GROWTH_COEFFICIENT.keys())}"
            )
        
        # Валидация площади
        if request.area <= 0:
            raise HTTPException(
                status_code=400,
                detail="Площадь участка должна быть больше 0"
            )
        
        if request.area > 10000:  # Разумный лимит
            raise HTTPException(
                status_code=400,
                detail="Площадь участка слишком большая (максимум 10000 га)"
            )
        
        # Получаем реальную норму из базы данных (если доступна)
        try:
            data_service = DataService(db)
            region_norm = data_service.get_crop_norm(request.crop, request.region)
        except:
            # Если БД недоступна, используем стандартные нормы
            from app.data.crops import CROPS
            region_norm = CROPS.get(request.crop, 50.0)
        
        # Выполняем расчет с передачей сессии БД для координат
        result = water_calc_service.calculate(
            area=request.area,
            crop=request.crop,
            growth_stage=request.growth_stage,
            days=request.days,
            region=request.region,
            irrigation_type="default",  # Можно добавить в request
            db_session=db
        )
        
        # Если получили реальную норму из БД, пересчитываем
        if region_norm and region_norm != result.get("base_norm"):
            from app.data.crops import GROWTH_COEFFICIENT
            growth_coeff = GROWTH_COEFFICIENT.get(request.growth_stage, 1.0)
            
            # Пересчитываем план с реальной нормой
            total_water_new = 0.0
            for item in result["daily_plan"]:
                # Базовый расчет с реальной нормой
                daily_base = request.area * region_norm * growth_coeff
                
                # Применяем погодные коэффициенты
                if item.note == "rain_expected":
                    daily_base = 0  # Не поливаем в дождь
                elif item.note == "high_temperature":
                    daily_base *= 1.15  # +15% при высокой температуре
                
                item.water = round(daily_base, 2)
                total_water_new += item.water
            
            result["total_water"] = round(total_water_new, 2)
            result["base_norm"] = region_norm
        
        return WaterCalculationResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )


@router.post("/export/excel")
async def export_excel(request: WaterCalculationRequest):
    """
    Экспортировать план водопользования в Excel.
    
    Args:
        request: Параметры расчета
        
    Returns:
        Excel файл для скачивания
    """
    # Выполняем расчет
    result = water_calc_service.calculate(
        area=request.area,
        crop=request.crop,
        growth_stage=request.growth_stage,
        days=request.days,
        region=request.region
    )
    
    # Экспортируем в Excel
    from app.data.crops import CROP_INFO
    crop_info = CROP_INFO.get(request.crop, {})
    
    excel_file = export_service.export_to_excel(
        daily_plan=result["daily_plan"],
        total_water=result["total_water"],
        crop_info=crop_info,
        statistics=result.get("statistics"),
        area=request.area,
        region=request.region
    )
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=water_plan.xlsx"}
    )


@router.post("/export/pdf")
async def export_pdf(request: WaterCalculationRequest):
    """
    Экспортировать план водопользования в PDF.
    
    Args:
        request: Параметры расчета
        
    Returns:
        PDF файл для скачивания
    """
    # Выполняем расчет
    result = water_calc_service.calculate(
        area=request.area,
        crop=request.crop,
        growth_stage=request.growth_stage,
        days=request.days,
        region=request.region
    )
    
    # Экспортируем в PDF
    from app.data.crops import CROP_INFO
    crop_info = CROP_INFO.get(request.crop, {})
    
    pdf_file = export_service.export_to_pdf(
        daily_plan=result["daily_plan"],
        total_water=result["total_water"],
        crop_info=crop_info,
        statistics=result.get("statistics"),
        area=request.area,
        region=request.region
    )
    
    return StreamingResponse(
        pdf_file,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=water_plan.pdf"}
    )

