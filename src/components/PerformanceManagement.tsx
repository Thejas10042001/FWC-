import React, { useState } from "react";
import { PerformanceRecord } from "../types";
import { 
  Award, 
  Sparkles, 
  CheckCircle, 
  MessageSquareReply, 
  TrendingUp, 
  UserPlus, 
  Target 
} from "lucide-react";

interface PerformanceManagementProps {
  userRole: string;
  performance: PerformanceRecord[];
  setPerformance: React.Dispatch<React.SetStateAction<PerformanceRecord[]>>;
}

export default function PerformanceManagement({ userRole, performance, setPerformance }: PerformanceManagementProps) {
  const [selectedRecord, setSelectedRecord] = useState<PerformanceRecord | null>(performance[0] || null);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [kpisInput, setKpisInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState("");

  const isLeaderOrHR = userRole === "Senior Manager" || userRole === "HR Recruiter" || userRole === "Super Admin";

  const handleUpdateKPI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !kpisInput) return;
    setLoading(true);
    setNotifying("Broadcasting strategic team KPIs...");

    try {
      const response = await fetch("/api/performance/update-kpis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedRecord.employeeId,
          kpis: kpisInput
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPerformance(prev => prev.map(p => p.employeeId === selectedRecord.employeeId ? data.record : p));
        setSelectedRecord(data.record);
        setNotifying("KPI targets aligned successfully!");
        setKpisInput("");
      }
    } catch (err) {
      setNotifying("Connection failed during KPI setup.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunAIReview = async () => {
    if (!selectedRecord || !feedbackInput) return;
    setLoading(true);
    setNotifying("Synthesizing comments with Gemini AI...");

    try {
      const response = await fetch("/api/performance/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedRecord.employeeId,
          reviewerFeedback: feedbackInput
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPerformance(prev => prev.map(p => p.employeeId === selectedRecord.employeeId ? data.record : p));
        setSelectedRecord(data.record);
        setNotifying("Gemini analysis verified & processed successfully!");
        setFeedbackInput("");
      }
    } catch (err) {
      setNotifying("Aether AI gateway returned error during compilation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-1000">KPIs & Performance Auditing</h2>
          <p className="text-xs text-slate-500">Align enterprise objectives, track 360 reviews, and analyze staff achievements utilizing Gemini.</p>
        </div>
      </div>

      {notifying && (
        <div className="bg-slate-900 border border-slate-800 text-teal-400 text-xs font-mono p-3 rounded-xl flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-spin text-teal-400" />
          <span>{notifying}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation Sidebar of records */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Strategic reviews squad roster</span>
              <p className="text-[9px] text-slate-400 mt-0.5">Select a staff member's ledger to align corporate KPIs.</p>
            </div>
            <div className="divide-y divide-slate-100 select-none">
              {performance.map((record) => {
                const isActive = selectedRecord?.employeeId === record.employeeId;
                return (
                  <div
                    key={record.employeeId}
                    onClick={() => setSelectedRecord(record)}
                    className={`p-4 cursor-pointer text-xs transition duration-150 ${
                      isActive ? "bg-slate-50 border-l-4 border-slate-900" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{record.employeeName}</span>
                      <span className="font-mono text-[9px] text-slate-400 uppercase">{record.employeeId}</span>
                    </div>
                    <p className="text-slate-550 mt-1">{record.department}</p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Review Level:</span>
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {record.rating ? `${record.rating} / 5` : "Awaiting Appraisal"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 leading-relaxed">
            Corporate Review Standard 2026 guidelines dictate aligning target outputs prior to active Q appraisals.
          </div>
        </div>

        {/* Dynamic Detail Sheet */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRecord ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">{selectedRecord.employeeName} Review ledger</h3>
                  <p className="text-xs text-slate-400 mt-1">{selectedRecord.department} Branch • Quarter Cycle</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-slate-550/10 border border-slate-550/20 text-slate-700 flex items-center justify-center font-extrabold text-xs">
                  ★
                </div>
              </div>

              {/* Objectives details */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-slate-400" /> Current Quarter Goals (Target Deliverables)
                </h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs leading-relaxed text-slate-750 font-serif whitespace-pre-line">
                  {selectedRecord.kpis || "No strict KPIs aligned to this ledger."}
                </div>
              </div>

              {/* AI review summaries */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-purple-500" /> Gemini AI Compiled Evaluation Score
                </h4>
                {selectedRecord.aiSummary ? (
                  <div className="space-y-3">
                    <div className="bg-amber-500/[0.04] border border-amber-500/10 p-4 rounded-xl text-xs">
                      <span className="font-bold text-amber-800 tracking-wider text-[10px] uppercase block mb-1">Career Growth Steering Predictions:</span>
                      <p className="italic text-slate-800 leading-relaxed font-serif">"{selectedRecord.aiSummary}"</p>
                    </div>
                    {/* Scores indicators */}
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-slate-400 text-[10px] block uppercase">Final Rating Score</span>
                        <span className="text-lg font-extrabold text-slate-900 mt-1 inline-block">{selectedRecord.rating} / 5</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-slate-400 text-[10px] block uppercase">Appraisal status</span>
                        <span className="text-lg font-extrabold text-slate-900 mt-1 inline-block">Concluded</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-purple-700 text-xs">
                    No active appraisals compiled. Submit manager/reviewer comments below to trigger Gemini assessment ratings.
                  </div>
                )}
              </div>

              {/* Action Forms for Managers */}
              {isLeaderOrHR && (
                <div className="border-t border-slate-100 pt-6 space-y-6">
                  {/* Form 1: KPI Alignment */}
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-405 uppercase tracking-wide mb-2.5">Set / Align Goals & Targets</h5>
                    <form onSubmit={handleUpdateKPI} className="flex gap-3">
                      <input
                        type="text"
                        required
                        value={kpisInput}
                        onChange={(e) => setKpisInput(e.target.value)}
                        placeholder="E.g. Launch core cloud databases (100% SLA) - 20w deadline"
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-slate-900/10 focus:border-slate-900"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl disabled:opacity-40"
                      >
                        Publish Goals
                      </button>
                    </form>
                  </div>

                  {/* Form 2: Feedback & AI Review Trigger */}
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-405 uppercase tracking-wide mb-2">Compile Appraisal comments with Gemini AI</h5>
                    <div className="space-y-3">
                      <textarea
                        rows={3}
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="Provide concrete details about staff contributions, launch execution times, or collaboration traits..."
                        className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-slate-900/10 focus:border-slate-900 text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={handleRunAIReview}
                        disabled={loading || !feedbackInput}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-40 cursor-pointer"
                      >
                        <Sparkles className="h-4 w-4 text-teal-400 rotate-6" />
                        Acknowledge Gemini Appraisal (360 Output)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-slate-400">
              Select or review entries from the squad roster deck.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
