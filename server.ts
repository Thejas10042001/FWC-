import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import { UserRole, UserProfile, Employee, Attendance, LeaveRequest, PayrollRecord, PerformanceRecord, JobVacancy, Candidate, InterviewRecord } from "./src/types.js";
import { calculatePayroll } from "./src/utils/payrollCalculator.js";

// Initialize Gemini API
const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

const app = express();
const PORT = 3000;

// Ensure JSON body parsing up to 10MB (for document base64 payloads)
app.use(express.json({ limit: "10mb" }));

// Local JSON Database setup
const DB_DIR = path.join(process.cwd(), "src", "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Global state interface
interface DBState {
  users: Record<string, UserProfile>;
  employees: Employee[];
  attendance: Attendance[];
  leaves: LeaveRequest[];
  payroll: PayrollRecord[];
  performance: PerformanceRecord[];
  jobs: JobVacancy[];
  candidates: Candidate[];
  interviews: InterviewRecord[];
  auditLogs: { timestamp: string; action: string; description: string; user?: string }[];
}

// Initial Seed Data to populate the system on fresh launch
const INITIAL_DB_STATE: DBState = {
  users: {
    "admin-123": {
      uid: "admin-123",
      email: "admin@company.com",
      name: "Victoria Prince",
      role: "Super Admin",
      createdAt: new Date().toISOString(),
    },
    "mgmt-123": {
      uid: "mgmt-123",
      email: "management@company.com",
      name: "Marcus Aurelius",
      role: "Management Admin",
      createdAt: new Date().toISOString(),
    },
    "mgr-123": {
      uid: "mgr-123",
      email: "manager@company.com",
      name: "Sarah Sterling",
      role: "Senior Manager",
      createdAt: new Date().toISOString(),
    },
    "hr-123": {
      uid: "hr-123",
      email: "hr@company.com",
      name: "Abigail Stone",
      role: "HR Recruiter",
      createdAt: new Date().toISOString(),
    },
    "emp-123": {
      uid: "emp-123",
      email: "employee@company.com",
      name: "Alexander Mercer",
      role: "Employee",
      createdAt: new Date().toISOString(),
    },
  },
  employees: [
    {
      employeeId: "EMP-001",
      userId: "admin-123",
      fullName: "Victoria Prince",
      email: "admin@company.com",
      phone: "+1 (555) 0192",
      address: "88 Executive Parkway, New York, NY",
      department: "Executive Branch",
      designation: "Chief HR Executive",
      managerId: "",
      joiningDate: "2021-01-15",
      salary: 15500,
      employmentStatus: "Active",
    },
    {
      employeeId: "EMP-002",
      userId: "mgmt-123",
      fullName: "Marcus Aurelius",
      email: "management@company.com",
      phone: "+1 (555) 0183",
      address: "12 Capitol Hill View, Arlington, VA",
      department: "Board of Management",
      designation: "Managing Director",
      managerId: "",
      joiningDate: "2020-05-10",
      salary: 19500,
      employmentStatus: "Active",
    },
    {
      employeeId: "EMP-003",
      userId: "mgr-123",
      fullName: "Sarah Sterling",
      email: "manager@company.com",
      phone: "+1 (555) 0144",
      address: "42 Redwood Drive, San Francisco, CA",
      department: "Engineering",
      designation: "Senior Engineering Manager",
      managerId: "EMP-002",
      joiningDate: "2022-03-01",
      salary: 12800,
      employmentStatus: "Active",
    },
    {
      employeeId: "EMP-004",
      userId: "hr-123",
      fullName: "Abigail Stone",
      email: "hr@company.com",
      phone: "+1 (555) 0122",
      address: "116 Clover Street, Austin, TX",
      department: "Human Resources",
      designation: "Principal Technical Recruiter",
      managerId: "EMP-001",
      joiningDate: "2023-01-10",
      salary: 8200,
      employmentStatus: "Active",
    },
    {
      employeeId: "EMP-005",
      userId: "emp-123",
      fullName: "Alexander Mercer",
      email: "employee@company.com",
      phone: "+1 (555) 0101",
      address: "249 Oak Avenue, Chicago, IL",
      department: "Engineering",
      designation: "Staff Software Engineer",
      managerId: "EMP-003",
      joiningDate: "2023-08-15",
      salary: 9500,
      employmentStatus: "Active",
    },
  ],
  attendance: [
    {
      attendanceId: "ATT-101",
      employeeId: "EMP-005",
      date: new Date().toISOString().split("T")[0],
      checkInTime: new Date(new Date().setHours(9, 5, 0)).toISOString(),
      checkOutTime: new Date(new Date().setHours(17, 30, 0)).toISOString(),
      totalMinutesOnBreak: 45,
      totalMinutesWorked: 460,
      status: "Present",
    },
    {
      attendanceId: "ATT-102",
      employeeId: "EMP-003",
      date: new Date().toISOString().split("T")[0],
      checkInTime: new Date(new Date().setHours(8, 54, 0)).toISOString(),
      totalMinutesOnBreak: 0,
      totalMinutesWorked: 0,
      status: "Present",
    },
  ],
  leaves: [
    {
      leaveId: "LVE-201",
      employeeId: "EMP-005",
      employeeName: "Alexander Mercer",
      leaveType: "Sick Leave",
      startDate: "2026-06-10",
      endDate: "2026-06-12",
      reason: "Medical clearance required for wisdom tooth extraction.",
      managerApproval: "Approved",
      hrApproval: "Approved",
      status: "Approved",
    },
    {
      leaveId: "LVE-202",
      employeeId: "EMP-005",
      employeeName: "Alexander Mercer",
      leaveType: "Casual Leave",
      startDate: "2026-07-01",
      endDate: "2026-07-03",
      reason: "Family gathering and summer reunion.",
      managerApproval: "Pending",
      hrApproval: "Pending",
      status: "Pending",
    },
  ],
  payroll: [
    {
      payrollId: "PAY-301",
      employeeId: "EMP-005",
      employeeName: "Alexander Mercer",
      department: "Engineering",
      month: "2026-04",
      baseSalary: 9500,
      allowances: 1200,
      pfDeduction: 1140, // 12% of Base
      esiDeduction: 162, // 1.75% of Base
      taxDeduction: 1425, // 15% estimated
      netSalary: 7973,
      status: "Paid",
      processedAt: new Date().toISOString(),
    },
  ],
  performance: [
    {
      performanceId: "PERF-401",
      employeeId: "EMP-005",
      employeeName: "Alexander Mercer",
      department: "Engineering",
      quarter: "2026-Q1",
      kpis: "1. Complete Migration of core module APIs to Node service.\n2. Maintain unit test coverage above 85%.\n3. Mentor 2 Junior Associates.",
      selfRating: 4,
      selfReview: "I successfully delivered the API modernization plan three weeks ahead of schedule. Covered 92% of lines. Devoted five hours per week to peer mentoring.",
      managerRating: 5,
      managerReview: "Alexander performed exceptionally this quarter. His technical leadership on the API rewrite minimized system regression entirely. Excellent mentorship feedback.",
      aiSummary: "Alexander is a top-tier engineering contributor matching Staff metrics. Excels in prompt delivery, test integrity, and cross-functional leadership.",
      aiSuggestions: "Alexander should target system architecture design groups and lead larger multi-team standards to transition fully into Lead Staff positions.",
      aiTraining: "1. Advanced Distributed Architectures (Coursera)\n2. Cloud Native Enterprise Scale Engineering (Google Cloud Certified Specialist)",
      reviewedAt: new Date().toISOString(),
    },
  ],
  jobs: [
    {
      jobId: "JOB-501",
      title: "Senior AI & Prompt Engineer",
      department: "Engineering",
      description: "We are seeking a senior systems builder to design agent orchestration flows using Google Gemini models.",
      requirements: "Experience with LLMs, langchain or direct SDK prompt tuning, node.js, vector databases, and React.",
      experienceRange: "5-8 Years",
      status: "Open",
      createdAt: new Date().toISOString(),
    },
    {
      jobId: "JOB-502",
      title: "Principal HR Specialist",
      department: "Human Resources",
      description: "Lead enterprise onboarding, statutory compliance, benefits coordination, and global performance cycles.",
      requirements: "Master in HR management or related discipline, 8+ years experience in corporate compliance environments.",
      experienceRange: "8+ Years",
      status: "Open",
      createdAt: new Date().toISOString(),
    },
  ],
  candidates: [
    {
      candidateId: "CAN-601",
      jobId: "JOB-501",
      jobTitle: "Senior AI & Prompt Engineer",
      fullName: "Clarissa Vance",
      email: "clarissa.vance@mit.edu",
      phone: "+1 (555) 7748",
      stage: "Screening",
      appliedAt: new Date().toISOString(),
      aiMatchScore: 92,
      aiEvaluationSummary: {
        candidateName: "Clarissa Vance",
        skillsScore: 95,
        experienceScore: 90,
        educationScore: 92,
        overallMatchPercentage: 92,
        strengths: [
          "Published graduate-level ML researcher specializing in generative sequence alignment",
          "Deep expertise in Node.js, Python, and Google Gemini API integration",
          "Demonstrable system level debugging skills"
        ],
        weaknesses: [
          "Relatively brief experience in standard enterprise React applications, mostly research focused"
        ],
        hiringRecommendation: "Highly Recommended. Transition to technical round quickly."
      }
    },
    {
      candidateId: "CAN-602",
      jobId: "JOB-501",
      jobTitle: "Senior AI & Prompt Engineer",
      fullName: "Bradford Jenkins",
      email: "b.jenkins@webdesign.co",
      phone: "+1 (555) 4410",
      stage: "Applied",
      appliedAt: new Date().toISOString(),
    }
  ],
  interviews: [
    {
      interviewId: "INT-701",
      candidateId: "CAN-601",
      candidateName: "Clarissa Vance",
      jobTitle: "Senior AI & Prompt Engineer",
      transcript: [
        { speaker: "AI", text: "Welcome Clarissa. To begin, could you explain your experience integrating Google GenAI SDKs into production environments?" },
        { speaker: "Candidate", text: "Yes! In my last project, we used the Google GenAI SDK to handle server-side prompt extraction and streaming summaries. We enforced server-side key safety by wrapping all requests in secure Node.js proxy endpoints, keeping the user key hidden completely from browser networks." },
        { speaker: "AI", text: "Excellent! How do you handle performance limitations or token limits during massive resume screeners?" },
        { speaker: "Candidate", text: "We implement rigorous map reductions, extracting key JSON details (like skills and experience objects) first before passing them to advanced rating layers, avoiding massive payloads." }
      ],
      communicationScore: 94,
      technicalScore: 92,
      confidenceScore: 95,
      finalRecommendation: "Outstanding technical depth. Strongly support prompt hire.",
      status: "Completed",
      createdAt: new Date().toISOString(),
    }
  ],
  auditLogs: [
    {
      timestamp: new Date().toISOString(),
      action: "System Initialization",
      description: "Enterprise HRMS Engine booted up securely with persistent mock database.",
    },
  ],
};

// Retrieve Database state
function getDB(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Failed to read local DB, fallback to seed.", err);
  }
  
  // Create database file with seed data
  saveDB(INITIAL_DB_STATE);
  return INITIAL_DB_STATE;
}

