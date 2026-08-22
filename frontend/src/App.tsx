import React, { useState } from 'react';
import Marketplace from './pages/Marketplace';
import MLOpsDashboard from './pages/MLOpsDashboard';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import ModelExplainability from './pages/ModelExplainability';

export default function App() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'mlops' | 'analytics' | 'explainability'>('marketplace');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', color: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
      {/* Sleek Top Header Navigation */}
      <header style={{ backgroundColor: '#111827', borderBottom: '1px solid #1f2937', padding: '16px 32px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '18px',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
            }}>
              ML
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', tracking: '-0.5px', background: 'linear-gradient(135deg, #ffffff 0%, #9ca3af 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Enterprise ML Platform
              </h1>
              <p style={{ fontSize: '11px', color: '#6b7280' }}>AutoML • Marketplace • MLOps • Analytics</p>
            </div>
          </div>

          {/* Navigation Bar Tabs */}
          <nav style={{ display: 'flex', gap: '8px', background: 'rgba(31, 41, 55, 0.5)', padding: '6px', borderRadius: '12px', border: '1px solid #374151' }}>
            <button
              onClick={() => setActiveTab('marketplace')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === 'marketplace' ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'transparent',
                color: activeTab === 'marketplace' ? '#ffffff' : '#9ca3af',
                boxShadow: activeTab === 'marketplace' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              🛒 Model Marketplace
            </button>
            <button
              onClick={() => setActiveTab('mlops')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === 'mlops' ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'transparent',
                color: activeTab === 'mlops' ? '#ffffff' : '#9ca3af',
                boxShadow: activeTab === 'mlops' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              🚀 MLOps Platform
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === 'analytics' ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'transparent',
                color: activeTab === 'analytics' ? '#ffffff' : '#9ca3af',
                boxShadow: activeTab === 'analytics' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              📊 A/B Testing
            </button>
            <button
              onClick={() => setActiveTab('explainability')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === 'explainability' ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'transparent',
                color: activeTab === 'explainability' ? '#ffffff' : '#9ca3af',
                boxShadow: activeTab === 'explainability' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              🧠 Explainability (SHAP)
            </button>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '600',
              fontFamily: 'monospace'
            }}>
              ● API Online
            </span>
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main style={{ flex: 1, padding: '32px 16px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        {activeTab === 'marketplace' && <Marketplace />}
        {activeTab === 'mlops' && <MLOpsDashboard />}
        {activeTab === 'analytics' && <AdvancedAnalytics />}
        {activeTab === 'explainability' && <ModelExplainability />}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#111827', borderTop: '1px solid #1f2937', padding: '20px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
        Enterprise Multi-Tenant AutoML, Marketplace & MLOps Platform — 100% Free Production Ready
      </footer>
    </div>
  );
}
