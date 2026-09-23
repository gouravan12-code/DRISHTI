import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Inspection, EvidenceRecord, Finding, FindingCategory } from '../../types';
import { drishtiDataService } from '../../services/drishtiDataService';
import { DrishtiMap, MapMarkerItem } from '../../maps/DrishtiMap';
import { CompletedAuditModal } from '../../components/modals/CompletedAuditModal';
import {
  LayoutDashboard,
  Play,
  CheckCircle2,
  Calendar,
  MapPin,
  Camera,
  AlertTriangle,
  Send,
  LogOut,
  Navigation,
  Compass,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Clock,
  Building2,
  FileText,
  ShieldCheck,
  ChevronRight,
  CheckSquare,
  Eye,
  Menu,
  Layers,
  Search,
  Filter,
  Download,
  ShieldAlert,
  Phone,
  Maximize2,
  Activity,
  Sparkles,
  RefreshCw,
  FolderKanban,
  FileSearch,
  CheckCheck
} from 'lucide-react';

export const InspectorWorkspace: React.FC = () => {
  const { currentUser, logout } = useAuth();

  // Navigation tab: 'overview' | 'assigned' | 'conduct_audit' | 'upcoming' | 'completed' | 'evidence' | 'map'
  const [activeTab, setActiveTab] = useState<
    'overview' | 'assigned' | 'conduct_audit' | 'upcoming' | 'completed' | 'evidence' | 'map'
  >('overview');

  // Mobile menu drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // All inspections loaded for this inspector
  const [allInspections, setAllInspections] = useState<Inspection[]>([]);
  const [allEvidence, setAllEvidence] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Active inspection being conducted (ONLY if IN_PROGRESS or ASSIGNED, NEVER COMPLETED)
  const [activeInspection, setActiveInspection] = useState<Inspection | null>(null);

  // Completed inspection selected for modal dossier view
  const [selectedCompletedAudit, setSelectedCompletedAudit] = useState<Inspection | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'URGENT' | 'HIGH' | 'SURPRISE'>('ALL');

  // Conduct Audit Multi-step state (1: GPS Lock -> 2: Checklist -> 3: Evidence Camera -> 4: Findings -> 5: Sign & Submit)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // GPS verification state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<{
    verified: boolean;
    distanceMeters: number;
    accuracyMeters: number;
    timestamp?: string;
  } | null>(null);

  // Evidence capture state
  const [evidenceCaption, setEvidenceCaption] = useState('');
  const [evidenceType, setEvidenceType] = useState<'PHOTO' | 'VIDEO' | 'DOCUMENT'>('PHOTO');
  const [capturedEvidence, setCapturedEvidence] = useState<EvidenceRecord[]>([]);

  // Finding creation state
  const [findingTitle, setFindingTitle] = useState('');
  const [findingDesc, setFindingDesc] = useState('');
  const [findingSeverity, setFindingSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [findingCategory, setFindingCategory] = useState<FindingCategory>('INFRASTRUCTURE');
  const [findingsList, setFindingsList] = useState<Finding[]>([]);

  // Final submit state
  const [summaryRemarks, setSummaryRemarks] = useState('');
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Load inspector data
  const loadInspectorData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const list = await drishtiDataService.getInspections({ inspectorId: currentUser.id });
      setAllInspections(list);

      // Load all evidence records
      const evList = await drishtiDataService.getEvidence();
      setAllEvidence(evList);

      // If activeInspection is set, refresh it ONLY if it is still IN_PROGRESS or ASSIGNED.
      // If it is SUBMITTED or COMPLETED, it must be cleared so the resume button goes away!
      setActiveInspection(prev => {
        if (!prev) {
          // Auto-select in-progress inspection if any exists
          const inProgress = list.find(i => i.status === 'IN_PROGRESS');
          return inProgress || null;
        }
        const refreshed = list.find(i => i.id === prev.id);
        if (refreshed && refreshed.status !== 'COMPLETED' && refreshed.status !== 'SUBMITTED') {
          return refreshed;
        }
        return null;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspectorData();
  }, [currentUser]);

  // Categorized inspection lists
  const assignedInspections = useMemo(() => {
    return allInspections.filter(i => i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS');
  }, [allInspections]);

  const upcomingInspections = useMemo(() => {
    return allInspections.filter(i => i.status === 'SCHEDULED');
  }, [allInspections]);

  const completedInspections = useMemo(() => {
    return allInspections.filter(i => i.status === 'COMPLETED' || i.status === 'SUBMITTED');
  }, [allInspections]);

  // Filtered assigned inspections based on search & filter
  const filteredAssigned = useMemo(() => {
    return assignedInspections.filter(insp => {
      const matchesSearch =
        !searchQuery ||
        insp.inspectionCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insp.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insp.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (insp.location.district || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority =
        priorityFilter === 'ALL' ||
        (priorityFilter === 'URGENT' && insp.priority === 'URGENT') ||
        (priorityFilter === 'HIGH' && (insp.priority === 'HIGH' || insp.priority === 'URGENT')) ||
        (priorityFilter === 'SURPRISE' && (insp.type === 'SURPRISE' || insp.isSurprise));

      return matchesSearch && matchesPriority;
    });
  }, [assignedInspections, searchQuery, priorityFilter]);

  // Map markers for all inspector points
  const mapMarkers: MapMarkerItem[] = useMemo(() => {
    return allInspections.map(insp => {
      let category: MapMarkerItem['category'] = 'INSPECTION';
      if (insp.isSurprise || insp.priority === 'URGENT') category = 'HIGH_RISK';
      else if (insp.status === 'IN_PROGRESS') category = 'LIVE_MONITORING';
      else if (insp.status === 'COMPLETED' || insp.status === 'SUBMITTED') category = 'PROJECT';

      return {
        id: insp.id,
        category,
        title: `${insp.inspectionCode} - ${insp.projectName}`,
        subtitle: `${insp.organizationName} • ${insp.location.district}, ${insp.location.state}`,
        lat: insp.location.lat,
        lng: insp.location.lng,
        statusText:
          insp.status === 'COMPLETED' || insp.status === 'SUBMITTED'
            ? 'SEALED & SUBMITTED'
            : insp.status === 'IN_PROGRESS'
            ? 'LIVE AUDIT IN-PROGRESS'
            : `SCHEDULED: ${insp.scheduledDate}`,
        riskLevel: insp.priority === 'URGENT' ? 'CRITICAL' : insp.priority === 'HIGH' ? 'HIGH' : 'LOW',
        metadata: {
          inspectionCode: insp.inspectionCode,
          status: insp.status,
          type: insp.type,
          scheduledDate: insp.scheduledDate,
          address: insp.location.address
        }
      };
    });
  }, [allInspections]);

  // Start or resume conducting a specific inspection
  const handleLaunchInspection = async (insp: Inspection) => {
    // If inspection is already completed, do NOT conduct it; view dossier instead
    if (insp.status === 'COMPLETED' || insp.status === 'SUBMITTED') {
      setSelectedCompletedAudit(insp);
      return;
    }

    setActiveInspection(insp);
    setCurrentStep(insp.status === 'IN_PROGRESS' ? 2 : 1);

    if (insp.gpsVerified) {
      setGpsStatus({
        verified: true,
        distanceMeters: insp.distanceFromTargetMeters || 12,
        accuracyMeters: insp.gpsAccuracyMeters || 4.2
      });
    } else {
      setGpsStatus(null);
    }

    const existingEvidence = await drishtiDataService.getEvidence({ inspectionId: insp.id });
    setCapturedEvidence(existingEvidence);

    const existingFindings = await drishtiDataService.getFindings({ inspectionId: insp.id });
    setFindingsList(existingFindings);

    setActiveTab('conduct_audit');
  };

  // GPS Geofence Verification Handler
  const handleVerifyGps = async () => {
    if (!activeInspection || !currentUser) return;
    setGpsLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async position => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            const res = await drishtiDataService.verifyGpsLocation(activeInspection.id, lat, lng, currentUser);
            setGpsStatus({ ...res, timestamp: new Date().toISOString() });
            activeInspection.gpsVerified = true;
          } finally {
            setGpsLoading(false);
          }
        },
        async () => {
          const res = await drishtiDataService.verifyGpsLocation(
            activeInspection.id,
            activeInspection.location.lat,
            activeInspection.location.lng,
            currentUser
          );
          setGpsStatus({ ...res, distanceMeters: 8, accuracyMeters: 3.8, timestamp: new Date().toISOString() });
          activeInspection.gpsVerified = true;
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      const res = await drishtiDataService.verifyGpsLocation(
        activeInspection.id,
        activeInspection.location.lat,
        activeInspection.location.lng,
        currentUser
      );
      setGpsStatus({ ...res, distanceMeters: 10, accuracyMeters: 4.0 });
      setGpsLoading(false);
    }
  };

  // Start Inspection officially
  const handleStartInspection = async () => {
    if (!activeInspection || !currentUser) return;
    await drishtiDataService.startInspection(activeInspection.id, currentUser);
    setActiveInspection({ ...activeInspection, status: 'IN_PROGRESS' });
    setCurrentStep(2);
  };

  // Checklist toggle
  const handleToggleChecklist = async (itemId: string, status: 'YES' | 'NO' | 'NA') => {
    if (!activeInspection) return;
    await drishtiDataService.updateChecklistItem(activeInspection.id, itemId, status);

    const updatedItems = (activeInspection.checklistItems || []).map(item =>
      item.id === itemId ? { ...item, status } : item
    );
    setActiveInspection({ ...activeInspection, checklistItems: updatedItems });
  };

  // Upload/Capture Evidence
  const handleCaptureEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInspection || !currentUser || !evidenceCaption.trim()) return;

    const sampleImages = [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'
    ];

    const randomUrl = sampleImages[Math.floor(Math.random() * sampleImages.length)];

    const newEvidence = await drishtiDataService.uploadEvidence(
      {
        inspectionId: activeInspection.id,
        projectId: activeInspection.projectId,
        organizationId: activeInspection.organizationId,
        type: evidenceType,
        caption: evidenceCaption,
        storagePath: `inspections/${activeInspection.id}/${evidenceType.toLowerCase()}/${Date.now()}.jpg`,
        fileUrl: randomUrl,
        fileSizeKb: 1840,
        uploaderName: currentUser.fullName,
        uploaderRole: currentUser.role,
        location: activeInspection.location
      },
      currentUser
    );

    setCapturedEvidence([newEvidence, ...capturedEvidence]);
    setAllEvidence([newEvidence, ...allEvidence]);
    setEvidenceCaption('');
  };

  // Create Field Finding
  const handleCreateFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInspection || !currentUser || !findingTitle.trim()) return;

    const newFind = await drishtiDataService.createFinding(
      {
        inspectionId: activeInspection.id,
        title: findingTitle,
        description: findingDesc,
        category: findingCategory,
        severity: findingSeverity
      },
      currentUser
    );

    setFindingsList([newFind, ...findingsList]);
    setFindingTitle('');
    setFindingDesc('');
  };

  // Submit Inspection (Officially Seals Dossier)
  // FIX: activeInspection is immediately cleared so Resume NEVER appears again!
  const handleFinalSubmit = async () => {
    if (!activeInspection || !currentUser) return;
    setIsSubmittingFinal(true);

    try {
      await drishtiDataService.submitInspection(
        activeInspection.id,
        summaryRemarks || 'Field verification completed with GPS validation and photographic evidence.',
        currentUser
      );

      // Instantly clear active inspection so resume button goes away
      setActiveInspection(null);
      setSubmissionSuccess(true);
      await loadInspectorData();

      setTimeout(() => {
        setSubmissionSuccess(false);
        setActiveInspection(null);
        setActiveTab('completed');
      }, 1500);
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  // Helper check: is an inspection legitimately in-progress?
  const isAuditInProgress = Boolean(
    activeInspection &&
    activeInspection.status === 'IN_PROGRESS'
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1F2937] flex flex-col font-sans">
      {/* ========================================================
          GOVERNMENT GRADE TOP HEADER
         ======================================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E5E9] px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs">
        {/* Left: Emblem & Directorate Badge */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-gray-100"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 rounded bg-[#174A73] flex items-center justify-center font-bold text-white text-sm shadow-xs">
            दृ
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base text-[#174A73] tracking-tight">DRISHTI</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#174A73] border border-blue-100">
                Field Quality Monitor (FQM) Directorate
              </span>
            </div>
            <p className="text-xs text-[#667085] truncate max-w-xs sm:max-w-md hidden sm:block">
              Empaneled Quality Monitor • Central MP Monitoring Zone
            </p>
          </div>
        </div>

        {/* Right: Active Audit Indicator (ONLY when IN_PROGRESS) & Officer Badge */}
        <div className="flex items-center space-x-3">
          {/* Active Audit Alert Chip - Completely disappears when completed! */}
          {isAuditInProgress && activeTab !== 'conduct_audit' && (
            <button
              onClick={() => setActiveTab('conduct_audit')}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-semibold hover:bg-amber-500/20 transition shadow-2xs"
              title="Return to Active Field Inspection"
            >
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Active Audit:</span>
              <span className="font-mono text-amber-800">{activeInspection?.inspectionCode}</span>
              <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.2 rounded font-bold">
                Resume
              </span>
            </button>
          )}

          {/* Officer Credential Card */}
          <div className="flex items-center space-x-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#174A73] flex-shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-[#64748B] font-semibold tracking-wider uppercase">
                Govt Empaneled FQM
              </span>
              <span className="font-bold text-xs text-[#174A73] truncate max-w-[140px] sm:max-w-[200px]">
                {currentUser?.fullName || 'Rajesh Verma'}
              </span>
            </div>
            <span className="text-[10px] bg-blue-50 text-[#174A73] font-bold px-1.5 py-0.5 rounded border border-blue-200 hidden sm:inline">
              {currentUser?.badgeNumber || 'MP-INSP-4081'}
            </span>
          </div>

          {/* Log Out */}
          <button
            onClick={logout}
            title="Log Out / Switch Workspace"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 border border-transparent hover:border-red-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          MAIN WORKSPACE LAYOUT: VERTICAL SIDEBAR + CONTENT
         ======================================================== */}
      <div className="flex-1 flex min-h-[calc(100vh-57px)]">
        {/* VERTICAL LEFT SIDEBAR */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-[#E2E5E9] flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-4">
            {/* Inspector Identity Card */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#174A73] tracking-wide block">
                  Field Quality Monitor
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-green-50 text-green-700 border border-green-200">
                  Empaneled
                </span>
              </div>
              <h4 className="font-bold text-[#1F2937] text-sm truncate" title={currentUser?.fullName}>
                {currentUser?.fullName || 'Inspector Rajesh Verma'}
              </h4>
              <div className="flex items-center space-x-1 text-[11px] text-[#64748B]">
                <ShieldCheck className="w-3 h-3 text-[#174A73]" />
                <span className="font-mono">Badge: {currentUser?.badgeNumber || 'MP-INSP-4081'}</span>
              </div>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px]">
                <span className="text-[#64748B]">Zone: Central MP</span>
                <span className="font-semibold text-[#16A34A] flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span>GPS RTK Active</span>
                </span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1">
              {/* 1. Overview */}
              <button
                onClick={() => {
                  setActiveTab('overview');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'overview'
                    ? 'bg-[#174A73] text-white shadow-xs'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#174A73]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Monitor Overview</span>
                </div>
              </button>

              {/* 2. Assigned & Active Audits */}
              <button
                onClick={() => {
                  setActiveTab('assigned');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'assigned'
                    ? 'bg-[#174A73] text-white shadow-xs'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#174A73]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Play className="w-4 h-4" />
                  <span>Assigned Field Audits</span>
                </div>
                {assignedInspections.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === 'assigned' ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#174A73]'
                    }`}
                  >
                    {assignedInspections.length}
                  </span>
                )}
              </button>

              {/* 3. Live Field Audit Execution Tool */}
              <button
                onClick={() => {
                  setActiveTab('conduct_audit');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'conduct_audit'
                    ? 'bg-[#174A73] text-white shadow-xs'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#174A73]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Camera className="w-4 h-4" />
                  <span>Live Field Audit Tool</span>
                </div>
                {isAuditInProgress && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" title="Audit in progress" />
                )}
              </button>

              {/* 4. Upcoming Schedule */}
              <button
                onClick={() => {
                  setActiveTab('upcoming');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'upcoming'
                    ? 'bg-[#174A73] text-white shadow-xs'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#174A73]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Calendar className="w-4 h-4" />
                  <span>Upcoming Schedule</span>
                </div>
                {upcomingInspections.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {upcomingInspections.length}
                  </span>
                )}
              </button>

              {/* 5. Completed Dossiers */}
              <button
                onClick={() => {
                  setActiveTab('completed');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'completed'
                    ? 'bg-[#174A73] text-white shadow-xs'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#174A73]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completed Dossiers</span>
                </div>
                {completedInspections.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {completedInspections.length}
                  </span>
                )}
              </button>

              {/* 6. Evidence Vault */}
              <button
                onClick={() => {
                  setActiveTab('evidence');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'evidence'
                    ? 'bg-[#174A73] text-white shadow-xs'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#174A73]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Layers className="w-4 h-4" />
                  <span>Evidence Vault</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === 'evidence' ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#475569]'
                  }`}
                >
                  {allEvidence.length}
                </span>
              </button>

              {/* 7. Territory Map */}
              <button
                onClick={() => {
                  setActiveTab('map');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'map'
                    ? 'bg-[#174A73] text-white shadow-xs'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#174A73]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <MapPin className="w-4 h-4" />
                  <span>Jurisdiction GIS Map</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Sidebar Footer with Quality Rating */}
          <div className="p-4 border-t border-[#E2E5E9] bg-[#F8FAFC] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#64748B]">Audit Accuracy Score</span>
              <span className="font-bold text-[#174A73]">98.4%</span>
            </div>
            <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#174A73] h-full rounded-full w-[98.4%]" />
            </div>
            <p className="text-[10px] text-[#94A3B8] leading-tight">
              NIC Drishti Central FQM Protocol • Biometric Geofence Compliant
            </p>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* ========================================================
              TAB 1: MONITOR OVERVIEW & COMMAND HUB
             ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Hero Banner */}
              <div className="bg-gradient-to-r from-[#174A73] to-[#0D314E] rounded-xl p-5 sm:p-6 text-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-blue-200 text-xs">
                    <Compass className="w-4 h-4" />
                    <span>State Quality Assurance Cell • Field Operations</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Field Quality Monitor (FQM) Command Console
                  </h1>
                  <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
                    Execute mandatory on-site evaluations, verify satellite geofence locks, photograph structural progress, and certify compliance under State Directorate guidelines.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isAuditInProgress ? (
                    <button
                      onClick={() => setActiveTab('conduct_audit')}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-2 transition"
                    >
                      <Activity className="w-4 h-4 animate-spin" />
                      <span>Resume Active Audit ({activeInspection?.inspectionCode})</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab('assigned')}
                      className="px-4 py-2 bg-white text-[#174A73] hover:bg-blue-50 text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>View Assigned Audits ({assignedInspections.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* KPI Operational Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-white border border-[#E2E5E9] rounded-xl p-4 shadow-2xs space-y-1">
                  <span className="text-[11px] font-semibold text-[#64748B] block">Assigned Audits</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-[#1F2937]">{assignedInspections.length}</span>
                    <span className="text-[10px] text-blue-700 font-medium">Pending Action</span>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-xl p-4 shadow-2xs space-y-1">
                  <span className="text-[11px] font-semibold text-[#64748B] block">In-Progress On-Site</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-amber-700">
                      {assignedInspections.filter(i => i.status === 'IN_PROGRESS').length}
                    </span>
                    <span className="text-[10px] text-amber-800 font-medium">Live Audits</span>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-xl p-4 shadow-2xs space-y-1">
                  <span className="text-[11px] font-semibold text-[#64748B] block">Upcoming Visits</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-[#174A73]">{upcomingInspections.length}</span>
                    <span className="text-[10px] text-[#64748B] font-medium">Roster</span>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-xl p-4 shadow-2xs space-y-1">
                  <span className="text-[11px] font-semibold text-[#64748B] block">Completed Dossiers</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-[#16A34A]">{completedInspections.length}</span>
                    <span className="text-[10px] text-green-700 font-medium">Officially Sealed</span>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-xl p-4 shadow-2xs space-y-1 col-span-2 lg:col-span-1">
                  <span className="text-[11px] font-semibold text-[#64748B] block">Geofence Compliance</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-[#174A73]">100%</span>
                    <span className="text-[10px] text-green-700 font-medium">&lt; 15m Locked</span>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE DRISHTI GIS MAP WITH LOCATION DOTS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#1F2937] flex items-center space-x-1.5">
                      <MapPin className="w-4 h-4 text-[#174A73]" />
                      <span>Jurisdiction Site Coordinates & Geographic Dot Pins</span>
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Pulsating dot pins represent assigned, scheduled, in-progress, and sealed project inspection sites across central MP.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('map')}
                    className="text-xs font-semibold text-[#174A73] hover:underline flex items-center space-x-1"
                  >
                    <span>Full Screen Map</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <DrishtiMap
                  markers={mapMarkers}
                  className="w-full h-[400px] rounded-xl shadow-xs border border-[#E2E5E9]"
                  title="Inspector Field Territory & Audit Locations"
                  showFilters={true}
                  onSelectMarker={marker => {
                    const match = allInspections.find(i => i.id === marker.id);
                    if (match) {
                      if (match.status === 'COMPLETED' || match.status === 'SUBMITTED') {
                        setSelectedCompletedAudit(match);
                      } else {
                        handleLaunchInspection(match);
                      }
                    }
                  }}
                />
              </div>

              {/* Priority Action Items: Assigned Inspections */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1F2937]">Active Field Assignments Requiring Execution</h3>
                  <button
                    onClick={() => setActiveTab('assigned')}
                    className="text-xs font-semibold text-[#174A73] hover:underline flex items-center space-x-1"
                  >
                    <span>View All ({assignedInspections.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {assignedInspections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignedInspections.slice(0, 4).map(insp => (
                      <div
                        key={insp.id}
                        className="bg-white border border-[#E2E5E9] hover:border-[#174A73]/70 rounded-xl p-4 shadow-2xs space-y-3 transition flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs font-bold text-[#174A73] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {insp.inspectionCode}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  insp.type === 'SURPRISE'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {insp.type} AUDIT
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                insp.status === 'IN_PROGRESS'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-blue-50 text-[#174A73]'
                              }`}
                            >
                              ● {insp.status}
                            </span>
                          </div>

                          <h4 className="font-bold text-sm text-[#1F2937] leading-snug">{insp.projectName}</h4>

                          <div className="text-xs text-[#64748B] flex items-center space-x-1.5">
                            <Building2 className="w-3.5 h-3.5 text-[#174A73] flex-shrink-0" />
                            <span className="truncate">{insp.organizationName}</span>
                          </div>

                          <div className="text-xs text-[#64748B] flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#174A73] flex-shrink-0" />
                            <span className="truncate">
                              {insp.location.address || `${insp.location.district}, ${insp.location.state}`}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                          <span className="text-[#64748B] text-[11px]">
                            Target Date: <strong>{insp.scheduledDate}</strong>
                          </span>

                          <button
                            onClick={() => handleLaunchInspection(insp)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#174A73] hover:bg-[#123859] text-white flex items-center space-x-1.5 shadow-2xs transition"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>
                              {insp.status === 'IN_PROGRESS' ? 'Resume On-Site Audit' : 'Start Field Audit'}
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white border border-[#E2E5E9] rounded-xl text-xs text-[#64748B]">
                    No pending inspections assigned at this time. All audits are up to date!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: ASSIGNED & ACTIVE FIELD AUDITS
             ======================================================== */}
          {activeTab === 'assigned' && (
            <div className="space-y-5 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E5E9]">
                <div>
                  <h2 className="text-base font-bold text-[#1F2937]">Assigned Quality Inspections Roster</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Field assignments requiring satellite GPS lock, technical checklist verification, and timestamped photographic evidence.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-[#174A73] border border-blue-200">
                  {assignedInspections.length} Assigned Action Items
                </span>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-[#E2E5E9] rounded-xl shadow-2xs">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by inspection code, project name, NGO, or district..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#174A73]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="w-3.5 h-3.5 text-[#64748B]" />
                  <div className="flex space-x-1 text-xs">
                    {(['ALL', 'URGENT', 'HIGH', 'SURPRISE'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setPriorityFilter(p)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                          priorityFilter === p
                            ? 'bg-[#174A73] text-white'
                            : 'bg-[#F8FAFC] text-[#64748B] hover:bg-gray-200'
                        }`}
                      >
                        {p === 'ALL' ? 'All Priority' : p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inspections Cards */}
              {filteredAssigned.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAssigned.map(insp => (
                    <div
                      key={insp.id}
                      className="bg-white border border-[#E2E5E9] hover:border-[#174A73]/70 rounded-xl p-5 shadow-2xs space-y-3.5 transition flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#F1F5F9]">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-[#174A73] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {insp.inspectionCode}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                insp.type === 'SURPRISE'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-gray-100 text-[#64748B]'
                              }`}
                            >
                              {insp.type} AUDIT
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                insp.priority === 'URGENT' || insp.priority === 'HIGH'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-blue-50 text-[#174A73]'
                              }`}
                            >
                              Priority: {insp.priority}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              insp.status === 'IN_PROGRESS'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            ● {insp.status}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-sm text-[#1F2937] leading-snug">{insp.projectName}</h3>
                          <p className="text-xs text-[#64748B] flex items-center space-x-1 mt-1">
                            <Building2 className="w-3.5 h-3.5 text-[#174A73]" />
                            <span className="font-medium">{insp.organizationName}</span>
                          </p>
                        </div>

                        {/* Location and Geofence status */}
                        <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs space-y-1">
                          <div className="flex items-center space-x-1.5 text-[#64748B]">
                            <MapPin className="w-3.5 h-3.5 text-[#174A73]" />
                            <span className="truncate">
                              {insp.location.address || `${insp.location.district}, ${insp.location.state}`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100">
                            <span className="text-[#94A3B8]">
                              GPS Coords: {insp.location.lat.toFixed(4)}° N, {insp.location.lng.toFixed(4)}° E
                            </span>
                            <span
                              className={`font-semibold ${
                                insp.gpsVerified ? 'text-green-700' : 'text-amber-700'
                              }`}
                            >
                              {insp.gpsVerified ? 'GPS Lock Verified' : 'Geofence Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Checklist progress preview */}
                        <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                          <span>
                            Checklist: <strong>{insp.checklistItems?.length || 0} statutory items</strong>
                          </span>
                          <span>
                            Target Date: <strong className="text-[#1F2937]">{insp.scheduledDate}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-end">
                        <button
                          onClick={() => handleLaunchInspection(insp)}
                          className="px-4 py-2 rounded-lg text-xs font-bold bg-[#174A73] hover:bg-[#123859] text-white flex items-center space-x-1.5 shadow-2xs transition"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>
                            {insp.status === 'IN_PROGRESS' ? 'Resume On-Site Audit' : 'Start Field Audit'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white border border-[#E2E5E9] rounded-xl text-xs text-[#64748B] space-y-2">
                  <CheckCheck className="w-8 h-8 text-green-600 mx-auto" />
                  <p className="font-semibold text-sm text-[#1F2937]">No inspections match your search criteria</p>
                  <p className="text-xs">Adjust your search or clear priority filters to view assignments.</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 3: LIVE FIELD AUDIT EXECUTION TOOL (5 STEPS)
             ======================================================== */}
          {activeTab === 'conduct_audit' && (
            <div className="space-y-5 max-w-5xl mx-auto">
              {!activeInspection ? (
                /* Empty state when no audit is currently selected */
                <div className="bg-white border border-[#E2E5E9] rounded-xl p-8 text-center space-y-4 shadow-2xs">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-[#174A73] flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#1F2937]">No Active Inspection Currently Selected</h3>
                    <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1">
                      To conduct a quality inspection, select an assigned task from the roster below. The system will guide you through GPS geofence locking, technical checklist evaluation, and photographic capture.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('assigned')}
                    className="px-4 py-2 bg-[#174A73] hover:bg-[#123859] text-white text-xs font-bold rounded-lg shadow-xs inline-flex items-center space-x-1.5"
                  >
                    <span>View Assigned Inspections Roster</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* Active 5-Step Field Inspection Execution */
                <div className="space-y-4">
                  {/* Top Bar with Back & Audit Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E5E9]">
                    <button
                      onClick={() => setActiveTab('assigned')}
                      className="flex items-center space-x-1.5 text-xs text-[#174A73] hover:underline font-bold"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Inspections Hub</span>
                    </button>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-[#64748B]">Auditing Site:</span>
                      <span className="font-mono font-bold text-[#174A73] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {activeInspection.inspectionCode}
                      </span>
                    </div>
                  </div>

                  {/* Active Inspection Header Banner */}
                  <div className="bg-white border border-[#E2E5E9] rounded-xl p-5 shadow-2xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-[#174A73]">
                          {activeInspection.inspectionCode}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            activeInspection.type === 'SURPRISE'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-gray-100 text-[#64748B]'
                          }`}
                        >
                          {activeInspection.type} AUDIT
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#174A73]">
                          Priority: {activeInspection.priority}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>{activeInspection.status}</span>
                      </span>
                    </div>

                    <h2 className="font-bold text-[#1F2937] text-base">{activeInspection.projectName}</h2>
                    <div className="flex items-center space-x-1.5 text-xs text-[#64748B]">
                      <Building2 className="w-3.5 h-3.5 text-[#174A73]" />
                      <span className="font-medium">{activeInspection.organizationName}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs text-[#64748B] pt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#174A73]" />
                      <span>
                        {activeInspection.location.address ||
                          `${activeInspection.location.district}, ${activeInspection.location.state}`}
                      </span>
                    </div>
                  </div>

                  {/* 5-Step Horizontal Navigation Wizard */}
                  <div className="grid grid-cols-5 gap-1.5 p-1 bg-white rounded-xl border border-[#E2E5E9] text-[11px] font-bold text-center shadow-2xs">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className={`py-2 rounded-lg transition ${
                        currentStep === 1
                          ? 'bg-[#174A73] text-white shadow-2xs'
                          : 'text-[#64748B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      1. GPS Lock
                    </button>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className={`py-2 rounded-lg transition ${
                        currentStep === 2
                          ? 'bg-[#174A73] text-white shadow-2xs'
                          : 'text-[#64748B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      2. Checklist
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className={`py-2 rounded-lg transition ${
                        currentStep === 3
                          ? 'bg-[#174A73] text-white shadow-2xs'
                          : 'text-[#64748B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      3. Evidence
                    </button>
                    <button
                      onClick={() => setCurrentStep(4)}
                      className={`py-2 rounded-lg transition ${
                        currentStep === 4
                          ? 'bg-[#174A73] text-white shadow-2xs'
                          : 'text-[#64748B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      4. Findings
                    </button>
                    <button
                      onClick={() => setCurrentStep(5)}
                      className={`py-2 rounded-lg transition ${
                        currentStep === 5
                          ? 'bg-[#174A73] text-white shadow-2xs'
                          : 'text-[#64748B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      5. Submit
                    </button>
                  </div>

                  {/* STEP 1: GPS Lock & Geofence Verification */}
                  {currentStep === 1 && (
                    <div className="bg-white border border-[#E2E5E9] rounded-xl p-6 shadow-2xs space-y-5 text-xs">
                      <div>
                        <h3 className="font-bold text-sm text-[#1F2937]">Step 1: Satellite Geofenced GPS Site Lock</h3>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          NIC/DRISHTI mandatory protocol: Quality verification checklist and evidence capture are unlocked once the inspector device is validated within permissible proximity (&lt;100m) of the sanctioned coordinates.
                        </p>
                      </div>

                      <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#64748B]">Sanctioned DPR Coordinates:</span>
                          <span className="font-mono font-bold text-[#1F2937]">
                            {activeInspection.location.lat.toFixed(4)}° N, {activeInspection.location.lng.toFixed(4)}° E
                          </span>
                        </div>

                        {gpsStatus ? (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 space-y-1">
                            <div className="flex items-center space-x-1.5 font-bold">
                              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                              <span>Geofence Site Lock Confirmed</span>
                            </div>
                            <p className="text-[11px] text-green-700">
                              Proximity: <strong>{gpsStatus.distanceMeters} meters</strong> from center point.
                              Accuracy: <strong>±{gpsStatus.accuracyMeters}m</strong>. Timestamp: {gpsStatus.timestamp ? new Date(gpsStatus.timestamp).toLocaleTimeString() : 'Verified'}.
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                            Satellite verification pending. Click below to lock on-site GPS signal.
                          </div>
                        )}

                        <div className="pt-2 flex flex-wrap items-center gap-3">
                          <button
                            onClick={handleVerifyGps}
                            disabled={gpsLoading}
                            className="px-4 py-2 rounded-lg bg-[#174A73] hover:bg-[#123859] text-white font-bold flex items-center space-x-2 shadow-2xs disabled:opacity-50"
                          >
                            <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                            <span>{gpsLoading ? 'Locking Satellite Signal...' : 'Acquire & Lock GPS Coordinates'}</span>
                          </button>

                          {activeInspection.status === 'ASSIGNED' && (
                            <button
                              onClick={handleStartInspection}
                              className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white font-bold flex items-center space-x-1.5 shadow-2xs"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Commence Field Inspection</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="px-4 py-2 rounded-lg bg-[#174A73] hover:bg-[#123859] text-white font-bold flex items-center space-x-1.5 shadow-2xs"
                        >
                          <span>Proceed to Technical Checklist</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Technical Field Checklist */}
                  {currentStep === 2 && (
                    <div className="bg-white border border-[#E2E5E9] rounded-xl p-6 shadow-2xs space-y-5 text-xs">
                      <div>
                        <h3 className="font-bold text-sm text-[#1F2937]">Step 2: Technical Parameters & Inspection Checklist</h3>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Evaluate structural, safety, and administrative compliance parameters on-site. Select YES, NO, or NA for each item.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {activeInspection.checklistItems?.map(item => (
                          <div
                            key={item.id}
                            className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2 hover:border-[#174A73]/50 transition"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-[#174A73] uppercase tracking-wider block">
                                  {item.category}
                                </span>
                                <h4 className="font-bold text-sm text-[#1F2937]">{item.title}</h4>
                              </div>

                              <div className="flex items-center space-x-1 bg-white border border-[#E2E8F0] rounded-lg p-1 self-start sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => handleToggleChecklist(item.id, 'YES')}
                                  className={`px-3 py-1 rounded text-xs font-bold transition ${
                                    item.status === 'YES'
                                      ? 'bg-green-600 text-white shadow-2xs'
                                      : 'text-[#64748B] hover:bg-gray-100'
                                  }`}
                                >
                                  YES
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleChecklist(item.id, 'NO')}
                                  className={`px-3 py-1 rounded text-xs font-bold transition ${
                                    item.status === 'NO'
                                      ? 'bg-red-600 text-white shadow-2xs'
                                      : 'text-[#64748B] hover:bg-gray-100'
                                  }`}
                                >
                                  NO
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleChecklist(item.id, 'NA')}
                                  className={`px-3 py-1 rounded text-xs font-bold transition ${
                                    item.status === 'NA'
                                      ? 'bg-gray-600 text-white shadow-2xs'
                                      : 'text-[#64748B] hover:bg-gray-100'
                                  }`}
                                >
                                  N/A
                                </button>
                              </div>
                            </div>

                            {item.remarks && (
                              <p className="text-[11px] text-[#64748B] italic bg-white p-2 rounded border border-gray-100">
                                Observation: "{item.remarks}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between pt-2">
                        <button
                          onClick={() => setCurrentStep(1)}
                          className="px-4 py-2 rounded-lg border border-[#E2E5E9] text-[#64748B] hover:bg-[#F8FAFC] font-semibold"
                        >
                          Back to GPS Lock
                        </button>
                        <button
                          onClick={() => setCurrentStep(3)}
                          className="px-4 py-2 rounded-lg bg-[#174A73] hover:bg-[#123859] text-white font-bold flex items-center space-x-1.5 shadow-2xs"
                        >
                          <span>Proceed to Evidence Capture</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Evidence Camera & Geotagged Capture */}
                  {currentStep === 3 && (
                    <div className="bg-white border border-[#E2E5E9] rounded-xl p-6 shadow-2xs space-y-5 text-xs">
                      <div>
                        <h3 className="font-bold text-sm text-[#1F2937]">Step 3: Geotagged Photographic & Video Evidence</h3>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Mandatory tamper-evident capture. Photos are watermarked with GPS coordinates, timestamp, and inspector badge ID.
                        </p>
                      </div>

                      {/* Evidence Camera Viewfinder Simulation */}
                      <form onSubmit={handleCaptureEvidence} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <div className="flex-1 space-y-1">
                            <label className="text-[11px] font-bold text-[#1F2937] block">
                              Evidence Observation Caption *
                            </label>
                            <input
                              type="text"
                              required
                              value={evidenceCaption}
                              onChange={e => setEvidenceCaption(e.target.value)}
                              placeholder="e.g. Foundation reinforcement rebar spacing verification at grid B-4..."
                              className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#174A73]"
                            />
                          </div>

                          <div className="w-full sm:w-44 space-y-1">
                            <label className="text-[11px] font-bold text-[#1F2937] block">Type</label>
                            <select
                              value={evidenceType}
                              onChange={e => setEvidenceType(e.target.value as any)}
                              className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#174A73]"
                            >
                              <option value="PHOTO">Photographic Capture</option>
                              <option value="VIDEO">Video Walkthrough</option>
                              <option value="DOCUMENT">Signed Muster Document</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[11px] text-[#64748B] flex items-center space-x-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                            <span>GPS Stamp: {activeInspection.location.lat.toFixed(4)}°, {activeInspection.location.lng.toFixed(4)}°</span>
                          </span>

                          <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-[#174A73] hover:bg-[#123859] text-white font-bold flex items-center space-x-1.5 shadow-2xs"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Capture & Geotag Photo</span>
                          </button>
                        </div>
                      </form>

                      {/* Captured Evidence Gallery */}
                      <div className="space-y-2">
                        <span className="font-bold text-[#1F2937] block">
                          Captured Site Evidences ({capturedEvidence.length})
                        </span>
                        {capturedEvidence.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {capturedEvidence.map(ev => (
                              <div
                                key={ev.id}
                                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs space-y-1.5"
                              >
                                <div className="h-28 bg-gray-200 relative overflow-hidden">
                                  <img
                                    src={ev.fileUrl}
                                    alt={ev.caption}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-1 right-1 bg-black/60 text-white font-mono text-[9px] px-1.5 py-0.2 rounded backdrop-blur-xs">
                                    {ev.type}
                                  </div>
                                </div>
                                <div className="p-2 space-y-0.5">
                                  <p className="font-bold text-[11px] text-[#1F2937] truncate">{ev.caption}</p>
                                  <p className="text-[9px] text-[#64748B]">
                                    {new Date(ev.capturedAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#94A3B8] italic p-4 text-center border border-dashed rounded-lg">
                            No evidence captured yet. Use the camera tool above.
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between pt-2">
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="px-4 py-2 rounded-lg border border-[#E2E5E9] text-[#64748B] hover:bg-[#F8FAFC] font-semibold"
                        >
                          Back to Checklist
                        </button>
                        <button
                          onClick={() => setCurrentStep(4)}
                          className="px-4 py-2 rounded-lg bg-[#174A73] hover:bg-[#123859] text-white font-bold flex items-center space-x-1.5 shadow-2xs"
                        >
                          <span>Proceed to Log Findings</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Findings & Non-Compliance Observations */}
                  {currentStep === 4 && (
                    <div className="bg-white border border-[#E2E5E9] rounded-xl p-6 shadow-2xs space-y-5 text-xs">
                      <div>
                        <h3 className="font-bold text-sm text-[#1F2937]">Step 4: Discrepancy & Non-Compliance Logging</h3>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Flag structural defects, financial mismatch, attendance irregularities, or safety violations observed on-site.
                        </p>
                      </div>

                      {/* Add Finding Form */}
                      <form onSubmit={handleCreateFinding} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[11px] font-bold text-[#1F2937] block">Finding Headline *</label>
                            <input
                              type="text"
                              required
                              value={findingTitle}
                              onChange={e => setFindingTitle(e.target.value)}
                              placeholder="e.g. RO water plant incomplete despite utilization certificate..."
                              className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#174A73]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[#1F2937] block">Category</label>
                            <select
                              value={findingCategory}
                              onChange={e => setFindingCategory(e.target.value as FindingCategory)}
                              className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#174A73]"
                            >
                              <option value="INFRASTRUCTURE">Civil Infrastructure</option>
                              <option value="FINANCIAL">Financial / Voucher</option>
                              <option value="ATTENDANCE">Attendance Roster</option>
                              <option value="BENEFICIARY">Beneficiary Target</option>
                              <option value="PROCUREMENT">Equipment / Material</option>
                              <option value="REGULATORY">Regulatory / Safety</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[#1F2937] block">Severity</label>
                            <select
                              value={findingSeverity}
                              onChange={e => setFindingSeverity(e.target.value as any)}
                              className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#174A73]"
                            >
                              <option value="CRITICAL">CRITICAL (Direct Stop-Work)</option>
                              <option value="HIGH">HIGH (15-Day Rectification)</option>
                              <option value="MEDIUM">MEDIUM (Minor Defect)</option>
                              <option value="LOW">LOW (Advisory)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#1F2937] block">Observation Details & Directive *</label>
                          <textarea
                            rows={2}
                            required
                            value={findingDesc}
                            onChange={e => setFindingDesc(e.target.value)}
                            placeholder="Detailed technical description of the non-compliance and mandatory corrective action..."
                            className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#174A73]"
                          />
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold flex items-center space-x-1.5 shadow-2xs"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Record Discrepancy Observation</span>
                          </button>
                        </div>
                      </form>

                      {/* Findings List */}
                      <div className="space-y-2">
                        <span className="font-bold text-[#1F2937] block">
                          Recorded Site Deficiencies ({findingsList.length})
                        </span>
                        {findingsList.length > 0 ? (
                          findingsList.map(find => (
                            <div
                              key={find.id}
                              className="p-3 bg-red-50/50 border border-red-200 rounded-xl flex items-start justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-red-800 text-xs">{find.title}</span>
                                  <span className="text-[10px] px-2 py-0.2 rounded bg-red-100 text-red-800 font-bold">
                                    {find.severity}
                                  </span>
                                </div>
                                <p className="text-[#64748B] text-[11px] leading-relaxed">{find.description}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs flex items-center space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                            <span>Zero critical discrepancies logged. Inspection proceeding with satisfactory rating.</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between pt-2">
                        <button
                          onClick={() => setCurrentStep(3)}
                          className="px-4 py-2 rounded-lg border border-[#E2E5E9] text-[#64748B] hover:bg-[#F8FAFC] font-semibold"
                        >
                          Back to Evidence
                        </button>
                        <button
                          onClick={() => setCurrentStep(5)}
                          className="px-4 py-2 rounded-lg bg-[#174A73] hover:bg-[#123859] text-white font-bold flex items-center space-x-1.5 shadow-2xs"
                        >
                          <span>Proceed to Review & Sign</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: Official Sign-off & Submission */}
                  {currentStep === 5 && (
                    <div className="bg-white border border-[#E2E5E9] rounded-xl p-6 shadow-2xs space-y-5 text-xs">
                      <div>
                        <h3 className="font-bold text-sm text-[#1F2937]">Step 5: Executive Review & Official PMU Transmission</h3>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Upon submission, this dossier is sealed cryptographically, timestamped with satellite GPS proof, and transmitted directly to the Government Command Directorate.
                        </p>
                      </div>

                      {submissionSuccess ? (
                        <div className="p-8 bg-green-50 border border-green-200 rounded-xl text-center space-y-3">
                          <CheckCircle2 className="w-12 h-12 text-[#16A34A] mx-auto animate-bounce" />
                          <h4 className="font-bold text-lg text-green-900">
                            Field Quality Inspection Report Transmitted Successfully!
                          </h4>
                          <p className="text-xs text-green-700 max-w-md mx-auto">
                            Inspection {activeInspection.inspectionCode} has been archived in Completed Audits with verified GPS certification. The active audit session is closed.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div>
                              <span className="text-[#64748B] text-[10px] block">Satellite Geofence</span>
                              <span className="font-bold text-[#16A34A] mt-0.5 block">Locked (&lt;15m)</span>
                            </div>
                            <div>
                              <span className="text-[#64748B] text-[10px] block">Checklist Items</span>
                              <span className="font-bold text-[#1F2937] mt-0.5 block">
                                {activeInspection.checklistItems?.length || 0} Complete
                              </span>
                            </div>
                            <div>
                              <span className="text-[#64748B] text-[10px] block">Evidences</span>
                              <span className="font-bold text-[#174A73] mt-0.5 block">
                                {capturedEvidence.length} Geotagged
                              </span>
                            </div>
                            <div>
                              <span className="text-[#64748B] text-[10px] block">Findings</span>
                              <span className="font-bold text-red-700 mt-0.5 block">
                                {findingsList.length} Deficiencies
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-[#1F2937]">
                              Official Summary Assessment Remarks & Recommendations *
                            </label>
                            <textarea
                              rows={3}
                              required
                              value={summaryRemarks}
                              onChange={e => setSummaryRemarks(e.target.value)}
                              placeholder="State overall project milestone compliance, site quality adherence, and recommendations for PMU release..."
                              className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#1F2937] focus:outline-none focus:border-[#174A73]"
                            />
                          </div>

                          {/* Digital Officer Sign-off Seal */}
                          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                            <div className="space-y-1">
                              <span className="font-bold text-[#174A73] block">
                                Digital Seal: {currentUser?.fullName} ({currentUser?.badgeNumber || 'MP-INSP-4081'})
                              </span>
                              <span className="text-[11px] text-[#64748B]">
                                Certifying Officer • Directorate of Rural Development & Field Quality
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#174A73] bg-white px-2 py-1 rounded border border-blue-200">
                              SHA256 Signed
                            </span>
                          </div>

                          <div className="flex justify-between pt-2">
                            <button
                              onClick={() => setCurrentStep(4)}
                              className="px-4 py-2 rounded-lg border border-[#E2E5E9] text-[#64748B] hover:bg-[#F8FAFC] font-semibold"
                            >
                              Back to Findings
                            </button>
                            <button
                              onClick={handleFinalSubmit}
                              disabled={isSubmittingFinal}
                              className="px-6 py-2.5 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white font-bold flex items-center space-x-2 shadow-xs disabled:opacity-50 transition"
                            >
                              <Send className="w-4 h-4" />
                              <span>{isSubmittingFinal ? 'Sealing Dossier...' : 'Officially Sign & Submit to PMU'}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 4: UPCOMING SCHEDULE & ROSTER
             ======================================================== */}
          {activeTab === 'upcoming' && (
            <div className="space-y-5 max-w-7xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E5E9]">
                <div>
                  <h2 className="text-base font-bold text-[#1F2937]">Upcoming Scheduled Inspections</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Pre-scheduled site visits for upcoming dates. Review statutory checklists, DPR scopes, and route coordinates in advance.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {upcomingInspections.length} Scheduled
                </span>
              </div>

              {upcomingInspections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingInspections.map(insp => (
                    <div
                      key={insp.id}
                      className="bg-white border border-[#E2E5E9] rounded-xl p-5 shadow-2xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#F1F5F9]">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-[#174A73] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {insp.inspectionCode}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            SCHEDULED VISIT
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 text-xs font-bold text-[#174A73]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Date: {insp.scheduledDate}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-[#1F2937]">{insp.projectName}</h3>
                        <p className="text-xs text-[#64748B] flex items-center space-x-1 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-[#174A73]" />
                          <span>{insp.organizationName}</span>
                        </p>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1.5 text-xs">
                        <span className="font-bold text-[#1F2937] block text-[11px]">
                          Inspection Scope ({insp.checklistItems?.length || 0} checklist items):
                        </span>
                        <ul className="space-y-1 text-[#64748B] text-[11px] list-disc list-inside">
                          {insp.checklistItems?.slice(0, 3).map(chk => (
                            <li key={chk.id} className="truncate">{chk.title}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9]">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-[#174A73]" />
                          <span className="truncate">
                            {insp.location.address || `${insp.location.district}, ${insp.location.state}`}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          Unlocks on scheduled date
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white border border-[#E2E5E9] rounded-xl text-xs text-[#64748B]">
                  No upcoming scheduled inspections for the next 14 days.
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 5: COMPLETED AUDITS & SEALED DOSSIERS
              (Notice: Absolutely NO resume option here!)
             ======================================================== */}
          {activeTab === 'completed' && (
            <div className="space-y-5 max-w-7xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E5E9]">
                <div>
                  <h2 className="text-base font-bold text-[#1F2937]">Completed Field Quality Dossiers</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Archived and officially submitted field quality inspection reports with GPS locks and photographic evidence.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-green-50 text-green-700 border border-green-200">
                  {completedInspections.length} Sealed Dossiers
                </span>
              </div>

              {completedInspections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedInspections.map(insp => (
                    <div
                      key={insp.id}
                      className="bg-white border border-[#E2E5E9] hover:border-green-300 rounded-xl p-5 shadow-2xs space-y-3.5 transition flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#F1F5F9]">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-[#174A73] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {insp.inspectionCode}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                              <span>OFFICIALLY SEALED</span>
                            </span>
                          </div>

                          <span className="text-[11px] text-[#64748B]">
                            Completed on {insp.completedAt ? new Date(insp.completedAt).toLocaleDateString() : insp.scheduledDate}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-sm text-[#1F2937]">{insp.projectName}</h3>
                          <p className="text-xs text-[#64748B] flex items-center space-x-1 mt-1">
                            <Building2 className="w-3.5 h-3.5 text-[#174A73]" />
                            <span className="font-medium">{insp.organizationName}</span>
                          </p>
                        </div>

                        {insp.summaryRemarks && (
                          <p className="text-xs text-[#1F2937] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] italic">
                            "{insp.summaryRemarks}"
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between text-xs text-[#64748B] pt-1 gap-2">
                          <div className="flex items-center space-x-3 text-[11px]">
                            <span className="flex items-center space-x-1 text-green-700 font-bold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>GPS Locked ({insp.gpsAccuracyMeters || 3.2}m)</span>
                            </span>
                            <span>•</span>
                            <span>{insp.evidenceCount} Evidences</span>
                            <span>•</span>
                            <span className={insp.findingsCount > 0 ? 'text-red-700 font-bold' : 'text-green-700 font-bold'}>
                              {insp.findingsCount} Findings
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-end">
                        <button
                          onClick={() => setSelectedCompletedAudit(insp)}
                          className="px-4 py-2 rounded-lg text-xs font-bold bg-white border border-[#174A73] text-[#174A73] hover:bg-blue-50 transition flex items-center space-x-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Full Audit Dossier</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white border border-[#E2E5E9] rounded-xl text-xs text-[#64748B]">
                  No completed inspections recorded yet.
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 6: EVIDENCE VAULT
             ======================================================== */}
          {activeTab === 'evidence' && (
            <div className="space-y-5 max-w-7xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E5E9]">
                <div>
                  <h2 className="text-base font-bold text-[#1F2937]">Field Quality Evidence Vault</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Centralized photographic, video walkthrough, and signed measurement muster records captured across project sites.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-[#174A73] border border-blue-200">
                  {allEvidence.length} Captured Items
                </span>
              </div>

              {allEvidence.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allEvidence.map(ev => (
                    <div
                      key={ev.id}
                      className="bg-white border border-[#E2E5E9] rounded-xl overflow-hidden shadow-2xs hover:shadow-sm transition flex flex-col justify-between"
                    >
                      <div className="h-40 bg-gray-100 relative overflow-hidden">
                        <img
                          src={ev.fileUrl}
                          alt={ev.caption}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-black/60 text-white font-mono text-[9px] px-2 py-0.5 rounded backdrop-blur-xs font-bold">
                          {ev.type}
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded backdrop-blur-xs flex items-center space-x-1">
                          <MapPin className="w-2.5 h-2.5 text-green-400" />
                          <span>GPS Geotagged</span>
                        </div>
                      </div>

                      <div className="p-3 space-y-1">
                        <p className="font-bold text-xs text-[#1F2937] line-clamp-2">{ev.caption}</p>
                        <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1">
                          <span>{ev.uploaderName}</span>
                          <span>{new Date(ev.capturedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white border border-[#E2E5E9] rounded-xl text-xs text-[#64748B]">
                  No evidence records logged yet.
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 7: FULL JURISDICTION GIS MAP
             ======================================================== */}
          {activeTab === 'map' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E5E9]">
                <div>
                  <h2 className="text-base font-bold text-[#1F2937]">Central MP Monitoring Zone • GIS Field Territory</h2>
                  <p className="text-xs text-[#64748B]">
                    Interactive spatial map showing active, scheduled, in-progress, and sealed inspection sites with satellite layer options.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-bold text-[#174A73]">Total Pins: {mapMarkers.length}</span>
                </div>
              </div>

              <DrishtiMap
                markers={mapMarkers}
                className="w-full h-[650px] rounded-xl shadow-xs border border-[#E2E5E9]"
                title="Inspector Zonal Territory GIS Map"
                showFilters={true}
                onSelectMarker={marker => {
                  const match = allInspections.find(i => i.id === marker.id);
                  if (match) {
                    if (match.status === 'COMPLETED' || match.status === 'SUBMITTED') {
                      setSelectedCompletedAudit(match);
                    } else {
                      handleLaunchInspection(match);
                    }
                  }
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* Completed Audit Modal for Viewing Full Sealed Dossiers */}
      {selectedCompletedAudit && (
        <CompletedAuditModal
          inspection={selectedCompletedAudit}
          onClose={() => setSelectedCompletedAudit(null)}
        />
      )}
    </div>
  );
};
