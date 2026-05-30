import React, { useState } from "react";
import { Sparkles, TrendingUp, Cpu, BarChart3, PieChart, ShieldAlert } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function AIAnalyticsView() {
  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState("");
  const [predictionData, setPredictionData] = useState<{
    riskLevel: string;
    metrics: string[];
    summary: string;
    growthRates: Array<{ name: string; value: number }>;
  } | null>(null);

  const handlePredictAnalytics = async () => {
    setLoading(true);
    setPredictionData(null);
    setNotifying("Interrogating enterprise records & projecting talent pipelines using Gemini...");

    try {
      const response = await fetch("/api/analytics/predict", {
        method: "POST"
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPredictionData({
          riskLevel: data.prediction.attritionRiskForecast || "LOW",
          metrics: data.prediction.strategicMetrics || [
            "At-Risk Roles: Machine Learning Engineers (highly competitive market).",
            "Department Stability: HR & Support segments demonstrate 98% retention projections.",
            "Salary Elasticity: Current standard 10% base hike meets competitive market indexes."
          ],
          summary: data.prediction.summary || "The corporation shows strong structural stability with optimal compensation levels. Attrition threats remain minimal during next Q cycles.",
          growthRates: [
            { name: "Engineering", value: 88 },
            { name: "Recruiting", value: 75 },
            { name: "General Exec", value: 94 }
          ]
        });
        setNotifying("");
      } else {
        setNotifying("Analytics forecasting gateway failure.");
      }
    } catch (err) {
      setNotifying("Aether AI Analytics feed offline.");
    } finally {
      setLoading(false);
    }
  };

  const performanceProjectionData = [
    { year: "2024", Efficiency: 80, Loyalty: 75 },
    { year: "2025", Efficiency: 88, Loyalty: 84 },
    { year: "2026", Efficiency: 92, Loyalty: 90 },
  ];

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-1000">AI Predictive Analytics</h2>
          <p className="text-xs text-slate-500">Run macro workforce simulations, attrition projections, and organizational efficiency analysis.</p>
        </div>
        {!predictionData && (
          <button
            onClick={handlePredictAnalytics}
            disabled={loading}
            className="flex items-center gap-1.5 px-4.5 py-3 bg-slate-900 border border-transparent rounded-xl text-white hover:bg-slate-800 font-bold text-xs transition shadow-md disabled:opacity-40 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-teal-400 rotate-6" />
            Simulate Workforce Growth Analytics
          </button>
        )}
      </div>

      {notifying && (
        <div className="bg-slate-900 border border-slate-800 text-teal-400 text-xs font-mono p-3 rounded-xl flex items-center gap-2.5 shadow">
          <Cpu className="h-4 w-4 animate-spin text-teal-400 shrink-0" />
          <span>{notifying}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* McKinsey statistics display graphs */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-slate-400" /> Executive Loyalty and Efficiency Trends
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Multi-year scale indices mapping Aether training frameworks.</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceProjectionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" fontSize={11} stroke="#64748b" tickLine={false} />
                <YAxis fontSize={11} stroke="#64748b" tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Efficiency" stroke="#0f172a" fill="#334155" fillOpacity={0.06} strokeWidth={2} />
                <Area type="monotone" dataKey="Loyalty" stroke="#059669" fill="#10b981" fillOpacity={0.02} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Predictive Outcomes panel */}
        <div className="bg-slate-900 text-slate-350 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          {predictionData ? (
            <div className="space-y-6 h-full flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">McKinsey Attrition Forecast</span>
                  <span className="font-mono text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/15">
                    {predictionData.riskLevel}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Executive Summary</span>
                  <p className="text-xs text-white leading-relaxed font-serif">"{predictionData.summary}"</p>
                </div>

                <div className="space-y-2.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">AI-Screening Data Recommendations</span>
                  <ul className="space-y-2 text-xs leading-relaxed text-slate-350">
                    {predictionData.metrics.map((met, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-teal-400 font-bold">•</span>
                        <span>{met}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={handlePredictAnalytics}
                disabled={loading}
                className="w-full mt-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Rerun Analytics Engine
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-4 py-8">
              <Sparkles className="h-10 w-10 text-slate-650" />
              <div>
                <p className="text-xs font-bold text-slate-300">Run Workforce Predictive Simulation</p>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed max-w-xs">
                  Aether AI will examine current payroll configurations, attendance punctuality ratios, and vacations lists to output talent-risk indexes.
                </p>
              </div>
              <button
                onClick={handlePredictAnalytics}
                disabled={loading}
                className="mt-4 px-4 py-2 bg-white text-slate-950 hover:bg-slate-50 font-bold text-[11px] rounded-xl cursor-pointer"
              >
                Simulate Analytics
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
