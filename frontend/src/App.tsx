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
              <span className="text-2xl font-black text-gray-900 tracking-tight">
                ML Platform
              </span>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-gray-100 text-gray-800 rounded-full border border-gray-200">
                Enterprise v1.2
              </span>
            </div>

            <nav className="flex flex-wrap justify-center gap-1">
              <button
                onClick={() => setActiveTab('datasets')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'datasets' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Datasets & EDA
              </button>
              <button
                onClick={() => setActiveTab('automl')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'automl' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                AutoML Studio
              </button>
              <button
                onClick={() => setActiveTab('mlops')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'mlops' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                MLOps Platform
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'marketplace' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Marketplace
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'analytics' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                A/B Analytics
              </button>
              <button
                onClick={() => setActiveTab('explainability')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'explainability' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Explainability & SHAP
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
