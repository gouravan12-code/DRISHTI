import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, WorkspaceType, Permission } from '../types';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

interface AuthContextType {
  currentUser: UserProfile | null;
  selectedWorkspace: WorkspaceType;
  setSelectedWorkspace: (ws: WorkspaceType) => void;
  login: (role: UserRole, options?: { orgId?: string; orgName?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  isLoading: boolean;
}

// Preset standard demo profiles for genuine role-based operational testing
const ROLE_PROFILES: Record<UserRole, UserProfile> = {
  SUPER_ADMIN: {
    id: 'usr-gov-00',
    email: 'superadmin.drishti@nic.gov.in',
    fullName: 'Shri K. V. Subramanian (IAS)',
    designation: 'Director General of Monitoring',
    role: 'SUPER_ADMIN',
    workspace: 'GOVERNMENT',
    permissions: [
      'VIEW_ALL_ORGANIZATIONS', 'VIEW_ORGANIZATION', 'CREATE_ORGANIZATION', 'UPDATE_ORGANIZATION',
      'VIEW_PROJECT', 'CREATE_PROJECT', 'UPDATE_PROJECT', 'CREATE_INSPECTION', 'CREATE_SURPRISE_INSPECTION',
      'ASSIGN_INSPECTOR', 'REASSIGN_INSPECTOR', 'VIEW_INSPECTION', 'START_INSPECTION', 'VERIFY_LOCATION',
      'COMPLETE_CHECKLIST', 'UPLOAD_EVIDENCE', 'CREATE_FINDING', 'SUBMIT_INSPECTION', 'SUBMIT_PROJECT_UPDATE',
      'SUBMIT_COMPLIANCE_RESPONSE', 'VIEW_LIVE_MONITORING', 'VIEW_RECORDINGS', 'MANAGE_USERS', 'VIEW_AUDIT_LOGS', 'GENERATE_REPORTS'
    ],
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z'
  },
  GOVERNMENT_OFFICIAL: {
    id: 'usr-gov-01',
    email: 'arvind.sen@mp.gov.in',
    fullName: 'Arvind Sen (Joint Secretary)',
    designation: 'Directorate of Rural Development & Monitoring',
    role: 'GOVERNMENT_OFFICIAL',
    workspace: 'GOVERNMENT',
    permissions: [
      'VIEW_ALL_ORGANIZATIONS', 'VIEW_ORGANIZATION', 'VIEW_PROJECT', 'CREATE_PROJECT', 'UPDATE_PROJECT',
      'CREATE_INSPECTION', 'CREATE_SURPRISE_INSPECTION', 'ASSIGN_INSPECTOR', 'REASSIGN_INSPECTOR',
      'VIEW_INSPECTION', 'VIEW_LIVE_MONITORING', 'VIEW_RECORDINGS', 'VIEW_AUDIT_LOGS', 'GENERATE_REPORTS'
    ],
    status: 'ACTIVE',
    createdAt: '2024-02-10T00:00:00Z'
  },
  PMU_OFFICIAL: {
    id: 'usr-gov-02',
    email: 'pmu.lead@drishti.nic.in',
    fullName: 'Neha Chhabra',
    designation: 'PMU Evaluation Officer',
    role: 'PMU_OFFICIAL',
    workspace: 'GOVERNMENT',
    permissions: [
      'VIEW_ALL_ORGANIZATIONS', 'VIEW_ORGANIZATION', 'VIEW_PROJECT', 'CREATE_INSPECTION',
      'VIEW_INSPECTION', 'VIEW_LIVE_MONITORING', 'GENERATE_REPORTS'
    ],
    status: 'ACTIVE',
    createdAt: '2024-03-01T00:00:00Z'
  },
  NGO_ADMIN: {
    id: 'usr-ngo-01',
    email: 'contact@graminsahayog.demo.org',
    fullName: 'Dr. Rameshwar Sharma',
    designation: 'Managing Trustee',
    organizationId: 'org-01',
    organizationName: 'Gramin Vikas Sahayog Trust',
    role: 'NGO_ADMIN',
    workspace: 'NGO',
    permissions: [
      'VIEW_ORGANIZATION', 'UPDATE_ORGANIZATION', 'VIEW_PROJECT', 'SUBMIT_PROJECT_UPDATE',
      'SUBMIT_COMPLIANCE_RESPONSE', 'VIEW_INSPECTION'
    ],
    status: 'ACTIVE',
    createdAt: '2024-01-15T00:00:00Z'
  },
  NGO_STAFF: {
    id: 'usr-ngo-02',
    email: 'sunita@prakritikalyan.demo.org',
    fullName: 'Sunita Chouhan',
    designation: 'Project Director',
    organizationId: 'org-02',
    organizationName: 'Prakriti Jan Kalyan Sansthan',
    role: 'NGO_STAFF',
    workspace: 'NGO',
    permissions: [
      'VIEW_ORGANIZATION', 'VIEW_PROJECT', 'SUBMIT_PROJECT_UPDATE', 'SUBMIT_COMPLIANCE_RESPONSE'
    ],
    status: 'ACTIVE',
    createdAt: '2024-04-10T00:00:00Z'
  },
  FIELD_INSPECTOR: {
    id: 'usr-insp-01',
    email: 'rajesh.verma@mp-inspection.gov.in',
    fullName: 'Rajesh Verma',
    badgeNumber: 'MP-INSP-4081',
    designation: 'Field Quality Monitor (FQM)',
    role: 'FIELD_INSPECTOR',
    workspace: 'INSPECTOR',
    phone: '+91 98261 40819',
    permissions: [
      'VIEW_INSPECTION', 'START_INSPECTION', 'VERIFY_LOCATION', 'COMPLETE_CHECKLIST',
      'UPLOAD_EVIDENCE', 'CREATE_FINDING', 'SUBMIT_INSPECTION'
    ],
    status: 'ACTIVE',
    createdAt: '2024-05-12T00:00:00Z'
  },
  SENIOR_INSPECTOR: {
    id: 'usr-insp-02',
    email: 'priya.nair@mp-inspection.gov.in',
    fullName: 'Priya Nair',
    badgeNumber: 'MP-INSP-3912',
    designation: 'Senior Technical Auditor',
    role: 'SENIOR_INSPECTOR',
    workspace: 'INSPECTOR',
    phone: '+91 98262 39120',
    permissions: [
      'VIEW_INSPECTION', 'START_INSPECTION', 'VERIFY_LOCATION', 'COMPLETE_CHECKLIST',
      'UPLOAD_EVIDENCE', 'CREATE_FINDING', 'SUBMIT_INSPECTION'
    ],
    status: 'ACTIVE',
    createdAt: '2024-02-18T00:00:00Z'
  },
  INSPECTION_SUPERVISOR: {
    id: 'usr-insp-03',
    email: 'amit.bundela@mp-inspection.gov.in',
    fullName: 'Amit Bundela',
    badgeNumber: 'MP-INSP-5120',
    designation: 'Zonal Inspection Lead',
    role: 'INSPECTION_SUPERVISOR',
    workspace: 'INSPECTOR',
    phone: '+91 98260 51200',
    permissions: [
      'VIEW_INSPECTION', 'START_INSPECTION', 'VERIFY_LOCATION', 'COMPLETE_CHECKLIST',
      'UPLOAD_EVIDENCE', 'CREATE_FINDING', 'SUBMIT_INSPECTION', 'ASSIGN_INSPECTOR'
    ],
    status: 'ACTIVE',
    createdAt: '2024-01-20T00:00:00Z'
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Login page acts as the primary main landing page for the application
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceType>('GOVERNMENT');

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('drishti_auth_user', JSON.stringify(currentUser));
      localStorage.setItem('drishti_active_workspace', currentUser.workspace);
      setSelectedWorkspace(currentUser.workspace);
    } else {
      localStorage.removeItem('drishti_auth_user');
      localStorage.removeItem('drishti_active_workspace');
    }
  }, [currentUser]);

  const login = async (
    role: UserRole,
    options?: { orgId?: string; orgName?: string }
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const baseProfile = ROLE_PROFILES[role] || ROLE_PROFILES.GOVERNMENT_OFFICIAL;
      const profile: UserProfile = { ...baseProfile };

      if (options?.orgId) {
        profile.organizationId = options.orgId;
      }
      if (options?.orgName) {
        profile.organizationName = options.orgName;
      }

      setCurrentUser(profile);
      setSelectedWorkspace(profile.workspace);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    localStorage.removeItem('drishti_auth_user');
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    return currentUser.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        selectedWorkspace,
        setSelectedWorkspace,
        login,
        logout,
        hasPermission,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
