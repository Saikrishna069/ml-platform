import { useState } from 'react';
import axios from 'axios';

interface HyperparameterTuningProps {
  experimentId: number;
  modelName: string;
  targetColumn: string;
  taskType?: 'classification' | 'regression';
  onTuningComplete?: (result: any) => void;
}

export default function HyperparameterTuning({
  experimentId,
  modelName,
  targetColumn,
  taskType = 'classification',
  onTuningComplete,
}: HyperparameterTuningProps) {
  const [tuningMethod, setTuningMethod] = useState<'random' | 'grid' | 'bayesian'>('random');
  const [cvFolds, setCvFolds] = useState<number>(5);
  const [isTuning, setIsTuning] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startTuning = async () => {
    setIsTuning(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(
        `http://localhost:8000/api/hyperparameter/${experimentId}/tune/${modelName}`,
        {
          model_name: modelName,
          tuning_method: tuningMethod,
          target_column: targetColumn,
          task_type: taskType,
          cv_folds: cvFolds,
        }
      );

      setResult(response.data);
      if (onTuningComplete) {
        onTuningComplete(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Hyperparameter tuning failed');
    } finally {
      setIsTuning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Hyperparameter Optimization Engine</h2>
        <p className="text-gray-600 text-sm mt-1">
          Tune hyperparameter search grids to maximize model generalization on <span className="font-semibold text-blue-600">{modelName}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Strategy</label>
          <select
            value={tuningMethod}
            onChange={(e: any) => setTuningMethod(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm"
          >
            <option value="random">Randomized Search (Fast & Broad)</option>
            <option value="grid">Exhaustive Grid Search (Comprehensive)</option>
            <option value="bayesian">Bayesian Optimization (Smart GP)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cross-Validation Folds</label>
          <select
            value={cvFolds}
            onChange={(e) => setCvFolds(Number(e.target.value))}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm"
          >
            <option value={3}>3 Folds</option>
            <option value={5}>5 Folds (Standard)</option>
            <option value={10}>10 Folds (Thorough)</option>
          </select>
        </div>
      </div>

      <button
        onClick={startTuning}
        disabled={isTuning}
        className={`w-full py-3 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${
          isTuning ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {isTuning ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Tuning Hyperparameters...
          </>
        ) : (
          <>⚙️ Execute Hyperparameter Optimization</>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-purple-200 pb-3">
            <h3 className="text-lg font-bold text-purple-900">Optimization Completed!</h3>
            <span className="text-xs bg-purple-200 text-purple-800 px-3 py-1 rounded-full font-bold uppercase">
              Time: {result.tuning_time_seconds?.toFixed(2)}s
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">Optimal Hyperparameters Found</h4>
            <div className="bg-white p-3 rounded-md border border-purple-100 font-mono text-xs text-gray-800 overflow-x-auto">
              {JSON.stringify(result.best_params, null, 2)}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">Evaluation Metrics Post-Tuning</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(result.metrics || {}).map(([key, value]: [string, any]) => (
                <div key={key} className="bg-white p-2.5 rounded border border-purple-100 text-center">
                  <span className="text-xs text-gray-500 uppercase block">{key}</span>
                  <span className="font-bold text-purple-900">
                    {typeof value === 'number' ? (value <= 1 ? `${(value * 100).toFixed(1)}%` : value.toFixed(4)) : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
