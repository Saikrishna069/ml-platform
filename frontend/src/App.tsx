import React, { useState } from 'react';
import { PlatformProvider } from './context/PlatformContext';
import DatasetStudio from './pages/DatasetStudio';
import AutoMLStudio from './pages/AutoMLStudio';
import MLOpsDashboard from './pages/MLOpsDashboard';
import Marketplace from './pages/Marketplace';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import ModelExplainability from './pages/ModelExplainability';

export default function App() {
  const [activeTab, setActiveTab] = useState<'datasets' | 'automl' | 'mlops' | 'marketplace' | 'analytics' | 'explainability'>('datasets');

  return (
    <PlatformProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {/* Top Header & Navigation */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center h-auto md:h-16 py-3 md:py-0 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ML Platform
              </span>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
                Enterprise v1.2
              </span>
            </div>

            <nav className="flex flex-wrap justify-center gap-1">
              <button
                onClick={() => setActiveTab('datasets')}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'datasets' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 Datasets & EDA
              </button>
              <button
                onClick={() => setActiveTab('automl')}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'automl' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🤖 AutoML Studio
              </button>
              <button
                onClick={() => setActiveTab('mlops')}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'mlops' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ⚡ MLOps Platform
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'marketplace' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🏪 Marketplace
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'analytics' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📈 A/B Analytics
              </button>
              <button
                onClick={() => setActiveTab('explainability')}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'explainability' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔍 Explainability & SHAP
              </button>
            </nav>
          </div>
        </header>

        {/* Main Studio View Rendering */}
        <main className="flex-1">
          {activeTab === 'datasets' && <DatasetStudio />}
          {activeTab === 'automl' && <AutoMLStudio />}
          {activeTab === 'mlops' && <MLOpsDashboard />}
          {activeTab === 'marketplace' && <Marketplace />}
          {activeTab === 'analytics' && <AdvancedAnalytics />}
          {activeTab === 'explainability' && <ModelExplainability />}
        </main>
      </div>
    </PlatformProvider>
  );
}
