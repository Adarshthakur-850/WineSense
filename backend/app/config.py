from pathlib import Path

# Paths Setup
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATASETS_DIR = BASE_DIR / "datasets"
MODELS_DIR = BASE_DIR / "models"
DB_DIR = BASE_DIR / "data"

# Create directories if they do not exist
DATASETS_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
DB_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = DB_DIR / "predictions.db"

# UCI Dataset URLs
RED_WINE_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/wine-quality/winequality-red.csv"
WHITE_WINE_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/wine-quality/winequality-white.csv"

# Physicochemical features used by models
WINE_FEATURES = [
    "fixed acidity",
    "volatile acidity",
    "citric acid",
    "residual sugar",
    "chlorides",
    "free sulfur dioxide",
    "total sulfur dioxide",
    "density",
    "pH",
    "sulphates",
    "alcohol"
]

# Classification thresholds
# Score >= 6 is considered "Good" quality wine
GOOD_QUALITY_THRESHOLD = 6
