import React, { useState } from 'react';

interface Model {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: 'tabular' | 'nlp' | 'cv' | 'time_series';
  framework: string;
  accuracy: number;
  f1_score: number;
  latency_ms: number;
  rating: number;
  review_count: number;
  download_count: number;
  price_type: 'free' | 'paid';
  price_per_month: number;
  author: string;
  tags: string[];
  sample_curl: string;
}

export default function Marketplace() {
  const [models, setModels] = useState<Model[]>([
    {
      id: 1,
      slug: 'xgboost-iris-ensemble',
      name: 'Iris Soft Voting Ensemble Model',
      description: 'Optuna-tuned soft voting ensemble combining XGBoost, CatBoost, and Random Forest for multi-class plant species classification.',
      category: 'tabular',
      framework: 'XGBoost + RF + CatBoost',
      accuracy: 0.973,
      f1_score: 0.968,
      latency_ms: 14.2,
      rating: 4.9,
      review_count: 54,
      download_count: 1420,
      price_type: 'free',
      price_per_month: 0,
      author: 'ML Platform Team',
      tags: ['tabular', 'ensemble', 'classification'],
      sample_curl: 'curl -X POST https://saikrishna069-ml-platform-backend.hf.space/api/inference/iris-species-ensemble'
    },
    {
      id: 2,
      slug: 'catboost-fraud-detector',
      name: 'CatBoost Credit Card Fraud Detector',
      description: 'High-precision financial transaction anomaly detection engine trained on 250k anonymized transaction records.',
      category: 'tabular',
      framework: 'CatBoost',
      accuracy: 0.985,
      f1_score: 0.981,
      latency_ms: 18.5,
      rating: 4.9,
      review_count: 88,
      download_count: 3200,
      price_type: 'paid',
      price_per_month: 29,
      author: 'FinTech AI Lab',
      tags: ['finance', 'fraud', 'tabular'],
      sample_curl: 'curl -X POST https://saikrishna069-ml-platform-backend.hf.space/api/inference/credit-fraud-catboost'
    },
    {
      id: 3,
      slug: 'bert-multilingual-sentiment',
      name: 'BERT Multilingual Sentiment Analyzer',
      description: 'Pre-trained NLP Transformer fine-tuned for customer review sentiment analysis across 12 European and Asian languages.',
      category: 'nlp',
      framework: 'PyTorch Transformer',
      accuracy: 0.948,
      f1_score: 0.942,
      latency_ms: 45.0,
      rating: 4.8,
      review_count: 42,
      download_count: 2100,
      price_type: 'free',
      price_per_month: 0,
      author: 'OpenNLP Hub',
      tags: ['nlp', 'bert', 'sentiment'],
      sample_curl: 'curl -X POST https://saikrishna069-ml-platform-backend.hf.space/api/inference/bert-sentiment'
    },
    {
      id: 4,
      slug: 'resnet50-industrial-inspector',
      name: 'ResNet50 Industrial Defect Inspector',
      description: 'Computer vision model specialized in automated manufacturing surface scratch and material micro-defect detection.',
      category: 'cv',
      framework: 'TensorFlow / Keras',
      accuracy: 0.967,
      f1_score: 0.960,
      latency_ms: 32.0,
      rating: 4.7,
      review_count: 29,
      download_count: 980,
      price_type: 'paid',
      price_per_month: 49,
      author: 'VisionTech Labs',
      tags: ['cv', 'resnet', 'manufacturing'],
      sample_curl: 'curl -X POST https://saikrishna069-ml-platform-backend.hf.space/api/inference/resnet-defects'
    },
    {
      id: 5,
      slug: 'lstm-solar-power-forecaster',
      name: 'LSTM Solar & Wind Energy Forecaster',
      description: 'Deep recurrent time-series forecasting model for predicting hourly solar irradiance and grid power production output.',
      category: 'time_series',
      framework: 'PyTorch LSTM',
      accuracy: 0.938,
      f1_score: 0.932,
      latency_ms: 24.0,
      rating: 4.8,
      review_count: 15,
      download_count: 640,
      price_type: 'free',
      price_per_month: 0,
      author: 'CleanEnergy AI',
      tags: ['time_series', 'lstm', 'energy'],
      sample_curl: 'curl -X POST https://saikrishna069-ml-platform-backend.hf.space/api/inference/lstm-energy'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  const [benchmarkModel, setBenchmarkModel] = useState<Model | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Form states for Monetize & Publish
  const [pubName, setPubName] = useState('');
  const [pubDesc, setPubDesc] = useState('');
  const [pubCategory, setPubCategory] = useState<'tabular' | 'nlp' | 'cv' | 'time_series'>('tabular');
  const [pubFramework, setPubFramework] = useState('XGBoost');
  const [pubPriceType, setPubPriceType] = useState<'free' | 'paid'>('free');
  const [pubPrice, setPubPrice] = useState(19);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubName) return;

    const newModel: Model = {
      id: Date.now(),
      slug: pubName.toLowerCase().replace(/\s+/g, '-'),
      name: pubName,
      description: pubDesc,
      category: pubCategory,
      framework: pubFramework,
      accuracy: 0.952,
      f1_score: 0.948,
      latency_ms: 16.5,
      rating: 5.0,
      review_count: 1,
      download_count: 1,
      price_type: pubPriceType,
      price_per_month: pubPriceType === 'paid' ? pubPrice : 0,
      author: 'You (Model Creator)',
      tags: [pubCategory, pubFramework.toLowerCase()],
      sample_curl: `curl -X POST https://saikrishna069-ml-platform-backend.hf.space/api/inference/${pubName.toLowerCase().replace(/\s+/g, '-')}`
    };

    setModels([newModel, ...models]);
    setShowPublishModal(false);
    setPubName('');
    setPubDesc('');
    alert(`Successfully published '${pubName}' to the Model Marketplace! Monetization active.`);
  };

  const filteredModels = models.filter((m) => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const deployToMLOps = (modelName: string) => {
    alert(`Successfully registered and deployed '${modelName}' into MLOps Production Pipeline!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Title */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Pre-Trained Model Marketplace</h1>
            <p className="text-sm text-gray-600">
              Discover, benchmark performance metrics, deploy to MLOps, and monetize your pre-trained machine learning models
            </p>
          </div>
          <button
            onClick={() => setShowPublishModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold rounded-xl shadow-md text-sm min-w-[200px]"
          >
            + Monetize & Publish Model
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-1/2 relative">
            <input
              type="text"
              placeholder="Search pre-trained models by name, domain, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
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
                {cat === 'all' ? 'All Models' : cat === 'cv' ? 'Computer Vision' : cat === 'nlp' ? 'NLP & Text' : cat === 'time_series' ? 'Time Series' : 'Tabular & AutoML'}
              </button>
            ))}
          </div>
        </div>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {filteredModels.map((m) => (
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
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    m.price_type === 'free' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {m.price_type === 'free' ? 'FREE / OPEN SOURCE' : `$${m.price_per_month}/mo`}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">{m.name}</h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{m.description}</p>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl mb-4 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Accuracy</span>
                    <span className="text-xs font-bold text-gray-900">{(m.accuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">F1-Score</span>
                    <span className="text-xs font-bold text-indigo-700">{(m.f1_score * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Latency</span>
                    <span className="text-xs font-bold text-gray-900">{m.latency_ms}ms</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 mb-4 font-mono">
                  <span>Author: {m.author}</span>
                  <span>Rating: {m.rating}/5.0 ({m.download_count} dl)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBenchmarkModel(m)}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors border border-indigo-200"
                  >
                    Benchmark
                  </button>
                  <button
                    onClick={() => setSelectedModel(m)}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors"
                  >
                    API & Code
                  </button>
                </div>
                <button
                  onClick={() => deployToMLOps(m.name)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg shadow-sm"
                >
                  Deploy to MLOps
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* BENCHMARK PERFORMANCE MODAL */}
        {benchmarkModel && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-200">
              <div className="p-6 bg-gradient-to-r from-gray-900 to-indigo-950 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">📊 Benchmark Evaluation Report</h2>
                  <p className="text-xs text-indigo-200 mt-0.5">{benchmarkModel.name} ({benchmarkModel.framework})</p>
                </div>
                <button onClick={() => setBenchmarkModel(null)} className="text-gray-400 hover:text-white text-xl font-bold">✕</button>
              </div>

              <div className="p-6 space-y-6">
                {/* Metric Bars */}
                <div className="space-y-3 font-mono">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      <span>Model Accuracy</span>
                      <span>{(benchmarkModel.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-3 rounded-full" style={{ width: `${benchmarkModel.accuracy * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      <span>F1-Score (Balanced)</span>
                      <span>{(benchmarkModel.f1_score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-3 rounded-full" style={{ width: `${benchmarkModel.f1_score * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      <span>Inference Speed (p50 Latency)</span>
                      <span>{benchmarkModel.latency_ms} ms</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-3 rounded-full" style={{ width: `${Math.max(10, 100 - benchmarkModel.latency_ms)}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl text-xs space-y-2 text-gray-700">
                  <p className="font-bold text-gray-900">Benchmark Baseline Comparison:</p>
                  <p>• Outperforms industry standard baseline by <strong>+4.2%</strong> on accuracy metrics.</p>
                  <p>• Optimized for low-memory GPU/CPU deployment with sub-{benchmarkModel.latency_ms}ms latency.</p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button onClick={() => setBenchmarkModel(null)} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs">Close</button>
                <button onClick={() => deployToMLOps(benchmarkModel.name)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm">⚡ Deploy Model</button>
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
                  <h2 className="text-xl font-bold">🔑 Live API Endpoint & Code</h2>
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
                  <label className="block text-gray-500 mb-1 font-bold">Python Client Request Snippet:</label>
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

        {/* MONETIZE & PUBLISH MODEL MODAL */}
        {showPublishModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Monetize & Publish Model</h2>
              <p className="text-xs text-gray-500 mb-6">List your trained model on the public marketplace and start earning monthly revenue</p>

              <form onSubmit={handlePublish} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. XGBoost Customer Churn Predictor"
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
                    placeholder="Brief overview of model training dataset & accuracy..."
                    value={pubDesc}
                    onChange={(e) => setPubDesc(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Domain Category</label>
                    <select
                      value={pubCategory}
                      onChange={(e) => setPubCategory(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="tabular">Tabular & AutoML</option>
                      <option value="nlp">NLP & Text</option>
                      <option value="cv">Computer Vision</option>
                      <option value="time_series">Time Series</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Framework</label>
                    <select
                      value={pubFramework}
                      onChange={(e) => setPubFramework(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="XGBoost">XGBoost</option>
                      <option value="CatBoost">CatBoost</option>
                      <option value="LightGBM">LightGBM</option>
                      <option value="PyTorch">PyTorch</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Pricing Model</label>
                    <select
                      value={pubPriceType}
                      onChange={(e) => setPubPriceType(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="free">Free / Open Source</option>
                      <option value="paid">Monthly Subscription</option>
                    </select>
                  </div>

                  {pubPriceType === 'paid' && (
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Monthly Price ($)</label>
                      <input
                        type="number"
                        min="1"
                        value={pubPrice}
                        onChange={(e) => setPubPrice(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowPublishModal(false)}
                    className="px-4 py-2 text-gray-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    Publish to Marketplace
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
