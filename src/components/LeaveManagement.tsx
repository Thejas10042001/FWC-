import React, { useState } from "react";
import { LeaveRequest } from "../types";
import { 
  CalendarRange, 
  PlusSquare, 
  CheckCircle2, 
  XOctagon, 
  Hourglass, 
  ShieldCheck, 
  UserCheck 
} from "lucide-react";

interface LeaveManagementProps {
  userRole: string;
  leaves: LeaveRequest[];
  setLeaves: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
}

export default function LeaveManagement({ userRole, leaves, setLeaves }: LeaveManagementProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [leaveType, setLeaveType] = useState<any>("Casual Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmployee = userRole === "Employee";
  const isApprover = userRole === "Senior Manager" || userRole === "HR Recruiter" || userRole === "Super Admin";

  const displayedLeaves = isEmployee
    ? leaves.filter((l) => l.employeeId === "EMP-005") // Only show for Alexander Mercer
    : leaves;

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leaves/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: "EMP-005",
          leaveType,
          startDate,
          endDate,
          reason,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setLeaves((prev) => [...prev, data.leave]);
        setIsApplying(false);
        setStartDate("");
        setEndDate("");
        setReason("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (leaveId: string, decision: "Approved" | "Rejected") => {
    try {
      const response = await fetch("/api/leaves/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveId,
          approverRole: userRole,
          decision,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setLeaves((prev) => prev.map((l) => (l.leaveId === leaveId ? data.leave : l)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved": return "bg-emerald-50 text-emerald-600 font-bold border border-emerald-200/55";
      case "Rejected": return "bg-rose-50 text-rose-600 font-bold border border-rose-200/55";
      case "Pending": return "bg-amber-50 text-amber-600 font-bold border border-amber-200/55 animate-pulse";
      default: return "bg-slate-50 text-slate-550";
    }
  };

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Corporate Leave Logistics</h2>
          <p className="text-xs text-slate-500">Corporate leaves balance tracking and dual-stage structural approval workflow.</p>
        </div>
        {isEmployee && !isApplying && (
          <button
            onClick={() => setIsApplying(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition"
          >
            <PlusSquare className="h-4 w-4" />
            Apply Leave Allowance
          </button>
        )}
      </div>

      {isEmployee && !isApplying && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Casual Leave</span>
            <p className="text-lg font-bold text-slate-800 mt-1">12 Days Rem.</p>
            <span className="text-[9px] text-slate-400">Regular credits</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Sick Leave</span>
            <p className="text-lg font-bold text-slate-800 mt-1">12 Days Rem.</p>
            <span className="text-[9px] text-slate-400">Requires medical file</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Earned Leave</span>
            <p className="text-lg font-bold text-slate-800 mt-1">15 Days Rem.</p>
            <span className="text-[9px] text-slate-400">Accrued yearly quota</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Maternity Leave</span>
            <p className="text-lg font-bold text-slate-800 mt-1">84 Days Rem.</p>
            <span className="text-[9px] text-slate-400">Statutory allocation</span>
          </div>
        </div>
      )}

      {isApplying ? (
        <form onSubmit={handleApplyLeave} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 text-sm">Submit New Leave Application</h3>
            <button type="button" onClick={() => setIsApplying(false)} className="text-xs text-slate-400 hover:text-slate-600">Close Form</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Leave Segment Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs"
              >
                <option>Casual Leave</option>
                <option>Sick Leave</option>
                <option>Earned Leave</option>
                <option>Maternity Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Schedule Starts</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Schedule Concludes</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Written Statement or Reason</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State clear reasons or medical advice context..."
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsApplying(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition disabled:opacity-40"
            >
              {isSubmitting ? "Filing Request..." : "File Leave Request"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Vacations & Absences historic log</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Approval sequence: Employee → Sr. Manager (Stage 1) → HR Recruiter (Conclusion Stage).</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600">
                  <th className="p-3 font-semibold">Leave ID</th>
                  <th className="p-3 font-semibold">Staff Member</th>
                  <th className="p-3 font-semibold">Type of leave</th>
                  <th className="p-3 font-semibold">Dates schedule</th>
                  <th className="p-3 font-semibold">Stated justification</th>
                  <th className="p-3 font-semibold">Mgr Approval</th>
                  <th className="p-3 font-semibold">HR Approval</th>
                  <th className="p-3 font-semibold">Consolidated Status</th>
                  {isApprover && <th className="p-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {displayedLeaves.map((l) => {
                  const showManagerActions = userRole === "Senior Manager" && l.managerApproval === "Pending";
                  const showHRActions = (userRole === "HR Recruiter" || userRole === "Super Admin") && l.hrApproval === "Pending";
                  const showAnyActions = showManagerActions || showHRActions;

                  return (
                    <tr key={l.leaveId} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-mono text-[10px] text-slate-400">{l.leaveId}</td>
                      <td className="p-3 font-semibold text-slate-800">{l.employeeName}</td>
                      <td className="p-3 font-medium text-slate-600">{l.leaveType}</td>
                      <td className="p-3 font-mono text-[10px]">{l.startDate} to {l.endDate}</td>
                      <td className="p-3 text-slate-500 italic max-w-xs truncate">"{l.reason}"</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          l.managerApproval === "Approved" ? "bg-emerald-50 text-emerald-600" :
                          l.managerApproval === "Rejected" ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"
                        }`}>
                          {l.managerApproval}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          l.hrApproval === "Approved" ? "bg-emerald-50 text-emerald-600" :
                          l.hrApproval === "Rejected" ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"
                        }`}>
                          {l.hrApproval}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(l.status)}`}>
                          {l.status}
                        </span>
                      </td>
                      {isApprover && (
                        <td className="p-3 text-right">
                          {showAnyActions ? (
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => handleApprove(l.leaveId, "Approved")}
                                className="px-2 py-1 bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 rounded-lg text-[9px] cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApprove(l.leaveId, "Rejected")}
                                className="px-2 py-1 bg-rose-500 text-white font-bold hover:bg-rose-450 rounded-lg text-[9px] cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No Action Required</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
