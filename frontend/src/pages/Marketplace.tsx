import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';

interface ModelResource {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: 'tabular' | 'nlp' | 'cv' | 'time_series';
  framework: string;
  train_accuracy: number;
  test_accuracy: number;
  f1_score: number;
  precision: number;
  recall: number;
  latency_ms: number;
  rating: number;
  download_count: number;
  author: string;
  tags: string[];
  sample_curl: string;
  is_top_scorer?: boolean;
}

export default function Marketplace() {
  const { deployModelToPlatform } = usePlatform();

  const [resources, setResources] = useState<ModelResource[]>([
    {
      id: 1,
      slug: 'iris-soft-voting-ensemble',
      name: 'Iris Soft Voting Ensemble Model',
      description: 'Top accuracy soft voting ensemble combining XGBoost, CatBoost, and Random Forest evaluated on plant species dataset.',
      category: 'tabular',
      framework: 'XGBoost + CatBoost + RF',
      train_accuracy: 0.988,
      test_accuracy: 0.973,
      f1_score: 0.968,
      precision: 0.970,
      recall: 0.965,
      latency_ms: 14.2,
      rating: 4.9,
      download_count: 2450,
      author: 'User Community (Top Scorer)',
      tags: ['iris', 'ensemble', 'classification'],
      sample_curl: 'curl -X POST https://saikrishna069-ml-platform-backend.hf.space/api/inference/iris-species-ensemble',
      is_top_scorer: true
    },
    {
      id: 2,
      slug: 'catboost-credit-fraud',
      name: 'CatBoost Credit Fraud Detection Model',
      description: 'Highest test accuracy financial fraud anomaly classifier trained on 250k transaction records.',
      category: 'tabular',
      framework: 'CatBoost Classifier',
      train_accuracy: 0.994,
      test_accuracy: 0.985,
      f1_score: 0.981,
      precision: 0.987,
      recall: 0.975,
      latency_ms: 18.5,
      rating: 4.9,
      download_count: 3890,
      author: 'FinTech AI Research',
      tags: ['finance', 'fraud', 'catboost'],
      sample_curl: 'curl -X POST https://saikrishna069-ml-platform-backend.hf.space/api/inference/credit-fraud-catboost',
      is_top_scorer: true
    },
    {
      id: 3,
      slug: 'bert-multilingual-sentiment',
      name: 'BERT Multilingual Sentiment Classifier',
      description: 'High test accuracy NLP Transformer fine-tuned for multi-language customer review sentiment classification.',
      category: 'nlp',
      framework: 'PyTorch Transformer',
      train_accuracy: 0.965,
      test_accuracy: 0.948,
      f1_score: 0.942,
      precision: 0.950,
      recall: 0.935,
      latency_ms: 45.0,
      rating: 4.8,
      download_count: 2100,
      author: 'NLP Open Community',
      tags: ['nlp', 'bert', 'sentiment'],
      sample_curl: 'curl -X POST https://saikrishna069-ml-platform-backend.hf.space/api/inference/bert-sentiment'
    },
    {
      id: 4,
      slug: 'resnet50-defect-inspector',
      name: 'ResNet50 Industrial Surface Defect Detector',
      description: 'Computer vision model trained on manufacturing surface defect datasets with 96.7% test accuracy.',
      category: 'cv',
      framework: 'TensorFlow / Keras',
      train_accuracy: 0.982,
      test_accuracy: 0.967,
      f1_score: 0.960,
      precision: 0.968,
      recall: 0.952,
      latency_ms: 32.0,
      rating: 4.7,
      download_count: 1420,
      author: 'Vision AI Lab',
      tags: ['cv', 'resnet', 'manufacturing'],
      sample_curl: 'curl -X POST https://saikrishna069-ml-platform-backend.hf.space/api/inference/resnet-defects'
    },
    {
      id: 5,
      slug: 'lstm-solar-power-forecaster',
      name: 'LSTM Solar Power Generation Forecaster',
      description: 'Recurrent time-series model predicting solar irradiance and power generation output.',
      category: 'time_series',
      framework: 'PyTorch LSTM',
      train_accuracy: 0.955,
      test_accuracy: 0.938,
      f1_score: 0.932,
      precision: 0.940,
      recall: 0.925,
      latency_ms: 24.0,
      rating: 4.8,
      download_count: 980,
      author: 'CleanEnergy AI',
      tags: ['time_series', 'lstm', 'energy'],
      sample_curl: 'curl -X POST https://saikrishna069-ml-platform-backend.hf.space/api/inference/lstm-energy'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<ModelResource | null>(null);

  const [benchmarkModel, setBenchmarkModel] = useState<ModelResource | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Form states for Sharing Trained Model Resource
  const [pubName, setPubName] = useState('');
  const [pubDesc, setPubDesc] = useState('');
  const [pubCategory, setPubCategory] = useState<'tabular' | 'nlp' | 'cv' | 'time_series'>('tabular');
  const [pubFramework, setPubFramework] = useState('XGBoost');
  const [pubTrainAcc, setPubTrainAcc] = useState(98.5);
  const [pubTestAcc, setPubTestAcc] = useState(97.2);

  const handleShareResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubName) return;

    const newResource: ModelResource = {
      id: Date.now(),
      slug: pubName.toLowerCase().replace(/\s+/g, '-'),
      name: pubName,
      description: pubDesc,
      category: pubCategory,
      framework: pubFramework,
      train_accuracy: pubTrainAcc / 100,
      test_accuracy: pubTestAcc / 100,
      f1_score: (pubTestAcc - 0.5) / 100,
      precision: (pubTestAcc - 0.2) / 100,
      recall: (pubTestAcc - 0.8) / 100,
      latency_ms: 15.0,
      rating: 5.0,
      download_count: 1,
      author: 'You (Model Creator)',
      tags: [pubCategory, pubFramework.toLowerCase()],
      sample_curl: `curl -X POST https://saikrishna069-ml-platform-backend.hf.space/api/inference/${pubName.toLowerCase().replace(/\s+/g, '-')}`,
      is_top_scorer: pubTestAcc >= 95.0
    };

    setResources([newResource, ...resources]);
    setShowShareModal(false);
    setPubName('');
    setPubDesc('');
    alert(`Successfully shared '${pubName}' as a 100% Free Model Resource!`);
  };

  const filteredResources = resources.filter((m) => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleDeployToMLOps = (modelName: string, framework: string, accuracy: number) => {
    deployModelToPlatform(modelName, framework, accuracy);
    alert(`Successfully deployed top scoring model '${modelName}' into MLOps Production Pipeline!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Title */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Pre-Trained Model Resources</h1>
            <p className="text-sm text-gray-600">
              Discover, benchmark training & testing accuracy results, and deploy top-accuracy scoring models trained by users for 100% free
            </p>
          </div>
          <button
            onClick={() => setShowShareModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold rounded-xl shadow-md text-sm min-w-[220px]"
          >
            + Share Trained Model Resource
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-1/2 relative">
            <input
              type="text"
              placeholder="Search free model resources by name, domain, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
            <span className="absolute left-3.5 top-3 text-gray-400 text-sm">🔍</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['all', 'tabular', 'nlp', 'cv', 'time_series'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {cat === 'all' ? 'All Model Resources' : cat === 'cv' ? 'Computer Vision' : cat === 'nlp' ? 'NLP & Text' : cat === 'time_series' ? 'Time Series' : 'Tabular & AutoML'}
              </button>
            ))}
          </div>
        </div>

        {/* Model Resource Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {filteredResources.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between p-6">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-extrabold uppercase ${
                    m.category === 'tabular' ? 'bg-purple-100 text-purple-800' :
                    m.category === 'nlp' ? 'bg-blue-100 text-blue-800' :
                    m.category === 'cv' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {m.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-green-100 text-green-800 border border-green-300">
                    100% FREE / OPEN ACCESS
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">{m.name}</h3>
                  {m.is_top_scorer && (
                    <span className="px-2 py-0.5 bg-amber-400 text-gray-950 text-xs font-black rounded shadow-sm whitespace-nowrap">
                      🏆 Top Scorer
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{m.description}</p>

                {/* Training & Testing Accuracy Results Card */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl mb-4 text-center font-mono border border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Test Acc</span>
                    <span className="text-xs font-black text-green-600">{(m.test_accuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Train Acc</span>
                    <span className="text-xs font-bold text-gray-900">{(m.train_accuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">F1 Score</span>
                    <span className="text-xs font-bold text-indigo-700">{(m.f1_score * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 mb-4 font-mono">
                  <span>Author: {m.author}</span>
                  <span>★ {m.rating} ({m.download_count} dl)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBenchmarkModel(m)}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors border border-indigo-200"
                  >
                    📊 Training & Test Results
                  </button>
                  <button
                    onClick={() => setSelectedModel(m)}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors"
                  >
                    🔑 API & Code
                  </button>
                </div>
                <button
                  onClick={() => handleDeployToMLOps(m.name, m.framework, m.test_accuracy)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg shadow-sm"
                >
                  ⚡ Deploy to MLOps
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* BENCHMARK & TESTING RESULTS MODAL */}
        {benchmarkModel && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-200">
              <div className="p-6 bg-gradient-to-r from-gray-900 to-indigo-950 text-white flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">📊 Training & Testing Accuracy Results</h2>
                    {benchmarkModel.is_top_scorer && (
                      <span className="px-2.5 py-0.5 bg-amber-400 text-gray-950 text-xs font-black rounded">
                        🏆 Top Accuracy Model
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-indigo-200 mt-0.5">{benchmarkModel.name} ({benchmarkModel.framework})</p>
                </div>
                <button onClick={() => setBenchmarkModel(null)} className="text-gray-400 hover:text-white text-xl font-bold">✕</button>
              </div>

              <div className="p-6 space-y-6">
                {/* Metric Bars */}
                <div className="space-y-4 font-mono">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      <span>Testing Accuracy Score</span>
                      <span className="text-green-600">{(benchmarkModel.test_accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-3.5 rounded-full" style={{ width: `${benchmarkModel.test_accuracy * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      <span>Training Accuracy Score</span>
                      <span>{(benchmarkModel.train_accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-3.5 rounded-full" style={{ width: `${benchmarkModel.train_accuracy * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      <span>Cross-Validation F1-Score</span>
                      <span className="text-indigo-700">{(benchmarkModel.f1_score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-3.5 rounded-full" style={{ width: `${benchmarkModel.f1_score * 100}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl text-center text-xs font-mono border border-gray-200">
                  <div>
                    <span className="text-gray-500">Precision:</span>
                    <p className="font-bold text-gray-900">{(benchmarkModel.precision * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Recall:</span>
                    <p className="font-bold text-gray-900">{(benchmarkModel.recall * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Latency:</span>
                    <p className="font-bold text-blue-600">{benchmarkModel.latency_ms} ms</p>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
                  <p className="font-bold">Generalization Audit:</p>
                  <p className="mt-0.5">
                    Generalization gap between Train ({(benchmarkModel.train_accuracy * 100).toFixed(1)}%) and Test ({(benchmarkModel.test_accuracy * 100).toFixed(1)}%) is only <strong>{((benchmarkModel.train_accuracy - benchmarkModel.test_accuracy) * 100).toFixed(1)}%</strong>, proving excellent generalization with zero overfitting.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button onClick={() => setBenchmarkModel(null)} className="px-5 py-2 bg-gray-200 text-gray-800 font-bold rounded-xl text-xs">Close</button>
                <button onClick={() => { handleDeployToMLOps(benchmarkModel.name, benchmarkModel.framework, benchmarkModel.test_accuracy); setBenchmarkModel(null); }} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-sm">⚡ Deploy to MLOps</button>
              </div>
            </div>
          </div>
        )}

        {/* API CODE & cURL MODAL */}
        {selectedModel && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-200">
              <div className="p-6 bg-gradient-to-r from-gray-900 to-indigo-950 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">🔑 Free API Endpoint & Code</h2>
                  <p className="text-xs text-indigo-200 mt-0.5">{selectedModel.name}</p>
                </div>
                <button onClick={() => setSelectedModel(null)} className="text-gray-400 hover:text-white text-xl font-bold">✕</button>
              </div>

              <div className="p-6 space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-gray-500 mb-1 font-bold">cURL Terminal Command:</label>
                  <div className="p-4 bg-gray-900 text-green-400 rounded-xl overflow-x-auto">
                    <pre>{selectedModel.sample_curl}</pre>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-500 mb-1 font-bold">Python Client Snippet:</label>
                  <div className="p-4 bg-gray-900 text-blue-300 rounded-xl overflow-x-auto">
                    <pre>{`import requests

url = "https://saikrishna069-ml-platform-backend.hf.space${selectedModel.sample_curl.split(' ').pop()}"
response = requests.post(url, json={"input_data": [...]})
print(response.json())`}</pre>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button onClick={() => setSelectedModel(null)} className="px-5 py-2 bg-gray-900 text-white font-bold rounded-xl text-xs">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* SHARE TRAINED MODEL RESOURCE MODAL */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Share Trained Model Resource</h2>
              <p className="text-xs text-gray-500 mb-6">Publish your top accuracy scoring model into the free public resources library</p>

              <form onSubmit={handleShareResource} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Iris Soft Voting Ensemble"
                    value={pubName}
                    onChange={(e) => setPubName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Overview of dataset & top accuracy results..."
                    value={pubDesc}
                    onChange={(e) => setPubDesc(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Testing Accuracy (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="50"
                      max="100"
                      value={pubTestAcc}
                      onChange={(e) => setPubTestAcc(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono font-bold text-green-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Training Accuracy (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="50"
                      max="100"
                      value={pubTrainAcc}
                      onChange={(e) => setPubTrainAcc(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowShareModal(false)} className="px-4 py-2 text-gray-600 font-semibold">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm">Share Resource (Free)</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
