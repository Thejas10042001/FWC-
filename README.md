# Aether Enterprise HRMS: Next-Generation AI-Powered Human Resource Management System

Aether HRMS is a comprehensive, state-of-the-art enterprise Human Resource Management System powered by Gemini large language models. The system optimizes and automates HR operations—from resume screening, interactive voice interviews, and automatic performance reviews to real-time attendance, leave requests, and payroll cycles.

---

## 🚀 Key Features

* **AI Resume Screening**: Upload resumes and screen candidates automatically against job requirements using Gemini. Generates scores and full SWOT matrices without human bias.
* **AI Voice-Interviews with TTS**: Seamless integration with voice-based interactive candidate assessments, simulating conversational Q&A and analyzing soft and hard skills with audio responses.
* **Intelligent Appraisals**: Multi-role performance monitoring, KPIs adjustments, and automatic manager feedback synthesis powered by Gemini.
* **HR Assistant Chat chatbot**: A context-grounded AI conversational assistant optimized to answer policy, leaves, payroll, and corporate compliance queries instantly.
* **Real-time Attendance Gate**: Accommodates check-ins, check-outs, and active breaks monitoring.
* **End-to-End Payroll Management**: Fully operable cycles, historical slips, and automated disbursal tracking.
* **Personalized Dashboard Architecture**: Tailored responsive layouts depending on user role.

---

## 🔑 Login Credentials

The system supports a **Multi-Role Login system**. Each role accesses personalized dashboard interfaces and actions.

You may use the following credentials or the **"Quick Login/Access"** buttons on the login screen:

| Role Name | Email Address | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@company.com` | `password123` | Full global setup, system logs, master overrides. |
| **Management Admin** | `management@company.com` | `password123` | Workforce analysis, company analytics, department metrics. |
| **Senior Manager** | `manager@company.com` | `password123` | KPI setups, appraisals review, leaves approvals. |
| **HR Recruiter** | `hr@company.com` | `password123` | Publish job vacancies, resume screen, start interviews. |
| **Employee**| `employee@company.com` | `password123` | View payslips, log check-in/out & break times, leave applications. |

---

## 🛠️ Local Development & Setup Instructions

To get the application up and running on your local machine, follow the steps below:

### 1. Prerequisites
Ensure you have the following installed onto your system:
* [Node.js](https://nodejs.org/) (Version v18.0.0 or higher is recommended)
* [npm](https://www.npmjs.com/) (usually bundles automatically with Node.js)

### 2. Clone the Repository
```bash
git clone <your-repository-url>
cd Aether-HRMS
```

### 3. Install Dependencies
Install all required client and backend server pack dependencies:
```bash
npm install
```

### 4. Configuration & Environment Variables
Copy `.env.example` into a new `.env` file at the root:
```bash
cp .env.example .env
```

Open `.env` and configure your keys:
```env
# Optional: Add your Google Gemini API key to enable live AI screening, voice interview synthesis, and chatbot policies
# If left blank, the application gracefully operates in a simulated sandbox fallback mode.
GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Running the Developer Server
Start the Express + Vite server with Hot Module Replacement and live typescript execution:
```bash
npm run dev
```
The server will bind and become accessible at:
👉 **`http://localhost:3000`**

### 6. Building and Starting in Production
To compile and bundle optimized static front-end assets with the lightweight bundled backend:
```bash
# Clean previous builds and bundle compiled output
npm run build

# Start the compiled production-ready server
npm run start
```

---

## 📁 Source Code Structure

* `/server.ts` - Master Express API service layer compiling Gemini integration flows, DB operations, and static file routers.
* `/src/App.tsx` - Root navigation and master state router coordinating role structures.
* `/src/components/` - Highly polished modular user interfaces:
  - `Auth.tsx` - Interface handling credentials validations and roles delegation.
  - `Dashboards.tsx` - Adaptive analytics reporting panels (Company global charts or personal metrics).
  - `EmployeeManagement.tsx` - Full roster monitoring and document store records.
  - `AttendanceManagement.tsx` - Automated timers and breaks management interface.
  - `LeaveManagement.tsx` - Multi-tier workflows for leave requests.
  - `PayrollManagement.tsx` - Disbursements calculator and audit logs.
  - `PerformanceManagement.tsx` - Performance management dashboard.
  - `RecruitmentATS.tsx` - Direct applicants tracking pipeline.
  - `ResumeScreening.tsx` - Gemini-backed evaluation screen.
  - `VoiceInterview.tsx` - Sound interview simulator with speech synthesis.
  - `HRAssistant.tsx` - Conversational policy briefing center.
  - `AIAnalyticsView.tsx` - Predictive strategic metrics.
* `/src/data/db.json` - Active local JSON database backing secure, persistent records.

---

## 💡 AI Simulation Mode
When running the website without a `GEMINI_API_KEY` defined inside `.env`, the system automatically activates a fallback sandbox. All resume screens, mock interviews, performance scores, and policy chatbot queries execute with pre-programmed mock JSON structures so you can fully explore the platform features immediately!
