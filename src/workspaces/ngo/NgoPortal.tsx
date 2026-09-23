import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Organization,
  Project,
  Inspection,
  ComplianceAction
} from '../../types';
import { drishtiDataService } from '../../services/drishtiDataService';
import { DrishtiMap, MapMarkerItem } from '../../maps/DrishtiMap';
import { ProjectAnalyticalCard } from '../../components/analytics/ProjectAnalyticalCard';
import {
  Building2,
  FolderKanban,
  FileCheck,
  ClipboardList,
  LogOut,
  Upload,
  CheckCircle2,
  X,
  MapPin,
  BarChart3,
  ShieldCheck,
  Info,
  CheckSquare,
  Calendar,
  AlertCircle,
  Clock,
  Plus,
  Search,
  FileText,
  ChevronRight,
  Menu,
  Award,
  ArrowUpRight,
  TrendingUp,
  Download
} from 'lucide-react';

export interface NgoTaskItem {
  id: string;
  title: string;
  category: 'STATUTORY_PFMS' | 'INSPECTION_READINESS' | 'COMPLIANCE' | 'BENEFICIARY_LOGS' | 'MILESTONE_PROGRESS';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
  associatedScheme?: string;
  description: string;
  deliverableRequirement: string;
  completedDate?: string;
  proofReference?: string;
  remarks?: string;
}

