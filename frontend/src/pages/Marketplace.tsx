import React, { useState } from 'react';

interface Model {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  framework: string;
  accuracy: number;
  rating: number;
  review_count: number;
  download_count: number;
  price_per_inference: number;
  tags: string[];
}

export default function Marketplace() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const sampleModels: Model[] = [
    {
      id: 1,
      slug: 'credit-risk-pro',
      name: 'Credit Risk Scoring Engine v2',
      description: 'Production-ready XGBoost model trained on 2M+ loan records for instant credit risk assessment.',
      category: 'Finance',
      framework: 'XGBoost',
      accuracy: 0.942,
      rating: 4.9,
      review_count: 128,
      download_count: 3420,
      price_per_inference: 0.005,
      tags: ['credit', 'finance', 'classification']
    },
    {
      id: 2,
      slug: 'customer-churn-predictor',
      name: 'SaaS Customer Churn Predictor',
      description: 'Predict subscription cancellations 30 days in advance with deep feature attributions.',
      category: 'SaaS Analytics',
      framework: 'LightGBM',
      accuracy: 0.915,
      rating: 4.8,
      review_count: 85,
      download_count: 1890,
      price_per_inference: 0.002,
      tags: ['churn', 'saas', 'retention']
    },
    {
      id: 3,
      slug: 'medical-diagnosis-assistant',
      name: 'Chest X-Ray Pneumonia Classifier',
      description: 'ResNet50 computer vision pipeline fine-tuned for high-sensitivity radiology screening.',
      category: 'Healthcare',
      framework: 'PyTorch',
      accuracy: 0.968,
      rating: 5.0,
      review_count: 42,
      download_count: 980,
      price_per_inference: 0.015,
      tags: ['medical', 'computer-vision', 'resnet']
    }
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '40px',
        marginBottom: '32px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '12px', background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Model Marketplace
        </h1>
        <p style={{ fontSize: '16px', color: '#9ca3af', maxWidth: '600px', margin: '0 auto 24px' }}>
          Discover, deploy, and monetize production-grade machine learning models built by top AI engineers.
        </p>

        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '12px', maxWidth: '640px', margin: '0 auto' }}>
          <input
            type="text"
            placeholder="Search models by name, domain, framework..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', borderRadius: '10px', padding: '12px 16px' }}
          />
          <button style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 24px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
          }}>
            Search
          </button>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
        {sampleModels.map((model) => (
          <div key={model.id} style={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '14px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.2s',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' }}>
                  {model.category}
                </span>
                <span style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '700' }}>
                  ★ {model.rating} <span style={{ color: '#6b7280', fontSize: '12px' }}>({model.review_count})</span>
                </span>
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
                {model.name}
              </h3>
              <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.5', marginBottom: '16px' }}>
                {model.description}
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {model.tags.map((tag, idx) => (
                  <span key={idx} style={{ background: '#111827', color: '#9ca3af', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Row */}
            <div style={{ borderTop: '1px solid #374151', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Per Inference</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#34d399' }}>${model.price_per_inference}</span>
              </div>
              <button style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}>
                Deploy Model
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
