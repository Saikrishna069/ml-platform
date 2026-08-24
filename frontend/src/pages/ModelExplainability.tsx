import React, { useState } from 'react';

interface SHAPFeature {
  name: string;
  shap_value: number;
  feature_value: number;
  impact_direction: 'positive' | 'negative';
}

export default function ModelExplainability() {
  const [activeTab, setActiveTab] = useState<'global' | 'local' | 'boundary'>('global');
  const [selectedInstanceId, setSelectedInstanceId] = useState(1);

  // 2D Decision Boundary Feature Selection
  const [featureX, setFeatureX] = useState('petal_length');
  const [featureY, setFeatureY] = useState('petal_width');

  // Sample Features List
  const availableFeatures = ['petal_length', 'petal_width', 'sepal_length', 'sepal_width'];

  // Global SHAP Feature Importance Attribution
  const globalShapFeatures = [
    { name: 'petal_length', mean_abs_shap: 0.425, color: 'from-rose-500 to-red-600' },
    { name: 'petal_width', mean_abs_shap: 0.350, color: 'from-indigo-500 to-purple-600' },
    { name: 'sepal_length', mean_abs_shap: 0.152, color: 'from-blue-500 to-indigo-600' },
    { name: 'sepal_width', mean_abs_shap: 0.073, color: 'from-cyan-500 to-blue-600' }
  ];

  // Local Instance SHAP Values (Instance Row #1 vs #2 vs #3)
  const sampleInstances: Record<number, { base_value: number; final_pred: number; features: SHAPFeature[] }> = {
    1: {
      base_value: 0.52,
      final_pred: 0.98,
      features: [
        { name: 'petal_length', shap_value: +0.28, feature_value: 4.8, impact_direction: 'positive' },
        { name: 'petal_width', shap_value: +0.14, feature_value: 1.8, impact_direction: 'positive' },
        { name: 'sepal_length', shap_value: +0.08, feature_value: 6.2, impact_direction: 'positive' },
        { name: 'sepal_width', shap_value: -0.04, feature_value: 2.8, impact_direction: 'negative' }
      ]
    },
    2: {
      base_value: 0.52,
      final_pred: 0.12,
      features: [
        { name: 'petal_length', shap_value: -0.22, feature_value: 1.4, impact_direction: 'negative' },
        { name: 'petal_width', shap_value: -0.15, feature_value: 0.2, impact_direction: 'negative' },
        { name: 'sepal_length', shap_value: -0.05, feature_value: 5.1, impact_direction: 'negative' },
        { name: 'sepal_width', shap_value: +0.02, feature_value: 3.5, impact_direction: 'positive' }
      ]
    },
    3: {
      base_value: 0.52,
      final_pred: 0.86,
      features: [
        { name: 'petal_length', shap_value: +0.20, feature_value: 4.2, impact_direction: 'positive' },
        { name: 'petal_width', shap_value: +0.12, feature_value: 1.3, impact_direction: 'positive' },
        { name: 'sepal_length', shap_value: +0.04, feature_value: 5.9, impact_direction: 'positive' },
        { name: 'sepal_width', shap_value: -0.02, feature_value: 3.0, impact_direction: 'negative' }
      ]
    }
  };

  const currentLocal = sampleInstances[selectedInstanceId] || sampleInstances[1];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Model Explainability & SHAP Visualizer</h1>
          <p className="text-sm text-gray-600">
            Global SHAP feature attribution, local instance waterfall explanations, and 2D decision boundary maps
          </p>
        </div>

        {/* 3 Main Explainability Sub-Tabs */}
        <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-6 pt-3 space-x-8 mb-8 border shadow-sm">
          <button
            onClick={() => setActiveTab('global')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'global' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            📊 Global Feature Attribution (SHAP Summary)
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'local' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            🔍 Local Instance Waterfall Explanation
          </button>
          <button
            onClick={() => setActiveTab('boundary')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'boundary' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            🗺️ 2D Decision Boundary Contour Maps
          </button>
        </div>

        {/* TAB 1: GLOBAL SHAP FEATURE ATTRIBUTION */}
        {activeTab === 'global' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Global Mean |SHAP Value| Feature Ranking</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Ranks features by overall impact on model output predictions</p>
                </div>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">
                  TreeSHAP Explainer Engine
                </span>
              </div>

              {/* SHAP Ranking Bars */}
              <div className="space-y-4 mb-8">
                {globalShapFeatures.map((f, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex justify-between text-xs font-bold text-gray-800 mb-1.5 font-mono">
                      <span>#{idx + 1} {f.name}</span>
                      <span>Mean |SHAP| = {f.mean_abs_shap}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${f.color} h-4 rounded-full transition-all`}
                        style={{ width: `${(f.mean_abs_shap / 0.45) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-3">
                <span className="text-lg">💡</span>
                <div>
                  <p className="font-bold">Global Insights:</p>
                  <p className="mt-0.5">
                    <strong>petal_length</strong> and <strong>petal_width</strong> contribute over <strong>77.5% of total predictive power</strong>. Changes in these two features have the highest magnitude impact on model classification output.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOCAL INSTANCE WATERFALL EXPLANATION */}
        {activeTab === 'local' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Local Instance Prediction Waterfall Plot</h2>
                <p className="text-xs text-gray-500 mt-0.5">Decomposes single prediction $f(x)$ into baseline $E[f(x)]$ + individual feature SHAP contributions</p>
              </div>

              {/* Instance Selector */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-gray-700 uppercase">Select Sample Instance:</label>
                <select
                  value={selectedInstanceId}
                  onChange={(e) => setSelectedInstanceId(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-mono font-bold bg-white"
                >
                  <option value={1}>Instance #1 (Setosa - High Prob 98%)</option>
                  <option value={2}>Instance #2 (Versicolor - Low Prob 12%)</option>
                  <option value={3}>Instance #3 (Virginica - High Prob 86%)</option>
                </select>
              </div>
            </div>

            {/* Baseline vs Final Prediction Banner */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900 rounded-xl text-white font-mono text-xs text-center">
              <div>
                <span className="text-gray-400">Base Expected Value E[f(x)]:</span>
                <p className="font-bold text-lg text-yellow-300 mt-0.5">{currentLocal.base_value}</p>
              </div>
              <div>
                <span className="text-gray-400">Final Model Prediction f(x):</span>
                <p className="font-bold text-lg text-green-400 mt-0.5">{currentLocal.final_pred}</p>
              </div>
            </div>

            {/* Waterfall Contribution Rows */}
            <div className="space-y-3 font-mono text-xs">
              {currentLocal.features.map((feat, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-900">{feat.name}</span>
                    <span className="text-gray-500 ml-2">(Value = {feat.feature_value})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`font-bold px-3 py-1 rounded-full ${
                      feat.impact_direction === 'positive' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {feat.shap_value >= 0 ? `+${feat.shap_value}` : feat.shap_value} SHAP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: 2D DECISION BOUNDARY CONTOUR MAPS */}
        {activeTab === 'boundary' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">2D Decision Boundary Contour Region Map</h2>
                <p className="text-xs text-gray-500 mt-0.5">Visualizes decision boundaries and class separation regions between 2 selected features</p>
              </div>

              {/* Feature Axis Selectors */}
              <div className="flex items-center gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase mr-1">Axis X:</label>
                  <select
                    value={featureX}
                    onChange={(e) => setFeatureX(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white font-mono"
                  >
                    {availableFeatures.map((f, idx) => (
                      <option key={idx} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase mr-1">Axis Y:</label>
                  <select
                    value={featureY}
                    onChange={(e) => setFeatureY(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white font-mono"
                  >
                    {availableFeatures.map((f, idx) => (
                      <option key={idx} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2D Contour Region Simulation Box */}
            <div className="p-8 bg-gray-900 rounded-2xl text-white font-mono relative overflow-hidden border border-gray-800">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Decision Region Map ({featureX} vs {featureY})</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-500 rounded-full inline-block"></span> Class 0 (Setosa)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-400 rounded-full inline-block"></span> Class 1 (Versicolor)</span>
                </div>
              </div>

              {/* Grid Canvas Simulation */}
              <div className="h-64 border-l-2 border-b-2 border-gray-700 relative flex items-center justify-center bg-gradient-to-tr from-indigo-900/60 via-purple-950/60 to-emerald-950/60 rounded">
                <div className="absolute left-1/4 top-1/3 w-4 h-4 bg-indigo-400 rounded-full shadow-lg animate-pulse"></div>
                <div className="absolute left-1/3 top-1/2 w-4 h-4 bg-indigo-500 rounded-full shadow-lg"></div>
                <div className="absolute right-1/4 bottom-1/3 w-4 h-4 bg-emerald-400 rounded-full shadow-lg animate-pulse"></div>
                <div className="absolute right-1/3 bottom-1/4 w-4 h-4 bg-emerald-500 rounded-full shadow-lg"></div>
                <p className="text-xs text-gray-400 italic">2D Decision Contour Boundary Plane ({featureX} on X-axis, {featureY} on Y-axis)</p>
              </div>

              <div className="flex justify-between text-[11px] text-gray-400 mt-2">
                <span>0.0 ({featureX})</span>
                <span>Max ({featureX})</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
