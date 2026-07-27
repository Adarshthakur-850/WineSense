import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Download, RefreshCw, BarChart2 } from 'lucide-react';

export default function BatchUpload({ wineType, modelName }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('wine_type', wineType);
    formData.append('model_name', modelName);

    try {
      const response = await fetch('http://localhost:8000/api/predict/batch', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to process batch CSV prediction.');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Error occurred connecting to upload API.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPredictedCSV = () => {
    if (!results || !results.predictions.length) return;

    // Header row
    const headers = [
      'row_index', 'fixed acidity', 'volatile acidity', 'citric acid', 'residual sugar',
      'chlorides', 'free sulfur dioxide', 'total sulfur dioxide', 'density', 'pH',
      'sulphates', 'alcohol', 'predicted_class', 'confidence_pct'
    ];

    const rows = results.predictions.map(p => [
      p.row_index,
      p.features['fixed acidity'],
      p.features['volatile acidity'],
      p.features['citric acid'],
      p.features['residual sugar'],
      p.features['chlorides'],
      p.features['free sulfur dioxide'],
      p.features['total sulfur dioxide'],
      p.features['density'],
      p.features['pH'],
      p.features['sulphates'],
      p.features['alcohol'],
      p.prediction,
      p.confidence
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `predicted_${results.wine_type}_wines.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel p-6 space-y-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FileSpreadsheet className="text-wine-500" size={20} />
        Batch CSV Predictions
      </h3>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-xl text-center flex flex-col items-center justify-center border-dashed border-slate-800 hover:border-wine-500/50 transition-colors duration-200 cursor-pointer relative">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="text-slate-500 mb-2" size={32} />
          {file ? (
            <div className="text-sm font-medium text-wine-400 font-mono">{file.name}</div>
          ) : (
            <div className="text-xs text-slate-400">
              Drag & drop or <span className="text-wine-400 underline">browse</span> for wine parameter CSV
              <span className="block mt-1 text-[10px] text-slate-500">Supports comma/semicolon delimited sheets containing wine features</span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-500">
            Selected Model: <strong className="text-slate-400">{modelName}</strong> ({wineType})
          </span>
          <button
            type="submit"
            disabled={loading}
            className="glass-button-primary text-xs flex items-center gap-1.5 py-2 px-4"
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload size={14} />
                Upload & Predict
              </>
            )}
          </button>
        </div>
      </form>

      {/* Predictions Summary Results */}
      {results && (
        <div className="space-y-4 pt-4 border-t border-slate-900">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 text-center">
              <div className="text-slate-500 text-[10px] uppercase font-semibold">Total Records</div>
              <div className="text-xl font-bold font-mono mt-0.5 text-slate-200">{results.summary.total_records}</div>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 text-center">
              <div className="text-slate-500 text-[10px] uppercase font-semibold">Good Quality</div>
              <div className="text-xl font-bold font-mono mt-0.5 text-emerald-400">{results.summary.good_wines}</div>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 text-center">
              <div className="text-slate-500 text-[10px] uppercase font-semibold">Poor Quality</div>
              <div className="text-xl font-bold font-mono mt-0.5 text-rose-400">{results.summary.poor_wines}</div>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 text-center">
              <div className="text-slate-500 text-[10px] uppercase font-semibold">Good Percentage</div>
              <div className="text-xl font-bold font-mono mt-0.5 text-wine-400">{results.summary.good_percentage}%</div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <BarChart2 size={12} className="text-wine-500" />
              Samples Predictions Preview
            </h4>
            <button
              onClick={downloadPredictedCSV}
              className="glass-button-secondary text-xs flex items-center gap-1.5 py-1 px-3"
            >
              <Download size={12} />
              Export Predicted CSV
            </button>
          </div>

          <div className="overflow-x-auto max-h-[200px] border border-slate-900 rounded-lg">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-slate-950 sticky top-0">
                <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                  <th className="py-2 px-3">Row</th>
                  <th className="py-2 px-3">Alcohol</th>
                  <th className="py-2 px-3">pH</th>
                  <th className="py-2 px-3">Volatile Acid</th>
                  <th className="py-2 px-3">Prediction</th>
                  <th className="py-2 px-3">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {results.predictions.map((p, idx) => (
                  <tr key={idx} className="border-b border-slate-900/50 hover:bg-slate-900/10 text-slate-300">
                    <td className="py-2 px-3 font-mono">{p.row_index}</td>
                    <td className="py-2 px-3 font-mono">{p.features.alcohol}%</td>
                    <td className="py-2 px-3 font-mono">{p.features.pH}</td>
                    <td className="py-2 px-3 font-mono">{p.features['volatile acidity']}</td>
                    <td className={`py-2 px-3 font-semibold ${p.prediction === 'Good' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.prediction}
                    </td>
                    <td className="py-2 px-3 font-mono">{p.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