export const NgoPortal: React.FC = () => {
  const { currentUser, logout } = useAuth();

  // Active vertical tab: 'overview' | 'tasks' | 'projects' | 'compliance' | 'inspections' | 'documents'
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'projects' | 'compliance' | 'inspections' | 'documents'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const orgId = currentUser?.organizationId || 'org-01';
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [complianceList, setComplianceList] = useState<ComplianceAction[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);

  // Response form state for compliance
  const [selectedCompliance, setSelectedCompliance] = useState<ComplianceAction | null>(null);
  const [complianceRemarks, setComplianceRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseSuccessMessage, setResponseSuccessMessage] = useState<string | null>(null);

  // Relevant Tasks State for NGOs
  const [tasks, setTasks] = useState<NgoTaskItem[]>([
    {
      id: 'task-01',
      title: 'Submit Form GFR 12-A Utilization Certificate (UC) for Q2 Tranche',
      category: 'STATUTORY_PFMS',
      priority: 'URGENT',
      status: 'PENDING',
      dueDate: '30 Sep 2026',
      associatedScheme: 'Pradhan Mantri Gram Sadak Yojana (PMGSY)',
      description: 'Upload statutory GFR 12-A certificate certified by a registered Chartered Accountant verifying ₹1.25 Cr expenditure incurred on rural link road foundation.',
      deliverableRequirement: 'Signed Form GFR 12-A with CA Membership Number and PFMS Voucher Reference'
    },
    {
      id: 'task-02',
      title: 'Upload Geotagged Beneficiary Daily Attendance Muster Roll',
      category: 'BENEFICIARY_LOGS',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: '28 Sep 2026',
      associatedScheme: 'Deen Dayal Upadhyaya Grameen Kaushalya Yojana (DDU-GKY)',
      description: 'Upload bi-weekly camera GPS timestamped group attendance photographs and biometric trainee roster for Batch #04 (450 youth enrolled).',
      deliverableRequirement: 'Field Supervisor signed biometric muster sheet & 3 timestamped geotagged photos'
    },
    {
      id: 'task-03',
      title: 'Action Taken Report (ATR) for Safety Barricading Notice #FND-2024-082',
      category: 'COMPLIANCE',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      dueDate: '26 Sep 2026',
      associatedScheme: 'Jal Jeevan Mission (JJM)',
      description: 'Barricade open trench excavation at Site C-4 (Pithampur Intake Well) and install high-visibility warning ribbons as flagged in the surprise inspection audit.',
      deliverableRequirement: '3 geotagged photographs of installed safety barriers & Project Engineer signoff'
    },
    {
      id: 'task-04',
      title: 'Stage Measurement Book (MB) & Drone Video for Milestone 3 (60% Casting)',
      category: 'MILESTONE_PROGRESS',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: '05 Oct 2026',
      associatedScheme: 'Pradhan Mantri Awas Yojana (Gramin)',
      description: 'Record physical stage measurements for roof slab casting and civil superstructure for block B-1 through B-6.',
      deliverableRequirement: 'Stage Measurement Sheet signed by Registered Civil Engineer'
    },
    {
      id: 'task-05',
      title: 'Pre-Audit Physical Material Test Register Verification',
      category: 'INSPECTION_READINESS',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      dueDate: '20 Sep 2026',
      associatedScheme: 'State Watershed Development Program',
      description: 'Compile compressive concrete cube strength reports (7-day and 28-day) and soil compaction density certificates for auditor verification.',
      deliverableRequirement: 'Certified lab test summary register with technician signoff',
      completedDate: '19 Sep 2026',
      proofReference: 'LAB-TEST-Q2-2026-8819',
      remarks: 'Lab report uploaded and filed in on-site register for FQM inspection.'
    },
    {
      id: 'task-06',
      title: 'Annual NGO Darpan Portal Executive Committee & Return Filing',
      category: 'STATUTORY_PFMS',
      priority: 'LOW',
      status: 'COMPLETED',
      dueDate: '15 Sep 2026',
      associatedScheme: 'Ministry of Social Justice & Empowerment',
      description: 'Verify current Governing Council list, PAN verification, and empanelment renewal on NITI Aayog NGO Darpan portal.',
      deliverableRequirement: 'Darpan Portal Acknowledgement Slip & Annual Report copy',
      completedDate: '14 Sep 2026',
      proofReference: 'DARPAN-ACK-2026-0912',
      remarks: 'All 7 trustees verified with Aadhaar e-KYC on the portal.'
    }
  ]);

  const [taskFilter, setTaskFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'URGENT'>('ALL');
  const [taskSearch, setTaskSearch] = useState('');
  const [selectedTaskForSubmission, setSelectedTaskForSubmission] = useState<NgoTaskItem | null>(null);
  const [taskSubmissionRemarks, setTaskSubmissionRemarks] = useState('');
  const [taskSubmissionRef, setTaskSubmissionRef] = useState('');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<NgoTaskItem['category']>('MILESTONE_PROGRESS');
  const [newTaskPriority, setNewTaskPriority] = useState<NgoTaskItem['priority']>('HIGH');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDeliverable, setNewTaskDeliverable] = useState('');

  // Load data for the authenticated organization
  const loadData = async () => {
    const org = await drishtiDataService.getOrganizationById(orgId);
    if (org) setOrganization(org);

    const projs = await drishtiDataService.getProjects(orgId);
    setProjects(projs);
    if (projs.length > 0) {
      setSelectedProject(projs[0]);
    } else {
      setSelectedProject(null);
    }

    const comps = await drishtiDataService.getCompliance(orgId);
    setComplianceList(comps);

    const insps = await drishtiDataService.getInspections({ orgId });
    setInspections(insps);
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  const handleSubmitCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompliance || !currentUser) return;
    setIsSubmitting(true);

    try {
      await drishtiDataService.submitComplianceResponse(
        selectedCompliance.id,
        complianceRemarks,
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
        currentUser
      );
      setSelectedCompliance(null);
      setComplianceRemarks('');
      setResponseSuccessMessage('Compliance response and documentation submitted to Government Directorate.');
      setTimeout(() => setResponseSuccessMessage(null), 5000);
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForSubmission) return;

    setTasks(prev =>
      prev.map(t =>
        t.id === selectedTaskForSubmission.id
          ? {
              ...t,
              status: 'COMPLETED',
              completedDate: 'Today',
              proofReference: taskSubmissionRef || `DOC-${Date.now().toString().slice(-6)}`,
              remarks: taskSubmissionRemarks || 'Deliverable uploaded and verified by organization signatory.'
            }
          : t
      )
    );

    setSelectedTaskForSubmission(null);
    setTaskSubmissionRemarks('');
    setTaskSubmissionRef('');
  };

  const handleCreateNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: NgoTaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      category: newTaskCategory,
      priority: newTaskPriority,
      status: 'PENDING',
      dueDate: newTaskDueDate || 'Next Week',
      associatedScheme: projects[0]?.scheme || 'Centrally Sponsored Scheme',
      description: newTaskDescription || 'Team deliverable for field monitoring and verification.',
      deliverableRequirement: newTaskDeliverable || 'Field verification signed document'
    };

    setTasks(prev => [newTask, ...prev]);
    setShowNewTaskModal(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDeliverable('');
    setNewTaskDueDate('');
  };

  const pendingComplianceCount = complianceList.filter(c => c.status !== 'CLOSED').length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'COMPLETED').length;
  const completedTasksCount = tasks.filter(t => t.status === 'COMPLETED').length;

  // Build Comprehensive Map Markers with BOTH Organization HQ Dot & Project Site Dots
  const allMapMarkers: MapMarkerItem[] = [
    // 1. Organization Headquarters Dot
    ...(organization
      ? [
          {
            id: `org-hq-${organization.id}`,
            category: 'NGO' as const,
            title: `${organization.name} (Secretariat HQ)`,
            subtitle: `${organization.location.district || organization.address}, ${organization.location.state} • Central Headquarters`,
            lat: organization.location.lat,
            lng: organization.location.lng,
            riskLevel: organization.riskLevel,
            statusText: 'Registered Secretariat',
            metadata: {
              isHQ: true,
              darpanId: organization.darpanId,
              contactPerson: organization.contactPerson
            }
          }
        ]
      : []),
    // 2. All Project Sites Dots
    ...projects.map(proj => ({
      id: proj.id,
      category: 'PROJECT' as const,
      title: proj.name,
      subtitle: `${proj.code} • ${proj.scheme}`,
      lat: proj.location.lat,
      lng: proj.location.lng,
      riskLevel: proj.riskLevel,
      statusText: `${proj.progressPercentage}% Completed`,
      metadata: {
        projectId: proj.id,
        scheme: proj.scheme,
        fundingSanctioned: proj.fundingSanctioned,
        fundingDisbursed: proj.fundingDisbursed,
        progressPercentage: proj.progressPercentage,
        district: proj.location.district
      }
    }))
  ];

  const handleSelectMapMarker = (marker: MapMarkerItem) => {
    const foundProject = projects.find(p => p.id === marker.id);
    if (foundProject) {
      setSelectedProject(foundProject);
      setActiveTab('projects');
    }
  };

  // Filter tasks based on search & tab
  const filteredTasks = tasks.filter(task => {
    const matchesFilter =
      taskFilter === 'ALL' ||
      (taskFilter === 'PENDING' && task.status === 'PENDING') ||
      (taskFilter === 'IN_PROGRESS' && task.status === 'IN_PROGRESS') ||
      (taskFilter === 'COMPLETED' && task.status === 'COMPLETED') ||
      (taskFilter === 'URGENT' && (task.priority === 'URGENT' || task.priority === 'HIGH'));

    if (!matchesFilter) return false;

    if (!taskSearch.trim()) return true;
    const q = taskSearch.toLowerCase();
    return (
      task.title.toLowerCase().includes(q) ||
      task.description.toLowerCase().includes(q) ||
      task.deliverableRequirement.toLowerCase().includes(q) ||
      task.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1F2937] flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E5E9] px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-gray-100"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 rounded bg-[#174A73] flex items-center justify-center font-bold text-white text-sm">
            दृ
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base text-[#174A73] tracking-tight">DRISHTI</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#174A73] border border-blue-100">
                NGO / Institution Portal
              </span>
            </div>
            <p className="text-xs text-[#667085] truncate max-w-xs sm:max-w-md hidden sm:block">
              Empaneled Entity: {organization?.name || currentUser?.organizationName || 'Implementing Organization'}
            </p>
          </div>
        </div>

        {/* Right Header Status & Signatory Details */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs shadow-2xs">
            <Building2 className="w-4 h-4 text-[#174A73] flex-shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-[#64748B] font-semibold tracking-wider uppercase">
                Active Organization
              </span>
              <span
                className="font-bold text-xs text-[#174A73] max-w-[160px] sm:max-w-[220px] md:max-w-[280px] truncate"
                title={organization?.name}
              >
                {organization?.name || currentUser?.organizationName || 'Implementing Organization'}
              </span>
            </div>
            {organization?.status === 'VERIFIED' && (
              <span className="text-[10px] bg-green-50 text-green-700 font-bold px-1.5 py-0.5 rounded border border-green-200 hidden sm:inline">
                Verified
              </span>
            )}
          </div>

          <div className="hidden lg:flex flex-col text-right pl-2 border-l border-[#E2E5E9]">
            <span className="text-xs font-semibold text-[#1F2937]">{currentUser?.fullName}</span>
            <span className="text-[10px] text-[#667085]">{currentUser?.designation || 'Managing Trustee'}</span>
          </div>

          <button
            onClick={logout}
            title="Log Out & Switch Organization / Role"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 border border-transparent hover:border-red-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* Main Body: Vertical Left Sidebar + Content */}
      <div className="flex-1 flex min-h-[calc(100vh-57px)]">
        {/* ========================================================
            VERTICAL LEFT SIDEBAR NAVIGATION MENU
           ======================================================== */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-[#E2E5E9] flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-4">
            {/* Organization Identifier Badge */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#174A73] tracking-wide block">
                Empaneled Entity
              </span>
              <h4 className="font-bold text-[#1F2937] truncate" title={organization?.name}>
                {organization?.name || 'Implementing NGO'}
              </h4>
              <div className="flex items-center space-x-1 text-[11px] text-[#64748B]">
                <MapPin className="w-3 h-3 text-[#174A73]" />
                <span className="truncate">{organization?.location.district}, {organization?.location.state}</span>
              </div>
              <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px]">
                <span className="font-mono text-[#64748B]">Darpan: {organization?.darpanId?.slice(0, 14)}</span>
                <span className="font-bold text-green-700 bg-green-50 px-1 py-0.2 rounded border border-green-200">
                  Risk: {organization?.riskLevel || 'LOW'}
                </span>
              </div>
            </div>

            {/* Vertical Menu Section Header */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] px-2 block mb-2">
                Workspace Menu
              </span>

              {/* Vertical Navigation Buttons */}
              <nav className="space-y-1">
                {/* 1. Overview */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('overview');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'overview'
                      ? 'bg-[#174A73] text-white font-semibold shadow-xs'
                      : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Building2 className={`w-4 h-4 ${activeTab === 'overview' ? 'text-white' : 'text-[#174A73]'}`} />
                    <span>Organization Overview</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'overview' ? 'text-white/70' : 'text-[#CBD5E1]'}`} />
                </button>

                {/* 2. Tasks & Action Items */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('tasks');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'tasks'
                      ? 'bg-[#174A73] text-white font-semibold shadow-xs'
                      : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <CheckSquare className={`w-4 h-4 ${activeTab === 'tasks' ? 'text-white' : 'text-[#174A73]'}`} />
                    <span>Relevant Tasks</span>
                  </div>
                  {pendingTasksCount > 0 ? (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        activeTab === 'tasks'
                          ? 'bg-amber-400 text-gray-900'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {pendingTasksCount}
                    </span>
                  ) : (
                    <CheckCircle2 className={`w-3.5 h-3.5 ${activeTab === 'tasks' ? 'text-white' : 'text-green-600'}`} />
                  )}
                </button>

                {/* 3. Projects & Location Map */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('projects');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'projects'
                      ? 'bg-[#174A73] text-white font-semibold shadow-xs'
                      : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FolderKanban className={`w-4 h-4 ${activeTab === 'projects' ? 'text-white' : 'text-[#174A73]'}`} />
                    <span>Projects & Map Dots</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                      activeTab === 'projects' ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#64748B]'
                    }`}
                  >
                    {projects.length}
                  </span>
                </button>

                {/* 4. Compliance Directives */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('compliance');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'compliance'
                      ? 'bg-[#174A73] text-white font-semibold shadow-xs'
                      : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FileCheck className={`w-4 h-4 ${activeTab === 'compliance' ? 'text-white' : 'text-[#174A73]'}`} />
                    <span>Compliance Directives</span>
                  </div>
                  {pendingComplianceCount > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        activeTab === 'compliance'
                          ? 'bg-red-400 text-gray-900'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}
                    >
                      {pendingComplianceCount}
                    </span>
                  )}
                </button>

                {/* 5. Inspections & Audits */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('inspections');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'inspections'
                      ? 'bg-[#174A73] text-white font-semibold shadow-xs'
                      : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <ClipboardList className={`w-4 h-4 ${activeTab === 'inspections' ? 'text-white' : 'text-[#174A73]'}`} />
                    <span>Inspection Audits</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                      activeTab === 'inspections' ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#64748B]'
                    }`}
                  >
                    {inspections.length}
                  </span>
                </button>

                {/* 6. Documents & UCs */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('documents');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'documents'
                      ? 'bg-[#174A73] text-white font-semibold shadow-xs'
                      : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FileText className={`w-4 h-4 ${activeTab === 'documents' ? 'text-white' : 'text-[#174A73]'}`} />
                    <span>Documents & UCs</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Left Sidebar Footer: PFMS Compliance Rating */}
          <div className="p-4 border-t border-[#E2E5E9] bg-[#F8FAFC] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#475569]">PFMS Compliance Rate</span>
              <span className="font-bold text-[#16A34A]">{organization?.complianceRate || 94}%</span>
            </div>
            <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#16A34A] h-full rounded-full transition-all duration-300"
                style={{ width: `${organization?.complianceRate || 94}%` }}
              />
            </div>
            <span className="text-[10px] text-[#64748B] block">
              Ministry Real-Time Monitoring: <strong className="text-green-700">Active</strong>
            </span>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
          />
        )}

        {/* ========================================================
            RIGHT MAIN CONTENT WORKSPACE
           ======================================================== */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          {/* Success Notification */}
          {responseSuccessMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>{responseSuccessMessage}</span>
              </div>
              <button onClick={() => setResponseSuccessMessage(null)}>
                <X className="w-4 h-4 text-green-700" />
              </button>
            </div>
          )}

          {/* ========================================================
              TAB 1: ORGANIZATION OVERVIEW
             ======================================================== */}
          {activeTab === 'overview' && organization && (
            <div className="space-y-6">
              {/* Institution Welcome Card */}
              <div className="bg-white border border-[#E2E5E9] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase font-bold text-[#174A73] tracking-wide">
                      Empaneled Implementation Entity
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#174A73] font-semibold border border-blue-100">
                      {organization.type}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-[#1F2937]">{organization.name}</h1>
                  <p className="text-xs text-[#667085] leading-relaxed">
                    Official Central Monitoring Portal for project executions, utilization certifications, and field verification.
                  </p>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('tasks')}
                    className="px-4 py-2 bg-[#174A73] hover:bg-[#123859] text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>View Required Tasks ({pendingTasksCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('projects')}
                    className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-gray-50 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>Map View & Dots</span>
                  </button>
                </div>
              </div>

              {/* Stat Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E2E5E9] rounded-xl p-4 shadow-xs">
                  <span className="text-xs text-[#667085] font-medium block">Total Central Sanction</span>
                  <div className="text-xl font-bold text-[#174A73] mt-1">
                    ₹{((organization.totalFundsReceived || 0) / 10000000).toFixed(2)} Cr
                  </div>
                  <span className="text-[11px] text-green-700 font-medium mt-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Direct PFMS Disbursal
                  </span>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-xl p-4 shadow-xs">
                  <span className="text-xs text-[#667085] font-medium block">Active Projects Monitored</span>
                  <div className="text-xl font-bold text-[#1F2937] mt-1">{projects.length}</div>
                  <span className="text-[11px] text-[#64748B] mt-1 block">Across {organization.location.district || 'State'}</span>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-xl p-4 shadow-xs">
                  <span className="text-xs text-[#667085] font-medium block">Pending Tasks & UCs</span>
                  <div className="text-xl font-bold text-amber-700 mt-1">{pendingTasksCount}</div>
                  <span className="text-[11px] text-amber-700 font-medium mt-1 block">Due this month</span>
                </div>

                <div className="bg-white border border-[#E2E5E9] rounded-xl p-4 shadow-xs">
                  <span className="text-xs text-[#667085] font-medium block">Risk Assessment Tier</span>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                        organization.riskLevel === 'LOW'
                          ? 'bg-green-100 text-green-800'
                          : organization.riskLevel === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {organization.riskLevel} RISK
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B] mt-1 block">Audit Compliance Score: {organization.complianceRate}%</span>
                </div>
              </div>

              {/* Geographic Footprint Map with Location Dots on Overview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#1F2937]">Geographic Presence & Monitored Dots</h3>
                    <p className="text-xs text-[#667085]">
                      Visual map plotting the verified NGO headquarters dot and operational project site dots.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('projects')}
                    className="text-xs text-[#174A73] hover:underline font-semibold flex items-center space-x-1"
                  >
                    <span>Full Screen Project Map</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <DrishtiMap
                  markers={allMapMarkers}
                  selectedMarkerId={selectedProject?.id || `org-hq-${organization.id}`}
                  onSelectMarker={handleSelectMapMarker}
                  title={`${organization.name} • Location Dots`}
                  className="w-full h-[380px] rounded-lg"
                />
              </div>

              {/* Organization Profile Details */}
              <div className="bg-white border border-[#E2E5E9] rounded-xl p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#1F2937] pb-2 border-b border-[#E2E5E9]">
                  Statutory Registration & PFMS Credentials
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[#667085] block text-[11px]">Organization Legal Name</span>
                    <span className="font-semibold text-[#1F2937] mt-0.5 block">{organization.name}</span>
                  </div>
                  <div>
                    <span className="text-[#667085] block text-[11px]">Registration / Darpan Portal ID</span>
                    <span className="font-mono font-medium text-[#1F2937] mt-0.5 block">
                      {organization.darpanId || organization.registrationNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#667085] block text-[11px]">Headquarters & Operational Station</span>
                    <span className="text-[#1F2937] mt-0.5 block">
                      {organization.location.district || organization.address}, {organization.location.state}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#667085] block text-[11px]">Authorized Signatory</span>
                    <span className="font-medium text-[#1F2937] mt-0.5 block">{organization.contactPerson}</span>
                  </div>
                  <div>
                    <span className="text-[#667085] block text-[11px]">Portal Contact Email</span>
                    <span className="font-medium text-[#174A73] mt-0.5 block">{organization.email}</span>
                  </div>
                  <div>
                    <span className="text-[#667085] block text-[11px]">Legal Classification</span>
                    <span className="font-medium text-[#1F2937] mt-0.5 block">{organization.type} • PFMS Verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: RELEVANT TASKS FOR THE NGO
             ======================================================== */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              {/* Header Title with Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-[#1F2937]">Relevant Action Items & Statutory Tasks</h1>
                  <p className="text-xs text-[#667085] mt-1">
                    Statutory deliverables, Utilization Certificates (UC), geotagged muster submissions, and compliance deadlines.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTaskModal(true)}
                    className="px-3.5 py-2 bg-[#174A73] hover:bg-[#123859] text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Internal Task</span>
                  </button>
                </div>
              </div>

              {/* Task Summary Banner */}
              <div className="bg-gradient-to-r from-blue-50/80 via-white to-amber-50/60 border border-[#E2E8F0] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#174A73] uppercase tracking-wider block">
                    Statutory Task Compliance
                  </span>
                  <div className="text-lg font-bold text-[#1F2937]">
                    {completedTasksCount} of {tasks.length} Deliverables Completed (
                    {Math.round((completedTasksCount / tasks.length) * 100)}%)
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Timely submission of utilization certificates and muster logs prevents sanction holdbacks.
                  </p>
                </div>

                <div className="w-full sm:w-64 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#64748B]">Progress</span>
                    <span className="text-[#174A73]">{Math.round((completedTasksCount / tasks.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#174A73] h-full rounded-full transition-all duration-300"
                      style={{ width: `${(completedTasksCount / tasks.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium block text-right">
                    {pendingTasksCount} Action Items Pending
                  </span>
                </div>
              </div>

              {/* Task Filters & Search Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E5E9]">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setTaskFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      taskFilter === 'ALL'
                        ? 'bg-[#174A73] text-white shadow-2xs'
                        : 'bg-white text-[#64748B] hover:bg-gray-100'
                    }`}
                  >
                    All ({tasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('PENDING')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      taskFilter === 'PENDING'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white text-[#64748B] hover:bg-gray-100'
                    }`}
                  >
                    Pending ({tasks.filter(t => t.status === 'PENDING').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('IN_PROGRESS')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      taskFilter === 'IN_PROGRESS'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-[#64748B] hover:bg-gray-100'
                    }`}
                  >
                    In Progress ({tasks.filter(t => t.status === 'IN_PROGRESS').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('COMPLETED')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      taskFilter === 'COMPLETED'
                        ? 'bg-green-600 text-white shadow-2xs'
                        : 'bg-white text-[#64748B] hover:bg-gray-100'
                    }`}
                  >
                    Completed ({tasks.filter(t => t.status === 'COMPLETED').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('URGENT')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      taskFilter === 'URGENT'
                        ? 'bg-red-600 text-white shadow-2xs'
                        : 'bg-white text-[#64748B] hover:bg-gray-100'
                    }`}
                  >
                    Urgent ({tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length})
                  </button>
                </div>

                {/* Quick Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={taskSearch}
                    onChange={e => setTaskSearch(e.target.value)}
                    placeholder="Search tasks or deliverables..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#174A73]"
                  />
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-[#E2E5E9] rounded-xl text-xs text-[#64748B]">
                    No tasks match the selected criteria.
                  </div>
                ) : (
                  filteredTasks.map(task => {
                    const isCompleted = task.status === 'COMPLETED';
                    const isUrgent = task.priority === 'URGENT';
                    const isHigh = task.priority === 'HIGH';

                    return (
                      <div
                        key={task.id}
                        className={`p-4 sm:p-5 rounded-xl border transition bg-white shadow-2xs ${
                          isCompleted
                            ? 'border-green-200 bg-green-50/20'
                            : isUrgent
                            ? 'border-red-300 ring-1 ring-red-200'
                            : 'border-[#E2E5E9] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Status Badge */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isCompleted
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : task.status === 'IN_PROGRESS'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {task.status.replace('_', ' ')}
                              </span>

                              {/* Priority Badge */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isUrgent
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : isHigh
                                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                }`}
                              >
                                Priority: {task.priority}
                              </span>

                              {/* Category Pill */}
                              <span className="text-[10px] font-semibold text-[#64748B] bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                                {task.category.replace('_', ' ')}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-[#1F2937] leading-snug">
                              {task.title}
                            </h3>

                            <p className="text-xs text-[#64748B] leading-relaxed">
                              {task.description}
                            </p>

                            {/* Deliverable requirement info strip */}
                            <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#475569]">
                              <div className="flex items-center space-x-1.5 font-medium">
                                <FileText className="w-3.5 h-3.5 text-[#174A73]" />
                                <span>Requirement: <strong className="text-[#1F2937]">{task.deliverableRequirement}</strong></span>
                              </div>
                              <div className="flex items-center space-x-1 text-[#64748B]">
                                <Calendar className="w-3 h-3 text-[#94A3B8]" />
                                <span>Due Date: <strong className="text-[#1F2937]">{task.dueDate}</strong></span>
                              </div>
                              {task.associatedScheme && (
                                <span className="text-[10px] text-[#174A73] bg-blue-50 px-2 py-0.5 rounded font-medium">
                                  {task.associatedScheme}
                                </span>
                              )}
                            </div>

                            {/* Completed submission info if available */}
                            {task.completedDate && (
                              <div className="pt-2 mt-2 border-t border-green-200 text-[11px] text-green-800 flex items-center space-x-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                <span>
                                  Submitted & Recorded on {task.completedDate} • Ref: <strong>{task.proofReference}</strong>
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0 pt-2 sm:pt-0">
                            {!isCompleted ? (
                              <button
                                type="button"
                                onClick={() => setSelectedTaskForSubmission(task)}
                                className="px-3.5 py-1.5 bg-[#174A73] hover:bg-[#123859] text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs transition"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Submit Deliverable</span>
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-md flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verified</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: PROJECTS WITH MAP DOTS & ANALYTICAL CARDS
             ======================================================== */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-xl font-bold text-[#1F2937]">Assigned Scheme Projects & Field Locations</h1>
                  <p className="text-xs text-[#667085] mt-1">
                    Select a project location to view its verified map dot, station coordinates, and analytical charts.
                  </p>
                </div>
                <span className="text-xs text-[#667085]">
                  Showing {projects.length} project locations for <strong>{organization?.name}</strong>
                </span>
              </div>

              {/* Location Selector Chips */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                <span className="text-[11px] text-[#667085] font-semibold whitespace-nowrap">Select Location:</span>
                {projects.map(proj => {
                  const isSelected = selectedProject?.id === proj.id;
                  return (
                    <button
                      key={proj.id}
                      onClick={() => setSelectedProject(proj)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 whitespace-nowrap border ${
                        isSelected
                          ? 'bg-[#174A73] text-white border-[#174A73] shadow-xs'
                          : 'bg-white text-[#1F2937] border-[#E2E5E9] hover:bg-[#F7F8FA]'
                      }`}
                    >
                      <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#174A73]'}`} />
                      <span>{proj.name}</span>
                      <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-white/20' : 'bg-gray-100 text-[#667085]'}`}>
                        {proj.location.district || 'Site'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Side-by-Side: Map on Left & Analytical Details on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Map View with Dot Markers */}
                <div className="lg:col-span-7 flex flex-col space-y-3">
                  <div className="bg-white border border-[#E2E5E9] rounded-xl p-2 shadow-xs">
                    <div className="flex items-center justify-between px-2 py-1 mb-1 text-xs">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#174A73]" />
                        <span className="font-bold text-[#1F2937]">Geo-Referenced Location Coordinates</span>
                      </div>
                      {selectedProject && (
                        <span className="text-[11px] font-mono text-[#667085]">
                          {selectedProject.location.lat.toFixed(4)}° N, {selectedProject.location.lng.toFixed(4)}° E
                        </span>
                      )}
                    </div>

                    <DrishtiMap
                      markers={allMapMarkers}
                      selectedMarkerId={selectedProject?.id}
                      onSelectMarker={handleSelectMapMarker}
                      className="w-full h-[460px] rounded-lg"
                    />
                  </div>

                  {/* Project Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {projects.map(proj => {
                      const isSelected = selectedProject?.id === proj.id;
                      return (
                        <div
                          key={proj.id}
                          onClick={() => setSelectedProject(proj)}
                          className={`p-3 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? 'bg-blue-50/50 border-[#174A73] ring-1 ring-[#174A73]'
                              : 'bg-white border-[#E2E5E9] hover:bg-[#F7F8FA]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-[#174A73]">{proj.code}</span>
                            <span className="text-[10px] font-bold text-[#16A34A]">{proj.progressPercentage}% Done</span>
                          </div>
                          <h4 className="font-bold text-xs text-[#1F2937] mt-1 truncate">{proj.name}</h4>
                          <div className="flex items-center space-x-1 text-[11px] text-[#667085] mt-1">
                            <MapPin className="w-3 h-3 text-[#174A73]" />
                            <span>{proj.location.district || proj.location.address}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Analytical Card on Right */}
                <div className="lg:col-span-5 flex flex-col">
                  {selectedProject ? (
                    <ProjectAnalyticalCard
                      project={selectedProject}
                      organizationName={organization?.name}
                    />
                  ) : (
                    <div className="p-8 text-center bg-white border border-[#E2E5E9] rounded-xl text-xs text-[#667085]">
                      Select a project site from the map to inspect milestone progress and expenditure charts.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: COMPLIANCE DIRECTIVES
             ======================================================== */}
          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-xl font-bold text-[#1F2937]">Regulatory & Inspection Compliance Notices</h1>
                  <p className="text-xs text-[#667085] mt-1">
                    Formal notifications issued by Government Monitoring Officers requiring Action Taken Reports (ATR).
                  </p>
                </div>
                <span className="text-xs text-[#667085]">
                  {pendingComplianceCount} Active Compliance Actions
                </span>
              </div>

              {complianceList.length === 0 ? (
                <div className="bg-white border border-[#E2E5E9] rounded-xl p-8 text-center text-xs text-[#667085]">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <span className="font-bold text-sm text-[#1F2937] block">All Compliances Settled</span>
                  <span>No outstanding compliance notices or risk flags on record.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {complianceList.map(comp => (
                    <div
                      key={comp.id}
                      className="bg-white border border-[#E2E5E9] rounded-xl p-5 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              comp.status === 'OPEN'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : comp.status === 'UNDER_REVIEW'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-green-50 text-green-700 border border-green-200'
                            }`}
                          >
                            Status: {comp.status}
                          </span>
                          <span className="text-xs font-mono font-medium text-[#64748B]">Notice #{comp.id}</span>
                        </div>
                        <span className="text-xs text-[#64748B]">
                          Deadline: <strong className="text-red-700">{comp.dueDate}</strong>
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#1F2937]">{comp.findingTitle}</h4>
                        <p className="text-xs text-[#334155] font-medium leading-relaxed">
                          {comp.actionRequired}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <span className="text-[#64748B]">
                          Project: <strong>{comp.projectName}</strong>
                        </span>

                        {comp.status !== 'CLOSED' && (
                          <button
                            type="button"
                            onClick={() => setSelectedCompliance(comp)}
                            className="px-3 py-1.5 bg-[#174A73] hover:bg-[#123859] text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition self-start sm:self-auto"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Submit Rectification Response</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 5: INSPECTION AUDITS
             ======================================================== */}
          {activeTab === 'inspections' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-[#1F2937]">Field Quality Monitor (FQM) Audit Records</h1>
                <p className="text-xs text-[#667085] mt-1">
                  Reports submitted by independent quality monitors, including structural inspections and photographic evidence.
                </p>
              </div>

              {inspections.length === 0 ? (
                <div className="bg-white border border-[#E2E5E9] rounded-xl p-8 text-center text-xs text-[#667085]">
                  No inspection logs recorded for this entity yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inspections.map(insp => (
                    <div
                      key={insp.id}
                      className="bg-white border border-[#E2E5E9] rounded-xl p-5 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                        <span className="font-mono text-xs font-bold text-[#174A73]">{insp.inspectionCode}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            insp.status === 'COMPLETED'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {insp.status}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="font-bold text-[#1F2937]">{insp.projectName}</div>
                        <div className="text-[#64748B]">
                          Auditor: <strong>{insp.assignedInspectorName || 'Designated Zonal FQM'}</strong> ({insp.assignedInspectorBadge || 'Govt Monitored'})
                        </div>
                        <div className="text-[#64748B]">Scheduled / Executed: {insp.scheduledDate}</div>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs">
                        <span className="text-[#64748B]">Priority & Scope:</span>
                        <span className="font-bold text-[#174A73]">
                          {insp.priority} {insp.isSurprise ? '(Surprise Inspection)' : '(Scheduled)'}
                        </span>
                      </div>

                      {insp.findingsCount > 0 ? (
                        <div className="pt-2 border-t border-[#F1F5F9] space-y-1">
                          <span className="text-[10px] font-bold uppercase text-red-600 block">
                            Audit Discrepancies ({insp.findingsCount} findings recorded):
                          </span>
                          <p className="text-[11px] text-[#475569] italic">
                            {insp.summaryRemarks || 'Field checklist executed. Follow-up compliance directive issued.'}
                          </p>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-[#F1F5F9] text-[11px] text-green-700 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Satisfactory inspection rating with zero critical flags.</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 6: DOCUMENTS & UCS
             ======================================================== */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-[#1F2937]">Official Documents & Utilization Certificates (UC)</h1>
                <p className="text-xs text-[#667085] mt-1">
                  Central repository of sanction orders, Form GFR 12-A certificates, and audited balance sheets.
                </p>
              </div>

              <div className="bg-white border border-[#E2E5E9] rounded-xl p-5 shadow-xs space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] space-y-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#174A73]" />
                      <span className="font-bold text-xs text-[#1F2937]">Form GFR 12-A (Q1-2026)</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">PFMS Verified Utilization Certificate for Phase 1 sanction.</p>
                    <span className="text-[10px] font-mono text-green-700 block">Status: Verified & Cleared</span>
                  </div>

                  <div className="p-3.5 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] space-y-2">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-[#174A73]" />
                      <span className="font-bold text-xs text-[#1F2937]">Tripartite Scheme MoU</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">Approved bilateral agreement between Ministry & Implementing Trust.</p>
                    <span className="text-[10px] font-mono text-blue-700 block">Valid until 2028</span>
                  </div>

                  <div className="p-3.5 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] space-y-2">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-[#174A73]" />
                      <span className="font-bold text-xs text-[#1F2937]">Darpan 80G / 12A Certificate</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">Income Tax exemption certificate and Darpan portal valid accreditation.</p>
                    <span className="text-[10px] font-mono text-green-700 block">Tax Exemption Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================
          MODAL: SUBMIT COMPLIANCE RESPONSE
         ======================================================== */}
      {selectedCompliance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E5E9]">
              <h3 className="text-sm font-bold text-[#1F2937]">
                Submit Action Taken Report (ATR)
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCompliance(null)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg text-amber-900 border border-amber-200">
              <span className="font-bold block mb-1">Notice #{selectedCompliance.id} Directive:</span>
              <p>{selectedCompliance.actionRequired}</p>
            </div>

            <form onSubmit={handleSubmitCompliance} className="space-y-4">
              <div>
                <label className="block font-bold text-[#334155] mb-1">
                  Rectification Action Description & Evidence Remarks:
                </label>
                <textarea
                  rows={4}
                  required
                  value={complianceRemarks}
                  onChange={e => setComplianceRemarks(e.target.value)}
                  placeholder="Detail the remedial actions taken on-site to resolve the flagged finding..."
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#174A73]/20 focus:border-[#174A73]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">
                  Attach Geotagged Photographic Proof / Test Report:
                </label>
                <div className="border-2 border-dashed border-[#CBD5E1] rounded-lg p-4 text-center text-[#64748B] hover:bg-gray-50 cursor-pointer">
                  <Upload className="w-5 h-5 mx-auto mb-1 text-[#174A73]" />
                  <span>Click to select certified on-site photo or CAD rectification report</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E2E5E9]">
                <button
                  type="button"
                  onClick={() => setSelectedCompliance(null)}
                  className="px-4 py-2 border border-[#CBD5E1] rounded-lg text-[#64748B] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#174A73] hover:bg-[#123859] text-white rounded-lg font-bold shadow-xs disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting...' : 'Transmit ATR to Directorate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: SUBMIT TASK DELIVERABLE
         ======================================================== */}
      {selectedTaskForSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E5E9]">
              <h3 className="text-sm font-bold text-[#1F2937]">
                Submit Deliverable & Mark Complete
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTaskForSubmission(null)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg text-blue-900 border border-blue-200 space-y-1">
              <span className="font-bold block">{selectedTaskForSubmission.title}</span>
              <p className="text-[11px] text-blue-800">{selectedTaskForSubmission.description}</p>
              <div className="pt-1 text-[11px] font-semibold text-[#174A73]">
                Required: {selectedTaskForSubmission.deliverableRequirement}
              </div>
            </div>

            <form onSubmit={handleCompleteTask} className="space-y-4">
              <div>
                <label className="block font-bold text-[#334155] mb-1">
                  Statutory Reference / Document Identifier:
                </label>
                <input
                  type="text"
                  required
                  value={taskSubmissionRef}
                  onChange={e => setTaskSubmissionRef(e.target.value)}
                  placeholder="e.g. PFMS-UC-2026-91823 or ATT-ROSTER-SEP-BATCH4"
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#174A73]/20 focus:border-[#174A73]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">
                  Verification Remarks & Signatory Notes:
                </label>
                <textarea
                  rows={3}
                  required
                  value={taskSubmissionRemarks}
                  onChange={e => setTaskSubmissionRemarks(e.target.value)}
                  placeholder="Confirm deliverable has been verified by the Project Director and empanelled Chartered Accountant / Engineer..."
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#174A73]/20 focus:border-[#174A73]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">
                  Upload Signed Document / Geotagged PDF:
                </label>
                <div className="border-2 border-dashed border-[#CBD5E1] rounded-lg p-4 text-center text-[#64748B] hover:bg-gray-50 cursor-pointer">
                  <Upload className="w-5 h-5 mx-auto mb-1 text-[#174A73]" />
                  <span>Attach scanned certificate with digital signature (PDF / JPG up to 25MB)</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E2E5E9]">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForSubmission(null)}
                  className="px-4 py-2 border border-[#CBD5E1] rounded-lg text-[#64748B] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#174A73] hover:bg-[#123859] text-white rounded-lg font-bold shadow-xs transition"
                >
                  Save & Complete Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE NEW INTERNAL TASK
         ======================================================== */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E5E9]">
              <h3 className="text-sm font-bold text-[#1F2937]">
                Create New Project Action Item
              </h3>
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTask} className="space-y-3">
              <div>
                <label className="block font-bold text-[#334155] mb-1">Task Title:</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Conduct third-party soil test at intake well"
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#174A73]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Category:</label>
                  <select
                    value={newTaskCategory}
                    onChange={e => setNewTaskCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-lg"
                  >
                    <option value="MILESTONE_PROGRESS">Milestone Progress</option>
                    <option value="STATUTORY_PFMS">Statutory PFMS / UC</option>
                    <option value="BENEFICIARY_LOGS">Beneficiary Logs</option>
                    <option value="INSPECTION_READINESS">Inspection Readiness</option>
                    <option value="COMPLIANCE">Compliance Rectification</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Priority:</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-lg"
                  >
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Due Date:</label>
                  <input
                    type="text"
                    required
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                    placeholder="e.g. 15 Oct 2026"
                    className="w-full p-2.5 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#174A73]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Required Deliverable:</label>
                  <input
                    type="text"
                    required
                    value={newTaskDeliverable}
                    onChange={e => setNewTaskDeliverable(e.target.value)}
                    placeholder="e.g. Lab Certificate"
                    className="w-full p-2.5 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#174A73]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Description:</label>
                <textarea
                  rows={3}
                  value={newTaskDescription}
                  onChange={e => setNewTaskDescription(e.target.value)}
                  placeholder="Specific instructions for the field team..."
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#174A73]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E2E5E9]">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 border border-[#CBD5E1] rounded-lg text-[#64748B] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#174A73] hover:bg-[#123859] text-white rounded-lg font-bold shadow-xs transition"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
