import React, { useState } from 'react';
import MLOpsDashboard from './pages/MLOpsDashboard';
import Marketplace from './pages/Marketplace';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import ModelExplainability from './pages/ModelExplainability';

export default function App() {
  const [activeTab, setActiveTab] = useState<'mlops' | 'marketplace' | 'analytics' | 'explainability'>('mlops');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ML Platform
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
              Enterprise v1.2
            </span>
          </div>

          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab('mlops')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'mlops' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              MLOps Platform
            </button>
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'marketplace' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Model Marketplace
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'analytics' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              A/B Analytics
            </button>
            <button
              onClick={() => setActiveTab('explainability')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'explainability' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Explainability
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'mlops' && <MLOpsDashboard />}
        {activeTab === 'marketplace' && <Marketplace />}
        {activeTab === 'analytics' && <AdvancedAnalytics />}
        {activeTab === 'explainability' && <ModelExplainability />}
      </main>
    </div>
  );
}
