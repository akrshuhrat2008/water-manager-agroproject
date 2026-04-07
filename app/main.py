"""Главный файл FastAPI приложения."""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api import calculate

app = FastAPI(
    title="Agro Water MVP",
    description="MVP веб-приложения для планирования водопользования фермерских хозяйств",
    version="0.1.0"
)

# Настройка CORS для работы с frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Vite dev server
        "http://localhost:8000",  # FastAPI (если frontend собран)
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(calculate.router, prefix="/api", tags=["calculation"])

# Информационные endpoints
from app.api import crops
app.include_router(crops.router, prefix="/api", tags=["info"])

# Расширенные endpoints
from app.api import extended
app.include_router(extended.router, prefix="/api", tags=["extended"])

# Импорт/экспорт
from app.api import import_export
app.include_router(import_export.router, prefix="/api", tags=["import-export"])

# Инициализация базы данных
from app.database import init_db
from app.startup import initialize_default_data

init_db()
# Инициализируем реальные данные при первом запуске
initialize_default_data()

# API для управления данными
from app.api import data_management
app.include_router(data_management.router, prefix="/api/data", tags=["data-management"])

# Case 1 - Official Irrigation Methodology
from app.api import case1
app.include_router(case1.router, prefix="/api", tags=["case1-official"])

# Статические файлы для frontend (собранные Vite)
import os
static_dir = "static"
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=f"{static_dir}/assets"), name="assets")
    # Для остальных статических файлов
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
async def root():
    """Главная страница - возвращаем HTML."""
    # В production используем собранные файлы из static
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    # В development используем исходный файл
    elif os.path.exists("frontend/index.html"):
        return FileResponse("frontend/index.html")
    return {"message": "Frontend not found. Run 'npm run build' in frontend directory"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}

