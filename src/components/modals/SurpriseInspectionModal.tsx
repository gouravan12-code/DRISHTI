import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Project } from '../../types';
import { drishtiDataService } from '../../services/drishtiDataService';
import { Zap, X, Calendar, User, AlertCircle, Building2 } from 'lucide-react';

interface SurpriseInspectionModalProps {
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onInspectionCreated: () => void;
  initialProjectId?: string;
}

export const SurpriseInspectionModal: React.FC<SurpriseInspectionModalProps> = ({
  projects,
  isOpen,
  onClose,
  onInspectionCreated,
  initialProjectId
}) => {
  const { currentUser } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || projects[0]?.id || '');
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
    } else if (projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [initialProjectId, isOpen, projects]);
  const [selectedInspector, setSelectedInspector] = useState({
    id: 'usr-insp-01',
    name: 'Inspector Rajesh Verma',
    badge: 'MP-INSP-4081',
    phone: '+91 98261 40819'
  });
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('URGENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const inspectorsList = [
    { id: 'usr-insp-01', name: 'Inspector Rajesh Verma', badge: 'MP-INSP-4081', phone: '+91 98261 40819' },
    { id: 'usr-insp-02', name: 'Inspector Priya Nair', badge: 'MP-INSP-3912', phone: '+91 98262 39120' },
    { id: 'usr-insp-03', name: 'Inspector Amit Bundela', badge: 'MP-INSP-5120', phone: '+91 98260 51200' },
  ];

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const handleCreateSurpriseInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await drishtiDataService.createInspection({
        projectId: selectedProjectId,
        type: 'SURPRISE',
        scheduledDate,
        inspectorId: selectedInspector.id,
        inspectorName: selectedInspector.name,
        inspectorBadge: selectedInspector.badge,
        inspectorPhone: selectedInspector.phone,
        priority
      }, currentUser);

      onInspectionCreated();
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to dispatch surprise inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-[#E2E5E9] rounded-lg shadow-lg max-w-lg w-full p-6 text-[#1F2937]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E5E9]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-[#D97706]">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1F2937]">
                Create Surprise Inspection
              </h3>
              <p className="text-xs text-[#667085]">
                Assign an unannounced Field Quality Monitor to target project site.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#667085] hover:text-[#1F2937] p-1 rounded-md hover:bg-[#F7F8FA]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleCreateSurpriseInspection} className="mt-4 space-y-4 text-xs">
          {/* Project Selection */}
          <div>
            <label className="block text-xs font-medium text-[#1F2937] mb-1">
              Select Target Project
            </label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full bg-white border border-[#E2E5E9] rounded-md px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#174A73]"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name} ({p.organizationName})
                </option>
              ))}
            </select>
          </div>

          {/* Target Project Summary Card */}
          {selectedProject && (
            <div className="p-3 bg-[#F7F8FA] border border-[#E2E5E9] rounded-md space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-medium text-[#1F2937]">{selectedProject.name}</span>
                <span className="text-[11px] font-medium text-[#174A73]">{selectedProject.scheme}</span>
              </div>
              <div className="text-[#667085] text-[11px]">
                Agency: {selectedProject.organizationName} • Progress: {selectedProject.progressPercentage}%
              </div>
            </div>
          )}

          {/* Assigned Inspector */}
          <div>
            <label className="block text-xs font-medium text-[#1F2937] mb-1">
              Assign Field Inspector
            </label>
            <div className="space-y-2">
              {inspectorsList.map(insp => (
                <div
                  key={insp.id}
                  onClick={() => setSelectedInspector(insp)}
                  className={`p-2.5 rounded-md border cursor-pointer flex items-center justify-between transition ${
                    selectedInspector.id === insp.id
                      ? 'border-[#174A73] bg-blue-50/40 text-[#174A73]'
                      : 'border-[#E2E5E9] bg-white text-[#1F2937] hover:bg-[#F7F8FA]'
                  }`}
                >
                  <div>
                    <div className="font-medium">{insp.name}</div>
                    <div className="text-[11px] text-[#667085]">Badge: {insp.badge} • {insp.phone}</div>
                  </div>
                  <input
                    type="radio"
                    name="inspectorSelect"
                    checked={selectedInspector.id === insp.id}
                    onChange={() => setSelectedInspector(insp)}
                    className="text-[#174A73] focus:ring-[#174A73]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Date & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#1F2937] mb-1">
                Inspection Date
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full bg-white border border-[#E2E5E9] rounded-md px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#174A73]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1F2937] mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full bg-white border border-[#E2E5E9] rounded-md px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#174A73]"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High Attention</option>
                <option value="URGENT">Urgent / Immediate</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-[#E2E5E9] flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-md text-[#667085] hover:bg-[#F7F8FA] border border-[#E2E5E9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-md bg-[#174A73] hover:bg-[#123859] text-white transition disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Surprise Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
