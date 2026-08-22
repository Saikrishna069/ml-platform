import React, { useState } from 'react';

export default function ModelExplainability() {
  const [modelId, setModelId] = useState<number>(1);
  const [explanation, setExplanation] = useState<any>({
    prediction: 0.85,
    top_features: [
      ['age', { contribution: 35.0, value: 42 }],
      ['income', { contribution: 25.0, value: 75000 }],
      ['credit_score', { contribution: 20.0, value: 710 }]
    ]
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Model Explainability & SHAP Visualizer</h1>
        <p className="text-gray-600 mb-8">Feature attribution, instance explanations, and decision boundary maps</p>

        {/* Prediction Explanation */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Prediction Attribution</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Model ID</label>
            <input
              type="number"
              value={modelId}
              onChange={(e) => setModelId(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg max-w-xs"
            />
          </div>

          {explanation && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">Model Output Prediction Score</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{explanation.prediction.toFixed(4)}</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Top Contributing Features</h3>
                <div className="space-y-3">
                  {explanation.top_features?.map((feature: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <span className="font-bold text-gray-900">{feature[0]}</span>
                        <span className="text-xs text-gray-500 ml-2 font-mono">(Val: {feature[1].value})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-48 bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${Math.min(feature[1].contribution, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-12 text-right">
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
    </div>
  );
}