// Persist Database state
function saveDB(data: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist database metadata.", err);
  }
}

// Log actions
function addAuditLog(action: string, description: string, user?: string) {
  const db = getDB();
  db.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action,
    description,
    user,
  });
  // Cap at 100 entries
  if (db.auditLogs.length > 100) {
    db.auditLogs = db.auditLogs.slice(0, 100);
  }
  saveDB(db);
}

// ============================================
// API ROUTES
// ============================================

// Simulated Session Login Endpoint
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = getDB();
  
  // In our full-stack demo, we'll match by email
  const matchedUser = Object.values(db.users).find((u) => u.email.toLowerCase() === email.toLowerCase());
  
  if (matchedUser) {
    addAuditLog("User Sign In", `Successful login of ${matchedUser.name} (${matchedUser.role})`, matchedUser.name);
    return res.json({ success: true, user: matchedUser });
  }
  
  return res.status(401).json({ error: "Invalid corporate credentials." });
});

// GET profile
app.get("/api/auth/profile/:uid", (req, res) => {
  const db = getDB();
  const profile = db.users[req.params.uid];
  if (profile) return res.json(profile);
  res.status(404).json({ error: "Profile not found." });
});

// Update Profile
app.post("/api/auth/profile/update", (req, res) => {
  const { uid, name, email } = req.body;
  const db = getDB();
  if (db.users[uid]) {
    db.users[uid].name = name;
    db.users[uid].email = email;
    // Update matched employee profile as well
    const emp = db.employees.find((e) => e.userId === uid);
    if (emp) {
      emp.fullName = name;
      emp.email = email;
    }
    saveDB(db);
    addAuditLog("Profile Update", `User ${name} updated their contact card.`, name);
    return res.json({ success: true, user: db.users[uid] });
  }
  res.status(404).json({ error: "User not found" });
});

// Employees list
app.get(["/api/employees", "/api/employees/list"], (req, res) => {
  res.json(getDB().employees);
});

// Add Employee
app.post("/api/employees/add", (req, res) => {
  const employeeData: Employee = req.body;
  const db = getDB();
  
  // Generate random IDs
  const empId = `EMP-${String(db.employees.length + 1).padStart(3, "0")}`;
  const userId = `uid-${Math.random().toString(36).substring(2, 9)}`;
  
  const newEmp: Employee = {
    ...employeeData,
    employeeId: empId,
    userId,
    employmentStatus: "Active",
  };
  
  const newUserProfile: UserProfile = {
    uid: userId,
    email: employeeData.email,
    name: employeeData.fullName,
    role: "Employee",
    createdAt: new Date().toISOString(),
  };
  
  db.employees.push(newEmp);
  db.users[userId] = newUserProfile;
  saveDB(db);
  
  addAuditLog("Employee Hired", `Onboarded new employee ${newEmp.fullName} in ${newEmp.department}`, "HR Administrator");
  res.json({ success: true, employee: newEmp });
});

// Update Employee
app.post("/api/employees/update/:id", (req, res) => {
  const db = getDB();
  const index = db.employees.findIndex((e) => e.employeeId === req.params.id);
  if (index !== -1) {
    db.employees[index] = { ...db.employees[index], ...req.body };
    saveDB(db);
    addAuditLog("Employee Update", `Updated directory details for employee ${db.employees[index].fullName}`, "System/HR");
    return res.json({ success: true, employee: db.employees[index] });
  }
  res.status(404).json({ error: "Employee record not found." });
});

// Upload verification documents base64 simulation
app.post("/api/employees/upload-document", (req, res) => {
  const { employeeId, type, name, base64 } = req.body;
  const db = getDB();
  const empIndex = db.employees.findIndex((e) => e.employeeId === employeeId);
  if (empIndex !== -1) {
    // Generate simulated permanent URL inside sandbox
    const simulatedUrl = `/docs/${employeeId}_${type}_${Date.now()}.pdf`;
    
    if (type === "resume") {
      db.employees[empIndex].resumeUrl = simulatedUrl;
    } else if (type === "aadhaar") {
      db.employees[empIndex].aadhaarUrl = simulatedUrl;
    } else if (type === "pan") {
      db.employees[empIndex].panUrl = simulatedUrl;
    }
    
    saveDB(db);
    addAuditLog("Document Uploaded", `Uploaded statutory verification certificate type (${type}) for employee ${db.employees[empIndex].fullName}.`, db.employees[empIndex].fullName);
    return res.json({ success: true, url: simulatedUrl });
  }
  res.status(404).json({ error: "Employee not found." });
});

// GET system audit logs
app.get("/api/audit-logs", (req, res) => {
  res.json(getDB().auditLogs);
});

// ============================================
// ATTENDANCE MANAGEMENT (MODULE 3)
// ============================================

app.get("/api/attendance/today", (req, res) => {
  const employeeId = req.query.employeeId as string;
  if (!employeeId) return res.status(400).json({ error: "employeeId is required" });
  const db = getDB();
  const today = new Date().toISOString().split("T")[0];
  const record = db.attendance.find((a) => a.employeeId === employeeId && a.date === today);
  res.json({ record: record || null });
});

app.get("/api/attendance/status/:employeeId", (req, res) => {
  const db = getDB();
  const today = new Date().toISOString().split("T")[0];
  const record = db.attendance.find((a) => a.employeeId === req.params.employeeId && a.date === today);
  res.json(record || null);
});

