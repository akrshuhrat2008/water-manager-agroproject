"""Главный файл FastAPI приложения."""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="Agro Water MVP",
    description="MVP веб-приложения для планирования водопользования фермерских хозяйств",
    version="0.1.0"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://water-manager-agroproject.onrender.com",   # твой render url
        "https://water-manager-agroproject.vercel.app",     # если используешь vercel
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем все API роутеры
from app.api import calculate
app.include_router(calculate.router, prefix="/api", tags=["calculation"])

from app.api import crops
app.include_router(crops.router, prefix="/api", tags=["info"])

from app.api import extended
app.include_router(extended.router, prefix="/api", tags=["extended"])

from app.api import import_export
app.include_router(import_export.router, prefix="/api", tags=["import-export"])

from app.api import data_management
app.include_router(data_management.router, prefix="/api/data", tags=["data-management"])

from app.api import case1
app.include_router(case1.router, prefix="/api", tags=["case1-official"])

# === Главное: Отдаём фронтенд по корневому пути ===
static_dir = "static"

if os.path.exists(static_dir):
    # Монтируем статику так, чтобы index.html открывался по адресу /
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    print("Warning: Folder 'static' not found. Please run 'npm run build' in frontend folder.")

# Для совместимости оставляем старые пути
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static_old")
    app.mount("/assets", StaticFiles(directory=f"{static_dir}/assets"), name="assets")

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/docs")
async def docs():
    return {"message": "API documentation available at /docs"}