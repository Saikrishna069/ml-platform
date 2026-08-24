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
  const [deployments, setDeployments] = useState<Deployment[]>([
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
      api_endpoint: '/api/inference/infer'
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
      api_endpoint: '/api/inference/infer'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [modelName, setModelName] = useState('');
  const [modelVersion, setModelVersion] = useState('1.0.0');
  const [environment, setEnvironment] = useState<'production' | 'staging'>('production');
  const [selectedMetrics, setSelectedMetrics] = useState<Deployment | null>(null);

  const handleRegisterModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName) return;

    const newDep: Deployment = {
      id: Date.now(),
      name: modelName,
      environment: environment,
      status: 'deployed',
      version: modelVersion,
      replicas: environment === 'production' ? 3 : 1,
      latency_ms: 15 + Math.floor(Math.random() * 15),
      request_rate: 100,
      error_rate: 0.0,
      api_endpoint: `/api/inference/${modelName.toLowerCase().replace(/\s+/g, '-')}`
    };

    setDeployments([newDep, ...deployments]);
    setShowModal(false);
    setModelName('');
  };

  const handleRollback = (id: number) => {
    setDeployments(deployments.map(d => {
      if (d.id === id) {
        return { ...d, status: 'rolled_back', version: '1.0.0-fallback', latency_ms: d.latency_ms + 2 };
      }
      return d;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">MLOps & Deployment Platform</h1>
            <p className="text-gray-600">Model lifecycle registry, deployment metrics, canary A/B testing & rollbacks</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all text-sm"
          >
            + Register New Model
          </button>
        </div>

        {/* Status Metrics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-semibold text-gray-500">Active Deployments</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{deployments.length}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-bold bg-green-100 text-green-800 rounded-full">
              100% Healthy
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-semibold text-gray-500">Average Latency (p50)</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {(deployments.reduce((acc, d) => acc + d.latency_ms, 0) / (deployments.length || 1)).toFixed(2)} ms
            </p>
            <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
              Real-time Monitoring
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-semibold text-gray-500">Total Throughput</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {deployments.reduce((acc, d) => acc + d.request_rate, 0)} req/s
            </p>
            <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 rounded-full">
              Auto-Scaling Enabled
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-semibold text-gray-500">Global Error Rate</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">0.02%</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-bold bg-green-100 text-green-800 rounded-full">
              Within SLA
            </span>
          </div>
        </div>

        {/* Deployments List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Active Model Deployments</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {deployments.map((dep) => (
              <div key={dep.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">{dep.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      dep.environment === 'production' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dep.environment.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-700">v{dep.version}</span>
                    {dep.status === 'rolled_back' && (
                      <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 font-bold">
                        ROLLED BACK
                      </span>
                    )}
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
                    <button
                      onClick={() => setSelectedMetrics(dep)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Metrics
                    </button>
                    <button
                      onClick={() => handleRollback(dep.id)}
                      disabled={dep.status === 'rolled_back'}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        dep.status === 'rolled_back'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-50 hover:bg-red-100 text-red-600'
                      }`}
                    >
                      Rollback
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal for Registering New Model */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Register Model in MLOps</h2>
              <form onSubmit={handleRegisterModel} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fraud Detection Engine"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Version</label>
                  <input
                    type="text"
                    value={modelVersion}
                    onChange={(e) => setModelVersion(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Environment</label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    Register & Deploy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Metrics Modal */}
        {selectedMetrics && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedMetrics.name} Metrics</h2>
              <p className="text-sm text-gray-500 mb-6">Real-time health telemetry & resource usage</p>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">p50 / p95 / p99 Latency</span>
                  <span className="font-bold text-gray-900">{selectedMetrics.latency_ms}ms / {(selectedMetrics.latency_ms * 1.8).toFixed(1)}ms / {(selectedMetrics.latency_ms * 2.5).toFixed(1)}ms</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">CPU / Memory Allocation</span>
                  <span className="font-bold text-gray-900">2.0 Cores / 2048 MB RAM</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">Error Rate</span>
                  <span className="font-bold text-green-600">{(selectedMetrics.error_rate * 100).toFixed(2)}%</span>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedMetrics(null)}
                  className="px-5 py-2 bg-gray-900 text-white font-bold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
