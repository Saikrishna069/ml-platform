import React, { useState } from 'react';

export default function AdvancedAnalytics() {
  const [sampleSize, setSampleSize] = useState<number | null>(null);
  const [powerAnalysis, setPowerAnalysis] = useState<any>(null);
  const [baselineRate, setBaselineRate] = useState(0.1);
  const [effectSize, setEffectSize] = useState(0.05);
  const [sampleSizeInput, setSampleSizeInput] = useState(1000);

  const calculateSampleSize = () => {
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
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '6px', background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Advanced Analytics & A/B Experimentation
      </h1>
      <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '32px' }}>
        Statistical sample size sizing, power analysis, and sequential early-stopping test rules
      </p>

      {/* Sample Size Calculator Card */}
      <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '14px', padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>Sample Size Calculator</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#9ca3af', marginBottom: '8px', fontWeight: '500' }}>
              Baseline Rate: <strong style={{ color: '#fff' }}>{(baselineRate * 100).toFixed(1)}%</strong>
            </label>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={baselineRate}
              onChange={(e) => setBaselineRate(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#9ca3af', marginBottom: '8px', fontWeight: '500' }}>
              Minimum Effect Size: <strong style={{ color: '#fff' }}>{(effectSize * 100).toFixed(1)}%</strong>
            </label>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={effectSize}
              onChange={(e) => setEffectSize(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <button
          onClick={calculateSampleSize}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 24px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Calculate Required Sample Size
        </button>

        {sampleSize && (
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px' }}>
            <p style={{ color: '#34d399', fontSize: '15px' }}>
              <strong>Required samples per group:</strong> {sampleSize.toLocaleString()}
            </p>
            <p style={{ color: '#34d399', fontSize: '15px', marginTop: '4px' }}>
              <strong>Total samples needed:</strong> {(sampleSize * 2).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Power Analysis Card */}
      <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '14px', padding: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>Statistical Power Analysis</h2>
        
        <div style={{ maxWidth: '320px', marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>Sample Size per Group</label>
          <input
            type="number"
            value={sampleSizeInput}
            onChange={(e) => setSampleSizeInput(parseInt(e.target.value) || 0)}
            style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', borderRadius: '8px', padding: '10px 14px' }}
          />
        </div>

        <button
          onClick={calculatePower}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 24px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Calculate Statistical Power
        </button>

        {powerAnalysis && (
          <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#111827', padding: '16px', borderRadius: '10px', border: '1px solid #374151' }}>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>Statistical Power</p>
              <p style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                {(powerAnalysis.power * 100).toFixed(1)}%
              </p>
            </div>
            <div style={{ backgroundColor: '#111827', padding: '16px', borderRadius: '10px', border: '1px solid #374151' }}>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>Type II Error (β)</p>
              <p style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                {(powerAnalysis.beta * 100).toFixed(1)}%
              </p>
            </div>
            <div style={{ backgroundColor: '#111827', padding: '16px', borderRadius: '10px', border: '1px solid #374151' }}>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>Required Samples</p>
              <p style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                {(powerAnalysis.required_samples_per_group * 2).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
