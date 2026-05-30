import React, { useState } from "react";
import { JobVacancy, Candidate } from "../types";
import { 
  FileSearch, 
  PlusSquare, 
  Users, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  CheckCircle, 
  ChevronRight, 
  UserRoundCheck 
} from "lucide-react";

interface RecruitmentATSProps {
  userRole: string;
  jobs: JobVacancy[];
  candidates: Candidate[];
  setJobs: React.Dispatch<React.SetStateAction<JobVacancy[]>>;
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
}

export default function RecruitmentATS({
  userRole,
  jobs,
  candidates,
  setJobs,
  setCandidates,
}: RecruitmentATSProps) {
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [description, setDescription] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = userRole === "HR Recruiter" || userRole === "Super Admin";

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/recruitment/jobs/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, department, description, salaryRange }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setJobs((prev) => [...prev, data.job]);
        setIsAddingJob(false);
        setTitle("");
        setDescription("");
        setSalaryRange("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCandidateStage = async (candidateId: string, stage: any) => {
    try {
      const response = await fetch("/api/recruitment/candidates/update-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, stage }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCandidates((prev) => prev.map((c) => (c.candidateId === candidateId ? data.candidate : c)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Hired": return "bg-emerald-50 text-emerald-600 border border-emerald-200/50";
      case "Offered": return "bg-teal-50 text-teal-600 border border-teal-200/50";
      case "Rejected": return "bg-rose-50 text-rose-600 border border-rose-200/50";
      case "Interviewing": return "bg-indigo-50 text-indigo-600 border border-indigo-200/50 animate-pulse";
      default: return "bg-slate-50 text-slate-600 border border-slate-250/50";
    }
  };

  return (
    <div className="font-sans space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Enterprise ATS (Recruitment Hub)</h2>
          <p className="text-xs text-slate-500">Coordinate active vacancies, trace candidates, and advance hiring stages.</p>
        </div>
        {canEdit && !isAddingJob && (
          <button
            onClick={() => setIsAddingJob(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition shadow"
          >
            <PlusSquare className="h-4 w-4" />
            Publish Vacancy
          </button>
        )}
      </div>

      {isAddingJob ? (
        <form onSubmit={handleCreateJob} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-850 text-sm">Post New Vacancy Requisition</h3>
            <button type="button" onClick={() => setIsAddingJob(false)} className="text-xs text-slate-400 hover:text-slate-600">Close Form</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-650 mb-1.5 uppercase">Job Requisition Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Senior Machine Learning Engineer"
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-650 mb-1.5 uppercase">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs text-slate-800"
              >
                <option>Engineering</option>
                <option>Human Resources</option>
                <option>Board of Management</option>
                <option>Customer Support</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-650 mb-1.5 uppercase">Estimated Salary Scales</label>
              <input
                type="text"
                required
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="E.g. $12,000 - $16,000 USD / Monthly"
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-650 mb-1.5 uppercase">Job Duties & SLA Requirements</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide clean goals, technology boundaries (React, Python, GCP), and experience constraints..."
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddingJob(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition disabled:opacity-45"
            >
              {isSubmitting ? "Uploading Requisition..." : "Acknowledge Publication"}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vacancy cards list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Vacancies ({jobs.length})</span>
            </div>
            {jobs.map((job) => (
              <div key={job.jobId} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-850 text-xs leading-snug">{job.title}</h4>
                    <span className="text-[9px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded mt-1.5 inline-block">{job.department}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">{job.jobId}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{job.description}</p>
                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 shrink-0" />
                    <span>{job.salaryRange}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Applicants track table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Candidate Funnel tracker</span>
              <p className="text-[9px] text-slate-400 mt-0.5">Evaluate applicants, update pipelines, and trigger AI screener scores.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-600">
                    <th className="p-3 font-semibold">Applicant</th>
                    <th className="p-3 font-semibold">Target Openings</th>
                    <th className="p-3 font-semibold">AI Fit</th>
                    <th className="p-3 font-semibold">Pip Stage</th>
                    {canEdit && <th className="p-3 font-semibold text-right">Progress Stage</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {candidates.map((cand) => (
                    <tr key={cand.candidateId} className="hover:bg-slate-50/50 transition">
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{cand.fullName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{cand.email}</div>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{cand.jobTitle}</td>
                      <td className="p-3">
                        {cand.aiMatchScore ? (
                          <span className="font-mono font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            {cand.aiMatchScore}% Score
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Unscreened</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStageColor(cand.stage)}`}>
                          {cand.stage}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="p-3 text-right">
                          <select
                            value={cand.stage}
                            onChange={(e) => handleUpdateCandidateStage(cand.candidateId, e.target.value)}
                            className="text-[10px] font-bold py-1 px-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
                          >
                            <option value="Applied">Applied</option>
                            <option value="Screened">Screened</option>
                            <option value="Interviewing">Interviewing</option>
                            <option value="Offered">Offered</option>
                            <option value="Hired">Hired</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
