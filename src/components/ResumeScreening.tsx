import React, { useState } from "react";
import { Candidate } from "../types";
import { 
  Sparkles, 
  Upload, 
  Cpu, 
  CheckCircle, 
  XOctagon, 
  ArrowUpRight 
} from "lucide-react";

interface ResumeScreeningProps {
  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
}

export default function ResumeScreening({ candidates, setCandidates }: ResumeScreeningProps) {
  const [selectedCandidateId, setSelectedCandidateId] = useState(candidates[0]?.candidateId || "");
  const [customResumeText, setCustomResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState("");
  
  // Results output container
  const [screenResult, setScreenResult] = useState<{
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
    analysisRaw: string;
  } | null>(null);

  const selectedCandidate = candidates.find(c => c.candidateId === selectedCandidateId);

  const handleScreenResume = async () => {
    if (!selectedCandidateId) return;
    setLoading(true);
    setScreenResult(null);
    setNotifying("Transmitting credentials to Gemini AI parser gateway...");

    try {
      const response = await fetch("/api/recruitment/screen-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: selectedCandidateId,
          customResumeText: customResumeText || undefined
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setScreenResult({
          score: data.matchScore,
          strengths: data.analysis.strengths || ["Technical expertise aligned", "Solid team credentials"],
          weaknesses: data.analysis.weaknesses || ["Could improve enterprise scale familiarity"],
          recommendation: data.analysis.recommendation || "Highly suitable for technical vetting.",
          analysisRaw: data.analysisRaw
        });

        // Update active candidates list score index
        setCandidates(prev => prev.map(c => c.candidateId === selectedCandidateId ? { ...c, aiMatchScore: data.matchScore } : c));
        setNotifying("AI Screen completed successfully!");
      } else {
        setNotifying("Screening gateway failed. Review API configuration.");
      }
    } catch (err) {
      setNotifying("Aether AI gateway offline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-950">AI Resume Screening Gateway</h2>
        <p className="text-xs text-slate-500">Dual-matching analysis comparing applicant resumes with target requisitions using Gemini.</p>
      </div>

      {notifying && (
        <div className="bg-slate-900 border border-slate-800 text-teal-400 text-xs font-mono p-3 rounded-xl flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-spin text-teal-400" />
          <span>{notifying}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Setup card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <Cpu className="h-6 w-6 text-slate-900 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Engine status</span>
              <p className="text-xs text-slate-800 font-semibold leading-relaxed">Gemini 3.5 Active</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Select Applicant Profile</label>
            <select
              value={selectedCandidateId}
              onChange={(e) => {
                setSelectedCandidateId(e.target.value);
                setScreenResult(null);
              }}
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
            >
              <option value="">-- Choose applicant --</option>
              {candidates.map(c => (
                <option key={c.candidateId} value={c.candidateId}>{c.fullName} ({c.jobTitle})</option>
              ))}
            </select>
          </div>

          {selectedCandidate && (
            <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl text-xs space-y-1.5 leading-relaxed text-slate-600">
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Target Requisition Metadata</span>
              <p><strong>Position:</strong> {selectedCandidate.jobTitle}</p>
              <p><strong>Email Address:</strong> {selectedCandidate.email}</p>
              <p><strong>Current Stage:</strong> {selectedCandidate.stage}</p>
            </div>
          )}

          {/* Resume Upload / Override Draft box */}
          <div>
            <label className="block text-xs font-semibold text-slate-625 mb-1.5 uppercase">Resume Text Override (Override PDF)</label>
            <textarea
              rows={4}
              value={customResumeText}
              onChange={(e) => setCustomResumeText(e.target.value)}
              placeholder="Paste Candidate background or Resume achievements here for instant custom comparison..."
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-slate-900/10 focus:border-slate-900 text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={handleScreenResume}
            disabled={loading || !selectedCandidateId}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-45 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-teal-400 animate-pulse" />
            Analyze resume with Gemini AI
          </button>
        </div>

        {/* Results output Card */}
        <div className="lg:col-span-2">
          {screenResult ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Dynamic Resume Matching Analysis</h3>
                  <p className="text-xs text-slate-400 mt-1">Applicant Reference: {selectedCandidate?.fullName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-450 uppercase font-bold">Fit Score:</span>
                  <span className="font-mono text-xl font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">
                    {screenResult.score}% Accord
                  </span>
                </div>
              </div>

              {/* Strengths & Weaknesses checklists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Analyzed Suitability Strengths
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-650">
                    {screenResult.strengths.map((str, idx) => (
                      <li key={idx} className="flex gap-2.5 leading-relaxed bg-emerald-500/[0.02] border border-emerald-500/5 p-2 rounded-xl">
                        <span className="text-emerald-500">✓</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <XOctagon className="h-4 w-4 text-slate-400" /> Improvement Areas & Gaps
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-650">
                    {screenResult.weaknesses.map((weak, idx) => (
                      <li key={idx} className="flex gap-2.5 leading-relaxed bg-slate-50 border border-slate-100 p-2 rounded-xl">
                        <span className="text-slate-400">!</span>
                        <span>{weak}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Conclusion recommend card */}
              <div className="p-4 bg-indigo-50 border border-indigo-150 rounded-xl space-y-1.5 text-xs">
                <span className="font-bold text-indigo-900 uppercase text-[9px] tracking-wide block">Next Steps Recommendation:</span>
                <p className="text-indigo-850 font-medium italic">"{screenResult.recommendation}"</p>
              </div>

              {/* Raw detailed analysis block */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Complete Gemini Raw Output</h4>
                <div className="p-4 bg-slate-50 rounded-xl text-xs font-mono leading-relaxed text-slate-600 max-h-56 overflow-y-auto whitespace-pre-line">
                  {screenResult.analysisRaw}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-100 h-full text-slate-400 text-center flex flex-col items-center justify-center gap-4">
              <Cpu className="h-12 w-12 text-slate-350 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-700">Waiting for Screening Execution</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm">Choose an applicant, verify core descriptions, and execute Gemini to see analytics matching reports here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
