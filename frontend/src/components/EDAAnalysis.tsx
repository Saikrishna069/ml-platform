import { useState, useEffect } from 'react';
import { edaAPI } from '../api/client';

interface EDAAnalysisProps {
  datasetId: number;
}

export default function EDAAnalysis({ datasetId }: EDAAnalysisProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'numeric' | 'categorical' | 'missing' | 'outliers' | 'correlations'>('overview');

  // Preprocessing config state
  const [preprocessingConfig, setPreprocessingConfig] = useState({
    remove_duplicates: true,
    remove_outliers: false,
    outlier_method: 'iqr',
    scaling_method: 'standard',
    encoding_method: 'label',
    missing_numeric_strategy: 'mean',
    missing_categorical_strategy: 'most_frequent',
  });
  const [preprocessingLoading, setPreprocessingLoading] = useState(false);
  const [preprocessingResult, setPreprocessingResult] = useState<any>(null);

  useEffect(() => {
    fetchAnalysis();
  }, [datasetId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await edaAPI.getAnalysis(datasetId);
      setAnalysis(response.data.analysis);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load EDA analysis');
    } finally {
      setLoading(false);
    }
  };

  const handlePreprocess = async () => {
    try {
      setPreprocessingLoading(true);
      const response = await edaAPI.preprocess(datasetId, preprocessingConfig);
      setPreprocessingResult(response.data);
      // Refresh analysis report after preprocessing
      await fetchAnalysis();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Preprocessing failed');
    } finally {
      setPreprocessingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600 font-medium">Running Exploratory Data Analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={fetchAnalysis}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
        >
          Retry EDA
        </button>
      </div>
    );
  }

  if (!analysis) {
    return <div className="bg-white rounded-lg shadow p-6 text-gray-600">No analysis data available</div>;
  }

  const { basic_statistics, data_types, missing_values, numerical_statistics, categorical_statistics, outliers, correlations } = analysis;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'numeric', label: `Numeric (${data_types?.n_numeric || 0})` },
            { id: 'categorical', label: `Categorical (${data_types?.n_categorical || 0})` },
            { id: 'missing', label: `Missing (${missing_values?.total_missing || 0})` },
            { id: 'outliers', label: 'Outliers' },
            { id: 'correlations', label: 'Correlations' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Total Rows</p>
                <p className="text-2xl font-bold text-indigo-900 mt-1">{basic_statistics?.shape?.n_rows?.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Total Columns</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{basic_statistics?.shape?.n_columns}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Memory Size</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">{basic_statistics?.size_mb?.toFixed(2)} MB</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-4">
                <p className="text-xs text-rose-600 font-semibold uppercase tracking-wider">Duplicate Rows</p>
                <p className="text-2xl font-bold text-rose-900 mt-1">
                  {basic_statistics?.duplicates} ({basic_statistics?.duplicate_percentage?.toFixed(1)}%)
                </p>
              </div>
            </div>

            {/* Quick Preprocessing Action Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-800 text-md mb-3">Quick Dataset Preprocessing</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Numeric Scaling</label>
                  <select
                    value={preprocessingConfig.scaling_method}
                    onChange={(e) => setPreprocessingConfig({ ...preprocessingConfig, scaling_method: e.target.value })}
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2 border"
                  >
                    <option value="standard">Standard Scaling (Z-Score)</option>
                    <option value="minmax">MinMax Scaling (0-1)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Categorical Encoding</label>
                  <select
                    value={preprocessingConfig.encoding_method}
                    onChange={(e) => setPreprocessingConfig({ ...preprocessingConfig, encoding_method: e.target.value })}
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2 border"
                  >
                    <option value="label">Label Encoding</option>
                    <option value="onehot">One-Hot Encoding</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Outliers</label>
                  <label className="flex items-center mt-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={preprocessingConfig.remove_outliers}
                      onChange={(e) => setPreprocessingConfig({ ...preprocessingConfig, remove_outliers: e.target.checked })}
                      className="mr-2 rounded text-indigo-600"
                    />
                    Remove IQR Outliers
                  </label>
                </div>
              </div>
              <button
                onClick={handlePreprocess}
                disabled={preprocessingLoading}
                className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm disabled:opacity-50"
              >
                {preprocessingLoading ? 'Preprocessing...' : 'Apply Preprocessing Pipeline'}
              </button>

              {preprocessingResult && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs font-medium">
                  {preprocessingResult.message} - New shape: {preprocessingResult.preprocessed_shape?.[0]} rows × {preprocessingResult.preprocessed_shape?.[1]} cols
                </div>
              )}
            </div>
          </div>
        )}

        {/* NUMERIC TAB */}
        {activeTab === 'numeric' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Column</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Mean</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Std</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Min</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Median</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Max</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Skewness</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(numerical_statistics || {}).map(([col, stats]: [string, any]) => (
                  <tr key={col} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{col}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{stats.mean?.toFixed(3)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{stats.std?.toFixed(3)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{stats.min?.toFixed(3)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{stats.median?.toFixed(3)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{stats.max?.toFixed(3)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{stats.skewness?.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CATEGORICAL TAB */}
        {activeTab === 'categorical' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(categorical_statistics || {}).map(([col, stats]: [string, any]) => (
              <div key={col} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-gray-800 text-sm">{col}</h4>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">
                    {stats.unique_values} unique
                  </span>
                </div>
                <div className="space-y-2">
                  {stats.top_values?.map((tv: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-gray-700 font-medium truncate max-w-[200px]">{tv.value}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">{tv.count}</span>
                        <span className="text-gray-400 font-mono">({tv.percentage?.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MISSING TAB */}
        {activeTab === 'missing' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Total Missing Cells: <strong className="text-gray-900">{missing_values?.total_missing}</strong> ({missing_values?.total_missing_percentage}%)
            </p>
            {missing_values?.columns_with_missing?.length === 0 ? (
              <p className="text-emerald-600 font-medium text-sm">No missing values found in this dataset!</p>
            ) : (
              <div className="space-y-3">
                {missing_values?.columns_with_missing?.map((item: any) => (
                  <div key={item.column} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                      <span>{item.column}</span>
                      <span>{item.missing_count} missing ({item.missing_percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full"
                        style={{ width: `${Math.min(item.missing_percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OUTLIERS TAB */}
        {activeTab === 'outliers' && (
          <div>
            {Object.keys(outliers || {}).length === 0 ? (
              <p className="text-emerald-600 font-medium text-sm">No significant IQR outliers detected!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(outliers).map(([col, info]: [string, any]) => (
                  <div key={col} className="border border-rose-200 bg-rose-50 rounded-lg p-4">
                    <h5 className="font-bold text-rose-900 text-sm mb-1">{col}</h5>
                    <p className="text-xs text-rose-700">Outlier Count: <strong>{info.outlier_count}</strong> ({info.outlier_percentage?.toFixed(1)}%)</p>
                    <p className="text-xs text-rose-600 mt-1 font-mono">Valid bounds: [{info.lower_bound?.toFixed(2)}, {info.upper_bound?.toFixed(2)}]</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CORRELATIONS TAB */}
        {activeTab === 'correlations' && (
          <div>
            {correlations?.top_correlations?.length === 0 ? (
              <p className="text-gray-600 text-sm">No strong feature correlations detected (&gt; 0.3)</p>
            ) : (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 text-sm mb-2">Top Correlated Feature Pairs</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {correlations?.top_correlations?.map((pair: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center bg-gray-50">
                      <span className="text-xs font-medium text-gray-700">
                        {pair.column1} &amp; {pair.column2}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${pair.correlation > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {pair.correlation > 0 ? '+' : ''}{pair.correlation?.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
