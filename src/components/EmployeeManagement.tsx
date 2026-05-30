import React, { useState } from "react";
import { Employee } from "../types";
import { 
  Users, 
  UserPlus, 
  FileText, 
  ShieldCheck, 
  HelpCircle, 
  Upload, 
  MapPin, 
  Phone, 
  Briefcase, 
  DollarSign, 
  Calendar,
  AlertCircle
} from "lucide-react";

interface EmployeeManagementProps {
  userRole: string;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

export default function EmployeeManagement({ userRole, employees, setEmployees }: EmployeeManagementProps) {
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  
  // New employee form
  const [isAdding, setIsAdding] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [designation, setDesignation] = useState("");
  const [salary, setSalary] = useState(5000);
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split("T")[0]);
  const [managerId, setManagerId] = useState("EMP-003");

  const [uploadType, setUploadType] = useState<"resume" | "aadhaar" | "pan" | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = userRole === "HR Recruiter" || userRole === "Super Admin";

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !designation) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/employees/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName, email, phone, address, department, designation, salary, joiningDate, managerId
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setEmployees(prev => [...prev, data.employee]);
        setIsAdding(false);
        // Reset form
        setFullName("");
        setEmail("");
        setPhone("");
        setAddress("");
        setDesignation("");
        setSalary(5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate file drag-and-drop or select and convert to base64
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "resume" | "aadhaar" | "pan") => {
    if (!selectedEmp) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadType(type);
    setUploadProgress("Converting layout...");

    // Read base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setUploadProgress("Uploading to database storage...");

      try {
        const response = await fetch("/api/employees/upload-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: selectedEmp.employeeId,
            type,
            name: file.name,
            base64
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          // Update selected employee display URL
          const updatedEmp = { ...selectedEmp };
          if (type === "resume") updatedEmp.resumeUrl = data.url;
          else if (type === "aadhaar") updatedEmp.aadhaarUrl = data.url;
          else if (type === "pan") updatedEmp.panUrl = data.url;

          setSelectedEmp(updatedEmp);
          setEmployees(prev => prev.map(e => e.employeeId === selectedEmp.employeeId ? updatedEmp : e));
          setUploadProgress("Verification document verified!");
        } else {
          setUploadProgress("Upload failed.");
        }
      } catch (err) {
        setUploadProgress("Upload error.");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Corporate Staff Directory</h2>
          <p className="text-xs text-slate-500">Institutional rosters, profile metadata, and verification doc files.</p>
        </div>
        {canEdit && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition"
          >
            <UserPlus className="h-4 w-4" />
            Hire Staff Member
          </button>
        )}
      </div>

      {isAdding ? (
        <form onSubmit={handleAddEmployee} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 text-sm">Institution Onboarding Registration</h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="E.g. Jennifer Lawrence"
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Official Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Phone Line</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 0111"
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Residential Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="11 Maple Court, Chicago IL"
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Department Allocation</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs"
              >
                <option>Engineering</option>
                <option>Human Resources</option>
                <option>Board of Management</option>
                <option>Executive Office</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Institutional Designation</label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="E.g. Vice President Engineering"
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Base Monthly Gross Salary</label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Institutional Joining Date</label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-slate-900/10 focus:border-slate-900 text-xs"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition disabled:opacity-40"
            >
              {isSubmitting ? "Onboarding Staff..." : "Acknowledge Onboard"}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Employee Directory List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Institutional directory</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Click any record to inspect profiling cards and upload verified papers.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-600">
                    <th className="p-3 font-semibold">Employee ID</th>
                    <th className="p-3 font-semibold">Full Name</th>
                    <th className="p-3 font-semibold">Department</th>
                    <th className="p-3 font-semibold">Designation</th>
                    <th className="p-3 font-semibold">Emp. Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {employees.map((emp) => {
                    const isSelected = selectedEmp?.employeeId === emp.employeeId;
                    return (
                      <tr
                        key={emp.employeeId}
                        onClick={() => setSelectedEmp(emp)}
                        className={`cursor-pointer transition duration-150 ${
                          isSelected ? "bg-slate-50 text-slate-950 font-medium border-l-4 border-slate-900" : "hover:bg-slate-50/50"
                        }`}
                      >
                        <td className="p-3 font-mono text-[10px]">{emp.employeeId}</td>
                        <td className="p-3 font-semibold">{emp.fullName}</td>
                        <td className="p-3 text-slate-500">{emp.department}</td>
                        <td className="p-3 text-slate-500">{emp.designation}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            emp.employmentStatus === "Active" ? "bg-emerald-50 text-emerald-600" :
                            emp.employmentStatus === "On Leave" ? "bg-indigo-50 text-indigo-600" :
                            "bg-amber-50 text-amber-600"
                          }`}>
                            {emp.employmentStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Employee profile Detail / Upload Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
            {selectedEmp ? (
              <div className="space-y-6">
                <div className="text-center pb-4 border-b border-slate-100">
                  <div className="h-16 w-16 mx-auto rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
                    {selectedEmp.fullName.charAt(0)}
                  </div>
                  <h3 className="font-bold text-slate-850 mt-3">{selectedEmp.fullName}</h3>
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">{selectedEmp.employeeId}</span>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{selectedEmp.designation} ({selectedEmp.department})</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{selectedEmp.phone || "No phone listed"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{selectedEmp.address || "No address listed"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <DollarSign className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="font-mono font-semibold">${selectedEmp.salary.toLocaleString()}/mo Gross</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Hired on: {selectedEmp.joiningDate}</span>
                  </div>
                </div>

                {/* Verification files section */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400" /> Statutory KYC Credentials
                  </h4>

                  {/* Resume upload component */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100/60 transition">
                    <div className="flex items-center gap-2 shrink-0">
                      <FileText className="h-4 w-4 text-indigo-500" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-700">Official Resume</p>
                        <p className="text-[9px] text-slate-400">{selectedEmp.resumeUrl ? "Verified Document" : "Missing / Pending"}</p>
                      </div>
                    </div>
                    {canEdit ? (
                      <label className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] hover:bg-slate-50 font-bold flex items-center gap-1 cursor-pointer">
                        <Upload className="h-3 w-3" />
                        Upload
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileChange(e, "resume")}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      selectedEmp.resumeUrl && <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Attached</span>
                    )}
                  </div>

                  {/* Aadhaar card section */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100/60 transition">
                    <div className="flex items-center gap-2 shrink-0">
                      <FileText className="h-4 w-4 text-teal-500" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-700">Aadhaar Card (India)</p>
                        <p className="text-[9px] text-slate-400">{selectedEmp.aadhaarUrl ? "Verified Aadhaar" : "Pending Verification"}</p>
                      </div>
                    </div>
                    {canEdit ? (
                      <label className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] hover:bg-slate-50 font-bold flex items-center gap-1 cursor-pointer">
                        <Upload className="h-3 w-3" />
                        Upload
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg"
                          onChange={(e) => handleFileChange(e, "aadhaar")}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      selectedEmp.aadhaarUrl && <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Verified</span>
                    )}
                  </div>

                  {/* PAN Card section */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100/60 transition">
                    <div className="flex items-center gap-2 shrink-0">
                      <FileText className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-700">PAN Verification</p>
                        <p className="text-[9px] text-slate-400">{selectedEmp.panUrl ? "Verified PAN Card" : "Pending Tax KYC"}</p>
                      </div>
                    </div>
                    {canEdit ? (
                      <label className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] hover:bg-slate-50 font-bold flex items-center gap-1 cursor-pointer">
                        <Upload className="h-3 w-3" />
                        Upload
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg"
                          onChange={(e) => handleFileChange(e, "pan")}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      selectedEmp.panUrl && <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Verified</span>
                    )}
                  </div>

                  {uploadProgress && (
                    <div className="mt-3 bg-indigo-50 border border-indigo-150 rounded-xl p-2.5 flex items-center gap-2 text-[10px] text-indigo-700">
                      <AlertCircle className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span>{uploadProgress}</span>
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center gap-3">
                <Users className="h-12 w-12 text-slate-350 shrink-0" />
                <p className="text-xs">Select any corporate employee in the directory to inspect verification papers and personal summaries.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
