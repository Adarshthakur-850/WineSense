# WineSense AI — Wine Quality Prediction System

An end-to-end machine learning platform that predicts and explains wine quality using physicochemical features and multiple ML classifiers.

## 🍷 Key Features
- **Dual Varieties Toggle**: Classifies and optimizes both Red and White wine varieties using tailored ML classifiers.
- **Explainable AI (XAI)**: Displays real-time feature attribution charts representing which parameters positively or negatively impacted the prediction.
- **Enological Remediation**: Offers chemical adjustment guidelines to improve the wine's quality (e.g. pH adjustments, volatile acidity prevention tips).
- **Batch CSV Upload**: Processes bulk prediction requests from CSV file uploads and enables predicted CSV downloads.
- **Model Comparison Panel**: Lists model accuracies, F1 metrics, inference latency, and displays interactive confusion matrices.
- **Prediction Logs History**: Keeps track of recent predictions inside a local SQLite database for easy reviewing.

---

## 🛠️ Tech Stack
- **Backend**: Python 3.10+, FastAPI, Pydantic, Scikit-learn, XGBoost, SQLite, Joblib.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts.
- **DevOps**: Docker, Docker Compose, GitHub Actions.

---

## 📂 Folder Structure
```text
WineSense AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py
│   │   ├── services/
│   │   │   ├── data_service.py
│   │   │   └── predict_service.py
│   │   ├── config.py
│   │   └── main.py
│   └── tests/
│       └── test_routes.py
├── datasets/             # Local CSV dataset cache
├── models/               # Serialized models and scaling binaries
├── data/                 # SQLite predictions database
├── frontend/             # Vite-React single page application
├── requirements.txt      # Python dependencies requirements list
├── Dockerfile            # Backend Docker instructions
├── docker-compose.yml    # Multi-container conductor
└── README.md
```

---

## 🚀 Quick Start Instructions

### Option A: Local Development Server

#### 1. Backend Setup
1. Change directory to the WineSense AI folder:
   ```bash
   cd "WineSense AI"
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server using Uvicorn:
   ```bash
   python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *The Swagger UI documentation is available at http://127.0.0.1:8000/docs.*

#### 2. Frontend Setup
1. Change directory to the frontend folder:
   ```bash
   cd "WineSense AI/frontend"
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Launch Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

### Option B: Docker Compose (Production Setup)
To launch the entire stack inside containers in a single command, run:
```bash
docker-compose up --build
```
- Frontend will serve on [http://localhost:3000](http://localhost:3000)
- Backend will run on [http://localhost:8000](http://localhost:8000)
