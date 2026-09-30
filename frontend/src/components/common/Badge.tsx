import React from 'react';

interface LanguageBadgeProps {
  language: string;
}

export const LanguageBadge: React.FC<LanguageBadgeProps> = ({ language }) => {
  const lang = language.toLowerCase();
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';

  if (lang === 'python') {
    bg = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (lang === 'node' || lang === 'javascript') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (lang === 'react') {
    bg = 'bg-cyan-50 text-cyan-700 border-cyan-200';
  } else if (lang === 'java') {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (lang === 'cpp') {
    bg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (lang === 'go') {
    bg = 'bg-sky-50 text-sky-700 border-sky-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${bg}`}>
      {language.toUpperCase()}
    </span>
  );
};

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status.toLowerCase();
  const isRunning = s === 'running';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
      isRunning
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-slate-100 text-slate-600 border-slate-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
