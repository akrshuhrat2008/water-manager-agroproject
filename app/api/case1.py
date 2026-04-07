"""
API endpoints для Case 1 - Farm Water Use Planning.
Официальная методика планирования водопользования для Таджикистана.
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import Case1CalculationRequest, Case1CalculationResponse
from app.services.case1_calculation import Case1CalculationService

router = APIRouter()

# Инициализация сервиса
case1_service = Case1CalculationService(hydromodule_zone="NGM-III")


@router.post("/calculate/case1", response_model=Case1CalculationResponse)
async def calculate_case1(request: Case1CalculationRequest):
    """
    Расчет плана водопользования по официальной методике Таджикистана (Case 1).

    Особенности:
    - БЕЗ погодных API
    - БЕЗ AI/ML логики
    - ТОЛЬКО нормативные данные
    - Декадное планирование
    - Расчет по гидромодулю NGM-III

    Args:
        request: Параметры расчета

    Returns:
        Результаты расчета с валидацией водного баланса

    Raises:
        HTTPException: При ошибках валидации или расчета
    """
    try:
        # Валидация площади
        if request.area <= 0:
            raise HTTPException(
                status_code=400,
                detail="Площадь участка должна быть больше 0"
            )

        if request.area > 100000:
            raise HTTPException(
                status_code=400,
                detail="Площадь участка слишком большая (максимум 100000 га)"
            )

        # Валидация культуры
        valid_crops = ["cotton", "alfalfa", "grain", "orchard"]
        if request.crop not in valid_crops:
            raise HTTPException(
                status_code=400,
                detail=f"Неизвестная культура: {request.crop}. Доступные: {valid_crops}"
            )

        # Валидация периода планирования
        valid_periods = ["season", "month", "decade"]
        if request.planning_period not in valid_periods:
            raise HTTPException(
                status_code=400,
                detail=f"Неизвестный период планирования: {request.planning_period}. "
                       f"Доступные: {valid_periods}"
            )

        # Выполняем расчет в зависимости от периода
        if request.planning_period == "season":
            # Расчет на весь сезон
            result = case1_service.calculate_decade_plan(
                area=request.area,
                crop=request.crop,
                decades=None  # Все декады сезона
            )

        elif request.planning_period == "month":
            # Расчет на месяц
            if not request.month:
                raise HTTPException(
                    status_code=400,
                    detail="Для планирования по месяцу необходимо указать параметр 'month'"
                )

            result = case1_service.calculate_monthly_plan(
                area=request.area,
                crop=request.crop,
                month=request.month
            )

        elif request.planning_period == "decade":
            # Расчет по конкретным декадам
            if not request.decades or len(request.decades) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="Для планирования по декадам необходимо указать параметр 'decades'"
                )

            result = case1_service.calculate_decade_plan(
                area=request.area,
                crop=request.crop,
                decades=request.decades
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Неподдерживаемый период планирования: {request.planning_period}"
            )

        return Case1CalculationResponse(**result)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )


@router.get("/case1/crop-info/{crop}")
async def get_crop_info(crop: str):
    """
    Получить информацию о культуре для Case 1.

    Args:
        crop: Тип культуры

    Returns:
        Информация о культуре (сезонная норма, гидромодули, доступные декады)
    """
    try:
        info = case1_service.get_crop_info(crop)
        return info
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )


@router.get("/case1/available-crops")
async def get_available_crops():
    """
    Получить список доступных культур для Case 1.

    Returns:
        Список культур с их основными параметрами
    """
    from app.data.irrigation_regime_tj import (
        HYDROMODULE_NGM_III,
        SEASONAL_IRRIGATION_NORMS
    )

    crops = []
    for crop in HYDROMODULE_NGM_III.keys():
        crops.append({
            "crop": crop,
            "seasonal_norm_m3_ha": SEASONAL_IRRIGATION_NORMS.get(crop, 0),
            "hydromodules": HYDROMODULE_NGM_III.get(crop, {})
        })

    return {
        "available_crops": crops,
        "total": len(crops)
    }


@router.get("/case1/available-decades/{crop}")
async def get_available_decades(crop: str):
    """
    Получить список доступных декад для культуры.

    Args:
        crop: Тип культуры

    Returns:
        Список доступных декад с количеством поливных дней
    """
    from app.data.irrigation_regime_tj import (
        IRRIGATION_DAYS_PER_DECADE,
        DECADE_NAMES
    )

    if crop not in IRRIGATION_DAYS_PER_DECADE:
        raise HTTPException(
            status_code=404,
            detail=f"Культура '{crop}' не найдена"
        )

    decades_data = []
    for decade_key, irrigation_days in IRRIGATION_DAYS_PER_DECADE[crop].items():
        decades_data.append({
            "decade": decade_key,
            "decade_name": DECADE_NAMES.get(decade_key, decade_key),
            "irrigation_days": irrigation_days
        })

    return {
        "crop": crop,
        "decades": decades_data,
        "total": len(decades_data)
    }