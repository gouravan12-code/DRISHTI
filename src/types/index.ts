// DRISHTI Domain Models & Role-Based Access Control

export type UserRole =
  // Government Roles
  | 'SUPER_ADMIN'
  | 'GOVERNMENT_OFFICIAL'
  | 'PMU_OFFICIAL'
  // NGO Roles
  | 'NGO_ADMIN'
  | 'NGO_STAFF'
  // Field Inspector Roles
  | 'FIELD_INSPECTOR'
  | 'SENIOR_INSPECTOR'
  | 'INSPECTION_SUPERVISOR';

export type WorkspaceType = 'GOVERNMENT' | 'NGO' | 'INSPECTOR';

export type Permission =
  | 'VIEW_ALL_ORGANIZATIONS'
  | 'VIEW_ORGANIZATION'
  | 'CREATE_ORGANIZATION'
  | 'UPDATE_ORGANIZATION'
  | 'VIEW_PROJECT'
  | 'CREATE_PROJECT'
  | 'UPDATE_PROJECT'
  | 'CREATE_INSPECTION'
  | 'CREATE_SURPRISE_INSPECTION'
  | 'ASSIGN_INSPECTOR'
  | 'REASSIGN_INSPECTOR'
  | 'VIEW_INSPECTION'
  | 'START_INSPECTION'
  | 'VERIFY_LOCATION'
  | 'COMPLETE_CHECKLIST'
  | 'UPLOAD_EVIDENCE'
  | 'CREATE_FINDING'
  | 'SUBMIT_INSPECTION'
  | 'SUBMIT_PROJECT_UPDATE'
  | 'SUBMIT_COMPLIANCE_RESPONSE'
  | 'VIEW_LIVE_MONITORING'
  | 'VIEW_RECORDINGS'
  | 'MANAGE_USERS'
  | 'VIEW_AUDIT_LOGS'
  | 'GENERATE_REPORTS';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  workspace: WorkspaceType;
  organizationId?: string; // If NGO or linked
  organizationName?: string;
  badgeNumber?: string; // For inspectors
  designation?: string;
  avatarUrl?: string;
  permissions: Permission[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

export interface Organization {
  id: string;
  name: string;
  registrationNumber: string;
  fcraNumber?: string;
  darpanId?: string;
  type: 'TRUST' | 'SOCIETY' | 'SECTION_8' | 'INSTITUTION';
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  location: GeoLocation;
  totalFundsReceived: number; // in INR
  activeProjectsCount: number;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  complianceRate: number; // percentage
  status: 'VERIFIED' | 'UNDER_REVIEW' | 'SUSPENDED';
  liveMonitoringAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus =
  | 'PROPOSED'
  | 'APPROVED'
  | 'ACTIVE'
  | 'UNDER_INSPECTION'
  | 'DELAYED'
  | 'COMPLETED'
  | 'SUSPENDED';

export interface Project {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  code: string;
  description: string;
  scheme: string; // e.g. PM-AWAS, Poshan Abhiyaan, Jal Jeevan Mission, Samagra Shiksha
  fundingSanctioned: number;
  fundingDisbursed: number;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  targetBeneficiaries: number;
  currentBeneficiaries: number;
  progressPercentage: number;
  location: GeoLocation;
  riskScore: number;
  riskLevel: RiskLevel;
  liveFeedCount: number;
  lastInspectionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  projectName: string;
  organizationId: string;
  title: string;
  description: string;
  progressPercentage: number;
  beneficiariesReached: number;
  fundsUtilized: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REQUIRES_REVISION';
  submittedBy: string;
  submittedAt: string;
  documentsCount: number;
  reviewRemarks?: string;
}

export type InspectionType = 'REGULAR' | 'SURPRISE' | 'FOLLOW_UP';

export type InspectionStatus =
  | 'SCHEDULED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'COMPLETED'
  | 'CANCELLED';

export interface InspectionChecklistItem {
  id: string;
  category: string;
  title: string;
  description?: string;
  status: 'YES' | 'NO' | 'NA' | 'PENDING';
  remarks?: string;
  evidenceRef?: string;
  mandatory: boolean;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  inspectionId?: string;
  projectId: string;
  category: 'BENEFICIARY' | 'STAFF' | 'TRAINEE' | 'WORKER';
  name: string;
  identifierMasked: string; // e.g. Aadhaar masked XXXX-1234
  status: 'PRESENT' | 'ABSENT' | 'VERIFIED' | 'DISCREPANCY';
  timestamp: string;
  verifiedByInspector: boolean;
  remarks?: string;
}

export interface Inspection {
  id: string;
  inspectionCode: string;
  projectId: string;
  projectName: string;
  organizationId: string;
  organizationName: string;
  type: InspectionType;
  status: InspectionStatus;
  scheduledDate: string;
  assignedInspectorId?: string;
  assignedInspectorName?: string;
  assignedInspectorPhone?: string;
  assignedInspectorBadge?: string;
  location: GeoLocation;
  gpsVerified: boolean;
  gpsAccuracyMeters?: number;
  distanceFromTargetMeters?: number;
  gpsVerifiedAt?: string;
  startedAt?: string;
  completedAt?: string;
  submittedAt?: string;
  checklistItems: InspectionChecklistItem[];
  evidenceCount: number;
  findingsCount: number;
  summaryRemarks?: string;
  priority: 'NORMAL' | 'URGENT' | 'HIGH';
  isSurprise: boolean;
  createdAt: string;
}

export type EvidenceType = 'PHOTO' | 'VIDEO' | 'DOCUMENT';

export interface EvidenceRecord {
  id: string;
  inspectionId?: string;
  projectId: string;
  organizationId: string;
  type: EvidenceType;
  caption: string;
  storagePath: string;
  fileUrl: string;
  fileSizeKb: number;
  location?: GeoLocation;
  uploaderName: string;
  uploaderRole: UserRole;
  relatedChecklistId?: string;
  relatedFindingId?: string;
  verificationStatus: 'VERIFIED' | 'FLAGGED' | 'PENDING';
  capturedAt: string;
  hashVerified: boolean;
}

export type FindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FindingCategory =
  | 'INFRASTRUCTURE'
  | 'FINANCIAL'
  | 'ATTENDANCE'
  | 'BENEFICIARY'
  | 'PROCUREMENT'
  | 'REGULATORY';

export interface Finding {
  id: string;
  inspectionId: string;
  inspectionCode: string;
  projectId: string;
  projectName: string;
  organizationId: string;
  organizationName: string;
  title: string;
  description: string;
  category: FindingCategory;
  severity: FindingSeverity;
  status: 'OPEN' | 'COMPLIANCE_ISSUED' | 'RECTIFIED' | 'CLOSED';
  evidenceIds: string[];
  location?: GeoLocation;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export type ComplianceStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CLOSED'
  | 'OVERDUE';

export interface ComplianceAction {
  id: string;
  findingId: string;
  findingTitle: string;
  projectId: string;
  projectName: string;
  organizationId: string;
  organizationName: string;
  actionRequired: string;
  dueDate: string;
  status: ComplianceStatus;
  responseRemarks?: string;
  responseEvidenceUrl?: string;
  respondedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  description: string;
}

export interface RiskIntelligence {
  entityId: string;
  entityType: 'ORGANIZATION' | 'PROJECT';
  name: string;
  score: number; // 0 - 100
  level: RiskLevel;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  confidencePercentage: number;
  aiExplanation: string;
  factors: RiskFactor[];
  supportingRecordsCount: number;
  lastUpdated: string;
}

export interface LiveMonitoringFeed {
  id: string;
  feedCode: string;
  name: string;
  organizationId: string;
  organizationName: string;
  projectId: string;
  projectName: string;
  cameraModel: string;
  streamUrl: string;
  status: 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'ERROR';
  location: GeoLocation;
  lastPing: string;
  uptimeHours: number;
  isSimulatedDemo: true; // Explicitly marked as demo feed
}

export interface Recording {
  id: string;
  feedId: string;
  feedName: string;
  projectName: string;
  organizationName: string;
  durationMinutes: number;
  fileSizeMb: number;
  recordedDate: string;
  videoUrl: string;
  incidentFlagged: boolean;
  incidentNotes?: string;
}

export interface DrishtiAlert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  type:
    | 'HIGH_RISK_SURGE'
    | 'OVERDUE_COMPLIANCE'
    | 'INSPECTION_ANOMALY'
    | 'GEOFENCE_BREACH'
    | 'LIVE_FEED_OFFLINE'
    | 'ATTENDANCE_MISMATCH';
  source: string;
  entityType: 'ORGANIZATION' | 'PROJECT' | 'INSPECTION' | 'CAMERA';
  entityId: string;
  message: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  previousState?: string;
  newState?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  roleTarget?: UserRole;
  title: string;
  message: string;
  type: 'INSPECTION' | 'COMPLIANCE' | 'ALERT' | 'PROJECT';
  link?: string;
  isRead: boolean;
  createdAt: string;
}
