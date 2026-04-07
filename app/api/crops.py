"""API endpoints для получения информации о культурах."""
from fastapi import APIRouter
from app.data.crops import CROP_INFO, GROWTH_STAGE_INFO, CROPS, GROWTH_COEFFICIENT

router = APIRouter()


@router.get("/crops")
async def get_crops():
    """Получить список всех доступных культур."""
    return {
        "crops": [
            {
                "id": crop_id,
                **info
            }
            for crop_id, info in CROP_INFO.items()
        ],
        "norms": CROPS
    }


@router.get("/growth-stages")
async def get_growth_stages():
    """Получить информацию о фазах роста."""
    return {
        "stages": [
            {
                "id": stage_id,
                **info
            }
            for stage_id, info in GROWTH_STAGE_INFO.items()
        ],
        "coefficients": GROWTH_COEFFICIENT
    }

