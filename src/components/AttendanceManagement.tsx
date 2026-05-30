import React, { useState } from "react";
import { Attendance, Employee } from "../types";
import { 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Coffee, 
  LogOut, 
  ShieldAlert, 
  Filter, 
  User, 
  Search 
} from "lucide-react";

interface AttendanceManagementProps {
  userRole: string;
  attendanceToday: Attendance | null;
  attendanceLogs: Attendance[];
  employees: Employee[];
  onCheckIn: () => void;
  onCheckOut: () => void;
  onToggleBreak: () => void;
}

export default function AttendanceManagement({
  userRole,
  attendanceToday,
  attendanceLogs,
  employees,
  onCheckIn,
  onCheckOut,
  onToggleBreak,
}: AttendanceManagementProps) {
  const [filterEmployeeId, setFilterEmployeeId] = useState("");
  
  const isAdminOrHR = userRole === "Super Admin" || userRole === "HR Recruiter" || userRole === "Senior Manager";

  // Filter attendance logs if admin/HR
  const displayedLogs = attendanceLogs.filter((log) => {
    if (!isAdminOrHR) {
      return log.employeeId === "EMP-005"; // hardcoded Alexander Mercer
    }
    if (filterEmployeeId) {
      return log.employeeId.toLowerCase().includes(filterEmployeeId.toLowerCase());
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present": return "bg-emerald-50 text-emerald-600 border border-emerald-200/50";
      case "Absent": return "bg-rose-50 text-rose-600 border border-rose-200/50";
      case "Late": return "bg-amber-50 text-amber-600 border border-amber-200/50";
      case "Half-Day": return "bg-sky-50 text-sky-600 border border-sky-200/50";
      default: return "bg-slate-50 text-slate-650";
    }
  };

  const getEmployeeName = (empId: string) => {
    const matched = employees.find((e) => e.employeeId === empId);
    return matched ? matched.fullName : empId;
  };

  return (
    <div className="font-sans space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-950">Punch Attendance & Shift Logs</h2>
        <p className="text-xs text-slate-500">Real-time timesheet checking, break session records, and institutional audit trails.</p>
      </div>

      {/* Clock Controls for Employee */}
      {!isAdminOrHR && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-slate-150 rounded-xl text-slate-700">
                <Clock className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Standard Daily Logging Terminal</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Arrival hour locks in status. Delay past 09:05 AM is recorded as Late.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!attendanceToday ? (
                <button
                  onClick={onCheckIn}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Verify Check-In
                </button>
              ) : (
                <>
                  <button
                    onClick={onToggleBreak}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer text-slate-700 border transition ${
                      attendanceToday.breakStartTime 
                        ? "bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-50" 
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/50"
                    }`}
                  >
                    {attendanceToday.breakStartTime ? "Acknowledge Stop Break" : "Acknowledge Lunch Break"}
                  </button>
                  <button
                    onClick={onCheckOut}
                    disabled={!!attendanceToday.breakStartTime}
                    className="px-4 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl transition disabled:opacity-45 cursor-pointer"
                  >
                    Verify Check-Out
                  </button>
                </>
              )}
            </div>
          </div>

          {attendanceToday && (
            <div className="mt-5 border-t border-slate-100 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Gate Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold mt-1 inline-block ${getStatusColor(attendanceToday.status)}`}>
                  {attendanceToday.status}
                </span>
              </div>
              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Sign In Timestamp</span>
                <p className="font-semibold font-mono text-slate-700 mt-1.5">
                  {new Date(attendanceToday!.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Disbursed Breaks</span>
                <p className="font-semibold font-mono text-slate-700 mt-1.5">
                  {attendanceToday.totalMinutesOnBreak || 0} minutes accrued
                </p>
              </div>
              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Worked Time</span>
                <p className="font-semibold font-mono text-slate-700 mt-1.5">
                  {attendanceToday.totalMinutesWorked ? `${Math.floor(attendanceToday.totalMinutesWorked / 60)}h ${attendanceToday.totalMinutesWorked % 60}m` : "Active shift"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Roster & Search Filters for Admin/HR */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Timesheet records Ledger</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Logs validated by client check-ins and server UTC time triggers.</p>
          </div>
          {isAdminOrHR && (
            <div className="relative rounded-xl max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                placeholder="Search Employee ID..."
                value={filterEmployeeId}
                onChange={(e) => setFilterEmployeeId(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600">
                <th className="p-3 font-semibold">Log ID</th>
                <th className="p-3 font-semibold">Staff Member</th>
                <th className="p-3 font-semibold">Shift Date</th>
                <th className="p-3 font-semibold">Punch In</th>
                <th className="p-3 font-semibold">Punch Out</th>
                <th className="p-3 font-semibold">Break duration</th>
                <th className="p-3 font-semibold">Net hour count</th>
                <th className="p-3 font-semibold">Sign status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {displayedLogs.map((log) => (
                <tr key={log.attendanceId} className="hover:bg-slate-50/50 transition">
                  <td className="p-3 font-mono text-[10px] text-slate-400">{log.attendanceId}</td>
                  <td className="p-3 font-semibold text-slate-800">{getEmployeeName(log.employeeId)}</td>
                  <td className="p-3 font-mono text-[10px]">{log.date}</td>
                  <td className="p-3 font-mono">
                    {new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3 font-mono">
                    {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active Shift"}
                  </td>
                  <td className="p-3 font-mono">{log.totalMinutesOnBreak || 0}m</td>
                  <td className="p-3 font-mono font-semibold">
                    {log.totalMinutesWorked ? `${Math.floor(log.totalMinutesWorked / 60)}h ${log.totalMinutesWorked % 60}m` : "Shift online"}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {displayedLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 italic">
                    No verified timesheets logs found meeting search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
