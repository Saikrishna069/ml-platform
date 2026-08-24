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
      name: 'Credit Risk Scoring v1',
      environment: 'production',
      status: 'deployed',
      version: '1.2.0',
      replicas: 3,
      latency_ms: 24.5,
      request_rate: 450,
      error_rate: 0.001,
      api_endpoint: 'http://localhost:8000/api/inference/infer'
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
      api_endpoint: 'http://localhost:8000/api/inference/infer'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">MLOps & Deployment Platform</h1>
            <p className="text-gray-600">Model lifecycle registry, deployment metrics, canary A/B testing & rollbacks</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
            Register New Model
          </button>
        </div>

        {/* Status Metrics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Active Deployments</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">2</p>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">100% Healthy</span>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Average Latency (p50)</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">21.35 ms</p>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">-4.2 ms vs baseline</span>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Throughput</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">495 req/s</p>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">Peak 620 req/s</span>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Global Error Rate</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">0.08%</p>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">Within SLA</span>
          </div>
        </div>

        {/* Deployments List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Active Model Deployments</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {deployments.map((dep) => (
              <div key={dep.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">{dep.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      dep.environment === 'production' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dep.environment.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">v{dep.version}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 font-mono">{dep.api_endpoint}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Latency</p>
                    <p className="font-semibold">{dep.latency_ms} ms</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">Throughput</p>
                    <p className="font-semibold">{dep.request_rate} req/s</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">Replicas</p>
                    <p className="font-semibold">{dep.replicas} pods</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                      Metrics
                    </button>
                    <button className="px-3 py-1.5 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100">
                      Rollback
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
