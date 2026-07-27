import React, { useState, useEffect } from 'react';
import { Wine, LineChart, FileSpreadsheet, History, Award, BookOpen } from 'lucide-react';
import PredictionForm from './components/PredictionForm';
import ExplanationPanel from './components/ExplanationPanel';
import ModelComparison from './components/ModelComparison';
import BatchUpload from './components/BatchUpload';

export default function App() {
  const [wineType, setWineType] = useState('red');
  const [modelName, setModelName] = useState('Random Forest');
  const [predictionData, setPredictionData] = useState(null);
  
  const [activeTab, setActiveTab] = useState('comparer'); // 'comparer', 'batch', 'history'
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/history?limit=30');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to load history list:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, predictionData]); // reload history when tab switches or a new prediction is ran

  return (
    <div className="min-h-screen flex flex-col pb-8">
      {/* Header Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-wine-950/60 border border-wine-800 p-2 rounded-xl text-wine-500 shadow-lg shadow-wine-950/30">
              <Wine size={26} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
                WineSense <span className="text-wine-500 font-extrabold text-xs bg-wine-500/10 border border-wine-500/20 px-2 py-0.5 rounded-full">AI</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">PHYSIOCHEMICAL WINE QUALITY ANALYTICS</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              API Node: Online
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-wine-950/30 to-slate-900/10 border border-wine-900/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="max-w-2xl space-y-2 relative z-10">
            <h2 className="text-2xl font-bold text-slate-100">Sommelier Intelligence Engine</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Analyze and optimize wine products using advanced machine learning models. Predict quality classifications instantly based on acidity, density, sugar, pH, and alcohol, and receive actionable enological corrections.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 opacity-5 w-1/3 flex items-center justify-center pointer-events-none">
            <Wine size={180} />
          </div>
        </div>

        {/* Dashboard Panels Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Hand: Controls Form */}
          <div className="lg:col-span-5 space-y-6">
            <PredictionForm 
              onPredictionResult={(data) => setPredictionData(data)}
              wineType={wineType}
              setWineType={setWineType}
              modelName={modelName}
              setModelName={setModelName}
            />
          </div>

          {/* Right Hand: Visualizations & Analytics */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Visual attributions showing results */}
            <ExplanationPanel predictionData={predictionData} />

            {/* Subpages Tabs Navigations */}
            <div className="glass-panel p-1 flex bg-slate-950/40 border border-slate-900 rounded-xl">
              <button
                onClick={() => setActiveTab('comparer')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${activeTab === 'comparer' ? 'bg-wine-950/40 text-wine-400 border border-wine-900/30 shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <LineChart size={14} />
                Model Comparer
              </button>
              <button
                onClick={() => setActiveTab('batch')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${activeTab === 'batch' ? 'bg-wine-950/40 text-wine-400 border border-wine-900/30 shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <FileSpreadsheet size={14} />
                Batch Uploader
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${activeTab === 'history' ? 'bg-wine-950/40 text-wine-400 border border-wine-900/30 shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <History size={14} />
                Inference History
              </button>
            </div>

            {/* Tabs Content */}
            <div className="transition-all duration-300">
              {activeTab === 'comparer' && (
                <ModelComparison wineType={wineType} />
              )}

              {activeTab === 'batch' && (
                <BatchUpload wineType={wineType} modelName={modelName} />
              )}

              {activeTab === 'history' && (
                <div className="glass-panel p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <History className="text-wine-500" size={20} />
                      Historical Predictions Logs
                    </h3>
                    <button 
                      onClick={fetchHistory}
                      className="glass-button-secondary text-[10px] py-1 px-2.5 flex items-center gap-1"
                    >
                      Refresh Logs
                    </button>
                  </div>

                  {historyLoading ? (
                    <div className="text-center py-10 text-xs text-slate-500 animate-pulse">Loading logs history...</div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">No predictions logged yet. Run single or batch analysis to generate history.</div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-900 rounded-lg">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-950 border-b border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Timestamp</th>
                            <th className="py-2.5 px-3">Variety</th>
                            <th className="py-2.5 px-3">Model</th>
                            <th className="py-2.5 px-3">Grade</th>
                            <th className="py-2.5 px-3">Confidence</th>
                            <th className="py-2.5 px-3">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((log, idx) => (
                            <tr key={log.id || idx} className="border-b border-slate-900 hover:bg-slate-900/20 text-slate-300">
                              <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">{log.timestamp}</td>
                              <td className="py-2.5 px-3 capitalize font-semibold font-mono text-wine-400">{log.wine_type}</td>
                              <td className="py-2.5 px-3 text-slate-400">{log.model_name}</td>
                              <td className={`py-2.5 px-3 font-bold ${log.predicted_class === 'Good' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {log.predicted_class}
                              </td>
                              <td className="py-2.5 px-3 font-mono">{(log.probability * 100).toFixed(1)}%</td>
                              <td className="py-2.5 px-3 text-[10px] font-mono text-slate-500">
                                Alc: {log.features.alcohol}% | pH: {log.features.pH}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Footer info links */}
      <footer className="mt-auto border-t border-slate-900 text-center py-6 text-xs text-slate-600">
        <p className="flex justify-center items-center gap-1.5">
          <Award size={14} className="text-wine-700" />
          WineSense AI sommelier system built with FastAPI and React.js. Datasets cached locally.
        </p>
      </footer>
    </div>
  );
}
