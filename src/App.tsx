/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { GovernmentCommandCenter } from './workspaces/government/GovernmentCommandCenter';
import { NgoPortal } from './workspaces/ngo/NgoPortal';
import { InspectorWorkspace } from './workspaces/inspector/InspectorWorkspace';

const DrishtiAppContent: React.FC = () => {
  const { currentUser, selectedWorkspace } = useAuth();

  if (!currentUser) {
    return <LoginScreen />;
  }

  // Workspace routing based on authenticated user workspace
  switch (selectedWorkspace) {
    case 'GOVERNMENT':
      return <GovernmentCommandCenter />;
    case 'NGO':
      return <NgoPortal />;
    case 'INSPECTOR':
      return <InspectorWorkspace />;
    default:
      return <GovernmentCommandCenter />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <DrishtiAppContent />
    </AuthProvider>
  );
}
