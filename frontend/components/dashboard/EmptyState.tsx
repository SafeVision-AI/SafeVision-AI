'use client';

import React from 'react';
import { motion } from 'motion/react';
import { SearchX } from 'lucide-react';

export default function EmptyState({ 
  title, 
  description, 
  icon: Icon = SearchX 
}: { 
  title: string; 
  description: string; 
  icon?: any; 
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full py-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[250px] leading-relaxed">{description}</p>
    </motion.div>
  );
}
