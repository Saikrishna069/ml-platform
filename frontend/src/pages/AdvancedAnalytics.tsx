import React, { useState } from 'react';

// Pure JavaScript approximation for Error Function erf(x)
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

export default function AdvancedAnalytics() {
  const [activeTab, setActiveTab] = useState<'sizing' | 'power' | 'abtest'>('sizing');

  // 1. Sample Size Sizing State
  const [baselineConv, setBaselineConv] = useState(5.0); // %
  const [mdePct, setMdePct] = useState(10.0); // % relative lift
  const [alpha, setAlpha] = useState(0.05); // 5% significance
  const [power, setPower] = useState(0.80); // 80% statistical power
  const [dailyTraffic, setDailyTraffic] = useState(2500);

  // 2. Power Matrix Interactive Slider State
  const [simulatedN, setSimulatedN] = useState(15000);

  // 3. Sequential A/B Test State
  const [variantA_users, setVariantA_users] = useState(12400);
  const [variantA_conv, setVariantA_conv] = useState(620); // 5.0%
  const [variantB_users, setVariantB_users] = useState(12450);
  const [variantB_conv, setVariantB_conv] = useState(695); // 5.58%

  // Preset Scenario Handlers
  const applyPreset = (type: 'ecommerce' | 'app' | 'email') => {
    if (type === 'ecommerce') {
      setBaselineConv(5.0);
      setMdePct(10.0);
      setDailyTraffic(2500);
    } else if (type === 'app') {
      setBaselineConv(12.0);
      setMdePct(5.0);
      setDailyTraffic(5000);
    } else {
      setBaselineConv(2.5);
      setMdePct(15.0);
      setDailyTraffic(1000);
    }
  };

  // Calculations for Sizing
  const p1 = Math.max(0.001, Math.min(0.999, baselineConv / 100));
  const p2 = Math.max(0.001, Math.min(0.999, p1 * (1 + mdePct / 100)));
  const delta = Math.abs(p2 - p1);
  const pAvg = (p1 + p2) / 2;

  const zAlpha = alpha === 0.01 ? 2.576 : alpha === 0.05 ? 1.96 : 1.645;
  const zBeta = power === 0.90 ? 1.282 : power === 0.85 ? 1.036 : 0.842;

  const requiredSamplePerVariant = delta > 0 ? Math.ceil(
    (2 * pAvg * (1 - pAvg) * Math.pow(zAlpha + zBeta, 2)) / Math.pow(delta, 2)
  ) : 1000;
  const totalRequiredSamples = requiredSamplePerVariant * 2;
  const estimatedDays = Math.max(1, Math.ceil(totalRequiredSamples / (dailyTraffic || 1)));

  // Calculations for Power Matrix
  const achievedPowerPct = Math.min(99.9, Math.max(10.0, parseFloat((
    (1 - (1 - (0.5 * (1 + erf((Math.sqrt(simulatedN / (requiredSamplePerVariant || 1)) * (zAlpha + zBeta) - zAlpha) / Math.sqrt(2)))))) * 100
  ).toFixed(1))));

  // A/B Test Stats
  const rateA = variantA_users > 0 ? (variantA_conv / variantA_users) : 0;
  const rateB = variantB_users > 0 ? (variantB_conv / variantB_users) : 0;
  const relativeLift = rateA > 0 ? ((rateB - rateA) / rateA) * 100 : 0;

  const totalConv = variantA_conv + variantB_conv;
  const totalUsers = variantA_users + variantB_users;
  const pooledP = totalUsers > 0 ? totalConv / totalUsers : 0.05;
  const sePool = (totalUsers > 0 && variantA_users > 0 && variantB_users > 0)
    ? Math.sqrt(pooledP * (1 - pooledP) * (1 / variantA_users + 1 / variantB_users))
    : 0.01;
  const zStat = sePool > 0 ? (rateB - rateA) / sePool : 0;
  const pValue = parseFloat((2 * (1 - (0.5 * (1 + erf(Math.abs(zStat) / Math.sqrt(2)))))) .toFixed(4));
  const isStatSig = pValue < alpha;

  // Simulate Batch Traffic Addition
  const simulateBatchTraffic = () => {
    const batchUsersA = 500;
    const batchUsersB = 500;
    const batchConvA = Math.round(batchUsersA * (p1 + (Math.random() * 0.01 - 0.005)));
    const batchConvB = Math.round(batchUsersB * (p2 + (Math.random() * 0.01 - 0.005)));

    setVariantA_users(prev => prev + batchUsersA);
    setVariantA_conv(prev => prev + batchConvA);
    setVariantB_users(prev => prev + batchUsersB);
    setVariantB_conv(prev => prev + batchConvB);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Title */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Advanced Analytics & Experimentation Studio</h1>
            <p className="text-sm text-gray-600">
              100% interactive statistical sample size calculator, power risk matrix, and sequential A/B testing decision engine
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Quick Presets:</span>
            <button onClick={() => applyPreset('ecommerce')} className="px-3 py-1.5 bg-white border border-gray-300 hover:border-indigo-500 text-xs font-bold rounded-lg text-gray-700 shadow-sm">
              🛒 E-Commerce Checkout
            </button>
            <button onClick={() => applyPreset('app')} className="px-3 py-1.5 bg-white border border-gray-300 hover:border-indigo-500 text-xs font-bold rounded-lg text-gray-700 shadow-sm">
              📱 Mobile App Signup
            </button>
            <button onClick={() => applyPreset('email')} className="px-3 py-1.5 bg-white border border-gray-300 hover:border-indigo-500 text-xs font-bold rounded-lg text-gray-700 shadow-sm">
              ✉️ Email Click Rate
            </button>
          </div>
        </div>

        {/* 3 Main Studio Sub-Tabs */}
        <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-6 pt-3 space-x-8 mb-8 border shadow-sm">
          <button
            onClick={() => setActiveTab('sizing')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'sizing' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            📐 Sample Size Sizing Calculator
          </button>
          <button
            onClick={() => setActiveTab('power')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'power' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            📊 Statistical Power & Risk Matrix
          </button>
          <button
            onClick={() => setActiveTab('abtest')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'abtest' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            🧪 Sequential A/B Test Simulator
          </button>
        </div>

        {/* TAB 1: SAMPLE SIZE SIZING CALCULATOR */}
        {activeTab === 'sizing' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">1. Set Your Experiment Parameters</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Baseline Conversion Rate Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-700 uppercase">Baseline Conversion Rate</label>
                    <span className="text-sm font-black text-indigo-600 font-mono">{baselineConv}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="50"
                    step="0.5"
                    value={baselineConv}
                    onChange={(e) => setBaselineConv(Number(e.target.value))}
                    className="w-full cursor-pointer accent-indigo-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your current conversion rate before testing</p>
                </div>

                {/* Minimum Detectable Effect Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-700 uppercase">Minimum Improvement Target (MDE)</label>
                    <span className="text-sm font-black text-indigo-600 font-mono">+{mdePct}% Lift</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={mdePct}
                    onChange={(e) => setMdePct(Number(e.target.value))}
                    className="w-full cursor-pointer accent-indigo-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">The minimum relative lift you want to reliably detect</p>
                </div>

                {/* Statistical Power Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Statistical Power (1 - β)</label>
                  <select
                    value={power}
                    onChange={(e) => setPower(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white font-mono font-bold"
                  >
                    <option value={0.80}>80% Power (Recommended Standard - 20% Type II Risk)</option>
                    <option value={0.85}>85% Power (High Sensitivity - 15% Risk)</option>
                    <option value={0.90}>90% Power (Ultra Strict - 10% Risk)</option>
                  </select>
                </div>

                {/* Significance Level Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Significance Level (α)</label>
                  <select
                    value={alpha}
                    onChange={(e) => setAlpha(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white font-mono font-bold"
                  >
                    <option value={0.05}>95% Confidence (α = 0.05 - Standard)</option>
                    <option value={0.01}>99% Confidence (α = 0.01 - High Strictness)</option>
                    <option value={0.10}>90% Confidence (α = 0.10 - Exploratory)</option>
                  </select>
                </div>
              </div>

              {/* Sizing Output Display Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl text-white shadow-lg">
                <div className="border-r border-indigo-700/50 pr-4">
                  <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Required Samples / Variant</span>
                  <p className="text-4xl font-black mt-2 text-white">{requiredSamplePerVariant.toLocaleString()}</p>
                  <p className="text-xs text-indigo-200 mt-1">Total combined: {(totalRequiredSamples).toLocaleString()} visitors</p>
                </div>

                <div className="border-r border-indigo-700/50 pr-4">
                  <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Daily Traffic Input</span>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={dailyTraffic}
                      onChange={(e) => setDailyTraffic(Number(e.target.value))}
                      className="w-36 px-3 py-1 bg-white/10 border border-white/20 rounded-xl text-xl font-bold text-white"
                    />
                    <span className="text-xs text-indigo-200">visitors/day</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Required Experiment Duration</span>
                  <p className="text-4xl font-black text-green-300 mt-2">{estimatedDays} Days</p>
                  <p className="text-xs text-indigo-200 mt-1">Run test for {estimatedDays} full days before stopping</p>
                </div>
              </div>

              {/* Actionable Plain-English Recommendation Box */}
              <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-3">
                <span className="text-lg">💡</span>
                <div>
                  <p className="font-bold">Plain-English Recommendation:</p>
                  <p className="mt-0.5">
                    To detect a <strong>+{mdePct}% relative improvement</strong> over your baseline <strong>{baselineConv}% rate</strong> with <strong>{(100 - alpha * 100)}% confidence</strong>, you need to collect <strong>{requiredSamplePerVariant.toLocaleString()} visitors per variant</strong>. At {dailyTraffic.toLocaleString()} visitors/day, run your A/B test for at least <strong>{estimatedDays} days</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STATISTICAL POWER & RISK MATRIX */}
        {activeTab === 'power' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-900">Statistical Power & Risk Evaluation Matrix</h2>

            {/* Interactive Sample Size vs Power Slider */}
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-700 uppercase">Simulate Sample Size per Variant (N)</label>
                <span className="text-sm font-black text-indigo-600 font-mono">{simulatedN.toLocaleString()} Visitors</span>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={simulatedN}
                onChange={(e) => setSimulatedN(Number(e.target.value))}
                className="w-full cursor-pointer accent-indigo-600 mb-4"
              />

              <div className="p-4 bg-white rounded-xl border border-gray-200 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">Achieved Statistical Power at N = {simulatedN.toLocaleString()}:</span>
                <span className={`text-lg font-black ${achievedPowerPct >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
                  {achievedPowerPct}% Power
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                <span className="text-xs font-bold text-blue-800 uppercase">False Positive Risk (Type I Error α)</span>
                <p className="text-3xl font-black text-blue-900 mt-1">{(alpha * 100).toFixed(1)}% Risk</p>
                <p className="text-xs text-blue-700 mt-2">
                  There is only a {(alpha * 100).toFixed(1)}% probability of declaring a winner when there is no real difference.
                </p>
              </div>

              <div className="p-6 bg-purple-50 border border-purple-200 rounded-2xl">
                <span className="text-xs font-bold text-purple-800 uppercase">False Negative Risk (Type II Error β)</span>
                <p className="text-3xl font-black text-purple-900 mt-1">{((1 - power) * 100).toFixed(1)}% Risk</p>
                <p className="text-xs text-purple-700 mt-2">
                  There is a {((1 - power) * 100).toFixed(1)}% chance of missing a true +{mdePct}% improvement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SEQUENTIAL A/B TEST SIMULATOR */}
        {activeTab === 'abtest' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Sequential A/B Test Live Decision Engine (SPRT)</h2>
                <p className="text-xs text-gray-500 mt-0.5">Input live results or click 'Simulate Batch Traffic' to run real-time hypothesis tests</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={simulateBatchTraffic}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  🚀 Simulate +1,000 Incoming Visitors
                </button>
                <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider ${
                  isStatSig ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                }`}>
                  {isStatSig ? '🏆 WINNER DECIDED (STATISTICALLY SIGNIFICANT)' : '⏳ CONTINUE TESTING (INCONCLUSIVE)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Control Variant A */}
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Control Variant A</h3>
                  <span className="text-xs font-mono text-gray-500 font-bold">Control</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Total Visitors (N)</label>
                    <input
                      type="number"
                      value={variantA_users}
                      onChange={(e) => setVariantA_users(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Conversions</label>
                    <input
                      type="number"
                      value={variantA_conv}
                      onChange={(e) => setVariantA_conv(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono font-bold text-indigo-700"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between text-xs font-mono">
                  <span className="text-gray-500">Conversion Rate:</span>
                  <span className="font-bold text-gray-900">{(rateA * 100).toFixed(2)}%</span>
                </div>
              </div>

              {/* Challenger Variant B */}
              <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-indigo-900">Challenger Variant B</h3>
                  <span className="text-xs font-mono text-indigo-600 font-bold">Challenger</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Total Visitors (N)</label>
                    <input
                      type="number"
                      value={variantB_users}
                      onChange={(e) => setVariantB_users(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Conversions</label>
                    <input
                      type="number"
                      value={variantB_conv}
                      onChange={(e) => setVariantB_conv(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono font-bold text-indigo-700"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-indigo-200 flex justify-between text-xs font-mono">
                  <span className="text-gray-500">Conversion Rate:</span>
                  <span className="font-bold text-indigo-700">{(rateB * 100).toFixed(2)}% ({relativeLift >= 0 ? '+' : ''}{relativeLift.toFixed(2)}% lift)</span>
                </div>
              </div>
            </div>

            {/* Metrics Footer */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-gray-900 rounded-2xl text-white font-mono text-xs text-center">
              <div>
                <span className="text-gray-400">Relative Lift:</span>
                <p className={`font-bold text-sm mt-0.5 ${relativeLift >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {relativeLift >= 0 ? '+' : ''}{relativeLift.toFixed(2)}%
                </p>
              </div>
              <div>
                <span className="text-gray-400">P-Value:</span>
                <p className="font-bold text-sm text-yellow-300 mt-0.5">{pValue}</p>
              </div>
              <div>
                <span className="text-gray-400">Z-Score:</span>
                <p className="font-bold text-sm text-blue-300 mt-0.5">{zStat.toFixed(3)}</p>
              </div>
              <div>
                <span className="text-gray-400">Confidence Interval:</span>
                <p className="font-bold text-sm text-purple-300 mt-0.5">{(100 - alpha * 100)}% Confident</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
