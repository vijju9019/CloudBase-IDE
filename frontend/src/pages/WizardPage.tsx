import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Code2,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  Server
} from 'lucide-react';
import { api } from '../services/api';

export const WizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialLang = searchParams.get('lang') || 'python';

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState(initialLang);
  const [template, setTemplate] = useState('default');
  const [cpuLimit, setCpuLimit] = useState(1.0);
  const [memoryLimitMb, setMemoryLimitMb] = useState(1024);
  const [networkEnabled, setNetworkEnabled] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [creationStatus, setCreationStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const languages = [
    { id: 'python', name: 'Python', version: '3.12-slim', desc: 'Ideal for scripts, algorithms, data science & AI', icon: 'Py', color: 'from-blue-600 to-indigo-600' },
    { id: 'node', name: 'Node.js', version: '22-slim', desc: 'JavaScript backend services, REST APIs & tools', icon: 'JS', color: 'from-emerald-600 to-teal-600' },
    { id: 'react', name: 'React SPA', version: 'Vite + React 18', desc: 'Frontend web application with live browser preview', icon: '⚛', color: 'from-cyan-600 to-blue-600' },
    { id: 'java', name: 'Java', version: '21 Temurin JDK', desc: 'Robust enterprise applications and object-oriented code', icon: '☕', color: 'from-amber-600 to-orange-600' },
    { id: 'cpp', name: 'C++', version: 'GCC 13', desc: 'High performance systems, algorithms, & native execution', icon: 'C++', color: 'from-indigo-600 to-purple-600' },
    { id: 'go', name: 'Go', version: '1.22 Alpine', desc: 'Lightweight, concurrent cloud services & microservices', icon: 'Go', color: 'from-sky-600 to-cyan-600' },
  ];

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError('Please enter a project name.');
        return;
      }
      if (!/^[a-zA-Z0-9_\-\s]+$/.test(name)) {
        setError('Project name may only contain alphanumeric characters, spaces, dashes, or underscores.');
        return;
      }
    }
    setStep(s => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    setError(null);
    setStep(s => Math.max(s - 1, 1));
  };

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    setCreationStatus('Configuring Storage Guardian isolated workspace...');

    try {
      await new Promise(r => setTimeout(r, 400));
      setCreationStatus('Populating starter files and environment manifest...');

      const project = await api.createProject({
        name: name.trim(),
        language,
        template,
        cpuLimit,
        memoryLimitMb,
        networkEnabled
      });

      setCreationStatus('Project workspace initialized successfully! Launching IDE...');
      await new Promise(r => setTimeout(r, 600));

      navigate(`/ide/${project.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      setIsCreating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F8FAFC] p-6 lg:p-12 flex flex-col items-center justify-center select-none text-[#1E293B]">
      <div className="max-w-2xl w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm relative">
        {/* Step Indicator Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-mono mb-3">
            <span>STEP {step} OF 4</span>
            <span className="text-blue-600 font-semibold">
              {step === 1 ? 'Project Details' :
               step === 2 ? 'Select Runtime' :
               step === 3 ? 'Container Limits & Security' : 'Review & Initialize'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Name */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#1E293B] tracking-tight">Name Your Project</h2>
              <p className="text-xs text-[#64748B] mt-1">
                A dedicated, isolated workspace directory will be created strictly inside Storage Guardian's Projects directory.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">
                Project Name
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. My Algorithm Hub"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white text-[#1E293B] text-sm px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-2xs"
              />
              <p className="text-[11px] text-[#64748B] mt-2 font-mono">
                Project directory: %LOCALAPPDATA%\CloudBaseIDE\Projects\{name ? name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'project-id'}
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Language & Template */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#1E293B] tracking-tight">Choose Development Environment</h2>
              <p className="text-xs text-[#64748B] mt-1">
                Select the programming language and container image for your project.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {languages.map((l) => (
                <div
                  key={l.id}
                  onClick={() => setLanguage(l.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 shadow-2xs ${
                    language === l.id
                      ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                      : 'bg-white border-[#E2E8F0] hover:border-slate-400'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${l.color} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}>
                    {l.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-[#1E293B]">{l.name}</h4>
                      <span className="text-[10px] text-[#64748B] font-mono">({l.version})</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5 leading-tight">{l.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Limits & Security */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#1E293B] tracking-tight">Environment & Security Boundaries</h2>
              <p className="text-xs text-[#64748B] mt-1">
                Configure container CPU, memory allocations, and network access policy.
              </p>
            </div>

            <div className="space-y-4">
              {/* CPU limit */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium text-slate-700">CPU Allocation:</span>
                  <span className="font-mono text-blue-600 font-bold">{cpuLimit} Cores</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.5"
                  value={cpuLimit}
                  onChange={(e) => setCpuLimit(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Memory limit */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium text-slate-700">Memory Allocation:</span>
                  <span className="font-mono text-purple-600 font-bold">{memoryLimitMb} MB</span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="4096"
                  step="256"
                  value={memoryLimitMb}
                  onChange={(e) => setMemoryLimitMb(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Network permission toggle */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#1E293B]">Enable Container Network Access</span>
                    {networkEnabled && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded font-medium">
                        Internet Allowed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Default is disabled for security. Enable when installing dependencies (pip, npm).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={networkEnabled}
                  onChange={(e) => setNetworkEnabled(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#1E293B] tracking-tight">Review & Create Project</h2>
              <p className="text-xs text-[#64748B] mt-1">
                Verify the configured options before initializing your project environment.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-[#64748B]">Project Name:</span>
                <span className="font-bold text-[#1E293B]">{name}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-[#64748B]">Runtime Language:</span>
                <span className="font-semibold text-blue-600 capitalize">{language}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-[#64748B]">Resource Limits:</span>
                <span className="text-slate-800">{cpuLimit} CPU Cores | {memoryLimitMb} MB RAM</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-[#64748B]">Network Permission:</span>
                <span className={networkEnabled ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                  {networkEnabled ? 'Enabled (Internet access allowed)' : 'Restricted (Isolated default)'}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-[#64748B]">Storage Guardian Isolation:</span>
                <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Enforced
                </span>
              </div>
            </div>

            {isCreating && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                <span className="text-xs text-blue-700 font-medium">{creationStatus}</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1 || isCreating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-[1.01]"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-[1.01]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCreating ? 'Creating Project...' : 'Initialize Project'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
