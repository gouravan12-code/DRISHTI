import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Organization,
  Project,
  Inspection,
  EvidenceRecord,
  Finding,
  ComplianceAction,
  DrishtiAlert,
  LiveMonitoringFeed,
  AuditLog,
  RiskIntelligence
} from '../../types';
import { drishtiDataService } from '../../services/drishtiDataService';
import { DrishtiMap, MapMarkerItem } from '../../maps/DrishtiMap';
import { GovernmentDashboardAnalytics } from '../../components/analytics/GovernmentDashboardAnalytics';
import { OrganizationDetailPage } from './OrganizationDetailPage';
import { SvgPieChart, PieChartSlice } from '../../components/charts/SvgPieChart';
import { SvgBarGraph, BarGraphItem } from '../../components/charts/SvgBarGraph';
import { SurpriseInspectionModal } from '../../components/modals/SurpriseInspectionModal';
import { ComplianceNoticeModal } from '../../components/modals/ComplianceNoticeModal';
import { InspectionDetailModal } from '../../components/modals/InspectionDetailModal';
import { ProjectLocationModal } from '../../components/modals/ProjectLocationModal';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  ClipboardCheck,
  Radio,
  AlertTriangle,
  Camera,
  FileSearch,
  CheckSquare,
  FileText,
  History,
  Users,
  Settings,
  Plus,
  Search,
  LogOut,
  Bell,
  CheckCircle2,
  Menu,
  X,
  Download,
  MapPin,
  BarChart3,
  PieChart as PieChartIcon,
  ShieldAlert,
  ShieldCheck,
  Compass,
  Layers,
  ArrowRight,
  Filter,
  Eye,
  Calendar
} from 'lucide-react';

