import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routes import router
from backend.app.services.data_service import DataService
from backend.app.services.predict_service import PredictService

# Setup logger configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing WineSense AI application services...")
    
    # 1. Verify datasets cache
    try:
        DataService.download_datasets_if_needed()
    except Exception as e:
        logger.error(f"Startup warning: Dataset fetch failed. Offline operations only. Error: {e}")
        
    # 2. Setup SQLite tables
    try:
        PredictService.initialize_database()
    except Exception as e:
        logger.error(f"Startup error initializing database: {e}")

    # 3. Cache base model artifacts (Red Wine RF) on boot to ensure warm starts
    try:
        PredictService.load_model_and_scaler("red", "Random Forest")
        logger.info("WineSense AI service ready.")
    except Exception as e:
        logger.error(f"Startup warning caching model: {e}")
    yield

app = FastAPI(
    title="WineSense AI - Wine Quality Prediction Server",
    description="End-to-end Machine Learning API for predicting and explaining wine quality scores based on chemical composition.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware mapping for react frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API Router
app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "WineSense AI Predictor API",
        "documentation": "/docs"
    }
