import React, { useMemo } from "react";
import { UserProfile, Employee, Attendance, LeaveRequest, PayrollRecord, PerformanceRecord, JobVacancy, Candidate } from "../types";
import { 
  Building2, 
  Users, 
  Wallet, 
  CalendarRange, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ArrowUpRight, 
  Sparkles, 
  Activity, 
  TrendingUp, 
  CheckSquare, 
  UserCheck 
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface DashboardsProps {
  user: UserProfile;
  attendanceToday: Attendance | null;
  employees: Employee[];
  attendanceLogs: Attendance[];
  leaves: LeaveRequest[];
  payroll: PayrollRecord[];
  performance: PerformanceRecord[];
  jobs: JobVacancy[];
  candidates: Candidate[];
  onCheckIn: () => void;
  onCheckOut: () => void;
  onToggleBreak: () => void;
  setCurrentTab: (tab: string) => void;
}

export default function Dashboards({
  user,
  attendanceToday,
  employees,
  attendanceLogs,
  leaves,
  payroll,
  performance,
  jobs,
  candidates,
  onCheckIn,
  onCheckOut,
  onToggleBreak,
  setCurrentTab,
}: DashboardsProps) {

  // Computed global statistics
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.employmentStatus === "Active" || e.employmentStatus === "On Leave").length;
    
    // Total monthly payroll burden
    const payrollCost = employees.reduce((acc, curr) => acc + curr.salary, 0);
    const pendingLeaves = leaves.filter(l => l.status === "Pending").length;
    const openJobs = jobs.filter(j => j.status === "Open").length;
    const totalCandidates = candidates.length;
    
    // Selection rate
    const hiredCount = candidates.filter(c => c.stage === "Hired").length;
    const appliedCount = candidates.length || 1;
    const selectionRate = Math.round((hiredCount / appliedCount) * 100);

    return {
      totalEmployees,
      activeEmployees,
      payrollCost,
      pendingLeaves,
      openJobs,
      totalCandidates,
      selectionRate
    };
  }, [employees, leaves, jobs, candidates]);

  // Chart data formatting
  const chartData = useMemo(() => {
    // Generate department allocations
    const deptMap: Record<string, number> = {};
    employees.forEach(emp => {
      deptMap[emp.department] = (deptMap[emp.department] || 0) + 1;
    });
    return Object.entries(deptMap).map(([name, count]) => ({ name, Employees: count }));
  }, [employees]);

  const financialChartData = useMemo(() => {
    return [
      { month: "Jan", cost: stats.payrollCost * 0.9 },
      { month: "Feb", cost: stats.payrollCost * 0.95 },
      { month: "Mar", cost: stats.payrollCost * 0.98 },
      { month: "Apr", cost: stats.payrollCost },
      { month: "May", cost: stats.payrollCost },
    ];
  }, [stats.payrollCost]);

  // Render check-in card logic
  const renderCheckInClocks = () => {
    const isCheckedIn = !!attendanceToday;
    const isOnBreak = !!attendanceToday?.breakStartTime;
    const formattedBreakTime = attendanceToday?.totalMinutesOnBreak || 0;

    return (
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Clock className="h-44 w-44" />
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Timesheet Terminal</span>
            </div>
            <h3 className="text-2xl font-bold font-sans">
              Alexander Mercer
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Check-In status: {isCheckedIn ? (isOnBreak ? "On Lunch Break" : "Aetive Shift") : "Awaiting Sign-In"}
            </p>
            {isCheckedIn && (
              <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-slate-300">
                <div>Arrival: {new Date(attendanceToday!.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                {formattedBreakTime > 0 && <div>Total Breaks: {formattedBreakTime}m</div>}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 justify-end">
            {!isCheckedIn ? (
              <button
                onClick={onCheckIn}
                className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95 transition"
              >
                Punch Check-In (09:00)
              </button>
            ) : (
              <>
                <button
                  onClick={onToggleBreak}
                  className={`px-5 py-3 rounded-xl font-bold text-xs cursor-pointer active:scale-95 transition ${
                    isOnBreak 
                      ? "bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md shadow-amber-400/15" 
                      : "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {isOnBreak ? "Resume Working" : "Punch Break (Lunch)"}
                </button>
                <button
                  onClick={onCheckOut}
                  disabled={isOnBreak}
                  className="px-5 py-3 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-400 cursor-pointer active:scale-95 transition disabled:opacity-40"
                >
                  Punch Check-Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 1. Employee Dashboard
  const EmployeeDashboard = () => (
    <div>
      {renderCheckInClocks()}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Leave Balance</span>
            <p className="text-xl font-bold mt-0.5 text-slate-900">27 Days Free</p>
            <span className="text-[10px] text-slate-400">Casual: 12 | Sick: 12 | Vacation: 3</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Last Disbursed</span>
            <p className="text-xl font-bold mt-0.5 text-slate-900">$7,973 Net</p>
            <span className="text-[10px] text-emerald-500 font-semibold cursor-pointer" onClick={() => setCurrentTab("payroll")}>View Payslip →</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Performance Appraisals</span>
            <p className="text-xl font-bold mt-0.5 text-slate-900">4.5 / 5 Rated</p>
            <span className="text-[10px] text-slate-400">Quarter 2026-Q1 cycle</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance KPI summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            Active Goals & AI Recommendations
          </h4>
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-xs leading-relaxed text-slate-600 mb-4 whitespace-pre-line">
            {performance[0]?.kpis || "Loading goals cycle..."}
          </div>
          <div className="p-4 rounded-xl bg-purple-500/[0.04] border border-purple-500/10 text-xs">
            <span className="font-bold text-purple-900 mb-1 block">AI Career Steering Summary:</span>
            <p className="text-purple-700 leading-relaxed italic">{performance[0]?.aiSummary || "Submit reviews to get AI growth predictions."}</p>
          </div>
        </div>

        {/* Corporate Policies grounding card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-500" />
              Corporate Announcements
            </h4>
            <ul className="space-y-4 text-xs">
              <li className="flex gap-3">
                <span className="h-5 w-5 rounded bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">!!!</span>
                <div>
                  <p className="font-semibold text-slate-800">Leaves Year-End Clearance Policy</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">Please file remaining Maternity or Earned leaves prior to mid-December cycles.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="h-5 w-5 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">i</span>
                <div>
                  <p className="font-semibold text-slate-800">Advanced AI Chatbox Enabled</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">Chat seamlessly with Aether HelpDesk below to check vacation credits in real-time!</p>
                </div>
              </li>
            </ul>
          </div>
          <button 
            onClick={() => setCurrentTab("chatbot")}
            className="w-full mt-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition shadow"
          >
            Launch Floating HR HelpDesk
          </button>
        </div>
      </div>
    </div>
  );

  // 2. HR Recruiter Dashboard
  const HRDashboard = () => (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Vacancies</span>
          <p className="text-2xl font-bold mt-1 text-slate-900">{stats.openJobs}</p>
          <span className="text-emerald-500 text-[10px] font-semibold mt-1 inline-block">Published & Recruiting</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Candidates</span>
          <p className="text-2xl font-bold mt-1 text-slate-900">{stats.totalCandidates}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">In HRATS screening loops</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Selection Rate</span>
          <p className="text-2xl font-bold mt-1 text-slate-900">{stats.selectionRate}%</p>
          <span className="text-violet-500 text-[10px] font-semibold mt-1 inline-block">Aether AI Optimization</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Actionable Leaves</span>
          <p className="text-2xl font-bold mt-1 text-slate-900">{stats.pendingLeaves}</p>
          <span className="text-[10px] text-amber-500 font-semibold mt-1 inline-block cursor-pointer" onClick={() => setCurrentTab("leaves")}>Pending approvals →</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Staff Distribution by Segment</span>
            <Activity className="h-4 w-4 text-emerald-500" />
          </h4>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="Employees" fill="#0f172a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Recent Applicant Funnel</span>
            <button className="text-[10px] text-teal-500 font-semibold" onClick={() => setCurrentTab("screening")}>Analyze resumes →</button>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="py-2.5 font-medium">Candidate</th>
                  <th className="py-2.5 font-medium">Desired Position</th>
                  <th className="py-2.5 font-medium">Funnel Stage</th>
                  <th className="py-2.5 font-medium">Screener Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {candidates.map((cand) => (
                  <tr key={cand.candidateId} className="hover:bg-slate-50/55 transition">
                    <td className="py-3 font-semibold text-slate-800">{cand.fullName}</td>
                    <td className="py-3 text-slate-500">{cand.jobTitle}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cand.stage === "Hired" ? "bg-emerald-50 text-emerald-600" :
                        cand.stage === "Rejected" ? "bg-rose-50 text-rose-500" :
                        "bg-indigo-50 text-indigo-600"
                      }`}>
                        {cand.stage}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-700">
                      {cand.aiMatchScore ? `${cand.aiMatchScore}%` : "Awaiting Screening"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // 3. Senior Manager Dashboard
  const ManagerDashboard = () => (
    <div>
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-teal-400 uppercase">Organizational squad panel</span>
          <h3 className="text-2xl font-bold mt-1">Sarah Sterling</h3>
          <p className="text-xs text-slate-400 mt-1">Supervising: Engineering Department, Squad A</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setCurrentTab("kpis")} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 cursor-pointer">
            Define Group KPIs
          </button>
          <button onClick={() => setCurrentTab("leaves")} className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-100 cursor-pointer">
            Manage Vacations
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Group size</span>
            <p className="text-xl font-bold mt-0.5 text-slate-900">5 Members</p>
            <span className="text-[10px] text-slate-400">All positions active & active</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Present Today</span>
            <p className="text-xl font-bold mt-0.5 text-slate-900">100% Present</p>
            <span className="text-[10px] text-slate-400">Checked-In prior to 9:05 AM</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pending Leaves</span>
            <p className="text-xl font-bold mt-0.5 text-slate-900">{leaves.filter(l => l.status === "Pending").length} Requests</p>
            <span className="text-[10px] text-rose-500 font-semibold cursor-pointer" onClick={() => setCurrentTab("leaves")}>Approve now →</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Pending Team Leaves approvals Workflow
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="py-2.5 font-medium">Employee</th>
                <th className="py-2.5 font-medium">Leave Type</th>
                <th className="py-2.5 font-medium">Dates Requested</th>
                <th className="py-2.5 font-medium">Reason Statement</th>
                <th className="py-2.5 font-medium">Workflow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leaves.map((l) => (
                <tr key={l.leaveId} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 font-semibold text-slate-800">{l.employeeName}</td>
                  <td className="py-3 text-slate-500">{l.leaveType}</td>
                  <td className="py-3 font-mono text-slate-600">{l.startDate} to {l.endDate}</td>
                  <td className="py-3 text-slate-500 italic">"{l.reason}"</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-bold">
                      Pending Manager Check
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // 4. Management Admin Dashboard
  const ManagementDashboard = () => (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Enterprise Efficiency Index</span>
            <p className="text-xl font-bold mt-0.5 text-slate-900">92 / 100</p>
            <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full inline-block font-semibold mt-1">Excellent Segment</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Gross Payroll Burden</span>
            <p className="text-xl font-bold mt-0.5 text-slate-900">${stats.payrollCost}/mo</p>
            <span className="text-[10px] text-slate-400">Salary limits matching capital layouts</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Attrition rate forecast</span>
            <p className="text-xl font-bold mt-0.5 text-slate-900">VERY LOW</p>
            <span className="text-teal-400 text-[10px] font-semibold flex items-center gap-1 mt-1 justify-start">
              <Sparkles className="h-3 w-3" /> Projecting 2% next Q
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Corporate Capital Outlays (Past Quarter)</span>
            <Wallet className="h-4 w-4 text-slate-400" />
          </h4>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="cost" stroke="#0f172a" fill="#334155" fillOpacity={0.06} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              AI Strategic Board Overview
            </h4>
            <div className="p-4 rounded-xl bg-violet-500/[0.04] border border-violet-500/10 text-xs italic text-violet-700 leading-relaxed mb-4">
              "We forecast maximum recruiting growth in segment 'Engineering AI'. Current attrition predictions show no key staff are at immediate risk due to solid compensations and positive employee feedback loops."
            </div>
            <ul className="space-y-3 text-xs leading-relaxed text-slate-600">
              <li>1. Engineering payroll occupies 52% of total outlays.</li>
              <li>2. Administrative costs remains flat within 5% limits.</li>
            </ul>
          </div>
          <button onClick={() => setCurrentTab("analytics")} className="w-full mt-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition shadow">
            Deploy Deeper AI Forecast Models
          </button>
        </div>
      </div>
    </div>
  );

  // 5. Super Admin Dashboard (Everything)
  const SuperAdminDashboard = () => {
    // Collect last logs to display
    const logItems = [
      { action: "Document Verified", detail: "Alexander Mercer's Aadhaar PDF validated successfully.", user: "Aethel AI" },
      { action: "Salary Processed", detail: "$7,973 Net compiled for EMP-005.", user: "Wage Desk" },
      { action: "Check-In Approved", detail: "Arrival time 09:05 logged for Alexander.", user: "Timesheet" }
    ];

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Institutional Headcount</span>
            <p className="text-2xl font-bold mt-1 text-slate-900">{stats.totalEmployees}</p>
            <span className="text-teal-500 text-[10px] font-semibold mt-1 inline-block">Active workforce index</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Combined salary Cost</span>
            <p className="text-2xl font-bold mt-1 text-slate-900">${stats.payrollCost}</p>
            <span className="text-[10px] text-slate-400 mt-1 block">Monthly budget outlay</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Open vacancies</span>
            <p className="text-2xl font-bold mt-1 text-slate-900">{stats.openJobs}</p>
            <span className="text-emerald-500 text-[10px] font-semibold mt-1 inline-block">Published & open</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Aether AI Usage</span>
            <p className="text-2xl font-bold mt-1 text-slate-900">4,912 requests</p>
            <span className="text-teal-500 text-[10px] font-semibold mt-1 inline-block">100% gateway uptime</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Department Allocations</span>
              <Activity className="h-4 w-4 text-slate-400" />
            </h4>
            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="Employees" fill="#0f172a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Real-Time Security Audit logs
            </h4>
            <ul className="space-y-4 text-xs select-none">
              {logItems.map((item, i) => (
                <li key={i} className="flex gap-3 leading-tight">
                  <span className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-mono text-[9px] mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-800 text-[11px] block">{item.action}</span>
                    <p className="text-slate-500 mt-0.5">{item.detail}</p>
                    <span className="text-[9px] text-slate-400 block mt-1">Executor: {item.user}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Resolve active dashboard view
  const renderDashboardByRole = () => {
    switch (user.role) {
      case "Employee":
        return <EmployeeDashboard />;
      case "HR Recruiter":
        return <HRDashboard />;
      case "Senior Manager":
        return <ManagerDashboard />;
      case "Management Admin":
        return <ManagementDashboard />;
      case "Super Admin":
        return <SuperAdminDashboard />;
      default:
        return <EmployeeDashboard />;
    }
  };

  return (
    <div className="space-y-8 font-sans animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Greetings, {user.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise Hub • {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Aether Security Shield Active</span>
        </div>
      </div>

      {renderDashboardByRole()}
    </div>
  );
}
