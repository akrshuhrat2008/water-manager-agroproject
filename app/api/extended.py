"""Расширенные API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db, CalculationHistory, ScenarioComparison, MultiplePlots
from app.models.extended_schemas import (
    MultiplePlotsRequest, ScenarioRequest, MonthlyPlanRequest,
    CalculationHistoryResponse, ComparisonResponse
)
from app.services.water_calc import WaterCalculationService
from app.services.weather import WeatherService
from datetime import datetime

router = APIRouter()

# Инициализация сервисов
weather_service = WeatherService()
water_calc_service = WaterCalculationService(weather_service)


@router.post("/multiple-plots")
async def calculate_multiple_plots(request: MultiplePlotsRequest):
    """Рассчитать план для множественных участков."""
    results = []
    
    for plot in request.plots:
        result = water_calc_service.calculate(
            area=plot.area,
            crop=plot.crop,
            growth_stage=plot.growth_stage,
            days=request.days,
            region=plot.region
        )
        results.append({
            "plot": plot.dict(),
            "calculation": result
        })
    
    # Общая статистика
    total_water_all = sum(r["calculation"]["total_water"] for r in results)
    total_area = sum(p.area for p in request.plots)
    
    return {
        "plots": results,
        "summary": {
            "total_plots": len(request.plots),
            "total_area": total_area,
            "total_water": total_water_all,
            "average_water_per_ha": total_water_all / total_area if total_area > 0 else 0
        }
    }


@router.post("/scenarios/compare")
async def compare_scenarios(request: ScenarioRequest):
    """Сравнить несколько сценариев."""
    scenarios_results = []
    
    # Базовый сценарий
    base_result = water_calc_service.calculate(**request.base_scenario)
    scenarios_results.append({
        "name": "Базовый сценарий",
        "data": request.base_scenario,
        "result": base_result
    })
    
    # Дополнительные сценарии
    for i, scenario in enumerate(request.scenarios):
        result = water_calc_service.calculate(**scenario)
        scenarios_results.append({
            "name": scenario.get("name", f"Сценарий {i+1}"),
            "data": scenario,
            "result": result
        })
    
    # Сравнительный анализ
    if not scenarios_results:
        raise HTTPException(status_code=400, detail="Нет сценариев для сравнения")

    water_values = [s["result"]["total_water"] for s in scenarios_results]
    comparison = {
        "min_water": min(water_values),
        "max_water": max(water_values),
        "avg_water": sum(water_values) / len(water_values),
        "difference": {
            "min": scenarios_results[0]["result"]["total_water"] - min(water_values),
            "max": max(water_values) - scenarios_results[0]["result"]["total_water"]
        }
    }
    
    return ComparisonResponse(
        scenarios=scenarios_results,
        comparison=comparison
    )


@router.post("/monthly-plan")
async def calculate_monthly_plan(request: MonthlyPlanRequest):
    """Рассчитать план на месяц (30 дней)."""
    result = water_calc_service.calculate(
        area=request.area,
        crop=request.crop,
        growth_stage=request.growth_stage,
        days=30,  # Месяц
        region=request.region
    )
    
    # Разбиваем на недели
    weeks = []
    daily_plan = result["daily_plan"]
    for week_num in range(4):  # 4 недели
        week_start = week_num * 7
        week_end = min(week_start + 7, len(daily_plan))
        week_data = daily_plan[week_start:week_end]
        weeks.append({
            "week": week_num + 1,
            "days": week_data,
            "total_water": sum(d["water"] for d in week_data)
        })
    
    result["weeks"] = weeks
    return result


@router.post("/history/save")
async def save_calculation(
    calculation_data: dict,
    notes: str = None,
    db: Session = Depends(get_db)
):
    """Сохранить расчет в историю."""
    history = CalculationHistory(
        area=calculation_data["area"],
        crop=calculation_data["crop"],
        growth_stage=calculation_data["growth_stage"],
        days=calculation_data["days"],
        region=calculation_data["region"],
        total_water=calculation_data.get("total_water", 0),
        calculation_data=calculation_data,
        notes=notes
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return {"id": history.id, "message": "Расчет сохранен"}


@router.get("/history", response_model=List[CalculationHistoryResponse])
async def get_history(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Получить историю расчетов."""
    history = db.query(CalculationHistory).order_by(
        CalculationHistory.created_at.desc()
    ).limit(limit).all()
    return history


@router.get("/history/{history_id}")
async def get_history_item(history_id: int, db: Session = Depends(get_db)):
    """Получить конкретный расчет из истории."""
    history = db.query(CalculationHistory).filter(
        CalculationHistory.id == history_id
    ).first()
    if not history:
        raise HTTPException(status_code=404, detail="Расчет не найден")
    return history


@router.delete("/history/{history_id}")
async def delete_history_item(history_id: int, db: Session = Depends(get_db)):
    """Удалить расчет из истории."""
    history = db.query(CalculationHistory).filter(
        CalculationHistory.id == history_id
    ).first()
    if not history:
        raise HTTPException(status_code=404, detail="Расчет не найден")
    db.delete(history)
    db.commit()
    return {"message": "Расчет удален"}


@router.get("/analytics/trends")
async def get_water_trends(
    crop: str = None,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Получить тренды потребления воды."""
    query = db.query(CalculationHistory)
    if crop:
        query = query.filter(CalculationHistory.crop == crop)
    
    history = query.order_by(
        CalculationHistory.created_at.desc()
    ).limit(days).all()
    
    trends = []
    for item in reversed(history):
        trends.append({
            "date": item.created_at.isoformat(),
            "total_water": item.total_water,
            "area": item.area,
            "crop": item.crop
        })
    
    return {
        "trends": trends,
        "average": sum(t["total_water"] for t in trends) / len(trends) if trends else 0,
        "total": sum(t["total_water"] for t in trends)
    }


@router.get("/analytics/crop-statistics")
async def get_crop_statistics(db: Session = Depends(get_db)):
    """Статистика по культурам."""
    from sqlalchemy import func
    
    stats = db.query(
        CalculationHistory.crop,
        func.count(CalculationHistory.id).label("count"),
        func.avg(CalculationHistory.total_water).label("avg_water"),
        func.sum(CalculationHistory.total_water).label("total_water"),
        func.avg(CalculationHistory.area).label("avg_area")
    ).group_by(CalculationHistory.crop).all()
    
    return {
        "statistics": [
            {
                "crop": stat.crop,
                "calculations_count": stat.count,
                "average_water": float(stat.avg_water),
                "total_water": float(stat.total_water),
                "average_area": float(stat.avg_area)
            }
            for stat in stats
        ]
    }
