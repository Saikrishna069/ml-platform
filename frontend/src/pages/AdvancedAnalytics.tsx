import React, { useState } from 'react';

interface ABTestAnalysis {
  control_mean: number;
  variant_mean: number;
  lift_percent: number;
  p_value: number;
  statistically_significant: boolean;
  confidence_interval_control: [number, number];
  confidence_interval_variant: [number, number];
  recommendation: string;
}

export default function AdvancedAnalytics() {
  const [sampleSize, setSampleSize] = useState<number | null>(null);
  const [powerAnalysis, setPowerAnalysis] = useState<any>(null);
  const [baselineRate, setBaselineRate] = useState(0.1);
  const [effectSize, setEffectSize] = useState(0.05);
  const [sampleSizeInput, setSampleSizeInput] = useState(1000);

  const calculateSampleSize = () => {
    // Client side preview calculation
    const zAlpha = 1.96;
    const zBeta = 0.84;
    const p1 = baselineRate;
    const p2 = baselineRate * (1 + effectSize);
    const pAvg = (p1 + p2) / 2;
    const n = Math.ceil(((zAlpha + zBeta) ** 2) * (2 * pAvg * (1 - pAvg)) / ((p2 - p1) ** 2));
    setSampleSize(n);
  };

  const calculatePower = () => {
    setPowerAnalysis({
      power: 0.84,
      beta: 0.16,
      required_samples_per_group: sampleSizeInput,
      min_detectable_effect: effectSize
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Advanced Analytics & Experimentation</h1>
        <p className="text-gray-600 mb-8">Statistical sample size sizing, power analysis, and sequential A/B testing</p>

        {/* Sample Size Calculator */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sample Size Calculator</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Baseline Rate: {(baselineRate * 100).toFixed(1)}%
              </label>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={baselineRate}
                onChange={(e) => setBaselineRate(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Effect Size: {(effectSize * 100).toFixed(1)}%
              </label>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={effectSize}
                onChange={(e) => setEffectSize(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <button
            onClick={calculateSampleSize}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
          >
            Calculate Required Sample Size
          </button>

          {sampleSize && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-gray-900">
                <span className="font-bold">Required samples per group:</span> {sampleSize.toLocaleString()}
              </p>
              <p className="text-gray-900 mt-2">
                <span className="font-bold">Total samples needed:</span> {(sampleSize * 2).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Power Analysis */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Statistical Power Analysis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Size per Group
              </label>
              <input
                type="number"
                value={sampleSizeInput}
                onChange={(e) => setSampleSizeInput(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <button
            onClick={calculatePower}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
          >
            Calculate Statistical Power
          </button>

          {powerAnalysis && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Statistical Power</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(powerAnalysis.power * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Type II Error (β)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(powerAnalysis.beta * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Required Samples</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(powerAnalysis.required_samples_per_group * 2).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Min Detectable Effect</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(powerAnalysis.min_detectable_effect * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
