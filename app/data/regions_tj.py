"""Реальные данные о регионах Таджикистана."""
from typing import List, Dict

# Регионы Таджикистана с координатами
TAJIKISTAN_REGIONS: List[Dict] = [
    {
        "name": "sughd",
        "name_ru": "Согдийская область",
        "name_tj": "Вилояти Суғд",
        "latitude": 40.2833,
        "longitude": 69.6333,
        "description": "Согдийская область - северный регион Таджикистана, центр - Худжанд"
    },
    {
        "name": "dushanbe",
        "name_ru": "Душанбе",
        "name_tj": "Душанбе",
        "latitude": 38.5731,
        "longitude": 68.7864,
        "description": "Столица Таджикистана"
    },
    {
        "name": "khatlon",
        "name_ru": "Хатлонская область",
        "name_tj": "Вилояти Хатлон",
        "latitude": 37.8333,
        "longitude": 68.7833,
        "description": "Хатлонская область - южный регион, центр - Курган-Тюбе"
    },
    {
        "name": "gbao",
        "name_ru": "Горно-Бадахшанская автономная область",
        "name_tj": "Вилояти Мухтори Кӯҳистони Бадахшон",
        "latitude": 38.4833,
        "longitude": 71.5500,
        "description": "ГБАО - восточный регион, центр - Хорог"
    },
    {
        "name": "rrs",
        "name_ru": "Районы республиканского подчинения",
        "name_tj": "Ноҳияҳои тобеи ҷумҳурӣ",
        "latitude": 38.5731,
        "longitude": 68.7864,
        "description": "РРП - центральный регион вокруг Душанбе"
    },
]

# Реальные нормы полива для Таджикистана (м³/га/день)
# Источник: агрономические нормы для условий Таджикистана
TAJIKISTAN_CROP_NORMS: Dict[str, Dict[str, float]] = {
    "cotton": {
        "default": 70.0,  # Общая норма
        "sughd": 72.0,    # Согдийская область
        "khatlon": 68.0,  # Хатлонская область
        "dushanbe": 70.0,
        "rrs": 70.0,
    },
    "alfalfa": {
        "default": 60.0,
        "sughd": 62.0,
        "khatlon": 58.0,
        "dushanbe": 60.0,
        "rrs": 60.0,
    },
    "grain": {
        "default": 40.0,
        "sughd": 42.0,
        "khatlon": 38.0,
        "dushanbe": 40.0,
        "rrs": 40.0,
    },
    "orchard": {
        "default": 50.0,
        "sughd": 52.0,
        "khatlon": 48.0,
        "dushanbe": 50.0,
        "rrs": 50.0,
    },
}

