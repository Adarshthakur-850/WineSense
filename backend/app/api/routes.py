from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
import pandas as pd
import json
import logging
from typing import Dict, List
import io

from backend.app.config import WINE_FEATURES, MODELS_DIR
from backend.app.services.data_service import DataService
from backend.app.services.predict_service import PredictService

logger = logging.getLogger(__name__)
router = APIRouter()

# Schema for wine properties input validation
class WineFeaturesInput(BaseModel):
    fixed_acidity: float = Field(..., alias="fixed acidity", description="Fixed acidity (g/L)", ge=0.0)
    volatile_acidity: float = Field(..., alias="volatile acidity", description="Volatile acidity (g/L)", ge=0.0)
    citric_acid: float = Field(..., alias="citric acid", description="Citric acid (g/L)", ge=0.0)
    residual_sugar: float = Field(..., alias="residual sugar", description="Residual sugar (g/L)", ge=0.0)
    chlorides: float = Field(..., description="Chlorides (g/L)", ge=0.0)
    free_sulfur_dioxide: float = Field(..., alias="free sulfur dioxide", description="Free sulfur dioxide (mg/L)", ge=0.0)
    total_sulfur_dioxide: float = Field(..., alias="total sulfur dioxide", description="Total sulfur dioxide (mg/L)", ge=0.0)
    density: float = Field(..., description="Density (g/cm³)", ge=0.0)
    pH: float = Field(..., description="pH level (0-14)", ge=0.0, le=14.0)
    sulphates: float = Field(..., description="Sulphates (g/L)", ge=0.0)
    alcohol: float = Field(..., description="Alcohol content (%)", ge=0.0, le=100.0)

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "fixed acidity": 7.4,
                "volatile acidity": 0.7,
                "citric acid": 0.0,
                "residual sugar": 1.9,
                "chlorides": 0.076,
                "free sulfur dioxide": 11.0,
                "total sulfur dioxide": 34.0,
                "density": 0.9978,
                "pH": 3.51,
                "sulphates": 0.56,
                "alcohol": 9.4
            }
        }
    }

class PredictRequest(BaseModel):
    wine_type: str = Field("red", pattern="^(red|white)$")
    model_name: str = Field("Random Forest", pattern="^(Random Forest|XGBoost|Decision Tree|SVM|Logistic Regression|Neural Network)$")
    features: WineFeaturesInput

@router.get("/models")
def get_models_comparison(wine_type: str = Query("red", pattern="^(red|white)$")):
    """
    Returns comparative performance metrics and feature importances for all trained models.
    """
    comparison_path = MODELS_DIR / f"{wine_type.lower()}_comparison.json"
    
    if not comparison_path.exists():
        logger.info(f"Comparison metrics file for {wine_type} not found. Running training first.")
        try:
            DataService.train_all_models(wine_type)
        except Exception as e:
            logger.error(f"Failed to auto-train models: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to train models: {str(e)}")

    try:
        with open(comparison_path, "r") as f:
            metrics = json.load(f)
        return metrics
    except Exception as e:
        logger.error(f"Failed to read model metrics file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to read metrics: {str(e)}")

@router.get("/history")
def get_prediction_history(limit: int = Query(50, ge=1, le=100)):
    """
    Fetches the last N prediction events from the SQLite database.
    """
    history = PredictService.get_prediction_history(limit)
    return history

