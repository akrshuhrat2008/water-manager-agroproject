"""Сервис для расчета водопользования."""
from typing import List, Optional
from app.data.crops import CROPS, GROWTH_COEFFICIENT, CROP_KC, IRRIGATION_EFFICIENCY
from app.services.weather import WeatherService, WeatherData
from app.models.schemas import DailyPlanItem


class WaterCalculationService:
    """Сервис для расчета потребности в воде."""

    def __init__(self, weather_service: WeatherService, use_scientific_method: bool = True):
        """
        Инициализация сервиса расчета.

        Args:
            weather_service: Сервис погоды
            use_scientific_method: Использовать научный метод с ET₀ (FAO-56)
        """
        self.weather_service = weather_service
        self.use_scientific_method = use_scientific_method
    
    def calculate(
        self,
        area: float,
        crop: str,
        growth_stage: str,
        days: int,
        region: str,
        irrigation_type: str = "default",
        db_session=None
    ) -> dict:
        """
        Рассчитать потребность в воде.

        Args:
            area: Площадь в гектарах
            crop: Тип культуры
            growth_stage: Фаза роста
            days: Количество дней
            region: Регион
            irrigation_type: Тип системы полива (drip, sprinkler, surface, furrow, default)
            db_session: Сессия БД для координат региона

        Returns:
            Словарь с результатами расчета
        """
        # Получаем базовые данные
        base_norm = CROPS.get(crop, 50)
        growth_coeff = GROWTH_COEFFICIENT.get(growth_stage, 1.0)

        # Коэффициент культуры Kc для научного метода
        crop_kc = CROP_KC.get(crop, {}).get(growth_stage, 0.8)

        # Эффективность системы полива
        irrigation_eff = IRRIGATION_EFFICIENCY.get(irrigation_type, 0.70)

        # Получаем прогноз погоды с реальными данными
        weather_forecast = self.weather_service.get_forecast(region, days, db_session)

        # Рассчитываем план по дням
        daily_plan: List[DailyPlanItem] = []
        total_water = 0.0
        recommendations = []

        high_temp_days = 0
        rain_days = 0
        low_humidity_days = 0
        high_wind_days = 0

        for i, weather in enumerate(weather_forecast):
            day_num = i + 1

            # Выбираем метод расчета
            if self.use_scientific_method and weather.et0:
                # Научный метод с эвапотранспирацией (FAO-56)
                daily_water = self.weather_service.calculate_irrigation_need(
                    weather=weather,
                    crop_kc=crop_kc,
                    area_ha=area,
                    irrigation_efficiency=irrigation_eff
                )
            else:
                # Упрощенный метод (старый)
                weather_coeff = self.weather_service.get_weather_coefficient(weather)
                daily_water = area * base_norm * growth_coeff * weather_coeff

            # Определяем комментарий и корректируем объем
            # Приоритет: сильный дождь > легкий дождь > экстремальная жара > жара > засуха > ветер > норма
            note = "normal"

            # Проверка осадков (высший приоритет)
            if weather.precipitation > 5.0:
                note = "heavy_rain"
                rain_days += 1
                daily_water = 0  # Сильный дождь - полив не нужен
            elif weather.precipitation > 2.0:
                note = "rain_expected"
                rain_days += 1
                daily_water = daily_water * 0.3  # Легкий дождь - снижаем полив на 70%
            # Проверка температуры
            elif weather.temperature_max > 35:
                note = "extreme_temperature"
                high_temp_days += 1
            elif weather.temperature_max > 30:
                note = "high_temperature"
                high_temp_days += 1
            # Проверка влажности (засуха)
            elif weather.humidity < 30:
                note = "low_humidity"
                low_humidity_days += 1
            # Проверка ветра
            elif weather.wind_speed > 7.0:
                note = "high_wind"
                high_wind_days += 1

            # Дополнительные условия для статистики
            if weather.humidity < 35 and note != "low_humidity":
                low_humidity_days += 1
            if weather.wind_speed > 5.0 and note != "high_wind":
                high_wind_days += 1

            daily_plan.append(DailyPlanItem(
                day=day_num,
                water=round(daily_water, 2),
                note=note,
                weather={
                    "temperature": round(weather.temperature_max, 1),  # Макс. температура
                    "temperature_min": round(weather.temperature_min, 1),  # Мин. температура
                    "precipitation": round(weather.precipitation, 1),
                    "wind_speed": round(weather.wind_speed, 1),
                    "humidity": round(weather.humidity, 0)
                }
            ))

            total_water += daily_water
        
        # Рассчитываем статистику
        avg_daily_water = total_water / days if days > 0 else 0
        max_daily_water = max([item.water for item in daily_plan]) if daily_plan else 0
        min_daily_water = min([item.water for item in daily_plan if item.water > 0]) if daily_plan else 0
        
        # Формируем рекомендации на основе анализа погоды
        if rain_days > 0:
            recommendations.append(
                f"[cloud-rain] Ожидаются осадки в {rain_days} день(дня) — расчет уже учитывает снижение полива"
            )
            recommendations.append(
                f"[lightbulb] Совет: В дни с осадками >5мм полив не требуется — экономия воды до 100%"
            )

        if high_temp_days > 0:
            recommendations.append(
                f"[thermometer] Высокая температура ожидается в {high_temp_days} день(дня) — расход воды увеличен"
            )
            recommendations.append(
                f"[lightbulb] Совет: Поливайте рано утром (5-7 ч) или вечером (19-21 ч) для снижения испарения"
            )

        if low_humidity_days > 0:
            recommendations.append(
                f"[wind] Низкая влажность воздуха ожидается в {low_humidity_days} день(дня) — усилено испарение"
            )

        if high_wind_days > 0:
            recommendations.append(
                f"[wind] Сильный ветер ожидается в {high_wind_days} день(дня) — увеличьте частоту поливов"
            )
        
        # Рекомендации по фазам роста и культуре
        from app.data.crops import GROWTH_STAGE_INFO
        growth_info = GROWTH_STAGE_INFO.get(growth_stage, {})

        if growth_stage == "early":
            kc_value = crop_kc if self.use_scientific_method else growth_coeff
            recommendations.append(f"[sprout] Ранняя фаза роста — коэффициент культуры Kc={kc_value:.2f}")
            recommendations.append("[lightbulb] Совет: Фокус на развитие корневой системы — умеренный полив")
        elif growth_stage == "active":
            kc_value = crop_kc if self.use_scientific_method else growth_coeff
            recommendations.append(f"[wheat] Активная фаза — максимальная потребность в воде (Kc={kc_value:.2f})")
            recommendations.append("[lightbulb] Совет: Критический период — обеспечьте достаточный полив, дефицит недопустим")
        elif growth_stage == "late":
            kc_value = crop_kc if self.use_scientific_method else growth_coeff
            recommendations.append(f"[leaf] Поздняя фаза роста — снижение полива (Kc={kc_value:.2f})")
            recommendations.append("[lightbulb] Совет: Избегайте переувлажнения за 7-10 дней до уборки")

        # Рекомендации по системе полива
        if irrigation_type != "default":
            eff_percent = int(irrigation_eff * 100)
            recommendations.append(
                f"[droplet] Система полива: {irrigation_type} (эффективность {eff_percent}%) — "
                f"объем скорректирован с учетом потерь"
            )
            if irrigation_type == "drip":
                recommendations.append("[check-circle] Капельный полив — наиболее эффективный метод для экономии воды")
            elif irrigation_type in ["surface", "furrow"]:
                recommendations.append("[alert-triangle] Рассмотрите переход на капельный полив для экономии до 30% воды")

        # Рекомендации по объему
        expected_daily = base_norm * area
        if avg_daily_water > expected_daily * 1.3:
            recommendations.append("[bar-chart] Высокий расход воды — проверьте систему на утечки и эффективность")
        elif avg_daily_water < expected_daily * 0.5:
            recommendations.append("[bar-chart] Низкий расход воды — возможно недостаточно для культуры, проверьте расчет")

        # Информация о методе расчета
        if self.use_scientific_method:
            recommendations.append(
                "[microscope] Расчет выполнен по методу FAO-56 с учетом эвапотранспирации (ET₀) — научно обоснованный подход"
            )

        if not recommendations:
            recommendations.append("[check-circle] Погодные условия нормальные, расчет выполнен успешно")
        
        # Добавляем информацию о культуре
        from app.data.crops import CROP_INFO
        crop_info = CROP_INFO.get(crop, {})
        
        # Формируем итоговый результат
        return {
            "total_water": round(total_water, 2),
            "daily_plan": daily_plan,
            "recommendations": recommendations,
            "statistics": {
                "average_daily": round(avg_daily_water, 2),
                "max_daily": round(max_daily_water, 2),
                "min_daily": round(min_daily_water, 2),
                "total_days": days,
                "rain_days": rain_days,
                "high_temp_days": high_temp_days,
                "low_humidity_days": low_humidity_days,
                "high_wind_days": high_wind_days
            },
            "crop_info": crop_info,
            "growth_stage_info": growth_info,
            "base_norm": base_norm,
            "growth_coefficient": growth_coeff,
            "crop_kc": crop_kc,  # Новый научный коэффициент
            "irrigation_efficiency": irrigation_eff,
            "calculation_method": "FAO-56 (ET₀)" if self.use_scientific_method else "Simplified",
            "irrigation_type": irrigation_type
        }

