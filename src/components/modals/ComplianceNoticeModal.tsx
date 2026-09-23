import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Finding } from '../../types';
import { drishtiDataService } from '../../services/drishtiDataService';
import { X, ShieldAlert } from 'lucide-react';

interface ComplianceNoticeModalProps {
  finding: Finding | null;
  isOpen: boolean;
  onClose: () => void;
  onComplianceCreated: () => void;
}

export const ComplianceNoticeModal: React.FC<ComplianceNoticeModalProps> = ({
  finding,
  isOpen,
  onClose,
  onComplianceCreated
}) => {
  const { currentUser } = useAuth();
  const [actionRequired, setActionRequired] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // Default 14 days
    return d.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !finding) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !actionRequired.trim()) return;
    setIsSubmitting(true);

    try {
      await drishtiDataService.createComplianceAction({
        findingId: finding.id,
        actionRequired,
        dueDate
      }, currentUser);
      onComplianceCreated();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-[#E2E5E9] rounded-lg shadow-lg max-w-lg w-full p-6 text-[#1F2937]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E5E9]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-red-50 border border-red-200 flex items-center justify-center text-[#DC2626]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1F2937]">Issue Compliance Notice</h3>
              <p className="text-xs text-[#667085]">Formal directive binding implementing organization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#667085] hover:text-[#1F2937] p-1 rounded-md hover:bg-[#F7F8FA]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Finding Reference */}
        <div className="mt-4 p-3 rounded-md bg-[#F7F8FA] border border-[#E2E5E9] text-xs space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[#667085]">Origin Finding:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
              {finding.severity} SEVERITY
            </span>
          </div>
          <p className="font-medium text-[#1F2937]">{finding.title}</p>
          <p className="text-[#667085] text-[11px]">{finding.organizationName}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-[#1F2937] mb-1">
              Statutory Rectification Directive
            </label>
            <textarea
              rows={4}
              required
              value={actionRequired}
              onChange={e => setActionRequired(e.target.value)}
              placeholder="Specify precise corrective action, required engineering tests, or documentary audit submissions..."
              className="w-full bg-white border border-[#E2E5E9] rounded-md p-3 text-xs text-[#1F2937] focus:outline-none focus:border-[#174A73]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1F2937] mb-1">
              Compliance Monitoring Deadline
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full bg-white border border-[#E2E5E9] rounded-md px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#174A73]"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E2E5E9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-md text-[#667085] hover:bg-[#F7F8FA] border border-[#E2E5E9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !actionRequired.trim()}
              className="px-4 py-2 text-xs font-medium rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white transition disabled:opacity-50"
            >
              {isSubmitting ? 'Issuing...' : 'Issue Binding Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
