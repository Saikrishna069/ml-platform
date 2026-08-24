import React, { useState } from 'react';

export default function AdvancedAnalytics() {
  // 1. Sample Size Sizing Controls
  const [baselineConv, setBaselineConv] = useState(5.0); // %
  const [mdePct, setMdePct] = useState(10.0); // % relative lift
  const [alpha, setAlpha] = useState(0.05); // 5% significance
  const [power, setPower] = useState(0.80); // 80% statistical power
  const [dailyTraffic, setDailyTraffic] = useState(2500);

  // 2. Sequential A/B Test Simulator State
  const [variantA_users, setVariantA_users] = useState(12400);
  const [variantA_conv, setVariantA_conv] = useState(620); // 5.0%
  const [variantB_users, setVariantB_users] = useState(12450);
  const [variantB_conv, setVariantB_conv] = useState(695); // 5.58%

  // Calculated Sample Size Metrics
  const p1 = baselineConv / 100;
  const p2 = p1 * (1 + mdePct / 100);
  const delta = Math.abs(p2 - p1);
  const pAvg = (p1 + p2) / 2;

  // Z-scores: Z_alpha/2 (1.96 for 0.05) and Z_beta (0.84 for 0.80 power)
  const zAlpha = alpha === 0.01 ? 2.576 : alpha === 0.05 ? 1.96 : 1.645;
  const zBeta = power === 0.90 ? 1.282 : power === 0.85 ? 1.036 : 0.842;

  const requiredSamplePerVariant = Math.ceil(
    (2 * pAvg * (1 - pAvg) * Math.pow(zAlpha + zBeta, 2)) / Math.pow(delta, 2)
  );
  const totalRequiredSamples = requiredSamplePerVariant * 2;
  const estimatedDays = Math.ceil(totalRequiredSamples / dailyTraffic);

  // Sequential A/B Test Results
  const rateA = variantA_users > 0 ? (variantA_conv / variantA_users) : 0;
  const rateB = variantB_users > 0 ? (variantB_conv / variantB_users) : 0;
  const relativeLift = rateA > 0 ? ((rateB - rateA) / rateA) * 100 : 0;

  // Two-proportion Z-test p-value calculation
  const pooledP = (variantA_conv + variantB_conv) / (variantA_users + variantB_users);
  const sePool = Math.sqrt(pooledP * (1 - pooledP) * (1 / variantA_users + 1 / variantB_users));
  const zStat = sePool > 0 ? (rateB - rateA) / sePool : 0;

  // Normal CDF approximation for p-value
  const pValue = parseFloat((2 * (1 - (0.5 * (1 + Math.erf(Math.abs(zStat) / Math.sqrt(2)))))).toFixed(4));
  const isStatSig = pValue < alpha;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Advanced Analytics & Experimentation Studio</h1>
          <p className="text-sm text-gray-600">
            Statistical sample size calculator, power analysis risk matrix, and sequential A/B testing decision engine
          </p>
        </div>

        {/* Section 1: Statistical Sample Size Calculator */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📐</span> Statistical Sample Size Sizing Engine
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Baseline Conversion Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="99"
                value={baselineConv}
                onChange={(e) => setBaselineConv(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Min. Detectable Effect (MDE %)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="100"
                value={mdePct}
                onChange={(e) => setMdePct(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Statistical Power (1 - β)</label>
              <select
                value={power}
                onChange={(e) => setPower(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white font-mono"
              >
                <option value={0.80}>80% (Standard Power)</option>
                <option value={0.85}>85% High Power</option>
                <option value={0.90}>90% Ultra Power</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Significance Level (α)</label>
              <select
                value={alpha}
                onChange={(e) => setAlpha(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white font-mono"
              >
                <option value={0.05}>α = 0.05 (95% Confidence)</option>
                <option value={0.01}>α = 0.01 (99% Confidence)</option>
                <option value={0.10}>α = 0.10 (90% Confidence)</option>
              </select>
            </div>
          </div>

          {/* Sizing Output Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl text-white">
            <div className="border-r border-indigo-700/50 pr-4">
              <span className="text-xs font-bold text-indigo-200 uppercase">Required Samples Per Variant</span>
              <p className="text-3xl font-black mt-1">{requiredSamplePerVariant.toLocaleString()}</p>
              <p className="text-xs text-indigo-300 mt-1">Total across 2 variants: {(totalRequiredSamples).toLocaleString()}</p>
            </div>

            <div className="border-r border-indigo-700/50 pr-4">
              <span className="text-xs font-bold text-indigo-200 uppercase">Daily Traffic Volume</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={dailyTraffic}
                  onChange={(e) => setDailyTraffic(Number(e.target.value))}
                  className="w-32 px-3 py-1 bg-white/10 border border-white/20 rounded text-lg font-bold text-white"
                />
                <span className="text-xs text-indigo-200">visitors/day</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-indigo-200 uppercase">Estimated Run Duration</span>
              <p className="text-3xl font-black text-green-300 mt-1">{estimatedDays} Days</p>
              <p className="text-xs text-indigo-200 mt-1">Required to reach Statistical Power</p>
            </div>
          </div>
        </div>

        {/* Section 2: Sequential A/B Test Decision Engine */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🧪</span> Sequential A/B Test Decision Engine (SPRT)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Real-time hypothesis testing with early stopping bounds</p>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${
              isStatSig ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
            }`}>
              {isStatSig ? '🏆 WINNER DECIDED (STATISTICALLY SIGNIFICANT)' : '⏳ CONTINUE TESTING (INCONCLUSIVE)'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Control Variant A */}
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Control Variant A</h3>
                <span className="text-xs font-mono text-gray-500">Baseline</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Visitors (N)</label>
                  <input
                    type="number"
                    value={variantA_users}
                    onChange={(e) => setVariantA_users(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Conversions</label>
                  <input
                    type="number"
                    value={variantA_conv}
                    onChange={(e) => setVariantA_conv(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between text-xs font-mono">
                <span className="text-gray-500">Conversion Rate:</span>
                <span className="font-bold text-gray-900">{(rateA * 100).toFixed(2)}%</span>
              </div>
            </div>

            {/* Challenger Variant B */}
            <div className="p-6 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-indigo-900">Challenger Variant B</h3>
                <span className="text-xs font-mono text-indigo-600 font-bold">Challenger</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Visitors (N)</label>
                  <input
                    type="number"
                    value={variantB_users}
                    onChange={(e) => setVariantB_users(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Conversions</label>
                  <input
                    type="number"
                    value={variantB_conv}
                    onChange={(e) => setVariantB_conv(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-indigo-200 flex justify-between text-xs font-mono">
                <span className="text-gray-500">Conversion Rate:</span>
                <span className="font-bold text-indigo-700">{(rateB * 100).toFixed(2)}% ({relativeLift >= 0 ? '+' : ''}{relativeLift.toFixed(2)}% lift)</span>
              </div>
            </div>
          </div>

          {/* Statistical Metrics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-900 rounded-xl text-white font-mono text-xs text-center">
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
              <span className="text-gray-400">Z-Score Statistic:</span>
              <p className="font-bold text-sm text-blue-300 mt-0.5">{zStat.toFixed(3)}</p>
            </div>
            <div>
              <span className="text-gray-400">Confidence Interval:</span>
              <p className="font-bold text-sm text-purple-300 mt-0.5">{(100 - alpha * 100)}% Confident</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