export const GovernmentCommandCenter: React.FC = () => {
  const { currentUser, logout } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'organizations'
    | 'projects'
    | 'inspections'
    | 'live_monitoring'
    | 'risk_alerts'
    | 'evidence'
    | 'findings'
    | 'compliance'
    | 'reports'
    | 'audit_trail'
    | 'users'
    | 'settings'
  >('dashboard');

  // Mobile menu drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notifications popover
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Core canonical states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [compliance, setCompliance] = useState<ComplianceAction[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [alerts, setAlerts] = useState<DrishtiAlert[]>([]);
  const [liveFeeds, setLiveFeeds] = useState<LiveMonitoringFeed[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [riskIntelligence, setRiskIntelligence] = useState<RiskIntelligence[]>([]);

  // Modals & Selected Records
  const [surpriseModalOpen, setSurpriseModalOpen] = useState(false);
  const [complianceModalFinding, setComplianceModalFinding] = useState<Finding | null>(null);
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);
  const [selectedMapMarkerId, setSelectedMapMarkerId] = useState<string | undefined>();
  const [selectedInspectionDetail, setSelectedInspectionDetail] = useState<Inspection | null>(null);
  const [selectedOrgForDetail, setSelectedOrgForDetail] = useState<Organization | null>(null);
  const [selectedProjectForLocation, setSelectedProjectForLocation] = useState<Project | null>(null);
  const [selectedProjectForSurprise, setSelectedProjectForSurprise] = useState<Project | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectionFilterType, setInspectionFilterType] = useState<string>('ALL');
  const [reportExportSuccess, setReportExportSuccess] = useState<string | null>(null);
  const [dashboardMapFilter, setDashboardMapFilter] = useState<'ALL' | 'NGO' | 'PROJECT' | 'INSPECTION' | 'HIGH_RISK'>('ALL');
  const [noticeFilter, setNoticeFilter] = useState<'ALL' | 'CRITICAL' | 'COMPLIANCE' | 'SURPRISE'>('ALL');
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<Set<string>>(new Set());
  const [dashboardChartTab, setDashboardChartTab] = useState<'SECTOR' | 'RISK'>('SECTOR');

  const handleAcknowledgeAlert = (alertId: string) => {
    setAcknowledgedAlertIds(prev => new Set([...prev, alertId]));
  };

  // Load backend data
  const refreshAllData = async () => {
    const [
      orgsData,
      projsData,
      inspsData,
      findsData,
      compsData,
      evisData,
      alrtsData,
      feedsData,
      logsData,
      riskData
    ] = await Promise.all([
      drishtiDataService.getOrganizations(),
      drishtiDataService.getProjects(),
      drishtiDataService.getInspections(),
      drishtiDataService.getFindings(),
      drishtiDataService.getCompliance(),
      drishtiDataService.getEvidence(),
      drishtiDataService.getAlerts(),
      drishtiDataService.getLiveFeeds(),
      drishtiDataService.getAuditLogs(),
      drishtiDataService.getRiskIntelligence()
    ]);

    setOrganizations(orgsData);
    setProjects(projsData);
    setInspections(inspsData);
    setFindings(findsData);
    setCompliance(compsData);
    setEvidenceList(evisData);
    setAlerts(alrtsData);
    setLiveFeeds(feedsData);
    setAuditLogs(logsData);
    setRiskIntelligence(riskData);
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Map Markers Transformation
  const mapMarkers = useMemo<MapMarkerItem[]>(() => {
    const markers: MapMarkerItem[] = [];

    // NGOs
    organizations.forEach(org => {
      markers.push({
        id: org.id,
        category: org.riskLevel === 'CRITICAL' || org.riskLevel === 'HIGH' ? 'HIGH_RISK' : 'NGO',
        title: org.name,
        subtitle: `${org.activeProjectsCount} Projects • Sanctioned ₹${(org.totalFundsReceived / 10000000).toFixed(1)} Cr`,
        lat: org.location.lat,
        lng: org.location.lng,
        statusText: `Risk: ${org.riskLevel} (${org.riskScore}/100)`,
        riskLevel: org.riskLevel
      });
    });

    // Active Projects
    projects.forEach(p => {
      markers.push({
        id: p.id,
        category: 'PROJECT',
        title: p.name,
        subtitle: `${p.organizationName} • ${p.scheme}`,
        lat: p.location.lat,
        lng: p.location.lng,
        statusText: `${p.progressPercentage}% Completed`
      });
    });

    // Inspections
    inspections
      .filter(i => i.status === 'IN_PROGRESS' || i.status === 'ASSIGNED')
      .forEach(i => {
        markers.push({
          id: i.id,
          category: 'INSPECTION',
          title: `${i.type === 'SURPRISE' ? '⚡ ' : ''}${i.inspectionCode}: ${i.projectName}`,
          subtitle: `Monitor: ${i.assignedInspectorName || 'Inspector Assigned'}`,
          lat: i.location.lat,
          lng: i.location.lng,
          statusText: i.status
        });
      });

    // Live Monitoring Feeds
    liveFeeds.forEach(f => {
      markers.push({
        id: f.id,
        category: 'LIVE_MONITORING',
        title: `Camera: ${f.feedCode}`,
        subtitle: f.name,
        lat: f.location.lat,
        lng: f.location.lng,
        statusText: f.status
      });
    });

    return markers;
  }, [organizations, projects, inspections, liveFeeds]);

  // Derived KPI calculations
  const totalOrganizationsCount = organizations.length;
  const activeProjectsCount = projects.filter(p => p.status === 'ACTIVE').length || projects.length;
  const activeInspectionsCount = inspections.filter(i => i.status === 'IN_PROGRESS' || i.status === 'ASSIGNED').length;
  const highRiskCount = organizations.filter(o => o.riskLevel === 'HIGH' || o.riskLevel === 'CRITICAL').length;
  const openFindingsCount = findings.filter(f => f.status === 'OPEN').length;
  const overdueComplianceCount = compliance.filter(c => c.status === 'OVERDUE').length;

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');

  // Scheme Financial Outlay Bar Graph Data for Main Dashboard
  const mainDashboardBarData: BarGraphItem[] = useMemo(() => {
    const map: Record<string, { sanctioned: number; disbursed: number }> = {};
    projects.forEach(p => {
      const sName = p.scheme.split('(')[0].trim() || p.scheme;
      if (!map[sName]) map[sName] = { sanctioned: 0, disbursed: 0 };
      map[sName].sanctioned += p.fundingSanctioned;
      map[sName].disbursed += p.fundingDisbursed;
    });
    return Object.entries(map).slice(0, 5).map(([name, val]) => ({
      label: name.length > 12 ? `${name.slice(0, 10)}...` : name,
      value: val.disbursed / 10000000,
      secondaryValue: val.sanctioned / 10000000,
      formattedValue: `₹${(val.disbursed / 10000000).toFixed(1)}Cr`,
      formattedSecondaryValue: `₹${(val.sanctioned / 10000000).toFixed(1)}Cr`,
      color: '#174A73',
      secondaryColor: '#CBD5E1'
    }));
  }, [projects]);

  // Sector Budget Allocation Pie Chart Data for Main Dashboard
  const mainDashboardPieData: PieChartSlice[] = useMemo(() => {
    const map: Record<string, number> = {};
    projects.forEach(p => {
      const sName = p.scheme.split('(')[0].trim() || p.scheme;
      map[sName] = (map[sName] || 0) + p.fundingSanctioned;
    });
    const colors = ['#174A73', '#16A34A', '#D97706', '#9333EA', '#0284C7', '#DC2626'];
    return Object.entries(map).slice(0, 5).map(([name, amt], idx) => {
      const cr = amt / 10000000;
      return {
        label: name,
        value: cr,
        color: colors[idx % colors.length],
        formattedValue: `₹${cr.toFixed(1)} Cr`
      };
    });
  }, [projects]);

  const totalSanctionedCr = useMemo(() => {
    return projects.reduce((acc, p) => acc + p.fundingSanctioned, 0) / 10000000;
  }, [projects]);

  const totalDisbursedCr = useMemo(() => {
    return projects.reduce((acc, p) => acc + p.fundingDisbursed, 0) / 10000000;
  }, [projects]);

  // Risk distribution pie chart data
  const mainDashboardRiskPieData: PieChartSlice[] = useMemo(() => {
    let low = 0, medium = 0, high = 0, critical = 0;
    organizations.forEach(o => {
      if (o.riskLevel === 'CRITICAL') critical++;
      else if (o.riskLevel === 'HIGH') high++;
      else if (o.riskLevel === 'MEDIUM') medium++;
      else low++;
    });
    return [
      { label: 'Low Risk', value: low, color: '#16A34A', formattedValue: `${low} NGOs` },
      { label: 'Medium Risk', value: medium, color: '#D97706', formattedValue: `${medium} NGOs` },
      { label: 'High Risk', value: high, color: '#EA580C', formattedValue: `${high} NGOs` },
      { label: 'Critical Risk', value: critical, color: '#DC2626', formattedValue: `${critical} NGOs` },
    ];
  }, [organizations]);

  // Filtered dashboard map markers
  const filteredDashboardMapMarkers = useMemo(() => {
    if (dashboardMapFilter === 'ALL') return mapMarkers;
    if (dashboardMapFilter === 'NGO') return mapMarkers.filter(m => m.category === 'NGO');
    if (dashboardMapFilter === 'PROJECT') return mapMarkers.filter(m => m.category === 'PROJECT');
    if (dashboardMapFilter === 'INSPECTION') return mapMarkers.filter(m => m.category === 'INSPECTION');
    if (dashboardMapFilter === 'HIGH_RISK') return mapMarkers.filter(m => m.category === 'HIGH_RISK' || m.riskLevel === 'HIGH' || m.riskLevel === 'CRITICAL');
    return mapMarkers;
  }, [mapMarkers, dashboardMapFilter]);

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'organizations', label: 'Organizations', icon: Building2, count: totalOrganizationsCount },
    { id: 'projects', label: 'Projects', icon: FolderKanban, count: projects.length },
    { id: 'inspections', label: 'Inspections', icon: ClipboardCheck, count: activeInspectionsCount },
    { id: 'live_monitoring', label: 'Live Monitoring', icon: Radio, count: liveFeeds.length },
    { id: 'risk_alerts', label: 'Risk & Alerts', icon: AlertTriangle, count: activeAlerts.length },
    { id: 'evidence', label: 'Evidence', icon: Camera, count: evidenceList.length },
    { id: 'findings', label: 'Findings', icon: FileSearch, count: openFindingsCount },
    { id: 'compliance', label: 'Compliance', icon: CheckSquare, count: overdueComplianceCount },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'audit_trail', label: 'Audit Trail', icon: History },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  // Trigger report download mock
  const handleExportReport = (type: string) => {
    setReportExportSuccess(`Successfully generated ${type}. Downloading report file...`);
    setTimeout(() => {
      setReportExportSuccess(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1F2937] flex flex-col font-sans">
      {/* 6. Simple Clean White Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E5E9] px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-md text-[#667085] hover:text-[#1F2937] hover:bg-[#F7F8FA]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-8 h-8 rounded bg-[#174A73] flex items-center justify-center font-bold text-white text-sm">
            दृ
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base text-[#174A73] tracking-tight">DRISHTI</span>
              <span className="text-[10px] font-medium px-2 py-0.2 rounded bg-blue-50 text-[#174A73] border border-blue-100 hidden sm:inline-block">
                Government Monitoring
              </span>
            </div>
            <p className="text-xs text-[#667085] hidden md:block">
              AI-Powered Real-Time Monitoring & Inspection Platform
            </p>
          </div>
        </div>

        {/* Right header actions */}
        <div className="flex items-center space-x-3">
          {/* Create Surprise Inspection Button */}
          <button
            onClick={() => setSurpriseModalOpen(true)}
            className="px-3 py-1.5 rounded-md bg-[#174A73] hover:bg-[#123859] text-white font-medium text-xs flex items-center space-x-1.5 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create Surprise Inspection</span>
            <span className="sm:hidden">Surprise</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-1.5 rounded-md text-[#667085] hover:text-[#1F2937] hover:bg-[#F7F8FA] relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {activeAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#DC2626]"></span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2E5E9] rounded-lg shadow-lg p-3 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E5E9]">
                  <span className="font-semibold text-[#1F2937]">System Notifications</span>
                  <span className="text-[11px] text-[#667085]">{activeAlerts.length} Active</span>
                </div>
                <div className="divide-y divide-[#E2E5E9] max-h-64 overflow-y-auto mt-1">
                  {activeAlerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="py-2 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-red-50 text-red-700'
                              : alert.severity === 'HIGH'
                              ? 'bg-orange-50 text-orange-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-[#667085]">{alert.createdAt.split('T')[0]}</span>
                      </div>
                      <p className="font-medium text-[#1F2937]">{alert.type.replace(/_/g, ' ')}</p>
                      <p className="text-[11px] text-[#667085] line-clamp-1">{alert.message}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setNotificationsOpen(false);
                    setActiveTab('risk_alerts');
                  }}
                  className="w-full text-center text-[11px] font-medium text-[#174A73] hover:underline pt-2 border-t border-[#E2E5E9] block mt-1"
                >
                  View All Alerts in Risk Center →
                </button>
              </div>
            )}
          </div>

          {/* User profile */}
          <div className="hidden sm:flex flex-col text-right pl-2 border-l border-[#E2E5E9]">
            <span className="text-xs font-semibold text-[#1F2937]">{currentUser?.fullName}</span>
            <span className="text-[11px] text-[#667085]">{currentUser?.designation}</span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Sign Out & Return to Main Landing Page"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 border border-transparent hover:border-red-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Layout: Left Navigation + Content Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* 5. Simple Left Navigation Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-56 bg-white border-r border-[#E2E5E9] flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0 pt-14' : '-translate-x-full'
          }`}
        >
          <div className="py-3 px-2 space-y-0.5 overflow-y-auto">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
              Navigation
            </div>

            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    if (item.id === 'organizations') {
                      setSelectedOrgForDetail(null);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition text-left ${
                    isActive
                      ? 'bg-blue-50 text-[#174A73] border-l-4 border-[#174A73] font-semibold'
                      : 'text-[#667085] hover:text-[#1F2937] hover:bg-[#F7F8FA] border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#174A73]' : 'text-[#667085]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {'count' in item && item.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        isActive
                          ? 'bg-blue-100 text-[#174A73]'
                          : 'bg-gray-100 text-[#667085]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-[#E2E5E9] text-[11px] text-[#667085] bg-[#F7F8FA]">
            <div>Portal Version: 2.4-Gov</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Audit Security: Encrypted</div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F7F8FA]">
          {reportExportSuccess && (
            <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 text-xs text-green-700 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
              <span>{reportExportSuccess}</span>
            </div>
          )}

          {/* ========================================================
              TAB 1: DASHBOARD
             ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Executive Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E2E5E9]">
                <div>
                  <h1 className="text-xl font-bold text-[#1F2937]">
                    National Monitoring & Oversight Dashboard
                  </h1>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Central monitoring of empaneled NGOs, scheme disbursements, and field inspections.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-green-50 text-green-700 border border-green-200 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>PFMS Live Sync</span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-blue-50 text-[#174A73] border border-blue-200 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#174A73]" />
                    <span>Geofence 250m Enforced</span>
                  </span>
                </div>
              </div>

              {/* 1. KPI Metric Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white border border-[#E2E5E9] rounded-lg p-3.5 shadow-2xs hover:border-[#174A73] transition">
                  <div className="text-xs text-[#667085] font-medium">Empaneled NGOs</div>
                  <div className="text-2xl font-bold text-[#1F2937] mt-1">{totalOrganizationsCount}</div>
                  <div className="text-[11px] text-[#667085] mt-0.5">NITI Aayog Darpan</div>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-lg p-3.5 shadow-2xs hover:border-[#174A73] transition">
                  <div className="text-xs text-[#667085] font-medium">Active Scheme Projects</div>
                  <div className="text-2xl font-bold text-[#1F2937] mt-1">{activeProjectsCount}</div>
                  <div className="text-[11px] text-green-700 mt-0.5">4 Central Schemes</div>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-lg p-3.5 shadow-2xs hover:border-[#174A73] transition">
                  <div className="text-xs text-[#667085] font-medium">Field Inspections</div>
                  <div className="text-2xl font-bold text-[#174A73] mt-1">{activeInspectionsCount}</div>
                  <div className="text-[11px] text-[#667085] mt-0.5">Field monitors active</div>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-lg p-3.5 shadow-2xs hover:border-red-400 transition">
                  <div className="text-xs text-[#667085] font-medium">High Risk Agencies</div>
                  <div className="text-2xl font-bold text-[#DC2626] mt-1">{highRiskCount}</div>
                  <div className="text-[11px] text-red-600 mt-0.5">Vigilance watchlist</div>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-lg p-3.5 shadow-2xs hover:border-amber-400 transition">
                  <div className="text-xs text-[#667085] font-medium">Open Findings</div>
                  <div className="text-2xl font-bold text-[#D97706] mt-1">{openFindingsCount}</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">Pending rectification</div>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-lg p-3.5 shadow-2xs hover:border-red-400 transition">
                  <div className="text-xs text-[#667085] font-medium">Overdue Directives</div>
                  <div className="text-2xl font-bold text-[#DC2626] mt-1">{overdueComplianceCount}</div>
                  <div className="text-[11px] text-red-600 mt-0.5">Escalated to Ministry</div>
                </div>
              </div>

              {/* ========================================================
                  TIER 1 (UPPER SECTION): IMPORTANT NOTICES & DIRECTIVES
                 ======================================================== */}
              <div className="bg-white border border-[#E2E5E9] rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-red-50/60 via-amber-50/40 to-blue-50/30 border-b border-[#E2E5E9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-red-100/80 rounded-lg text-red-700">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#1F2937] flex items-center space-x-2">
                        <span>Important Notices & Priority Directives</span>
                        <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">
                          {activeAlerts.length + compliance.filter(c => c.status === 'OVERDUE').length} Actionable
                        </span>
                      </h2>
                      <p className="text-xs text-[#667085] mt-0.5">
                        Statutory show-cause escalations, audit discrepancies, and urgent compliance deadlines requiring executive intervention.
                      </p>
                    </div>
                  </div>

                  {/* Notice Filter Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setNoticeFilter('ALL')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                        noticeFilter === 'ALL'
                          ? 'bg-[#174A73] text-white shadow-2xs'
                          : 'bg-white border border-[#E2E5E9] text-[#667085] hover:text-[#1F2937]'
                      }`}
                    >
                      All ({activeAlerts.length})
                    </button>
                    <button
                      onClick={() => setNoticeFilter('CRITICAL')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                        noticeFilter === 'CRITICAL'
                          ? 'bg-red-600 text-white shadow-2xs'
                          : 'bg-white border border-[#E2E5E9] text-[#667085] hover:text-[#1F2937]'
                      }`}
                    >
                      Critical Directives ({activeAlerts.filter(a => a.severity === 'CRITICAL').length})
                    </button>
                    <button
                      onClick={() => setNoticeFilter('COMPLIANCE')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                        noticeFilter === 'COMPLIANCE'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-white border border-[#E2E5E9] text-[#667085] hover:text-[#1F2937]'
                      }`}
                    >
                      Compliance Overdue ({overdueComplianceCount})
                    </button>
                    <button
                      onClick={() => setNoticeFilter('SURPRISE')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                        noticeFilter === 'SURPRISE'
                          ? 'bg-purple-700 text-white shadow-2xs'
                          : 'bg-white border border-[#E2E5E9] text-[#667085] hover:text-[#1F2937]'
                      }`}
                    >
                      Surprise Audits ({inspections.filter(i => i.type === 'SURPRISE').length})
                    </button>
                  </div>
                </div>

                {/* Notices List */}
                <div className="divide-y divide-[#E2E5E9]">
                  {/* Overdue Compliance Notice Banner if applicable */}
                  {(noticeFilter === 'ALL' || noticeFilter === 'COMPLIANCE') &&
                    compliance
                      .filter(c => c.status === 'OVERDUE')
                      .slice(0, 2)
                      .map(comp => (
                        <div key={comp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50/20 hover:bg-red-50/40 transition">
                          <div className="flex items-start space-x-3">
                            <span className="p-1.5 rounded-md bg-red-100 text-red-700 flex-shrink-0 mt-0.5">
                              <ShieldAlert className="w-4 h-4" />
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                                  {comp.id.slice(0, 10).toUpperCase()}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white">
                                  OVERDUE STATUTORY DIRECTIVE
                                </span>
                                <span className="text-xs font-bold text-[#1F2937]">
                                  {comp.organizationName}
                                </span>
                              </div>
                              <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                                Required Action: <strong>{comp.actionRequired}</strong> — Statutory deadline was {comp.dueDate}. Non-compliance may lead to project de-empanelment and grant freeze.
                              </p>
                              <span className="text-[11px] text-[#667085] mt-1 block">
                                Penalty: Suspension of further tranche releases under GFR Rule 238.
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => {
                                setComplianceModalFinding(null);
                                setComplianceModalOpen(true);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold rounded bg-red-600 hover:bg-red-700 text-white shadow-2xs transition"
                            >
                              Escalate Show-Cause
                            </button>
                            <button
                              onClick={() => setActiveTab('compliance')}
                              className="px-2.5 py-1.5 text-xs font-semibold rounded border border-[#E2E5E9] bg-white text-[#174A73] hover:bg-blue-50 transition"
                            >
                              View File
                            </button>
                          </div>
                        </div>
                      ))}

                  {/* Drishti Alerts List */}
                  {activeAlerts
                    .filter(a => {
                      if (acknowledgedAlertIds.has(a.id)) return false;
                      if (noticeFilter === 'CRITICAL') return a.severity === 'CRITICAL';
                      if (noticeFilter === 'COMPLIANCE') return a.type.includes('COMPLIANCE') || a.type.includes('DEADLINE');
                      if (noticeFilter === 'SURPRISE') return a.type.includes('INSPECTION') || a.type.includes('AUDIT');
                      return true;
                    })
                    .slice(0, 4)
                    .map(alert => (
                      <div
                        key={alert.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7F8FA] transition"
                      >
                        <div className="flex items-start space-x-3">
                          <span
                            className={`p-1.5 rounded-md flex-shrink-0 mt-0.5 ${
                              alert.severity === 'CRITICAL'
                                ? 'bg-red-100 text-red-700'
                                : alert.severity === 'HIGH'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  alert.severity === 'CRITICAL'
                                    ? 'bg-red-600 text-white'
                                    : alert.severity === 'HIGH'
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-amber-500 text-white'
                                }`}
                              >
                                {alert.severity} PRIORITY
                              </span>
                              <span className="text-xs font-bold text-[#1F2937]">
                                {alert.type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[11px] text-[#667085] flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-[#667085]" />
                                <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                              </span>
                            </div>
                            <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                              {alert.message}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => {
                              setComplianceModalFinding(null);
                              setComplianceModalOpen(true);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold rounded bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition shadow-2xs"
                          >
                            Issue Directive
                          </button>
                          <button
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            className="px-2.5 py-1.5 text-xs font-medium rounded border border-[#E2E5E9] bg-white text-[#667085] hover:text-[#1F2937] hover:bg-gray-50 transition"
                          >
                            Acknowledge
                          </button>
                        </div>
                      </div>
                    ))}

                  {activeAlerts.length === 0 && (
                    <div className="p-8 text-center text-xs text-[#667085]">
                      <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <span className="font-bold text-[#1F2937] block">No Critical Vigilance Directives Pending</span>
                      <span>All statutory filings and field monitoring inspections are up to date.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ========================================================
                  TIER 2 (MIDDLE SECTION): THE ANALYTICAL GRAPHS
                 ======================================================== */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h2 className="text-sm font-bold text-[#1F2937] flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-[#174A73]" />
                      <span>Financial Outlay & Scheme Allocation Analytics</span>
                    </h2>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Macro monitoring of central grants sanctioned vs ground disbursements under GFR guidelines.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-semibold text-[#1F2937]">Sanctioned: ₹{totalSanctionedCr.toFixed(1)} Cr</span>
                    <span className="text-[#667085]">•</span>
                    <span className="font-semibold text-[#16A34A]">Disbursed: ₹{totalDisbursedCr.toFixed(1)} Cr</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Scheme Outlay Bar Graph */}
                  <div className="bg-white border border-[#E2E5E9] rounded-xl shadow-xs p-4 sm:p-5 flex flex-col justify-between overflow-hidden min-w-0">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E2E5E9]">
                      <div className="flex items-center space-x-2 min-w-0">
                        <BarChart3 className="w-4 h-4 text-[#174A73] flex-shrink-0" />
                        <h3 className="text-sm font-bold text-[#1F2937] truncate">
                          Centrally Sponsored Schemes Outlay (Bar Graph)
                        </h3>
                      </div>
                      <span className="text-[10px] text-[#16A34A] bg-green-50 px-2 py-0.5 rounded border border-green-200 font-bold whitespace-nowrap flex-shrink-0">
                        PFMS Direct Verified
                      </span>
                    </div>

                    <div className="pt-3 w-full min-w-0 overflow-hidden">
                      <SvgBarGraph
                        data={mainDashboardBarData}
                        height={230}
                        primaryLabel="Disbursed Funds"
                        secondaryLabel="Sanctioned Allocation"
                        primaryColor="#174A73"
                        secondaryColor="#CBD5E1"
                        unitPrefix="₹"
                        unitSuffix="Cr"
                      />
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#E2E5E9] grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="text-[10px] text-[#667085] block truncate">Sanctioned Outlay</span>
                        <span className="font-bold text-[#1F2937] text-xs">₹{totalSanctionedCr.toFixed(1)} Cr</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="text-[10px] text-[#667085] block truncate">Disbursed to Date</span>
                        <span className="font-bold text-[#16A34A] text-xs">₹{totalDisbursedCr.toFixed(1)} Cr</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="text-[10px] text-[#667085] block truncate">Disbursement Rate</span>
                        <span className="font-bold text-[#174A73] text-xs">
                          {totalSanctionedCr > 0 ? ((totalDisbursedCr / totalSanctionedCr) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Central Sector Budget & Institutional Risk Allocation Pie Chart */}
                  <div className="bg-white border border-[#E2E5E9] rounded-xl shadow-xs p-4 sm:p-5 flex flex-col justify-between overflow-hidden min-w-0">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E2E5E9] gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <PieChartIcon className="w-4 h-4 text-[#174A73] flex-shrink-0" />
                        <h3 className="text-sm font-bold text-[#1F2937] truncate">
                          {dashboardChartTab === 'SECTOR'
                            ? 'Sector Budget Allocation (Pie Chart)'
                            : 'Institutional Risk Assessment (Pie Chart)'}
                        </h3>
                      </div>

                      {/* Chart Toggle */}
                      <div className="flex rounded-md border border-[#E2E5E9] p-0.5 bg-[#F7F8FA] text-[11px] font-semibold flex-shrink-0">
                        <button
                          onClick={() => setDashboardChartTab('SECTOR')}
                          className={`px-2 py-0.5 rounded transition ${
                            dashboardChartTab === 'SECTOR'
                              ? 'bg-white text-[#174A73] shadow-2xs'
                              : 'text-[#667085] hover:text-[#1F2937]'
                          }`}
                        >
                          Sector Outlay
                        </button>
                        <button
                          onClick={() => setDashboardChartTab('RISK')}
                          className={`px-2 py-0.5 rounded transition ${
                            dashboardChartTab === 'RISK'
                              ? 'bg-white text-[#174A73] shadow-2xs'
                              : 'text-[#667085] hover:text-[#1F2937]'
                          }`}
                        >
                          Risk Tiers
                        </button>
                      </div>
                    </div>

                    <div className="py-2 sm:py-3 flex items-center justify-center w-full min-w-0 overflow-hidden">
                      {dashboardChartTab === 'SECTOR' ? (
                        <SvgPieChart
                          data={mainDashboardPieData}
                          size={165}
                          donut={true}
                          donutThickness={32}
                          centerTitle={`₹${totalSanctionedCr.toFixed(0)}Cr`}
                          centerSubtitle="Sanctioned"
                          legendPosition="right"
                        />
                      ) : (
                        <SvgPieChart
                          data={mainDashboardRiskPieData}
                          size={165}
                          donut={true}
                          donutThickness={32}
                          centerTitle={`${organizations.length}`}
                          centerSubtitle="Total NGOs"
                          legendPosition="right"
                        />
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#E2E5E9] flex items-center justify-between text-xs text-[#667085]">
                      <span className="truncate pr-2">Statutory tracking: PFMS</span>
                      <button
                        onClick={() => setActiveTab('reports')}
                        className="text-[#174A73] hover:underline font-semibold flex items-center space-x-1 whitespace-nowrap flex-shrink-0"
                      >
                        <span>Download Audit Digest</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================
                  TIER 3 (LAST SECTION): LOCATION OF NGOS & INSTITUTIONS
                 ======================================================== */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <div>
                    <h2 className="text-sm font-bold text-[#1F2937] flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-[#174A73]" />
                      <span>Location of NGOs & Empaneled Institutions</span>
                    </h2>
                    <p className="text-xs text-[#667085] mt-0.5">
                      National spatial footprint of registered NGO headquarters, field operational sites, and surprise audit stations.
                    </p>
                  </div>

                  {/* Map Category Filters */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setDashboardMapFilter('ALL')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                        dashboardMapFilter === 'ALL'
                          ? 'bg-[#174A73] text-white shadow-2xs'
                          : 'bg-white border border-[#E2E5E9] text-[#667085] hover:text-[#1F2937]'
                      }`}
                    >
                      All Locations ({mapMarkers.length})
                    </button>
                    <button
                      onClick={() => setDashboardMapFilter('NGO')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                        dashboardMapFilter === 'NGO'
                          ? 'bg-[#174A73] text-white shadow-2xs'
                          : 'bg-white border border-[#E2E5E9] text-[#667085] hover:text-[#1F2937]'
                      }`}
                    >
                      NGO Headquarters ({mapMarkers.filter(m => m.category === 'NGO').length})
                    </button>
                    <button
                      onClick={() => setDashboardMapFilter('PROJECT')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                        dashboardMapFilter === 'PROJECT'
                          ? 'bg-[#174A73] text-white shadow-2xs'
                          : 'bg-white border border-[#E2E5E9] text-[#667085] hover:text-[#1F2937]'
                      }`}
                    >
                      Project Sites ({mapMarkers.filter(m => m.category === 'PROJECT').length})
                    </button>
                    <button
                      onClick={() => setDashboardMapFilter('HIGH_RISK')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                        dashboardMapFilter === 'HIGH_RISK'
                          ? 'bg-red-600 text-white shadow-2xs'
                          : 'bg-white border border-[#E2E5E9] text-[#667085] hover:text-[#1F2937]'
                      }`}
                    >
                      Critical / High Risk ({mapMarkers.filter(m => m.riskLevel === 'HIGH' || m.riskLevel === 'CRITICAL').length})
                    </button>
                  </div>
                </div>

                {/* The Map Card */}
                <div className="bg-white border border-[#E2E5E9] rounded-xl shadow-xs overflow-hidden">
                  <DrishtiMap
                    markers={filteredDashboardMapMarkers}
                    selectedMarkerId={selectedMapMarkerId}
                    onSelectMarker={m => setSelectedMapMarkerId(m.id)}
                    className="w-full h-[450px]"
                    title="National NGO & Scheme Field Footprint Map"
                  />
                </div>

                {/* Registered Monitored Institutions Quick Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {organizations.slice(0, 4).map(org => (
                    <div
                      key={org.id}
                      className="bg-white border border-[#E2E5E9] rounded-lg p-3.5 shadow-2xs flex flex-col justify-between space-y-3 hover:border-[#174A73] transition"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              org.riskLevel === 'CRITICAL'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : org.riskLevel === 'HIGH'
                                ? 'bg-orange-50 text-orange-800 border border-orange-200'
                                : org.riskLevel === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-green-50 text-green-700 border border-green-200'
                            }`}
                          >
                            {org.riskLevel} ({org.riskScore}/100)
                          </span>
                          <span className="text-[10px] font-mono text-[#667085]">
                            {org.darpanId || org.registrationNumber}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-[#1F2937] mt-1.5 leading-snug line-clamp-1" title={org.name}>
                          {org.name}
                        </h4>
                        <div className="flex items-center space-x-1 text-[11px] text-[#667085] mt-1">
                          <MapPin className="w-3 h-3 text-[#174A73] flex-shrink-0" />
                          <span className="truncate">{org.location.district || org.address}, {org.location.state}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E2E5E9] flex items-center justify-between">
                        <div className="text-[11px]">
                          <span className="text-[#667085]">Sanctioned: </span>
                          <span className="font-bold text-[#1F2937]">₹{(org.totalFundsReceived / 10000000).toFixed(1)}Cr</span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedOrgForDetail(org);
                            setActiveTab('organizations');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-[#16A34A] text-white hover:bg-green-700 shadow-2xs transition"
                        >
                          View Dossier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: ORGANIZATIONS
             ======================================================== */}
          {activeTab === 'organizations' && (
            selectedOrgForDetail ? (
              <OrganizationDetailPage
                organization={selectedOrgForDetail}
                onBack={() => setSelectedOrgForDetail(null)}
                onSelectProject={() => {
                  setActiveTab('projects');
                }}
              />
            ) : (
              <div className="space-y-4 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-lg font-bold text-[#1F2937]">Monitored Organizations</h1>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Statutory registry of empaneled NGOs and executing agencies.
                    </p>
                  </div>
                  <div className="w-full sm:w-64 relative">
                    <Search className="w-3.5 h-3.5 text-[#667085] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by name or reg number..."
                      className="w-full bg-white border border-[#E2E5E9] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#174A73]"
                    />
                  </div>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-lg overflow-x-auto shadow-xs">
                  <table className="w-full text-left text-xs text-[#1F2937]">
                    <thead className="bg-[#F7F8FA] border-b border-[#E2E5E9] text-[11px] font-semibold text-[#667085]">
                      <tr>
                        <th className="px-4 py-3">Organization Name</th>
                        <th className="px-4 py-3">Registration Number</th>
                        <th className="px-4 py-3">Active Projects</th>
                        <th className="px-4 py-3">Funds Sanctioned</th>
                        <th className="px-4 py-3">Compliance Rate</th>
                        <th className="px-4 py-3">Risk Assessment</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E5E9]">
                      {organizations
                        .filter(o =>
                          o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map(org => (
                          <tr key={org.id} className="hover:bg-[#F7F8FA] transition">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-[#1F2937]">{org.name}</div>
                              <div className="text-[11px] text-[#667085]">{org.location.district || org.address}, {org.location.state || 'India'}</div>
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-[#667085]">
                              {org.registrationNumber}
                            </td>
                            <td className="px-4 py-3 font-semibold">{org.activeProjectsCount}</td>
                            <td className="px-4 py-3">
                              ₹{(org.totalFundsReceived / 10000000).toFixed(2)} Cr
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">{org.complianceRate}%</span>
                                <div className="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      org.complianceRate >= 80 ? 'bg-[#16A34A]' : 'bg-[#D97706]'
                                    }`}
                                    style={{ width: `${org.complianceRate}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  org.riskLevel === 'CRITICAL'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : org.riskLevel === 'HIGH'
                                    ? 'bg-orange-50 text-orange-800 border border-orange-200'
                                    : org.riskLevel === 'MEDIUM'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-green-50 text-green-700 border border-green-200'
                                }`}
                              >
                                {org.riskLevel} ({org.riskScore}/100)
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setSelectedOrgForDetail(org)}
                                className="px-3 py-1.5 text-xs font-semibold rounded bg-[#16A34A] text-white hover:bg-green-700 shadow-xs transition flex items-center space-x-1 ml-auto"
                              >
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* ========================================================
              TAB 3: PROJECTS
             ======================================================== */}
          {activeTab === 'projects' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-[#1F2937]">Monitored Scheme Projects</h1>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Physical and financial progress tracked against scheduled milestones.
                  </p>
                </div>
                <div className="w-full sm:w-64 relative">
                  <Search className="w-3.5 h-3.5 text-[#667085] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by code or title..."
                    className="w-full bg-white border border-[#E2E5E9] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#174A73]"
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E2E5E9] rounded-lg overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs text-[#1F2937]">
                  <thead className="bg-[#F7F8FA] border-b border-[#E2E5E9] text-[11px] font-semibold text-[#667085]">
                    <tr>
                      <th className="px-4 py-3">Project Code & Name</th>
                      <th className="px-4 py-3">Implementing Agency</th>
                      <th className="px-4 py-3">Scheme</th>
                      <th className="px-4 py-3">Sanction Budget</th>
                      <th className="px-4 py-3">Physical Progress</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E5E9]">
                    {projects
                      .filter(p =>
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.organizationName.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map(proj => (
                        <tr key={proj.id} className="hover:bg-[#F7F8FA] transition">
                          <td className="px-4 py-3">
                            <span className="font-mono text-[10px] text-[#667085] block">{proj.code}</span>
                            <span className="font-semibold text-[#1F2937]">{proj.name}</span>
                          </td>
                          <td className="px-4 py-3 text-[#667085]">{proj.organizationName}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-[#174A73]">{proj.scheme}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            ₹{(proj.fundingSanctioned / 100000).toFixed(1)} Lakhs
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">{proj.progressPercentage}%</span>
                              <div className="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#174A73]"
                                  style={{ width: `${proj.progressPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                proj.status === 'COMPLETED'
                                  ? 'bg-green-50 text-green-700'
                                  : proj.status === 'ACTIVE'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {proj.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedProjectForLocation(proj)}
                                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-white border border-[#CBD5E1] text-[#174A73] hover:bg-blue-50 hover:border-[#174A73] transition shadow-2xs whitespace-nowrap"
                                title="View project GPS coordinates & geofence map"
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#174A73]" />
                                <span>Location</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProjectForSurprise(proj);
                                  setSurpriseModalOpen(true);
                                }}
                                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition shadow-2xs whitespace-nowrap"
                                title="Dispatch unannounced surprise audit"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                                <span>Audit</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: INSPECTIONS
             ======================================================== */}
          {activeTab === 'inspections' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-[#1F2937]">Field Inspections & Audits</h1>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Regular monitoring schedules and unannounced surprise vigilance audits.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={inspectionFilterType}
                    onChange={e => setInspectionFilterType(e.target.value)}
                    className="bg-white border border-[#E2E5E9] rounded-md px-3 py-1.5 text-xs text-[#1F2937] focus:outline-none"
                  >
                    <option value="ALL">All Inspections ({inspections.length})</option>
                    <option value="SURPRISE">Surprise Audits</option>
                    <option value="REGULAR">Regular Monitoring</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <button
                    onClick={() => setSurpriseModalOpen(true)}
                    className="px-3 py-1.5 rounded-md bg-[#174A73] hover:bg-[#123859] text-white font-medium text-xs flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule Inspection</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border border-[#E2E5E9] rounded-lg overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs text-[#1F2937]">
                  <thead className="bg-[#F7F8FA] border-b border-[#E2E5E9] text-[11px] font-semibold text-[#667085]">
                    <tr>
                      <th className="px-4 py-3">Inspection Code</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Target Project</th>
                      <th className="px-4 py-3">Assigned Inspector</th>
                      <th className="px-4 py-3">Scheduled Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E5E9]">
                    {inspections
                      .filter(i => {
                        if (inspectionFilterType === 'ALL') return true;
                        if (inspectionFilterType === 'SURPRISE') return i.type === 'SURPRISE';
                        if (inspectionFilterType === 'REGULAR') return i.type === 'REGULAR';
                        if (inspectionFilterType === 'IN_PROGRESS') return i.status === 'IN_PROGRESS';
                        if (inspectionFilterType === 'COMPLETED') return i.status === 'COMPLETED';
                        return true;
                      })
                      .map(insp => (
                        <tr key={insp.id} className="hover:bg-[#F7F8FA] transition">
                          <td className="px-4 py-3 font-semibold font-mono text-[#1F2937]">
                            {insp.inspectionCode}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                insp.type === 'SURPRISE'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                            >
                              {insp.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-[#1F2937]">{insp.projectName}</div>
                          </td>
                          <td className="px-4 py-3 text-[#667085]">
                            {insp.assignedInspectorName || 'FQM Monitor'}
                          </td>
                          <td className="px-4 py-3 text-[#667085]">{insp.scheduledDate}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                insp.status === 'COMPLETED'
                                  ? 'bg-green-50 text-green-700'
                                  : insp.status === 'IN_PROGRESS'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {insp.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setSelectedInspectionDetail(insp)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#174A73] hover:bg-[#123859] text-white text-xs font-semibold transition shadow-2xs whitespace-nowrap"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Review</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: LIVE MONITORING
             ======================================================== */}
          {activeTab === 'live_monitoring' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-[#1F2937]">Live Monitoring Feeds</h1>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Real-time video monitoring and site feeds from project installations.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2.5 py-1 rounded bg-blue-50 text-[#174A73] font-medium border border-blue-200">
                    SIMULATED DEMO FEED
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveFeeds.map(feed => (
                  <div key={feed.id} className="bg-white border border-[#E2E5E9] rounded-lg overflow-hidden shadow-xs">
                    <div className="relative aspect-video bg-gray-900 flex items-center justify-center text-white">
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                      <div className="relative z-10 flex flex-col items-center space-y-1">
                        <Radio className="w-6 h-6 text-white/90" />
                        <span className="text-[11px] font-mono tracking-wider text-slate-200">LIVE FEED</span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-600/90 text-white flex items-center space-x-1.5 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          <span>Online</span>
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 text-[10px] font-mono text-gray-300 bg-black/60 px-1.5 py-0.5 rounded">
                        {feed.feedCode} • {feed.cameraModel}
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2 text-xs">
                      <div>
                        <h4 className="font-semibold text-[#1F2937]">{feed.name}</h4>
                        <p className="text-[11px] text-[#667085]">{feed.organizationName}</p>
                      </div>

                      <div className="pt-2 border-t border-[#E2E5E9] flex items-center justify-between text-[11px] text-[#667085]">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-[#174A73]" />
                          <span>Lat: {feed.location.lat.toFixed(2)}, Lng: {feed.location.lng.toFixed(2)}</span>
                        </span>
                        <span className="font-medium text-[#16A34A]">{feed.uptimeHours} Hours Uptime</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 6: RISK & ALERTS
             ======================================================== */}
          {activeTab === 'risk_alerts' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div>
                <h1 className="text-lg font-bold text-[#1F2937]">Risk Intelligence & Vigilance Alerts</h1>
                <p className="text-xs text-[#667085] mt-0.5">
                  Early warning indicators derived from physical anomalies, reporting delays, and inspection findings.
                </p>
              </div>

              {/* Risk Distribution Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-[#E2E5E9] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-green-700">LOW RISK</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span>
                  </div>
                  <div className="text-2xl font-bold text-[#1F2937] mt-1.5">
                    {organizations.filter(o => o.riskLevel === 'LOW').length}
                  </div>
                  <p className="text-[11px] text-[#667085] mt-0.5">Fully compliant entities</p>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-800">MEDIUM RISK</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
                  </div>
                  <div className="text-2xl font-bold text-[#1F2937] mt-1.5">
                    {organizations.filter(o => o.riskLevel === 'MEDIUM').length}
                  </div>
                  <p className="text-[11px] text-[#667085] mt-0.5">Attention advised</p>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-orange-800">HIGH RISK</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]"></span>
                  </div>
                  <div className="text-2xl font-bold text-[#EA580C] mt-1.5">
                    {organizations.filter(o => o.riskLevel === 'HIGH').length}
                  </div>
                  <p className="text-[11px] text-[#667085] mt-0.5">Frequent discrepancies</p>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-red-700">CRITICAL RISK</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>
                  </div>
                  <div className="text-2xl font-bold text-[#DC2626] mt-1.5">
                    {organizations.filter(o => o.riskLevel === 'CRITICAL').length}
                  </div>
                  <p className="text-[11px] text-[#667085] mt-0.5">Surprise inspection required</p>
                </div>
              </div>

              {/* Alerts List */}
              <div className="bg-white border border-[#E2E5E9] rounded-lg shadow-xs p-4">
                <h3 className="text-sm font-semibold text-[#1F2937] mb-3">Compliance & Vigilance Alerts</h3>
                <div className="divide-y divide-[#E2E5E9]">
                  {alerts.map(alert => (
                    <div key={alert.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              alert.severity === 'CRITICAL'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : alert.severity === 'HIGH'
                                ? 'bg-orange-50 text-orange-800 border border-orange-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {alert.severity}
                          </span>
                          <span className="font-semibold text-[#1F2937]">{alert.type.replace(/_/g, ' ')}</span>
                          <span className="text-[11px] text-[#667085]">• {alert.createdAt.split('T')[0]}</span>
                        </div>
                        <p className="text-[#667085] mt-1 leading-relaxed">{alert.message}</p>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => setSurpriseModalOpen(true)}
                          className="px-2.5 py-1 text-xs rounded bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-medium"
                        >
                          Dispatch Audit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 7: EVIDENCE
             ======================================================== */}
          {activeTab === 'evidence' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-[#1F2937]">Evidence Repository</h1>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Geotagged photographic records, camera frames, and field audit documentation.
                  </p>
                </div>
                <div className="text-xs text-[#667085]">
                  Total Records: <b>{evidenceList.length}</b> verified files
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {evidenceList.map(item => (
                  <div key={item.id} className="bg-white border border-[#E2E5E9] rounded-lg overflow-hidden shadow-xs">
                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                      <img
                        src={item.fileUrl}
                        alt={item.caption}
                        className="w-full h-full object-cover"
                      />
                      {item.location && (
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                          {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
                        </div>
                      )}
                    </div>
                    <div className="p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#1F2937]">{item.caption}</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-green-50 text-green-700">
                          {item.verificationStatus}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-[#E2E5E9] flex items-center justify-between text-[11px] text-[#667085]">
                        <span>By: {item.uploaderName}</span>
                        <span>{item.capturedAt.split('T')[0]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 8: FINDINGS
             ======================================================== */}
          {activeTab === 'findings' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-[#1F2937]">Inspection Findings & Discrepancies</h1>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Field observations recorded by quality monitors requiring administrative or corrective response.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#E2E5E9] rounded-lg overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs text-[#1F2937]">
                  <thead className="bg-[#F7F8FA] border-b border-[#E2E5E9] text-[11px] font-semibold text-[#667085]">
                    <tr>
                      <th className="px-4 py-3">Finding Title</th>
                      <th className="px-4 py-3">Implementing Agency</th>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Recorded Date</th>
                      <th className="px-4 py-3 text-right">Statutory Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E5E9]">
                    {findings.map(f => (
                      <tr key={f.id} className="hover:bg-[#F7F8FA] transition">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#1F2937]">{f.title}</div>
                          <div className="text-[11px] text-[#667085] max-w-md">{f.description}</div>
                        </td>
                        <td className="px-4 py-3 text-[#667085]">{f.organizationName}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              f.severity === 'CRITICAL'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : f.severity === 'HIGH'
                                ? 'bg-orange-50 text-orange-800 border border-orange-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {f.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-[#1F2937]">
                            {f.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#667085]">{f.createdAt.split('T')[0]}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setComplianceModalFinding(f)}
                            className="px-2.5 py-1 text-[11px] rounded bg-white border border-[#DC2626] text-[#DC2626] hover:bg-red-50 font-medium"
                          >
                            Issue Notice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 9: COMPLIANCE
             ======================================================== */}
          {activeTab === 'compliance' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-[#1F2937]">Compliance Monitoring Directives</h1>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Formal rectification orders issued to organizations with binding deadlines.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#E2E5E9] rounded-lg overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs text-[#1F2937]">
                  <thead className="bg-[#F7F8FA] border-b border-[#E2E5E9] text-[11px] font-semibold text-[#667085]">
                    <tr>
                      <th className="px-4 py-3">Notice Reference</th>
                      <th className="px-4 py-3">Required Action</th>
                      <th className="px-4 py-3">Target Organization</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E5E9]">
                    {compliance.map(c => (
                      <tr key={c.id} className="hover:bg-[#F7F8FA] transition">
                        <td className="px-4 py-3 font-mono text-[11px] font-semibold text-[#1F2937]">
                          {c.id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#1F2937] max-w-md">{c.actionRequired}</div>
                        </td>
                        <td className="px-4 py-3 text-[#667085]">{c.organizationName}</td>
                        <td className="px-4 py-3 text-[#667085]">{c.dueDate}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              c.status === 'CLOSED'
                                ? 'bg-green-50 text-green-700'
                                : c.status === 'OVERDUE'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => alert(`Reviewing response dossier for directive ${c.id}`)}
                            className="px-2.5 py-1 text-[11px] rounded bg-white border border-[#E2E5E9] text-[#174A73] hover:bg-blue-50 font-medium"
                          >
                            Review Dossier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 10: REPORTS
             ======================================================== */}
          {activeTab === 'reports' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-[#1F2937]">Statutory Oversight Reports</h1>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Generate and export official executive summaries for ministerial review.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E2E5E9] rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-[#1F2937]">Scheme Performance Report</h3>
                    <p className="text-xs text-[#667085] mt-1">
                      Comprehensive progress summary across all 4 central sector schemes.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center space-x-2">
                    <button
                      onClick={() => handleExportReport('Scheme_Performance_Report_2026.pdf')}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-[#174A73] text-white hover:bg-[#123859] flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => handleExportReport('Scheme_Performance_Report_2026.csv')}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-white border border-[#E2E5E9] text-[#1F2937] hover:bg-[#F7F8FA]"
                    >
                      CSV
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-[#1F2937]">Field Inspections Audit</h3>
                    <p className="text-xs text-[#667085] mt-1">
                      Full logs of surprise and scheduled audits, findings, and ratings.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center space-x-2">
                    <button
                      onClick={() => handleExportReport('Field_Inspections_Audit_2026.pdf')}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-[#174A73] text-white hover:bg-[#123859] flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => handleExportReport('Field_Inspections_Audit_2026.csv')}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-white border border-[#E2E5E9] text-[#1F2937] hover:bg-[#F7F8FA]"
                    >
                      CSV
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-[#1F2937]">Vigilance & Risk Briefing</h3>
                    <p className="text-xs text-[#667085] mt-1">
                      High and critical risk organizations with overdue compliance notices.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center space-x-2">
                    <button
                      onClick={() => handleExportReport('Vigilance_Risk_Briefing_2026.pdf')}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-[#174A73] text-white hover:bg-[#123859] flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => handleExportReport('Vigilance_Risk_Briefing_2026.csv')}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-white border border-[#E2E5E9] text-[#1F2937] hover:bg-[#F7F8FA]"
                    >
                      CSV
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-[#1F2937]">Fund Utilization Dossier</h3>
                    <p className="text-xs text-[#667085] mt-1">
                      Financial disbursements vs. ground physical verification certificates.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center space-x-2">
                    <button
                      onClick={() => handleExportReport('Fund_Utilization_Dossier_2026.pdf')}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-[#174A73] text-white hover:bg-[#123859] flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => handleExportReport('Fund_Utilization_Dossier_2026.csv')}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-white border border-[#E2E5E9] text-[#1F2937] hover:bg-[#F7F8FA]"
                    >
                      CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 11: AUDIT TRAIL
             ======================================================== */}
          {activeTab === 'audit_trail' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-[#1F2937]">System Audit Trail</h1>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Immutable statutory log of administrative actions, user logins, and inspection dispatches.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#E2E5E9] rounded-lg overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs text-[#1F2937]">
                  <thead className="bg-[#F7F8FA] border-b border-[#E2E5E9] text-[11px] font-semibold text-[#667085]">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Official / User</th>
                      <th className="px-4 py-3">Action Type</th>
                      <th className="px-4 py-3">Entity</th>
                      <th className="px-4 py-3">Details / Audit Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E5E9]">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-[#F7F8FA] transition">
                        <td className="px-4 py-3 font-mono text-[11px] text-[#667085]">
                          {log.timestamp}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#1F2937]">{log.actorName}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#174A73]">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#667085]">{log.entity}</td>
                        <td className="px-4 py-3 text-[#1F2937]">{log.entityId} • {log.newState || log.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 12: USERS
             ======================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-[#1F2937]">Authorized Users & Access Control</h1>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Credentialed government officials, implementing NGO coordinators, and field inspectors.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#E2E5E9] rounded-lg p-4 shadow-xs">
                <div className="divide-y divide-[#E2E5E9]">
                  <div className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#1F2937]">Shri Rajeshwar Rao, IAS</div>
                      <div className="text-[11px] text-[#667085]">Director General (Super Admin) • ID: GOV-DG-001</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
                      Active
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#1F2937]">Dr. Sunita Sharma</div>
                      <div className="text-[11px] text-[#667085]">Joint Secretary / Monitoring Officer • ID: GOV-JS-012</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
                      Active
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#1F2937]">Inspector Rajesh Verma</div>
                      <div className="text-[11px] text-[#667085]">Field Quality Monitor • Badge: MP-INSP-4081</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
                      On Field Duty
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 13: SETTINGS
             ======================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div>
                <h1 className="text-lg font-bold text-[#1F2937]">System Settings & Governance Rules</h1>
                <p className="text-xs text-[#667085] mt-0.5">
                  Operational thresholds and monitoring parameters.
                </p>
              </div>

              <div className="bg-white border border-[#E2E5E9] rounded-lg p-5 shadow-xs space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-[#1F2937] block mb-1">
                    Geofence Radial Tolerance (Meters)
                  </label>
                  <p className="text-[#667085] text-[11px] mb-1.5">
                    Permitted radius from registered project coordinates for evidence camera verification.
                  </p>
                  <input
                    type="number"
                    defaultValue={200}
                    className="w-full sm:w-48 bg-white border border-[#E2E5E9] rounded-md px-3 py-1.5 text-xs text-[#1F2937]"
                  />
                </div>

                <div className="pt-3 border-t border-[#E2E5E9]">
                  <label className="font-semibold text-[#1F2937] block mb-1">
                    Surprise Inspection Auto-Trigger Threshold
                  </label>
                  <p className="text-[#667085] text-[11px] mb-1.5">
                    Composite risk index at which the system alerts vigilance directorate.
                  </p>
                  <input
                    type="number"
                    defaultValue={75}
                    className="w-full sm:w-48 bg-white border border-[#E2E5E9] rounded-md px-3 py-1.5 text-xs text-[#1F2937]"
                  />
                </div>

                <div className="pt-3 border-t border-[#E2E5E9] flex items-center justify-end">
                  <button
                    onClick={() => alert('Settings updated and committed to central repository.')}
                    className="px-4 py-2 text-xs font-medium rounded-md bg-[#174A73] hover:bg-[#123859] text-white"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <SurpriseInspectionModal
        projects={projects}
        isOpen={surpriseModalOpen}
        initialProjectId={selectedProjectForSurprise?.id}
        onClose={() => {
          setSurpriseModalOpen(false);
          setSelectedProjectForSurprise(null);
        }}
        onInspectionCreated={async () => {
          await refreshAllData();
          setSurpriseModalOpen(false);
          setSelectedProjectForSurprise(null);
        }}
      />

      <ComplianceNoticeModal
        finding={complianceModalFinding}
        isOpen={complianceModalOpen || !!complianceModalFinding}
        onClose={() => {
          setComplianceModalOpen(false);
          setComplianceModalFinding(null);
        }}
        onComplianceCreated={async () => {
          await refreshAllData();
          setComplianceModalOpen(false);
          setComplianceModalFinding(null);
        }}
      />

      {/* Full Popup Screen for Inspection Review */}
      {selectedInspectionDetail && (
        <InspectionDetailModal
          inspection={selectedInspectionDetail}
          onClose={() => setSelectedInspectionDetail(null)}
          onIssueNotice={finding => {
            setSelectedInspectionDetail(null);
            setComplianceModalFinding(finding || null);
            setComplianceModalOpen(true);
          }}
        />
      )}

      {/* Dedicated Project Location & GIS Modal */}
      {selectedProjectForLocation && (
        <ProjectLocationModal
          project={selectedProjectForLocation}
          onClose={() => setSelectedProjectForLocation(null)}
          onOrderAudit={proj => {
            setSelectedProjectForLocation(null);
            setSelectedProjectForSurprise(proj);
            setSurpriseModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