app.post("/api/attendance/check-in", (req, res) => {
  const { employeeId } = req.body;
  const db = getDB();
  const today = new Date().toISOString().split("T")[0];
  
  // Check if check-in already registers
  const existing = db.attendance.find((a) => a.employeeId === employeeId && a.date === today);
  if (existing) {
    return res.status(400).json({ error: "Already checked in today." });
  }
  
  const now = new Date();
  const expectedTime = new Date();
  expectedTime.setHours(9, 0, 0); // Late threshold
  const status = now > expectedTime ? "Late" : "Present";
  
  const newAtt: Attendance = {
    attendanceId: `ATT-${Math.floor(Math.random() * 10000)}`,
    employeeId,
    date: today,
    checkInTime: now.toISOString(),
    totalMinutesOnBreak: 0,
    totalMinutesWorked: 0,
    status,
  };
  
  db.attendance.push(newAtt);
  saveDB(db);
  addAuditLog("Attendance Gate", `Employee Check-In recorded for ${employeeId} at ${now.toLocaleTimeString()}`, employeeId);
  res.json({ success: true, record: newAtt, attendance: newAtt });
});

app.post("/api/attendance/break-toggle", (req, res) => {
  const { employeeId } = req.body;
  const db = getDB();
  const today = new Date().toISOString().split("T")[0];
  const attIndex = db.attendance.findIndex((a) => a.employeeId === employeeId && a.date === today);
  
  if (attIndex === -1) {
    return res.status(400).json({ error: "Attendance entry not found for today." });
  }
  
  const att = db.attendance[attIndex];
  const now = new Date().toISOString();
  
  if (att.breakStartTime) {
    // Return from break - accumulate break time
    const start = new Date(att.breakStartTime);
    const end = new Date(now);
    const breakMin = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
    
    att.totalMinutesOnBreak = (att.totalMinutesOnBreak || 0) + breakMin;
    att.breakStartTime = undefined;
    addAuditLog("Attendance Gate", `Employee ${employeeId} returned from active lunch break.`, employeeId);
  } else {
    // Starting break
    att.breakStartTime = now;
    addAuditLog("Attendance Gate", `Employee ${employeeId} started active break session.`, employeeId);
  }
  
  db.attendance[attIndex] = att;
  saveDB(db);
  res.json({ success: true, attendance: att });
});

app.post("/api/attendance/break", (req, res) => {
  const { attendanceId } = req.body;
  const db = getDB();
  const attIndex = db.attendance.findIndex((a) => a.attendanceId === attendanceId);
  
  if (attIndex === -1) {
    return res.status(404).json({ error: "Attendance record not found." });
  }
  
  const att = db.attendance[attIndex];
  const now = new Date().toISOString();
  
  if (att.breakStartTime) {
    const start = new Date(att.breakStartTime);
    const end = new Date(now);
    const breakMin = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
    
    att.totalMinutesOnBreak = (att.totalMinutesOnBreak || 0) + breakMin;
    att.breakStartTime = undefined;
    addAuditLog("Attendance Gate", `Employee ${att.employeeId} returned from active break.`, att.employeeId);
  } else {
    att.breakStartTime = now;
    addAuditLog("Attendance Gate", `Employee ${att.employeeId} started active break session.`, att.employeeId);
  }
  
  db.attendance[attIndex] = att;
  saveDB(db);
  res.json({ success: true, record: att, attendance: att });
});

app.post("/api/attendance/check-out", (req, res) => {
  const { attendanceId, employeeId } = req.body;
  const db = getDB();
  
  let attIndex = -1;
  if (attendanceId) {
    attIndex = db.attendance.findIndex((a) => a.attendanceId === attendanceId);
  } else if (employeeId) {
    const today = new Date().toISOString().split("T")[0];
    attIndex = db.attendance.findIndex((a) => a.employeeId === employeeId && a.date === today);
  }
  
  if (attIndex === -1) {
    return res.status(400).json({ error: "No active check-in session found." });
  }
  
  const att = db.attendance[attIndex];
  if (att.checkOutTime) {
    return res.status(400).json({ error: "Already checked out today." });
  }
  
  const now = new Date();
  att.checkOutTime = now.toISOString();
  
  // Calculate total worked minutes
  const inTime = new Date(att.checkInTime);
  let totalMin = Math.round((now.getTime() - inTime.getTime()) / 1000 / 60);
  
  // Deduct lunch breaks
  totalMin = Math.max(0, totalMin - (att.totalMinutesOnBreak || 0));
  att.totalMinutesWorked = totalMin;
  
  // Deduct active break if checked out on break
  if (att.breakStartTime) {
    att.breakStartTime = undefined;
  }
  
  db.attendance[attIndex] = att;
  saveDB(db);
  addAuditLog("Attendance Gate", `Employee Check-Out recorded for ${att.employeeId} with ${totalMin} minutes total work.`, att.employeeId);
  res.json({ success: true, record: att, attendance: att });
});

app.get("/api/attendance/history/:employeeId", (req, res) => {
  const db = getDB();
  const records = db.attendance.filter((a) => a.employeeId === req.params.employeeId);
  res.json(records);
});

// All company logs
app.get(["/api/attendance/logs", "/api/attendance/admin/all"], (req, res) => {
  res.json(getDB().attendance);
});

// ============================================
// LEAVE MANAGEMENT (MODULE 4)
// ============================================

app.get("/api/leaves/employee/:employeeId", (req, res) => {
  res.json(getDB().leaves.filter((l) => l.employeeId === req.params.employeeId));
});

app.get(["/api/leaves/list", "/api/leaves/admin/all"], (req, res) => {
  res.json(getDB().leaves);
});

app.post("/api/leaves/apply", (req, res) => {
  const leaveDataStr: LeaveRequest = req.body;
  const db = getDB();
  
  const emp = db.employees.find((e) => e.employeeId === leaveDataStr.employeeId);
  const employeeName = emp ? emp.fullName : "Employee";
  
  const newLeave: LeaveRequest = {
    ...leaveDataStr,
    leaveId: `LVE-${Math.floor(Math.random() * 10000)}`,
    employeeName,
    managerApproval: "Pending",
    hrApproval: "Pending",
    status: "Pending",
  };
  
  db.leaves.push(newLeave);
  saveDB(db);
  addAuditLog("Leave Application", `Employee ${employeeName} applied for ${newLeave.leaveType} from ${newLeave.startDate} to ${newLeave.endDate}`, employeeName);
  res.json({ success: true, leave: newLeave });
});

// Leave Workflow Management (Manager or HR approvals)
app.post("/api/leaves/approve", (req, res) => {
  const { leaveId, approverRole, decision } = req.body;
  const db = getDB();
  const leaveIndex = db.leaves.findIndex((l) => l.leaveId === leaveId);
  
  if (leaveIndex === -1) {
    return res.status(404).json({ error: "Leave request not found." });
  }
  
  const leave = db.leaves[leaveIndex];
  
  if (approverRole === "Senior Manager") {
    leave.managerApproval = decision;
  } else if (approverRole === "HR Recruiter" || approverRole === "Super Admin") {
    leave.hrApproval = decision;
  }
  
  // Decide terminal compiled state
  // Workflow: Must be approved by BOTH Manager and HR to be fully Approved. If any Rejects, it's Rejected.
  if (leave.managerApproval === "Rejected" || leave.hrApproval === "Rejected") {
    leave.status = "Rejected";
  } else if (leave.managerApproval === "Approved" && leave.hrApproval === "Approved") {
    leave.status = "Approved";
    
    // Update employee status to On Leave if starting today
    const today = new Date().toISOString().split("T")[0];
    if (today >= leave.startDate && today <= leave.endDate) {
      const empIdx = db.employees.findIndex((e) => e.employeeId === leave.employeeId);
      if (empIdx !== -1) {
        db.employees[empIdx].employmentStatus = "On Leave";
      }
    }
  } else {
    leave.status = "Pending";
  }
  
  db.leaves[leaveIndex] = leave;
  saveDB(db);
  addAuditLog("Leave Decision", `${approverRole} decided leave ${leaveId} with result status: ${decision}`, "HR/Approvals");
  res.json({ success: true, leave });
});

// ============================================
// PAYROLL SYSTEM (MODULE 5)
// ============================================

app.get("/api/payroll/cycles", (req, res) => {
  res.json(getDB().payroll);
});

