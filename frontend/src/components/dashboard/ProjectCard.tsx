import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  Play,
  Square,
  Trash2,
  Download,
  FolderOpen,
  HardDrive,
  Calendar,
  Layers
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
  const [isTogglingEnv, setIsTogglingEnv] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

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
    try {
      const res = await api.createBackup(project.id);
      setBackupMessage(`Saved: ${res.filename}`);
      setTimeout(() => setBackupMessage(null), 3000);
    } catch (err: any) {
      alert(`Backup failed: ${err.message}`);
    }
  };

  return (
    <>
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] hover:border-blue-400/80 p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md group">
        <div>
          {/* Top row: Language badge & Container status */}
          <div className="flex items-center justify-between mb-3">
            <LanguageBadge language={project.language} />
            <StatusBadge status={project.status} />
          </div>

          {/* Project Title */}
          <Link to={`/ide/${project.id}`} className="block">
            <h3 className="font-bold text-base text-[#1E293B] group-hover:text-blue-600 transition-colors tracking-tight flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-600" />
              {project.name}
            </h3>
          </Link>
          <p className="text-xs text-[#64748B] mt-1 font-mono truncate" title={project.workspace_path}>
            {project.id}
          </p>

          {/* Metadata */}
          <div className="mt-4 pt-3 border-t border-[#F1F5F9] grid grid-cols-2 gap-2 text-[11px] text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatBytes(project.sizeBytes)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span className="capitalize">{project.template}</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="mt-5 pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {/* Start / Stop Environment */}
            <button
              onClick={handleToggleEnvironment}
              disabled={isTogglingEnv}
              title={isRunning ? 'Stop Container Environment' : 'Start Isolated Container'}
              className={`px-2 py-1 rounded text-xs font-medium border transition-colors flex items-center gap-1 shadow-2xs ${
                isRunning
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {isRunning ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span className="text-[11px]">{isTogglingEnv ? '...' : isRunning ? 'Stop' : 'Start'}</span>
            </button>

            {/* Backup */}
            <button
              onClick={handleBackup}
              title="Create Storage Guardian Safe Backup"
              className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs border border-slate-200 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              title="Delete Project (Isolated Workspace only)"
              className="p-1.5 rounded bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 text-xs border border-slate-200 transition-colors shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Open IDE link */}
          <Link
            to={`/ide/${project.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-all hover:scale-[1.01]"
          >
            <span>Open IDE</span>
            <FolderOpen className="w-3.5 h-3.5" />
          </Link>
        </div>

        {backupMessage && (
          <div className="mt-2 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded text-center">
            {backupMessage}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#1E293B] mb-2">Delete Project "{project.name}"?</h3>
            <p className="text-sm text-[#64748B] mb-4 leading-relaxed">
              Storage Guardian will remove <span className="text-amber-700 font-mono text-xs">{project.workspace_path}</span> and its associated Docker container.
            </p>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 mb-5">
              🛡️ <strong>Safety Guarantee:</strong> Deleting this project will strictly affect only this isolated workspace folder. Your Documents, Desktop, and Windows personal files are never touched.
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Safe Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
