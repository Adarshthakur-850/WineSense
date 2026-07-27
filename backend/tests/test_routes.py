import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
import json

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "WineSense AI" in data["service"]

def test_get_models_list():
    # Fetch red wine models comparers
    response = client.get("/api/models?wine_type=red")
    assert response.status_code == 200
    data = response.json()
    assert "Random Forest" in data
    assert "XGBoost" in data
    assert "accuracy" in data["Random Forest"]
    assert "feature_importances" in data["Random Forest"]

def test_predict_single():
    payload = {
        "wine_type": "red",
        "model_name": "Random Forest",
        "features": {
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
    response = client.post("/api/predict/single", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert data["wine_type"] == "red"
    assert "probability" in data
    assert "explanation" in data
    assert len(data["explanation"]) == 11
    assert "recommendations" in data

def test_get_history():
    response = client.get("/api/history?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "wine_type" in data[0]
        assert "model_name" in data[0]

def test_predict_batch():
    # Formulate mock CSV data string
    csv_content = (
        "fixed acidity;volatile acidity;citric acid;residual sugar;chlorides;free sulfur dioxide;total sulfur dioxide;density;pH;sulphates;alcohol\n"
        "7.4;0.7;0.0;1.9;0.076;11.0;34.0;0.9978;3.51;0.56;9.4\n"
        "7.8;0.88;0.0;2.6;0.098;25.0;67.0;0.9968;3.2;0.68;9.8\n"
    )
    
    files = {"file": ("test_wines.csv", csv_content, "text/csv")}
    data = {
        "wine_type": "red",
        "model_name": "Logistic Regression"
    }
    
    response = client.post("/api/predict/batch", data=data, files=files)
    assert response.status_code == 200
    res_data = response.json()
    assert "summary" in res_data
    assert res_data["summary"]["total_records"] == 2
    assert "predictions" in res_data
    assert len(res_data["predictions"]) == 2
    assert "confidence" in res_data["predictions"][0]
