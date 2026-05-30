export type UserRole = 'Super Admin' | 'Management Admin' | 'Senior Manager' | 'HR Recruiter' | 'Employee';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Employee {
  employeeId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  department: string;
  designation: string;
  managerId: string; // Employee ID of manager
  joiningDate: string;
  salary: number;
  employmentStatus: 'Active' | 'On Leave' | 'Suspended' | 'Terminated';
  resumeUrl?: string;
  aadhaarUrl?: string;
  panUrl?: string;
}

export interface Attendance {
  attendanceId: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // ISO String
  checkOutTime?: string; // ISO String
  breakStartTime?: string; // ISO String
  totalMinutesOnBreak: number;
  totalMinutesWorked: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half-Day';
}

export interface LeaveRequest {
  leaveId: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Maternity Leave';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  managerApproval: 'Pending' | 'Approved' | 'Rejected';
  hrApproval: 'Pending' | 'Approved' | 'Rejected';
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface PayrollRecord {
  payrollId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  month: string; // YYYY-MM
  baseSalary: number;
  allowances: number;
  pfDeduction: number;
  esiDeduction: number;
  taxDeduction: number;
  netSalary: number;
  status: 'Draft' | 'Processed' | 'Paid';
  processedAt?: string;
}

export interface PerformanceRecord {
  performanceId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  quarter: string; // e.g., '2026-Q1'
  kpis: string; // Description of goals
  selfRating?: number; // 1 to 5
  selfReview?: string;
  managerRating?: number; // 1 to 5
  managerReview?: string;
  rating?: number;
  aiSummary?: string;
  aiSuggestions?: string;
  aiTraining?: string;
  reviewedAt?: string;
}

export interface JobVacancy {
  jobId: string;
  title: string;
  department: string;
  description: string;
  requirements: string;
  experienceRange: string;
  salaryRange?: string;
  status: 'Draft' | 'Open' | 'Closed';
  createdAt: string;
}

export interface Candidate {
  candidateId: string;
  jobId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  resumeUrl?: string;
  resumeText?: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
  appliedAt: string;
  aiMatchScore?: number; // 0 - 100
  aiEvaluationSummary?: {
    candidateName: string;
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
    overallMatchPercentage: number;
    strengths: string[];
    weaknesses: string[];
    hiringRecommendation: string;
  };
}

export interface InterviewRecord {
  interviewId: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  transcript: { speaker: 'AI' | 'Candidate'; text: string; audioUrl?: string }[];
  communicationScore?: number;
  technicalScore?: number;
  confidenceScore?: number;
  finalRecommendation?: string;
  status: 'Scheduled' | 'Completed';
  createdAt: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  payrollCost: number;
  pendingLeaves: number;
  openJobs: number;
  totalCandidates: number;
  selectionRate: number;
}
