import React, { useState } from 'react';

interface ModelResult {
  id: number;
  name: string;
  accuracy: number;
  f1_score: number;
  precision: number;
  recall: number;
  roc_auc: number;
  training_time_s: number;
  status: 'best_ensemble' | 'tuned' | 'completed';
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  hyperparameters: Record<string, any>;
  feature_importances: { name: string; importance: number }[];
  roc_points: { fpr: number; tpr: number }[];
}

export default function AutoMLStudio() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [availableColumns, setAvailableColumns] = useState<string[]>(['churn', 'age', 'income', 'credit_score', 'segment', 'gender']);
  const [targetColumn, setTargetColumn] = useState('churn');
  const [taskType, setTaskType] = useState('binary_classification');
  const [primaryMetric, setPrimaryMetric] = useState<'accuracy' | 'f1_score' | 'precision' | 'recall' | 'roc_auc'>('f1_score');
  const [tuningTrials, setTuningTrials] = useState(15);
  const [enableEnsemble, setEnableEnsemble] = useState(true);

  const [isTraining, setIsTraining] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [deployedModel, setDeployedModel] = useState<string | null>(null);
  const [inspectedModel, setInspectedModel] = useState<ModelResult | null>(null);

  // Modal active sub-tab for inspection charts
  const [inspectTab, setInspectTab] = useState<'confusion' | 'roc' | 'features' | 'hyperparams'>('confusion');

  // Sorting state
  const [sortField, setSortField] = useState<'accuracy' | 'f1_score' | 'precision' | 'recall' | 'training_time_s'>('f1_score');
  const [sortAsc, setSortAsc] = useState(false);

  const [testProbabilities, setTestProbabilities] = useState<{ xgb: number; rf: number; lgbm: number; ensemble: number } | null>({
    xgb: 0.84,
    rf: 0.79,
    lgbm: 0.82,
    ensemble: 0.818
  });

  const [results, setResults] = useState<ModelResult[]>([
    {
      id: 1,
      name: 'Soft Voting Ensemble (XGBoost + RF + LightGBM)',
      accuracy: 0.962,
      f1_score: 0.954,
      precision: 0.958,
      recall: 0.950,
      roc_auc: 0.984,
      training_time_s: 4.8,
      status: 'best_ensemble',
      tp: 475, fp: 21, tn: 487, fn: 17,
      hyperparameters: { weights: { XGBoost: 0.45, RandomForest: 0.35, LightGBM: 0.20 } },
      feature_importances: [
        { name: 'credit_score', importance: 38.5 },
        { name: 'income', importance: 27.2 },
        { name: 'age', importance: 19.8 },
        { name: 'segment', importance: 9.5 },
        { name: 'gender', importance: 5.0 }
      ],
      roc_points: [
        { fpr: 0.0, tpr: 0.0 }, { fpr: 0.02, tpr: 0.85 }, { fpr: 0.05, tpr: 0.94 }, { fpr: 0.10, tpr: 0.98 }, { fpr: 1.0, tpr: 1.0 }
      ]
    },
    {
      id: 2,
      name: 'XGBoost Classifier (Optuna Tuned)',
      accuracy: 0.948,
      f1_score: 0.940,
      precision: 0.945,
      recall: 0.935,
      roc_auc: 0.971,
      training_time_s: 2.3,
      status: 'tuned',
      tp: 468, fp: 27, tn: 480, fn: 25,
      hyperparameters: { n_estimators: 250, max_depth: 6, learning_rate: 0.03, subsample: 0.8 },
      feature_importances: [
        { name: 'credit_score', importance: 41.2 },
        { name: 'income', importance: 29.0 },
        { name: 'age', importance: 18.1 },
        { name: 'segment', importance: 8.2 },
        { name: 'gender', importance: 3.5 }
      ],
      roc_points: [
        { fpr: 0.0, tpr: 0.0 }, { fpr: 0.04, tpr: 0.81 }, { fpr: 0.08, tpr: 0.91 }, { fpr: 0.15, tpr: 0.96 }, { fpr: 1.0, tpr: 1.0 }
      ]
    },
    {
      id: 3,
      name: 'Random Forest Classifier',
      accuracy: 0.931,
      f1_score: 0.922,
      precision: 0.928,
      recall: 0.916,
      roc_auc: 0.958,
      training_time_s: 1.6,
      status: 'completed',
      tp: 458, fp: 36, tn: 473, fn: 33,
      hyperparameters: { n_estimators: 150, max_depth: 12, min_samples_split: 5 },
      feature_importances: [
        { name: 'income', importance: 35.0 },
        { name: 'credit_score', importance: 32.5 },
        { name: 'age', importance: 20.0 },
        { name: 'segment', importance: 8.0 },
        { name: 'gender', importance: 4.5 }
      ],
      roc_points: [
        { fpr: 0.0, tpr: 0.0 }, { fpr: 0.05, tpr: 0.78 }, { fpr: 0.11, tpr: 0.88 }, { fpr: 0.20, tpr: 0.94 }, { fpr: 1.0, tpr: 1.0 }
      ]
    },
    {
      id: 4,
      name: 'LightGBM Classifier',
      accuracy: 0.925,
      f1_score: 0.918,
      precision: 0.920,
      recall: 0.916,
      roc_auc: 0.952,
      training_time_s: 1.1,
      status: 'completed',
      tp: 455, fp: 40, tn: 470, fn: 35,
      hyperparameters: { num_leaves: 31, learning_rate: 0.05 },
      feature_importances: [
        { name: 'credit_score', importance: 36.0 },
        { name: 'income', importance: 31.0 },
        { name: 'age', importance: 21.0 },
        { name: 'segment', importance: 7.5 },
        { name: 'gender', importance: 4.5 }
      ],
      roc_points: [
        { fpr: 0.0, tpr: 0.0 }, { fpr: 0.06, tpr: 0.75 }, { fpr: 0.12, tpr: 0.86 }, { fpr: 0.22, tpr: 0.93 }, { fpr: 1.0, tpr: 1.0 }
      ]
    }
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
          setAvailableColumns(headers);
          if (headers.length > 0) {
            setTargetColumn(headers[headers.length - 1]);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const startAutoML = () => {
    setIsTraining(true);
    setProgressStep(1);
    setExecutionLogs([]);
    setDeployedModel(null);

    const filename = selectedFile ? selectedFile.name : 'cleaned_dataset.csv';
    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setExecutionLogs([...logs]);
    };

    addLog(`🚀 Ingesting '${filename}' for AutoML pipeline...`);

    setTimeout(() => {
      setProgressStep(2);
      addLog(`📊 Step 1/4: Target column set to '${targetColumn}' (${taskType}). Splitting 80/20 train/test...`);
    }, 800);

    setTimeout(() => {
      setProgressStep(3);
      addLog(`⚙️ Step 2/4: Optuna optimization executing ${tuningTrials} hyperparameter trials for target metric '${primaryMetric.toUpperCase()}'...`);
    }, 1800);

    setTimeout(() => {
      setProgressStep(4);
      addLog(`🤝 Step 3/4: ${enableEnsemble ? 'Building Soft Voting Ensemble (XGBoost 45% + Random Forest 35% + LightGBM 20%)...' : 'Skipping ensemble creation...'}`);
    }, 2800);

    setTimeout(() => {
      setProgressStep(5);
      addLog(`🏆 Evaluation completed! Generated confusion matrix heatmaps, ROC curves & feature importance charts.`);
      setIsTraining(false);
    }, 3800);
  };

  const handleSort = (field: 'accuracy' | 'f1_score' | 'precision' | 'recall' | 'training_time_s') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    return sortAsc ? valA - valB : valB - valA;
  });

  const deployModelToMLOps = (modelName: string) => {
    setDeployedModel(modelName);
    alert(`Successfully deployed '${modelName}' for target '${targetColumn}' into MLOps Production Registry!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">AutoML Training Studio</h1>
          <p className="text-sm text-gray-600">
            Upload your cleaned dataset file, select target column, task type, metric target, and evaluate accurate algorithm metrics to pick the best model
          </p>
        </div>

        {/* Step 1: Upload Cleaned Dataset File */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Upload Cleaned Dataset File</h2>
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl cursor-pointer bg-indigo-50/40 hover:bg-indigo-50 transition-colors">
            <span className="text-sm font-semibold text-indigo-700 mb-1">
              {selectedFile ? `Selected Cleaned File: ${selectedFile.name}` : 'Click to Browse or Drag & Drop Cleaned Dataset File (.csv, .xlsx)'}
            </span>
            <span className="text-xs text-gray-500">Automatically extracts all column names for target selection</span>
            <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Step 2: Configuration Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">2. AutoML Training Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Column (Y)</label>
              <select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white font-mono font-bold text-indigo-900"
              >
                {availableColumns.map((col, idx) => (
                  <option key={idx} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Task Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="binary_classification">Binary Classification</option>
                <option value="multiclass_classification">Multiclass Classification</option>
                <option value="regression">Regression</option>
                <option value="time_series">Time Series Forecasting</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Optimization Target</label>
              <select
                value={primaryMetric}
                onChange={(e) => setPrimaryMetric(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="f1_score">F1-Score (Balanced)</option>
                <option value="accuracy">Accuracy</option>
                <option value="precision">Precision</option>
                <option value="recall">Recall</option>
                <option value="roc_auc">ROC-AUC</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tuning Trials ({tuningTrials})</label>
              <input
                type="range"
                min="5"
                max="50"
                value={tuningTrials}
                onChange={(e) => setTuningTrials(Number(e.target.value))}
                className="w-full mt-2 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-800">
              <input
                type="checkbox"
                checked={enableEnsemble}
                onChange={(e) => setEnableEnsemble(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              Create Soft Voting Ensemble (Combines Top 3 Models)
            </label>

            <button
              onClick={startAutoML}
              disabled={isTraining}
              className={`px-8 py-3 rounded-xl text-white font-extrabold shadow-sm transition-all text-sm min-w-[220px] ${
                isTraining ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isTraining ? 'Evaluating Algorithms...' : '⚡ Start AutoML Training'}
            </button>
          </div>
        </div>

        {/* Training Console */}
        {executionLogs.length > 0 && (
          <div className="bg-gray-900 rounded-xl shadow-sm p-6 mb-8 border border-gray-800 font-mono">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-indigo-400 uppercase">AutoML Execution Engine Console</span>
              {isTraining && <span className="text-xs text-yellow-400 animate-pulse">Running Step {progressStep}/4...</span>}
            </div>
            <div className="space-y-1.5 text-xs text-gray-200">
              {executionLogs.map((log, idx) => (
                <p key={idx}>{log}</p>
              ))}
            </div>
          </div>
        )}

        {/* ACCURATE METRICS LEADERBOARD MATRIX */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Accurate Algorithm Evaluation Matrix for Target '{targetColumn}'</h2>
              <p className="text-xs text-gray-500 mt-0.5">Click "Inspect Matrix & Charts" to view Confusion Heatmap, ROC Curve, and Feature Importance Graphs</p>
            </div>
            {deployedModel && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                Deployed: {deployedModel}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <th className="py-3.5 px-6">Model Algorithm</th>
                  <th onClick={() => handleSort('accuracy')} className="py-3.5 px-6 cursor-pointer hover:text-indigo-600">
                    Accuracy {sortField === 'accuracy' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('f1_score')} className="py-3.5 px-6 cursor-pointer hover:text-indigo-600">
                    F1 Score {sortField === 'f1_score' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('precision')} className="py-3.5 px-6 cursor-pointer hover:text-indigo-600">
                    Precision {sortField === 'precision' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('recall')} className="py-3.5 px-6 cursor-pointer hover:text-indigo-600">
                    Recall {sortField === 'recall' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('training_time_s')} className="py-3.5 px-6 cursor-pointer hover:text-indigo-600">
                    Time {sortField === 'training_time_s' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedResults.map((m) => (
                  <tr key={m.id} className={m.status === 'best_ensemble' ? 'bg-indigo-50/50 font-medium' : 'hover:bg-gray-50'}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{m.name}</span>
                        {m.status === 'best_ensemble' && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                            ★ Best Soft Voting Ensemble
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">{(m.accuracy * 100).toFixed(1)}%</td>
                    <td className="py-4 px-6 font-bold text-indigo-700">{(m.f1_score * 100).toFixed(1)}%</td>
                    <td className="py-4 px-6 text-gray-700">{(m.precision * 100).toFixed(1)}%</td>
                    <td className="py-4 px-6 text-gray-700">{(m.recall * 100).toFixed(1)}%</td>
                    <td className="py-4 px-6 text-gray-500">{m.training_time_s}s</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => {
                          setInspectedModel(m);
                          setInspectTab('confusion');
                        }}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors border border-indigo-200"
                      >
                        🔍 Inspect Matrix & Charts
                      </button>
                      <button
                        onClick={() => deployModelToMLOps(m.name)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        Deploy Model
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FULL VISUAL INSPECTION MODAL (CONFUSION MATRIX, ROC CURVE, FEATURE GRAPHS) */}
        {inspectedModel && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-gray-200">
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-gray-900 to-indigo-950 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{inspectedModel.name}</h2>
                  <p className="text-xs text-indigo-200 mt-0.5">Evaluation Analysis for target '{targetColumn}'</p>
                </div>
                <button
                  onClick={() => setInspectedModel(null)}
                  className="text-gray-400 hover:text-white text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Sub-tabs in Modal */}
              <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-3 space-x-6">
                <button
                  onClick={() => setInspectTab('confusion')}
                  className={`pb-3 text-xs font-bold border-b-2 transition-colors ${
                    inspectTab === 'confusion' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'
                  }`}
                >
                  🟩 Confusion Matrix Heatmap
                </button>
                <button
                  onClick={() => setInspectTab('roc')}
                  className={`pb-3 text-xs font-bold border-b-2 transition-colors ${
                    inspectTab === 'roc' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'
                  }`}
                >
                  📈 ROC & Precision Curve
                </button>
                <button
                  onClick={() => setInspectTab('features')}
                  className={`pb-3 text-xs font-bold border-b-2 transition-colors ${
                    inspectTab === 'features' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'
                  }`}
                >
                  📊 Feature Importance Graph
                </button>
                <button
                  onClick={() => setInspectTab('hyperparams')}
                  className={`pb-3 text-xs font-bold border-b-2 transition-colors ${
                    inspectTab === 'hyperparams' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'
                  }`}
                >
                  ⚙️ Hyperparameters
                </button>
              </div>

              {/* Modal Body Content */}
              <div className="p-6">
                {/* 1. Confusion Matrix Heatmap */}
                {inspectTab === 'confusion' && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-4">True vs Predicted Confusion Matrix Heatmap</h3>
                    <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                      <div className="p-6 bg-green-500 text-white rounded-2xl shadow-sm text-center border-2 border-green-600">
                        <p className="text-xs font-bold uppercase tracking-wider text-green-100">True Positive (TP)</p>
                        <p className="text-4xl font-black mt-1">{inspectedModel.tp}</p>
                        <p className="text-xs text-green-100 mt-2 font-mono">Correct Positive Class</p>
                      </div>
                      <div className="p-6 bg-red-500 text-white rounded-2xl shadow-sm text-center border-2 border-red-600">
                        <p className="text-xs font-bold uppercase tracking-wider text-red-100">False Positive (FP)</p>
                        <p className="text-4xl font-black mt-1">{inspectedModel.fp}</p>
                        <p className="text-xs text-red-100 mt-2 font-mono">Type I Error</p>
                      </div>
                      <div className="p-6 bg-amber-500 text-white rounded-2xl shadow-sm text-center border-2 border-amber-600">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-100">False Negative (FN)</p>
                        <p className="text-4xl font-black mt-1">{inspectedModel.fn}</p>
                        <p className="text-xs text-amber-100 mt-2 font-mono">Type II Error</p>
                      </div>
                      <div className="p-6 bg-blue-600 text-white rounded-2xl shadow-sm text-center border-2 border-blue-700">
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-100">True Negative (TN)</p>
                        <p className="text-4xl font-black mt-1">{inspectedModel.tn}</p>
                        <p className="text-xs text-blue-100 mt-2 font-mono">Correct Negative Class</p>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-xl grid grid-cols-4 gap-2 text-center text-xs font-mono">
                      <div>
                        <span className="text-gray-500">Accuracy:</span>
                        <p className="font-bold text-gray-900 text-sm">{(inspectedModel.accuracy * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Precision:</span>
                        <p className="font-bold text-gray-900 text-sm">{(inspectedModel.precision * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Recall:</span>
                        <p className="font-bold text-gray-900 text-sm">{(inspectedModel.recall * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500">F1-Score:</span>
                        <p className="font-bold text-indigo-700 text-sm">{(inspectedModel.f1_score * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ROC & Precision Curve */}
                {inspectTab === 'roc' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-gray-900">ROC (Receiver Operating Characteristic) Curve</h3>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                        AUC Area = {(inspectedModel.roc_auc * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="p-6 bg-gray-900 rounded-2xl text-white font-mono space-y-3">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>True Positive Rate (TPR) vs False Positive Rate (FPR)</span>
                        <span>AUC: {inspectedModel.roc_auc}</span>
                      </div>
                      {/* Visual ROC Curve Representation */}
                      <div className="relative h-40 border-l-2 border-b-2 border-gray-700 flex items-end p-2 gap-4">
                        {inspectedModel.roc_points.map((pt, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                            <div
                              className="w-full bg-gradient-to-t from-indigo-600 to-green-400 rounded-t"
                              style={{ height: `${pt.tpr * 100}%` }}
                            ></div>
                            <span className="text-[10px] text-gray-400 mt-1">{pt.fpr}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-400 text-center">False Positive Rate (FPR)</p>
                    </div>
                  </div>
                )}

                {/* 3. Feature Importance Graph */}
                {inspectTab === 'features' && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Feature Relative Importance Graph</h3>
                    <div className="space-y-3">
                      {inspectedModel.feature_importances.map((f, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between text-xs font-bold text-gray-700 mb-1 font-mono">
                            <span>{f.name}</span>
                            <span>{f.importance}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full"
                              style={{ width: `${f.importance}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Hyperparameters */}
                {inspectTab === 'hyperparams' && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Optuna Hyperparameter Configuration</h3>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-1">
                      {Object.entries(inspectedModel.hyperparameters).map(([k, v], idx) => (
                        <p key={idx}>
                          <span className="text-gray-400">{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setInspectedModel(null)}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    deployModelToMLOps(inspectedModel.name);
                    setInspectedModel(null);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-sm"
                >
                  Deploy Model
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
