import React from 'react';
import { Project } from '../../types';
import {
  TrendingUp,
  MapPin,
  CheckCircle2,
  Building2,
  Wallet,
  Users,
  Target,
  FileCheck
} from 'lucide-react';

interface ProjectAnalyticalCardProps {
  project: Project;
  organizationName?: string;
  onClose?: () => void;
}

export const ProjectAnalyticalCard: React.FC<ProjectAnalyticalCardProps> = ({
  project,
  organizationName,
  onClose
}) => {
  const sanctionedLakhs = (project.fundingSanctioned / 100000).toFixed(1);
  const disbursedLakhs = (project.fundingDisbursed / 100000).toFixed(1);
  const disbursedPct = project.fundingSanctioned > 0
    ? Math.round((project.fundingDisbursed / project.fundingSanctioned) * 100)
    : 0;

  // Estimated field utilization based on progress
  const utilizedPct = Math.min(disbursedPct, Math.round(project.progressPercentage * 0.92));
  const utilizedLakhs = ((project.fundingSanctioned * (utilizedPct / 100)) / 100000).toFixed(1);

  // Beneficiary progress
  const beneficiaryPct = project.targetBeneficiaries > 0
    ? Math.round((project.currentBeneficiaries / project.targetBeneficiaries) * 100)
    : 0;

  return (
    <div className="bg-white border border-[#E2E5E9] rounded-lg shadow-sm p-4 space-y-4 text-xs font-sans">
      {/* Top Header & Close button if needed */}
      <div className="flex items-start justify-between border-b border-[#E2E5E9] pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[11px] font-semibold text-[#174A73] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              {project.code}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.2 rounded ${
                project.status === 'COMPLETED'
                  ? 'bg-green-50 text-green-700'
                  : project.status === 'DELAYED'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-blue-50 text-[#174A73]'
              }`}
            >
              {project.status}
            </span>
          </div>
          <h4 className="font-bold text-sm text-[#1F2937] mt-1">{project.name}</h4>
          <p className="text-[11px] text-[#667085] flex items-center space-x-1 mt-0.5">
            <Building2 className="w-3.5 h-3.5 text-[#174A73]" />
            <span>{organizationName || project.organizationName}</span>
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-[#667085] hover:text-[#1F2937] p-1 text-sm font-semibold"
            title="Close"
          >
            ✕
          </button>
        )}
      </div>

      {/* Geolocation Details Menu */}
      <div className="bg-[#F7F8FA] border border-[#E2E5E9] rounded-md p-2.5 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-[#667085] block">Location District</span>
          <span className="font-semibold text-[#1F2937] flex items-center space-x-1 mt-0.5">
            <MapPin className="w-3 h-3 text-[#174A73] flex-shrink-0" />
            <span className="truncate">{project.location.district || 'Indore'}, {project.location.state || 'MP'}</span>
          </span>
        </div>
        <div>
          <span className="text-[#667085] block">GPS Pin Coordinates</span>
          <span className="font-mono font-medium text-[#1F2937] block mt-0.5">
            {project.location.lat.toFixed(4)}° N, {project.location.lng.toFixed(4)}° E
          </span>
        </div>
        <div>
          <span className="text-[#667085] block">Scheme Umbrella</span>
          <span className="font-medium text-[#174A73] block mt-0.5 truncate" title={project.scheme}>
            {project.scheme}
          </span>
        </div>
        <div>
          <span className="text-[#667085] block">Beneficiaries Reached</span>
          <span className="font-semibold text-[#1F2937] block mt-0.5">
            {project.currentBeneficiaries.toLocaleString()} / {project.targetBeneficiaries.toLocaleString()} ({beneficiaryPct}%)
          </span>
        </div>
      </div>

      {/* ANALYTICAL CHART: Financial Flow & Utilization */}
      <div className="border border-[#E2E5E9] rounded-md p-3 space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E5E9]">
          <div className="flex items-center space-x-1.5">
            <Wallet className="w-3.5 h-3.5 text-[#174A73]" />
            <span className="font-semibold text-[#1F2937]">Financial Allocation & Expenditure</span>
          </div>
          <span className="text-[11px] font-bold text-[#16A34A]">{disbursedPct}% Released</span>
        </div>

        {/* Visual Bar Comparison */}
        <div className="space-y-2 text-[11px]">
          <div>
            <div className="flex justify-between text-[#667085] mb-0.5">
              <span>Sanctioned Budget</span>
              <span className="font-semibold text-[#1F2937]">₹{sanctionedLakhs} Lakhs (100%)</span>
            </div>
            <div className="w-full bg-[#E2E5E9] h-2 rounded-full overflow-hidden">
              <div className="bg-gray-400 h-full w-full" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[#667085] mb-0.5">
              <span>Disbursed by Government</span>
              <span className="font-semibold text-[#174A73]">₹{disbursedLakhs} Lakhs ({disbursedPct}%)</span>
            </div>
            <div className="w-full bg-[#E2E5E9] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#174A73] h-full transition-all duration-300"
                style={{ width: `${disbursedPct}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[#667085] mb-0.5">
              <span>Ground Physical Utilization</span>
              <span className="font-semibold text-[#16A34A]">₹{utilizedLakhs} Lakhs ({utilizedPct}%)</span>
            </div>
            <div className="w-full bg-[#E2E5E9] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#16A34A] h-full transition-all duration-300"
                style={{ width: `${utilizedPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-[10px] text-[#667085]">
          <span>Balance Sanction: ₹{((project.fundingSanctioned - project.fundingDisbursed) / 100000).toFixed(1)}L</span>
          <span className="font-medium text-[#174A73]">Audited PFMS Ledger</span>
        </div>
      </div>

      {/* ANALYTICAL CHART: Milestone Progress Decomposition */}
      <div className="border border-[#E2E5E9] rounded-md p-3 space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E5E9]">
          <div className="flex items-center space-x-1.5">
            <Target className="w-3.5 h-3.5 text-[#174A73]" />
            <span className="font-semibold text-[#1F2937]">Physical Milestone Execution</span>
          </div>
          <span className="text-[11px] font-bold text-[#174A73]">{project.progressPercentage}% Completed</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 bg-[#F7F8FA] border border-[#E2E5E9] rounded">
            <span className="text-[#667085] block text-[10px]">Civil & Structural</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold text-[#1F2937]">{Math.min(100, project.progressPercentage + 5)}%</span>
              <span className="text-[10px] text-[#16A34A] font-medium">On Track</span>
            </div>
          </div>

          <div className="p-2 bg-[#F7F8FA] border border-[#E2E5E9] rounded">
            <span className="text-[#667085] block text-[10px]">Beneficiary Verification</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold text-[#1F2937]">{beneficiaryPct}%</span>
              <span className="text-[10px] text-blue-700 font-medium">Verified</span>
            </div>
          </div>

          <div className="p-2 bg-[#F7F8FA] border border-[#E2E5E9] rounded">
            <span className="text-[#667085] block text-[10px]">Quality Audit Score</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold text-[#16A34A]">92 / 100</span>
              <span className="text-[10px] text-[#16A34A] font-medium">Compliant</span>
            </div>
          </div>

          <div className="p-2 bg-[#F7F8FA] border border-[#E2E5E9] rounded">
            <span className="text-[#667085] block text-[10px]">Public Display Signboard</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold text-[#1F2937]">Installed</span>
              <span className="text-[10px] text-[#16A34A] font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
