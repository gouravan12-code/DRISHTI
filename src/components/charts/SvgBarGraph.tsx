import React, { useState } from 'react';

export interface BarGraphItem {
  id?: string;
  label: string;
  value: number; // primary value (e.g. disbursed or progress)
  secondaryValue?: number; // secondary value for comparison (e.g. sanctioned)
  formattedValue?: string;
  formattedSecondaryValue?: string;
  color?: string;
  secondaryColor?: string;
  category?: string;
}

interface SvgBarGraphProps {
  data: BarGraphItem[];
  height?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  unitPrefix?: string;
  unitSuffix?: string;
  showValues?: boolean;
  className?: string;
}

export const SvgBarGraph: React.FC<SvgBarGraphProps> = ({
  data,
  height = 220,
  primaryLabel = 'Disbursed',
  secondaryLabel = 'Sanctioned',
  primaryColor = '#174A73',
  secondaryColor = '#94A3B8',
  unitPrefix = '₹',
  unitSuffix = ' Cr',
  showValues = true,
  className = ''
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center p-6 text-xs text-[#667085] ${className}`}>
        No data available to plot bar graph
      </div>
    );
  }

  // Find max value across all bars to scale axes
  const hasSecondary = data.some(d => d.secondaryValue !== undefined);
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.value, d.secondaryValue || 0)),
    10
  );

  // Round max value up to nice number for 4 grid ticks
  const niceMax = Math.ceil(maxValue * 1.15);
  const ticks = [0, niceMax * 0.33, niceMax * 0.66, niceMax];

  const svgWidth = 540;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 28;
  const paddingBottom = 42;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const barGroupWidth = chartWidth / data.length;
  const barGap = 6;
  const singleBarWidth = hasSecondary ? (barGroupWidth - 20) / 2 : Math.min(barGroupWidth - 16, 38);

  const activeItem = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className={`w-full flex flex-col ${className}`}>
      {/* Legend Header */}
      <div className="flex items-center justify-between pb-2 text-[11px] text-[#667085] border-b border-[#E2E5E9] mb-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: primaryColor }} />
            <span className="font-semibold text-[#1F2937]">{primaryLabel}</span>
          </div>
          {hasSecondary && (
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: secondaryColor }} />
              <span className="font-semibold text-[#1F2937]">{secondaryLabel}</span>
            </div>
          )}
        </div>
        <span className="text-[10px] text-[#667085] font-mono">
          Max: {unitPrefix}{niceMax.toFixed(0)}{unitSuffix}
        </span>
      </div>

      {/* SVG Canvas with continuous mouse tracking */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${height}`}
          className="w-full min-w-[340px] select-none"
          style={{ height: `${height}px` }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Horizontal Grid lines & Y-Axis Ticks */}
          {ticks.map((t, idx) => {
            const y = paddingTop + chartHeight - (t / niceMax) * chartHeight;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#E2E5E9"
                  strokeDasharray={idx === 0 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#667085"
                  fontFamily="sans-serif"
                >
                  {unitPrefix}{t.toFixed(0)}{unitSuffix}
                </text>
              </g>
            );
          })}

          {/* Bar Groups */}
          {data.map((item, idx) => {
            const groupX = paddingLeft + idx * barGroupWidth;
            const centerX = groupX + barGroupWidth / 2;

            const primaryHeight = Math.max((item.value / niceMax) * chartHeight, 2);
            const primaryY = paddingTop + chartHeight - primaryHeight;

            let secondaryHeight = 0;
            let secondaryY = 0;
            if (hasSecondary && item.secondaryValue !== undefined) {
              secondaryHeight = Math.max((item.secondaryValue / niceMax) * chartHeight, 2);
              secondaryY = paddingTop + chartHeight - secondaryHeight;
            }

            const isHovered = hoveredIdx === idx;

            // X-coords for grouped vs single
            const secX = centerX - singleBarWidth - barGap / 2;
            const priX = hasSecondary ? centerX + barGap / 2 : centerX - singleBarWidth / 2;

            return (
              <g key={idx}>
                {/* Column highlight backdrop for smooth hover guidance */}
                <rect
                  x={groupX + 2}
                  y={paddingTop}
                  width={barGroupWidth - 4}
                  height={chartHeight}
                  rx="4"
                  fill="#174A73"
                  className="transition-opacity duration-200 pointer-events-none"
                  style={{ opacity: isHovered ? 0.07 : 0 }}
                />

                {/* Secondary Bar (e.g. Sanctioned Allocation) */}
                {hasSecondary && item.secondaryValue !== undefined && (
                  <rect
                    x={secX}
                    y={secondaryY}
                    width={singleBarWidth}
                    height={secondaryHeight}
                    rx="3"
                    fill={item.secondaryColor || secondaryColor}
                    className="transition-all duration-200 ease-out pointer-events-none"
                    style={{
                      opacity: isHovered ? 1 : hoveredIdx !== null ? 0.65 : 0.85,
                      transform: isHovered ? 'scaleY(1.015)' : 'scaleY(1)',
                      transformOrigin: `${secX}px ${paddingTop + chartHeight}px`
                    }}
                  />
                )}

                {/* Primary Bar (e.g. Disbursed Funds) */}
                <rect
                  x={priX}
                  y={primaryY}
                  width={singleBarWidth}
                  height={primaryHeight}
                  rx="3"
                  fill={item.color || primaryColor}
                  className="transition-all duration-200 ease-out pointer-events-none"
                  style={{
                    opacity: isHovered ? 1 : hoveredIdx !== null ? 0.7 : 0.95,
                    transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                    transformOrigin: `${priX}px ${paddingTop + chartHeight}px`
                  }}
                />

                {/* Value on top of primary bar with smooth opacity/color */}
                {showValues && (
                  <text
                    x={hasSecondary ? priX + singleBarWidth / 2 : centerX}
                    y={primaryY - 5}
                    textAnchor="middle"
                    fontSize="9.5"
                    className="transition-all duration-200 pointer-events-none"
                    style={{
                      fontWeight: isHovered ? '700' : '600',
                      fill: isHovered ? '#174A73' : '#475569'
                    }}
                  >
                    {item.formattedValue || `${item.value.toFixed(1)}`}
                  </text>
                )}

                {/* X-Axis Category Label */}
                <text
                  x={centerX}
                  y={paddingTop + chartHeight + 15}
                  textAnchor="middle"
                  fontSize="10"
                  className="transition-all duration-200 pointer-events-none"
                  style={{
                    fontWeight: isHovered ? '700' : '500',
                    fill: isHovered ? '#174A73' : '#475569'
                  }}
                >
                  {item.label.length > 14 ? `${item.label.slice(0, 12)}...` : item.label}
                </text>

                {/* Seamless full-height column hitbox - prevents flickering across gaps */}
                <rect
                  x={groupX}
                  y={0}
                  width={barGroupWidth}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Reserved-Height Info Strip - Completely smooth transition with zero layout shifts */}
      <div
        className={`mt-2 px-3 py-2 rounded-lg border text-xs transition-all duration-200 flex items-center justify-between min-h-[38px] ${
          activeItem
            ? 'bg-blue-50/90 border-blue-200 shadow-2xs'
            : 'bg-[#F8FAFC] border-[#E2E5E9]'
        }`}
      >
        <div className="flex items-center space-x-2 truncate pr-2">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-200 ${
              activeItem ? 'bg-[#174A73]' : 'bg-[#94A3B8]'
            }`}
          />
          <span className="font-semibold text-[#1F2937] truncate">
            {activeItem ? activeItem.label : 'Hover over any scheme bar for detailed financial figures'}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] flex-shrink-0">
          {activeItem ? (
            <>
              {activeItem.secondaryValue !== undefined && (
                <span className="text-[#64748B]">
                  {secondaryLabel}:{' '}
                  <strong className="text-[#1F2937] font-semibold">
                    {activeItem.formattedSecondaryValue || `${unitPrefix}${activeItem.secondaryValue.toFixed(1)}${unitSuffix}`}
                  </strong>
                </span>
              )}
              <span className="text-[#64748B]">
                {primaryLabel}:{' '}
                <strong className="text-[#16A34A] font-bold">
                  {activeItem.formattedValue || `${unitPrefix}${activeItem.value.toFixed(1)}${unitSuffix}`}
                </strong>
              </span>
            </>
          ) : (
            <span className="text-[10px] text-[#94A3B8] font-medium hidden sm:inline">
              PFMS Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