app.post("/api/payroll/generate-all", (req, res) => {
  const { month } = req.body; // format 'YYYY-MM'
  const db = getDB();
  
  let payrollList = db.payroll.filter((p) => p.month === month);
  if (payrollList.length > 0) {
    return res.json({ success: true, alreadyExists: true, list: payrollList });
  }
  
  // Compute for all active employees
  const processedRecords: PayrollRecord[] = db.employees
    .filter((emp) => emp.employmentStatus === "Active" || emp.employmentStatus === "On Leave")
    .map((emp) => {
      const baseSalary = emp.salary;
      const { allowances, pfDeduction, esiDeduction, taxDeduction, netSalary } = calculatePayroll(baseSalary);
      
      return {
        payrollId: `PAY-${Math.floor(Math.random() * 100000)}`,
        employeeId: emp.employeeId,
        employeeName: emp.fullName,
        department: emp.department,
        month,
        baseSalary,
        allowances,
        pfDeduction,
        esiDeduction,
        taxDeduction,
        netSalary,
        status: "Draft",
      };
    });
    
  db.payroll.push(...processedRecords);
  saveDB(db);
  addAuditLog("Payroll Processing", `Compiled draft corporate payroll for cycle ${month} encompassing ${processedRecords.length} staff.`, "Finance Desk");
  res.json({ success: true, list: processedRecords });
});

app.post("/api/payroll/disburse", (req, res) => {
  const { month } = req.body;
  const db = getDB();
  
  db.payroll.forEach((p) => {
    if (p.month === month) p.status = "Paid";
  });
  saveDB(db);
  addAuditLog("Payroll Disbursal", `Successfully processed bank transfers for payroll cycle ${month}`, "Chief Admin");
  res.json({ success: true });
});

// ============================================
// PERFORMANCE TRACKER & GOALS (MODULE 6)
// ============================================

app.get("/api/performance/employee/:employeeId", (req, res) => {
  res.json(getDB().performance.filter((p) => p.employeeId === req.params.employeeId));
});

app.get(["/api/performance/list", "/api/performance/admin/all"], (req, res) => {
  res.json(getDB().performance);
});

// Submit/Create quarterly review goals
app.post("/api/performance/goals/create", (req, res) => {
  const { employeeId, quarter, kpis } = req.body;
  const db = getDB();
  const emp = db.employees.find((e) => e.employeeId === employeeId);
  if (!emp) return res.status(404).json({ error: "Employee not found." });
  
  const record: PerformanceRecord = {
    performanceId: `PERF-${Math.floor(Math.random() * 10000)}`,
    employeeId,
    employeeName: emp.fullName,
    department: emp.department,
    quarter,
    kpis,
  };
  
  db.performance.push(record);
  saveDB(db);
  addAuditLog("Performance Cycle", `Established performance targets for employee ${emp.fullName} for quarter ${quarter}`, "Management");
  res.json({ success: true, record });
});

// Update KPIs direct route (from PerformanceManagement component)
app.post("/api/performance/update-kpis", (req, res) => {
  const { employeeId, kpis } = req.body;
  const db = getDB();
  const emp = db.employees.find((e) => e.employeeId === employeeId);
  if (!emp) return res.status(404).json({ error: "Employee not found." });
  
  const quarter = "2026-Q1";
  let idx = db.performance.findIndex((p) => p.employeeId === employeeId && p.quarter === quarter);
  
  let record: PerformanceRecord;
  if (idx !== -1) {
    db.performance[idx].kpis = kpis;
    record = db.performance[idx];
  } else {
    record = {
      performanceId: `PERF-${Math.floor(Math.random() * 10000)}`,
      employeeId,
      employeeName: emp.fullName,
      department: emp.department,
      quarter,
      kpis,
    };
    db.performance.push(record);
  }
  
  saveDB(db);
  addAuditLog("Performance Cycle", `Established performance targets for employee ${emp.fullName} for quarter ${quarter}`, "Management");
  res.json({ success: true, record });
});

// Submit Self-Review
app.post("/api/performance/review/self", (req, res) => {
  const { performanceId, selfRating, selfReview } = req.body;
  const db = getDB();
  const idx = db.performance.findIndex((p) => p.performanceId === performanceId);
  if (idx !== -1) {
    db.performance[idx].selfRating = Number(selfRating);
    db.performance[idx].selfReview = selfReview;
    saveDB(db);
    addAuditLog("KPI Assessment", `Employee self review recorded for cycle ${db.performance[idx].quarter}`, db.performance[idx].employeeName);
    return res.json({ success: true, record: db.performance[idx] });
  }
  res.status(404).json({ error: "Record not found." });
});

// Submit Manager/Aether Appraisal & Gemini Synthesis
app.post("/api/performance/review", async (req, res) => {
  const { employeeId, reviewerFeedback } = req.body;
  const db = getDB();
  
  const quarter = "2026-Q1";
  let idx = db.performance.findIndex((p) => p.employeeId === employeeId && p.quarter === quarter);
  if (idx === -1) {
    const emp = db.employees.find((e) => e.employeeId === employeeId);
    if (!emp) return res.status(404).json({ error: "Employee not found." });
    const newRecord: PerformanceRecord = {
      performanceId: `PERF-${Math.floor(Math.random() * 10000)}`,
      employeeId,
      employeeName: emp.fullName,
      department: emp.department,
      quarter,
      kpis: "General staff duties and professional contributions",
    };
    db.performance.push(newRecord);
    idx = db.performance.length - 1;
  }
  
  const perf = db.performance[idx];
  perf.managerReview = reviewerFeedback;
  perf.managerRating = 4; // default initial score
  perf.reviewedAt = new Date().toISOString();
  
  if (!ai) {
    perf.rating = 4;
    perf.aiSummary = `${perf.employeeName} exhibits core dedication. Reviews show precise alignment on quarterly goals. Feedback indicates high technical and system delivery competence.`;
    perf.aiSuggestions = "1. Lead bigger system standards\n2. Increase architecture involvement";
    perf.aiTraining = "Advanced Systems Architecture Class";
    
    db.performance[idx] = perf;
    saveDB(db);
    addAuditLog("KPI Assessment", `Direct review compiled for employee ${perf.employeeName} (Simulation mode)`, "Senior Manager");
    return res.json({ success: true, record: perf });
  }
  
  try {
    const prompt = `
      You are an elite enterprise executive HR AI review assessor. 
      Analyze the employee performance details below and output professional corporate evaluations:
      
      Employee Name: ${perf.employeeName}
      Department: ${perf.department}
      Targets/KPIs Assigned: ${perf.kpis}
      Manager Assessment: ${reviewerFeedback}
      
      Generate a clean structured JSON schema with keys:
      - performanceSummary (Concise executive appraisal paragraph of contributions)
      - rating (Numerical rating from 1 to 5 as integer)
      - growthSuggestions (3-4 bullet suggestions on how they can improve)
      - trainingRecommendations (2-3 targeted training topics/course names)
      
      Output strictly JSON. No triple backticks or wrapper text.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    
    const rawText = response.text || "{}";
    const resultObj = JSON.parse(rawText.trim());
    
    perf.aiSummary = resultObj.performanceSummary || "Completed satisfactorily.";
    perf.rating = Number(resultObj.rating) || 4;
    perf.managerRating = Number(resultObj.rating) || 4;
    perf.aiSuggestions = Array.isArray(resultObj.growthSuggestions) ? resultObj.growthSuggestions.join("\n") : resultObj.growthSuggestions || "";
    perf.aiTraining = Array.isArray(resultObj.trainingRecommendations) ? resultObj.trainingRecommendations.join("\n") : resultObj.trainingRecommendations || "";
    
    db.performance[idx] = perf;
    saveDB(db);
    addAuditLog("KPI Assessment", `Direct review compiled for employee ${perf.employeeName} with Gemini review ratings`, "Senior Manager");
    res.json({ success: true, record: perf });
    
  } catch (err: any) {
    console.error("Gemini Performance review compilation failed", err);
    perf.rating = 4;
    db.performance[idx] = perf;
    saveDB(db);
    res.json({ success: true, record: perf });
  }
});

// Submit Manager-Review
app.post("/api/performance/review/manager", (req, res) => {
  const { performanceId, managerRating, managerReview } = req.body;
  const db = getDB();
  const idx = db.performance.findIndex((p) => p.performanceId === performanceId);
  if (idx !== -1) {
    db.performance[idx].managerRating = Number(managerRating);
    db.performance[idx].managerReview = managerReview;
    db.performance[idx].reviewedAt = new Date().toISOString();
    saveDB(db);
    addAuditLog("KPI Assessment", `Manager review submitted for employee ${db.performance[idx].employeeName} for cycle ${db.performance[idx].quarter}`, "Senior Manager");
    return res.json({ success: true, record: db.performance[idx] });
  }
  res.status(404).json({ error: "Record not found." });
});

// AI Performance Evaluator (Gemini)
app.post("/api/performance/ai-analyze", async (req, res) => {
  if (!ai) {
    return res.status(400).json({ error: "Gemini API key is not configured inside Secrets." });
  }
  
  const { performanceId } = req.body;
  const db = getDB();
  const idx = db.performance.findIndex((p) => p.performanceId === performanceId);
  if (idx === -1) return res.status(404).json({ error: "Record not found." });
  
  const perf = db.performance[idx];
  
  try {
    const prompt = `
      You are an elite enterprise executive HR AI review assessor. 
      Analyze the employee performance data below and output professional corporate evaluations:
      
      Employee Name: ${perf.employeeName}
      Department: ${perf.department}
      Targets/KPIs Assigned: ${perf.kpis}
      Employee Self-Rating: ${perf.selfRating || "Not rated"} / 5
      Self-Evaluation: ${perf.selfReview || "Not written"}
      Manager Official Rating: ${perf.managerRating || "Not rated"} / 5
      Manager Assessment: ${perf.managerReview || "Not written"}
      
      Generate a clean structured JSON schema with keys:
      - performanceSummary (Concise executive appraisal paragraph)
      - growthSuggestions (3-4 bullet suggestions on how they can improve)
      - trainingRecommendations (2-3 targeted training topics/course names)
      
      Output strictly the JSON structure. Do not surround with markdown codes like triple ticks unless they are plain text.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    
    const rawText = response.text || "{}";
    const resultObj = JSON.parse(rawText.trim());
    
    db.performance[idx].aiSummary = resultObj.performanceSummary || "Completed satisfactorily.";
    db.performance[idx].aiSuggestions = Array.isArray(resultObj.growthSuggestions) ? resultObj.growthSuggestions.join("\n") : resultObj.growthSuggestions || "";
    db.performance[idx].aiTraining = Array.isArray(resultObj.trainingRecommendations) ? resultObj.trainingRecommendations.join("\n") : resultObj.trainingRecommendations || "";
    
    saveDB(db);
    addAuditLog("AI Growth Analysis", `Gemini assessment completed for employee ${perf.employeeName}`, "HR AI Suite");
    res.json({ success: true, record: db.performance[idx] });
    
  } catch (err: any) {
    console.error("Gemini Performance AI analysis failed", err);
    res.status(500).json({ error: "Gemini API failure during assessment: " + err.message });
  }
});

