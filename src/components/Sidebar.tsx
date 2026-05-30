import React from "react";
import { UserRole, UserProfile } from "../types";
import { 
  Building2, 
  CalendarRange, 
  Clock, 
  LogOut, 
  Menu, 
  Mic, 
  TrendingUp, 
  User, 
  Users, 
  Wallet, 
  Cpu, 
  FileSearch, 
  Sparkles, 
  X,
  MessageSquare,
  ShieldCheck,
  Award
} from "lucide-react";

interface SidebarProps {
  user: UserProfile;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLogout: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ 
  user, 
  currentTab, 
  setCurrentTab, 
  onLogout, 
  mobileOpen, 
  setMobileOpen 
}: SidebarProps) {
  
  // Define available tabs based on role
  const getTabsForRole = (role: UserRole) => {
    const common = [
      { id: "dashboard", label: "Dashboard", icon: Building2 },
      { id: "attendance", label: "My Attendance", icon: Clock },
      { id: "leaves", label: "Leaves Manager", icon: CalendarRange },
      { id: "kpis", label: "Performances Goals", icon: Award },
    ];

    if (role === "Employee") {
      return [
        ...common,
        { id: "chatbot", label: "AI HR HelpDesk", icon: MessageSquare },
      ];
    }

    if (role === "HR Recruiter") {
      return [
        { id: "dashboard", label: "HR Dashboard", icon: Building2 },
        { id: "directory", label: "Staff Directory", icon: Users },
        { id: "attendance", label: "Attendance Portal", icon: Clock },
        { id: "leaves", label: "Leaves Approvals", icon: CalendarRange },
        { id: "payroll", label: "Payroll Processing", icon: Wallet },
        { id: "ats", label: "Recruitment ATS", icon: FileSearch },
        { id: "screening", label: "AI Resume Screen", icon: Cpu },
        { id: "voice_interview", label: "AI Voice Interviews", icon: Mic },
        { id: "chatbot", label: "AI HelpDesk Portal", icon: MessageSquare },
      ];
    }

    if (role === "Senior Manager") {
      return [
        { id: "dashboard", label: "Squad Dashboard", icon: Building2 },
        { id: "directory", label: "Squad Directory", icon: Users },
        { id: "attendance", label: "Squad Attendance", icon: Clock },
        { id: "leaves", label: "Leaves Workflows", icon: CalendarRange },
        { id: "kpis", label: "KPIs & Assessments", icon: Award },
        { id: "voice_interview", label: "AI Candidate Reviews", icon: Mic },
        { id: "chatbot", label: "AI Assistant", icon: MessageSquare },
      ];
    }

    if (role === "Management Admin") {
      return [
        { id: "dashboard", label: "Management Desks", icon: Building2 },
        { id: "directory", label: "Enterprise Directory", icon: Users },
        { id: "payroll", label: "Budget & Cashflow", icon: Wallet },
        { id: "analytics", label: "AI Corporate Analytics", icon: TrendingUp },
        { id: "chatbot", label: "AI HelpDesk", icon: MessageSquare },
      ];
    }

    // Super Admin gets access to absolutely everything to run diagnostics
    return [
      { id: "dashboard", label: "SuperAdmin Deck", icon: ShieldCheck },
      { id: "directory", label: "Global Directory", icon: Users },
      { id: "attendance", label: "Global Attendance", icon: Clock },
      { id: "leaves", label: "Global Leaves", icon: CalendarRange },
      { id: "payroll", label: "Global Payroll Desk", icon: Wallet },
      { id: "kpis", label: "Strategic Review", icon: Award },
      { id: "ats", label: "Enterprise ATS", icon: FileSearch },
      { id: "screening", label: "AI Resume Screening", icon: Cpu },
      { id: "voice_interview", label: "AI Speech Sandbox", icon: Mic },
      { id: "analytics", label: "AI Analytics Insights", icon: TrendingUp },
      { id: "chatbot", label: "Institutional AI Bot", icon: MessageSquare },
    ];
  };

  const tabs = getTabsForRole(user.role);

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 font-sans border-r border-slate-800">
      {/* Title */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800 shrink-0">
        <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center text-slate-900 shadow font-bold">
          Æ
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-widest uppercase">
            AETHER HRMS
          </h1>
          <span className="text-[10px] font-semibold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full mt-1 inline-block">
            {user.role} v2.5
          </span>
        </div>
      </div>

      {/* User Card */}
      <div className="px-6 py-4 border-b border-slate-800/60 flex items-center gap-3 bg-slate-950/20">
        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 font-semibold text-slate-100 uppercase">
          {user.name.charAt(0)}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-semibold text-white truncate">{user.name}</p>
          <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
        </div>
      </div>

      {/* Tab Navigation links */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="px-2 pb-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          Aviation Modules
        </div>
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium tracking-wide transition duration-150 ${
                isActive 
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700/60" 
                  : "hover:bg-slate-800/45 hover:text-slate-100"
              }`}
            >
              <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? "text-teal-400" : "text-slate-400"}`} />
              <span className="truncate">{tab.label}</span>
              {tab.id.includes("ai") || tab.id === "screening" || tab.id === "voice_interview" || tab.id === "chatbot" ? (
                <Sparkles className="h-3 w-3 text-teal-400 ml-auto animate-pulse" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Sign Out drawer bottom */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/20 text-xs font-semibold text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 transition duration-150 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Terminate Session
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar drawer */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          {/* Overlay background */}
          <div 
            className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900">
            {/* Close button Drawer */}
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setMobileOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
