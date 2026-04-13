import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}

export default function Toggle({ checked, onChange, ariaLabel }: ToggleProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
        aria-label={ariaLabel}
      />
      <div className="w-12 h-6 bg-slate-200 dark:bg-white/10 rounded-full peer peer-focus:ring-2 peer-focus:ring-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
    </label>
  );
}
