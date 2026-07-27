import React from 'react';
import { ShieldCheck, ShieldAlert, Award, Compass, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function ExplanationPanel({ predictionData }) {
  if (!predictionData) {
    return (
      <div className="glass-panel p-6 h-full flex flex-col items-center justify-center text-slate-500 py-16">
        <Compass size={40} className="mb-3 animate-pulse" />
        <p className="text-center text-sm">Please input wine parameters and click 'Analyze Sample' to load explainability insights.</p>
      </div>
    );
  }

  const { prediction, confidence_pct, probability, explanation, recommendations, model_name, wine_type } = predictionData;
  const isGood = prediction === 'Good';

  // Format explanation data for Recharts bar chart
  const chartData = explanation.map(item => ({
    name: item.feature,
    contribution: parseFloat(item.score),
    valText: `${item.value.toFixed(2)} (avg: ${item.average.toFixed(2)})`,
    fill: item.impact === 'positive' ? '#10b981' : '#f43f5e'
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 p-2 text-xs rounded shadow">
          <p className="font-semibold text-slate-200 capitalize">{data.name}</p>
          <p className="text-slate-400">Value: {data.valText}</p>
          <p className={data.contribution >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            Impact: {data.contribution >= 0 ? '+' : ''}{data.contribution.toFixed(4)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-6 space-y-6">
      {/* Prediction Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/40 p-4 border border-slate-900 rounded-xl">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${isGood ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {isGood ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{wine_type} Wine ({model_name})</div>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              Predicted Quality: 
              <span className={isGood ? 'text-emerald-400' : 'text-rose-400'}>
                {isGood ? 'Good Grade (≥ 6)' : 'Poor Grade (< 6)'}
              </span>
            </h3>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500 font-semibold mb-1">PREDICTION CONFIDENCE</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold font-mono text-wine-400">{confidence_pct}%</span>
          </div>
        </div>
      </div>

      {/* Confidence progress */}
      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
        <div 
          className={`h-full transition-all duration-500 ${isGood ? 'bg-emerald-500' : 'bg-rose-500'}`}
          style={{ width: `${confidence_pct}%` }}
        />
      </div>

      {/* Local Attributions (XAI) */}
      <div>
        <h4 className="text-md font-semibold mb-3 flex items-center gap-2 text-slate-300">
          <Sparkles size={16} className="text-wine-500" />
          Explainable AI (XAI) Feature Attributions
        </h4>
        
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
            >
              <XAxis type="number" stroke="#64748b" fontSize={11} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={11} 
                width={120}
                tickFormatter={(val) => val.replace(' sulfur dioxide', ' SO2')}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
              <Bar dataKey="contribution" fill="#a31d51" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <rect key={`rect-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 px-4 pt-1 font-mono">
          <span>← Reduces Quality Score</span>
          <span>Enhances Quality Score →</span>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="text-md font-semibold mb-3 flex items-center gap-2 text-slate-300">
          <Award size={16} className="text-wine-500" />
          Enological Optimization Recommendations
        </h4>
        
        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
          {recommendations.map((rec, idx) => (
            <div 
              key={idx} 
              className={`p-3.5 border rounded-xl text-sm ${
                rec.priority === 'High' 
                  ? 'bg-rose-500/5 border-rose-500/20 text-slate-200' 
                  : rec.priority === 'Medium' 
                    ? 'bg-amber-500/5 border-amber-500/20 text-slate-200'
                    : 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
              }`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="capitalize font-semibold text-xs tracking-wider font-mono text-slate-400">
                  Parameter: {rec.feature}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  rec.priority === 'High' 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                    : rec.priority === 'Medium' 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {rec.priority} Priority
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">{rec.suggestion}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
