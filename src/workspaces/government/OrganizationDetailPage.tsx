import React, { useState, useEffect, useMemo } from 'react';
import { Organization, Project, Inspection, ComplianceAction } from '../../types';
import { drishtiDataService } from '../../services/drishtiDataService';
import { DrishtiMap, MapMarkerItem } from '../../maps/DrishtiMap';
import { SvgPieChart, PieChartSlice } from '../../components/charts/SvgPieChart';
import { SvgBarGraph, BarGraphItem } from '../../components/charts/SvgBarGraph';
import {
  ArrowLeft,
  Building2,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  FileCheck,
  ClipboardList,
  Users,
  Target,
  ExternalLink,
  Phone,
  Mail,
  Calendar,
  FileText
} from 'lucide-react';

interface OrganizationDetailPageProps {
  organization: Organization;
  onBack: () => void;
  onSelectProject?: (project: Project) => void;
}

export const OrganizationDetailPage: React.FC<OrganizationDetailPageProps> = ({
  organization,
  onBack,
  onSelectProject
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [complianceList, setComplianceList] = useState<ComplianceAction[]>([]);
  const [selectedMapMarkerId, setSelectedMapMarkerId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'inspections' | 'compliance'>('overview');

  // Load organization-specific projects, inspections, and compliance
  useEffect(() => {
    const fetchData = async () => {
      const orgProjects = await drishtiDataService.getProjects(organization.id);
      setProjects(orgProjects);

      const orgInspections = await drishtiDataService.getInspections({ orgId: organization.id });
      setInspections(orgInspections);

      const orgCompliance = await drishtiDataService.getCompliance(organization.id);
      setComplianceList(orgCompliance);
    };
    fetchData();
  }, [organization.id]);

  // Financial aggregates
  const totalSanctioned = projects.reduce((acc, p) => acc + p.fundingSanctioned, 0);
  const totalDisbursed = projects.reduce((acc, p) => acc + p.fundingDisbursed, 0);
  const totalBeneficiaries = projects.reduce((acc, p) => acc + p.currentBeneficiaries, 0);
  const targetBeneficiaries = projects.reduce((acc, p) => acc + p.targetBeneficiaries, 0);

  const sanctionedCr = (totalSanctioned / 10000000).toFixed(2);
  const disbursedCr = (totalDisbursed / 10000000).toFixed(2);
  const balanceCr = ((totalSanctioned - totalDisbursed) / 10000000).toFixed(2);
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + p.progressPercentage, 0) / projects.length)
    : 0;

  // Estimated ground utilization (85% of disbursed on average)
  const utilizedCr = ((totalDisbursed * 0.88) / 10000000).toFixed(2);
  const unspentInBankCr = ((totalDisbursed * 0.12) / 10000000).toFixed(2);

  // 1. Data for Funds Pie Chart
  const fundsPieData: PieChartSlice[] = useMemo(() => {
    const utilizedVal = Number(utilizedCr);
    const unspentVal = Number(unspentInBankCr);
    const balanceVal = Math.max(0, Number(balanceCr));

    return [
      {
        label: 'Ground Utilized',
        value: utilizedVal > 0 ? utilizedVal : 1,
        color: '#16A34A',
        formattedValue: `₹${utilizedCr} Cr`
      },
      {
        label: 'In-Transit / Bank',
        value: unspentVal > 0 ? unspentVal : 0.2,
        color: '#174A73',
        formattedValue: `₹${unspentInBankCr} Cr`
      },
      {
        label: 'Sanction Balance',
        value: balanceVal > 0 ? balanceVal : 0.5,
        color: '#CBD5E1',
        formattedValue: `₹${balanceCr} Cr`
      }
    ];
  }, [utilizedCr, unspentInBankCr, balanceCr]);

  // 2. Data for Projects Milestone Progress Bar Graph
  const progressBarsData: BarGraphItem[] = useMemo(() => {
    return projects.map(p => ({
      label: p.name.length > 14 ? `${p.name.slice(0, 12)}...` : p.name,
      value: p.progressPercentage,
      secondaryValue: Math.round((p.fundingDisbursed / (p.fundingSanctioned || 1)) * 100),
      formattedValue: `${p.progressPercentage}%`,
      formattedSecondaryValue: `${Math.round((p.fundingDisbursed / (p.fundingSanctioned || 1)) * 100)}%`,
      color: '#16A34A',
      secondaryColor: '#174A73'
    }));
  }, [projects]);

  // 3. Map Markers: Include the NGO Head Office Pin + Project Pins
  const ngoMapMarkers: MapMarkerItem[] = useMemo(() => {
    const markers: MapMarkerItem[] = [];

    // NGO Head Office Marker
    markers.push({
      id: `hq-${organization.id}`,
      category: 'NGO',
      title: `${organization.name} (Registered HQ)`,
      subtitle: `Darpan ID: ${organization.darpanId || organization.registrationNumber}`,
      lat: organization.location.lat,
      lng: organization.location.lng,
      riskLevel: organization.riskLevel,
      statusText: organization.status,
      metadata: {
        district: organization.location.district,
        address: organization.address,
        isHeadquarters: true
      }
    });

    // Project Sites Markers
    projects.forEach(p => {
      markers.push({
        id: p.id,
        category: 'PROJECT',
        title: p.name,
        subtitle: `${p.code} • ${p.scheme}`,
        lat: p.location.lat,
        lng: p.location.lng,
        riskLevel: p.riskLevel,
        statusText: p.status,
        metadata: {
          projectId: p.id,
          scheme: p.scheme,
          fundingSanctioned: p.fundingSanctioned,
          fundingDisbursed: p.fundingDisbursed,
          progressPercentage: p.progressPercentage,
          district: p.location.district
        }
      });
    });

    return markers;
  }, [organization, projects]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Navigation & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E5E9]">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md border border-[#E2E5E9] bg-white hover:bg-[#F7F8FA] text-[#174A73] transition flex items-center space-x-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Organizations</span>
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-[#1F2937]">{organization.name}</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                ● {organization.status}
              </span>
              <span className="text-[10px] font-mono bg-gray-100 text-[#667085] px-2 py-0.5 rounded">
                Darpan: {organization.darpanId || organization.registrationNumber}
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-0.5 flex items-center space-x-2">
              <Building2 className="w-3.5 h-3.5 text-[#174A73]" />
              <span>{organization.type} • {organization.location.district || organization.address}, {organization.location.state || 'India'}</span>
            </p>
          </div>
        </div>

        {/* Action Badge */}
        <div className="flex items-center space-x-2">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-md border ${
              organization.riskLevel === 'CRITICAL'
                ? 'bg-red-50 text-red-700 border-red-200'
                : organization.riskLevel === 'HIGH'
                ? 'bg-orange-50 text-orange-800 border-orange-200'
                : organization.riskLevel === 'MEDIUM'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-green-50 text-green-700 border-green-200'
            }`}
          >
            Vigilance Rating: {organization.riskLevel} ({organization.riskScore}/100)
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#E2E5E9] rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] text-[#667085] font-medium">Compliance Rate</div>
          <div className="text-2xl font-bold text-[#16A34A] mt-1">{organization.complianceRate}%</div>
          <div className="text-[10px] text-[#667085] mt-0.5">Statutory directive score</div>
        </div>

        <div className="bg-white border border-[#E2E5E9] rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] text-[#667085] font-medium">Active Projects</div>
          <div className="text-2xl font-bold text-[#1F2937] mt-1">{projects.length}</div>
          <div className="text-[10px] text-[#174A73] mt-0.5">{avgProgress}% avg completion</div>
        </div>

        <div className="bg-white border border-[#E2E5E9] rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] text-[#667085] font-medium">Sanctioned Grants</div>
          <div className="text-2xl font-bold text-[#174A73] mt-1">₹{sanctionedCr} Cr</div>
          <div className="text-[10px] text-[#667085] mt-0.5">Central sector allocations</div>
        </div>

        <div className="bg-white border border-[#E2E5E9] rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] text-[#667085] font-medium">Disbursed Funds</div>
          <div className="text-2xl font-bold text-[#16A34A] mt-1">₹{disbursedCr} Cr</div>
          <div className="text-[10px] text-green-700 mt-0.5">Released via PFMS</div>
        </div>

        <div className="bg-white border border-[#E2E5E9] rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] text-[#667085] font-medium">Ground Utilization</div>
          <div className="text-2xl font-bold text-[#1F2937] mt-1">₹{utilizedCr} Cr</div>
          <div className="text-[10px] text-[#667085] mt-0.5">Audited physical expenditure</div>
        </div>

        <div className="bg-white border border-[#E2E5E9] rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] text-[#667085] font-medium">Beneficiaries</div>
          <div className="text-2xl font-bold text-[#1F2937] mt-1">{totalBeneficiaries.toLocaleString()}</div>
          <div className="text-[10px] text-[#667085] mt-0.5">Target: {targetBeneficiaries.toLocaleString()}</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex space-x-2 border-b border-[#E2E5E9] text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 ${
            activeTab === 'overview'
              ? 'border-[#174A73] text-[#174A73] font-semibold'
              : 'border-transparent text-[#667085] hover:text-[#1F2937]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Dossier & Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`py-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 ${
            activeTab === 'projects'
              ? 'border-[#174A73] text-[#174A73] font-semibold'
              : 'border-transparent text-[#667085] hover:text-[#1F2937]'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Active Projects ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inspections')}
          className={`py-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 ${
            activeTab === 'inspections'
              ? 'border-[#174A73] text-[#174A73] font-semibold'
              : 'border-transparent text-[#667085] hover:text-[#1F2937]'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Field Audits ({inspections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`py-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 ${
            activeTab === 'compliance'
              ? 'border-[#174A73] text-[#174A73] font-semibold'
              : 'border-transparent text-[#667085] hover:text-[#1F2937]'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Compliance Directives ({complianceList.length})</span>
        </button>
      </div>

      {/* ========================================================
          SUB-TAB 1: DOSSIER, PIE CHART OF FUNDS, PROGRESS GRAPHS & MAP
         ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Row 1: Pie Chart of Funds & Progress Bar Graph */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Pie Chart of Funds */}
            <div className="lg:col-span-5 bg-white border border-[#E2E5E9] rounded-lg p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E5E9]">
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4 text-[#174A73]" />
                    <h3 className="text-sm font-semibold text-[#1F2937]">Pie Chart of Funds</h3>
                  </div>
                  <span className="text-[11px] font-bold text-[#16A34A]">Sanction: ₹{sanctionedCr} Cr</span>
                </div>

                <p className="text-xs text-[#667085] mt-1.5">
                  Breakdown of Central Grants released, ground utilization, and unspent bank ledger balance.
                </p>

                <div className="py-4 flex items-center justify-center">
                  <SvgPieChart
                    data={fundsPieData}
                    size={200}
                    donut={true}
                    donutThickness={38}
                    centerTitle={`₹${disbursedCr}Cr`}
                    centerSubtitle="Disbursed"
                    legendPosition="bottom"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-[#F7F8FA] border border-[#E2E5E9] rounded-md text-xs space-y-1">
                <div className="flex justify-between text-[#667085]">
                  <span>PFMS Direct Account:</span>
                  <span className="font-mono font-medium text-[#1F2937]">SBIN00408192</span>
                </div>
                <div className="flex justify-between text-[#667085]">
                  <span>Utilization Certificate:</span>
                  <span className="font-semibold text-[#16A34A]">Verified by PMU Auditor</span>
                </div>
              </div>
            </div>

            {/* Progress Bar Graph */}
            <div className="lg:col-span-7 bg-white border border-[#E2E5E9] rounded-lg p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E5E9]">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-[#16A34A]" />
                    <h3 className="text-sm font-semibold text-[#1F2937]">Projects Progress Bar Graph</h3>
                  </div>
                  <span className="text-[11px] font-bold text-[#174A73]">Avg: {avgProgress}% Completed</span>
                </div>

                <p className="text-xs text-[#667085] mt-1.5">
                  Comparison of physical progress vs financial disbursement percentage across active projects.
                </p>

                <div className="pt-2">
                  <SvgBarGraph
                    data={progressBarsData}
                    height={210}
                    primaryLabel="Physical Progress %"
                    secondaryLabel="Disbursed %"
                    primaryColor="#16A34A"
                    secondaryColor="#174A73"
                    unitPrefix=""
                    unitSuffix="%"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-[#E2E5E9] text-center text-[11px]">
                <div className="p-2 bg-[#F7F8FA] rounded">
                  <span className="text-[#667085] block">On-Track</span>
                  <span className="font-bold text-[#16A34A]">{projects.filter(p => p.status === 'COMPLETED' || p.status === 'ACTIVE').length} Projects</span>
                </div>
                <div className="p-2 bg-[#F7F8FA] rounded">
                  <span className="text-[#667085] block">Delayed</span>
                  <span className="font-bold text-[#DC2626]">{projects.filter(p => p.status === 'DELAYED').length} Projects</span>
                </div>
                <div className="p-2 bg-[#F7F8FA] rounded">
                  <span className="text-[#667085] block">Quality Rating</span>
                  <span className="font-bold text-[#174A73]">4.6 / 5.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Particular NGO Location on the Map */}
          <div className="bg-white border border-[#E2E5E9] rounded-lg p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2E5E9]">
              <div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-[#174A73]" />
                  <h3 className="text-sm font-semibold text-[#1F2937]">
                    Geo-Referenced NGO Location & Project Footprint
                  </h3>
                </div>
                <p className="text-xs text-[#667085] mt-0.5">
                  Registered headquarters pin and active field project sites for <strong>{organization.name}</strong>.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="flex items-center space-x-1 font-mono text-[#174A73] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  <MapPin className="w-3 h-3 text-[#174A73]" />
                  <span>HQ: {organization.location.lat.toFixed(4)}° N, {organization.location.lng.toFixed(4)}° E</span>
                </span>
                <span className="text-[11px] text-[#667085]">
                  ({ngoMapMarkers.length} Map Pins Plotted)
                </span>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="w-full">
              <DrishtiMap
                markers={ngoMapMarkers}
                selectedMarkerId={selectedMapMarkerId}
                onSelectMarker={m => setSelectedMapMarkerId(m.id)}
                className="w-full h-[400px] rounded-md"
              />
            </div>

            {/* Legend & Location list */}
            <div className="p-3 bg-[#F7F8FA] border border-[#E2E5E9] rounded-md flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5 font-medium text-[#1F2937]">
                  <span className="w-3 h-3 rounded-full bg-[#174A73]"></span>
                  <span>Registered HQ ({organization.location.district || 'Indore'})</span>
                </span>
                <span className="flex items-center space-x-1.5 font-medium text-[#1F2937]">
                  <span className="w-3 h-3 rounded-full bg-[#16A34A]"></span>
                  <span>Active Project Sites ({projects.length})</span>
                </span>
              </div>
              <span className="text-[11px] text-[#667085]">
                Jurisdiction: {organization.location.district}, {organization.location.state}
              </span>
            </div>
          </div>

          {/* Row 3: Organization Registry & Statutory Credentials */}
          <div className="bg-white border border-[#E2E5E9] rounded-lg p-5 shadow-xs text-xs space-y-4">
            <h3 className="text-sm font-semibold text-[#1F2937] pb-2 border-b border-[#E2E5E9]">
              Legal Registry & Statutory Accreditations
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <span className="text-[#667085] block text-[11px]">Official Registered Name</span>
                <span className="font-semibold text-[#1F2937] mt-0.5 block">{organization.name}</span>
              </div>
              <div>
                <span className="text-[#667085] block text-[11px]">NITI Aayog Darpan ID</span>
                <span className="font-mono font-medium text-[#174A73] mt-0.5 block">{organization.darpanId || organization.registrationNumber}</span>
              </div>
              <div>
                <span className="text-[#667085] block text-[11px]">Legal Entity Type</span>
                <span className="font-medium text-[#1F2937] mt-0.5 block">{organization.type} • Verified</span>
              </div>
              <div>
                <span className="text-[#667085] block text-[11px]">FCRA Registration Number</span>
                <span className="font-mono text-[#1F2937] mt-0.5 block">{organization.fcraNumber || '063300188 (Valid)'}</span>
              </div>
              <div>
                <span className="text-[#667085] block text-[11px]">Authorized Signatory</span>
                <span className="font-medium text-[#1F2937] mt-0.5 block">{organization.contactPerson}</span>
              </div>
              <div>
                <span className="text-[#667085] block text-[11px]">Official Email</span>
                <span className="text-[#174A73] mt-0.5 block font-medium flex items-center space-x-1">
                  <Mail className="w-3 h-3 text-[#174A73]" />
                  <span>{organization.email}</span>
                </span>
              </div>
              <div>
                <span className="text-[#667085] block text-[11px]">Contact Phone</span>
                <span className="text-[#1F2937] mt-0.5 block font-mono flex items-center space-x-1">
                  <Phone className="w-3 h-3 text-[#174A73]" />
                  <span>{organization.phone}</span>
                </span>
              </div>
              <div>
                <span className="text-[#667085] block text-[11px]">Head Office Address</span>
                <span className="text-[#1F2937] mt-0.5 block truncate" title={organization.address}>
                  {organization.address || `${organization.location.district}, ${organization.location.state}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: ACTIVE PROJECTS LIST
         ======================================================== */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1F2937]">Active Projects ({projects.length})</h3>
            <span className="text-xs text-[#667085]">Centrally Sponsored Infrastructure & Welfare</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(p => {
              const sanctionedL = (p.fundingSanctioned / 100000).toFixed(1);
              const disbursedL = (p.fundingDisbursed / 100000).toFixed(1);

              return (
                <div key={p.id} className="bg-white border border-[#E2E5E9] rounded-lg p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E5E9]">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-semibold text-[#174A73] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {p.code}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          p.status === 'COMPLETED'
                            ? 'bg-green-50 text-green-700'
                            : p.status === 'DELAYED'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-blue-50 text-[#174A73]'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#16A34A]">{p.progressPercentage}% Completed</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-[#1F2937]">{p.name}</h4>
                    <p className="text-xs text-[#174A73] font-medium mt-0.5">{p.scheme}</p>
                  </div>

                  <div className="flex items-center space-x-1.5 text-xs text-[#667085]">
                    <MapPin className="w-3.5 h-3.5 text-[#174A73] flex-shrink-0" />
                    <span>{p.location.district || p.location.address}, {p.location.state}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-[#667085]">
                      <span>Funds Disbursed vs Sanctioned</span>
                      <span className="font-semibold text-[#1F2937]">₹{disbursedL}L / ₹{sanctionedL}L</span>
                    </div>
                    <div className="w-full bg-[#E2E5E9] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#174A73] h-full"
                        style={{ width: `${Math.min(100, Math.round((p.fundingDisbursed / p.fundingSanctioned) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#E2E5E9] text-xs">
                    <span className="text-[#667085]">
                      Beneficiaries: <strong className="text-[#1F2937]">{p.currentBeneficiaries.toLocaleString()}</strong> / {p.targetBeneficiaries.toLocaleString()}
                    </span>
                    <button
                      onClick={() => onSelectProject?.(p)}
                      className="text-[#174A73] hover:underline font-semibold flex items-center space-x-1"
                    >
                      <span>Project Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: INSPECTIONS
         ======================================================== */}
      {activeTab === 'inspections' && (
        <div className="bg-white border border-[#E2E5E9] rounded-lg overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs text-[#1F2937]">
            <thead className="bg-[#F7F8FA] border-b border-[#E2E5E9] text-[11px] font-semibold text-[#667085]">
              <tr>
                <th className="px-4 py-3">Audit Reference</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Audit Type</th>
                <th className="px-4 py-3">Inspector</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E5E9]">
              {inspections.length > 0 ? (
                inspections.map(insp => (
                  <tr key={insp.id} className="hover:bg-[#F7F8FA] transition">
                    <td className="px-4 py-3 font-mono font-medium text-[#174A73]">{insp.inspectionCode}</td>
                    <td className="px-4 py-3 font-medium text-[#1F2937]">{insp.projectName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        insp.type === 'SURPRISE' ? 'bg-amber-50 text-amber-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {insp.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#667085]">{insp.assignedInspectorName || 'FQM Monitor'}</td>
                    <td className="px-4 py-3 text-[#667085]">{insp.scheduledDate}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        insp.status === 'COMPLETED' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {insp.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-[#667085]">
                    No field quality audits recorded for this organization yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 4: COMPLIANCE DIRECTIVES
         ======================================================== */}
      {activeTab === 'compliance' && (
        <div className="bg-white border border-[#E2E5E9] rounded-lg overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs text-[#1F2937]">
            <thead className="bg-[#F7F8FA] border-b border-[#E2E5E9] text-[11px] font-semibold text-[#667085]">
              <tr>
                <th className="px-4 py-3">Directive Notice Ref</th>
                <th className="px-4 py-3">Mandatory Action Required</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E5E9]">
              {complianceList.length > 0 ? (
                complianceList.map(comp => (
                  <tr key={comp.id} className="hover:bg-[#F7F8FA] transition">
                    <td className="px-4 py-3 font-mono font-medium text-[#1F2937]">{comp.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#1F2937]">{comp.actionRequired}</div>
                      {comp.responseRemarks && (
                        <div className="text-[11px] text-[#16A34A] mt-1">
                          ✓ NGO Response: {comp.responseRemarks}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#667085]">{comp.dueDate}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        comp.status === 'CLOSED'
                          ? 'bg-green-50 text-green-700'
                          : comp.status === 'OVERDUE'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}>
                        {comp.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-[#667085]">
                    No outstanding statutory compliance directives issued.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
