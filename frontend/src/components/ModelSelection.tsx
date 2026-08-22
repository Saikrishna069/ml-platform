import { useState, useEffect } from 'react';
import axios from 'axios';

interface ModelRecommendation {
  name: string;
  score: number;
  reason: string;
}

interface ModelSelectionProps {
  datasetId: number;
  targetColumn?: string;
  onModelsSelected?: (models: string[]) => void;
}

export default function ModelSelection({
  datasetId,
  targetColumn,
  onModelsSelected,
}: ModelSelectionProps) {
  const [recommendations, setRecommendations] = useState<ModelRecommendation[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [datasetId, targetColumn]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('dataset_id', datasetId.toString());
      if (targetColumn) {
        params.append('target_column', targetColumn);
      }
      params.append('top_n', '7');

      const response = await axios.post(
        `http://localhost:8000/api/models/recommend?${params}`
      );

      const recs = response.data.recommendations.recommendations || [];
      setRecommendations(recs);
      // Preselect top 3 by default
      const defaultSelected = recs.slice(0, 3).map((r: ModelRecommendation) => r.name);
      setSelectedModels(defaultSelected);
      if (onModelsSelected) {
        onModelsSelected(defaultSelected);
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const toggleModel = (modelName: string) => {
    const updated = selectedModels.includes(modelName)
      ? selectedModels.filter(m => m !== modelName)
      : [...selectedModels, modelName];
    
    setSelectedModels(updated);
    if (onModelsSelected) {
      onModelsSelected(updated);
    }
  };

  const toggleAllModels = () => {
    let updated: string[];
    if (selectedModels.length === recommendations.length) {
      updated = [];
    } else {
      updated = recommendations.map(r => r.name);
    }
    setSelectedModels(updated);
    if (onModelsSelected) {
      onModelsSelected(updated);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading model recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchRecommendations}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Recommended Models</h2>
        <p className="text-gray-600">
          Select which models to train. Selected models will be trained and compared.
        </p>
      </div>

      {/* Select All */}
      <div className="mb-6 flex items-center gap-2">
        <input
          type="checkbox"
          id="select-all"
          checked={selectedModels.length === recommendations.length && recommendations.length > 0}
          onChange={toggleAllModels}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
        <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
          Select All Models ({selectedModels.length}/{recommendations.length})
        </label>
      </div>

      {/* Model Grid */}
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.name}
            onClick={() => toggleModel(rec.name)}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition
              ${selectedModels.includes(rec.name)
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 pt-1">
                <input
                  type="checkbox"
                  checked={selectedModels.includes(rec.name)}
                  onChange={() => toggleModel(rec.name)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {rec.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${rec.score * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 min-w-[35px] text-right">
                      {(rec.score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600">{rec.reason}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedModels.length === 0 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700 text-sm font-medium">
            ⚠️ Please select at least one model to continue training.
          </p>
        </div>
      )}
    </div>
  );
}
