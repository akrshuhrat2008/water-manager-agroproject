"""Расширенные Pydantic модели."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class PlotData(BaseModel):
    """Данные одного участка."""
    plot_name: str = Field(..., description="Название участка")
    area: float = Field(..., gt=0, description="Площадь участка в гектарах")
    crop: str = Field(..., description="Тип культуры")
    growth_stage: str = Field(..., description="Фаза роста")
    region: str = Field(..., description="Регион")


class MultiplePlotsRequest(BaseModel):
    """Запрос для расчета множественных участков."""
    plots: List[PlotData] = Field(..., min_items=1, description="Список участков")
    days: int = Field(..., ge=1, le=30, description="Период планирования (до 30 дней)")


class ScenarioRequest(BaseModel):
    """Запрос для сравнения сценариев."""
    base_scenario: dict = Field(..., description="Базовый сценарий")
    scenarios: List[dict] = Field(..., min_items=1, description="Сценарии для сравнения")


class CalculationHistoryResponse(BaseModel):
    """Ответ с историей расчетов."""
    id: int
    area: float
    crop: str
    growth_stage: str
    days: int
    region: str
    total_water: float
    created_at: datetime
    notes: Optional[str] = None


class ComparisonResponse(BaseModel):
    """Ответ с сравнением сценариев."""
    scenarios: List[Dict[str, Any]] = Field(..., description="Результаты сценариев")
    comparison: Dict[str, Any] = Field(..., description="Сравнительный анализ")


class MonthlyPlanRequest(BaseModel):
    """Запрос для планирования на месяц."""
    area: float = Field(..., gt=0, description="Площадь участка в гектарах")
    crop: str = Field(..., description="Тип культуры")
    growth_stage: str = Field(..., description="Фаза роста")
    region: str = Field(..., description="Регион")
    start_date: Optional[str] = Field(None, description="Дата начала (YYYY-MM-DD)")


class ImportDataRequest(BaseModel):
    """Запрос для импорта данных."""
    file_type: str = Field(..., description="Тип файла: excel, csv, json")
    data: Optional[str] = Field(None, description="Данные файла (base64 или JSON)")

