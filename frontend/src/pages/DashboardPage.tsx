import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Code2,
  FolderGit2,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FolderPlus,
  Compass,
  Cpu,
  Bot
} from 'lucide-react';
import { StatusOverview } from '../components/dashboard/StatusOverview';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { Project } from '../types';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
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

  const languages = ['all', 'python', 'node', 'react', 'java', 'cpp', 'go'];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = selectedLanguage === 'all' || p.language.toLowerCase() === selectedLanguage;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="h-full overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-8 select-none text-[#1E293B]">
      {/* VS Code "Get Started" Inspired Welcome Section */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-blue-50/60 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                CloudBase IDE v1.0 • Local-First
              </span>
              <span className="text-xs text-[#64748B] font-mono">Windows 11 Certified</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              Your Code. Your Environment. Your AI.
            </h1>
            <p className="text-sm text-[#64748B] mt-1.5 max-w-2xl leading-relaxed">
              Every project runs in its own isolated container with dedicated storage.
              Protected by Storage Guardian with 100% offline local AI assistance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/wizard"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-all hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Live System Health Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
            <span>System Infrastructure</span>
          </h2>
          <button
            onClick={() => { refreshStatus(); loadProjects(); }}
            className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#1E293B] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
        <StatusOverview />
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#1E293B] tracking-tight">Recent Projects</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-[#475569] font-mono font-medium border border-slate-200">
              {filteredProjects.length}
            </span>
          </div>

          {/* Search & Language Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white text-[#1E293B] text-xs pl-9 pr-3 py-2 rounded-lg border border-[#CBD5E1] focus:border-blue-500 outline-none w-48 lg:w-60 shadow-2xs"
              />
            </div>

            <div className="flex items-center bg-white p-1 rounded-lg border border-[#E2E8F0] shadow-2xs overflow-x-auto">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    selectedLanguage === lang
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Project Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-white border border-[#E2E8F0] animate-pulse" />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => (
              <ProjectCard key={p.id} project={p} onRefresh={loadProjects} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#E2E8F0] flex flex-col items-center justify-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <FolderGit2 className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-[#1E293B]">No Projects Found</h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm leading-relaxed">
              {searchQuery
                ? 'No projects matched your search criteria.'
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

      {/* Quick Starter Templates */}
      <div className="pt-4 border-t border-[#E2E8F0]">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-4">
          Quick-Start Environment Templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/wizard?lang=python"
            className="p-4 rounded-xl bg-white border border-[#E2E8F0] hover:border-blue-400 transition-all shadow-xs hover:shadow-md group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3">
              Py
            </div>
            <h3 className="font-bold text-sm text-[#1E293B] group-hover:text-blue-600 transition-colors">Python 3.12</h3>
            <p className="text-xs text-[#64748B] mt-1">Data processing, scripts, & CLI applications</p>
            <div className="mt-3 flex items-center gap-1 text-[11px] text-blue-600 font-medium">
              <span>Use Template</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/wizard?lang=node"
            className="p-4 rounded-xl bg-white border border-[#E2E8F0] hover:border-emerald-400 transition-all shadow-xs hover:shadow-md group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
              JS
            </div>
            <h3 className="font-bold text-sm text-[#1E293B] group-hover:text-emerald-700 transition-colors">Node.js 22</h3>
            <p className="text-xs text-[#64748B] mt-1">Backend microservices, REST APIs, & tooling</p>
            <div className="mt-3 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <span>Use Template</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/wizard?lang=react"
            className="p-4 rounded-xl bg-white border border-[#E2E8F0] hover:border-cyan-400 transition-all shadow-xs hover:shadow-md group"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold mb-3">
              ⚛
            </div>
            <h3 className="font-bold text-sm text-[#1E293B] group-hover:text-cyan-700 transition-colors">React SPA</h3>
            <p className="text-xs text-[#64748B] mt-1">Modern web apps with live browser preview</p>
            <div className="mt-3 flex items-center gap-1 text-[11px] text-cyan-600 font-medium">
              <span>Use Template</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/wizard?lang=java"
            className="p-4 rounded-xl bg-white border border-[#E2E8F0] hover:border-amber-400 transition-all shadow-xs hover:shadow-md group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
              ☕
            </div>
            <h3 className="font-bold text-sm text-[#1E293B] group-hover:text-amber-700 transition-colors">Java 21</h3>
            <p className="text-xs text-[#64748B] mt-1">Eclipse Temurin JDK 21 isolated container</p>
            <div className="mt-3 flex items-center gap-1 text-[11px] text-amber-600 font-medium">
              <span>Use Template</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
