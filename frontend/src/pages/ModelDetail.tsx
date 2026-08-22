import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ModelDetailType {
  id: number;
  name: string;
  description: string;
  category: string;
  framework: string;
  model_type: string;
  metrics: {
    accuracy?: number;
    f1_score?: number;
    auc?: number;
    r2?: number;
  };
  rating: number;
  review_count: number;
  download_count: number;
  view_count: number;
  price_per_inference: number;
  price_one_time?: number;
  tags: string[];
  features: string[];
  reviews: any[];
}

export default function ModelDetail({ slug }: { slug?: string }) {
  const [model, setModel] = useState<ModelDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    if (slug) fetchModel();
  }, [slug]);

  const fetchModel = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/marketplace/models/${slug}`);
      setModel(response.data);
    } catch (error) {
      console.error('Failed to fetch model:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async () => {
    if (!model || !reviewText) return;
    try {
      await axios.post(
        `http://localhost:8000/api/marketplace/models/${model.id}/review`,
        {
          rating,
          title: `${rating} Star Review`,
          review_text: reviewText
        }
      );
      setReviewText('');
      fetchModel();
    } catch (error) {
      console.error('Failed to add review:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading model details...</div>;
  }

  if (!model) {
    return <div className="text-center py-12 text-red-600">Model not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{model.name}</h1>
        <p className="text-gray-600 mb-6">{model.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-500">Framework</p>
            <p className="font-semibold">{model.framework}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-semibold">{model.category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Rating</p>
            <p className="font-semibold">{(model.rating || 0).toFixed(1)} ⭐</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Downloads</p>
            <p className="font-semibold">{model.download_count}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Add a Review</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <select
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-md"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>{r} Stars</option>
                ))}
              </select>
            </div>
            <div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write your review here..."
                rows={4}
                className="w-full p-3 border rounded-md"
              />
            </div>
            <button
              onClick={handleAddReview}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Submit Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
