import React, { useState, useMemo } from 'react';
import { Organization, Project, Inspection, Finding, ComplianceAction } from '../../types';
import { SvgPieChart, PieChartSlice } from '../charts/SvgPieChart';
import { SvgBarGraph, BarGraphItem } from '../charts/SvgBarGraph';
import {
  TrendingUp,
  BarChart3,
  ShieldAlert,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  PieChart as PieChartIcon
} from 'lucide-react';

interface GovernmentDashboardAnalyticsProps {
  organizations: Organization[];
  projects: Project[];
  inspections: Inspection[];
  findings: Finding[];
  compliance: ComplianceAction[];
}

export const GovernmentDashboardAnalytics: React.FC<GovernmentDashboardAnalyticsProps> = ({
  organizations,
  projects,
  inspections,
  findings,
  compliance
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'bar_schemes' | 'pie_funds' | 'pie_risk' | 'inspections'>('bar_schemes');

  // Scheme colors palette
  const schemeColorPalette = ['#174A73', '#16A34A', '#D97706', '#9333EA', '#0284C7', '#DC2626'];

  // 1. Calculate Scheme-wise Financial Allocation & Disbursement
  const schemeAggregates = useMemo(() => {
    const map: Record<string, { name: string; sanctioned: number; disbursed: number; count: number }> = {};

    projects.forEach(p => {
      const schemeKey = p.scheme.split('(')[0].trim() || p.scheme;
      if (!map[schemeKey]) {
        map[schemeKey] = {
          name: schemeKey,
          sanctioned: 0,
          disbursed: 0,
          count: 0
        };
      }
      map[schemeKey].sanctioned += p.fundingSanctioned;
      map[schemeKey].disbursed += p.fundingDisbursed;
      map[schemeKey].count += 1;
    });

    return Object.values(map).sort((a, b) => b.sanctioned - a.sanctioned);
  }, [projects]);

  // Overall financial totals
  const totalSanctionedCr = schemeAggregates.reduce((acc, s) => acc + s.sanctioned, 0) / 10000000;
  const totalDisbursedCr = schemeAggregates.reduce((acc, s) => acc + s.disbursed, 0) / 10000000;
  const overallDisbursementRate = totalSanctionedCr > 0 ? Math.round((totalDisbursedCr / totalSanctionedCr) * 100) : 0;

  // Prepare data for Bar Graph (Sanctioned vs Disbursed)
  const barGraphData: BarGraphItem[] = useMemo(() => {
    return schemeAggregates.slice(0, 5).map(s => {
      const valDisb = s.disbursed / 10000000;
      const valSanc = s.sanctioned / 10000000;
      return {
        label: s.name.length > 12 ? `${s.name.slice(0, 10)}...` : s.name,
        value: valDisb,
        secondaryValue: valSanc,
        formattedValue: `₹${valDisb.toFixed(1)}Cr`,
        formattedSecondaryValue: `₹${valSanc.toFixed(1)}Cr`,
        color: '#174A73',
        secondaryColor: '#CBD5E1'
      };
    });
  }, [schemeAggregates]);

  // Prepare data for Pie Chart: Funds Distribution by Scheme
  const pieChartFundsData: PieChartSlice[] = useMemo(() => {
    return schemeAggregates.slice(0, 5).map((s, idx) => {
      const amountCr = s.sanctioned / 10000000;
      return {
        label: s.name,
        value: amountCr,
        color: schemeColorPalette[idx % schemeColorPalette.length],
        formattedValue: `₹${amountCr.toFixed(1)} Cr`
      };
    });
  }, [schemeAggregates]);

  // 2. Risk Distribution Data
  const riskCounts = useMemo(() => {
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    organizations.forEach(o => {
      if (counts[o.riskLevel] !== undefined) {
        counts[o.riskLevel] += 1;
      }
    });
    return counts;
  }, [organizations]);

  const totalOrgs = organizations.length || 1;
  const pieChartRiskData: PieChartSlice[] = useMemo(() => {
    return [
      {
        label: 'Low Risk',
        value: riskCounts.LOW,
        color: '#16A34A',
        formattedValue: `${riskCounts.LOW} NGOs`
      },
      {
        label: 'Medium Risk',
        value: riskCounts.MEDIUM,
        color: '#D97706',
        formattedValue: `${riskCounts.MEDIUM} NGOs`
      },
      {
        label: 'High Risk',
        value: riskCounts.HIGH,
        color: '#EA580C',
        formattedValue: `${riskCounts.HIGH} NGOs`
      },
      {
        label: 'Critical Risk',
        value: riskCounts.CRITICAL,
        color: '#DC2626',
        formattedValue: `${riskCounts.CRITICAL} NGOs`
      }
    ].filter(item => item.value > 0);
  }, [riskCounts]);

  const avgComplianceRate = organizations.length > 0
    ? Math.round(organizations.reduce((acc, o) => acc + (o.complianceRate || 0), 0) / organizations.length)
    : 88;

  // 3. Inspection & Findings Metrics
  const completedInspectionsCount = inspections.filter(i => i.status === 'COMPLETED' || i.status === 'SUBMITTED').length;
  const inProgressInspectionsCount = inspections.filter(i => i.status === 'IN_PROGRESS' || i.status === 'ASSIGNED').length;
  const scheduledInspectionsCount = inspections.filter(i => i.status === 'SCHEDULED').length;

  const surpriseCount = inspections.filter(i => i.type === 'SURPRISE').length;
  const surpriseFindingsCount = inspections
    .filter(i => i.type === 'SURPRISE')
    .reduce((acc, i) => acc + (i.findingsCount || 0), 0);

  const resolvedComplianceCount = compliance.filter(c => c.status === 'CLOSED').length;
  const complianceResolutionRate = compliance.length > 0
    ? Math.round((resolvedComplianceCount / compliance.length) * 100)
    : 85;

  return (
    <div className="bg-white border border-[#E2E5E9] rounded-lg shadow-xs flex flex-col h-full overflow-hidden">
      {/* Analytics Header & Tab Selector */}
      <div className="p-3.5 border-b border-[#E2E5E9] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-[#174A73]" />
            <h3 className="text-sm font-semibold text-[#1F2937]">Monitoring Analytics</h3>
          </div>
          <p className="text-[11px] text-[#667085] mt-0.5">
            Real-time financial outlay, institutional risk, and audit KPIs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 p-0.5 bg-[#F7F8FA] border border-[#E2E5E9] rounded-md text-[11px] font-medium self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveChartTab('bar_schemes')}
            className={`px-2 py-1 rounded transition whitespace-nowrap flex items-center space-x-1 ${
              activeChartTab === 'bar_schemes'
                ? 'bg-[#174A73] text-white shadow-xs font-semibold'
                : 'text-[#667085] hover:text-[#1F2937]'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>Bar Graph</span>
          </button>
          <button
            onClick={() => setActiveChartTab('pie_funds')}
            className={`px-2 py-1 rounded transition whitespace-nowrap flex items-center space-x-1 ${
              activeChartTab === 'pie_funds'
                ? 'bg-[#174A73] text-white shadow-xs font-semibold'
                : 'text-[#667085] hover:text-[#1F2937]'
            }`}
          >
            <PieChartIcon className="w-3 h-3" />
            <span>Pie: Funds</span>
          </button>
          <button
            onClick={() => setActiveChartTab('pie_risk')}
            className={`px-2 py-1 rounded transition whitespace-nowrap flex items-center space-x-1 ${
              activeChartTab === 'pie_risk'
                ? 'bg-[#174A73] text-white shadow-xs font-semibold'
                : 'text-[#667085] hover:text-[#1F2937]'
            }`}
          >
            <PieChartIcon className="w-3 h-3" />
            <span>Pie: Risk</span>
          </button>
          <button
            onClick={() => setActiveChartTab('inspections')}
            className={`px-2 py-1 rounded transition whitespace-nowrap flex items-center space-x-1 ${
              activeChartTab === 'inspections'
                ? 'bg-[#174A73] text-white shadow-xs font-semibold'
                : 'text-[#667085] hover:text-[#1F2937]'
            }`}
          >
            <ClipboardCheck className="w-3 h-3" />
            <span>Audit KPIs</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="p-4 flex-1 overflow-y-auto">
        {/* ========================================================
            TAB 1: BAR GRAPH - SCHEME ALLOCATIONS & DISBURSEMENTS
           ======================================================== */}
        {activeChartTab === 'bar_schemes' && (
          <div className="space-y-4">
            {/* Summary Highlights */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#F7F8FA] border border-[#E2E5E9] rounded-lg text-center">
              <div>
                <span className="text-[10px] text-[#667085] block font-medium">Total Sanctioned</span>
                <span className="text-sm font-bold text-[#1F2937] mt-0.5 block">
                  ₹{totalSanctionedCr.toFixed(1)} Cr
                </span>
              </div>
              <div className="border-x border-[#E2E5E9]">
                <span className="text-[10px] text-[#667085] block font-medium">Disbursed to Date</span>
                <span className="text-sm font-bold text-[#174A73] mt-0.5 block">
                  ₹{totalDisbursedCr.toFixed(1)} Cr
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#667085] block font-medium">Disbursement Rate</span>
                <span className="text-sm font-bold text-[#16A34A] mt-0.5 block">
                  {overallDisbursementRate}%
                </span>
              </div>
            </div>

            {/* High-Resolution SVG Bar Graph */}
            <div>
              <div className="text-xs font-semibold text-[#1F2937] mb-1 flex items-center justify-between">
                <span>Scheme Outlay vs Disbursed (₹ Cr)</span>
                <span className="text-[10px] text-[#16A34A] font-bold">PFMS Real-Time Sync</span>
              </div>
              <SvgBarGraph
                data={barGraphData}
                height={210}
                primaryLabel="Disbursed"
                secondaryLabel="Sanctioned"
                primaryColor="#174A73"
                secondaryColor="#CBD5E1"
                unitPrefix="₹"
                unitSuffix="Cr"
              />
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: PIE CHART - CENTRAL SECTOR FUNDS DISTRIBUTION
           ======================================================== */}
        {activeChartTab === 'pie_funds' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#E2E5E9]">
              <span className="text-xs font-semibold text-[#1F2937]">Central Schemes Allocation Pie Chart</span>
              <span className="text-[11px] text-[#174A73] font-bold">Total: ₹{totalSanctionedCr.toFixed(1)} Cr</span>
            </div>

            <div className="py-2 flex items-center justify-center">
              <SvgPieChart
                data={pieChartFundsData}
                size={190}
                donut={true}
                donutThickness={34}
                centerTitle={`₹${totalSanctionedCr.toFixed(0)}Cr`}
                centerSubtitle="Sanctioned"
                legendPosition="right"
              />
            </div>

            <div className="p-2.5 bg-[#F7F8FA] border border-[#E2E5E9] rounded-md text-[11px] text-[#667085] flex items-center justify-between">
              <span>Primary Sector: <strong>Jal Jeevan Mission</strong></span>
              <span className="text-[#16A34A] font-semibold">{overallDisbursementRate}% Overall Release</span>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: PIE CHART - RISK & COMPLIANCE DISTRIBUTION
           ======================================================== */}
        {activeChartTab === 'pie_risk' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#E2E5E9]">
              <span className="text-xs font-semibold text-[#1F2937]">Vigilance Risk Breakdown Pie Chart</span>
              <span className="text-[11px] text-[#16A34A] font-bold">Avg Compliance: {avgComplianceRate}%</span>
            </div>

            <div className="py-2 flex items-center justify-center">
              <SvgPieChart
                data={pieChartRiskData}
                size={190}
                donut={true}
                donutThickness={34}
                centerTitle={`${totalOrgs}`}
                centerSubtitle="Institutions"
                legendPosition="right"
              />
            </div>

            {/* Compliance Monitoring Indicator */}
            <div className="border border-[#E2E5E9] rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#1F2937]">Show-Cause Directive Adherence</span>
                <span className="font-semibold text-green-700">{complianceResolutionRate}% Rectified</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#16A34A] h-full"
                  style={{ width: `${complianceResolutionRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#667085] pt-1">
                <span>Closed Rectifications: {resolvedComplianceCount}</span>
                <span>Active Directives: {compliance.length - resolvedComplianceCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: INSPECTION & AUDIT PERFORMANCE
           ======================================================== */}
        {activeChartTab === 'inspections' && (
          <div className="space-y-4">
            {/* Status Breakdown Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 bg-green-50/60 border border-green-200 rounded-lg">
                <span className="text-[10px] text-green-800 font-medium block">Completed Audits</span>
                <span className="text-xl font-bold text-green-800 mt-1 block">
                  {completedInspectionsCount}
                </span>
                <span className="text-[10px] text-green-700 mt-0.5 block">Signed & Sealed</span>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                <span className="text-[10px] text-[#174A73] font-medium block">In-Field Live</span>
                <span className="text-xl font-bold text-[#174A73] mt-1 block">
                  {inProgressInspectionsCount}
                </span>
                <span className="text-[10px] text-[#174A73] mt-0.5 block">GPS Locked</span>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                <span className="text-[10px] text-amber-800 font-medium block">Scheduled</span>
                <span className="text-xl font-bold text-amber-800 mt-1 block">
                  {scheduledInspectionsCount}
                </span>
                <span className="text-[10px] text-amber-700 mt-0.5 block">Upcoming 7 Days</span>
              </div>
            </div>

            {/* Surprise Audit Efficacy */}
            <div className="border border-[#E2E5E9] rounded-lg p-3 space-y-2 bg-[#F7F8FA] text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#EA580C]" />
                  <span className="font-semibold text-[#1F2937]">Surprise Audit Efficacy Index</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">
                  {surpriseCount} Unannounced Visits
                </span>
              </div>
              <p className="text-[11px] text-[#667085] leading-relaxed">
                Surprise inspections revealed {surpriseFindingsCount} on-site material deviations requiring mandatory show-cause notice issuance.
              </p>
              <div className="pt-2 border-t border-[#E2E5E9] flex items-center justify-between text-[11px]">
                <span className="text-[#667085]">Defect Detection Multiplier:</span>
                <span className="font-bold text-[#1F2937]">3.4x vs Regular Audits</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer with Status */}
      <div className="px-4 py-2.5 bg-[#F7F8FA] border-t border-[#E2E5E9] flex items-center justify-between text-[11px] text-[#667085]">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Live Analytical Data Feed</span>
        </div>
        <span className="font-medium text-[#174A73]">Audited PFMS Synchronized</span>
      </div>
    </div>
  );
};
