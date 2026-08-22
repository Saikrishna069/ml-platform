import React, { useState } from 'react';
import Marketplace from './pages/Marketplace';
import MLOpsDashboard from './pages/MLOpsDashboard';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import ModelExplainability from './pages/ModelExplainability';

export default function App() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'mlops' | 'analytics' | 'explainability'>('marketplace');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg">
              ML
            </div>
            <span className="text-xl font-bold tracking-tight">Enterprise ML Platform</span>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'marketplace' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              Model Marketplace
            </button>
            <button
              onClick={() => setActiveTab('mlops')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'mlops' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              MLOps Platform
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              A/B Experimentation
            </button>
            <button
              onClick={() => setActiveTab('explainability')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'explainability' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              Explainability (SHAP)
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full font-mono">
              ● API Live
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'marketplace' && <Marketplace />}
        {activeTab === 'mlops' && <MLOpsDashboard />}
        {activeTab === 'analytics' && <AdvancedAnalytics />}
        {activeTab === 'explainability' && <ModelExplainability />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        Enterprise Multi-Tenant AutoML, Marketplace & MLOps Platform — 100% Free Production Ready
      </footer>
    </div>
  );
}
