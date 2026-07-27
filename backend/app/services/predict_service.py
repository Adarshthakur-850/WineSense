import json
import sqlite3
import logging
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from backend.app.config import MODELS_DIR, DATABASE_PATH, WINE_FEATURES
from backend.app.services.data_service import DataService

logger = logging.getLogger(__name__)

class PredictService:
    _connection = None

    @staticmethod
    def get_db_connection():
        """
        Thread-safe/persistent connection to SQLite prediction database.
        """
        if PredictService._connection is None:
            PredictService._connection = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
            PredictService.initialize_database()
        return PredictService._connection

    @staticmethod
    def initialize_database() -> None:
        """
        Creates prediction history table in SQLite database.
        """
        conn = PredictService.get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                wine_type TEXT NOT NULL,
                model_name TEXT NOT NULL,
                features TEXT NOT NULL,
                predicted_class INTEGER NOT NULL,
                probability REAL NOT NULL
            )
        """)
        conn.commit()

    @staticmethod
    def log_prediction(wine_type: str, model_name: str, features: dict, predicted_class: int, probability: float) -> None:
        """
        Inserts prediction attributes, results, and confidence into SQLite database.
        """
        try:
            conn = PredictService.get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO predictions (timestamp, wine_type, model_name, features, predicted_class, probability) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    wine_type.lower(),
                    model_name,
                    json.dumps(features),
                    int(predicted_class),
                    float(probability)
                )
            )
            conn.commit()
        except Exception as e:
            logger.error(f"Failed to log prediction to database: {e}")

    @staticmethod
    def get_prediction_history(limit: int = 50) -> list:
        """
        Fetches the last N prediction runs from SQLite.
        """
        try:
            conn = PredictService.get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, timestamp, wine_type, model_name, features, predicted_class, probability FROM predictions ORDER BY id DESC LIMIT ?",
                (limit,)
            )
            rows = cursor.fetchall()
            
            history = []
            for r in rows:
                history.append({
                    "id": r[0],
                    "timestamp": r[1],
                    "wine_type": r[2],
                    "model_name": r[3],
                    "features": json.loads(r[4]),
                    "predicted_class": "Good" if r[5] == 1 else "Poor",
                    "probability": r[6]
                })
            return history
        except Exception as e:
            logger.error(f"Failed to retrieve prediction history: {e}")
            return []

    @staticmethod
    def load_model_and_scaler(wine_type: str, model_name: str) -> tuple:
        """
        Loads scaler and model classifier instance. Automatically triggers training if missing.
        """
        wine_type = wine_type.lower()
        clean_model_name = model_name.lower().replace(" ", "_")
        
        scaler_path = MODELS_DIR / f"{wine_type}_scaler.joblib"
        model_path = MODELS_DIR / f"{wine_type}_{clean_model_name}.joblib"
        comparison_path = MODELS_DIR / f"{wine_type}_comparison.json"

        # If any files are missing, run training automatically
        if not scaler_path.exists() or not model_path.exists() or not comparison_path.exists():
            logger.info(f"Model files for {wine_type}/{model_name} missing. Running autotraining...")
            DataService.train_all_models(wine_type)

        scaler = joblib.load(scaler_path)
        model = joblib.load(model_path)
        
        with open(comparison_path, "r") as f:
            comparison = json.load(f)
            
        model_metrics = comparison.get(model_name, {})
        return model, scaler, model_metrics

    @staticmethod
    def predict_single(wine_type: str, model_name: str, features: dict) -> dict:
        """
        Infers wine quality, calculates feature attributions, and returns recommendations.
        """
        wine_type = wine_type.lower()
        
        # 1. Load objects
        model, scaler, metrics = PredictService.load_model_and_scaler(wine_type, model_name)

        # 2. Form features array
        input_data = [features[feat] for feat in WINE_FEATURES]
        input_df = pd.DataFrame([input_data], columns=WINE_FEATURES)

        # 3. Scale input
        scaled_input = scaler.transform(input_df)

        # 4. Predict
        predicted_class = int(model.predict(scaled_input)[0])
        
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(scaled_input)[0]
            probability = float(probs[1]) # Probability of being "Good" quality (class 1)
        else:
            probability = 1.0 if predicted_class == 1 else 0.0

        # Log to database
        PredictService.log_prediction(wine_type, model_name, features, predicted_class, probability)

        # 5. Explainable AI Local Attribution
        explanation = PredictService.calculate_explanations(wine_type, model_name, features, scaled_input[0], metrics)

        # 6. Wine recommendations
        recommendations = PredictService.generate_recommendations(features, explanation)

        return {
            "wine_type": wine_type,
            "model_name": model_name,
            "prediction": "Good" if predicted_class == 1 else "Poor",
            "predicted_class": predicted_class,
            "probability": probability,
            "confidence_pct": round((probability if predicted_class == 1 else (1.0 - probability)) * 100.0, 2),
            "explanation": explanation,
            "recommendations": recommendations,
            "metrics": {
                "accuracy": metrics.get("accuracy", 0.8),
                "f1_score": metrics.get("f1_score", 0.8),
                "roc_auc": metrics.get("roc_auc", 0.85),
                "latency_ms": metrics.get("latency_ms", 1.0)
            }
        }

    @staticmethod
    def calculate_explanations(wine_type: str, model_name: str, raw_features: dict, scaled_input: np.ndarray, metrics: dict) -> list:
        """
        Computes custom Local Feature Attributions showing which factors contributed positively or negatively.
        """
        means_path = MODELS_DIR / f"{wine_type.lower()}_feature_means.json"
        
        # Default means if json is missing
        if means_path.exists():
            with open(means_path, "r") as f:
                feature_means = json.load(f)
        else:
            feature_means = {feat: 0.0 for feat in WINE_FEATURES}

        # Get feature importances / coefficients for this model
        importances = metrics.get("feature_importances", {feat: 1.0 / len(WINE_FEATURES) for feat in WINE_FEATURES})

        explanation = []
        
        for i, feat in enumerate(WINE_FEATURES):
            val = float(raw_features[feat])
            mean_val = float(feature_means.get(feat, 0.0))
            
            # Scaled representation indicates deviation: positive indicates above average, negative below average
            deviation = float(scaled_input[i])
            importance = float(importances.get(feat, 0.0))

            # Attributions score = scaled deviation * model feature weight
            attribution_score = deviation * importance
            
            # Determine contribution classification
            # e.g., for volatile acidity, positive deviation reduces score. Let's adjust signs based on chemical domain
            direction = attribution_score
            
            # Domain adjustments: Volatile acidity, chlorides, density, pH, total sulfur dioxide typically reduce quality when too high
            negative_impact_indicators = ["volatile acidity", "chlorides", "density", "pH", "total sulfur dioxide"]
            positive_impact_indicators = ["alcohol", "sulphates", "citric acid"]
            
            if feat in negative_impact_indicators and val > mean_val:
                # Value is above average for a negative feature -> hurts prediction
                direction = -abs(attribution_score)
            elif feat in negative_impact_indicators and val < mean_val:
                # Value is below average for a negative feature -> helps prediction
                direction = abs(attribution_score)
            elif feat in positive_impact_indicators and val > mean_val:
                # Value is above average for a positive feature -> helps prediction
                direction = abs(attribution_score)
            elif feat in positive_impact_indicators and val < mean_val:
                # Value is below average for a positive feature -> hurts prediction
                direction = -abs(attribution_score)

            explanation.append({
                "feature": feat,
                "value": val,
                "average": mean_val,
                "score": round(direction, 4),
                "impact": "positive" if direction >= 0 else "negative"
            })

        # Sort explanation by magnitude of impact
        explanation.sort(key=lambda x: abs(x["score"]), reverse=True)
        return explanation

    @staticmethod
    def generate_recommendations(raw_features: dict, explanation: list) -> list:
        """
        Reviews feature contributions and provides chemical remediation tips for winemakers.
        """
        recs = []
        
        # Recommendations database based on features
        tips = {
            "volatile acidity": {
                "high": "Volatile acidity (VA) is high (${val} g/L). Volatile acid is primarily acetic acid, which smells like vinegar. Lower VA levels by maintaining sterile cellar conditions, excluding oxygen during aging, and adding sulfur dioxide to inhibit acetic acid bacteria.",
                "low": "Volatile acidity is at a healthy low level (${val} g/L). This keeps the wine clean and fresh."
            },
            "alcohol": {
                "high": "Alcohol level is high (${val}%). This contributes to high body and rating, but ensure it doesn't create hotness on the palate.",
                "low": "Alcohol level is low (${val}%). Consider chaptalization (adding sugar before fermentation) in future batches to achieve higher target levels (above 11%), which helps balance body and structural score."
            },
            "sulphates": {
                "high": "Sulphate content is high (${val} g/L). Excessive sulfites can mask aromas or trigger sensitivities.",
                "low": "Sulphates are low (${val} g/L). Potassium sulfate acts as an antioxidant and antimicrobial. Consider adding sulfites (e.g. Campden tablets) to protect the wine against oxidation and microbial contamination."
            },
            "citric acid": {
                "high": "Citric acid is high (${val} g/L), which may add too much tartness.",
                "low": "Citric acid is low (${val} g/L). Consider adding small amounts of citric or tartaric acid to brighten acidity and balance flat, flabby flavors."
            },
            "pH": {
                "high": "pH is high (${val}). Low acid wines are less stable. Lower pH (target 3.2-3.6) by adding tartaric acid during fermentation, which improves stability, color, and aging potential.",
                "low": "pH is low (${val}). If the wine is excessively sour or acidic, consider triggering malolactic fermentation (MLF) to convert sharp malic acid into rounder lactic acid."
            },
            "chlorides": {
                "high": "Chloride levels are high (${val} g/L), which can impart a salty off-taste. Monitor irrigation water salinity or vineyard soil mineral levels.",
                "low": "Chlorides are low (${val} g/L), keeping the palate clean and balanced."
            }
        }

        # Check negative contributors first
        for exp in explanation:
            feat = exp["feature"]
            val = exp["value"]
            avg = exp["average"]
            
            if exp["impact"] == "negative" and feat in tips:
                if val > avg and "high" in tips[feat]:
                    recs.append({
                        "feature": feat,
                        "suggestion": tips[feat]["high"].replace("${val}", f"{val:.2f}"),
                        "priority": "High"
                    })
                elif val < avg and "low" in tips[feat]:
                    recs.append({
                        "feature": feat,
                        "suggestion": tips[feat]["low"].replace("${val}", f"{val:.2f}"),
                        "priority": "Medium"
                    })

        # Fallback if no negative contributors
        if not recs:
            recs.append({
                "feature": "general",
                "suggestion": "The wine composition is highly optimized! Physicochemical attributes balance perfectly, achieving a solid prediction score.",
                "priority": "Low"
            })
            
        return recs
