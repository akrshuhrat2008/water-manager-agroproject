"""Pydantic модели для API запросов и ответов."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ========== Case 1 Schemas (Decade-based Planning) ==========

class Case1CalculationRequest(BaseModel):
    """Запрос на расчет водопользования по официальной методике (Case 1)."""
    area: float = Field(..., gt=0, description="Площадь участка в гектарах")
    crop: str = Field(..., description="Тип культуры (cotton, alfalfa, grain, orchard)")
    planning_period: str = Field(
        ...,
        description="Период планирования: 'season' (весь сезон), 'month' (месяц), 'decade' (декада)"
    )
    month: Optional[str] = Field(
        default=None,
        description="Месяц для планирования (april, may, june и т.д.), если planning_period='month'"
    )
    decades: Optional[List[str]] = Field(
        default=None,
        description="Список декад (april_1, may_2 и т.д.), если planning_period='decade'"
    )
    hydromodule_zone: str = Field(
        default="NGM-III",
        description="Зона гидромодуля (NGM-III по умолчанию)"
    )


class DecadePlanItem(BaseModel):
    """План полива на декаду."""
    decade: str = Field(..., description="Ключ декады (april_1, may_2 и т.д.)")
    decade_name: str = Field(..., description="Название декады (1-10 апреля и т.д.)")
    growth_stage: str = Field(..., description="Фаза роста культуры в декаде")
    irrigation_days: int = Field(..., description="Количество поливных дней (t0)")
    total_days: int = Field(..., description="Всего дней в декаде (T)")
    q0: float = Field(..., description="Поливной гидромодуль (л/с·га)")
    qd: float = Field(..., description="Декадный гидромодуль (л/с·га)")
    discharge_l_s: float = Field(..., description="Расход воды (л/с)")
    water_volume_thousand_m3: float = Field(..., description="Объем воды (тыс. м³)")
    explanation: str = Field(..., description="Объяснение расчета для декады")


class ValidationResult(BaseModel):
    """Результат валидации водного баланса."""
    status: str = Field(..., description="Статус: OK, WARNING, INVALID")
    message: str = Field(..., description="Сообщение о валидации")
    calculated_total: float = Field(..., description="Рассчитанный общий объем")
    expected_total: float = Field(..., description="Ожидаемый сезонный объем")
    deviation_percent: float = Field(..., description="Отклонение в процентах")


class Case1CalculationResponse(BaseModel):
    """Ответ с результатами расчета по официальной методике (Case 1)."""
    area: float = Field(..., description="Площадь в гектарах")
    crop: str = Field(..., description="Тип культуры")
    hydromodule_zone: str = Field(..., description="Зона гидромодуля")
    seasonal_norm_m3_ha: float = Field(..., description="Сезонная норма полива (м³/га)")
    expected_seasonal_volume_thousand_m3: float = Field(
        ...,
        description="Ожидаемый сезонный объем (тыс. м³)"
    )
    calculated_total_volume_thousand_m3: float = Field(
        ...,
        description="Рассчитанный общий объем (тыс. м³)"
    )
    decade_plan: List[DecadePlanItem] = Field(..., description="План по декадам")
    validation: ValidationResult = Field(..., description="Результат валидации")
    explanations: List[str] = Field(..., description="Объяснения расчета")
    calculation_method: str = Field(..., description="Метод расчета")
    formulas_used: List[str] = Field(..., description="Использованные формулы")


# ========== Original Schemas (Daily Planning) ==========

class WaterCalculationRequest(BaseModel):
    """Запрос на расчет водопользования."""
    area: float = Field(..., gt=0, description="Площадь участка в гектарах")
    crop: str = Field(..., description="Тип культуры")
    growth_stage: str = Field(..., description="Фаза роста")
    days: int = Field(..., ge=1, le=10, description="Период планирования (7 или 10 дней)")
    region: str = Field(..., description="Регион")


class WeatherData(BaseModel):
    """Данные о погоде на день."""
    temperature: float = Field(..., description="Максимальная температура в °C")
    temperature_min: Optional[float] = Field(default=None, description="Минимальная температура в °C")
    precipitation: float = Field(default=0, description="Осадки в мм")
    wind_speed: Optional[float] = Field(default=None, description="Скорость ветра в м/с")
    humidity: Optional[float] = Field(default=None, description="Влажность в %")


class DailyPlanItem(BaseModel):
    """План полива на один день."""
    day: int = Field(..., description="День периода")
    water: float = Field(..., description="Объем воды в м³")
    note: str = Field(..., description="Комментарий")
    weather: Optional[WeatherData] = Field(default=None, description="Данные о погоде")


class Statistics(BaseModel):
    """Статистика по расчету."""
    average_daily: float = Field(..., description="Средний объем воды в день")
    max_daily: float = Field(..., description="Максимальный объем воды в день")
    min_daily: float = Field(..., description="Минимальный объем воды в день")
    total_days: int = Field(..., description="Общее количество дней")
    rain_days: int = Field(..., description="Количество дней с дождем")
    high_temp_days: int = Field(..., description="Количество дней с высокой температурой")


class WaterCalculationResponse(BaseModel):
    """Ответ с результатами расчета."""
    total_water: float = Field(..., description="Общий объем воды в м³")
    daily_plan: List[DailyPlanItem] = Field(..., description="План по дням")
    recommendations: List[str] = Field(..., description="Рекомендации")
    statistics: Statistics = Field(..., description="Статистика")
    crop_info: Dict[str, Any] = Field(..., description="Информация о культуре")
    growth_stage_info: Dict[str, Any] = Field(..., description="Информация о фазе роста")
    base_norm: float = Field(..., description="Базовая норма полива")
    growth_coefficient: float = Field(..., description="Коэффициент фазы роста")
    crop_kc: float = Field(..., description="Коэффициент культуры (Kc)")
    irrigation_efficiency: float = Field(..., description="Эффективность системы полива")
    calculation_method: str = Field(..., description="Метод расчета")
    irrigation_type: str = Field(..., description="Тип системы полива")

