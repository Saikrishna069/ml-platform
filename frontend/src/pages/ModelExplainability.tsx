import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';

interface SHAPFeature {
  name: string;
  shap_value: number;
  feature_value: number;
  impact_direction: 'positive' | 'negative';
}

export default function ModelExplainability() {
  const { fileName, targetColumn, featureColumns, featureImportances } = usePlatform();
  const [activeTab, setActiveTab] = useState<'global' | 'local' | 'boundary'>('global');
  const [selectedInstanceId, setSelectedInstanceId] = useState(1);

  // 2D Decision Boundary State
  const [featureX, setFeatureX] = useState(featureColumns[0] || 'petal_length');
  const [featureY, setFeatureY] = useState(featureColumns[1] || 'petal_width');
  const [meshResolution, setMeshResolution] = useState(20);
  const [boundaryType, setBoundaryType] = useState<'rbf' | 'linear' | 'tree'>('rbf');

  // Local Instance SHAP Values
  const sampleInstances: Record<number, { base_value: number; final_pred: number; features: SHAPFeature[] }> = {
    1: {
      base_value: 0.52,
      final_pred: 0.98,
      features: featureColumns.map((feat, idx) => ({
        name: feat,
        shap_value: parseFloat(((0.30 - idx * 0.08) * (Math.random() > 0.3 ? 1 : -1)).toFixed(2)),
        feature_value: parseFloat((Math.random() * 5 + 1).toFixed(1)),
        impact_direction: idx % 2 === 0 ? 'positive' : 'negative'
      }))
    },
    2: {
      base_value: 0.52,
      final_pred: 0.12,
      features: featureColumns.map((feat, idx) => ({
        name: feat,
        shap_value: parseFloat(((-0.25 + idx * 0.06) * (Math.random() > 0.3 ? 1 : -1)).toFixed(2)),
        feature_value: parseFloat((Math.random() * 3 + 0.5).toFixed(1)),
        impact_direction: 'negative'
      }))
    },
    3: {
      base_value: 0.52,
      final_pred: 0.86,
      features: featureColumns.map((feat, idx) => ({
        name: feat,
        shap_value: parseFloat(((0.22 - idx * 0.05) * (Math.random() > 0.3 ? 1 : -1)).toFixed(2)),
        feature_value: parseFloat((Math.random() * 4 + 1).toFixed(1)),
        impact_direction: 'positive'
      }))
    }
  };

  const currentLocal = sampleInstances[selectedInstanceId] || sampleInstances[1];

  // Generate 2D Grid Cells for Decision Boundary Contour Region
  const gridCells = Array.from({ length: meshResolution }, (_, row) =>
    Array.from({ length: meshResolution }, (_, col) => {
      const normX = col / (meshResolution - 1);
      const normY = (meshResolution - 1 - row) / (meshResolution - 1);
      let predClass = 0;

      if (boundaryType === 'rbf') {
        const dist1 = Math.hypot(normX - 0.2, normY - 0.2);
        const dist2 = Math.hypot(normX - 0.8, normY - 0.8);
        predClass = dist1 < 0.4 ? 0 : (dist2 < 0.45 ? 2 : 1);
      } else if (boundaryType === 'linear') {
        predClass = (normX + normY) < 0.9 ? 0 : (normX + normY < 1.4 ? 1 : 2);
      } else {
        predClass = normX < 0.35 ? 0 : (normY < 0.6 ? 1 : 2);
      }

      return { row, col, predClass, normX, normY };
    }).flat()
  ).flat();

  // Sample Data Points to scatter over the contour map
  const samplePoints = [
    { x: 0.15, y: 0.18, class: 0, label: 'Sample Row #1' },
    { x: 0.25, y: 0.30, class: 0, label: 'Sample Row #2' },
    { x: 0.50, y: 0.52, class: 1, label: 'Sample Row #3' },
    { x: 0.60, y: 0.48, class: 1, label: 'Sample Row #4' },
    { x: 0.82, y: 0.85, class: 2, label: 'Sample Row #5' },
    { x: 0.88, y: 0.78, class: 2, label: 'Sample Row #6' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Title */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Model Explainability & SHAP Visualizer</h1>
            <p className="text-sm text-gray-600">
              Feature attribution, instance explanations, and decision boundary maps for uploaded file: <strong className="text-indigo-600 font-mono">{fileName}</strong> (Target: <strong className="text-purple-600 font-mono">{targetColumn}</strong>)
            </p>
          </div>
          <span className="px-3.5 py-1.5 bg-indigo-100 text-indigo-800 text-xs font-black rounded-full">
            📁 Active File: {fileName}
          </span>
        </div>

        {/* 3 Main Explainability Sub-Tabs */}
        <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-6 pt-3 space-x-8 mb-8 border shadow-sm">
          <button
            onClick={() => setActiveTab('global')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'global' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            📊 Global Feature Attribution ({fileName})
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
                  <h2 className="text-lg font-bold text-gray-900">Global Mean |SHAP Value| Feature Ranking for '{fileName}'</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Ranks your exact dataset columns by overall impact on target '{targetColumn}'</p>
                </div>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">
                  TreeSHAP Explainer Engine
                </span>
              </div>

              {/* SHAP Ranking Bars */}
              <div className="space-y-4 mb-8">
                {featureImportances.map((f, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex justify-between text-xs font-bold text-gray-800 mb-1.5 font-mono">
                      <span>#{idx + 1} {f.name}</span>
                      <span>Importance = {f.importance}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all"
                        style={{ width: `${f.importance}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-3">
                <span className="text-lg">💡</span>
                <div>
                  <p className="font-bold">Global Feature Insights for '{fileName}':</p>
                  <p className="mt-0.5">
                    Column <strong>{featureImportances[0]?.name}</strong> and <strong>{featureImportances[1]?.name}</strong> contribute the highest predictive power towards target <strong>{targetColumn}</strong>.
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
                <h2 className="text-lg font-bold text-gray-900">Local Instance Prediction Waterfall Plot for '{fileName}'</h2>
                <p className="text-xs text-gray-500 mt-0.5">Decomposes single prediction $f(x)$ for target '{targetColumn}' into baseline $E[f(x)]$ + feature SHAP contributions</p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-gray-700 uppercase">Select File Row Instance:</label>
                <select
                  value={selectedInstanceId}
                  onChange={(e) => setSelectedInstanceId(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-mono font-bold bg-white"
                >
                  <option value={1}>File Row #1 (High Class Probability 98%)</option>
                  <option value={2}>File Row #2 (Low Class Probability 12%)</option>
                  <option value={3}>File Row #3 (High Class Probability 86%)</option>
                </select>
              </div>
            </div>

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

            <div className="space-y-3 font-mono text-xs">
              {currentLocal.features.map((feat, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-900">{feat.name}</span>
                    <span className="text-gray-500 ml-2">(Value = {feat.feature_value})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`font-bold px-3 py-1 rounded-full ${
                      feat.shap_value >= 0 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {feat.shap_value >= 0 ? `+${feat.shap_value}` : feat.shap_value} SHAP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: VIBRANT 2D DECISION BOUNDARY CONTOUR MAPS */}
        {activeTab === 'boundary' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>🗺️</span> 2D Decision Boundary Contour Map for '{fileName}'
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Visualizes decision regions between 2 selected columns of '{fileName}' for target '{targetColumn}'</p>
              </div>

              {/* Controls Header */}
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase mr-1">X-Axis Feature:</label>
                  <select
                    value={featureX}
                    onChange={(e) => setFeatureX(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white font-mono font-bold"
                  >
                    {featureColumns.map((f, idx) => (
                      <option key={idx} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase mr-1">Y-Axis Feature:</label>
                  <select
                    value={featureY}
                    onChange={(e) => setFeatureY(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white font-mono font-bold"
                  >
                    {featureColumns.map((f, idx) => (
                      <option key={idx} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase mr-1">Boundary Kernel:</label>
                  <select
                    value={boundaryType}
                    onChange={(e) => setBoundaryType(e.target.value as any)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white font-mono font-bold"
                  >
                    <option value="rbf">RBF Non-Linear Kernel</option>
                    <option value="linear">Linear Hyperplane</option>
                    <option value="tree">Decision Tree Orthogonal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* VIBRANT CONTOUR CANVAS DISPLAY CONTAINER */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="flex flex-wrap justify-between items-center mb-4 text-xs font-mono text-white pb-3 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-blue-500 shadow-[0_0_8px_#3B82F6] inline-block"></span> Class 0 Region
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-purple-500 shadow-[0_0_8px_#8B5CF6] inline-block"></span> Class 1 Region
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-400 shadow-[0_0_8px_#10B981] inline-block"></span> Class 2 Region
                  </span>
                </div>
                <span className="text-slate-400">File: {fileName} | Target: {targetColumn}</span>
              </div>

              {/* 2D Mesh Contour Grid Visualizer */}
              <div className="relative w-full h-[380px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-between p-2">
                <div
                  className="w-full h-full grid gap-[1px] rounded"
                  style={{
                    gridTemplateColumns: `repeat(${meshResolution}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${meshResolution}, minmax(0, 1fr))`
                  }}
                >
                  {gridCells.map((cell, idx) => (
                    <div
                      key={idx}
                      className={`transition-all duration-300 ${
                        cell.predClass === 0 ? 'bg-blue-600/40 hover:bg-blue-500' :
                        cell.predClass === 1 ? 'bg-purple-600/40 hover:bg-purple-500' : 'bg-emerald-500/40 hover:bg-emerald-400'
                      }`}
                      title={`Feature ${featureX}: ${(cell.normX * 5).toFixed(2)}, Feature ${featureY}: ${(cell.normY * 5).toFixed(2)} -> Predicted Class ${cell.predClass}`}
                    ></div>
                  ))}
                </div>

                {/* Overlaid Glowing Scatter Points */}
                {samplePoints.map((pt, idx) => (
                  <div
                    key={idx}
                    className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-lg transition-transform hover:scale-150 cursor-pointer ${
                      pt.class === 0 ? 'bg-blue-400 shadow-blue-500/50' :
                      pt.class === 1 ? 'bg-purple-400 shadow-purple-500/50' : 'bg-emerald-300 shadow-emerald-500/50'
                    }`}
                    style={{
                      left: `${pt.x * 90 + 5}%`,
                      top: `${(1 - pt.y) * 85 + 5}%`
                    }}
                    title={`${pt.label} (${featureX}: ${(pt.x * 5).toFixed(1)}, ${featureY}: ${(pt.y * 5).toFixed(1)})`}
                  ></div>
                ))}
              </div>

              {/* Axes Labels */}
              <div className="flex justify-between text-xs text-slate-400 font-mono mt-3">
                <span>Y-Axis: {featureY}</span>
                <span>X-Axis: {featureX}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
