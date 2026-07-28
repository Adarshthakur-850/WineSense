# 🍷 WineSense AI – Wine Quality Prediction System

An end-to-end machine learning platform that predicts and explains wine quality using physicochemical features using multiple machine learning classifiers.

<p align="center">
  <img src="https://github.com/user-attachments/assets/a5f3b345-de3f-49a4-8594-c062dfd37c12" width="700">
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/61cf67a6-e0d0-414b-b5b9-af326c065049" width="700">
</p>

---

## 🍷 Features

- Dual Wine Variety Prediction (Red & White)
- Explainable AI (Feature Importance Visualization)
- Wine Quality Improvement Recommendations
- Batch CSV Prediction
- Download Prediction Results as CSV
- Model Comparison Dashboard
- Confusion Matrix Visualization
- Prediction History using SQLite
- REST API powered by FastAPI
- Responsive React Frontend

---

## 🛠 Tech Stack

### Backend
- Python 3.10+
- FastAPI
- Scikit-learn
- XGBoost
- Pydantic
- SQLite
- Joblib

### Frontend
- React 18
- Vite
- Tailwind CSS
- Recharts
- Lucide React

### DevOps
- Docker
- Docker Compose
- GitHub Actions

---

# 📁 Project Structure

```text
WineSense/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── config.py
│   │   └── main.py
│   └── tests/
├── frontend/
├── datasets/
├── models/
├── data/
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

# 🚀 Getting Started

## Option 1 — Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/Adarshthakur-850/WineSense.git
cd WineSense
```

---

### 2. Create a Virtual Environment (Optional)

Windows

```bash
python -m venv venv
venv\Scripts\activate
```

Linux/macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

---

### 3. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

---

### 4. Start the FastAPI Backend

```bash
python -m uvicorn backend.app.main:app --reload
```

Backend API:

```
http://127.0.0.1:8000
```

Swagger Documentation:

```
http://127.0.0.1:8000/docs
```

---

### 5. Start the Frontend

Open a new terminal.

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```
http://localhost:5173
```

---

# 🐳 Run with Docker

Build and start the application:

```bash
docker compose up --build
```

or (older Docker versions)

```bash
docker-compose up --build
```

Services:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

---

# 📊 Machine Learning Models

The project evaluates multiple classification models, including:

- Logistic Regression
- Random Forest
- XGBoost
- Support Vector Machine
- Decision Tree

Performance metrics include:

- Accuracy
- Precision
- Recall
- F1-Score
- Confusion Matrix
- Inference Time

---

# 📦 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/predict` | Predict wine quality |
| POST | `/batch-predict` | Predict from CSV |
| GET | `/history` | Prediction history |
| GET | `/metrics` | Model performance |
| GET | `/health` | Health check |

---

# 📸 Screenshots

| Home | Prediction |
|------|------------|
| ![](https://github.com/user-attachments/assets/a5f3b345-de3f-49a4-8594-c062dfd37c12) | ![](https://github.com/user-attachments/assets/61cf67a6-e0d0-414b-b5b9-af326c065049) |

---

# 📄 License

This project is intended for educational and research purposes.
