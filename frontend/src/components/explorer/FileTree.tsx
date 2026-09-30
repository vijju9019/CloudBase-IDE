import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Plus,
  FolderPlus,
  RefreshCw,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  Search,
  Filter
} from 'lucide-react';
import { FileNode } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { api } from '../../services/api';

interface FileTreeProps {
  nodes: FileNode[];
}

export const FileTree: React.FC<FileTreeProps> = ({ nodes }) => {
  const { currentProject, openFile, refreshFileTree, activeTabPath } = useProjectStore();
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  const toggleFolder = (path: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCreateItem = async (type: 'file' | 'directory') => {
    if (!currentProject || !newItemName.trim()) {
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      return;
    }

    try {
      await api.createFileOrFolder(currentProject.id, newItemName.trim(), type);
      setNewItemName('');
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      await refreshFileTree();
      if (type === 'file') {
        openFile(newItemName.trim(), newItemName.trim());
      }
    } catch (err: any) {
      alert(`Error creating ${type}: ${err.message}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    if (!currentProject) return;
    if (confirm(`Are you sure you want to delete "${path}"?`)) {
      try {
        await api.deleteFileOrFolder(currentProject.id, path);
        await refreshFileTree();
      } catch (err: any) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  const handleRename = async (e: React.FormEvent, oldPath: string) => {
    e.preventDefault();
    if (!currentProject || !renameValue.trim() || renameValue === oldPath) {
      setRenamingPath(null);
      return;
    }

    try {
      const parts = oldPath.split('/');
      parts.pop();
      const parentDir = parts.join('/');
      const newPath = parentDir ? `${parentDir}/${renameValue.trim()}` : renameValue.trim();

      await api.renameFileOrFolder(currentProject.id, oldPath, newPath);
      setRenamingPath(null);
      await refreshFileTree();
    } catch (err: any) {
      alert(`Rename failed: ${err.message}`);
    }
  };

  const getFileIconColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.py')) return 'text-blue-600';
    if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'text-amber-500';
    if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'text-blue-500';
    if (lower.endsWith('.json')) return 'text-emerald-600';
    if (lower.endsWith('.html')) return 'text-orange-500';
    if (lower.endsWith('.css')) return 'text-sky-500';
    if (lower.endsWith('.md')) return 'text-slate-500';
    return 'text-slate-400';
  };

  const renderNode = (node: FileNode, depth = 0) => {
    const isFolder = node.type === 'directory';
    const isCollapsed = collapsedFolders[node.path];
    const isActive = node.path === activeTabPath;

    // Filter check
    if (filterQuery) {
      const matches = node.name.toLowerCase().includes(filterQuery.toLowerCase());
      if (!isFolder && !matches) return null;
    }

    return (
      <div key={node.path} className="select-none">
        <div
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.path);
            } else {
              openFile(node.path, node.name);
            }
          }}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`group flex items-center justify-between py-1 pr-2 text-xs font-mono cursor-pointer transition-colors relative ${
            isActive
              ? 'bg-[#DBEAFE] text-[#1E293B] font-semibold border-l-2 border-[#2563EB]'
              : 'text-[#334155] hover:bg-[#EFF6FF] hover:text-[#1E293B]'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            {isFolder ? (
              <>
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                {isCollapsed ? (
                  <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                ) : (
                  <FolderOpen className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                )}
              </>
            ) : (
              <>
                <span className="w-3.5" />
                <FileCode className={`w-3.5 h-3.5 shrink-0 ${getFileIconColor(node.name)}`} />
              </>
            )}

            {renamingPath === node.path ? (
              <form onSubmit={(e) => handleRename(e, node.path)} onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={renameValue}
                  autoFocus
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => setRenamingPath(null)}
                  className="bg-white text-[#1E293B] px-1 py-0.5 rounded text-xs border border-blue-500 outline-none w-32 shadow-xs"
                />
              </form>
            ) : (
              <span className="truncate text-[12px]">{node.name}</span>
            )}
          </div>

          {/* Quick actions on hover */}
          <div className="hidden group-hover:flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRenamingPath(node.path);
                setRenameValue(node.name);
              }}
              title="Rename"
              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => handleDelete(e, node.path)}
              title="Delete"
              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Children if folder */}
        {isFolder && !isCollapsed && node.children && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] border-r border-[#E2E8F0] select-none text-[#1E293B]">
      {/* Explorer Top Section Header */}
      <div className="h-9 px-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-[11px] font-semibold text-[#64748B] tracking-wider uppercase">
        <span className="truncate font-sans font-bold">
          {currentProject?.name ? `EXPLORER: ${currentProject.name}` : 'EXPLORER'}
        </span>
        <div className="flex items-center gap-0.5 text-slate-500">
          <button
            onClick={() => { setIsCreatingFile(true); setIsCreatingFolder(false); }}
            title="New File"
            className="p-1 hover:text-[#1E293B] hover:bg-slate-200/60 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setIsCreatingFolder(true); setIsCreatingFile(false); }}
            title="New Folder"
            className="p-1 hover:text-[#1E293B] hover:bg-slate-200/60 rounded transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => refreshFileTree()}
            title="Refresh File Tree"
            className="p-1 hover:text-[#1E293B] hover:bg-slate-200/60 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Creation Input */}
      {(isCreatingFile || isCreatingFolder) && (
        <div className="p-2 border-b border-[#E2E8F0] bg-[#FFFFFF]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateItem(isCreatingFolder ? 'directory' : 'file');
            }}
          >
            <input
              type="text"
              autoFocus
              placeholder={isCreatingFolder ? 'folder-name' : 'filename.ext'}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onBlur={() => {
                if (!newItemName) {
                  setIsCreatingFile(false);
                  setIsCreatingFolder(false);
                }
              }}
              className="w-full bg-[#FFFFFF] text-[#1E293B] text-xs px-2 py-1 rounded border border-blue-500 outline-none font-mono shadow-xs"
            />
          </form>
        </div>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {nodes.length === 0 ? (
          <div className="p-4 text-xs text-[#64748B] text-center">
            Workspace is empty.
          </div>
        ) : (
          nodes.map((node) => renderNode(node, 0))
        )}
      </div>
    </div>
  );
};