// ============================================
// RECRUITMENT ATS & AI SCREENING (MODULE 7 & 8)
// ============================================

app.get("/api/recruitment/jobs", (req, res) => {
  res.json(getDB().jobs);
});

app.post(["/api/recruitment/jobs/publish", "/api/recruitment/jobs/create"], (req, res) => {
  const { title, department, description, requirements, experienceRange, salaryRange } = req.body;
  const db = getDB();
  const newJob: JobVacancy = {
    jobId: `JOB-${Math.floor(Math.random() * 1000) + 100}`,
    title,
    department,
    description: description || "",
    requirements: requirements || "General professional role requirements.",
    experienceRange: experienceRange || "3-5 years",
    salaryRange: salaryRange || "Negotiable / Competitive",
    status: "Open",
    createdAt: new Date().toISOString(),
  };
  db.jobs.push(newJob);
  saveDB(db);
  addAuditLog("Job Published", `HR Recruiter published open vacancy: ${title} in ${department}`, "HR Recruiter");
  res.json({ success: true, job: newJob });
});

app.get("/api/recruitment/candidates", (req, res) => {
  res.json(getDB().candidates);
});

// Submit candidate application
app.post("/api/recruitment/candidates/apply", (req, res) => {
  const { jobId, fullName, email, phone, resumeUrl, resumeText } = req.body;
  const db = getDB();
  
  const job = db.jobs.find((j) => j.jobId === jobId);
  const jobTitle = job ? job.title : "Corporate Vacancy";
  
  const newCand: Candidate = {
    candidateId: `CAN-${Math.floor(Math.random() * 1000) + 100}`,
    jobId,
    jobTitle,
    fullName,
    email,
    phone,
    resumeUrl: resumeUrl || "/resumes/placeholder.pdf",
    stage: "Applied",
    appliedAt: new Date().toISOString(),
  };
  
  // Save parsed text for screening on-demand
  if (resumeText) {
    newCand.resumeText = resumeText;
  }
  
  db.candidates.push(newCand);
  saveDB(db);
  addAuditLog("Candidate Applied", `New applicant ${fullName} registered for vacancy: ${jobTitle}`, "Applicant Portal");
  res.json({ success: true, candidate: newCand });
});

// Execute AI Resume Screening using Gemini
app.post("/api/recruitment/candidates/ai-screen", async (req, res) => {
  if (!ai) {
    return res.status(400).json({ error: "Gemini API key is not configured inside Secrets." });
  }
  
  const { candidateId } = req.body;
  const db = getDB();
  const cIndex = db.candidates.findIndex((c) => c.candidateId === candidateId);
  if (cIndex === -1) return res.status(404).json({ error: "Candidate not found." });
  
  const cand = db.candidates[cIndex];
  const job = db.jobs.find((j) => j.jobId === cand.jobId);
  const jobRequirements = job ? job.requirements : "General professional skills";
  
  // Use parsed resume text, or simulated text if not present
  const resumeContentToAnalyze = cand.resumeText || `
    Candidate: ${cand.fullName}
    Contact: ${cand.email} / ${cand.phone}
    Technical Background: Master of Computer Applications, 6 years expert development, core systems builder, node.js, AWS pipelines, frontend engineering.
  `;
  
  try {
    const prompt = `
      You are an expert AI recruiter screening executive candidates. 
      Examine the Candidate Resume text against the targeted Job Requirements and yield a complete matching evaluation.
      
      Job Title: ${job?.title || "Corporate Role"}
      Job Requirements: ${jobRequirements}
      
      Candidate Resume Content:
      ${resumeContentToAnalyze}
      
      Generate a structured JSON output mapping EXACTLY the following keys:
      - candidateName (String)
      - skillsScore (Number from 0 to 100)
      - experienceScore (Number from 0 to 100)
      - educationScore (Number from 0 to 100)
      - overallMatchPercentage (Calculated float or integer from 0 to 100)
      - strengths (Array of strings, at least 3 points)
      - weaknesses (Array of strings, at least 2 points)
      - hiringRecommendation (Sentence conclusion e.g., 'Highly recommended to interview stage.')
      
      Return ONLY clean raw compliant JSON string. No extra wrapper wording.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    
    const rawText = response.text || "{}";
    const screenResults = JSON.parse(rawText.trim());
    
    cand.aiMatchScore = screenResults.overallMatchPercentage || 75;
    cand.aiEvaluationSummary = screenResults;
    cand.stage = "Screening"; // advance candidate automatically
    
    db.candidates[cIndex] = cand;
    saveDB(db);
    addAuditLog("AI Resume Screener", `Gemini screening completed for candidate ${cand.fullName}. Score: ${cand.aiMatchScore}%`, "AI Recruiter Suite");
    res.json({ success: true, candidate: cand });
    
  } catch (err: any) {
    console.error("Gemini AI Screener failed", err);
    res.status(500).json({ error: "Gemini screening tool error: " + err.message });
  }
});

// Custom Screening endpoint used by ResumeScreening.tsx
app.post("/api/recruitment/screen-resume", async (req, res) => {
  const { candidateId, customResumeText } = req.body;
  const db = getDB();
  const cIndex = db.candidates.findIndex((c) => c.candidateId === candidateId);
  if (cIndex === -1) return res.status(404).json({ error: "Candidate not found." });
  
  const cand = db.candidates[cIndex];
  const job = db.jobs.find((j) => j.jobId === cand.jobId);
  const jobRequirements = job ? job.requirements : "General professional skills";
  
  const resumeContentToAnalyze = customResumeText || cand.resumeText || `
    Candidate: ${cand.fullName}
    Contact: ${cand.email} / ${cand.phone}
    Technical Background: MCA graduate, 6 years expert development, core systems builder, Node.js, AWS, react developer.
  `;
  
  if (!ai) {
    // offline backup simulation
    const matchScore = 85;
    const analysis = {
      strengths: ["Strong computer science background", "6 years software systems development", "Good Node.js/React proficiency"],
      weaknesses: ["No direct cloud scaling proof", "Brief UI portfolio in resume"],
      recommendation: "Highly recommended for engineering evaluation interview."
    };
    cand.aiMatchScore = matchScore;
    cand.aiEvaluationSummary = {
      candidateName: cand.fullName,
      skillsScore: 85,
      experienceScore: 85,
      educationScore: 90,
      overallMatchPercentage: matchScore,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      hiringRecommendation: analysis.recommendation
    };
    db.candidates[cIndex] = cand;
    saveDB(db);
    addAuditLog("AI Resume Screener", `Simulated screen completed for candidate ${cand.fullName}`, "AI Recruiter Suite");
    return res.json({
      success: true,
      matchScore,
      analysis,
      analysisRaw: JSON.stringify(analysis, null, 2)
    });
  }
  
  try {
    const prompt = `
      You are an expert AI recruiter screening executive candidates. 
      Examine the Candidate Resume text against the targeted Job Requirements and yield a complete matching evaluation.
      
      Job Title: ${job?.title || "Corporate Role"}
      Job Requirements: ${jobRequirements}
      
      Candidate Resume Content:
      ${resumeContentToAnalyze}
      
      Generate a structured JSON output mapping EXACTLY the following keys:
      - candidateName (String)
      - skillsScore (Number from 0 to 100)
      - experienceScore (Number from 0 to 100)
      - educationScore (Number from 0 to 100)
      - overallMatchPercentage (Calculated float or integer from 0 to 100)
      - strengths (Array of strings, at least 3 points)
      - weaknesses (Array of strings, at least 2 points)
      - hiringRecommendation (Sentence conclusion e.g., 'Highly recommended to interview stage.')
      
      Return ONLY clean raw compliant JSON string. No extra wrapper wording.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    
    const rawText = response.text || "{}";
    const screenResults = JSON.parse(rawText.trim());
    
    const matchScore = screenResults.overallMatchPercentage || 75;
    const analysis = {
      strengths: screenResults.strengths || ["Skills match job requirements", "Strong profile background"],
      weaknesses: screenResults.weaknesses || ["Few professional enterprise logs"],
      recommendation: screenResults.hiringRecommendation || "Proceed with interview."
    };
    
    cand.aiMatchScore = matchScore;
    cand.aiEvaluationSummary = screenResults;
    if (cand.stage === "Applied") {
      cand.stage = "Screening"; // advance automatically
    }
    
    db.candidates[cIndex] = cand;
    saveDB(db);
    addAuditLog("AI Resume Screener", `Gemini screening completed for candidate ${cand.fullName}. Score: ${cand.aiMatchScore}%`, "AI Recruiter Suite");
    
    res.json({
      success: true,
      matchScore,
      analysis,
      analysisRaw: rawText
    });
    
  } catch (err: any) {
    console.error("Gemini AI Screener failing", err);
    res.status(500).json({ error: "Gemini screening tool error: " + err.message });
  }
});

