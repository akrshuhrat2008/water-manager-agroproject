"""Сервис для работы с погодными данными."""
import random
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import httpx


class WeatherData:
    """Данные о погоде на день."""
    def __init__(
        self,
        date: datetime,
        temperature: float,
        precipitation: float,
        temperature_min: Optional[float] = None,
        temperature_max: Optional[float] = None,
        et0: Optional[float] = None,
        humidity: Optional[float] = None,
        wind_speed: Optional[float] = None
    ):
        """
        Инициализация данных о погоде.

        Args:
            date: Дата прогноза
            temperature: Средняя температура (°C)
            precipitation: Осадки (мм)
            temperature_min: Минимальная температура (°C)
            temperature_max: Максимальная температура (°C)
            et0: Эвапотранспирация (мм/день) - испарение с почвы
            humidity: Влажность воздуха (%)
            wind_speed: Скорость ветра (м/с)
        """
        self.date = date
        self.temperature = temperature
        self.precipitation = precipitation
        self.temperature_min = temperature_min or temperature
        self.temperature_max = temperature_max or temperature
        self.et0 = et0 or self._estimate_et0(temperature, humidity, wind_speed)
        self.humidity = humidity or 60.0
        self.wind_speed = wind_speed or 2.0

    def _estimate_et0(self, temp: float, humidity: Optional[float], wind_speed: Optional[float]) -> float:
        """
        Упрощенная оценка эвапотранспирации (ET₀) методом Харгривса.
        Используется когда нет данных от API.

        Formula: ET₀ ≈ 0.0023 × (T_mean + 17.8) × TD^0.5
        где TD = T_max - T_min (для упрощения берем 10°C)
        """
        # Упрощенная формула для оценки
        td = 10.0  # Средняя разница температур день/ночь
        et0 = 0.0023 * (temp + 17.8) * (td ** 0.5)
        return round(et0, 2)


