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
  const [targetColumn, setTargetColumn] = useState('churn');
  const [taskType, setTaskType] = useState('binary_classification');
  const [primaryMetric, setPrimaryMetric] = useState('f1_score');
  const [tuningTrials, setTuningTrials] = useState(15);
  const [enableEnsemble, setEnableEnsemble] = useState(true);

  const [isTraining, setIsTraining] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [deployedModel, setDeployedModel] = useState<string | null>(null);

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
      hyperparameters: { ensemble_weights: [0.45, 0.35, 0.20], voting: 'soft' }
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
      hyperparameters: { n_estimators: 250, max_depth: 6, learning_rate: 0.03, subsample: 0.8 }
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
      hyperparameters: { n_estimators: 150, max_depth: 12, min_samples_split: 5 }
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
      hyperparameters: { num_leaves: 31, learning_rate: 0.05 }
    },
    {
      id: 5,
      name: 'Logistic Regression Baseline',
      accuracy: 0.854,
      f1_score: 0.842,
      precision: 0.848,
      recall: 0.836,
      training_time_s: 0.4,
      status: 'completed',
      hyperparameters: { C: 1.0, penalty: 'l2', solver: 'lbfgs' }
    }
  ]);

  // Feature Importance Data
  const featureImportances = [
    { name: 'credit_score', importance: 38.5 },
    { name: 'income', importance: 27.2 },
    { name: 'age', importance: 19.8 },
    { name: 'num_products', importance: 9.5 },
    { name: 'tenure', importance: 5.0 }
  ];

  // REAL AUTOMATED TRAINING ENGINE SIMULATOR
  const startAutoML = () => {
    setIsTraining(true);
    setProgressStep(1);
    setExecutionLogs([]);
    setDeployedModel(null);

    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setExecutionLogs([...logs]);
    };

    addLog(`🚀 Initializing AutoML Pipeline for target column '${targetColumn}' (${taskType})...`);

    setTimeout(() => {
      setProgressStep(2);
      addLog(`📊 Step 1/4: Automated Train/Validation Data Splitting & Preprocessing...`);
    }, 800);

    setTimeout(() => {
      setProgressStep(3);
      addLog(`⚙️ Step 2/4: Running Optuna Hyperparameter Optimization across ${tuningTrials} trials...`);
    }, 1800);

    setTimeout(() => {
      setProgressStep(4);
      addLog(`🤝 Step 3/4: Constructing Weighted Soft Voting Ensemble (XGBoost + Random Forest)...`);
    }, 2800);

    setTimeout(() => {
      setProgressStep(5);
      addLog(`🏆 Step 4/4: Finalizing Evaluation Metrics & Generating Leaderboard...`);
      setIsTraining(false);
    }, 3800);
  };

  const deployModelToMLOps = (modelName: string) => {
    setDeployedModel(modelName);
    alert(`Successfully registered '${modelName}' into MLOps Production Registry!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">AutoML Training Studio</h1>
          <p className="text-sm text-gray-600">
            Automated algorithm selection, Optuna hyperparameter optimization, and soft voting ensemble creation
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">AutoML Pipeline Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Column</label>
              <input
                type="text"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
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
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Optuna Tuning Trials ({tuningTrials})</label>
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
              Build Soft Voting Ensemble (Combines Top 3 Models)
            </label>

            <button
              onClick={startAutoML}
              disabled={isTraining}
              className={`px-8 py-3 rounded-xl text-white font-extrabold shadow-sm transition-all text-sm min-w-[200px] ${
                isTraining ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isTraining ? 'Evaluating Algorithms...' : '⚡ Start AutoML Training'}
            </button>
          </div>
        </div>

        {/* Real-time Training Logs Console */}
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

        {/* Evaluation Metrics Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">AutoML Leaderboard & Algorithm Rankings</h2>
              <p className="text-xs text-gray-500 mt-0.5">Ranked by target optimization metric ({primaryMetric.toUpperCase()})</p>
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
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ensemble Feature Importance Weights</h3>
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
