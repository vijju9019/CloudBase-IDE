import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Code2,
  Play,
  Square,
  Trash2,
  Download,
  FolderOpen,
  HardDrive,
  Calendar,
  Layers,
  MoreVertical,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { Project } from '../../types';
import { LanguageBadge, StatusBadge } from '../common/Badge';
import { api } from '../../services/api';

interface ProjectCardProps {
  project: Project;
  onRefresh: () => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onRefresh }) => {
  const navigate = useNavigate();
  const [isTogglingEnv, setIsTogglingEnv] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const isRunning = project.status === 'running';

  const handleToggleEnvironment = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTogglingEnv(true);
    try {
      if (isRunning) {
        await api.stopEnvironment(project.id);
      } else {
        await api.startEnvironment(project.id);
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsTogglingEnv(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteProject(project.id);
      setShowDeleteConfirm(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBackup = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    try {
      const res = await api.createBackup(project.id);
      setBackupMessage(`Saved: ${res.filename}`);
      setTimeout(() => setBackupMessage(null), 3000);
    } catch (err: any) {
      alert(`Backup failed: ${err.message}`);
    }
  };

  const getLanguageIcon = (lang: string) => {
    const l = lang.toLowerCase();
    if (l.includes('react')) return '⚛';
    if (l.includes('python')) return '🐍';
    if (l.includes('node') || l.includes('js')) return '⬢';
    if (l.includes('java')) return '☕';
    if (l.includes('cpp') || l.includes('c++')) return 'C++';
    if (l.includes('go')) return '🔷';
    return '</>';
  };

  return (
    <>
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-500 p-5 flex flex-col justify-between transition-all duration-150 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.08)] group relative">
        <div>
          {/* Top Row: Language Icon Badge & Status & Menu */}
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 shadow-2xs group-hover:scale-105 transition-transform">
                {getLanguageIcon(project.language)}
              </span>
              <div>
                <LanguageBadge language={project.language} />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <StatusBadge status={project.status} />

              {/* More Menu Toggle */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  title="More actions"
                  className="p-1 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-lg py-1 z-30 text-xs"
                  >
                    <Link
                      to={`/ide/${project.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Open in IDE</span>
                    </Link>
                    <button
                      onClick={handleBackup}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Backup Workspace</span>
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Project</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Project Title */}
          <Link to={`/ide/${project.id}`} className="block group/link">
            <h3 className="font-bold text-base text-[#111827] dark:text-white group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors tracking-tight flex items-center gap-1.5">
              <span>{project.name}</span>
              <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </h3>
          </Link>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5 font-mono truncate" title={project.workspace_path}>
            {project.id}
          </p>

          {/* Metadata Grid */}
          <div className="mt-4 pt-3 border-t border-[#F1F5F9] dark:border-[#334155] grid grid-cols-2 gap-2 text-[11px] text-[#64748B] dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>{formatBytes(project.sizeBytes)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="capitalize truncate">{project.template || 'Default'}</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {backupMessage && (
            <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800 font-mono">
              ✓ {backupMessage}
            </div>
          )}
        </div>

        {/* Action bar: Run button & Open */}
        <div className="mt-4 pt-3 border-t border-[#F1F5F9] dark:border-[#334155] flex items-center justify-between gap-2">
          {/* Start / Stop Environment or Run */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleEnvironment}
              disabled={isTogglingEnv}
              title={isRunning ? 'Stop Container Environment' : 'Start Isolated Container Environment'}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-2xs ${
                isRunning
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
              }`}
            >
              {isRunning ? (
                <Square className="w-3 h-3 fill-current" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              <span>{isTogglingEnv ? '...' : isRunning ? 'Stop' : 'Run'}</span>
            </button>
          </div>

          {/* Open in IDE Button */}
          <Link
            to={`/ide/${project.id}`}
            className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-md text-xs font-medium transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open IDE</span>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          onClick={() => setShowDeleteConfirm(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-text"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1E293B] rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E2E8F0] dark:border-[#334155] space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-800">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#111827] dark:text-white">Delete Project?</h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1.5 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-[#111827] dark:text-white">{project.name}</strong>? All workspace files and container state will be destroyed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9] dark:border-[#334155]">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