// Update candidate stage
app.post(["/api/recruitment/candidates/stage", "/api/recruitment/candidates/update-stage"], (req, res) => {
  const { candidateId, stage } = req.body;
  const db = getDB();
  const idx = db.candidates.findIndex((c) => c.candidateId === candidateId);
  if (idx !== -1) {
    const oldStage = db.candidates[idx].stage;
    db.candidates[idx].stage = stage;
    saveDB(db);
    addAuditLog("Candidate Tracked", `Candidate ${db.candidates[idx].fullName} advanced from ${oldStage} to ${stage}`, "HR Administrator");
    return res.json({ success: true, candidate: db.candidates[idx] });
  }
  res.status(404).json({ error: "Candidate not found." });
});

// ============================================
// AI VOICE CONVERSATION INTERVIEW (MODULE 9)
// ============================================

app.get("/api/interviews/candidate/:candidateId", (req, res) => {
  const db = getDB();
  const rec = db.interviews.find((i) => i.candidateId === req.params.candidateId);
  res.json(rec || null);
});

// Simulate voice synthesis TTS questions
app.post("/api/ai/tts", async (req, res) => {
  if (!ai) {
    return res.status(400).json({ error: "Gemini API key is not configured inside Secrets." });
  }
  
  const { text } = req.body;
  try {
    // Calling gemini-3.1-flash-tts-preview for single speaker speech generation
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say warmly and clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" }, // 'Kore' is warm and friendly
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ success: true, data: base64Audio });
    }
    res.status(500).json({ error: "Failed to generate TTS audio data from Gemini." });
  } catch (err: any) {
    console.error("Gemini TTS service error", err);
    res.status(500).json({ error: "Gemini Speech generator error: " + err.message });
  }
});

// Chat submission of standard voice interview replies
app.post("/api/interviews/submit-chat", async (req, res) => {
  const { candidateId, userMessage } = req.body;
  const db = getDB();
  
  let interview = db.interviews.find((i) => i.candidateId === candidateId);
  if (!interview) {
    // Seed new interview
    const cand = db.candidates.find((c) => c.candidateId === candidateId);
    interview = {
      interviewId: `INT-${Math.floor(Math.random() * 10000)}`,
      candidateId,
      candidateName: cand ? cand.fullName : "Candidate",
      jobTitle: cand ? cand.jobTitle : "Corporate Vacancy",
      transcript: [
        { speaker: "AI", text: "Welcome to our AI Voice Interview session. Please tell me about a time you demonstrated strict technical design ownership." }
      ],
      status: "Scheduled",
      createdAt: new Date().toISOString(),
    };
    db.interviews.push(interview);
  }
  
  // Add user transcript reply
  interview.transcript.push({ speaker: "Candidate", text: userMessage });
  
  // Decide next question or wrap up
  const transcriptText = interview.transcript.map((t) => `${t.speaker}: ${t.text}`).join("\n");
  
  if (interview.transcript.length >= 8) {
    // 4 rounds complete. Rate the candidate with final evaluation
    interview.status = "Completed";
    
    if (ai) {
      try {
        const ratePrompt = `
          You are an advanced AI candidate assessor evaluating a technical interview simulation.
          Review the chat transcripts between the interviewer and candidate:
          
          ${transcriptText}
          
          Conclude aggregate metrics and ratings. Generate JSON mapping exactly:
          - communicationScore (integer level 60-100)
          - technicalScore (integer level 60-100)
          - confidenceScore (integer level 60-100)
          - nextQuestionOrConclusion (Summary statement of recommendations)
          
          Provide only JSON mapping above.
        `;
        
        const responseLog = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: ratePrompt,
          config: { responseMimeType: "application/json" },
        });
        
        const ratings = JSON.parse(responseLog.text?.trim() || "{}");
        interview.communicationScore = ratings.communicationScore || 82;
        interview.technicalScore = ratings.technicalScore || 85;
        interview.confidenceScore = ratings.confidenceScore || 80;
        interview.finalRecommendation = ratings.nextQuestionOrConclusion || "Solid capabilities. Recommended for HR panel team.";
        
        // Add final concluding system remark
        interview.transcript.push({
          speaker: "AI",
          text: `Thank you, Clarissa. Our interactive session is completed. Your metrics are compiled. Technical Score: ${interview.technicalScore}/100. We will get back to you with the next official stages.`
        });
        
      } catch (err) {
        interview.communicationScore = 80;
        interview.technicalScore = 80;
        interview.confidenceScore = 80;
        interview.finalRecommendation = "Successfully finished interview. Review technical scores manually.";
      }
    } else {
      interview.communicationScore = 85;
      interview.technicalScore = 90;
      interview.confidenceScore = 88;
      interview.finalRecommendation = "Outstanding, standard scores initialized.";
    }
  } else {
    // Generate intelligent continuation question
    if (ai) {
      try {
        const nextPrompt = `
          This is an active voice candidate interview transcript:
          ${transcriptText}
          
          You are leading the interview. Respond as the AI Recruiter. 
          Provide a single, short sentence acknowledging their reply and ask a targeted follow-up question regarding their technical core skills.
        `;
        const responseLog = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: nextPrompt,
        });
        
        interview.transcript.push({ speaker: "AI", text: responseLog.text || "Tell me about another standard project." });
      } catch (err) {
        interview.transcript.push({ speaker: "AI", text: "Great. Can you explain how you handle conflict inside cooperative engineering structures?" });
      }
    } else {
      interview.transcript.push({ speaker: "AI", text: "Could you articulate how you validate and deploy enterprise database systems safely?" });
    }
  }
  
  // Save database transaction
  const idx = db.interviews.findIndex((i) => i.candidateId === candidateId);
  if (idx !== -1) db.interviews[idx] = interview;
  else db.interviews.push(interview);
  
  saveDB(db);
  res.json({ success: true, interview });
});

// ============================================
// CONVERSATIONAL AI HR ASSISTANT (MODULE 10)
// ============================================

