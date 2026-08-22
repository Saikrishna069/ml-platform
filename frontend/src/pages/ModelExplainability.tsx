import React, { useState } from 'react';

export default function ModelExplainability() {
  const [modelId, setModelId] = useState<number>(1);
  const [explanation] = useState<any>({
    prediction: 0.85,
    top_features: [
      ['age', { contribution: 35.0, value: 42 }],
      ['income', { contribution: 25.0, value: 75000 }],
      ['credit_score', { contribution: 20.0, value: 710 }]
    ]
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '6px', background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Model Explainability & SHAP Visualizer
      </h1>
      <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '32px' }}>
        Feature attribution, instance explanations, and decision boundary maps
      </p>

      {/* Prediction Attribution Card */}
      <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '14px', padding: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>Prediction Feature Attribution</h2>
        
        <div style={{ maxWidth: '320px', marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>Model ID</label>
          <input
            type="number"
            value={modelId}
            onChange={(e) => setModelId(parseInt(e.target.value) || 1)}
            style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', borderRadius: '8px', padding: '10px 14px' }}
          />
        </div>

        {explanation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ padding: '20px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px' }}>
              <p style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '500' }}>Model Output Prediction Score</p>
              <p style={{ fontSize: '32px', fontWeight: '800', color: '#60a5fa', marginTop: '4px' }}>{explanation.prediction.toFixed(4)}</p>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Top Contributing Features</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {explanation.top_features?.map((feature: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '10px' }}>
                    <div>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{feature[0]}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '10px', fontFamily: 'monospace' }}>(Value: {feature[1].value})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '180px', backgroundColor: '#374151', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                        <div
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                            height: '100%',
                            width: `${Math.min(feature[1].contribution, 100)}%`,
                            borderRadius: '9999px'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#9ca3af', width: '50px', textAlign: 'right' }}>
                        {feature[1].contribution.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
