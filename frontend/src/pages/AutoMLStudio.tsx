import React, { useState } from 'react';

interface ModelResult {
  name: string;
  accuracy: number;
  f1_score: number;
  precision: number;
  recall: number;
  training_time_s: number;
  status: string;
}

export default function AutoMLStudio() {
  const [targetColumn, setTargetColumn] = useState('churn');
  const [taskType, setTaskType] = useState('binary_classification');
  const [isTraining, setIsTraining] = useState(false);
  const [results, setResults] = useState<ModelResult[]>([
    {
      name: 'XGBoost Classifier',
      accuracy: 0.945,
      f1_score: 0.938,
      precision: 0.941,
      recall: 0.935,
      training_time_s: 2.4,
      status: 'best'
    },
    {
      name: 'Random Forest Ensemble',
      accuracy: 0.928,
      f1_score: 0.920,
      precision: 0.925,
      recall: 0.915,
      training_time_s: 1.8,
      status: 'completed'
    },
    {
      name: 'Logistic Regression',
      accuracy: 0.852,
      f1_score: 0.840,
      precision: 0.845,
      recall: 0.835,
      training_time_s: 0.5,
      status: 'completed'
    }
  ]);

  const runAutoML = () => {
    setIsTraining(true);
    setTimeout(() => {
      setIsTraining(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AutoML Training Studio</h1>
          <p className="text-gray-600">Automated model selection, hyperparameter optimization, and soft voting ensemble creation</p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">AutoML Pipeline Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Column</label>
              <input
                type="text"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="binary_classification">Binary Classification</option>
                <option value="multiclass_classification">Multiclass Classification</option>
                <option value="regression">Regression</option>
                <option value="time_series">Time Series Forecasting</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={runAutoML}
                disabled={isTraining}
                className={`w-full py-2.5 px-6 rounded-lg text-white font-bold transition-all ${
                  isTraining ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm'
                }`}
              >
                {isTraining ? 'Evaluating Algorithms...' : 'Start AutoML Training'}
              </button>
            </div>
          </div>
        </div>

        {/* Evaluation Comparison Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Leaderboard & Model Rankings</h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
              Soft Voting Ensemble Ready
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <th className="py-3 px-6">Model Algorithm</th>
                  <th className="py-3 px-6">Accuracy</th>
                  <th className="py-3 px-6">F1 Score</th>
                  <th className="py-3 px-6">Precision</th>
                  <th className="py-3 px-6">Recall</th>
                  <th className="py-3 px-6">Train Time</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {results.map((m, idx) => (
                  <tr key={idx} className={m.status === 'best' ? 'bg-blue-50/40 font-medium' : ''}>
                    <td className="py-4 px-6 flex items-center gap-2">
                      <span className="font-bold text-gray-900">{m.name}</span>
                      {m.status === 'best' && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded font-bold">
                          ★ Best Model
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-900">{(m.accuracy * 100).toFixed(1)}%</td>
                    <td className="py-4 px-6">{(m.f1_score * 100).toFixed(1)}%</td>
                    <td className="py-4 px-6">{(m.precision * 100).toFixed(1)}%</td>
                    <td className="py-4 px-6">{(m.recall * 100).toFixed(1)}%</td>
                    <td className="py-4 px-6 text-gray-500">{m.training_time_s}s</td>
                    <td className="py-4 px-6 text-right">
                      <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700">
                        Deploy to MLOps
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
