import React, { useState } from 'react';
import { Sliders, HelpCircle } from 'lucide-react';

const FEATURES_CONFIG = [
  { name: 'fixed acidity', label: 'Fixed Acidity (g/L)', min: 4.0, max: 16.0, step: 0.1, default: 7.4 },
  { name: 'volatile acidity', label: 'Volatile Acidity (g/L)', min: 0.1, max: 1.5, step: 0.01, default: 0.52 },
  { name: 'citric acid', label: 'Citric Acid (g/L)', min: 0.0, max: 1.0, step: 0.01, default: 0.27 },
  { name: 'residual sugar', label: 'Residual Sugar (g/L)', min: 0.5, max: 20.0, step: 0.1, default: 2.2 },
  { name: 'chlorides', label: 'Chlorides (g/L)', min: 0.01, max: 0.2, step: 0.001, default: 0.07 },
  { name: 'free sulfur dioxide', label: 'Free Sulfur Dioxide (mg/L)', min: 1.0, max: 72.0, step: 1.0, default: 15.0 },
  { name: 'total sulfur dioxide', label: 'Total Sulfur Dioxide (mg/L)', min: 5.0, max: 280.0, step: 1.0, default: 46.0 },
  { name: 'density', label: 'Density (g/cm³)', min: 0.985, max: 1.003, step: 0.0001, default: 0.9965 },
  { name: 'pH', label: 'pH Level', min: 2.7, max: 4.0, step: 0.01, default: 3.31 },
  { name: 'sulphates', label: 'Sulphates (g/L)', min: 0.3, max: 2.0, step: 0.01, default: 0.65 },
  { name: 'alcohol', label: 'Alcohol (%)', min: 8.0, max: 15.0, step: 0.1, default: 10.4 }
];

export default function PredictionForm({ onPredictionResult, wineType, setWineType, modelName, setModelName }) {
  const [features, setFeatures] = useState(
    FEATURES_CONFIG.reduce((acc, feat) => {
      acc[feat.name] = feat.default;
      return acc;
    }, {})
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSliderChange = (name, val) => {
    setFeatures({ ...features, [name]: parseFloat(val) });
  };

  const handleReset = () => {
    setFeatures(
      FEATURES_CONFIG.reduce((acc, feat) => {
        acc[feat.name] = feat.default;
        return acc;
      }, {})
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/predict/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wine_type: wineType,
          model_name: modelName,
          features: features
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prediction details from backend.');
      }

      const data = await response.json();
      onPredictionResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred while connecting to prediction server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel glass-panel-hover p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Sliders className="text-wine-500" size={20} />
        Wine Analyzer Inputs
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Toggle options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Wine Variety</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 border border-slate-800 rounded-lg">
              <button
                type="button"
                className={`py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${wineType === 'red' ? 'bg-wine-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => setWineType('red')}
              >
                Red Wine
              </button>
              <button
                type="button"
                className={`py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${wineType === 'white' ? 'bg-wine-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => setWineType('white')}
              >
                White Wine
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">ML Classifier Model</label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full glass-input"
            >
              {['Random Forest', 'XGBoost', 'Decision Tree', 'SVM', 'Logistic Regression', 'Neural Network'].map(model => (
                <option key={model} value={model} className="bg-slate-950 text-slate-100">{model}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
          {FEATURES_CONFIG.map((feat) => (
            <div key={feat.name} className="space-y-1.5 bg-slate-950/20 p-3 rounded-lg border border-slate-900/50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300 font-medium">{feat.label}</span>
                <span className="text-wine-400 font-semibold font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {feat.name === 'density' ? features[feat.name].toFixed(4) : features[feat.name]}
                </span>
              </div>
              
              <input
                type="range"
                min={feat.min}
                max={feat.max}
                step={feat.step}
                value={features[feat.name]}
                onChange={(e) => handleSliderChange(feat.name, e.target.value)}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-wine-600 focus:outline-none"
              />
              
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Min: {feat.min}</span>
                <span>Max: {feat.max}</span>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="glass-button-secondary text-sm"
          >
            Reset sliders
          </button>
          <button
            type="submit"
            disabled={loading}
            className="glass-button-primary text-sm flex items-center justify-center min-w-[150px]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Inference...
              </span>
            ) : 'Analyze Sample'}
          </button>
        </div>
      </form>
    </div>
  );
}
