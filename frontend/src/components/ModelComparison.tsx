import { useState, useEffect } from 'react';
import axios from 'axios';

interface ComparisonItem {
  model_name: string;
  training_time_seconds: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  roc_auc?: number;
  r2?: number;
  rmse?: number;
  mae?: number;
  mse?: number;
  [key: string]: any;
}

interface ModelComparisonProps {
  experimentId: number;
  taskType?: 'classification' | 'regression';
}

export default function ModelComparison({
  experimentId,
  taskType = 'classification',
}: ModelComparisonProps) {
  const [comparison, setComparison] = useState<ComparisonItem[]>([]);
  const [metric, setMetric] = useState<string>(taskType === 'classification' ? 'f1' : 'r2');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComparison();
  }, [experimentId, metric]);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/api/training/${experimentId}/comparison?metric=${metric}`
      );
      setComparison(response.data.comparison || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch model comparison');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Loading model comparison...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600">
        {error}
      </div>
    );
  }

  if (comparison.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-gray-500 text-center">
        No trained models available for comparison yet. Run training to view side-by-side results.
      </div>
    );
  }

  const primaryMetric = metric;

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Model Leaderboard & Comparison</h2>
          <p className="text-gray-600 text-sm mt-1">
            Compare performance metrics and training speeds across all evaluated algorithms
          </p>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
          >
            {taskType === 'classification' ? (
              <>
                <option value="f1">F1-Score</option>
                <option value="accuracy">Accuracy</option>
                <option value="precision">Precision</option>
                <option value="recall">Recall</option>
                <option value="training_time_seconds">Training Time</option>
              </>
            ) : (
              <>
                <option value="r2">R² Score</option>
                <option value="rmse">RMSE</option>
                <option value="mae">MAE</option>
                <option value="training_time_seconds">Training Time</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Visual Leaderboard Bars */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Performance Rankings ({metric.toUpperCase()})</h3>
        {comparison.map((item, idx) => {
          const val = item[metric] || 0;
          const maxVal = Math.max(...comparison.map(c => c[metric] || 0), 1);
          const barWidth = maxVal > 0 ? Math.min(100, Math.max(5, (val / maxVal) * 100)) : 0;

          return (
            <div key={item.model_name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-800">
                  {idx + 1}. {item.model_name}
                </span>
                <span className="font-bold text-blue-600">
                  {typeof val === 'number'
                    ? metric.includes('time')
                      ? `${val.toFixed(2)}s`
                      : val <= 1 ? `${(val * 100).toFixed(1)}%` : val.toFixed(4)
                    : val}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-blue-500' : 'bg-indigo-400'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
