import React from 'react';
import { Inspection, EvidenceRecord, Finding } from '../../types';
import {
  CheckCircle2,
  MapPin,
  Calendar,
  ShieldCheck,
  Camera,
  AlertTriangle,
  X,
  FileText,
  User,
  Building2,
  Clock
} from 'lucide-react';

interface CompletedAuditModalProps {
  inspection: Inspection;
  onClose: () => void;
}

export const CompletedAuditModal: React.FC<CompletedAuditModalProps> = ({
  inspection,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-[#E2E5E9] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col text-[#1F2937] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E5E9] bg-white flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-semibold text-[#174A73] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {inspection.inspectionCode}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                <span>OFFICIALLY SEALED & VERIFIED</span>
              </span>
            </div>
            <h3 className="font-bold text-base text-[#1F2937] mt-1">{inspection.projectName}</h3>
            <p className="text-xs text-[#667085] flex items-center space-x-1 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-[#174A73]" />
              <span>{inspection.organizationName}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#667085] hover:text-[#1F2937] hover:bg-[#F7F8FA]"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Audit Verification Metadata */}
          <div className="bg-[#F7F8FA] border border-[#E2E5E9] rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <span className="text-[#667085] block font-medium">Conducting Inspector</span>
              <span className="font-semibold text-[#1F2937] mt-0.5 block">{inspection.assignedInspectorName || 'Rajesh Verma'}</span>
              <span className="text-[10px] text-[#667085]">Badge: {inspection.assignedInspectorBadge || 'MP-INSP-4081'}</span>
            </div>
            <div>
              <span className="text-[#667085] block font-medium">GPS Geofence Status</span>
              <span className="font-semibold text-[#16A34A] flex items-center space-x-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Locked within {inspection.gpsAccuracyMeters || 3.2}m</span>
              </span>
              <span className="text-[10px] text-[#667085]">Deviation: {inspection.distanceFromTargetMeters || 8}m from DPR</span>
            </div>
            <div>
              <span className="text-[#667085] block font-medium">Audit Date & Time</span>
              <span className="font-semibold text-[#1F2937] mt-0.5 block">{inspection.completedAt ? new Date(inspection.completedAt).toLocaleDateString() : inspection.scheduledDate}</span>
              <span className="text-[10px] text-[#667085]">Type: {inspection.type}</span>
            </div>
            <div>
              <span className="text-[#667085] block font-medium">Audit Finding Result</span>
              <span className={`font-semibold mt-0.5 block ${inspection.findingsCount === 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                {inspection.findingsCount === 0 ? '✓ 0 Irregularities' : `${inspection.findingsCount} Deficiencies Flagged`}
              </span>
              <span className="text-[10px] text-[#667085]">{inspection.evidenceCount} Photos Captured</span>
            </div>
          </div>

          {/* Location Details */}
          <div className="border border-[#E2E5E9] rounded-lg p-3 space-y-1">
            <span className="text-[11px] font-semibold text-[#667085] block">Inspection Field Site Address:</span>
            <div className="flex items-center space-x-1.5 text-xs text-[#1F2937]">
              <MapPin className="w-4 h-4 text-[#174A73] flex-shrink-0" />
              <span>{inspection.location.address || `${inspection.location.district}, ${inspection.location.state}`}</span>
            </div>
            <div className="text-[11px] font-mono text-[#667085]">
              GPS Coordinates: {inspection.location.lat.toFixed(5)}° N, {inspection.location.lng.toFixed(5)}° E
            </div>
          </div>

          {/* Summary Remarks */}
          <div className="border border-[#E2E5E9] rounded-lg p-3 space-y-1.5">
            <span className="text-[11px] font-semibold text-[#667085] block">Official Inspector Summary Remarks:</span>
            <p className="text-xs text-[#1F2937] leading-relaxed bg-[#F7F8FA] p-2.5 rounded border border-[#E2E5E9]">
              "{inspection.summaryRemarks || 'Field verification completed with GPS validation and photographic evidence.'}"
            </p>
          </div>

          {/* Checklist Verification Results */}
          <div className="border border-[#E2E5E9] rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-[#F7F8FA] border-b border-[#E2E5E9] font-semibold text-xs text-[#1F2937]">
              Inspection Checklist Items Verified ({inspection.checklistItems?.length || 0})
            </div>
            <div className="divide-y divide-[#E2E5E9] text-xs">
              {inspection.checklistItems?.map(chk => (
                <div key={chk.id} className="p-3 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-medium text-[#667085] uppercase tracking-wider">{chk.category}</span>
                    <h5 className="font-medium text-[#1F2937] mt-0.5">{chk.title}</h5>
                    {chk.remarks && (
                      <p className="text-[11px] text-[#667085] mt-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        Observed: {chk.remarks}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${
                      chk.status === 'YES'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : chk.status === 'NO'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {chk.status === 'YES' ? '✓ COMPLIANT' : chk.status === 'NO' ? '✗ DEFICIENT' : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E2E5E9] bg-[#F7F8FA] flex items-center justify-between">
          <span className="text-[11px] text-[#667085]">
            Digitally Transmitted to PMU Directorate via DRISHTI Secured Protocol
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-md bg-[#174A73] hover:bg-[#123859] text-white"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
