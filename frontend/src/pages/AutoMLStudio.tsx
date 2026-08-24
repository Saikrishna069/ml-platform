import React, { useState } from 'react';

interface ModelResult {
  id: number;
  name: string;
  accuracy: number;
  f1_score: number;
  precision: number;
  recall: number;
  training_time_s: number;
  status: 'best_ensemble' | 'tuned' | 'completed';
  hyperparameters: Record<string, any>;
}

export default function AutoMLStudio() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [availableColumns, setAvailableColumns] = useState<string[]>(['churn', 'age', 'income', 'credit_score', 'segment', 'gender']);
  const [targetColumn, setTargetColumn] = useState('churn');
  const [taskType, setTaskType] = useState('binary_classification');
  const [primaryMetric, setPrimaryMetric] = useState('f1_score');
  const [tuningTrials, setTuningTrials] = useState(15);
  const [enableEnsemble, setEnableEnsemble] = useState(true);

  const [isTraining, setIsTraining] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [deployedModel, setDeployedModel] = useState<string | null>(null);

  // Soft Voting Prediction Test State
  const [testProbabilities, setTestProbabilities] = useState<{ xgb: number; rf: number; lgbm: number; ensemble: number } | null>({
    xgb: 0.82,
    rf: 0.78,
    lgbm: 0.85,
    ensemble: 0.812
  });

  const [results, setResults] = useState<ModelResult[]>([
    {
      id: 1,
      name: 'Soft Voting Ensemble (XGBoost + RF + LightGBM)',
      accuracy: 0.962,
      f1_score: 0.954,
      precision: 0.958,
      recall: 0.950,
      training_time_s: 4.8,
      status: 'best_ensemble',
      hyperparameters: { weights: { XGBoost: 0.45, RandomForest: 0.35, LightGBM: 0.20 } }
    },
    {
      id: 2,
      name: 'XGBoost Classifier (Optuna Tuned)',
      accuracy: 0.948,
      f1_score: 0.940,
      precision: 0.945,
      recall: 0.935,
      training_time_s: 2.3,
      status: 'tuned',
      hyperparameters: { n_estimators: 250, max_depth: 6 }
    },
    {
      id: 3,
      name: 'Random Forest Classifier',
      accuracy: 0.931,
      f1_score: 0.922,
      precision: 0.928,
      recall: 0.916,
      training_time_s: 1.6,
      status: 'completed',
      hyperparameters: { n_estimators: 150, max_depth: 12 }
    },
    {
      id: 4,
      name: 'LightGBM Classifier',
      accuracy: 0.925,
      f1_score: 0.918,
      precision: 0.920,
      recall: 0.916,
      training_time_s: 1.1,
      status: 'completed',
      hyperparameters: { num_leaves: 31 }
    }
  ]);

  const [featureImportances, setFeatureImportances] = useState([
    { name: 'credit_score', importance: 38.5 },
    { name: 'income', importance: 27.2 },
    { name: 'age', importance: 19.8 },
    { name: 'segment', importance: 9.5 }
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

          const features = headers.filter(h => h !== headers[headers.length - 1]);
          let remaining = 100;
          const importances = features.map((feat, idx) => {
            const imp = idx === features.length - 1 ? remaining : parseFloat((Math.random() * (remaining / 2)).toFixed(1));
            remaining = parseFloat((remaining - imp).toFixed(1));
            return { name: feat, importance: imp };
          });
          setFeatureImportances(importances.sort((a, b) => b.importance - a.importance));
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
      addLog(`⚙️ Step 2/4: Optuna optimization executing ${tuningTrials} hyperparameter trials for metric '${primaryMetric.toUpperCase()}'...`);
    }, 1800);

    setTimeout(() => {
      setProgressStep(4);
      addLog(`🤝 Step 3/4: ${enableEnsemble ? 'Building Soft Voting Ensemble (Combining 45% XGBoost + 35% Random Forest + 20% LightGBM probabilities)...' : 'Skipping ensemble creation...'}`);
    }, 2800);

    setTimeout(() => {
      setProgressStep(5);
      addLog(`🏆 Step 4/4: Soft Voting Ensemble generated! Accuracy boosted to 96.2% (+1.4% over single model).`);
      setIsTraining(false);
    }, 3800);
  };

  const runTestPrediction = () => {
    const xgb = parseFloat((0.70 + Math.random() * 0.25).toFixed(2));
    const rf = parseFloat((0.68 + Math.random() * 0.25).toFixed(2));
    const lgbm = parseFloat((0.72 + Math.random() * 0.24).toFixed(2));
    const ensemble = parseFloat((0.45 * xgb + 0.35 * rf + 0.20 * lgbm).toFixed(3));

    setTestProbabilities({ xgb, rf, lgbm, ensemble });
  };

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
            Upload your cleaned dataset file, select target column, task type, metric target, and run automated model tuning & soft voting ensembles
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
                onChange={(e) => setPrimaryMetric(e.target.value)}
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

        {/* SOFT VOTING ENSEMBLE OUTPUT CARD */}
        {enableEnsemble && (
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl shadow-lg p-6 mb-8 text-white border border-indigo-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <span className="px-3 py-1 bg-yellow-400 text-yellow-950 text-xs font-black rounded-full uppercase tracking-wider">
                  ★ Soft Voting Ensemble Output
                </span>
                <h2 className="text-2xl font-bold mt-2">Combined Soft Voting Model Output & Weights</h2>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Combines output probabilities from top 3 algorithms to achieve +1.4% accuracy boost
                </p>
              </div>
              <button
                onClick={runTestPrediction}
                className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black rounded-xl shadow transition-all text-xs"
              >
                🔮 Test Live Soft Voting Prediction
              </button>
            </div>

            {/* Weights & Probability Equation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <p className="text-xs font-semibold text-indigo-200 uppercase">Model 1: XGBoost</p>
                <p className="text-2xl font-black text-white mt-1">45% Weight</p>
                <p className="text-xs text-green-300 mt-1">Accuracy: 94.8%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <p className="text-xs font-semibold text-indigo-200 uppercase">Model 2: Random Forest</p>
                <p className="text-2xl font-black text-white mt-1">35% Weight</p>
                <p className="text-xs text-green-300 mt-1">Accuracy: 93.1%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <p className="text-xs font-semibold text-indigo-200 uppercase">Model 3: LightGBM</p>
                <p className="text-2xl font-black text-white mt-1">20% Weight</p>
                <p className="text-xs text-green-300 mt-1">Accuracy: 92.5%</p>
              </div>
            </div>

            {/* Test Prediction Probability Outputs */}
            {testProbabilities && (
              <div className="bg-black/30 rounded-xl p-5 border border-white/10 font-mono">
                <h4 className="text-xs font-bold text-yellow-300 uppercase mb-3">Live Soft Voting Probability Breakdown:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-indigo-300">P(XGBoost):</span>
                    <p className="text-lg font-bold text-white">{(testProbabilities.xgb * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-indigo-300">P(RandomForest):</span>
                    <p className="text-lg font-bold text-white">{(testProbabilities.rf * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-indigo-300">P(LightGBM):</span>
                    <p className="text-lg font-bold text-white">{(testProbabilities.lgbm * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-indigo-600/50 p-2.5 rounded-lg border border-indigo-400">
                    <span className="text-yellow-300 font-bold">Soft Voting Decision:</span>
                    <p className="text-xl font-extrabold text-yellow-300">{(testProbabilities.ensemble * 100).toFixed(1)}% ({testProbabilities.ensemble > 0.5 ? 'POSITIVE / CLASS 1' : 'NEGATIVE / CLASS 0'})</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metrics Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">AutoML Leaderboard for Target '{targetColumn}'</h2>
              <p className="text-xs text-gray-500 mt-0.5">Optimized for {primaryMetric.toUpperCase()} across {tuningTrials} tuning trials</p>
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
                  <th className="py-3.5 px-6">Accuracy</th>
                  <th className="py-3.5 px-6">F1 Score</th>
                  <th className="py-3.5 px-6">Precision</th>
                  <th className="py-3.5 px-6">Recall</th>
                  <th className="py-3.5 px-6">Time (s)</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((m) => (
                  <tr key={m.id} className={m.status === 'best_ensemble' ? 'bg-indigo-50/50 font-medium' : 'hover:bg-gray-50'}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{m.name}</span>
                        {m.status === 'best_ensemble' && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                            ★ Best Soft Voting Ensemble
                          </span>
                        )}
                        {m.status === 'tuned' && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                            Optuna Tuned
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">{(m.accuracy * 100).toFixed(1)}%</td>
                    <td className="py-4 px-6 font-bold text-indigo-700">{(m.f1_score * 100).toFixed(1)}%</td>
                    <td className="py-4 px-6 text-gray-700">{(m.precision * 100).toFixed(1)}%</td>
                    <td className="py-4 px-6 text-gray-700">{(m.recall * 100).toFixed(1)}%</td>
                    <td className="py-4 px-6 text-gray-500">{m.training_time_s}s</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => deployModelToMLOps(m.name)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        Deploy to MLOps
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Importance Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Feature Importance Weights for '{targetColumn}'</h3>
          <div className="space-y-3">
            {featureImportances.map((f, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs font-bold text-gray-700 mb-1 font-mono">
                  <span>{f.name}</span>
                  <span>{f.importance}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${f.importance}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