class WeatherService:
    """Сервис для получения погодных данных через Open-Meteo API."""

    def __init__(self, use_mock: bool = False):
        """
        Инициализация сервиса погоды.

        Args:
            use_mock: Использовать mock данные вместо реального API
        """
        self.use_mock = use_mock
        self.base_url = "https://api.open-meteo.com/v1/forecast"
        self.cache_duration = timedelta(hours=6)  # Кеш на 6 часов
    
    async def get_forecast_async(self, region: str, days: int, db_session=None) -> List[WeatherData]:
        """
        Асинхронное получение прогноза погоды.

        Args:
            region: Регион
            days: Количество дней (до 16)
            db_session: Сессия БД для получения координат

        Returns:
            Список данных о погоде по дням
        """
        if self.use_mock:
            return self._get_mock_forecast(region, days)

        try:
            # Получаем координаты региона
            coords = await self._get_region_coordinates(region, db_session)

            # Запрашиваем данные из Open-Meteo API
            # Формируем диапазон дат начиная с сегодняшнего дня
            from datetime import date, timedelta
            start_date = date.today()
            end_date = start_date + timedelta(days=min(days, 16) - 1)

            async with httpx.AsyncClient() as client:
                params = {
                    "latitude": coords["lat"],
                    "longitude": coords["lon"],
                    "daily": [
                        "temperature_2m_max",
                        "temperature_2m_min",
                        "temperature_2m_mean",
                        "precipitation_sum",
                        "et0_fao_evapotranspiration",  # Эвапотранспирация FAO-56
                        "relative_humidity_2m_mean",
                        "wind_speed_10m_max"
                    ],
                    "timezone": "Asia/Dushanbe",
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                }

                print(f"🌐 Open-Meteo API запрос:")
                print(f"   URL: {self.base_url}")
                print(f"   Регион: {region} ({coords['lat']}, {coords['lon']})")
                print(f"   Даты: {start_date.isoformat()} - {end_date.isoformat()}")

                response = await client.get(self.base_url, params=params, timeout=15.0)
                response.raise_for_status()
                data = response.json()

                # Логируем для отладки
                print(f"✅ Open-Meteo API response:")
                print(f"   Даты в ответе: {data.get('daily', {}).get('time', [])}")
                print(f"   Температуры max: {data.get('daily', {}).get('temperature_2m_max', [])}")
                print(f"   Температуры mean: {data.get('daily', {}).get('temperature_2m_mean', [])}")
                print(f"   Осадки: {data.get('daily', {}).get('precipitation_sum', [])}")

                # Парсим ответ
                return self._parse_open_meteo_response(data, days)

        except Exception as e:
            print(f"❌ Ошибка получения прогноза погоды: {e}, используем mock данные")
            return self._get_mock_forecast(region, days)

    def get_forecast(self, region: str, days: int, db_session=None) -> List[WeatherData]:
        """
        Синхронная обертка для получения прогноза погоды.

        Args:
            region: Регион
            days: Количество дней

        Returns:
            Список данных о погоде по дням
        """
        if self.use_mock:
            return self._get_mock_forecast(region, days)

        try:
            import asyncio
            # Получаем или создаем event loop
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None

            if loop and loop.is_running():
                # Если уже в async контексте, создаем новый loop в потоке
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    future = pool.submit(
                        asyncio.run,
                        self.get_forecast_async(region, days, db_session)
                    )
                    return future.result()
            else:
                # Обычный sync вызов
                return asyncio.run(self.get_forecast_async(region, days, db_session))

        except Exception as e:
            print(f"❌ Ошибка в get_forecast: {e}, используем mock данные")
            return self._get_mock_forecast(region, days)

    async def _get_region_coordinates(self, region: str, db_session=None) -> Dict[str, float]:
        """
        Получить координаты региона из БД или встроенного справочника.

        Args:
            region: Название региона
            db_session: Сессия БД

        Returns:
            Словарь с lat и lon
        """
        # Пытаемся получить из БД
        if db_session:
            try:
                from app.database import Region
                region_obj = db_session.query(Region).filter(
                    Region.name == region.lower(),
                    Region.is_active == 1
                ).first()
                if region_obj:
                    return {"lat": region_obj.latitude, "lon": region_obj.longitude}
            except Exception as e:
                print(f"⚠️ Ошибка чтения региона из БД: {e}")

        # Встроенный справочник регионов Таджикистана
        region_coords = {
            "sughd": {"lat": 40.2833, "lon": 69.6333},  # Худжанд
            "dushanbe": {"lat": 38.5731, "lon": 68.7864},  # Душанбе
            "khatlon": {"lat": 37.8333, "lon": 68.7833},  # Курган-Тюбе
            "gbao": {"lat": 38.4833, "lon": 71.5500},  # Хорог
            "rrs": {"lat": 38.5731, "lon": 68.7864},  # РРП (Душанбе)
        }

        region_lower = region.lower()
        coords = region_coords.get(region_lower)

        if not coords:
            print(f"⚠️ Регион '{region}' не найден, используем Душанбе по умолчанию")
            coords = {"lat": 38.5731, "lon": 68.7864}

        return coords

    def _parse_open_meteo_response(self, data: dict, days: int) -> List[WeatherData]:
        """
        Парсинг ответа от Open-Meteo API.

        Args:
            data: JSON ответ от API
            days: Требуемое количество дней

        Returns:
            Список WeatherData
        """
        daily = data.get("daily", {})
        dates = daily.get("time", [])

        forecast = []

        for i in range(min(len(dates), days)):
            date = datetime.fromisoformat(dates[i])

            # Извлекаем данные (Open-Meteo возвращает списки)
            temp_mean = daily.get("temperature_2m_mean", [])[i] if i < len(daily.get("temperature_2m_mean", [])) else 25.0
            temp_min = daily.get("temperature_2m_min", [])[i] if i < len(daily.get("temperature_2m_min", [])) else temp_mean - 5
            temp_max = daily.get("temperature_2m_max", [])[i] if i < len(daily.get("temperature_2m_max", [])) else temp_mean + 5
            precip = daily.get("precipitation_sum", [])[i] if i < len(daily.get("precipitation_sum", [])) else 0.0
            et0 = daily.get("et0_fao_evapotranspiration", [])[i] if i < len(daily.get("et0_fao_evapotranspiration", [])) else None
            humidity = daily.get("relative_humidity_2m_mean", [])[i] if i < len(daily.get("relative_humidity_2m_mean", [])) else 60.0
            wind = daily.get("wind_speed_10m_max", [])[i] if i < len(daily.get("wind_speed_10m_max", [])) else 2.0

            weather = WeatherData(
                date=date,
                temperature=temp_mean,
                precipitation=precip,
                temperature_min=temp_min,
                temperature_max=temp_max,
                et0=et0,
                humidity=humidity,
                wind_speed=wind
            )

            forecast.append(weather)

        return forecast
    
    def _get_mock_forecast(self, region: str, days: int) -> List[WeatherData]:
        """
        Генерация mock данных о погоде для тестирования.

        Args:
            region: Регион (не используется в mock)
            days: Количество дней

        Returns:
            Список WeatherData с реалистичными данными
        """
        forecast = []
        base_date = datetime.now()

        for i in range(days):
            date = base_date + timedelta(days=i)

            # Генерируем реалистичные данные для Таджикистана (лето)
            temp_min = random.uniform(18, 25)
            temp_max = random.uniform(28, 38)
            temp_mean = (temp_min + temp_max) / 2

            # Вероятность дождя ~20-30%
            precipitation = random.uniform(0, 8) if random.random() < 0.25 else 0

            # Влажность и ветер
            humidity = random.uniform(35, 70)
            wind_speed = random.uniform(1, 5)

            weather = WeatherData(
                date=date,
                temperature=temp_mean,
                precipitation=precipitation,
                temperature_min=temp_min,
                temperature_max=temp_max,
                et0=None,  # Будет рассчитано автоматически
                humidity=humidity,
                wind_speed=wind_speed
            )

            forecast.append(weather)

        return forecast
    
    def get_weather_coefficient(self, weather: WeatherData) -> float:
        """
        Рассчитать коэффициент погоды для расчета полива (упрощенный подход).
        УСТАРЕВШИЙ МЕТОД - используйте calculate_irrigation_need для точного расчета.

        Args:
            weather: Данные о погоде

        Returns:
            Коэффициент (1.0 = норма, >1.0 = больше воды, <1.0 = меньше воды)
        """
        coefficient = 1.0

        # Высокая температура увеличивает потребность в воде
        if weather.temperature > 30:
            coefficient += 0.15
        elif weather.temperature > 35:
            coefficient += 0.25

        # Осадки уменьшают потребность в поливе
        if weather.precipitation > 2.0:
            coefficient -= 0.3
        elif weather.precipitation > 5.0:
            coefficient -= 0.5

        # Низкая влажность увеличивает испарение
        if weather.humidity < 40:
            coefficient += 0.1

        # Сильный ветер увеличивает испарение
        if weather.wind_speed > 4.0:
            coefficient += 0.05

        return max(0.3, coefficient)  # Минимум 30% от нормы

    def calculate_irrigation_need(
        self,
        weather: WeatherData,
        crop_kc: float,
        area_ha: float,
        irrigation_efficiency: float = 0.85
    ) -> float:
        """
        Расчет потребности в воде на основе эвапотранспирации (научный подход FAO-56).

        Формула: Потребность = (ET₀ × Kc - Осадки_эфф) × Площадь / Эффективность

        Args:
            weather: Данные о погоде с ET₀
            crop_kc: Коэффициент культуры (Kc) в данной фазе роста
            area_ha: Площадь участка в гектарах
            irrigation_efficiency: Эффективность системы полива (0.7-0.95)

        Returns:
            Объем воды в м³ на день
        """
        # Получаем эвапотранспирацию (мм/день)
        et0 = weather.et0 if weather.et0 else 0

        # Эвапотранспирация культуры ETc = ET₀ × Kc
        etc = et0 * crop_kc

        # Эффективные осадки (не вся вода от дождя доступна растениям)
        # Упрощенный подход: 80% осадков эффективны
        effective_precipitation = weather.precipitation * 0.8

        # Потребность в поливе (мм/день)
        irrigation_need_mm = max(0, etc - effective_precipitation)

        # Конвертируем мм в м³/га: 1 мм на 1 га = 10 м³
        irrigation_need_m3_per_ha = irrigation_need_mm * 10

        # Общий объем с учетом эффективности системы полива
        total_irrigation_m3 = (irrigation_need_m3_per_ha * area_ha) / irrigation_efficiency

        return round(total_irrigation_m3, 2)

