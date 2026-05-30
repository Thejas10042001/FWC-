import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import Dashboards from "./components/Dashboards";
import EmployeeManagement from "./components/EmployeeManagement";
import AttendanceManagement from "./components/AttendanceManagement";
import LeaveManagement from "./components/LeaveManagement";
import PayrollManagement from "./components/PayrollManagement";
import PerformanceManagement from "./components/PerformanceManagement";
import RecruitmentATS from "./components/RecruitmentATS";
import ResumeScreening from "./components/ResumeScreening";
import VoiceInterview from "./components/VoiceInterview";
import HRAssistant from "./components/HRAssistant";
import AIAnalyticsView from "./components/AIAnalyticsView";

import { UserProfile, Employee, Attendance, LeaveRequest, PayrollRecord, PerformanceRecord, JobVacancy, Candidate } from "./types";
import { Menu } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Core databases synced states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceToday, setAttendanceToday] = useState<Attendance | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [performance, setPerformance] = useState<PerformanceRecord[]>([]);
  const [jobs, setJobs] = useState<JobVacancy[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Fetch all databases once session login triggers
  useEffect(() => {
    if (user) {
      syncAppDatabase();
    }
  }, [user]);

  const syncAppDatabase = async () => {
    try {
      // 1. Employees list sync
      const empRes = await fetch("/api/employees/list");
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData);
      }

      // 2. Attendance active check-in sync
      const activeCheckRes = await fetch(`/api/attendance/today?employeeId=EMP-005`);
      if (activeCheckRes.ok) {
        const checkData = await activeCheckRes.json();
        setAttendanceToday(checkData.record || null);
      }

      // 3. Attendance historic logs sync
      const logsRes = await fetch("/api/attendance/logs");
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAttendanceLogs(logsData);
      }

      // 4. Leave request listings
      const leaveRes = await fetch("/api/leaves/list");
      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        setLeaves(leaveData);
      }

      // 5. Performance Reviews
      const reviewsRes = await fetch("/api/performance/list");
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setPerformance(reviewsData);
      }

      // 6. Recruitment Jobs listings
      const jobsRes = await fetch("/api/recruitment/jobs");
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }

      // 7. Candidates pipelines listings
      const candRes = await fetch("/api/recruitment/candidates");
      if (candRes.ok) {
        const candData = await candRes.json();
        setCandidates(candData);
      }

    } catch (err) {
      console.error("Database synchronizer error:", err);
    }
  };

  const handleCheckIn = async () => {
    try {
      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: "EMP-005" }), // Hardcoded Alexander Mercer
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAttendanceToday(data.record);
        setAttendanceLogs((prev) => [data.record, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckOut = async () => {
    if (!attendanceToday) return;
    try {
      const response = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId: attendanceToday.attendanceId }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAttendanceToday(null);
        setAttendanceLogs((prev) => prev.map((l) => (l.attendanceId === data.record.attendanceId ? data.record : l)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBreak = async () => {
    if (!attendanceToday) return;
    try {
      const response = await fetch("/api/attendance/break", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId: attendanceToday.attendanceId }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAttendanceToday(data.record);
        setAttendanceLogs((prev) => prev.map((l) => (l.attendanceId === data.record.attendanceId ? data.record : l)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    setUser(null);
    setCurrentTab("dashboard");
  };

  // Route sub-views depending on active tab selected
  const renderWorkspaceView = () => {
    switch (currentTab) {
      case "dashboard":
        return (
          <Dashboards
            user={user!}
            attendanceToday={attendanceToday}
            employees={employees}
            attendanceLogs={attendanceLogs}
            leaves={leaves}
            payroll={payroll}
            performance={performance}
            jobs={jobs}
            candidates={candidates}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onToggleBreak={handleToggleBreak}
            setCurrentTab={setCurrentTab}
          />
        );
      case "directory":
        return <EmployeeManagement userRole={user!.role} employees={employees} setEmployees={setEmployees} />;
      case "attendance":
        return (
          <AttendanceManagement
            userRole={user!.role}
            attendanceToday={attendanceToday}
            attendanceLogs={attendanceLogs}
            employees={employees}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onToggleBreak={handleToggleBreak}
          />
        );
      case "leaves":
        return <LeaveManagement userRole={user!.role} leaves={leaves} setLeaves={setLeaves} />;
      case "payroll":
        return <PayrollManagement userRole={user!.role} employees={employees} />;
      case "kpis":
        return <PerformanceManagement userRole={user!.role} performance={performance} setPerformance={setPerformance} />;
      case "ats":
        return <RecruitmentATS userRole={user!.role} jobs={jobs} candidates={candidates} setJobs={setJobs} setCandidates={setCandidates} />;
      case "screening":
        return <ResumeScreening candidates={candidates} setCandidates={setCandidates} />;
      case "voice_interview":
        return <VoiceInterview candidates={candidates} />;
      case "chatbot":
        return <HRAssistant />;
      case "analytics":
        return <AIAnalyticsView />;
      default:
        return <div className="text-sm p-4">Workspace module coming soon...</div>;
    }
  };

  // If not logged-in, show secure login page
  if (!user) {
    return <Auth onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar navigation */}
      <Sidebar
        user={user}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top-bar */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Aether Workspace</h1>
          </div>
          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full uppercase">
            {user.role}
          </span>
        </header>

        {/* Content body viewport */}
        <main className="flex-1 p-6 sm:p-8 lg:pl-72 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderWorkspaceView()}
          </div>
        </main>
      </div>
    </div>
  );
}
