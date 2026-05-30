import React, { useState, useEffect } from "react";
import { PayrollRecord, Employee } from "../types";
import { 
  Wallet, 
  Sparkles, 
  CheckCircle, 
  Download, 
  HelpCircle, 
  CircleAlert, 
  FileCheck 
} from "lucide-react";

interface PayrollManagementProps {
  userRole: string;
  employees: Employee[];
}

export default function PayrollManagement({ userRole, employees }: PayrollManagementProps) {
  const [payrollLogs, setPayrollLogs] = useState<PayrollRecord[]>([]);
  const [activeMonth, setActiveMonth] = useState("2026-05");
  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState("");

  const isAdminOrHR = userRole === "Super Admin" || userRole === "HR Recruiter" || userRole === "Management Admin";

  useEffect(() => {
    fetchPayrollCycles();
  }, [activeMonth]);

  const fetchPayrollCycles = async () => {
    try {
      const response = await fetch("/api/payroll/cycles");
      const data = await response.json();
      if (response.ok) {
        setPayrollLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGeneratePayroll = async () => {
    setLoading(true);
    setNotifying("Analyzing rosters & compiling statutory PF, ESI, TDS brackets...");
    try {
      const response = await fetch("/api/payroll/generate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: activeMonth })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPayrollLogs(data.list);
        setNotifying(data.alreadyExists ? "Current cycle drafts already compiled." : "Drafts successfully compiled!");
      }
    } catch (err) {
      setNotifying("Failed to connect to wage processor.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisbursePayroll = async () => {
    setLoading(true);
    setNotifying("Initiating bank transfers & clearing corporate ledger...");
    try {
      const response = await fetch("/api/payroll/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: activeMonth })
      });
      if (response.ok) {
        setNotifying("Funds transferred successfully!");
        fetchPayrollCycles();
      }
    } catch (err) {
      setNotifying("Ledger clear failure.");
    } finally {
      setLoading(false);
    }
  };

  // Generate and download highly stylized payslip HTML certificate
  const handleDownloadPayslip = (p: PayrollRecord) => {
    const employeeDetail = employees.find(e => e.employeeId === p.employeeId);
    
    const htmlContent = `
      <!doctype html>
      <html>
      <head>
        <title>Payslip Statement - ${p.month}</title>
        <style>
          body { font-family: 'Inter', Helvetica, sans-serif; background: #f8fafc; color: #1e293b; padding: 40px; }
          .container { max-width: 800px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
          .header { display: flex; justify-content: space-between; border-b: 2px solid #f1f5f9; padding-bottom: 20px; }
          .brand { font-weight: 800; font-size: 20px; letter-spacing: 1px; color: #0f172a; }
          .meta { text-align: right; font-size: 11px; color: #64748b; line-height: 1.5; }
          .title { font-size: 16px; font-weight: 700; margin: 30px 0 10px; color: #0f172a; }
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-top: 20px; }
          .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          td { padding: 8px 0; }
          td.right { text-align: right; font-family: monospace; font-weight: 600; }
          .total-row { border-t: 2px solid #f1f5f9; font-weight: 700; color: #0f172a; }
          .net-pay { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-top: 30px; display: flex; justify-content: space-between; align-items: center; }
          .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="brand">AETHER ENTERPRISE</div>
              <p style="font-size: 11px; color: #64748b; margin-top: 4px;">Human Capital Management Department</p>
            </div>
            <div class="meta">
              <strong>PAYSLIP ID Statement</strong>: ${p.payrollId}<br/>
              <strong>Statement Cycle Period</strong>: ${p.month}<br/>
              <strong>Disbursed At</strong>: ${new Date().toISOString().split("T")[0]}
            </div>
          </div>
          
          <div class="title">Earnings Summary Receipt</div>
          
          <div style="font-size:12px; line-height:1.6; border-bottom: 1px solid #f1f5f9; padding-bottom:15px; margin-bottom:20px;">
            <strong>Employee Name</strong>: ${p.employeeName}<br/>
            <strong>Staff Reference ID</strong>: ${p.employeeId}<br/>
            <strong>Designation</strong>: ${employeeDetail?.designation || "Staff Professional"}<br/>
            <strong>Department Branch</strong>: ${p.department}
          </div>
          
          <div class="grid">
            <div>
              <div class="section-title">Institutional Earnings</div>
              <table>
                <tr><td>Base Salary (Fixed Gross)</td><td class="right">$${p.baseSalary.toLocaleString()}</td></tr>
                <tr><td>HRA & Custom Medical Allowances</td><td class="right">$${p.allowances.toLocaleString()}</td></tr>
                <tr class="total-row" style="border-top:1px solid #f1f5f9;"><td>Gross Remuneration</td><td class="right">$${(p.baseSalary + p.allowances).toLocaleString()}</td></tr>
              </table>
            </div>
            <div>
              <div class="section-title">Statutory Deductions</div>
              <table>
                <tr><td>Provident Fund (Corporate CPF 12%)</td><td class="right">$${p.pfDeduction.toLocaleString()}</td></tr>
                <tr><td>Employee State Insurance (ESI 0.75%)</td><td class="right">$${p.esiDeduction.toLocaleString()}</td></tr>
                <tr><td>Professional TDS Income Tax withheld</td><td class="right">$${p.taxDeduction.toLocaleString()}</td></tr>
                <tr class="total-row" style="border-top:1px solid #f1f5f9;"><td>Aggregate Deductions</td><td class="right">$${(p.pfDeduction + p.esiDeduction + p.taxDeduction).toLocaleString()}</td></tr>
              </table>
            </div>
          </div>
          
          <div class="net-pay">
            <div>
              <strong style="font-size:13px; color:#0f172a;">NET CURRENT HOME PAY</strong>
              <p style="font-size:10px; color:#64748b; margin-top:3px;">Direct Bank Transfer initiated to registered accounts.</p>
            </div>
            <div style="font-size: 24px; font-weight: 800; color: #10b981; font-family: monospace;">$${p.netSalary.toLocaleString()}</div>
          </div>
          
          <div class="footer">
            Aether HRMS Automated Wage Dispensation. Certified Safe Secure Transfer Ledger.
          </div>
        </div>
      </body>
      </html>
    `;

    // Trigger local download link securely
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Payslip_${p.employeeName.replace(/\s+/g, "_")}_${p.month}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Resolve employee specific wage cycles (i.e. only Alexander Mercer if Employee)
  const activeRecordList = isAdminOrHR 
    ? payrollLogs.filter(p => p.month === activeMonth)
    : payrollLogs.filter(p => p.employeeId === "EMP-005");

  return (
    <div className="font-sans space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Statutory Payroll Control</h2>
          <p className="text-xs text-slate-500">Processing structures, statutory provident tax computation, and digital pay-receipt file generation.</p>
        </div>
        {isAdminOrHR && (
          <div className="flex items-center gap-2.5">
            <select
              value={activeMonth}
              onChange={(e) => setActiveMonth(e.target.value)}
              className="py-1.5 px-3 border border-slate-200 rounded-xl text-xs bg-white"
            >
              <option value="2026-04">April 2026</option>
              <option value="2026-05">May 2026</option>
              <option value="2026-06">June 2026</option>
            </select>
            <button
              onClick={handleGeneratePayroll}
              disabled={loading}
              className="px-4 py-2 bg-slate-900 border border-transparent rounded-xl text-white font-bold text-xs hover:bg-slate-800 disabled:opacity-40"
            >
              Process Cycle
            </button>
            <button
              onClick={handleDisbursePayroll}
              disabled={loading || activeRecordList.length === 0}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 font-bold text-xs text-slate-950 rounded-xl disabled:opacity-40"
            >
              Payout Cycle
            </button>
          </div>
        )}
      </div>

      {notifying && (
        <div className="bg-slate-900 px-4 py-3 rounded-xl border border-slate-800 text-teal-400 text-xs font-mono flex items-center gap-2.5 shadow">
          <Sparkles className="h-4 w-4 text-teal-400 animate-spin shrink-0" />
          <span>{notifying}</span>
        </div>
      )}

      {/* Corporate tax breakdowns / PF limits details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Provident Fund (CPF)</span>
          <p className="text-sm font-semibold mt-1 text-slate-800">12% standard fixed deduction</p>
          <span className="text-[9px] text-slate-400 block mt-1">Calculated matching gross base levels.</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">ESI parameters</span>
          <p className="text-sm font-semibold mt-1 text-slate-800">0.75% contribution cap</p>
          <span className="text-[9px] text-slate-400 block mt-1">Limited to wage scales under $21,000 monthly.</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">TDS Bracket Withholding</span>
          <p className="text-sm font-semibold mt-1 text-slate-800">10% - 20% progressive scales</p>
          <span className="text-[9px] text-slate-400 block mt-1">TDS locks progressive limits depending on bracket.</span>
        </div>
      </div>

      {/* Ledger statement list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Corporate Wage Ledger Cards</span>
          <p className="text-[10px] text-slate-400 mt-0.5">Click "Download Statement" to generate certified client pay slips.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600">
                <th className="p-3 font-semibold">Payroll ID</th>
                <th className="p-3 font-semibold">Staff Member</th>
                <th className="p-3 font-semibold">Base pay</th>
                <th className="p-3 font-semibold">Gross Allowance</th>
                <th className="p-3 font-semibold">PF Deduct</th>
                <th className="p-3 font-semibold">ESI Deduct</th>
                <th className="p-3 font-semibold">TDS Tax</th>
                <th className="p-3 font-semibold">Net Pay statement</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {activeRecordList.map((p) => (
                <tr key={p.payrollId} className="hover:bg-slate-50/50 transition font-sans">
                  <td className="p-3 font-mono text-[10px] text-slate-400">{p.payrollId}</td>
                  <td className="p-3 font-semibold text-slate-800">{p.employeeName}</td>
                  <td className="p-3 font-mono text-[10px]">${p.baseSalary.toLocaleString()}</td>
                  <td className="p-3 font-mono text-[10px]">${p.allowances.toLocaleString()}</td>
                  <td className="p-3 font-mono text-slate-400">-${p.pfDeduction.toLocaleString()}</td>
                  <td className="p-3 font-mono text-slate-400">-${p.esiDeduction.toLocaleString()}</td>
                  <td className="p-3 font-mono text-rose-500">-${p.taxDeduction.toLocaleString()}</td>
                  <td className="p-3 font-mono font-extrabold text-slate-900">${p.netSalary.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === "Paid" ? "bg-emerald-50 text-emerald-600 border border-emerald-200/50" : "bg-slate-50 text-slate-600 border border-slate-200/50"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDownloadPayslip(p)}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-bold flex items-center gap-1.5 ml-auto cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      Payslip Certificate
                    </button>
                  </td>
                </tr>
              ))}
              {activeRecordList.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-400 italic">
                    No generated records found. Admin desk can click 'Process Cycle' to compile draft entries.
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
