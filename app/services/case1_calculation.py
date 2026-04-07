"""
Case 1 - Farm Water Use Planning
Официальная методика планирования водопользования для Таджикистана.

СТРОГО по документации:
- БЕЗ AI/ML логики
- БЕЗ Weather API
- ТОЛЬКО нормативные данные
- Декадное планирование
- Расчет по гидромодулю
"""
from typing import List, Dict, Optional
from app.data.irrigation_regime_tj import (
    HYDROMODULE_NGM_III,
    SEASONAL_IRRIGATION_NORMS,
    IRRIGATION_DAYS_PER_DECADE,
    GROWTH_STAGE_BY_MONTH,
    DAYS_IN_DECADE,
    DECADE_NAMES,
    DECADES_LIST
)


class Case1CalculationService:
    """Сервис для расчета водопользования по официальной методике (Case 1)."""

    def __init__(self, hydromodule_zone: str = "NGM-III"):
        """
        Инициализация сервиса.

        Args:
            hydromodule_zone: Зона гидромодуля (по умолчанию NGM-III)
        """
        self.hydromodule_zone = hydromodule_zone

    def calculate_decade_hydromodule(
        self,
        q0: float,
        t0: int,
        T: int
    ) -> float:
        """
        Расчет декадного гидромодуля.

        Формула:
            qd = q0 × t0 / T  (если полив неполную декаду)
            qd = q0           (если полив весь период)

        Args:
            q0: Поливной гидромодуль (л/с·га)
            t0: Количество поливных дней в декаде
            T: Общее количество дней в декаде

        Returns:
            qd: Декадный гидромодуль (л/с·га)
        """
        if t0 == 0:
            return 0.0

        if t0 >= T:
            # Полив на всю декаду
            return q0
        else:
            # Частичный полив декады
            return q0 * t0 / T

    def calculate_water_volume(
        self,
        days: int,
        discharge_l_s: float
    ) -> float:
        """
        Расчет объема воды.

        Формула: W = 86.4 × t × Q / 1000

        Args:
            days: Количество дней (t)
            discharge_l_s: Расход воды в л/с (Q)

        Returns:
            W: Объем воды в тысячах м³
        """
        return 86.4 * days * discharge_l_s / 1000

    def validate_water_balance(
        self,
        decade_volumes: List[float],
        expected_seasonal: float,
        tolerance_percent: float = 1.0
    ) -> Dict[str, any]:
        """
        Валидация водного баланса.

        Проверка: Σ W_decade ≈ W_season (±1%)

        Args:
            decade_volumes: Объемы воды по декадам
            expected_seasonal: Ожидаемый сезонный объем
            tolerance_percent: Допустимое отклонение в процентах

        Returns:
            Словарь со статусом валидации
        """
        calculated_total = sum(decade_volumes)

        if expected_seasonal == 0:
            return {
                "status": "INVALID",
                "message": "Сезонная норма не может быть 0",
                "calculated_total": calculated_total,
                "expected_total": expected_seasonal,
                "deviation_percent": 0.0
            }

        deviation = abs(calculated_total - expected_seasonal)
        deviation_percent = (deviation / expected_seasonal) * 100

        if deviation_percent > tolerance_percent:
            status = "WARNING"
            message = f"Отклонение {deviation_percent:.2f}% превышает допустимое ({tolerance_percent}%)"
        else:
            status = "OK"
            message = f"Водный баланс проверен: отклонение {deviation_percent:.2f}%"

        return {
            "status": status,
            "message": message,
            "calculated_total": round(calculated_total, 2),
            "expected_total": round(expected_seasonal, 2),
            "deviation_percent": round(deviation_percent, 2)
        }

    def calculate_decade_plan(
        self,
        area: float,
        crop: str,
        decades: Optional[List[str]] = None
    ) -> Dict:
        """
        Расчет плана водопользования по декадам.

        Args:
            area: Площадь в гектарах
            crop: Тип культуры
            decades: Список декад для расчета (если None - весь сезон)

        Returns:
            Словарь с результатами расчета
        """
        # Валидация культуры
        if crop not in HYDROMODULE_NGM_III:
            raise ValueError(
                f"Культура '{crop}' не поддерживается. "
                f"Доступные: {list(HYDROMODULE_NGM_III.keys())}"
            )

        # Если декады не указаны, берем все доступные для культуры
        if decades is None:
            decades = [d for d in DECADES_LIST if d in IRRIGATION_DAYS_PER_DECADE.get(crop, {})]

        # Получаем сезонную норму
        seasonal_norm = SEASONAL_IRRIGATION_NORMS.get(crop, 0)
        expected_seasonal_volume = (seasonal_norm * area) / 1000  # в тыс. м³

        # Расчет по декадам
        decade_results = []
        total_volume = 0.0
        explanations = []

        explanations.append(
            f"Расчет выполнен по режиму орошения {self.hydromodule_zone} для зоны Таджикистана"
        )
        explanations.append(
            f"Культура: {crop}, площадь: {area} га, сезонная норма: {seasonal_norm} м³/га"
        )

        for decade_key in decades:
            # Получаем параметры декады
            t0 = IRRIGATION_DAYS_PER_DECADE.get(crop, {}).get(decade_key, 0)
            T = DAYS_IN_DECADE.get(decade_key, 10)
            decade_name = DECADE_NAMES.get(decade_key, decade_key)

            # Определяем фазу роста по месяцу
            month = decade_key.split("_")[0]
            growth_stage = GROWTH_STAGE_BY_MONTH.get(crop, {}).get(month, "active")

            # Получаем поливной гидромодуль для фазы роста
            q0 = HYDROMODULE_NGM_III.get(crop, {}).get(growth_stage, 0.7)

            # Расчет декадного гидромодуля
            qd = self.calculate_decade_hydromodule(q0, t0, T)

            # Расчет расхода Q = qd × площадь (л/с)
            discharge_l_s = qd * area

            # Расчет объема воды по формуле: W = 86.4 × t × Q / 1000
            # Используем t0 (поливные дни), а не T (всего дней в декаде)
            water_volume = self.calculate_water_volume(t0, discharge_l_s)

            total_volume += water_volume

            # Формируем объяснение для декады
            if t0 == 0:
                explanation = f"{decade_name}: полив не требуется"
            elif t0 >= T:
                explanation = (
                    f"{decade_name}: qd = q0 = {q0:.2f} л/с·га "
                    f"(полив весь период, {t0} дней)"
                )
            else:
                explanation = (
                    f"{decade_name}: qd = {q0:.2f} × {t0}/{T} = {qd:.2f} л/с·га "
                    f"(декадный гидромодуль скорректирован по длительности полива)"
                )

            decade_results.append({
                "decade": decade_key,
                "decade_name": decade_name,
                "growth_stage": growth_stage,
                "irrigation_days": t0,
                "total_days": T,
                "q0": round(q0, 2),
                "qd": round(qd, 2),
                "discharge_l_s": round(discharge_l_s, 2),
                "water_volume_thousand_m3": round(water_volume, 3),
                "explanation": explanation
            })

        # Валидация водного баланса
        validation = self.validate_water_balance(
            [d["water_volume_thousand_m3"] for d in decade_results],
            expected_seasonal_volume
        )

        explanations.append(validation["message"])

        # Формируем итоговый результат
        return {
            "area": area,
            "crop": crop,
            "hydromodule_zone": self.hydromodule_zone,
            "seasonal_norm_m3_ha": seasonal_norm,
            "expected_seasonal_volume_thousand_m3": round(expected_seasonal_volume, 3),
            "calculated_total_volume_thousand_m3": round(total_volume, 3),
            "decade_plan": decade_results,
            "validation": validation,
            "explanations": explanations,
            "calculation_method": "Official Tajikistan Irrigation Methodology (Case 1)",
            "formulas_used": [
                "qd = q0 × t0 / T (decade hydromodule)",
                "W = 86.4 × t × Q / 1000 (water volume in thousand m³)",
                "Q = qd × area (discharge in l/s)"
            ]
        }

    def calculate_monthly_plan(
        self,
        area: float,
        crop: str,
        month: str
    ) -> Dict:
        """
        Расчет плана водопользования на месяц (3 декады).

        Args:
            area: Площадь в гектарах
            crop: Тип культуры
            month: Месяц (april, may, june и т.д.)

        Returns:
            Словарь с результатами расчета
        """
        # Формируем список декад для месяца
        decades = [f"{month}_1", f"{month}_2", f"{month}_3"]

        # Фильтруем только существующие декады
        valid_decades = [
            d for d in decades
            if d in IRRIGATION_DAYS_PER_DECADE.get(crop, {})
        ]

        if not valid_decades:
            raise ValueError(
                f"Для культуры '{crop}' не найдены данные для месяца '{month}'"
            )

        # Используем декадный расчет
        result = self.calculate_decade_plan(area, crop, valid_decades)

        # Добавляем информацию о месяце
        result["planning_period"] = "month"
        result["month"] = month

        return result

    def get_crop_info(self, crop: str) -> Dict:
        """
        Получить информацию о культуре.

        Args:
            crop: Тип культуры

        Returns:
            Информация о культуре
        """
        if crop not in HYDROMODULE_NGM_III:
            raise ValueError(f"Культура '{crop}' не поддерживается")

        seasonal_norm = SEASONAL_IRRIGATION_NORMS.get(crop, 0)
        hydromodules = HYDROMODULE_NGM_III.get(crop, {})

        return {
            "crop": crop,
            "seasonal_norm_m3_ha": seasonal_norm,
            "hydromodules": hydromodules,
            "available_decades": list(IRRIGATION_DAYS_PER_DECADE.get(crop, {}).keys())
        }