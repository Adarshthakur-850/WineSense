import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, BarChart2, Shield } from 'lucide-react';

export default function ModelComparison({ wineType }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Random Forest');
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:8000/api/models?wine_type=${wineType}`);
      if (!response.ok) {
        throw new Error('Failed to load model performance metrics.');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err.message || 'Error occurred connecting to metrics API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [wineType]);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const response = await fetch(`http://localhost:8000/api/models/retrain?wine_type=${wineType}`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to launch model training task.');
      }
      alert(`Retraining queued in background for ${wineType} wine models! Retrained values will automatically apply once completed.`);
      setTimeout(fetchMetrics, 3000); // Fetch updated values after a few seconds
    } catch (err) {
      alert(err.message || 'Error retraining models.');
    } finally {
      setRetraining(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 h-full flex flex-col items-center justify-center text-slate-500 py-16">
        <RefreshCw size={36} className="animate-spin text-wine-500 mb-3" />
        <p className="text-sm">Fetching model evaluations and feature weights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 text-rose-400 text-center">
        <p className="font-semibold mb-2">Error Loading Dashboard</p>
        <p className="text-xs mb-4">{error}</p>
        <button onClick={fetchMetrics} className="glass-button-primary text-xs">
          Retry Fetch
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  // Prepare chart data excluding "last_trained" and "wine_type" keys
  const modelNames = ['Random Forest', 'XGBoost', 'Decision Tree', 'SVM', 'Logistic Regression', 'Neural Network'];
  const chartData = modelNames
    .filter(name => metrics[name])
    .map(name => ({
      name: name,
      Accuracy: parseFloat((metrics[name].accuracy * 100).toFixed(1)),
      'F1 Score': parseFloat((metrics[name].f1_score * 100).toFixed(1)),
      'ROC-AUC': parseFloat((metrics[name].roc_auc * 100).toFixed(1)),
    }));

  const selectedModelData = metrics[selectedModel] || null;

  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <BarChart2 className="text-wine-500" size={20} />
          Model Performances ({wineType === 'red' ? 'Red' : 'White'} Variety)
        </h3>
        
        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="glass-button-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
        >
          <RefreshCw size={14} className={retraining ? 'animate-spin' : ''} />
          Retrain All
        </button>
      </div>

      {/* Recharts chart */}
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
              itemStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Accuracy" fill="#a31d51" radius={[4, 4, 0, 0]} />
            <Bar dataKey="F1 Score" fill="#cb3a76" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ROC-AUC" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Grid of evaluations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Model Comparer Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-2.5">Classifier</th>
                <th className="py-2.5">Accuracy</th>
                <th className="py-2.5">F1</th>
                <th className="py-2.5">Inference</th>
              </tr>
            </thead>
            <tbody>
              {modelNames.map(name => {
                if (!metrics[name]) return null;
                const m = metrics[name];
                return (
                  <tr 
                    key={name} 
                    onClick={() => setSelectedModel(name)}
                    className={`border-b border-slate-900 cursor-pointer transition-colors duration-150 ${selectedModel === name ? 'bg-wine-950/20 text-wine-300 font-semibold' : 'text-slate-300 hover:bg-slate-900/30'}`}
                  >
                    <td className="py-2.5 pr-2 font-medium">{name}</td>
                    <td className="py-2.5 font-mono">{(m.accuracy * 100).toFixed(1)}%</td>
                    <td className="py-2.5 font-mono">{(m.f1_score * 100).toFixed(2)}</td>
                    <td className="py-2.5 font-mono text-slate-400">{m.latency_ms.toFixed(1)} ms</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected model details (Confusion Matrix) */}
        {selectedModelData && (
          <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase flex items-center gap-1">
                <Shield size={12} className="text-wine-500" />
                Selected: {selectedModel}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                ROC-AUC: {(selectedModelData.roc_auc).toFixed(3)}
              </span>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-medium text-slate-400">Confusion Matrix Matrix</span>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="font-bold font-mono text-slate-200">{selectedModelData.confusion_matrix.tn}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">True Negative (Poor)</div>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="font-bold font-mono text-rose-400">{selectedModelData.confusion_matrix.fp}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">False Positive</div>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="font-bold font-mono text-rose-400">{selectedModelData.confusion_matrix.fn}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">False Negative</div>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="font-bold font-mono text-emerald-400">{selectedModelData.confusion_matrix.tp}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">True Positive (Good)</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
