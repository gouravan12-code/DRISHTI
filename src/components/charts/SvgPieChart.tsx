import React, { useState } from 'react';

export interface PieChartSlice {
  id?: string;
  label: string;
  value: number;
  color: string;
  formattedValue?: string;
  secondaryText?: string;
}

interface SvgPieChartProps {
  data: PieChartSlice[];
  size?: number;
  donut?: boolean;
  donutThickness?: number;
  centerTitle?: string;
  centerSubtitle?: string;
  showLegend?: boolean;
  legendPosition?: 'right' | 'bottom';
  className?: string;
}

export const SvgPieChart: React.FC<SvgPieChartProps> = ({
  data,
  size = 160,
  donut = true,
  donutThickness = 32,
  centerTitle,
  centerSubtitle,
  showLegend = true,
  legendPosition = 'right',
  className = ''
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((acc, curr) => acc + (curr.value > 0 ? curr.value : 0), 0);

  // Fallback if total is zero
  if (total === 0) {
    return (
      <div className={`flex items-center justify-center p-4 text-xs text-[#667085] ${className}`}>
        No data available to display chart
      </div>
    );
  }

  // Internal coordinate system (viewBox is always 200x200 for crisp geometry)
  const vbSize = 200;
  const cx = vbSize / 2;
  const cy = vbSize / 2;
  const outerRadius = (vbSize / 2) - 10;
  const innerRadius = donut ? outerRadius - donutThickness : 0;

  // Compute slice paths
  let currentAngle = -Math.PI / 2; // start at 12 o'clock

  const slices = data.map((item, index) => {
    const fraction = item.value > 0 ? item.value / total : 0;
    const angleSpan = fraction * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSpan;
    currentAngle = endAngle;

    const isFullCircle = fraction >= 0.9999;

    let pathD = '';
    if (isFullCircle) {
      if (donut) {
        pathD = `
          M ${cx} ${cy - outerRadius}
          A ${outerRadius} ${outerRadius} 0 1 0 ${cx} ${cy + outerRadius}
          A ${outerRadius} ${outerRadius} 0 1 0 ${cx} ${cy - outerRadius}
          M ${cx} ${cy - innerRadius}
          A ${innerRadius} ${innerRadius} 0 1 1 ${cx} ${cy + innerRadius}
          A ${innerRadius} ${innerRadius} 0 1 1 ${cx} ${cy - innerRadius}
          Z
        `;
      } else {
        pathD = `
          M ${cx} ${cy - outerRadius}
          A ${outerRadius} ${outerRadius} 0 1 0 ${cx} ${cy + outerRadius}
          A ${outerRadius} ${outerRadius} 0 1 0 ${cx} ${cy - outerRadius}
          Z
        `;
      }
    } else if (fraction > 0) {
      const x1 = cx + outerRadius * Math.cos(startAngle);
      const y1 = cy + outerRadius * Math.sin(startAngle);
      const x2 = cx + outerRadius * Math.cos(endAngle);
      const y2 = cy + outerRadius * Math.sin(endAngle);

      const largeArc = angleSpan > Math.PI ? 1 : 0;

      if (donut) {
        const x3 = cx + innerRadius * Math.cos(endAngle);
        const y3 = cy + innerRadius * Math.sin(endAngle);
        const x4 = cx + innerRadius * Math.cos(startAngle);
        const y4 = cy + innerRadius * Math.sin(startAngle);

        pathD = `
          M ${x1} ${y1}
          A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
          L ${x3} ${y3}
          A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
          Z
        `;
      } else {
        pathD = `
          M ${cx} ${cy}
          L ${x1} ${y1}
          A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
          Z
        `;
      }
    }

    const percentage = Math.round(fraction * 100);

    return {
      ...item,
      percentage,
      pathD,
      fraction,
      index
    };
  });

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div
      className={`flex ${
        legendPosition === 'bottom'
          ? 'flex-col items-center'
          : 'flex-col sm:flex-row items-center justify-center sm:justify-start'
      } gap-3 sm:gap-4 w-full max-w-full overflow-hidden ${className}`}
    >
      {/* Responsive SVG Donut Container */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center"
        style={{
          width: `${Math.min(size, 175)}px`,
          height: `${Math.min(size, 175)}px`,
          maxWidth: '100%'
        }}
      >
        <svg
          viewBox={`0 0 ${vbSize} ${vbSize}`}
          className="w-full h-full overflow-visible select-none"
        >
          {slices.map((slice) => {
            if (!slice.pathD) return null;
            const isHovered = hoveredIndex === slice.index;
            return (
              <path
                key={slice.index}
                d={slice.pathD}
                fill={slice.color}
                className="transition-all duration-200 cursor-pointer"
                style={{
                  opacity: hoveredIndex !== null && !isHovered ? 0.55 : 1,
                  transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                  transformOrigin: `${cx}px ${cy}px`,
                  filter: isHovered ? 'drop-shadow(0 3px 6px rgba(0,0,0,0.18))' : 'none'
                }}
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center Text inside Donut */}
        {donut && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
            {activeSlice ? (
              <div className="animate-in fade-in duration-150 flex flex-col items-center">
                <span className="text-[11px] font-bold text-[#1F2937] leading-tight truncate max-w-[80px]">
                  {activeSlice.label}
                </span>
                <span className="text-sm font-extrabold text-[#174A73] leading-none my-0.5">
                  {activeSlice.percentage}%
                </span>
                <span className="text-[9.5px] text-[#667085] leading-none truncate max-w-[85px]">
                  {activeSlice.formattedValue || activeSlice.value.toLocaleString()}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {centerTitle && (
                  <span className="text-sm font-bold text-[#1F2937] leading-tight">
                    {centerTitle}
                  </span>
                )}
                {centerSubtitle && (
                  <span className="text-[10px] text-[#667085] leading-tight mt-0.5">
                    {centerSubtitle}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Responsive Compact Legend with overflow protection */}
      {showLegend && (
        <div className="min-w-0 flex-1 w-full space-y-1 overflow-hidden">
          {slices.map((slice) => {
            const isHovered = hoveredIndex === slice.index;
            return (
              <div
                key={slice.index}
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between p-1 px-2 rounded-md text-xs cursor-pointer transition min-w-0 w-full ${
                  isHovered
                    ? 'bg-blue-50/80 ring-1 ring-[#174A73]/25'
                    : 'hover:bg-[#F7F8FA]'
                }`}
              >
                <div className="flex items-center space-x-1.5 min-w-0 flex-1 pr-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-xs flex-shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span
                    className="font-medium text-[#1F2937] text-[11px] truncate"
                    title={slice.label}
                  >
                    {slice.label}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-right flex-shrink-0">
                  <span className="font-semibold text-[#174A73] text-[11px] whitespace-nowrap">
                    {slice.formattedValue || slice.value.toLocaleString()}
                  </span>
                  <span className="text-[9.5px] text-[#667085] font-mono bg-gray-100 px-1 py-0.2 rounded flex-shrink-0">
                    {slice.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
