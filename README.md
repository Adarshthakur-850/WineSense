# 🍷 WineSense AI – Wine Quality Prediction System

An end-to-end machine learning platform that predicts, evaluates, and explains wine quality using physicochemical features and multiple machine learning classifiers. The application provides real-time predictions, explainable AI insights, batch processing, and model performance comparisons through an interactive web interface.

<p align="center">
  <img src="https://github.com/user-attachments/assets/a5f3b345-de3f-49a4-8594-c062dfd37c12" alt="WineSense Dashboard" width="800">
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/61cf67a6-e0d0-414b-b5b9-af326c065049" alt="Wine Prediction" width="800">
</p>

---

## 📖 Overview

WineSense AI combines machine learning with explainable AI to help users predict wine quality based on physicochemical properties. Instead of providing only a prediction, the application also explains the factors that influenced the result and suggests possible improvements to enhance wine quality.

---

# ✨ Features

- 🍷 Predicts both **Red** and **White** wine quality
- 📊 Explainable AI (XAI) with feature importance visualization
- 🧪 Wine quality improvement recommendations
- 📂 Batch prediction using CSV upload
- 📥 Download prediction results as CSV
- 📈 Compare multiple machine learning models
- 📉 Interactive Confusion Matrix visualization
- 🕒 Prediction history stored in SQLite
- ⚡ Fast REST API powered by FastAPI
- 🎨 Responsive React + Tailwind CSS interface

---

# 🛠 Tech Stack

## Backend

- Python 3.10+
- FastAPI
- Pydantic
- Scikit-learn
- XGBoost
- Joblib
- SQLite

## Frontend

- React 18
- Vite
- Tailwind CSS
- Recharts
- Lucide React

## DevOps

- Docker
- Docker Compose
- GitHub Actions

---

# 📁 Project Structure

```text
WineSense/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py
│   │   ├── services/
│   │   │   ├── data_service.py
│   │   │   └── predict_service.py
│   │   ├── config.py
│   │   └── main.py
│   │
│   └── tests/
│       └── test_routes.py
│
├── frontend/
│
├── datasets/
│
├── models/
│
├── data/
│
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Make sure the following software is installed:

- Python 3.10 or later
- Node.js 18+
- npm
- Git
- Docker (optional)

---

# 📥 Installation

## 1. Clone the Repository

```bash
git clone https://github.com/Adarshthakur-850/WineSense.git
cd WineSense
```

---

## 2. Create a Virtual Environment (Recommended)

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 3. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Run the Backend

```bash
python -m uvicorn backend.app.main:app --reload
```

The backend will be available at:

```
http://127.0.0.1:8000
```

Swagger API Documentation:

```
http://127.0.0.1:8000/docs
```

---

## 5. Start the Frontend

Open a second terminal.

```bash
cd frontend
npm install
npm run dev
```

Open:

```
http://localhost:5173
```

---

# 🐳 Docker Setup

Build and run the complete application:

```bash
docker compose up --build
```

For older Docker versions:

```bash
docker-compose up --build
```

---

## Services

| Service | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

---

# 🤖 Machine Learning Models

WineSense AI evaluates several supervised learning algorithms.

- Logistic Regression
- Decision Tree
- Random Forest
- Support Vector Machine (SVM)
- XGBoost

The application compares the models using:

- Accuracy
- Precision
- Recall
- F1 Score
- Confusion Matrix
- Prediction Latency

---

# 📡 REST API

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/predict` | Predict wine quality |
| POST | `/batch-predict` | Predict quality from CSV |
| GET | `/history` | Retrieve prediction history |
| GET | `/metrics` | Model performance metrics |
| GET | `/health` | API health status |

---

# 📊 Explainable AI

WineSense AI provides feature attribution for every prediction, allowing users to understand how each physicochemical property influenced the predicted wine quality.

Typical influential features include:

- Alcohol
- Volatile Acidity
- Sulphates
- Citric Acid
- Density
- pH
- Residual Sugar
- Chlorides

---

# 📂 Batch Prediction Workflow

1. Upload a CSV file.
2. Validate the dataset.
3. Generate predictions.
4. View results.
5. Download the predicted CSV.

---

# 🗄 Database

Prediction history is stored locally using **SQLite**, allowing users to review previous predictions without retraining the model.

---

# 📸 Screenshots

## Dashboard

<p align="center">
<img src="https://github.com/user-attachments/assets/a5f3b345-de3f-49a4-8594-c062dfd37c12" width="900">
</p>

## Prediction Result

<p align="center">
<img src="https://github.com/user-attachments/assets/61cf67a6-e0d0-414b-b5b9-af326c065049" width="900">
</p>

---

# 🔮 Future Improvements

- User Authentication
- Cloud Deployment
- Model Retraining Pipeline
- PostgreSQL Integration
- SHAP-Based Explainability
- PDF Prediction Reports
- CI/CD Deployment Pipeline
- Kubernetes Support

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/new-feature
```

3. Commit your changes.

```bash
git commit -m "Add new feature"
```

4. Push your branch.

```bash
git push origin feature/new-feature
```

5. Open a Pull Request.

---

# 📜 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Adarsh Thakur**

- GitHub: https://github.com/Adarshthakur-850

---

⭐ If you found this project useful, consider giving it a **Star** on GitHub.
