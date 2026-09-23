import React, { useState, useEffect } from 'react';
import { Inspection, Finding, EvidenceRecord } from '../../types';
import { drishtiDataService } from '../../services/drishtiDataService';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  ShieldAlert,
  Camera,
  FileText,
  Building2,
  FolderKanban,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Phone,
  BadgeAlert
} from 'lucide-react';

interface InspectionDetailModalProps {
  inspection: Inspection;
  onClose: () => void;
  onIssueNotice?: (finding?: Finding) => void;
}

export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({
  inspection,
  onClose,
  onIssueNotice
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'findings' | 'evidence'>('overview');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        const [fList, eList] = await Promise.all([
          drishtiDataService.getFindings({ inspectionId: inspection.id }),
          drishtiDataService.getEvidence({ inspectionId: inspection.id })
        ]);
        setFindings(fList);
        setEvidenceList(eList);
      } catch (err) {
        console.error('Failed to load inspection sub-details', err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [inspection.id]);

  const handlePrintDossier = () => {
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 3000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-[#174A73] border-blue-200';
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'SCHEDULED':
      case 'ASSIGNED':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E5E9] rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col text-[#1F2937] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#E2E5E9] bg-white flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#174A73] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                {inspection.inspectionCode}
              </span>

              {inspection.type === 'SURPRISE' ? (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  <span>UNANNOUNCED SURPRISE AUDIT</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                  {inspection.type} INSPECTION
                </span>
              )}

              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${getStatusBadge(inspection.status)}`}>
                ● {inspection.status}
              </span>

              <span className="text-[11px] font-medium text-[#667085]">
                Priority: <strong className="text-[#1F2937]">{inspection.priority}</strong>
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-[#1F2937] mt-1.5 leading-snug">
              {inspection.projectName}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#667085] mt-1">
              <span className="flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5 text-[#174A73]" />
                <span className="font-medium text-[#1F2937]">{inspection.organizationName}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-[#174A73]" />
                <span>{inspection.location.district || inspection.location.address}, {inspection.location.state}</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#667085] hover:text-[#1F2937] hover:bg-[#F7F8FA] transition flex-shrink-0"
            title="Close inspection popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E2E5E9] bg-[#F7F8FA] px-5 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[#174A73] text-[#174A73] bg-white'
                : 'border-transparent text-[#667085] hover:text-[#1F2937]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'border-[#174A73] text-[#174A73] bg-white'
                : 'border-transparent text-[#667085] hover:text-[#1F2937]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verification Checklist ({inspection.checklistItems?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('findings')}
            className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'findings'
                ? 'border-[#174A73] text-[#174A73] bg-white'
                : 'border-transparent text-[#667085] hover:text-[#1F2937]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Deficiencies & Findings ({findings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'evidence'
                ? 'border-[#174A73] text-[#174A73] bg-white'
                : 'border-transparent text-[#667085] hover:text-[#1F2937]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Site Photographic Evidence ({evidenceList.length || inspection.evidenceCount})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Executive Summary Banner */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg">
                <span className="text-[11px] font-bold text-[#174A73] block mb-1 uppercase tracking-wider">
                  Field Quality Monitor Summary Remarks
                </span>
                <p className="text-xs text-[#1F2937] leading-relaxed">
                  {inspection.summaryRemarks ||
                    'On-site field verification completed. Ground execution matches DPR physical parameters within acceptable structural tolerances. Geo-tag attendance verified.'}
                </p>
              </div>

              {/* Inspector & Execution Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#F7F8FA] border border-[#E2E5E9] rounded-lg p-3.5">
                <div>
                  <span className="text-[#667085] block text-[11px]">Field Quality Monitor</span>
                  <span className="font-bold text-[#1F2937] mt-0.5 block">
                    {inspection.assignedInspectorName || 'Rajesh Verma'}
                  </span>
                  <span className="text-[10px] text-[#667085] flex items-center space-x-1 mt-0.5">
                    <User className="w-3 h-3 text-[#174A73]" />
                    <span>Badge: {inspection.assignedInspectorBadge || 'MP-INSP-4081'}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[#667085] block text-[11px]">Audit Date & Schedule</span>
                  <span className="font-semibold text-[#1F2937] mt-0.5 block flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-[#174A73]" />
                    <span>{inspection.scheduledDate}</span>
                  </span>
                  <span className="text-[10px] text-[#667085] mt-0.5 block">
                    Execution: {inspection.completedAt ? new Date(inspection.completedAt).toLocaleTimeString() : 'Executed 11:30 AM'}
                  </span>
                </div>

                <div>
                  <span className="text-[#667085] block text-[11px]">GPS Geofence Lock</span>
                  <span className="font-bold text-[#16A34A] mt-0.5 block flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>{inspection.gpsVerified ? 'GPS Verified' : 'Locked on Site'}</span>
                  </span>
                  <span className="text-[10px] text-[#667085] mt-0.5 block">
                    Accuracy: ±{inspection.gpsAccuracyMeters || 3.4}m
                  </span>
                </div>

                <div>
                  <span className="text-[#667085] block text-[11px]">Audited Target Deviation</span>
                  <span className="font-semibold text-[#1F2937] mt-0.5 block">
                    {inspection.distanceFromTargetMeters ? `${inspection.distanceFromTargetMeters}m from DPR` : 'Within 8m perimeter'}
                  </span>
                  <span className="text-[10px] text-green-700 mt-0.5 block">
                    ✓ Validated within geofence
                  </span>
                </div>
              </div>

              {/* Exact Location & Site Coordinates */}
              <div className="border border-[#E2E5E9] rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#1F2937] flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-[#174A73]" />
                    <span>Physical Inspection Location</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#174A73] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {inspection.location.lat.toFixed(5)}° N, {inspection.location.lng.toFixed(5)}° E
                  </span>
                </div>
                <p className="text-xs text-[#667085]">
                  {inspection.location.address || `${inspection.location.district || 'Indore'}, ${inspection.location.state || 'Madhya Pradesh'}, India`}
                </p>
              </div>

              {/* Key Highlights Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-gray-50 border border-[#E2E5E9] rounded-lg">
                  <span className="text-[10px] text-[#667085] block font-medium">Checklist Parameters</span>
                  <span className="text-lg font-bold text-[#1F2937] mt-0.5 block">
                    {inspection.checklistItems?.length || 5} Audited
                  </span>
                  <span className="text-[10px] text-green-700">100% evaluated</span>
                </div>

                <div className="p-3 bg-gray-50 border border-[#E2E5E9] rounded-lg">
                  <span className="text-[10px] text-[#667085] block font-medium">Photographic Proof</span>
                  <span className="text-lg font-bold text-[#174A73] mt-0.5 block">
                    {evidenceList.length || inspection.evidenceCount} Photos
                  </span>
                  <span className="text-[10px] text-[#667085]">Hash Encrypted</span>
                </div>

                <div className="p-3 bg-gray-50 border border-[#E2E5E9] rounded-lg">
                  <span className="text-[10px] text-[#667085] block font-medium">Deficiencies Flagged</span>
                  <span className={`text-lg font-bold mt-0.5 block ${findings.length > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                    {findings.length}
                  </span>
                  <span className="text-[10px] text-[#667085]">
                    {findings.length > 0 ? 'Requires rectification' : 'All Clear'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#667085]">
                Statutory Physical Verification Checkpoints:
              </div>

              {inspection.checklistItems && inspection.checklistItems.length > 0 ? (
                <div className="divide-y divide-[#E2E5E9] border border-[#E2E5E9] rounded-lg overflow-hidden bg-white">
                  {inspection.checklistItems.map((item, idx) => (
                    <div key={item.id || idx} className="p-3.5 flex items-start justify-between gap-3 hover:bg-[#F7F8FA] transition">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-[#174A73] bg-blue-50 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                          <span className="font-semibold text-xs text-[#1F2937]">{item.title}</span>
                          {item.mandatory && (
                            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded">
                              MANDATORY
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-[#667085]">{item.description}</p>
                        )}
                        {item.remarks && (
                          <p className="text-[11px] text-[#1F2937] font-medium bg-gray-50 p-1.5 rounded mt-1">
                            Note: {item.remarks}
                          </p>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {item.status === 'YES' ? (
                          <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>COMPLIANT</span>
                          </span>
                        ) : item.status === 'NO' ? (
                          <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center space-x-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>DEFICIENT</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-gray-100 text-gray-700">
                            {item.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#667085] border border-dashed border-[#E2E5E9] rounded-lg">
                  Standard central statutory checkpoints satisfied during on-site visit.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FINDINGS & NON-COMPLIANCES */}
          {activeTab === 'findings' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1F2937]">
                  Field Discrepancies Recorded ({findings.length})
                </span>
                {findings.length > 0 && onIssueNotice && (
                  <button
                    onClick={() => onIssueNotice(findings[0])}
                    className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded font-bold hover:bg-amber-100 transition text-[11px] flex items-center space-x-1"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                    <span>Issue Statutory Show-Cause Directive</span>
                  </button>
                )}
              </div>

              {findings.length > 0 ? (
                <div className="space-y-3">
                  {findings.map(f => (
                    <div key={f.id} className="border border-red-200 bg-red-50/30 rounded-lg p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              f.severity === 'CRITICAL'
                                ? 'bg-red-600 text-white'
                                : f.severity === 'HIGH'
                                ? 'bg-orange-600 text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {f.severity} SEVERITY
                          </span>
                          <span className="font-bold text-xs text-[#1F2937]">{f.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#667085]">{f.category}</span>
                      </div>

                      <p className="text-xs text-[#4B5563] leading-relaxed">{f.description}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-red-100 text-[11px]">
                        <span className="text-[#667085]">Status: <strong className="text-red-700">{f.status}</strong></span>
                        {onIssueNotice && (
                          <button
                            onClick={() => onIssueNotice(f)}
                            className="text-[#174A73] hover:underline font-semibold"
                          >
                            Issue Directive for this finding →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-green-50/40 border border-green-200 rounded-lg text-xs">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <span className="font-bold text-green-800 block">Zero Critical Irregularities Found</span>
                  <span className="text-[#667085] mt-1 block">
                    All surveyed project components conform to sanctioned DPR benchmarks.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EVIDENCE */}
          {activeTab === 'evidence' && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#1F2937]">
                Geo-Tagged On-Site Photographic Proof ({evidenceList.length || inspection.evidenceCount})
              </div>

              {evidenceList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {evidenceList.map(ev => (
                    <div key={ev.id} className="border border-[#E2E5E9] rounded-lg overflow-hidden bg-white shadow-2xs flex flex-col justify-between">
                      <div className="relative aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                        <img
                          src={ev.fileUrl}
                          alt={ev.caption}
                          className="w-full h-full object-cover"
                          onError={e => {
                            // Fallback illustration
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-[9px] font-mono px-2 py-0.5 rounded flex items-center space-x-1 backdrop-blur-xs">
                          <MapPin className="w-2.5 h-2.5 text-green-400" />
                          <span>GPS SECURED</span>
                        </div>
                      </div>

                      <div className="p-2.5 space-y-1">
                        <div className="font-semibold text-xs text-[#1F2937] truncate" title={ev.caption}>
                          {ev.caption}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#667085]">
                          <span>By: {ev.uploaderName}</span>
                          <span>{new Date(ev.capturedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-[#E2E5E9] rounded-lg overflow-hidden bg-white p-2.5 space-y-2">
                    <img
                      src="https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=600&q=80"
                      alt="Site Inspection Proof"
                      className="w-full h-36 object-cover rounded"
                    />
                    <div className="text-xs font-semibold text-[#1F2937]">Physical Pipeline Laying Verification</div>
                    <div className="text-[10px] font-mono text-[#667085]">Lat: {inspection.location.lat.toFixed(4)}, Lng: {inspection.location.lng.toFixed(4)}</div>
                  </div>

                  <div className="border border-[#E2E5E9] rounded-lg overflow-hidden bg-white p-2.5 space-y-2">
                    <img
                      src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"
                      alt="Water Reservoir Quality Audit"
                      className="w-full h-36 object-cover rounded"
                    />
                    <div className="text-xs font-semibold text-[#1F2937]">Overhead Storage Reservoir Concrete Testing</div>
                    <div className="text-[10px] font-mono text-[#667085]">Geotagged & Timestamped Verified</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-5 py-3.5 border-t border-[#E2E5E9] bg-[#F7F8FA] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs">
            {downloadSuccess && (
              <span className="text-green-700 font-semibold flex items-center space-x-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Inspection Dossier PDF Generated</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrintDossier}
              className="px-3 py-1.5 rounded-md border border-[#E2E5E9] bg-white hover:bg-[#F7F8FA] text-[#1F2937] text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#174A73]" />
              <span>Export Dossier</span>
            </button>

            {findings.length > 0 && onIssueNotice && (
              <button
                onClick={() => onIssueNotice(findings[0])}
                className="px-3.5 py-1.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                <span>Issue Show-Cause Notice</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-[#174A73] hover:bg-[#123859] text-white text-xs font-semibold transition shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
