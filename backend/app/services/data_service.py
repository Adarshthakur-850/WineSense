import os
import urllib.request
import json
import logging
import time
import numpy as np
import pandas as pd
import joblib
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

# Models imports
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from xgboost import XGBClassifier

from backend.app.config import (
    DATASETS_DIR, MODELS_DIR, RED_WINE_URL, WHITE_WINE_URL, 
    WINE_FEATURES, GOOD_QUALITY_THRESHOLD
)

logger = logging.getLogger(__name__)

class DataService:
    @staticmethod
    def get_dataset_paths() -> dict:
        """
        Returns absolute paths of local dataset files.
        """
        return {
            "red": DATASETS_DIR / "winequality-red.csv",
            "white": DATASETS_DIR / "winequality-white.csv"
        }

    @staticmethod
    def download_datasets_if_needed() -> None:
        """
        Downloads Wine Quality datasets from UCI ML repository if they are not already cached.
        """
        paths = DataService.get_dataset_paths()
        
        # Download Red Wine Dataset
        if not paths["red"].exists():
            logger.info("Downloading Red Wine Dataset from UCI...")
            try:
                urllib.request.urlretrieve(RED_WINE_URL, paths["red"])
                logger.info("Successfully downloaded Red Wine Dataset.")
            except Exception as e:
                logger.error(f"Failed to download Red Wine Dataset: {e}")
                raise e

        # Download White Wine Dataset
        if not paths["white"].exists():
            logger.info("Downloading White Wine Dataset from UCI...")
            try:
                urllib.request.urlretrieve(WHITE_WINE_URL, paths["white"])
                logger.info("Successfully downloaded White Wine Dataset.")
            except Exception as e:
                logger.error(f"Failed to download White Wine Dataset: {e}")
                raise e

    @staticmethod
    def load_and_preprocess(wine_type: str = "red") -> tuple:
        """
        Loads dataset, performs pre-processing, scales features, and saves the scaler.
        Returns scaled training/testing sets, target labels, and the original features.
        """
        DataService.download_datasets_if_needed()
        paths = DataService.get_dataset_paths()
        filepath = paths.get(wine_type.lower())

        if not filepath or not filepath.exists():
            raise FileNotFoundError(f"Dataset for wine type '{wine_type}' not found.")

        # Semicolon delimited files
        df = pd.read_csv(filepath, sep=';')
        
        # Handle outliers / clean dataset (Wine dataset is generally complete, but fillna for robustness)
        df.fillna(df.mean(), inplace=True)
        
        # Split features and label
        X = df[WINE_FEATURES]
        # Binary target: 1 for quality >= threshold (good), else 0 (poor)
        y = (df['quality'] >= GOOD_QUALITY_THRESHOLD).astype(int)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        # Save scaler instance
        scaler_path = MODELS_DIR / f"{wine_type.lower()}_scaler.joblib"
        joblib.dump(scaler, scaler_path)

        # Store training dataset averages for Explainable AI reference
        feature_means = X.mean().to_dict()
        with open(MODELS_DIR / f"{wine_type.lower()}_feature_means.json", "w") as f:
            json.dump(feature_means, f, indent=4)

        return X_train_scaled, X_test_scaled, y_train, y_test, X

    @staticmethod
    def train_all_models(wine_type: str = "red") -> dict:
        """
        Trains five classifiers, evaluates performance metrics, exports models, and aggregates comparison JSON.
        """
        wine_type = wine_type.lower()
        logger.info(f"Initiating training pipeline for '{wine_type}' wine classification.")

        # 1. Load and preprocess
        X_train, X_test, y_train, y_test, X_raw = DataService.load_and_preprocess(wine_type)

        # 2. Define models to train
        models_dict = {
            "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42, max_depth=12),
            "XGBoost": XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=6, eval_metric="logloss", random_state=42),
            "Decision Tree": DecisionTreeClassifier(max_depth=8, random_state=42),
            "SVM": SVC(probability=True, kernel="rbf", C=1.5, random_state=42),
            "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
            "Neural Network": MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42)
        }

        comparison_results = {}
        
        # 3. Train and Evaluate each model
        for name, clf in models_dict.items():
            start_time = time.time()
            clf.fit(X_train, y_train)
            latency_ms = (time.time() - start_time) * 1000.0

            # Predict labels
            y_pred = clf.predict(X_test)
            
            # Predict probabilities
            if hasattr(clf, "predict_proba"):
                y_prob = clf.predict_proba(X_test)[:, 1]
            else:
                y_prob = y_pred.astype(float)

            # Metrics
            acc = float(accuracy_score(y_test, y_pred))
            prec = float(precision_score(y_test, y_pred, zero_division=0))
            rec = float(recall_score(y_test, y_pred, zero_division=0))
            f1 = float(f1_score(y_test, y_pred, zero_division=0))
            roc_auc = float(roc_auc_score(y_test, y_prob))
            
            cm = confusion_matrix(y_test, y_pred)
            # Normalize matrix to counts
            tn, fp, fn, tp = map(int, cm.ravel())

            # Save classifier binary
            clean_name = name.lower().replace(" ", "_")
            model_path = MODELS_DIR / f"{wine_type}_{clean_name}.joblib"
            joblib.dump(clf, model_path)

            # Compute feature importances if available
            importances = {}
            if hasattr(clf, "feature_importances_"):
                importances = dict(zip(WINE_FEATURES, map(float, clf.feature_importances_)))
            elif isinstance(clf, LogisticRegression):
                # Use absolute coefficients as feature importance
                coefs = np.abs(clf.coef_[0])
                normalized_coefs = coefs / np.sum(coefs)
                importances = dict(zip(WINE_FEATURES, map(float, normalized_coefs)))
            else:
                # Permutation/importance fallback: assume equal or simple correlation fallback
                importances = {feat: 1.0 / len(WINE_FEATURES) for feat in WINE_FEATURES}

            comparison_results[name] = {
                "accuracy": acc,
                "precision": prec,
                "recall": rec,
                "f1_score": f1,
                "roc_auc": roc_auc,
                "latency_ms": latency_ms,
                "confusion_matrix": {
                    "tn": tn,
                    "fp": fp,
                    "fn": fn,
                    "tp": tp
                },
                "feature_importances": importances
            }

            logger.info(f"Model {name} trained: Acc={acc:.3f}, F1={f1:.3f}, Latency={latency_ms:.1f}ms")

        # Save comparative metadata JSON
        comparison_results["last_trained"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        comparison_results["wine_type"] = wine_type
        
        with open(MODELS_DIR / f"{wine_type}_comparison.json", "w") as f:
            json.dump(comparison_results, f, indent=4)

        return comparison_results
