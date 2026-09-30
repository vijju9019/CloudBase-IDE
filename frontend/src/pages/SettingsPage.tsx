import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Cpu,
  Bot,
  ShieldCheck,
  Save,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export const SettingsPage: React.FC = () => {
  const { docker, ollama, refreshStatus } = useAppStore();
  const [settings, setSettings] = useState<any>(null);
  const [ollamaUrl, setOllamaUrl] = useState('http://127.0.0.1:11434');
  const [defaultCpu, setDefaultCpu] = useState(1.0);
  const [defaultMemory, setDefaultMemory] = useState(1024);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    api.getSettings().then((data) => {
      setSettings(data);
      if (data.ai?.ollamaUrl) setOllamaUrl(data.ai.ollamaUrl);
      if (data.docker?.defaultCpuLimit) setDefaultCpu(data.docker.defaultCpuLimit);
      if (data.docker?.defaultMemoryLimitMb) setDefaultMemory(data.docker.defaultMemoryLimitMb);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await api.updateSettings({
        ollamaUrl,
        defaultCpuLimit: defaultCpu,
        defaultMemoryLimitMb: defaultMemory
      });
      await refreshStatus();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-8 select-none text-[#1E293B]">
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 lg:p-8 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="w-7 h-7 text-blue-600" />
            Configuration & Settings
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-2xl leading-relaxed">
            Configure local Docker parameters, offline AI endpoints, resource limits, and Storage Guardian defaults.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* Docker Settings Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-600" />
            <span>Docker Engine Settings</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#64748B] font-medium mb-1">Docker Daemon Connection</label>
              <input
                type="text"
                disabled
                value={settings?.docker?.socketPath || '//./pipe/dockerDesktopLinuxEngine'}
                className="w-full bg-slate-50 text-slate-500 p-2.5 rounded-lg border border-slate-200 font-mono shadow-2xs"
              />
              <span className="text-[10px] text-[#64748B] mt-1 block">
                Status: {docker?.available ? 'Connected (WSL2)' : 'Stopped'}
              </span>
            </div>

            <div>
              <label className="block text-[#64748B] font-medium mb-1">Default CPU Limit (Cores)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="8"
                value={defaultCpu}
                onChange={(e) => setDefaultCpu(parseFloat(e.target.value))}
                className="w-full bg-white text-[#1E293B] p-2.5 rounded-lg border border-[#CBD5E1] focus:border-blue-500 outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[#64748B] font-medium mb-1">Default Container RAM (MB)</label>
              <input
                type="number"
                step="256"
                min="512"
                max="8192"
                value={defaultMemory}
                onChange={(e) => setDefaultMemory(parseInt(e.target.value, 10))}
                className="w-full bg-white text-[#1E293B] p-2.5 rounded-lg border border-[#CBD5E1] focus:border-blue-500 outline-none shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* AI Agent Settings Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-600" />
            <span>Local Offline AI Settings</span>
          </h2>

          <div className="text-xs space-y-3">
            <div>
              <label className="block text-[#64748B] font-medium mb-1">Ollama Service Base URL</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="w-full bg-white text-[#1E293B] p-2.5 rounded-lg border border-[#CBD5E1] focus:border-blue-500 outline-none font-mono shadow-2xs"
              />
              <span className="text-[10px] text-[#64748B] mt-1 block">
                Default: http://127.0.0.1:11434. Ollama runs locally on your machine.
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-700 font-medium">Detected Installed Models:</span>
                <span className="text-purple-600 font-mono ml-2 font-medium">
                  {ollama?.models?.map(m => m.name).join(', ') || 'None (Using Heuristic Assistant)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => refreshStatus()}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Probe</span>
              </button>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-[1.01]"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>

          {savedSuccess && (
            <span className="text-xs text-emerald-700 flex items-center gap-1 font-semibold animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              Settings successfully updated!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
