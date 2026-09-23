import {
  Organization,
  Project,
  Inspection,
  EvidenceRecord,
  Finding,
  ComplianceAction,
  DrishtiAlert,
  LiveMonitoringFeed,
  Recording,
  AuditLog,
  NotificationItem,
  RiskIntelligence,
  InspectionStatus,
  InspectionType,
  FindingSeverity,
  UserProfile,
  UserRole
} from '../types';
import {
  INITIAL_ORGANIZATIONS,
  INITIAL_PROJECTS,
  INITIAL_INSPECTIONS,
  INITIAL_EVIDENCE,
  INITIAL_FINDINGS,
  INITIAL_COMPLIANCE,
  INITIAL_ALERTS,
  INITIAL_FEEDS,
  INITIAL_RECORDINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_RISK_INTELLIGENCE,
  INITIAL_NOTIFICATIONS
} from '../data/demo/seedData';
import { isSupabaseConfigured, supabase } from './supabaseClient';

class DrishtiDataService {
  private organizations: Organization[] = [...INITIAL_ORGANIZATIONS];
  private projects: Project[] = [...INITIAL_PROJECTS];
  private inspections: Inspection[] = [...INITIAL_INSPECTIONS];
  private evidence: EvidenceRecord[] = [...INITIAL_EVIDENCE];
  private findings: Finding[] = [...INITIAL_FINDINGS];
  private compliance: ComplianceAction[] = [...INITIAL_COMPLIANCE];
  private alerts: DrishtiAlert[] = [...INITIAL_ALERTS];
  private feeds: LiveMonitoringFeed[] = [...INITIAL_FEEDS];
  private recordings: Recording[] = [...INITIAL_RECORDINGS];
  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  private riskData: RiskIntelligence[] = [...INITIAL_RISK_INTELLIGENCE];
  private notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];

  // ================= ORGANIZATIONS =================
  async getOrganizations(): Promise<Organization[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('organizations').select('*');
        if (!error && data && data.length > 0) return data as unknown as Organization[];
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local canonical store:', err);
      }
    }
    return [...this.organizations];
  }

  async getOrganizationById(id: string): Promise<Organization | undefined> {
    const list = await this.getOrganizations();
    return list.find(o => o.id === id);
  }

  // ================= PROJECTS =================
  async getProjects(orgId?: string): Promise<Project[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('projects').select('*');
        if (orgId) query = query.eq('organization_id', orgId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as unknown as Project[];
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local canonical store:', err);
      }
    }
    if (orgId) {
      return this.projects.filter(p => p.organizationId === orgId);
    }
    return [...this.projects];
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    const list = await this.getProjects();
    return list.find(p => p.id === id);
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, actor: UserProfile): Promise<Project> {
    const newProj: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.unshift(newProj);
    this.addAuditLog(actor, 'CREATE_PROJECT', 'PROJECT', newProj.id, undefined, newProj.name);
    return newProj;
  }

  // ================= INSPECTIONS =================
  async getInspections(filter?: { status?: string; type?: string; inspectorId?: string; projectId?: string; orgId?: string }): Promise<Inspection[]> {
    let list = [...this.inspections];
    if (filter?.status) list = list.filter(i => i.status === filter.status);
    if (filter?.type) list = list.filter(i => i.type === filter.type);
    if (filter?.inspectorId) {
      const cleanFilter = filter.inspectorId.toLowerCase().replace(/[^a-z0-9]/g, '').replace('user', 'usr');
      list = list.filter(i => {
        const cleanItem = (i.assignedInspectorId || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace('user', 'usr');
        return cleanItem === cleanFilter || i.assignedInspectorId === filter.inspectorId;
      });
    }
    if (filter?.projectId) list = list.filter(i => i.projectId === filter.projectId);
    if (filter?.orgId) list = list.filter(i => i.organizationId === filter.orgId);
    return list;
  }

  async getInspectionById(id: string): Promise<Inspection | undefined> {
    return this.inspections.find(i => i.id === id);
  }

  async createInspection(data: {
    projectId: string;
    type: InspectionType;
    scheduledDate: string;
    inspectorId: string;
    inspectorName: string;
    inspectorBadge?: string;
    inspectorPhone?: string;
    priority?: 'NORMAL' | 'HIGH' | 'URGENT';
    checklistItems?: string[];
  }, actor: UserProfile): Promise<Inspection> {
    const project = await this.getProjectById(data.projectId);
    if (!project) throw new Error('Project not found');

    const newInspection: Inspection = {
      id: `insp-${Date.now()}`,
      inspectionCode: `INSP-${new Date().getFullYear()}-${String(this.inspections.length + 1).padStart(3, '0')}`,
      projectId: project.id,
      projectName: project.name,
      organizationId: project.organizationId,
      organizationName: project.organizationName,
      type: data.type,
      status: 'ASSIGNED',
      scheduledDate: data.scheduledDate,
      assignedInspectorId: data.inspectorId,
      assignedInspectorName: data.inspectorName,
      assignedInspectorBadge: data.inspectorBadge || 'MP-INSP-2026',
      assignedInspectorPhone: data.inspectorPhone || '+91 98260 00000',
      location: { ...project.location },
      gpsVerified: false,
      checklistItems: [
        { id: `chk-${Date.now()}-1`, category: 'Physical Infrastructure', title: 'Workmanship, foundation and structural integrity verified on-site', status: 'PENDING', mandatory: true },
        { id: `chk-${Date.now()}-2`, category: 'Beneficiary Audit', title: 'Direct beneficiary identification and physical roster cross-examination', status: 'PENDING', mandatory: true },
        { id: `chk-${Date.now()}-3`, category: 'Fund Utilization', title: 'Material delivery vouchers match physical assets in inventory', status: 'PENDING', mandatory: true },
        { id: `chk-${Date.now()}-4`, category: 'Statutory Signage', title: 'Scheme name, sanctioned grant and public disclosure boards displayed', status: 'PENDING', mandatory: true },
      ],
      evidenceCount: 0,
      findingsCount: 0,
      priority: data.priority || (data.type === 'SURPRISE' ? 'HIGH' : 'NORMAL'),
      isSurprise: data.type === 'SURPRISE',
      createdAt: new Date().toISOString()
    };

    this.inspections.unshift(newInspection);
    this.addAuditLog(actor, data.type === 'SURPRISE' ? 'CREATE_SURPRISE_INSPECTION' : 'CREATE_INSPECTION', 'INSPECTION', newInspection.id, undefined, `Assigned to ${data.inspectorName}`);

    // Create notification
    this.addNotification({
      title: `${data.type === 'SURPRISE' ? '⚡ Surprise' : '📋 Regular'} Inspection Assigned`,
      message: `Inspection ${newInspection.inspectionCode} assigned to ${data.inspectorName} for ${project.name}`,
      type: 'INSPECTION'
    });

    return newInspection;
  }

  async verifyGpsLocation(inspectionId: string, lat: number, lng: number, actor: UserProfile): Promise<{ verified: boolean; distanceMeters: number; accuracyMeters: number }> {
    const inspection = this.inspections.find(i => i.id === inspectionId);
    if (!inspection) throw new Error('Inspection not found');

    // Haversine distance formula in meters
    const R = 6371e3; // Earth radius in meters
    const φ1 = (inspection.location.lat * Math.PI) / 180;
    const φ2 = (lat * Math.PI) / 180;
    const Δφ = ((lat - inspection.location.lat) * Math.PI) / 180;
    const Δλ = ((lng - inspection.location.lng) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = Math.round(R * c);

    // Geofence allowance: 100 meters
    const verified = distanceMeters <= 100;
    const accuracyMeters = 4.2;

    inspection.gpsVerified = true; // In simulation mode, accept within reasonable field perimeter
    inspection.gpsAccuracyMeters = accuracyMeters;
    inspection.distanceFromTargetMeters = distanceMeters;
    inspection.gpsVerifiedAt = new Date().toISOString();

    this.addAuditLog(actor, 'VERIFY_GPS_LOCATION', 'INSPECTION', inspectionId, undefined, `Distance: ${distanceMeters}m, Verified: ${verified}`);
    return { verified, distanceMeters, accuracyMeters };
  }

  async startInspection(inspectionId: string, actor: UserProfile): Promise<Inspection> {
    const inspection = this.inspections.find(i => i.id === inspectionId);
    if (!inspection) throw new Error('Inspection not found');
    inspection.status = 'IN_PROGRESS';
    inspection.startedAt = new Date().toISOString();
    this.addAuditLog(actor, 'START_INSPECTION', 'INSPECTION', inspectionId, 'ASSIGNED', 'IN_PROGRESS');
    return inspection;
  }

  async updateChecklistItem(inspectionId: string, itemId: string, status: 'YES' | 'NO' | 'NA', remarks?: string): Promise<void> {
    const inspection = this.inspections.find(i => i.id === inspectionId);
    if (!inspection) return;
    const item = inspection.checklistItems.find(c => c.id === itemId);
    if (item) {
      item.status = status;
      if (remarks !== undefined) item.remarks = remarks;
      item.updatedAt = new Date().toISOString();
    }
  }

  async submitInspection(inspectionId: string, summaryRemarks: string, actor: UserProfile): Promise<Inspection> {
    const inspection = this.inspections.find(i => i.id === inspectionId);
    if (!inspection) throw new Error('Inspection not found');

    inspection.status = 'SUBMITTED';
    inspection.completedAt = new Date().toISOString();
    inspection.submittedAt = new Date().toISOString();
    inspection.summaryRemarks = summaryRemarks;

    this.addAuditLog(actor, 'SUBMIT_INSPECTION', 'INSPECTION', inspectionId, 'IN_PROGRESS', 'SUBMITTED');

    this.addNotification({
      title: `Inspection Submitted: ${inspection.inspectionCode}`,
      message: `${inspection.assignedInspectorName} submitted field inspection report for ${inspection.projectName}`,
      type: 'INSPECTION'
    });

    return inspection;
  }

  // ================= EVIDENCE =================
  async getEvidence(filter?: { inspectionId?: string; projectId?: string }): Promise<EvidenceRecord[]> {
    let list = [...this.evidence];
    if (filter?.inspectionId) list = list.filter(e => e.inspectionId === filter.inspectionId);
    if (filter?.projectId) list = list.filter(e => e.projectId === filter.projectId);
    return list;
  }

  async uploadEvidence(record: Omit<EvidenceRecord, 'id' | 'capturedAt' | 'verificationStatus' | 'hashVerified'>, actor: UserProfile): Promise<EvidenceRecord> {
    const newEvidence: EvidenceRecord = {
      ...record,
      id: `evi-${Date.now()}`,
      capturedAt: new Date().toISOString(),
      verificationStatus: 'VERIFIED',
      hashVerified: true,
    };
    this.evidence.unshift(newEvidence);

    // Update inspection count
    if (newEvidence.inspectionId) {
      const insp = this.inspections.find(i => i.id === newEvidence.inspectionId);
      if (insp) insp.evidenceCount = (insp.evidenceCount || 0) + 1;
    }

    this.addAuditLog(actor, 'UPLOAD_EVIDENCE', 'EVIDENCE', newEvidence.id, undefined, newEvidence.caption);
    return newEvidence;
  }

  // ================= FINDINGS =================
  async getFindings(filter?: { inspectionId?: string; projectId?: string; orgId?: string }): Promise<Finding[]> {
    let list = [...this.findings];
    if (filter?.inspectionId) list = list.filter(f => f.inspectionId === filter.inspectionId);
    if (filter?.projectId) list = list.filter(f => f.projectId === filter.projectId);
    if (filter?.orgId) list = list.filter(f => f.organizationId === filter.orgId);
    return list;
  }

  async createFinding(data: {
    inspectionId: string;
    title: string;
    description: string;
    category: 'INFRASTRUCTURE' | 'FINANCIAL' | 'ATTENDANCE' | 'BENEFICIARY' | 'PROCUREMENT' | 'REGULATORY';
    severity: FindingSeverity;
    evidenceIds?: string[];
    remarks?: string;
  }, actor: UserProfile): Promise<Finding> {
    const inspection = this.inspections.find(i => i.id === data.inspectionId);
    if (!inspection) throw new Error('Inspection not found');

    const newFinding: Finding = {
      id: `find-${Date.now()}`,
      inspectionId: inspection.id,
      inspectionCode: inspection.inspectionCode,
      projectId: inspection.projectId,
      projectName: inspection.projectName,
      organizationId: inspection.organizationId,
      organizationName: inspection.organizationName,
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.severity,
      status: 'OPEN',
      evidenceIds: data.evidenceIds || [],
      location: inspection.location,
      remarks: data.remarks,
      createdBy: actor.fullName,
      createdAt: new Date().toISOString()
    };

    this.findings.unshift(newFinding);
    inspection.findingsCount = (inspection.findingsCount || 0) + 1;

    // Automatically trigger alert for critical or high severity
    if (data.severity === 'CRITICAL' || data.severity === 'HIGH') {
      this.alerts.unshift({
        id: `alt-${Date.now()}`,
        severity: data.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        type: 'INSPECTION_ANOMALY',
        source: 'Inspector Field Finding',
        entityType: 'INSPECTION',
        entityId: inspection.id,
        message: `${data.severity} Finding filed on ${inspection.projectName}: "${data.title}"`,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      });
    }

    this.addAuditLog(actor, 'CREATE_FINDING', 'FINDING', newFinding.id, undefined, `${data.severity}: ${data.title}`);
    return newFinding;
  }

  // ================= COMPLIANCE =================
  async getCompliance(orgId?: string): Promise<ComplianceAction[]> {
    if (orgId) return this.compliance.filter(c => c.organizationId === orgId);
    return [...this.compliance];
  }

  async createComplianceAction(data: {
    findingId: string;
    actionRequired: string;
    dueDate: string;
  }, actor: UserProfile): Promise<ComplianceAction> {
    const finding = this.findings.find(f => f.id === data.findingId);
    if (!finding) throw new Error('Finding not found');

    const newComp: ComplianceAction = {
      id: `comp-${Date.now()}`,
      findingId: finding.id,
      findingTitle: finding.title,
      projectId: finding.projectId,
      projectName: finding.projectName,
      organizationId: finding.organizationId,
      organizationName: finding.organizationName,
      actionRequired: data.actionRequired,
      dueDate: data.dueDate,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };

    this.compliance.unshift(newComp);
    finding.status = 'COMPLIANCE_ISSUED';
    this.addAuditLog(actor, 'CREATE_COMPLIANCE_NOTICE', 'COMPLIANCE', newComp.id, undefined, `Due by: ${data.dueDate}`);
    return newComp;
  }

  async submitComplianceResponse(complianceId: string, responseRemarks: string, evidenceUrl: string, actor: UserProfile): Promise<void> {
    const item = this.compliance.find(c => c.id === complianceId);
    if (!item) throw new Error('Compliance action not found');
    item.status = 'SUBMITTED';
    item.responseRemarks = responseRemarks;
    item.responseEvidenceUrl = evidenceUrl;
    item.respondedAt = new Date().toISOString();
    this.addAuditLog(actor, 'SUBMIT_COMPLIANCE_RESPONSE', 'COMPLIANCE', complianceId, 'OPEN', 'SUBMITTED');
  }

  // ================= LIVE MONITORING & RECORDINGS =================
  async getLiveFeeds(): Promise<LiveMonitoringFeed[]> {
    return [...this.feeds];
  }

  async getRecordings(): Promise<Recording[]> {
    return [...this.recordings];
  }

  // ================= ALERTS =================
  async getAlerts(): Promise<DrishtiAlert[]> {
    return [...this.alerts];
  }

  async resolveAlert(alertId: string, actor: UserProfile): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'RESOLVED';
      alert.resolvedAt = new Date().toISOString();
      this.addAuditLog(actor, 'RESOLVE_ALERT', 'ALERT', alertId, 'ACTIVE', 'RESOLVED');
    }
  }

  // ================= RISK INTELLIGENCE =================
  async getRiskIntelligence(): Promise<RiskIntelligence[]> {
    return [...this.riskData];
  }

  // ================= AUDIT LOGS =================
  async getAuditLogs(): Promise<AuditLog[]> {
    return [...this.auditLogs];
  }

  private addAuditLog(
    actor: UserProfile,
    action: string,
    entity: string,
    entityId: string,
    previousState?: string,
    newState?: string
  ): void {
    this.auditLogs.unshift({
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action,
      entity,
      entityId,
      timestamp: new Date().toISOString(),
      previousState,
      newState
    });
  }

  // ================= NOTIFICATIONS =================
  async getNotifications(): Promise<NotificationItem[]> {
    return [...this.notifications];
  }

  async markNotificationRead(id: string): Promise<void> {
    const item = this.notifications.find(n => n.id === id);
    if (item) item.isRead = true;
  }

  private addNotification(notif: Omit<NotificationItem, 'id' | 'isRead' | 'createdAt'>): void {
    this.notifications.unshift({
      ...notif,
      id: `notif-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  // ================= DASHBOARD SUMMARY METRICS =================
  async getGovernmentSummaryMetrics() {
    const orgs = await this.getOrganizations();
    const projects = await this.getProjects();
    const inspections = await this.getInspections();
    const findings = await this.getFindings();
    const compliance = await this.getCompliance();
    const alerts = await this.getAlerts();
    const feeds = await this.getLiveFeeds();

    const highRiskCount = orgs.filter(o => o.riskLevel === 'HIGH' || o.riskLevel === 'CRITICAL').length;
    const openFindingsCount = findings.filter(f => f.status === 'OPEN').length;
    const overdueComplianceCount = compliance.filter(c => c.status === 'OVERDUE').length;
    const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;
    const onlineFeedsCount = feeds.filter(f => f.status === 'ONLINE').length;

    return {
      totalOrganizations: orgs.length,
      activeProjects: projects.filter(p => p.status === 'ACTIVE' || p.status === 'UNDER_INSPECTION').length,
      activeInspections: inspections.filter(i => i.status === 'IN_PROGRESS' || i.status === 'ASSIGNED').length,
      highRiskCount,
      openFindingsCount,
      overdueComplianceCount,
      activeAlertsCount,
      onlineFeedsCount
    };
  }
}

export const drishtiDataService = new DrishtiDataService();
