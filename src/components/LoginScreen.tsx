import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, WorkspaceType, Organization } from '../types';
import { drishtiDataService } from '../services/drishtiDataService';
import { INITIAL_ORGANIZATIONS } from '../data/demo/seedData';
import {
  Shield,
  Building2,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Search,
  Award,
  AlertTriangle,
  BadgeCheck,
  Briefcase,
  TrendingUp,
  Layers,
  FileText,
  Activity,
  Lock,
  Compass,
  ArrowRight,
  Eye,
  Camera,
  Check
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('GOVERNMENT_OFFICIAL');
  const [selectedTab, setSelectedTab] = useState<WorkspaceType>('GOVERNMENT');

  // NGO Workspace: Institution Selection
  const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('org-01');
  const [orgSearchQuery, setOrgSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchOrgs = async () => {
      const orgs = await drishtiDataService.getOrganizations();
      if (orgs && orgs.length > 0) {
        setAvailableOrgs(orgs);
      } else {
        setAvailableOrgs(INITIAL_ORGANIZATIONS);
      }
    };
    fetchOrgs();
  }, []);

  const allOrganizations = availableOrgs.length > 0 ? availableOrgs : INITIAL_ORGANIZATIONS;

  const filteredOrgs = allOrganizations.filter(org => {
    if (!orgSearchQuery.trim()) return true;
    const q = orgSearchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(q) ||
      org.darpanId?.toLowerCase().includes(q) ||
      org.location.district?.toLowerCase().includes(q) ||
      org.location.state?.toLowerCase().includes(q) ||
      org.type.toLowerCase().includes(q)
    );
  });

  const selectedOrg = allOrganizations.find(o => o.id === selectedOrgId) || allOrganizations[0];

  const roleOptions: Record<WorkspaceType, { role: UserRole; title: string; subtitle: string; tag: string }[]> = {
    GOVERNMENT: [
      {
        role: 'SUPER_ADMIN',
        title: 'Director General (Super Admin)',
        subtitle: 'State oversight, policy sanctions, system configuration, and audit logs.',
        tag: 'Super Admin'
      },
      {
        role: 'GOVERNMENT_OFFICIAL',
        title: 'Joint Secretary / Monitoring Officer',
        subtitle: 'Scheme evaluations, inspection scheduling, surprise audits, risk review & compliance notices.',
        tag: 'Monitoring Officer'
      },
      {
        role: 'PMU_OFFICIAL',
        title: 'PMU Evaluation Officer',
        subtitle: 'Milestone validation, progress analytics, and statutory reporting verification.',
        tag: 'PMU Officer'
      }
    ],
    NGO: [
      {
        role: 'NGO_ADMIN',
        title: 'Managing Trustee / Chief Executive',
        subtitle: selectedOrg
          ? `Authorized signatory for ${selectedOrg.name}. Milestone reporting, utilization submissions, and compliance rectification.`
          : 'Milestone reporting, utilization submissions, and compliance rectification.',
        tag: 'Implementing Head'
      },
      {
        role: 'NGO_STAFF',
        title: 'Field Project Coordinator',
        subtitle: selectedOrg
          ? `Operational coordinator for ${selectedOrg.name}. Beneficiary attendance logs and physical progress documentation.`
          : 'Beneficiary attendance logs and physical progress documentation.',
        tag: 'Field Coordinator'
      }
    ],
    INSPECTOR: [
      {
        role: 'FIELD_INSPECTOR',
        title: 'Field Quality Monitor (FQM)',
        subtitle: 'Rajesh Verma (Badge MP-INSP-4081): GPS geofence verification, checklist execution, evidence camera & findings.',
        tag: 'Field Monitor'
      },
      {
        role: 'SENIOR_INSPECTOR',
        title: 'Senior Technical Auditor',
        subtitle: 'Priya Nair (Badge MP-INSP-3912): Civil infrastructure audit, testing logs, and critical finding reports.',
        tag: 'Technical Auditor'
      },
      {
        role: 'INSPECTION_SUPERVISOR',
        title: 'Zonal Inspection Supervisor',
        subtitle: 'Amit Bundela (Badge MP-INSP-5120): Unannounced surprise inspections and inter-district monitoring.',
        tag: 'Zonal Supervisor'
      }
    ]
  };

  const handleSelectWorkspaceTab = (ws: WorkspaceType) => {
    setSelectedTab(ws);
    setSelectedRole(roleOptions[ws][0].role);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTab === 'NGO' && selectedOrg) {
      await login(selectedRole, {
        orgId: selectedOrg.id,
        orgName: selectedOrg.name
      });
    } else {
      await login(selectedRole);
    }
  };

  const handleQuickLaunch = async (workspace: WorkspaceType) => {
    if (workspace === 'GOVERNMENT') {
      await login('GOVERNMENT_OFFICIAL');
    } else if (workspace === 'NGO') {
      await login('NGO_ADMIN', {
        orgId: selectedOrg?.id || 'org-01',
        orgName: selectedOrg?.name || 'Gramin Vikas Sahayog Trust'
      });
    } else if (workspace === 'INSPECTOR') {
      await login('FIELD_INSPECTOR');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1F2937] flex flex-col font-sans selection:bg-[#174A73]/10 selection:text-[#174A73]">
      {/* National Tricolor Top Ribbon */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808] sticky top-0 z-50 shadow-2xs" />

      {/* Official Government Navigation Header */}
      <header className="bg-white border-b border-[#E2E5E9] sticky top-1.5 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          {/* Identity & Emblem */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#174A73] flex items-center justify-center font-bold text-white text-lg shadow-2xs flex-shrink-0">
              दृ
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl text-[#174A73] tracking-tight">DRISHTI</span>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-blue-50 text-[#174A73] border border-blue-200">
                  Government of India
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] font-medium hidden sm:block">
                Digital Reporting, Inspection & Statutory Holistic Tracking Interface
              </p>
            </div>
          </div>

          {/* Quick Nav Links & Direct Access CTA */}
          <div className="flex items-center space-x-3 sm:space-x-5 text-xs">
            <nav className="hidden md:flex items-center space-x-6 text-[#475569] font-medium">
              <button
                type="button"
                onClick={() => scrollToSection('three-portals')}
                className="hover:text-[#174A73] transition cursor-pointer"
              >
                Three Portals
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('key-pillars')}
                className="hover:text-[#174A73] transition cursor-pointer"
              >
                Pillars & Architecture
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('national-metrics')}
                className="hover:text-[#174A73] transition cursor-pointer"
              >
                National Scale
              </button>
            </nav>

            <button
              type="button"
              onClick={() => scrollToSection('portal-access')}
              className="px-4 py-2 rounded-lg bg-[#174A73] hover:bg-[#123859] text-white font-semibold text-xs flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
            >
              <span>Portal Sign-In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Landing Page Content */}
      <main className="flex-1 flex flex-col">
        {/* =========================================================================
            1. HERO SECTION: Official Mission & 3 Primary Gateways
           ========================================================================= */}
        <section className="bg-gradient-to-b from-white via-blue-50/20 to-[#F7F8FA] border-b border-[#E2E5E9] py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mb-10">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#174A73] text-xs font-semibold mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Centralized Oversight & Field Quality Audit System</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1F2937] tracking-tight leading-tight">
                National Real-Time Monitoring & Physical Verification Platform
              </h1>
              <p className="text-sm sm:text-base text-[#64748B] mt-4 leading-relaxed font-normal">
                Connecting Central Ministries, Empaneled Implementing NGOs, and Certified Field Quality Monitors (FQMs) with GPS geofencing, milestone-linked PFMS fund tracking, and surprise field inspections.
              </p>
            </div>

            {/* Three Primary Gateway Cards (One-Click Launchers) */}
            <div id="three-portals" className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Pillar 1: Government Command Center */}
              <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-[#174A73] transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#174A73] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Shield className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#174A73] border border-blue-200">
                      Oversight & Policy
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#1F2937] group-hover:text-[#174A73] transition-colors">
                    Government Command Center
                  </h2>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Central authority dashboard for Joint Secretaries, Directors, and PMU officers. National GIS surveillance, financial outlays, surprise squad dispatches, and compliance directives.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-[#475569]">
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                      <span>GIS Geo-spatial intelligence map</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                      <span>PFMS expenditure and release tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                      <span>Surprise unannounced inspection orders</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-6 mt-6 border-t border-[#F1F5F9]">
                  <button
                    type="button"
                    onClick={() => handleQuickLaunch('GOVERNMENT')}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#174A73] hover:bg-[#123859] text-white font-semibold text-xs flex items-center justify-center space-x-2 transition shadow-2xs cursor-pointer"
                  >
                    <span>Launch Government Portal</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-center text-[#94A3B8] mt-1.5">
                    Default: Arvind Sen (Joint Secretary)
                  </p>
                </div>
              </div>

              {/* Pillar 2: NGO / Institution Portal */}
              <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-[#174A73] transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[#16A34A] border border-emerald-200">
                      Implementation
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#1F2937] group-hover:text-[#174A73] transition-colors">
                    NGO / Institution Portal
                  </h2>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Dedicated workspace for empaneled organizations, trusts, and implementing agencies. Milestone progress documentation, beneficiary attendance, and compliance responses.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-[#475569]">
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                      <span>Physical milestone evidence submission</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                      <span>Fund utilization certificates (UC)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                      <span>Rectification reports for show-cause notices</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-6 mt-6 border-t border-[#F1F5F9]">
                  <button
                    type="button"
                    onClick={() => handleQuickLaunch('NGO')}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-emerald-50 text-[#16A34A] border border-emerald-300 font-semibold text-xs flex items-center justify-center space-x-2 transition shadow-2xs cursor-pointer"
                  >
                    <span>Launch NGO Portal</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-center text-[#94A3B8] mt-1.5">
                    Default: Gramin Vikas Sahayog Trust
                  </p>
                </div>
              </div>

              {/* Pillar 3: Field Inspector Workspace */}
              <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-[#174A73] transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-200">
                      Ground Truth
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#1F2937] group-hover:text-[#174A73] transition-colors">
                    Field Quality Inspector
                  </h2>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Mobile-optimized field auditing tool for certified FQMs and Technical Auditors. Geofence verification within 200m, digital checklists, photo evidence capture, and deficiency reports.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-[#475569]">
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                      <span>GPS RTK Geofence lock (200m proximity)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                      <span>Standard technical parameter checklists</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                      <span>Timestamped photo evidence & findings</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-6 mt-6 border-t border-[#F1F5F9]">
                  <button
                    type="button"
                    onClick={() => handleQuickLaunch('INSPECTOR')}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-amber-50 text-[#D97706] border border-amber-300 font-semibold text-xs flex items-center justify-center space-x-2 transition shadow-2xs cursor-pointer"
                  >
                    <span>Launch Inspector Tool</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-center text-[#94A3B8] mt-1.5">
                    Default: Rajesh Verma (FQM Badge MP-INSP-4081)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. NATIONAL SCALE & AUDIT METRICS BANNER
           ========================================================================= */}
        <section id="national-metrics" className="bg-white border-b border-[#E2E5E9] py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
              <div className="border-l-2 border-[#174A73] pl-4">
                <span className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider block">
                  Monitored Outlay
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#174A73] mt-1">
                  ₹248.5 Cr
                </div>
                <span className="text-[10px] text-[#94A3B8] mt-0.5 block">
                  Synchronized with PFMS
                </span>
              </div>

              <div className="border-l-2 border-[#16A34A] pl-4">
                <span className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider block">
                  Empaneled NGOs
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] mt-1">
                  14
                </div>
                <span className="text-[10px] text-[#94A3B8] mt-0.5 block">
                  NGO Darpan Verified
                </span>
              </div>

              <div className="border-l-2 border-[#2563EB] pl-4">
                <span className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider block">
                  Active Projects
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] mt-1">
                  38
                </div>
                <span className="text-[10px] text-[#94A3B8] mt-0.5 block">
                  Across 8 Focus States
                </span>
              </div>

              <div className="border-l-2 border-[#D97706] pl-4">
                <span className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider block">
                  Field Quality Audits
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] mt-1">
                  42
                </div>
                <span className="text-[10px] text-[#94A3B8] mt-0.5 block">
                  12 Surprise Inspections
                </span>
              </div>

              <div className="border-l-2 border-[#059669] pl-4 col-span-2 lg:col-span-1">
                <span className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider block">
                  Geo-Verification
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#059669] mt-1">
                  100%
                </div>
                <span className="text-[10px] text-[#94A3B8] mt-0.5 block">
                  Zero Paper Proxies
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. INTERACTIVE PORTAL ACCESS & ROLE CONFIGURATION SECTION
           ========================================================================= */}
        <section id="portal-access" className="py-12 px-4 sm:px-6 lg:px-8 bg-[#F7F8FA] border-b border-[#E2E5E9]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-xs font-bold text-[#174A73] uppercase tracking-wider block mb-1">
                Authorized Access
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1F2937]">
                Sign In to Your Workspace
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1.5">
                Select your designated workspace and operational persona to enter the unified monitoring system.
              </p>
            </div>

            <div className="bg-white border border-[#CBD5E1] rounded-2xl shadow-sm p-6 sm:p-8">
              {/* Clean Workspace Tabs */}
              <div className="flex border-b border-[#E2E5E9] mb-6 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => handleSelectWorkspaceTab('GOVERNMENT')}
                  className={`flex items-center space-x-2 py-3 px-5 text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
                    selectedTab === 'GOVERNMENT'
                      ? 'border-[#174A73] text-[#174A73] bg-blue-50/50'
                      : 'border-transparent text-[#667085] hover:text-[#1F2937] hover:bg-[#F7F8FA]'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Government Monitoring</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectWorkspaceTab('NGO')}
                  className={`flex items-center space-x-2 py-3 px-5 text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
                    selectedTab === 'NGO'
                      ? 'border-[#174A73] text-[#174A73] bg-blue-50/50'
                      : 'border-transparent text-[#667085] hover:text-[#1F2937] hover:bg-[#F7F8FA]'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>NGO / Institution</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectWorkspaceTab('INSPECTOR')}
                  className={`flex items-center space-x-2 py-3 px-5 text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
                    selectedTab === 'INSPECTOR'
                      ? 'border-[#174A73] text-[#174A73] bg-blue-50/50'
                      : 'border-transparent text-[#667085] hover:text-[#1F2937] hover:bg-[#F7F8FA]'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Field Inspector</span>
                </button>
              </div>

              {/* Form Area */}
              <form onSubmit={handleLogin} className="space-y-6">
                {/* NGO / INSTITUTION WORKSPACE: Select Specific Institution */}
                {selectedTab === 'NGO' && (
                  <div className="p-4 sm:p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-[#174A73]" />
                        <h3 className="text-sm font-bold text-[#1F2937]">
                          Select Implementing NGO / Institution
                        </h3>
                      </div>
                      <span className="text-[11px] text-[#667085] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded font-medium">
                        {allOrganizations.length} Empaneled Institutions Registered
                      </span>
                    </div>

                    {/* Search & Select Institution */}
                    <div className="space-y-2">
                      <div className="relative">
                        <label htmlFor="ngo-select-dropdown" className="block text-xs font-semibold text-[#475569] mb-1.5">
                          Choose Registered Organization / Trust / Society:
                        </label>
                        <select
                          id="ngo-select-dropdown"
                          value={selectedOrgId}
                          onChange={e => setSelectedOrgId(e.target.value)}
                          className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#174A73]/20 focus:border-[#174A73] cursor-pointer shadow-2xs"
                        >
                          {allOrganizations.map(org => (
                            <option key={org.id} value={org.id}>
                              {org.name} — {org.location.district || org.location.state} (Darpan: {org.darpanId || org.registrationNumber})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filter Search Input for Quick Finding */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={orgSearchQuery}
                          onChange={e => setOrgSearchQuery(e.target.value)}
                          placeholder="Quick filter by institution name, city, or Darpan ID..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-md focus:outline-none focus:border-[#174A73] text-[#1F2937] placeholder:text-[#94A3B8]"
                        />
                      </div>
                    </div>

                    {/* Filtered Org Quick-Select Pills if user is searching */}
                    {orgSearchQuery.trim() && (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
                        <span className="text-[10px] text-[#667085] uppercase tracking-wider font-semibold block">
                          Search Results ({filteredOrgs.length}):
                        </span>
                        {filteredOrgs.length === 0 ? (
                          <div className="text-xs text-[#94A3B8] py-2 text-center italic">
                            No empaneled institution matched "{orgSearchQuery}"
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {filteredOrgs.map(org => (
                              <button
                                key={org.id}
                                type="button"
                                onClick={() => {
                                  setSelectedOrgId(org.id);
                                  setOrgSearchQuery('');
                                }}
                                className={`p-2 rounded-lg text-left text-xs transition border flex items-center justify-between ${
                                  selectedOrgId === org.id
                                    ? 'bg-blue-50 border-[#174A73] text-[#174A73] font-semibold'
                                    : 'bg-white border-[#E2E8F0] text-[#334155] hover:bg-gray-50'
                                }`}
                              >
                                <span className="truncate pr-2">{org.name}</span>
                                <span className="text-[10px] text-[#64748B] flex-shrink-0">
                                  {org.location.district}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Selected Organization Snapshot Dossier */}
                    {selectedOrg && (
                      <div className="bg-white border border-[#CBD5E1] rounded-lg p-3.5 space-y-2 text-xs shadow-2xs">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-gray-100">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-[#1F2937]">{selectedOrg.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-[#475569] border border-gray-200">
                              {selectedOrg.type}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                selectedOrg.riskLevel === 'LOW'
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : selectedOrg.riskLevel === 'MEDIUM'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              Risk: {selectedOrg.riskLevel}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#174A73] border border-blue-200">
                              {selectedOrg.status}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 text-[#64748B]">
                          <div>
                            <span className="block text-[10px] uppercase text-[#94A3B8] font-semibold">Darpan ID</span>
                            <span className="font-mono text-[#1F2937] font-medium">{selectedOrg.darpanId || selectedOrg.registrationNumber}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase text-[#94A3B8] font-semibold">Station / State</span>
                            <span className="text-[#1F2937] font-medium">{selectedOrg.location.district}, {selectedOrg.location.state}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase text-[#94A3B8] font-semibold">Sanctioned Outlay</span>
                            <span className="font-bold text-[#174A73]">₹{((selectedOrg.totalFundsReceived || 0) / 10000000).toFixed(2)} Cr</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase text-[#94A3B8] font-semibold">Authorized Head</span>
                            <span className="text-[#1F2937] font-medium truncate block">{selectedOrg.contactPerson}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Role Cards List */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-[#475569]">
                    {selectedTab === 'NGO'
                      ? `Select Access Role in ${selectedOrg?.name || 'this Institution'}:`
                      : 'Select Authorized Role:'}
                  </label>

                  {roleOptions[selectedTab].map(item => {
                    const isSelected = selectedRole === item.role;
                    return (
                      <div
                        key={item.role}
                        onClick={() => setSelectedRole(item.role)}
                        className={`p-4 rounded-xl border transition cursor-pointer flex items-start justify-between ${
                          isSelected
                            ? 'border-[#174A73] bg-blue-50/40 ring-1 ring-[#174A73]/20 shadow-2xs'
                            : 'border-[#E2E5E9] bg-white hover:bg-[#F7F8FA]'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="pt-0.5">
                            <input
                              type="radio"
                              name="roleSelection"
                              checked={isSelected}
                              onChange={() => setSelectedRole(item.role)}
                              className="w-4 h-4 text-[#174A73] focus:ring-[#174A73] border-[#CBD5E1]"
                            />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-semibold text-[#1F2937]">
                                {item.title}
                              </h3>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-[#667085] border border-gray-200">
                                {item.tag}
                              </span>
                            </div>
                            <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-[#174A73] flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Login Action */}
                <div className="pt-4 border-t border-[#E2E5E9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-[#667085]">
                    {selectedTab === 'NGO' ? (
                      <span>
                        Logging in to <strong className="text-[#1F2937]">{selectedOrg?.name}</strong> portal.
                      </span>
                    ) : (
                      <span>Authenticated with official government audit trails.</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 rounded-lg bg-[#174A73] hover:bg-[#123859] text-white font-medium text-sm flex items-center justify-center space-x-2 transition disabled:opacity-60 shadow-sm cursor-pointer"
                  >
                    <span>{isLoading ? 'Authenticating...' : 'Enter Workspace'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. KEY PILLARS & TECHNICAL ARCHITECTURE
           ========================================================================= */}
        <section id="key-pillars" className="py-14 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E5E9]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-[#174A73] uppercase tracking-wider block mb-1">
                System Pillars
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1F2937]">
                Four Core Mechanisms Ensuring Ground Truth
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-2">
                Designed to eliminate proxy auditing, enforce physical milestone verification, and guarantee transparency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100/70 text-[#174A73] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#1F2937]">
                  GPS Geofencing Lock
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Field inspectors cannot unlock evaluation checklists or submit reports unless mobile GPS confirms they are physically within 200 meters of the registered site coordinates.
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100/70 text-[#16A34A] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#1F2937]">
                  PFMS Milestone Linkage
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Subsequent fund tranches and financial disbursements remain systematically locked until milestone completion certificates and independent quality audits are cleared.
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100/70 text-[#D97706] flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#1F2937]">
                  Unannounced Surprise Audits
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Dual-track inspection protocol empowering central directors to dispatch sudden quality checks to high-risk projects without notifying implementing agencies in advance.
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#1F2937]">
                  Compliance & Rectification Loop
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Deficiencies immediately spawn formal statutory directives with binding deadlines. Institutions submit photographic proof of remediation before penalties or de-empanelment occur.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Official Government Footer */}
      <footer className="border-t border-[#E2E5E9] bg-white px-4 sm:px-6 lg:px-8 py-8 text-xs text-[#667085]">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#E2E5E9]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-[#174A73] flex items-center justify-center font-bold text-white text-sm">
                दृ
              </div>
              <div>
                <span className="font-bold text-sm text-[#174A73]">DRISHTI Monitoring & Inspection System</span>
                <p className="text-[11px] text-[#64748B]">Ministry of Statistics & Programme Implementation • Government of India</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#64748B]">
              <span className="flex items-center space-x-1">
                <Lock className="w-3 h-3 text-[#16A34A]" />
                <span>SSL 256-Bit Encrypted</span>
              </span>
              <span>•</span>
              <span>PFMS & NGO Darpan Interoperable</span>
              <span>•</span>
              <span>WCAG 2.1 AA Compliant</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#94A3B8]">
            <p>© 2026 Ministry of Statistics & Programme Implementation (MoSPI). Designed for Government of India.</p>
            <p>Single Unified Database • Zero Downtime Architecture • NIC Cloud Hosted</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
