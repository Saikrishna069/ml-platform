import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
  price_one_time?: number;
  tags: string[];
}

interface SearchParams {
  query: string;
  category: string;
  min_rating: number;
  sort_by: 'relevance' | 'rating' | 'popularity' | 'recent';
  limit: number;
  offset: number;
}

export default function Marketplace() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<SearchParams>({
    query: '',
    category: '',
    min_rating: 0,
    sort_by: 'relevance',
    limit: 20,
    offset: 0
  });

  useEffect(() => {
    searchModels();
  }, [params]);

  const searchModels = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/marketplace/models/search', {
        params
      });
      setModels(response.data.models || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Model Marketplace</h1>
          <p className="text-gray-600">Discover, download, and use ML models from the community</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search models..."
              className="col-span-1 md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg"
              value={params.query}
              onChange={(e) => setParams({...params, query: e.target.value, offset: 0})}
            />

            <select
              className="px-4 py-2 border border-gray-300 rounded-lg"
              value={params.category}
              onChange={(e) => setParams({...params, category: e.target.value, offset: 0})}
            >
              <option value="">All Categories</option>
              <option value="classification">Classification</option>
              <option value="regression">Regression</option>
              <option value="nlp">NLP</option>
              <option value="cv">Computer Vision</option>
              <option value="timeseries">Time Series</option>
            </select>

            <select
              className="px-4 py-2 border border-gray-300 rounded-lg"
              value={params.sort_by}
              onChange={(e) => setParams({...params, sort_by: e.target.value as any, offset: 0})}
            >
              <option value="relevance">Relevance</option>
              <option value="rating">Top Rated</option>
              <option value="popularity">Most Popular</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mr-4">Min Rating: {params.min_rating}</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              className="w-32"
              value={params.min_rating}
              onChange={(e) => setParams({...params, min_rating: parseFloat(e.target.value), offset: 0})}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading models...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {models.map((model) => (
              <div key={model.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{model.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{model.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {model.framework}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      {model.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Rating</p>
                      <p className="font-bold text-lg">{(model.rating || 0).toFixed(1)} ⭐</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Downloads</p>
                      <p className="font-bold text-lg">{model.download_count}</p>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    {model.price_per_inference > 0 ? (
                      <p className="text-sm text-gray-600">
                        ${model.price_per_inference.toFixed(4)}/inference
                      </p>
                    ) : (
                      <p className="text-sm text-green-600 font-bold">FREE</p>
                    )}
                  </div>

                  <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    View Model Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
