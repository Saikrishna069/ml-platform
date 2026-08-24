import React, { useState } from 'react';

interface Deployment {
  id: number;
  name: string;
  environment: 'production' | 'staging' | 'canary';
  version: string;
  status: 'deployed' | 'rolling_out' | 'rolled_back' | 'failed';
  replicas: number;
  latency_ms: number;
  request_rate: number;
  error_rate: number;
  api_endpoint: string;
  canary_traffic_pct?: number;
  framework: string;
  accuracy: number;
}

export default function MLOpsDashboard() {
  const [deployments, setDeployments] = useState<Deployment[]>([
    {
      id: 1,
      name: 'Soft Voting Ensemble (Iris Species)',
      environment: 'production',
      version: 'v1.2.0-active',
      status: 'deployed',
      replicas: 4,
      latency_ms: 14.2,
      request_rate: 620,
      error_rate: 0.01,
      api_endpoint: '/api/inference/iris-species-ensemble',
      canary_traffic_pct: 80,
      framework: 'XGBoost + RF + LightGBM',
      accuracy: 0.973
    },
    {
      id: 2,
      name: 'XGBoost Classifier (Optuna Tuned)',
      environment: 'canary',
      version: 'v2.0.0-canary',
      status: 'rolling_out',
      replicas: 2,
      latency_ms: 12.8,
      request_rate: 155,
      error_rate: 0.0,
      api_endpoint: '/api/inference/xgb-optuna-canary',
      canary_traffic_pct: 20,
      framework: 'XGBoost',
      accuracy: 0.960
    },
    {
      id: 3,
      name: 'Credit Risk Scoring Engine',
      environment: 'production',
      version: 'v1.0.4',
      status: 'deployed',
      replicas: 3,
      latency_ms: 22.5,
      request_rate: 340,
      error_rate: 0.02,
      api_endpoint: '/api/inference/credit-risk-v1',
      framework: 'CatBoost',
      accuracy: 0.952
    },
    {
      id: 4,
      name: 'Customer Churn Predictor',
      environment: 'staging',
      version: 'v2.1.0-beta',
      status: 'deployed',
      replicas: 1,
      latency_ms: 18.0,
      request_rate: 42,
      error_rate: 0.0,
      api_endpoint: '/api/inference/churn-staging',
      framework: 'Random Forest',
      accuracy: 0.946
    }
  ]);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCanaryModal, setShowCanaryModal] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<Deployment | null>(null);

  // Canary A/B Traffic Split State
  const [canarySplit, setCanarySplit] = useState(20);

  // New Model Register Form
  const [modelName, setModelName] = useState('');
  const [modelVersion, setModelVersion] = useState('v1.0.0');
  const [modelEnv, setModelEnv] = useState<'production' | 'staging' | 'canary'>('production');
  const [modelFramework, setModelFramework] = useState('XGBoost');

  const handleRegisterModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName) return;

    const newDep: Deployment = {
      id: Date.now(),
      name: modelName,
      environment: modelEnv,
      version: modelVersion,
      status: 'deployed',
      replicas: modelEnv === 'production' ? 3 : 1,
      latency_ms: parseFloat((12 + Math.random() * 10).toFixed(1)),
      request_rate: 100,
      error_rate: 0.0,
      api_endpoint: `/api/inference/${modelName.toLowerCase().replace(/\s+/g, '-')}`,
      framework: modelFramework,
      accuracy: 0.950
    };

    setDeployments([newDep, ...deployments]);
    setShowRegisterModal(false);
    setModelName('');
  };

  const handleRollback = (id: number) => {
    setDeployments(deployments.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: 'rolled_back',
          version: 'v1.0.0-fallback-stable',
          latency_ms: parseFloat((d.latency_ms + 2).toFixed(1)),
          error_rate: 0.0
        };
      }
      return d;
    }));
    alert("Triggered Instant Rollback to stable fallback version v1.0.0-fallback-stable!");
  };

  const promoteCanaryToProduction = () => {
    setDeployments(deployments.map(d => {
      if (d.environment === 'canary') {
        return { ...d, environment: 'production', version: 'v2.0.0-promoted', canary_traffic_pct: 100 };
      }
      if (d.id === 1) {
        return { ...d, environment: 'staging', version: 'v1.2.0-archived', canary_traffic_pct: 0 };
      }
      return d;
    }));
    setShowCanaryModal(false);
    alert("Promoted Canary v2.0.0 to 100% Production!");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Title */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">MLOps & Deployment Platform</h1>
            <p className="text-sm text-gray-600">
              Model lifecycle registry, deployment metrics, canary A/B traffic splitting, and 1-click automated rollbacks
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCanaryModal(true)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm text-sm"
            >
              🐤 Canary A/B Traffic Splitter
            </button>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-sm"
            >
              + Register New Model
            </button>
          </div>
        </div>

        {/* Global Telemetry Metrics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-xs font-bold text-gray-500 uppercase">Active Deployments</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{deployments.length}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-bold bg-green-100 text-green-800 rounded-full">
              100% SLA Healthy
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-xs font-bold text-gray-500 uppercase">Average Latency (p50)</p>
            <p className="text-3xl font-black text-gray-900 mt-1">
              {(deployments.reduce((a, b) => a + b.latency_ms, 0) / deployments.length).toFixed(1)} ms
            </p>
            <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
              Real-time Monitoring
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-xs font-bold text-gray-500 uppercase">Total Throughput</p>
            <p className="text-3xl font-black text-gray-900 mt-1">
              {deployments.reduce((a, b) => a + b.request_rate, 0)} req/s
            </p>
            <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 rounded-full">
              Kubernetes Auto-Scaler
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-xs font-bold text-gray-500 uppercase">Global Error Rate</p>
            <p className="text-3xl font-black text-green-600 mt-1">0.01%</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-bold bg-green-100 text-green-800 rounded-full">
              Within SLA (Threshold 0.5%)
            </span>
          </div>
        </div>

        {/* Model Lifecycle Registry Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Active Model Deployments & Lifecycle Registry</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {deployments.map((dep) => (
              <div key={dep.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">{dep.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      dep.environment === 'production' ? 'bg-purple-100 text-purple-800' :
                      dep.environment === 'canary' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {dep.environment.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-700">{dep.version}</span>
                    {dep.status === 'rolled_back' && (
                      <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 font-bold">
                        ROLLED BACK
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{dep.api_endpoint}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Latency</p>
                    <p className="font-bold text-gray-900">{dep.latency_ms} ms</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">Throughput</p>
                    <p className="font-bold text-gray-900">{dep.request_rate} req/s</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">Replicas</p>
                    <p className="font-bold text-gray-900">{dep.replicas} pods</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedMetrics(dep)}
                      className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      Telemetry
                    </button>
                    <button
                      onClick={() => handleRollback(dep.id)}
                      disabled={dep.status === 'rolled_back'}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        dep.status === 'rolled_back'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-50 hover:bg-red-100 text-red-600'
                      }`}
                    >
                      Instant Rollback
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canary A/B Traffic Splitter Modal */}
        {showCanaryModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🐤 Canary A/B Traffic Splitter</h2>
              <p className="text-xs text-gray-500 mb-6">Route live user traffic between Production (v1.2) and Canary (v2.0)</p>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-700 mb-2">
                    <span>Production v1.2 ({100 - canarySplit}%)</span>
                    <span>Canary v2.0 ({canarySplit}%)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={canarySplit}
                    onChange={(e) => setCanarySplit(Number(e.target.value))}
                    className="w-full cursor-pointer accent-purple-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl text-center text-xs font-mono">
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="font-bold text-purple-700">Production v1.2</p>
                    <p className="mt-1">Latency: 14.2ms</p>
                    <p>Error: 0.01%</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="font-bold text-yellow-700">Canary v2.0</p>
                    <p className="mt-1">Latency: 12.8ms</p>
                    <p>Error: 0.00%</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCanaryModal(false)}
                  className="px-4 py-2 text-gray-600 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={promoteCanaryToProduction}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs shadow-sm"
                >
                  Promote Canary to 100% Production
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Register New Model Modal */}
        {showRegisterModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Register Model Version</h2>
              <form onSubmit={handleRegisterModel} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fraud Detection Engine"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Version Tag</label>
                  <input
                    type="text"
                    value={modelVersion}
                    onChange={(e) => setModelVersion(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Environment</label>
                    <select
                      value={modelEnv}
                      onChange={(e) => setModelEnv(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="canary">Canary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Framework</label>
                    <select
                      value={modelFramework}
                      onChange={(e) => setModelFramework(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="XGBoost">XGBoost</option>
                      <option value="LightGBM">LightGBM</option>
                      <option value="CatBoost">CatBoost</option>
                      <option value="PyTorch">PyTorch</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2 text-gray-600 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm"
                  >
                    Register & Deploy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Telemetry Metrics Modal */}
        {selectedMetrics && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedMetrics.name}</h2>
              <p className="text-xs text-gray-500 mb-6">Real-time telemetry, p50/p95/p99 latency & cURL endpoint</p>

              <div className="space-y-4 text-xs font-mono">
                <div className="p-4 bg-gray-50 rounded-xl flex justify-between">
                  <span className="text-gray-500">Latency (p50 / p95 / p99):</span>
                  <span className="font-bold text-gray-900">{selectedMetrics.latency_ms}ms / {(selectedMetrics.latency_ms * 1.8).toFixed(1)}ms / {(selectedMetrics.latency_ms * 2.4).toFixed(1)}ms</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl flex justify-between">
                  <span className="text-gray-500">Throughput:</span>
                  <span className="font-bold text-gray-900">{selectedMetrics.request_rate} req/s</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl flex justify-between">
                  <span className="text-gray-500">Error Rate:</span>
                  <span className="font-bold text-green-600">{(selectedMetrics.error_rate * 100).toFixed(2)}%</span>
                </div>

                <div className="p-4 bg-gray-900 text-green-400 rounded-xl overflow-x-auto">
                  <p>// cURL Endpoint</p>
                  <p>curl -X POST https://saikrishna069-ml-platform-backend.hf.space{selectedMetrics.api_endpoint}</p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedMetrics(null)}
                  className="px-5 py-2 bg-gray-900 text-white font-bold rounded-lg text-xs"
                >
                  Close Telemetry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
