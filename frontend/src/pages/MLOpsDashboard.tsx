import React, { useState } from 'react';

interface Deployment {
  id: number;
  name: string;
  environment: 'development' | 'staging' | 'production';
  status: 'deployed' | 'pending' | 'failed' | 'rolled_back';
  version: string;
  replicas: number;
  latency_ms: number;
  request_rate: number;
  error_rate: number;
  api_endpoint: string;
}

export default function MLOpsDashboard() {
  const [deployments] = useState<Deployment[]>([
    {
      id: 1,
      name: 'Credit Risk Scoring Engine v1',
      environment: 'production',
      status: 'deployed',
      version: '1.2.0',
      replicas: 3,
      latency_ms: 24.5,
      request_rate: 450,
      error_rate: 0.001,
      api_endpoint: 'https://ml-dataset-analyzer-backend.onrender.com/api/inference/infer'
    },
    {
      id: 2,
      name: 'Customer Churn Predictor',
      environment: 'staging',
      status: 'deployed',
      version: '2.0.0-rc1',
      replicas: 1,
      latency_ms: 18.2,
      request_rate: 45,
      error_rate: 0.0,
      api_endpoint: 'https://ml-dataset-analyzer-backend.onrender.com/api/inference/infer'
    }
  ]);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '6px', background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            MLOps & Deployment Platform
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            Model lifecycle registry, deployment health metrics, canary A/B testing & automated rollbacks
          </p>
        </div>
        <button style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          padding: '12px 20px',
          fontWeight: '700',
          fontSize: '14px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
        }}>
          + Register New Model
        </button>
      </div>

      {/* Metric Cards Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '500' }}>Active Deployments</p>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: '8px 0' }}>2</p>
          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
            ● 100% Healthy
          </span>
        </div>

        <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '500' }}>Average Latency (p50)</p>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: '8px 0' }}>21.35 ms</p>
          <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
            -4.2 ms vs baseline
          </span>
        </div>

        <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '500' }}>Global Throughput</p>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: '8px 0' }}>495 req/s</p>
          <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
            Peak 620 req/s
          </span>
        </div>

        <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '500' }}>Global Error Rate</p>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: '8px 0' }}>0.08%</p>
          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
            Within SLA
          </span>
        </div>
      </div>

      {/* Active Deployments Table Card */}
      <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #374151', backgroundColor: '#111827' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Active Model Deployments</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {deployments.map((dep) => (
            <div key={dep.id} style={{
              padding: '24px',
              borderBottom: '1px solid #374151',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>{dep.name}</h3>
                  <span style={{
                    background: dep.environment === 'production' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: dep.environment === 'production' ? '#c084fc' : '#fbbf24',
                    border: dep.environment === 'production' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '2px 10px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {dep.environment.toUpperCase()}
                  </span>
                  <span style={{ background: '#111827', color: '#9ca3af', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                    v{dep.version}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>{dep.api_endpoint}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>Latency</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>{dep.latency_ms} ms</span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>Throughput</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>{dep.request_rate} req/s</span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>Replicas</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>{dep.replicas} pods</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ background: '#374151', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    Metrics
                  </button>
                  <button style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    Rollback
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
