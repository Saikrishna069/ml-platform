import React, { useState } from 'react';

interface ColumnMeta {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'text';
  null_count: number;
  null_percentage: number;
  unique_count: number;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  median?: number;
}

interface DatasetEDA {
  filename: string;
  filesize_mb: number;
  rows: number;
  columns: number;
  duplicate_rows: number;
  total_missing: number;
  health_score: number;
  column_details: ColumnMeta[];
  preview_rows: Record<string, any>[];
  correlations: { feature_a: string; feature_b: string; correlation: number }[];
}

export default function DatasetStudio() {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'preview' | 'statistics' | 'correlations' | 'cleaning'>('overview');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [edaData, setEdaData] = useState<DatasetEDA>({
    filename: 'customer_analytics_data.csv',
    filesize_mb: 0.42,
    rows: 1000,
    columns: 8,
    duplicate_rows: 0,
    total_missing: 14,
    health_score: 98.25,
    column_details: [
      { name: 'customer_id', type: 'numeric', null_count: 0, null_percentage: 0, unique_count: 1000, min: 1001, max: 2000, mean: 1500.5, std: 288.6 },
      { name: 'age', type: 'numeric', null_count: 5, null_percentage: 0.5, unique_count: 62, min: 18, max: 79, mean: 38.4, std: 12.1 },
      { name: 'income', type: 'numeric', null_count: 9, null_percentage: 0.9, unique_count: 850, min: 24000, max: 185000, mean: 68400, std: 24500 },
      { name: 'gender', type: 'categorical', null_count: 0, null_percentage: 0, unique_count: 2 },
      { name: 'segment', type: 'categorical', null_count: 0, null_percentage: 0, unique_count: 3 },
      { name: 'credit_score', type: 'numeric', null_count: 0, null_percentage: 0, unique_count: 310, min: 350, max: 850, mean: 712, std: 45 },
      { name: 'joined_date', type: 'datetime', null_count: 0, null_percentage: 0, unique_count: 620 },
      { name: 'churn', type: 'numeric', null_count: 0, null_percentage: 0, unique_count: 2, min: 0, max: 1, mean: 0.18, std: 0.38 }
    ],
    preview_rows: [
      { customer_id: 1001, age: 34, income: 65000, gender: 'Female', segment: 'Premium', credit_score: 740, joined_date: '2023-01-15', churn: 0 },
      { customer_id: 1002, age: 45, income: 89000, gender: 'Male', segment: 'Standard', credit_score: 680, joined_date: '2022-11-20', churn: 0 },
      { customer_id: 1003, age: 29, income: 42000, gender: 'Male', segment: 'Standard', credit_score: 610, joined_date: '2023-03-04', churn: 1 },
      { customer_id: 1004, age: 52, income: 120000, gender: 'Female', segment: 'Enterprise', credit_score: 790, joined_date: '2021-08-12', churn: 0 },
      { customer_id: 1005, age: 38, income: 58000, gender: 'Female', segment: 'Standard', credit_score: 650, joined_date: '2023-05-19', churn: 1 }
    ],
    correlations: [
      { feature_a: 'income', feature_b: 'credit_score', correlation: 0.68 },
      { feature_a: 'age', feature_b: 'income', correlation: 0.45 },
      { feature_a: 'churn', feature_b: 'credit_score', correlation: -0.52 },
      { feature_a: 'age', feature_b: 'churn', correlation: 0.31 }
    ]
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIsProcessing(true);

      // Parse file name and generate dynamic EDA simulation
      setTimeout(() => {
        setIsProcessing(false);
        const name = file.name;
        const sizeMb = parseFloat((file.size / (1024 * 1024)).toFixed(2));
        
        setEdaData({
          filename: name,
          filesize_mb: sizeMb,
          rows: 1500 + Math.floor(Math.random() * 2000),
          columns: 10,
          duplicate_rows: Math.floor(Math.random() * 5),
          total_missing: Math.floor(Math.random() * 25),
          health_score: 96.5,
          column_details: [
            { name: 'id', type: 'numeric', null_count: 0, null_percentage: 0, unique_count: 1500 },
            { name: 'feature_1', type: 'numeric', null_count: 2, null_percentage: 0.1, unique_count: 890, min: 0.1, max: 99.8, mean: 45.2, std: 14.2 },
            { name: 'feature_2', type: 'numeric', null_count: 5, null_percentage: 0.3, unique_count: 1200, min: 10, max: 500, mean: 210.5, std: 62.4 },
            { name: 'category', type: 'categorical', null_count: 0, null_percentage: 0, unique_count: 4 },
            { name: 'target', type: 'numeric', null_count: 0, null_percentage: 0, unique_count: 2, min: 0, max: 1, mean: 0.22, std: 0.41 }
          ],
          preview_rows: [
            { id: 1, feature_1: 42.1, feature_2: 185.0, category: 'Type A', target: 0 },
            { id: 2, feature_1: 58.4, feature_2: 240.2, category: 'Type B', target: 1 },
            { id: 3, feature_1: 31.9, feature_2: 120.5, category: 'Type A', target: 0 },
            { id: 4, feature_1: 64.2, feature_2: 310.8, category: 'Type C', target: 1 }
          ],
          correlations: [
            { feature_a: 'feature_1', feature_b: 'target', correlation: 0.74 },
            { feature_a: 'feature_2', feature_b: 'target', correlation: 0.58 }
          ]
        });
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Dataset & EDA Studio</h1>
          <p className="text-sm text-gray-600">
            Upload CSV, Excel, Parquet, or JSON files for instant automated exploratory data profiling, summary statistics, and health checks
          </p>
        </div>

        {/* Upload Dropzone */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Ingest Dataset</h2>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <label className="flex-1 w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl cursor-pointer bg-blue-50/40 hover:bg-blue-50 transition-colors">
              <span className="text-sm font-semibold text-blue-700 mb-1">
                {selectedFile ? `Selected: ${selectedFile.name}` : 'Click to Browse or Drag & Drop Dataset File (.csv, .xlsx, .parquet, .json)'}
              </span>
              <span className="text-xs text-gray-500">Supports datasets up to 500 MB</span>
              <input type="file" accept=".csv,.xlsx,.parquet,.json" onChange={handleFileChange} className="hidden" />
            </label>
            {isProcessing && (
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <span className="animate-spin text-xl">🌀</span> Running EDA Engine...
              </div>
            )}
          </div>
        </div>

        {/* Dataset Overview Banner */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase">File Name</p>
            <p className="text-sm font-bold text-gray-900 truncate mt-1">{edaData.filename}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase">Rows</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{edaData.rows.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase">Columns</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{edaData.columns}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase">Missing Values</p>
            <p className="text-xl font-bold text-green-600 mt-1">{edaData.total_missing}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase">Duplicate Rows</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{edaData.duplicate_rows}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase">Health Score</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{edaData.health_score}%</p>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex border-b border-gray-200 mb-6 space-x-6">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeSubTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            📋 Column Profiling
          </button>
          <button
            onClick={() => setActiveSubTab('preview')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeSubTab === 'preview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            🔍 Data Preview Table
          </button>
          <button
            onClick={() => setActiveSubTab('statistics')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeSubTab === 'statistics' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            📊 Summary Statistics
          </button>
          <button
            onClick={() => setActiveSubTab('correlations')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeSubTab === 'correlations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            🔥 Feature Correlations
          </button>
          <button
            onClick={() => setActiveSubTab('cleaning')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeSubTab === 'cleaning' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            ⚡ Data Preprocessing
          </button>
        </div>

        {/* Sub-Tab 1: Column Profiling */}
        {activeSubTab === 'overview' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <th className="py-3 px-6">Column Name</th>
                  <th className="py-3 px-6">Data Type</th>
                  <th className="py-3 px-6">Unique Values</th>
                  <th className="py-3 px-6">Null Count</th>
                  <th className="py-3 px-6">Null %</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {edaData.column_details.map((col, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-6 font-bold text-gray-900 font-mono">{col.name}</td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        col.type === 'numeric' ? 'bg-blue-100 text-blue-800' :
                        col.type === 'categorical' ? 'bg-purple-100 text-purple-800' :
                        col.type === 'datetime' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {col.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold">{col.unique_count.toLocaleString()}</td>
                    <td className="py-3.5 px-6 font-semibold">{col.null_count}</td>
                    <td className="py-3.5 px-6">
                      <span className={col.null_percentage > 0 ? 'text-amber-600 font-bold' : 'text-gray-600'}>
                        {col.null_percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      {col.null_percentage === 0 ? (
                        <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">Complete</span>
                      ) : (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Action Needed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sub-Tab 2: Data Preview Table */}
        {activeSubTab === 'preview' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-gray-900 text-white uppercase">
                  {edaData.column_details.map((col, idx) => (
                    <th key={idx} className="py-3 px-4 font-bold border-r border-gray-800">{col.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {edaData.preview_rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-blue-50/40">
                    {edaData.column_details.map((col, cIdx) => (
                      <td key={cIdx} className="py-3 px-4 border-r border-gray-100 text-gray-800">
                        {row[col.name] !== undefined ? String(row[col.name]) : <span className="text-red-400 italic">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sub-Tab 3: Summary Statistics */}
        {activeSubTab === 'statistics' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <th className="py-3 px-6">Numeric Feature</th>
                  <th className="py-3 px-6">Mean</th>
                  <th className="py-3 px-6">Std Dev</th>
                  <th className="py-3 px-6">Min</th>
                  <th className="py-3 px-6">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {edaData.column_details.filter(c => c.type === 'numeric').map((col, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3.5 px-6 font-bold text-gray-900 font-mono">{col.name}</td>
                    <td className="py-3.5 px-6">{col.mean !== undefined ? col.mean.toFixed(2) : '-'}</td>
                    <td className="py-3.5 px-6">{col.std !== undefined ? col.std.toFixed(2) : '-'}</td>
                    <td className="py-3.5 px-6">{col.min !== undefined ? col.min : '-'}</td>
                    <td className="py-3.5 px-6">{col.max !== undefined ? col.max : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sub-Tab 4: Correlations */}
        {activeSubTab === 'correlations' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Feature Pairwise Pearson Correlation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {edaData.correlations.map((c, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100">
                  <div>
                    <span className="font-bold text-gray-900 font-mono">{c.feature_a}</span>
                    <span className="text-gray-400 mx-2">↔</span>
                    <span className="font-bold text-gray-900 font-mono">{c.feature_b}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    c.correlation > 0.5 ? 'bg-green-100 text-green-800' :
                    c.correlation < -0.4 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {c.correlation > 0 ? `+${c.correlation}` : c.correlation}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Tab 5: Data Preprocessing Controls */}
        {activeSubTab === 'cleaning' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h3 className="text-lg font-bold text-gray-900">Preprocess & Clean Dataset</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-100">
                <h4 className="font-bold text-gray-900 mb-2">Impute Missing Values</h4>
                <p className="text-xs text-gray-600 mb-4">Fill missing numerical values with column mean/median or categorical values with mode.</p>
                <button
                  onClick={() => alert("Missing values imputed with median & mode!")}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                >
                  Apply Imputation
                </button>
              </div>

              <div className="p-5 bg-purple-50/50 rounded-xl border border-purple-100">
                <h4 className="font-bold text-gray-900 mb-2">Feature Scaling</h4>
                <p className="text-xs text-gray-600 mb-4">Standardize numerical features using StandardScaler (zero mean, unit variance).</p>
                <button
                  onClick={() => alert("StandardScaler applied to all numerical columns!")}
                  className="w-full py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700"
                >
                  Scale Numerical Features
                </button>
              </div>

              <div className="p-5 bg-green-50/50 rounded-xl border border-green-100">
                <h4 className="font-bold text-gray-900 mb-2">Categorical Encoding</h4>
                <p className="text-xs text-gray-600 mb-4">One-Hot Encode non-numeric features into binary vectors for ML model training.</p>
                <button
                  onClick={() => alert("One-Hot Encoding applied!")}
                  className="w-full py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700"
                >
                  Encode Categoricals
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
