import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export interface FleetStatusDonutProps {
  assignedCount: number;
  inStockCount: number;
  inRepairCount: number;
  retiredCount?: number;
  totalAssets: number;
  utilizationRate: number;
  isEnlarged?: boolean;
  onSliceClick?: (statusKey: string) => void;
  selectedStatus?: string;
}

export const FleetStatusDonut: React.FC<FleetStatusDonutProps> = ({
  assignedCount,
  inStockCount,
  inRepairCount,
  retiredCount = 0,
  totalAssets,
  utilizationRate,
  isEnlarged = false,
  onSliceClick,
  selectedStatus,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = [
    {
      name: 'Assigned',
      filterKey: 'ASSIGNED',
      value: assignedCount,
      gradientId: 'donutGradAssigned',
      glowColor: '#6366f1',
      badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      name: 'In Stock',
      filterKey: 'IN_STOCK',
      value: inStockCount,
      gradientId: 'donutGradInStock',
      glowColor: '#10b981',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      name: 'In Repair',
      filterKey: 'IN_REPAIR',
      value: inRepairCount,
      gradientId: 'donutGradInRepair',
      glowColor: '#f59e0b',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    ...(retiredCount > 0
      ? [
          {
            name: 'Retired',
            filterKey: 'RETIRED',
            value: retiredCount,
            gradientId: 'donutGradRetired',
            glowColor: '#64748b',
            badgeClass: 'bg-slate-700/40 text-slate-300 border-slate-600',
          },
        ]
      : []),
  ].filter((d) => d.value > 0);

  const innerRadius = isEnlarged ? 95 : 54;
  const outerRadius = isEnlarged ? 148 : 78;

  const activeSlice = hoveredIndex !== null ? data[hoveredIndex] : data.find((d) => d.filterKey === selectedStatus);

  return (
    <div className="w-full h-full relative flex items-center justify-center select-none">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {/* High-Definition Linear Gradients */}
            <linearGradient id="donutGradAssigned" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>

            <linearGradient id="donutGradInStock" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <linearGradient id="donutGradInRepair" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            <linearGradient id="donutGradRetired" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Ambient Radial Core Glow */}
            <radialGradient id="donutAmbientCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.16" />
              <stop offset="60%" stopColor="#0f172a" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>
          </defs>

          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={isEnlarged ? 5 : 4}
            cornerRadius={isEnlarged ? 8 : 6}
            stroke="#090d16"
            strokeWidth={isEnlarged ? 3 : 2.5}
            dataKey="value"
            style={{ shapeRendering: 'geometricPrecision', outline: 'none' }}
            onClick={(entry: any) => {
              const key = entry?.filterKey || entry?.payload?.filterKey;
              if (onSliceClick && key) {
                onSliceClick(key);
              }
            }}
            onMouseEnter={(_, idx) => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {data.map((entry, index) => {
              const isSelected = selectedStatus === entry.filterKey;
              const isHovered = hoveredIndex === index;
              return (
                <Cell
                  key={`cell-slice-${index}`}
                  fill={`url(#${entry.gradientId})`}
                  className="cursor-pointer transition-all duration-300"
                  style={{
                    filter: isHovered || isSelected ? `drop-shadow(0 0 8px ${entry.glowColor}80)` : undefined,
                    opacity: hoveredIndex !== null && !isHovered ? 0.65 : 1,
                  }}
                />
              );
            })}
          </Pie>

          {isEnlarged && (
            <Tooltip
              contentStyle={{
                backgroundColor: '#090d16',
                borderColor: '#1e293b',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              }}
              formatter={(val: any, name: any) => [
                `${val} Units (${Math.round((Number(val) / (totalAssets || 1)) * 100)}% of Fleet)`,
                name,
              ]}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* Center Telemetry Core (HUD) inside donut hole */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div
          className={`rounded-full border border-slate-800/80 border-dashed flex flex-col items-center justify-center bg-slate-950/75 shadow-inner transition-all duration-300 ${
            isEnlarged ? 'w-40 h-40 p-2' : 'w-24 h-24 p-1'
          }`}
        >
          <span
            className={`font-bold tracking-wider text-slate-400 uppercase truncate max-w-[90%] text-center ${
              isEnlarged ? 'text-[11px]' : 'text-[9px]'
            }`}
          >
            {activeSlice ? activeSlice.name : 'Total Fleet'}
          </span>

          <span
            className={`font-black text-slate-100 tracking-tight transition-all duration-200 ${
              isEnlarged ? 'text-3xl mt-0.5' : 'text-xl'
            }`}
          >
            {activeSlice ? activeSlice.value : totalAssets}
          </span>

          <div
            className={`rounded-full font-bold border flex items-center justify-center ${
              isEnlarged ? 'px-2.5 py-0.5 text-[10px] mt-1' : 'px-1.5 py-0.2 text-[8px] mt-0.5'
            } ${
              activeSlice
                ? activeSlice.badgeClass
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {activeSlice
              ? `${Math.round((activeSlice.value / (totalAssets || 1)) * 100)}% Share`
              : `${utilizationRate}% In-Use`}
          </div>

          {isEnlarged && (
            <span className="text-[9px] text-slate-500 mt-1 font-mono">
              {activeSlice ? 'Click to Filter' : 'Click Slice to Inspect'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
