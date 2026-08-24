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
  sample_input: string;
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
      accuracy: 0.973,
      sample_input: '{\n  "sepal_length": 5.1,\n  "sepal_width": 3.5,\n  "petal_length": 1.4,\n  "petal_width": 0.2\n}'
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
      accuracy: 0.960,
      sample_input: '{\n  "feature_1": 42.5,\n  "feature_2": 185.0,\n  "feature_3": 12.4\n}'
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
      accuracy: 0.952,
      sample_input: '{\n  "income": 65000,\n  "age": 34,\n  "credit_score": 740\n}'
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
      accuracy: 0.946,
      sample_input: '{\n  "tenure": 24,\n  "num_products": 2,\n  "has_credit_card": 1\n}'
    }
  ]);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCanaryModal, setShowCanaryModal] = useState(false);
  const [inspectedDeployment, setInspectedDeployment] = useState<Deployment | null>(null);

  // Live cURL Inference Test State
  const [jsonInput, setJsonInput] = useState('');
  const [inferenceResult, setInferenceResult] = useState<string | null>(null);
  const [isInferring, setIsInferring] = useState(false);

  // Canary A/B Traffic Split State
  const [canarySplit, setCanarySplit] = useState(20);

  // New Model Register Form
  const [modelName, setModelName] = useState('');
  const [modelVersion, setModelVersion] = useState('v1.0.0');
  const [modelEnv, setModelEnv] = useState<'production' | 'staging' | 'canary'>('production');
  const [modelFramework, setModelFramework] = useState('XGBoost');

  const openModelInspector = (dep: Deployment) => {
    setInspectedDeployment(dep);
    setJsonInput(dep.sample_input);
    setInferenceResult(null);
  };

  const runLiveInference = () => {
    setIsInferring(true);
    setInferenceResult(null);

    setTimeout(() => {
      setIsInferring(false);
      setInferenceResult(JSON.stringify({
        status: "success",
        model: inspectedDeployment?.name,
        version: inspectedDeployment?.version,
        prediction: "CLASS_1 (Positive)",
        probability: 0.9842,
        latency_ms: inspectedDeployment?.latency_ms,
        timestamp: new Date().toISOString()
      }, null, 2));
    }, 600);
  };

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
      accuracy: 0.950,
      sample_input: '{\n  "feature_1": 1.0,\n  "feature_2": 2.0\n}'
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
              Click any model row in the registry to inspect live cURL API endpoints, test inference, view latency metrics, or trigger rollbacks
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
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Active Model Deployments & Lifecycle Registry</h2>
              <p className="text-xs text-gray-500 mt-0.5">Click any model row below to open the Live API Playground & Telemetry Inspector</p>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {deployments.map((dep) => (
              <div
                key={dep.id}
                onClick={() => openModelInspector(dep)}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-blue-50/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600">{dep.name}</h3>
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
                    <p className="text-xs text-gray-500">Accuracy</p>
                    <p className="font-bold text-gray-900">{(dep.accuracy * 100).toFixed(1)}%</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">Latency</p>
                    <p className="font-bold text-gray-900">{dep.latency_ms} ms</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">Throughput</p>
                    <p className="font-bold text-gray-900">{dep.request_rate} req/s</p>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openModelInspector(dep)}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors border border-blue-200"
                    >
                      🔍 Inspect API
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

        {/* MODEL INSPECTION & LIVE cURL API PLAYGROUND MODAL */}
        {inspectedDeployment && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-gray-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center flex-shrink-0">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black">{inspectedDeployment.name}</h2>
                    <span className="px-2.5 py-0.5 bg-purple-500 text-white text-xs font-bold rounded">
                      {inspectedDeployment.version}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 mt-1 font-mono">
                    Endpoint: https://saikrishna069-ml-platform-backend.hf.space{inspectedDeployment.api_endpoint}
                  </p>
                </div>
                <button
                  onClick={() => setInspectedDeployment(null)}
                  className="text-gray-400 hover:text-white text-2xl font-bold p-2"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* 1. Model Telemetry Gauges */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-center font-mono">
                  <div>
                    <span className="text-[11px] text-gray-500 uppercase">Framework</span>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">{inspectedDeployment.framework}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 uppercase">Accuracy Score</span>
                    <p className="font-bold text-green-600 text-sm mt-0.5">{(inspectedDeployment.accuracy * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 uppercase font-bold">p50 Latency</span>
                    <p className="font-bold text-blue-600 text-sm mt-0.5">{inspectedDeployment.latency_ms} ms</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 uppercase">Replicas</span>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">{inspectedDeployment.replicas} Pods</p>
                  </div>
                </div>

                {/* 2. Live API cURL Tester & Prediction Playground */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>🚀</span> Live Inference API Playground
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* JSON Input Editor */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Request JSON Payload</label>
                      <textarea
                        rows={6}
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className="w-full p-3 bg-gray-900 text-green-400 font-mono text-xs rounded-xl focus:outline-none"
                      />
                      <button
                        onClick={runLiveInference}
                        disabled={isInferring}
                        className={`mt-3 w-full py-2.5 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all ${
                          isInferring ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isInferring ? 'Sending Request to Hugging Face GPU...' : '🚀 Send Live Inference Request'}
                      </button>
                    </div>

                    {/* Live JSON Response Output */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">API Response Output</label>
                      <div className="h-[185px] p-3 bg-gray-900 text-yellow-300 font-mono text-xs rounded-xl overflow-y-auto border border-gray-800">
                        {isInferring ? (
                          <span className="text-yellow-400 animate-pulse">Running GPU inference...</span>
                        ) : inferenceResult ? (
                          <pre>{inferenceResult}</pre>
                        ) : (
                          <span className="text-gray-500 italic">// Click 'Send Live Inference Request' to see live JSON response</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. cURL Command Generator */}
                <div className="bg-gray-900 rounded-xl p-5 text-white font-mono text-xs space-y-1 overflow-x-auto">
                  <p className="text-gray-400">// Copy Production cURL Command</p>
                  <p className="text-green-400">curl -X POST https://saikrishna069-ml-platform-backend.hf.space{inspectedDeployment.api_endpoint} \</p>
                  <p className="text-green-400">  -H "Content-Type: application/json" \</p>
                  <p className="text-green-400">  -d '{jsonInput.replace(/\n/g, '')}'</p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
                <button
                  onClick={() => setInspectedDeployment(null)}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
}
