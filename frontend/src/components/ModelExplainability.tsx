import { useState } from 'react';
import axios from 'axios';

interface ModelExplainabilityProps {
  experimentId: number;
  modelName: string;
  targetColumn: string;
  taskType?: 'classification' | 'regression';
}

export default function ModelExplainability({
  experimentId,
  modelName,
  targetColumn,
  taskType = 'classification',
}: ModelExplainabilityProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchExplainability = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `http://localhost:8000/api/explainability/${experimentId}/explain/${modelName}?target_column=${targetColumn}&task_type=${taskType}`
      );
      setReport(response.data.report || {});
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate model explainability report');
    } finally {
      setLoading(false);
    }
  };

  const featureImportance = report?.feature_importance || report?.coefficients || report?.permutation_importance || {};
  const sortedFeatures = Object.entries(featureImportance).sort((a: any, b: any) => Math.abs(b[1]) - Math.abs(a[1]));
  const maxImportance = sortedFeatures.length > 0 ? Math.abs(sortedFeatures[0][1] as number) : 1;

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Model Explainability & SHAP</h2>
          <p className="text-gray-600 text-sm mt-1">
            Interpret global feature importances and feature contributions for <span className="font-semibold text-blue-600">{modelName}</span>
          </p>
        </div>

        <button
          onClick={fetchExplainability}
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition flex items-center gap-2 shadow-sm"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Explaining Model...
            </>
          ) : (
            <>🔍 Analyze Feature Importance</>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {report && sortedFeatures.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Top Feature Contributions</h3>
          <div className="space-y-3">
            {sortedFeatures.slice(0, 10).map(([feature, value]: [string, any]) => {
              const absVal = Math.abs(value);
              const barWidth = maxImportance > 0 ? (absVal / maxImportance) * 100 : 0;

              return (
                <div key={feature} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-800">{feature}</span>
                    <span className="font-mono text-xs text-blue-600 font-bold">{value.toFixed(4)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