app.post("/api/ai/hrms-chatbot", async (req, res) => {
  const { employeeId, message } = req.body;
  const db = getDB();
  
  // Find employee context
  const emp = db.employees.find((e) => e.employeeId === employeeId);
  const employeeLeaves = db.leaves.filter((l) => l.employeeId === employeeId);
  const employeeAttendance = db.attendance.filter((a) => a.employeeId === employeeId);
  const employeePayroll = db.payroll.filter((p) => p.employeeId === employeeId);
  
  // Company Policies Grounding context
  const companyPolicies = `
    - General leaves allowances: Each employee receives 12 Casual Leaves, 12 Sick Leaves, and 15 Earned Leaves per year.
    - Check-in rules: Standard working hours start at 9:00 AM. Checking in past 9:05 AM is recorded as 'Late'.
    - Break allowances: Employees are entitled to 1-hour total break time per day, segmented as required.
    - Payslip releases: Payroll processed drafts are paid on the 1st of every month.
    - Medical Benefits: Standard corporate coverage matches top-level commercial packages with dental riders.
  `;
  
  const promptContext = `
    You are the HR Assistant AI Chatbot for our enterprise portal.
    Your tone must be courteous, supportive, clear, and highly professional.
    
    Context Grounding of Current Employee:
    - Employee Name: ${emp ? emp.fullName : "Staff Member"}
    - Position / Title: ${emp ? emp.designation : "N/A"}
    - Department: ${emp ? emp.department : "N/A"}
    - Base Salary: $${emp ? emp.salary : 0} per month
    - Statutory Leaves recorded: Total of ${employeeLeaves.length} leave requests (Details: ${JSON.stringify(employeeLeaves)})
    - Attendance summary: Total of ${employeeAttendance.length} records.
    - Payroll historical payments: ${JSON.stringify(employeePayroll)}
    
    Institutional Grounding Policies:
    ${companyPolicies}
    
    User Query: ${message}
    
    Synthesize a personalized, precise, and completely accurate response referring directly to their specific stats or leave records where appropriate. If data is absent, state details outline clearly.
  `;
  
  if (!ai) {
    return res.json({ response: "I am running in offline development mode. Setup a real GEMINI_API_KEY inside Settings > Secrets to enable smart corporate help. However, as an placeholder: Your general leave allocation comprises 12 Sick Leaves. You have applied for 1 active leaves." });
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptContext,
    });
    res.json({ response: response.text });
  } catch (err: any) {
    res.status(500).json({ error: "Gemini chatbot failed: " + err.message });
  }
});

// ============================================
// GEMINI HR RISK ANALYTICS (MODULE 12)
// ============================================

app.get("/api/ai/analytics-predictions", async (req, res) => {
  const db = getDB();
  
  const staffRecords = db.employees.map((e) => {
    const leaves = db.leaves.filter((l) => l.employeeId === e.employeeId);
    const attendance = db.attendance.filter((a) => a.employeeId === e.employeeId);
    return {
      fullName: e.fullName,
      department: e.department,
      joiningYear: e.joiningDate.split("-")[0],
      salaryLevel: e.salary,
      pastLeavesCount: leaves.length,
      absentRate: attendance.filter((a) => a.status === "Absent" || a.status === "Late").length,
    };
  });
  
  const analyticsPrompt = `
    You are an expert McKinsey corporate risk auditor & workforce analysis model.
    Analyze this staff dataset of employees to project metrics for corporate planning.
    
    Workforce Dataset:
    ${JSON.stringify(staffRecords)}
    
    Generate predictions mapping strictly:
    - attritionRisk (Array of objects, each detailing "employeeName", "riskScore" from 0 to 100, and short logical "reason")
    - recruitmentForecast (Array of objects detailing "quarterName", "projectedHires", and "focusDepartment")
    - departmentPerformance (Array of objects detailing "departmentName", "efficiencyIndex" from 0 to 100, and "growthOpportunity")
    
    Ensure return value is JSON ONLY. No markdown wrapping.
  `;
  
  if (!ai) {
    // Placeholder fallback safely when offline
    return res.json({
      attritionRisk: [
        { employeeName: "Alexander Mercer", riskScore: 18, reason: "Excellent KPI ratings and consistent high base salary limits risk." },
        { employeeName: "Abigail Stone", riskScore: 45, reason: "Mid-level phone call counts, standard HR recruit load is average." }
      ],
      recruitmentForecast: [
        { quarterName: "2026-Q3", projectedHires: 12, focusDepartment: "Engineering AI" },
        { quarterName: "2026-Q4", projectedHires: 8, focusDepartment: "Human Resources Support" }
      ],
      departmentPerformance: [
        { departmentName: "Engineering", efficiencyIndex: 94, growthOpportunity: "Increase focus on distributed cloud standards." },
        { departmentName: "Human Resources", efficiencyIndex: 88, growthOpportunity: "Modernize manual document verification checklists." }
      ]
    });
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: analyticsPrompt,
      config: { responseMimeType: "application/json" },
    });
    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Gemini risk prediction failed", err);
    res.status(500).json({ error: "Risk analytical engine error: " + err.message });
  }
});

// ============================================
// VOICE INTERVIEW SYNTHESIS ENDPOINTS (MODULE 9 ADDITIONS)
// ============================================

app.post("/api/voice-interview/start", async (req, res) => {
  const { candidateId } = req.body;
  const db = getDB();
  const cand = db.candidates.find((c) => c.candidateId === candidateId);
  
  const greeting = `Welcome ${cand ? cand.fullName : "applicant"}. Thank you for joining this Aether AI Voice Interview session. Please tell me about a time you demonstrated strict technical design ownership inside database or scalable web applications.`;
  
  // Seed the interview in our transcripts Database
  let interview = db.interviews.find((i) => i.candidateId === candidateId);
  if (interview) {
    interview.transcript = [{ speaker: "AI", text: greeting }];
    interview.status = "Scheduled";
  } else {
    interview = {
      interviewId: `INT-${Math.floor(Math.random() * 10000)}`,
      candidateId,
      candidateName: cand ? cand.fullName : "Candidate",
      jobTitle: cand ? cand.jobTitle : "Corporate Vacancy",
      transcript: [{ speaker: "AI", text: greeting }],
      status: "Scheduled",
      createdAt: new Date().toISOString(),
    };
    db.interviews.push(interview);
  }
  saveDB(db);
  
  let audioBase64 = "";
  let audioMimeType = "";
  if (ai) {
    try {
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say warmly and clearly: ${greeting}` }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      });
      const part = ttsResponse.candidates?.[0]?.content?.parts?.[0];
      audioBase64 = part?.inlineData?.data || "";
      audioMimeType = part?.inlineData?.mimeType || "audio/wav";
    } catch (e) {
      console.error("TTS generation inside interview start failed", e);
    }
  }
  
  res.json({
    success: true,
    question: greeting,
    audioBase64,
    audioMimeType
  });
});

app.post("/api/voice-interview/ask", async (req, res) => {
  const { candidateId, lastAnswer } = req.body;
  const db = getDB();
  const cand = db.candidates.find((c) => c.candidateId === candidateId);
  
  let interview = db.interviews.find((i) => i.candidateId === candidateId);
  if (!interview) {
    return res.status(404).json({ error: "Session expired or not started." });
  }
  
  // Append user's last answer to transcript
  interview.transcript.push({ speaker: "Candidate", text: lastAnswer });
  
  const transcriptText = interview.transcript.map((t) => `${t.speaker}: ${t.text}`).join("\n");
  let nextQuestion = "";
  
  if (interview.transcript.length >= 7) {
    // 3 rounds complete (AI, Candidate, AI, Candidate, AI, Candidate, AI). Conclude interview and compute scores.
    interview.status = "Completed";
    nextQuestion = `Thank you, ${cand ? cand.fullName : "applicant"}. Our AI audio interview cycle is complete. We have parsed your responses and compiled your scoring metrics inside our ATS roster. Have a pleasant day!`;
    
    if (ai) {
      try {
        const ratePrompt = `
          You are an advanced AI candidate assessor evaluating a technical interview simulation.
          Review the chat transcripts between the interviewer and candidate:
          
          ${transcriptText}
          
          Conclude aggregate metrics and ratings. Generate JSON mapping exactly:
          - communicationScore (integer level 60-100)
          - technicalScore (integer level 60-100)
          - confidenceScore (integer level 60-100)
          - nextQuestionOrConclusion (Summary statement of recommendations)
          
          Provide only JSON. No triple backticks.
        `;
        
        const responseLog = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: ratePrompt,
          config: { responseMimeType: "application/json" },
        });
        
        const ratings = JSON.parse(responseLog.text?.trim() || "{}");
        interview.communicationScore = ratings.communicationScore || 85;
        interview.technicalScore = ratings.technicalScore || 85;
        interview.confidenceScore = ratings.confidenceScore || 85;
        interview.finalRecommendation = ratings.nextQuestionOrConclusion || "Solid capabilities demonstrated. Highly recommended next stage.";
      } catch (err) {
        interview.communicationScore = 80;
        interview.technicalScore = 80;
        interview.confidenceScore = 82;
        interview.finalRecommendation = "Successfully finished interview. Verify answers manually.";
      }
    } else {
      interview.communicationScore = 85;
      interview.technicalScore = 88;
      interview.confidenceScore = 85;
      interview.finalRecommendation = "Promising candidates demonstrating clean coding skills.";
    }
  } else {
    // Generate follow-up question
    if (ai) {
      try {
        const nextPrompt = `
          This is an active voice candidate interview transcript:
          ${transcriptText}
          
          You are leading the interview. Respond as the AI Recruiter. 
          Provide a single, short sentence acknowledging their reply and ask a single targeted follow-up question regarding their technical core skills, experience, or engineering methods. Keep your question concise.
        `;
        const responseLog = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: nextPrompt,
        });
        nextQuestion = responseLog.text?.trim() || "Thank you. Can you describe how you perform automated unit testing in your packages?";
      } catch (e) {
        nextQuestion = "Thank you. Can you expand on how you maintain unit test coverage inside multi-module repositories?";
      }
    } else {
      nextQuestion = "Thank you. Can you detail your experience deploying containerized microservices to cloud architectures with high availability?";
    }
  }
  
  interview.transcript.push({ speaker: "AI", text: nextQuestion });
  
  // Save to database
  const idx = db.interviews.findIndex((i) => i.candidateId === candidateId);
  if (idx !== -1) db.interviews[idx] = interview;
  else db.interviews.push(interview);
  saveDB(db);
  
  // Generate Sound question base64
  let audioBase64 = "";
  let audioMimeType = "";
  if (ai) {
    try {
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say warmly and clearly: ${nextQuestion}` }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      });
      const part = ttsResponse.candidates?.[0]?.content?.parts?.[0];
      audioBase64 = part?.inlineData?.data || "";
      audioMimeType = part?.inlineData?.mimeType || "audio/wav";
    } catch (e) {
      console.error("TTS generation inside interview ask follow-up failed", e);
    }
  }
  
  res.json({
    success: true,
    question: nextQuestion,
    audioBase64,
    audioMimeType
  });
});

