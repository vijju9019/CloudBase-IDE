import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  FolderGit2,
  ArrowRight,
  RefreshCw,
  FolderOpen,
  Sparkles,
  Cloud,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { StatusOverview } from '../components/dashboard/StatusOverview';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { CloudBackground } from '../components/dashboard/CloudBackground';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Project } from '../types';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export const DashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const { refreshStatus } = useAppStore();

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    loadProjects();
  }, []);

  useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery]);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.language.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const templates = [
    {
      id: 'react',
      name: 'React',
      category: 'Frontend SPA',
      desc: 'Modern web apps with Vite, Tailwind & live browser preview',
      icon: '⚛',
      badge: 'Vite 6',
      color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800'
    },
    {
      id: 'nextjs',
      name: 'Next.js',
      category: 'Full-Stack React',
      desc: 'Server-rendered React apps, SSR & API routes ready',
      icon: '▲',
      badge: 'React 19',
      color: 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
    },
    {
      id: 'node',
      name: 'Node.js',
      category: 'Backend & APIs',
      desc: 'Node.js 24 runtime for microservices, Express & REST APIs',
      icon: '⬢',
      badge: 'Node 24',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
    },
    {
      id: 'python',
      name: 'Python',
      category: 'Scripts & AI',
      desc: 'Python 3.12 environment for machine learning, scripts & data',
      icon: '🐍',
      badge: 'Py 3.12',
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800'
    },
    {
      id: 'go',
      name: 'Go',
      category: 'Cloud Services',
      desc: 'Lightweight concurrent cloud services with Alpine Go container',
      icon: '🔷',
      badge: 'Go 1.22',
      color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800'
    },
    {
      id: 'java',
      name: 'Java',
      category: 'Enterprise Backend',
      desc: 'Eclipse Temurin JDK 21 container with isolated build environment',
      icon: '☕',
      badge: 'JDK 21',
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
    }
  ];

  return (
    <div className="relative h-full w-full overflow-y-auto bg-[#FFFFFF] dark:bg-[#0B0F19] select-none text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
      {/* ─── IMPORTANT FEATURE: SUBTLE ABSTRACT CLOUDBASE CLOUD BACKGROUND ─── */}
      <CloudBackground />

      {/* ─── DASHBOARD CONTENT (Positioned above cloud background with z-10) ─── */}
      <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* 1. Welcome to CloudBase IDE Section */}
        <div className="bg-[#FFFFFF]/90 dark:bg-[#1E293B]/90 backdrop-blur-xs rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-6 lg:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden transition-colors">
          {/* Subtle Accent Glow */}
          <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-blue-100/50 dark:from-blue-950/40 via-sky-50/30 dark:via-sky-950/20 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 shadow-2xs">
                  <Cloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-blue-600/20" />
                  <span>CloudBase IDE</span>
                </span>
                <span className="text-xs text-[#64748B] dark:text-slate-400 font-mono">
                  Local-First Developer Platform
                </span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-extrabold text-[#111827] dark:text-white tracking-tight">
                Welcome to CloudBase IDE
              </h1>

              <p className="text-sm text-[#475569] dark:text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Create, develop, and run your projects in isolated environments with local AI assistance.
                Zero cloud lock-in. Protected by Storage Guardian.
              </p>
            </div>

            {/* Action Buttons: [+ New Project], [Open Project], and [Light / Dark Mode Toggle] */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/wizard"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-sm transition-all hover:scale-[1.01]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ New Project</span>
              </Link>

              <a
                href="#projects"
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold border border-slate-300/80 dark:border-slate-700 transition-colors shadow-2xs"
              >
                <FolderOpen className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Open Project</span>
              </a>

              {/* DASHBOARD LIGHT / DARK MODE PILL TOGGLE BUTTON */}
              <ThemeToggle variant="pill" />
            </div>
          </div>
        </div>

        {/* 2. System Status Overview Cards */}
        <div>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 flex items-center gap-2 font-mono">
              <span>System Infrastructure</span>
            </h2>
            <button
              onClick={() => {
                refreshStatus();
                loadProjects();
              }}
              title="Refresh System Status"
              className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          </div>
          <StatusOverview />
        </div>

        {/* 3. Recent Projects Section */}
        <div id="projects" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-[#111827] dark:text-white tracking-tight">Recent Projects</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#475569] dark:text-slate-300 font-mono font-bold border border-slate-200 dark:border-slate-700 shadow-2xs">
                {filteredProjects.length}
              </span>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter projects by name or language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-[#1E293B] text-[#111827] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs pl-9 pr-3 py-1.5 rounded-lg border border-[#CBD5E1] dark:border-[#334155] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none w-56 lg:w-72 shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* Project Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] animate-pulse"
                />
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((p) => (
                <ProjectCard key={p.id} project={p} onRefresh={loadProjects} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white/95 dark:bg-[#1E293B]/95 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] flex flex-col items-center justify-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-2xs">
                <FolderGit2 className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-[#111827] dark:text-white">
                {searchQuery ? 'No Matching Projects' : 'No Projects Found'}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1.5 max-w-sm leading-relaxed">
                {searchQuery
                  ? 'No project matched your filter. Try clearing the search query.'
                  : 'Create your first isolated container project to begin coding with offline AI assistance.'}
              </p>
              <Link
                to="/wizard"
                className="mt-5 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Launch Project Creation Wizard</span>
              </Link>
            </div>
          )}
        </div>

        {/* 4. Programming Templates Section */}
        <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#1E293B] space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-mono">
              Programming Templates
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Start instantly with pre-configured container runtimes and dependencies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tmpl) => (
              <Link
                key={tmpl.id}
                to={`/wizard?lang=${tmpl.id === 'nextjs' ? 'react' : tmpl.id}`}
                className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-150 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center text-base font-bold shadow-2xs group-hover:scale-105 transition-transform ${tmpl.color}`}
                    >
                      {tmpl.icon}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-semibold border border-slate-200 dark:border-slate-700">
                      {tmpl.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#111827] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tmpl.name}
                  </h3>
                  <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    {tmpl.category}
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1.5 leading-relaxed">
                    {tmpl.desc}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-[#F1F5F9] dark:border-[#334155] flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  <span>Use Template</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
