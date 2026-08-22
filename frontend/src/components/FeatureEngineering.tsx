import { useState, useEffect } from 'react';
import axios from 'axios';

interface FeatureEngineeringProps {
  datasetId: number;
  targetColumn?: string;
  taskType?: 'classification' | 'regression';
  onEngineeringComplete?: (engineeredPath: string) => void;
}

export default function FeatureEngineering({
  datasetId,
  targetColumn,
  taskType = 'classification',
  onEngineeringComplete,
}: FeatureEngineeringProps) {
  const [strategies, setStrategies] = useState<string[]>(['drop_low_variance', 'statistical_features', 'kbest']);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, [datasetId]);

  const fetchSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const response = await axios.get(`http://localhost:8000/api/feature-engineering/${datasetId}/suggestions`);
      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.warn('Failed to fetch feature engineering suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleStrategy = (strat: string) => {
    setStrategies(prev =>
      prev.includes(strat) ? prev.filter(s => s !== strat) : [...prev, strat]
    );
  };

  const executeEngineering = async () => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`http://localhost:8000/api/feature-engineering/${datasetId}/engineer`, {
        target_column: targetColumn,
        task_type: taskType,
        strategies: strategies,
      });

      setResult(response.data);
      if (onEngineeringComplete && response.data.engineered_file_path) {
        onEngineeringComplete(response.data.engineered_file_path);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Feature engineering failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Automated Feature Engineering</h2>
        <p className="text-gray-600 text-sm mt-1">
          Transform features, generate polynomial & statistical metrics, and select top predictors
        </p>
      </div>

      {/* Suggested Strategies */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">💡 Recommended Strategies for Dataset</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map(s => (
              <div
                key={s.strategy}
                onClick={() => toggleStrategy(s.strategy)}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  strategies.includes(s.strategy) ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={strategies.includes(s.strategy)} onChange={() => {}} className="rounded text-emerald-600" />
                  <span className="font-semibold text-gray-900 capitalize text-sm">{s.strategy.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{s.description}</p>
                <span className="text-[11px] text-emerald-700 font-medium block mt-1">Benefit: {s.benefit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={executeEngineering}
        disabled={isProcessing || strategies.length === 0}
        className={`w-full py-3 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${
          isProcessing || strategies.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Engineering Features...
          </>
        ) : (
          <>✨ Run Feature Engineering ({strategies.length} Active)</>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-bold text-emerald-900">Feature Engineering Completed</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded border border-emerald-100 text-center">
              <span className="text-xs text-gray-500 block">Original Features</span>
              <span className="text-xl font-bold text-gray-800">{result.summary?.original_features}</span>
            </div>
            <div className="bg-white p-3 rounded border border-emerald-100 text-center">
              <span className="text-xs text-gray-500 block">Final Features</span>
              <span className="text-xl font-bold text-emerald-700">{result.summary?.final_features}</span>
            </div>
            <div className="bg-white p-3 rounded border border-emerald-100 text-center">
              <span className="text-xs text-gray-500 block">Net Change</span>
              <span className="text-xl font-bold text-blue-600">
                {result.summary?.features_added > 0 ? `+${result.summary.features_added}` : result.summary?.features_added}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
