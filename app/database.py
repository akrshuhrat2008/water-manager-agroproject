"""Настройка базы данных."""
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# SQLite база данных
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agro_water.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class CalculationHistory(Base):
    """История расчетов."""
    __tablename__ = "calculation_history"

    id = Column(Integer, primary_key=True, index=True)
    area = Column(Float, nullable=False)
    crop = Column(String, nullable=False)
    growth_stage = Column(String, nullable=False)
    days = Column(Integer, nullable=False)
    region = Column(String, nullable=False)
    total_water = Column(Float, nullable=False)
    calculation_data = Column(JSON, nullable=False)  # Полные данные расчета
    created_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)


class ScenarioComparison(Base):
    """Сравнение сценариев."""
    __tablename__ = "scenario_comparisons"

    id = Column(Integer, primary_key=True, index=True)
    scenario_name = Column(String, nullable=False)
    base_scenario_id = Column(Integer, nullable=True)  # ID базового сценария
    area = Column(Float, nullable=False)
    crop = Column(String, nullable=False)
    growth_stage = Column(String, nullable=False)
    days = Column(Integer, nullable=False)
    region = Column(String, nullable=False)
    total_water = Column(Float, nullable=False)
    calculation_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class MultiplePlots(Base):
    """Множественные участки."""
    __tablename__ = "multiple_plots"

    id = Column(Integer, primary_key=True, index=True)
    plot_name = Column(String, nullable=False)
    area = Column(Float, nullable=False)
    crop = Column(String, nullable=False)
    growth_stage = Column(String, nullable=False)
    region = Column(String, nullable=False)
    calculation_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Region(Base):
    """Регионы с координатами и метаданными."""
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    name_ru = Column(String, nullable=False)  # Название на русском
    name_tj = Column(String, nullable=True)  # Название на таджикском
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    country = Column(String, default="Tajikistan")
    description = Column(Text, nullable=True)
    is_active = Column(Integer, default=1)  # 1 = активен, 0 = неактивен
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CropNorm(Base):
    """Нормы полива для культур по регионам."""
    __tablename__ = "crop_norms"

    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(String, nullable=False, index=True)  # cotton, alfalfa, etc.
    region_id = Column(Integer, nullable=True, index=True)  # NULL = общая норма
    norm_per_ha_per_day = Column(Float, nullable=False)  # м³/га/день
    source = Column(String, nullable=True)  # Источник данных
    notes = Column(Text, nullable=True)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def init_db():
    """Инициализация базы данных."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Получить сессию базы данных."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

