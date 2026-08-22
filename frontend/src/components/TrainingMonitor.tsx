import { useState, useEffect } from 'react';
import axios from 'axios';

interface ModelResult {
  model_name: string;
  metrics: Record<string, any>;
  training_time_seconds: number;
  cross_val_mean?: number;
  cross_val_std?: number;
  status?: string;
  error?: string;
}

interface TrainingMonitorProps {
  experimentId: number;
  datasetId: number;
  targetColumn: string;
  selectedModels: string[];
  taskType?: 'classification' | 'regression';
  onTrainingComplete?: (results: ModelResult[]) => void;
}

export default function TrainingMonitor({
  experimentId,
  datasetId,
  targetColumn,
  selectedModels,
  taskType = 'classification',
  onTrainingComplete,
}: TrainingMonitorProps) {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ModelResult[]>([]);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startTraining = async () => {
    if (selectedModels.length === 0) {
      setError('No models selected for training');
      return;
    }

    setIsTraining(true);
    setProgress(0);
    setError(null);
    setResults([]);

    try {
      // Trigger training API endpoint
      const response = await axios.post(
        `http://localhost:8000/api/training/${experimentId}/train`,
        {
          target_column: targetColumn,
          task_type: taskType,
          model_names: selectedModels,
          test_size: 0.2,
        }
      );

      const trainResults: ModelResult[] = response.data.results || [];
      setResults(trainResults);
      setProgress(100);
      setIsTraining(false);

      if (onTrainingComplete) {
        onTrainingComplete(trainResults);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Training failed to execute');
      setIsTraining(false);
    }
  };

  const getBestModel = (): ModelResult | null => {
    if (results.length === 0) return null;
    const validResults = results.filter(r => !r.error && r.metrics);
    if (validResults.length === 0) return null;

    return validResults.reduce((best, current) => {
      const bestScore = taskType === 'classification' ? (best.metrics?.f1 || 0) : (best.metrics?.r2 || -Infinity);
      const currScore = taskType === 'classification' ? (current.metrics?.f1 || 0) : (current.metrics?.r2 || -Infinity);
      return currScore > bestScore ? current : best;
    }, validResults[0]);
  };

  const bestModel = getBestModel();

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Model Training Engine</h2>
          <p className="text-gray-600 text-sm mt-1">
            Experiment #{experimentId} • Target: <span className="font-semibold text-blue-600">{targetColumn}</span> ({taskType})
          </p>
        </div>

        <button
          onClick={startTraining}
          disabled={isTraining || selectedModels.length === 0}
          className={`
            px-6 py-2.5 rounded-lg font-semibold text-white transition flex items-center gap-2 shadow-sm
            ${isTraining || selectedModels.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }
          `}
        >
          {isTraining ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Training Models...
            </>
          ) : (
            <>
              ⚡ Train {selectedModels.length} Selected Model{selectedModels.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {isTraining && (
        <div className="space-y-2 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex justify-between text-sm text-blue-900 font-medium">
            <span>Training pipeline executing...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Best Model Winner Banner */}
      {bestModel && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                🏆 Top Performer
              </span>
              <h3 className="text-3xl font-extrabold mt-2">{bestModel.model_name}</h3>
              <p className="text-emerald-100 text-sm mt-1">
                Highest overall {taskType === 'classification' ? 'F1-Score' : 'R² Score'} among all tested models
              </p>
            </div>
            <div className="text-right bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/20">
              <span className="text-xs uppercase tracking-wider text-emerald-100 block">Primary Metric</span>
              <span className="text-3xl font-black">
                {taskType === 'classification'
                  ? `${((bestModel.metrics?.f1 || 0) * 100).toFixed(1)}% F1`
                  : (bestModel.metrics?.r2 || 0).toFixed(4)
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Trained Models Table */}
      {results.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {taskType === 'classification' ? (
                  <>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precision</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Recall</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">F1-Score</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">R² Score</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">RMSE</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">MAE</th>
                  </>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Time (s)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((res) => (
                <tr key={res.model_name} className={res.model_name === bestModel?.model_name ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                    {res.model_name === bestModel?.model_name && <span>👑</span>}
                    {res.model_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {res.error ? (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Failed</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completed</span>
                    )}
                  </td>
                  {taskType === 'classification' ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                        {res.metrics?.accuracy ? (res.metrics.accuracy * 100).toFixed(1) + '%' : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                        {res.metrics?.precision ? (res.metrics.precision * 100).toFixed(1) + '%' : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                        {res.metrics?.recall ? (res.metrics.recall * 100).toFixed(1) + '%' : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-bold">
                        {res.metrics?.f1 ? (res.metrics.f1 * 100).toFixed(1) + '%' : '-'}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-bold">
                        {res.metrics?.r2 !== undefined ? res.metrics.r2.toFixed(4) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                        {res.metrics?.rmse !== undefined ? res.metrics.rmse.toFixed(4) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                        {res.metrics?.mae !== undefined ? res.metrics.mae.toFixed(4) : '-'}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {res.training_time_seconds ? res.training_time_seconds.toFixed(2) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