// ============================================
// CONVERSATIONAL ASSISTANT COMPATIBILITY ENDPOINT (MODULE 10 ADDITIONS)
// ============================================

app.post("/api/assistant/chat", async (req, res) => {
  const { message } = req.body;
  const db = getDB();
  
  // Use EMP-005 (Alexander Mercer) as the logged-in staff context
  const employeeId = "EMP-005";
  const emp = db.employees.find((e) => e.employeeId === employeeId);
  const employeeLeaves = db.leaves.filter((l) => l.employeeId === employeeId);
  const employeeAttendance = db.attendance.filter((a) => a.employeeId === employeeId);
  const employeePayroll = db.payroll.filter((p) => p.employeeId === employeeId);
  
  const companyPolicies = `
    - General leaves allowances: Each employee receives 12 Casual Leaves, 12 Sick Leaves, and 15 Earned Leaves per year.
    - Check-in rules: Standard working hours start at 9:00 AM. Checking in past 9:05 AM is recorded as 'Late'.
    - Break allowances: Employees are entitled to 1-hour total break time per day, segmented as required.
    - Payslip releases: Payroll processed drafts are paid on the 1st of every month.
    - Medical Benefits: Standard corporate coverage matches top-level commercial packages with dental riders.
  `;
  
  const promptContext = `
    You are the HR Assistant AI Chatbot for our enterprise portal operating under Aether.
    Your tone must be courteous, supportive, clear, and highly professional.
    
    Context Grounding of Current Employee:
    - Employee Name: ${emp ? emp.fullName : "Alexander Mercer"}
    - Position / Title: ${emp ? emp.designation : "Staff Software Engineer"}
    - Department: ${emp ? emp.department : "Engineering"}
    - Base Salary: $${emp ? emp.salary : 9500} per month
    - Statutory Leaves recorded: Total of ${employeeLeaves.length} leave requests (Details: ${JSON.stringify(employeeLeaves)})
    - Attendance summary: Total of ${employeeAttendance.length} records.
    - Payroll historical payments: ${JSON.stringify(employeePayroll)}
    
    Institutional Grounding Policies:
    ${companyPolicies}
    
    User Query: ${message}
    
    Synthesize a personalized, precise, and completely accurate response referring directly to their specific stats or leave records where appropriate. If data is absent, state details outline clearly.
  `;
  
  if (!ai) {
    return res.json({
      success: true,
      reply: `I am running in offline development mode. Setup a real GEMINI_API_KEY inside Settings to enable live policy searches. However, as a mock briefing: Your current records list Staff designation: ${emp?.designation || "Staff Software Engineer"}, Department: ${emp?.department || "Engineering"}, with 12 Casual and 12 Sick leaves annually.`
    });
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptContext,
    });
    res.json({ success: true, reply: response.text });
  } catch (err: any) {
    console.error("Gemini chatbot error", err);
    res.json({
      success: true,
      reply: "The corporate AI chatbot gateway is experiences brief latency. General rule of thumb regarding leaves remains: 12 sick leaves, 12 casual leaves, 15 earned leaves allocated annually."
    });
  }
});

// ============================================
// HR ANALYTICS FORECAST COMPATIBILITY ENDPOINT (MODULE 12 ADDITIONS)
// ============================================

app.post("/api/analytics/predict", async (req, res) => {
  const db = getDB();
  
  const staffRecords = db.employees.map((e) => {
    const leaves = db.leaves.filter((l) => l.employeeId === e.employeeId);
    const attendance = db.attendance.filter((a) => a.employeeId === e.employeeId);
    return {
      fullName: e.fullName,
      department: e.department,
      joiningYear: e.joiningDate.split("-")[0],
      salaryLevel: e.salary,
      pastLeavesCount: leaves.length,
      absentRate: attendance.filter((a) => a.status === "Absent" || a.status === "Late").length,
    };
  });
  
  if (!ai) {
    return res.json({
      success: true,
      prediction: {
        attritionRiskForecast: "LOW",
        strategicMetrics: [
          "At-Risk Roles: Special attention needed to Engineering department due to tech market demand variance.",
          "Stability: Strategic management structures remain extremely solid with 95% + loyalty indices.",
          "Compensation Index: Base payroll scales align with tier-1 corporate indexes."
        ],
        summary: "The corporation shows strong structural stability. Staff retention scores remain exceptionally high with very low attrition threats forecasted over the next 2 quarters."
      }
    });
  }
  
  try {
    const analyticsPrompt = `
      You are an expert McKinsey workforce auditor.
      Analyze this staff dataset of employees to project attrition risk trends and personnel metrics for corporate strategic planning.
      
      Workforce Dataset:
      ${JSON.stringify(staffRecords)}
      
      Generate a prediction JSON mapping strictly:
      - attritionRiskForecast (E.g. 'LOW', 'MEDIUM', 'HIGH')
      - strategicMetrics (Array of strings, at least 3 bullet points of strategic insights or advisories)
      - summary (A paragraph summary of predictions)
      
      Verify compliance to return JSON ONLY.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: analyticsPrompt,
      config: { responseMimeType: "application/json" },
    });
    
    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json({
      success: true,
      prediction: {
        attritionRiskForecast: parsed.attritionRiskForecast || "LOW",
        strategicMetrics: parsed.strategicMetrics || [
          "Engineering retains strong integrity with negligible attrition scores.",
          "General support units are functioning with 92% efficiency index levels."
        ],
        summary: parsed.summary || "Workforce metrics project steady department scaling with robust stability index ratings."
      }
    });
  } catch (err: any) {
    console.error("Gemini analytics run failed", err);
    res.json({
      success: true,
      prediction: {
        attritionRiskForecast: "LOW",
        strategicMetrics: [
          "Staff loyalty indices remains high.",
          "Statutory calculations verify regular payroll release safety."
        ],
        summary: "Model processing returned general enterprise compliance stability."
      }
    });
  }
});

// Serve frontend assets in production or mount dev server in integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise Full-Stack HRMS Backend running on http://localhost:${PORT}`);
  });
}

startServer();
