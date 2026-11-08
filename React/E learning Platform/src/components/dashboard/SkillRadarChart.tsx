import React from 'react';
import { UserSkillProficiency } from '../../types';
import { Sparkles, TrendingUp } from 'lucide-react';

interface SkillRadarChartProps {
  skills: UserSkillProficiency[];
  onTakeFocusQuiz?: () => void;
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ skills, onTakeFocusQuiz }) => {
  const size = 280;
  const center = size / 2;
  const radius = center - 45;
  const numAxes = skills.length;

  // Calculate coordinates on spider grid
  const getCoordinates = (index: number, valuePercent: number) => {
    const angle = (Math.PI * 2 / numAxes) * index - Math.PI / 2;
    const r = (valuePercent / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Generate web rings (25%, 50%, 75%, 100%)
  const webRings = [25, 50, 75, 100].map(level => {
    const points = skills.map((_, i) => {
      const { x, y } = getCoordinates(i, level);
      return `${x},${y}`;
    }).join(' ');
    return { level, points };
  });

  // Generate polygon points for actual user skill scores
  const polygonPoints = skills.map((s, i) => {
    const { x, y } = getCoordinates(i, s.scorePercent);
    return `${x},${y}`;
  }).join(' ');

  // Identify lowest skill as focus area
  const lowestSkill = [...skills].sort((a, b) => a.scorePercent - b.scorePercent)[0] || skills[0];

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#171B26] p-5 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Skill Competency Radar
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-axis verified assessment calibration
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          Top 8% Cohort
        </span>
      </div>

      {/* SVG Spider Chart */}
      <div className="relative flex items-center justify-center my-2">
        <svg width={size} height={size} className="overflow-visible">
          {/* Background web polygon grids */}
          {webRings.map(ring => (
            <polygon
              key={ring.level}
              points={ring.points}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray={ring.level < 100 ? '2,2' : undefined}
              className="text-black/10 dark:text-white/10"
            />
          ))}

          {/* Axis lines */}
          {skills.map((_, i) => {
            const { x, y } = getCoordinates(i, 100);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                className="text-black/10 dark:text-white/10"
              />
            );
          })}

          {/* User Score Filled Polygon */}
          <polygon
            points={polygonPoints}
            fill="rgba(99, 102, 241, 0.25)"
            stroke="#6366F1"
            strokeWidth="2.5"
            className="transition-all duration-700 ease-out"
          />

          {/* Points on vertices */}
          {skills.map((s, i) => {
            const { x, y } = getCoordinates(i, s.scorePercent);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4.5"
                fill="#6366F1"
                stroke="#FAF9F5"
                strokeWidth="2"
                className="hover:r-6 cursor-pointer transition-all"
              >
                <title>{`${s.skillAxis}: ${s.scorePercent}%`}</title>
              </circle>
            );
          })}

          {/* Axis labels around circumference */}
          {skills.map((s, i) => {
            const { x, y } = getCoordinates(i, 122);
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                className="font-mono font-medium fill-slate-700 dark:fill-slate-300"
              >
                {s.skillAxis.split(' ')[0]} ({s.scorePercent}%)
              </text>
            );
          })}
        </svg>
      </div>

      {/* Focus Area Callout */}
      <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              💡 Recommended Focus Area:
            </span>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
              Complete <span className="font-semibold text-amber-600 dark:text-amber-400">"{lowestSkill.skillAxis} Quiz"</span> to elevate calibration score by +14%.
            </p>
          </div>
          {onTakeFocusQuiz && (
            <button
              onClick={onTakeFocusQuiz}
              className="text-[10px] font-semibold px-2 py-1 rounded bg-amber-500 text-white hover:bg-amber-600 transition-colors shrink-0"
            >
              Start
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

