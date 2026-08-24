import React, { useState, useEffect } from 'react';
import { marketplaceAPI } from '../api/client';

interface Model {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  framework: string;
  accuracy?: number;
  rating: number;
  review_count: number;
  download_count: number;
  price_per_inference: number;
  tags: string[];
}

export default function Marketplace() {
  const [models, setModels] = useState<Model[]>([
    {
      id: 1,
      slug: 'xgboost-fraud-detector',
      name: 'XGBoost Credit Fraud Detector',
      description: 'High precision credit card transaction anomaly and fraud detection engine.',
      category: 'classification',
      framework: 'XGBoost',
      accuracy: 0.982,
      rating: 4.9,
      review_count: 48,
      download_count: 1240,
      price_per_inference: 0.005,
      tags: ['finance', 'fraud', 'classification']
    },
    {
      id: 2,
      slug: 'bert-sentiment-analyzer',
      name: 'BERT Multilingual Sentiment Analyzer',
      description: 'Pretrained NLP Transformer for customer review sentiment and emotion tagging.',
      category: 'nlp',
      framework: 'PyTorch',
      accuracy: 0.945,
      rating: 4.8,
      review_count: 32,
      download_count: 850,
      price_per_inference: 0.0,
      tags: ['nlp', 'bert', 'sentiment']
    },
    {
      id: 3,
      slug: 'resnet50-vision-classifier',
      name: 'ResNet50 Industrial Defect Inspector',
      description: 'Computer vision model for manufacturing product surface scratch & defect identification.',
      category: 'cv',
      framework: 'TensorFlow',
      accuracy: 0.967,
      rating: 4.7,
      review_count: 19,
      download_count: 620,
      price_per_inference: 0.01,
      tags: ['vision', 'resnet', 'defects']
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Form states for publishing
  const [pubName, setPubName] = useState('');
  const [pubDesc, setPubDesc] = useState('');
  const [pubCategory, setPubCategory] = useState('classification');
  const [pubFramework, setPubFramework] = useState('scikit-learn');
  const [pubPrice, setPubPrice] = useState(0.001);

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
      accuracy: 0.92,
      rating: 5.0,
      review_count: 1,
      download_count: 1,
      price_per_inference: pubPrice,
      tags: [pubCategory, pubFramework.toLowerCase()]
    };

    setModels([newModel, ...models]);
    setShowPublishModal(false);
    setPubName('');
    setPubDesc('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Model Marketplace</h1>
            <p className="text-gray-600">Discover, benchmark, and monetize pre-trained machine learning models</p>
          </div>
          <button
            onClick={() => setShowPublishModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-sm"
          >
            + Publish Model
          </button>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {models.map((model) => (
            <div key={model.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{model.name}</h3>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-bold uppercase">
                    {model.framework}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{model.description}</p>

                <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg text-center">
                  <div>
                    <p className="text-xs text-gray-500">Rating</p>
                    <p className="font-bold text-gray-900 mt-0.5">★ {model.rating}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Downloads</p>
                    <p className="font-bold text-gray-900 mt-0.5">{model.download_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-bold text-green-600 mt-0.5">
                      {model.price_per_inference > 0 ? `$${model.price_per_inference}` : 'FREE'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedModel(model)}
                className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg text-sm transition-colors"
              >
                Inspect & Deploy API
              </button>
            </div>
          ))}
        </div>

        {/* Publish Model Modal */}
        {showPublishModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Publish Model to Marketplace</h2>
              <form onSubmit={handlePublish} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sales Forecast Engine"
                    value={pubName}
                    onChange={(e) => setPubName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    placeholder="Describe what your model predicts..."
                    value={pubDesc}
                    onChange={(e) => setPubDesc(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      value={pubCategory}
                      onChange={(e) => setPubCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="classification">Classification</option>
                      <option value="regression">Regression</option>
                      <option value="nlp">NLP</option>
                      <option value="cv">Vision</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price / Infer</label>
                    <input
                      type="number"
                      step="0.001"
                      value={pubPrice}
                      onChange={(e) => setPubPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPublishModal(false)}
                    className="px-4 py-2 text-gray-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    Publish Model
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Model Detail Inspect Modal */}
        {selectedModel && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedModel.name}</h2>
                <span className="px-2.5 py-0.5 bg-green-100 text-green-800 font-bold rounded text-xs">
                  {selectedModel.price_per_inference > 0 ? `$${selectedModel.price_per_inference}/call` : 'FREE'}
                </span>
              </div>
              <p className="text-gray-600 mb-6">{selectedModel.description}</p>

              <div className="p-4 bg-gray-900 text-green-400 font-mono rounded-lg text-xs mb-6 overflow-x-auto">
                <p>// cURL Inference Request</p>
                <p>curl -X POST https://saikrishna069-ml-platform-backend.hf.space/api/inference/infer \</p>
                <p>  -H "Content-Type: application/json" \</p>
                <p>  -d '{`{"model_slug": "${selectedModel.slug}", "data": {...}}`}'</p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedModel(null)}
                  className="px-5 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert(`Subscribed to ${selectedModel.name} API endpoint!`);
                    setSelectedModel(null);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Subscribe & Call API
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
