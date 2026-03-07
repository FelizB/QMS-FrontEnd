import React from 'react';
import { pickGradientForLevel } from '../../common/color-picker';
import type { GradientClass } from '../../common/colors';


type Skill = {
  name: string;
  level: number; // 0..100
  color?: GradientClass; // optional override
};

export const SkillBar: React.FC<Skill> = ({ name, level, color }) => {
  const width = Math.max(0, Math.min(100, level));
  const gradient = color ?? pickGradientForLevel(name, width);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-slate-700 dark:text-slate-200">
          {name}
        </span>
        <span className="text-[11px] text-slate-400">{width}%</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-1.5 rounded-full bg-gradient-to-r ${gradient}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};