@router.post("/predict/single")
def predict_wine_quality(request: PredictRequest):
    """
    Predicts quality class (Good/Poor), computes explanations and recommendations for a single wine.
    """
    try:
        # Convert Pydantic features schema to standard dictionary (handling field aliases)
        features_dict = request.features.model_dump(by_alias=True)
        
        result = PredictService.predict_single(
            wine_type=request.wine_type,
            model_name=request.model_name,
            features=features_dict
        )
        return result
    except Exception as e:
        logger.error(f"Error executing prediction endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.post("/predict/batch")
async def predict_wine_quality_batch(
    wine_type: str = Form("red", pattern="^(red|white)$"),
    model_name: str = Form("Random Forest", pattern="^(Random Forest|XGBoost|Decision Tree|SVM|Logistic Regression|Neural Network)$"),
    file: UploadFile = File(...)
):
    """
    Uploads a CSV file of wine samples, parses columns, performs batch predictions, and returns summaries.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        contents = await file.read()
        
        # Detect delimiter (comma or semicolon)
        first_line = contents.decode('utf-8', errors='ignore').split('\n')[0]
        separator = ';' if ';' in first_line else ','
        
        df = pd.read_csv(io.BytesIO(contents), sep=separator)
        
        # Verify required columns are present (case-insensitive and alias-resolved)
        # Standardize columns to lower-case with spaces for mapping
        df.columns = [col.lower().strip() for col in df.columns]
        
        # Map aliases if present (e.g. fixed_acidity -> fixed acidity)
        col_mappings = {
            "fixed_acidity": "fixed acidity",
            "volatile_acidity": "volatile acidity",
            "citric_acid": "citric acid",
            "residual_sugar": "residual sugar",
            "free_sulfur_dioxide": "free sulfur dioxide",
            "total_sulfur_dioxide": "total sulfur dioxide"
        }
        df.rename(columns=col_mappings, inplace=True)
        
        feature_map = {feat.lower(): feat for feat in WINE_FEATURES}
        missing_cols = [feat for feat in WINE_FEATURES if feat.lower() not in df.columns]
        if missing_cols:
            raise ValueError(f"Uploaded CSV is missing required columns: {missing_cols}")

        # Rename to exact required casing
        df.rename(columns={col: feature_map[col] for col in df.columns if col in feature_map}, inplace=True)

        # Fill any missing rows with default averages
        df = df[WINE_FEATURES]
        df.fillna(df.mean(), inplace=True)

        # Load model and scaler
        model, scaler, metrics = PredictService.load_model_and_scaler(wine_type, model_name)

        # Scale all data rows
        scaled_features = scaler.transform(df)
        
        # Predict classes
        predictions = model.predict(scaled_features)
        
        # Predict probabilities
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(scaled_features)[:, 1]
        else:
            probabilities = predictions.astype(float)

        # Build output rows list
        results_list = []
        for idx, row in df.iterrows():
            pred_class = int(predictions[idx])
            prob = float(probabilities[idx])
            
            # Log individual predictions to database for historical tracking
            row_dict = row.to_dict()
            PredictService.log_prediction(wine_type, model_name, row_dict, pred_class, prob)
            
            results_list.append({
                "row_index": idx + 1,
                "features": row_dict,
                "prediction": "Good" if pred_class == 1 else "Poor",
                "confidence": round((prob if pred_class == 1 else (1.0 - prob)) * 100.0, 2),
                "probability": prob
            })

        # Calculate aggregations
        total = len(results_list)
        good_count = sum(1 for r in results_list if r["prediction"] == "Good")
        poor_count = total - good_count
        good_percentage = (good_count / total) * 100.0 if total > 0 else 0.0

        return {
            "wine_type": wine_type,
            "model_name": model_name,
            "summary": {
                "total_records": total,
                "good_wines": good_count,
                "poor_wines": poor_count,
                "good_percentage": round(good_percentage, 2)
            },
            "predictions": results_list
        }
        
    except Exception as e:
        logger.error(f"Error processing batch prediction: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to process CSV file. Error: {str(e)}")

@router.post("/models/retrain")
def retrain_models(
    wine_type: str = Query("red", pattern="^(red|white)$"),
    background_tasks: BackgroundTasks = None
):
    """
    Triggers model training in background task for either red or white wine datasets.
    """
    if background_tasks is None:
        raise HTTPException(status_code=400, detail="BackgroundTasks dependency required.")
        
    try:
        background_tasks.add_task(DataService.train_all_models, wine_type)
        return {
            "status": "success",
            "message": f"Background retraining triggered for {wine_type} wine models."
        }
    except Exception as e:
        logger.error(f"Error triggering background retraining: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger retraining: {str(e)}")
