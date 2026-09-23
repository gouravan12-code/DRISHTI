import React from 'react';
import { Project } from '../../types';
import { DrishtiMap, MapMarkerItem } from '../../maps/DrishtiMap';
import {
  X,
  MapPin,
  Building2,
  FolderKanban,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Compass,
  Layers,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface ProjectLocationModalProps {
  project: Project;
  onClose: () => void;
  onOrderAudit?: (project: Project) => void;
}

export const ProjectLocationModal: React.FC<ProjectLocationModalProps> = ({
  project,
  onClose,
  onOrderAudit
}) => {
  const mapMarker: MapMarkerItem = {
    id: project.id,
    category: 'PROJECT',
    title: project.name,
    subtitle: `${project.scheme} • ${project.organizationName}`,
    lat: project.location.lat,
    lng: project.location.lng,
    statusText: project.status,
    riskLevel: 'LOW',
    metadata: {
      'Project Code': project.code,
      'Sanction Outlay': `₹${(project.fundingSanctioned / 100000).toFixed(1)} Lakhs`,
      'Physical Progress': `${project.progressPercentage}%`,
      'District': project.location.district || 'Indore',
      'Geofence Radius': '250 meters'
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E5E9] rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col text-[#1F2937] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E5E9] bg-white flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#174A73] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                {project.code}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                <span>GEOFENCE ACTIVE (250m)</span>
              </span>
              <span className="text-[11px] font-semibold text-[#667085]">
                {project.scheme}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F2937] mt-1.5">
              {project.name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 text-xs text-[#667085] mt-1">
              <span className="flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5 text-[#174A73]" />
                <span className="font-medium text-[#1F2937]">{project.organizationName}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-[#174A73]" />
                <span>{project.location.address || `${project.location.district}, ${project.location.state}`}</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#667085] hover:text-[#1F2937] hover:bg-[#F7F8FA] transition flex-shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Map Preview */}
          <div className="rounded-lg overflow-hidden border border-[#E2E5E9] shadow-inner">
            <DrishtiMap
              markers={[mapMarker]}
              selectedMarkerId={project.id}
              className="w-full h-[320px]"
              title={`Project Site GIS Boundary • ${project.code}`}
            />
          </div>

          {/* Site Coordinates & Geofencing Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#F7F8FA] border border-[#E2E5E9] rounded-lg">
              <span className="text-[11px] text-[#667085] block font-medium flex items-center space-x-1">
                <Compass className="w-3.5 h-3.5 text-[#174A73]" />
                <span>GPS Centroid Coordinates</span>
              </span>
              <span className="font-mono font-bold text-[#1F2937] text-sm mt-1 block">
                {project.location.lat.toFixed(5)}° N
              </span>
              <span className="font-mono text-[#667085] text-xs">
                {project.location.lng.toFixed(5)}° E
              </span>
            </div>

            <div className="p-3 bg-[#F7F8FA] border border-[#E2E5E9] rounded-lg">
              <span className="text-[11px] text-[#667085] block font-medium flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                <span>Geofence Enforcement</span>
              </span>
              <span className="font-bold text-green-700 text-sm mt-1 block">
                Radius: 250 Meters
              </span>
              <span className="text-[#667085] text-[11px]">
                Enforced for all mobile app check-ins
              </span>
            </div>

            <div className="p-3 bg-[#F7F8FA] border border-[#E2E5E9] rounded-lg">
              <span className="text-[11px] text-[#667085] block font-medium flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-[#174A73]" />
                <span>Administrative Jurisdiction</span>
              </span>
              <span className="font-bold text-[#1F2937] text-sm mt-1 block">
                {project.location.district || 'District HQ'}
              </span>
              <span className="text-[#667085] text-[11px]">
                {project.location.state || 'Madhya Pradesh'}, India
              </span>
            </div>
          </div>

          {/* Project Progress & Financial Outlay */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white border border-[#E2E5E9] rounded-lg p-3 text-xs">
            <div>
              <span className="text-[#667085] block text-[11px]">Sanctioned Funding</span>
              <span className="font-bold text-[#1F2937] text-sm mt-0.5 block">
                ₹{(project.fundingSanctioned / 100000).toFixed(2)} Lakhs
              </span>
            </div>
            <div>
              <span className="text-[#667085] block text-[11px]">Disbursed to Date</span>
              <span className="font-bold text-[#16A34A] text-sm mt-0.5 block">
                ₹{(project.fundingDisbursed / 100000).toFixed(2)} Lakhs
              </span>
            </div>
            <div>
              <span className="text-[#667085] block text-[11px]">Physical Progress</span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="font-bold text-[#174A73]">{project.progressPercentage}%</span>
                <div className="w-16 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#174A73]"
                    style={{ width: `${project.progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div>
              <span className="text-[#667085] block text-[11px]">Target Beneficiaries</span>
              <span className="font-bold text-[#1F2937] text-sm mt-0.5 block">
                {(project.targetBeneficiaries || 1000).toLocaleString()} Citizens
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[#E2E5E9] bg-[#F7F8FA] flex items-center justify-between">
          <span className="text-xs text-[#667085]">
            Physical site verified via Satellite GIS & NITI Aayog portal
          </span>
          <div className="flex items-center space-x-2">
            {onOrderAudit && (
              <button
                onClick={() => {
                  onClose();
                  onOrderAudit(project);
                }}
                className="px-3.5 py-1.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs"
              >
                <span>Dispatch Surprise Field Audit</span>
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
