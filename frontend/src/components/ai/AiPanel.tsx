import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  FileCode,
  Wrench,
  Eye,
  Check,
  ChevronDown,
  Trash2,
  HelpCircle,
  X
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../services/api';
import { ModificationProposal } from '../../types';
import { ChatMessageView } from './ChatMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export const AiPanel: React.FC = () => {
  const { currentProject, openTabs, activeTabPath, setActiveProposal, executionOutput } = useProjectStore();
  const { ollama, refreshStatus } = useAppStore();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `👋 **Hello! I'm CloudBase AI**, your local-first coding assistant.\n\nI can analyze your codebase, write functions, propose file changes, and debug errors. What would you like to build today?`
    }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('qwen2.5-coder:1.5b');
  const [pendingProposal, setPendingProposal] = useState<ModificationProposal | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeTab = openTabs.find((t) => t.path === activeTabPath);

  useEffect(() => {
    if (ollama?.models && ollama.models.length > 0) {
      setSelectedModel(ollama.models[0].name);
    }
  }, [ollama]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Smooth typewriter streamer for assistant responses like ChatGPT
  const streamAssistantResponse = async (fullReply: string) => {
    const msgId = 'msg-' + Date.now();
    const newMsg: Message = { id: msgId, role: 'assistant', content: '', isStreaming: true };
    setMessages((prev) => [...prev, newMsg]);

    const words = fullReply.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];
      const snapshot = currentText;

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, content: snapshot } : m))
      );

      // Natural typing cadence (10ms - 22ms per word)
      await new Promise((r) => setTimeout(r, Math.min(22, Math.max(10, 200 / words.length))));
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, isStreaming: false } : m))
    );
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || !currentProject || isSending) return;

    const userMsg: Message = { id: 'u-' + Date.now(), role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setIsSending(true);

    try {
      const res = await api.sendAiChat(
        currentProject.id,
        textToSend,
        selectedModel,
        undefined,
        activeTab?.path,
        activeTab?.content
      );

      await streamAssistantResponse(res.reply);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: 'err-' + Date.now(), role: 'assistant', content: `⚠️ **AI Notice**: ${err.message}` }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Quick Action: Explain Code
  const handleExplainCode = async () => {
    if (!activeTab) {
      alert('Please open a file in the editor first to explain it.');
      return;
    }
    const prompt = `Please explain the code in "${activeTab.path}".`;
    await handleSend(prompt);
  };

  // Quick Action: Debug Errors
  const handleDebugError = async () => {
    const errText = executionOutput || 'No active terminal errors captured.';
    const prompt = `Debug this execution output / error:\n\`\`\`\n${errText.slice(0, 1000)}\n\`\`\``;
    await handleSend(prompt);
  };

  // Quick Action: Propose File Change
  const handleProposeChange = async () => {
    if (!currentProject || !activeTab) {
      alert('Please open a file to propose changes for.');
      return;
    }

    const instruction = prompt('What modifications would you like the AI to make to ' + activeTab.path + '?');
    if (!instruction) return;

    const userMsg: Message = {
      id: 'u-' + Date.now(),
      role: 'user',
      content: `Propose change for ${activeTab.path}: ${instruction}`
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const proposal = await api.proposeFileChange(
        currentProject.id,
        instruction,
        activeTab.path,
        selectedModel
      );

      setPendingProposal(proposal);
      await streamAssistantResponse(
        `✨ I have analyzed your request and prepared a code change proposal for **${activeTab.path}**.\n\nClick **"Review Diff"** above to inspect the side-by-side Monaco diff before applying.`
      );
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: 'err-' + Date.now(), role: 'assistant', content: `Proposal error: ${err.message}` }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'fresh-1',
        role: 'assistant',
        content: `Chat history cleared. How can I help you next with your code?`
      }
    ]);
  };

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] border-l border-[#E2E8F0] select-none text-[#1E293B]">
      {/* AI Header with ChatGPT-Mode Active Status */}
      <div className="h-10 px-3 border-b border-[#E2E8F0] flex items-center justify-between bg-[#FFFFFF] shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-600 text-white shadow-xs">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs text-[#1E293B]">CloudBase AI</h3>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Model dropdown / Setup info / Clear Chat */}
        <div className="flex items-center gap-1">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-50 text-[#1E293B] text-[11px] font-mono px-2 py-0.5 rounded border border-[#CBD5E1] outline-none max-w-[125px]"
          >
            {ollama?.models && ollama.models.length > 0 ? (
              ollama.models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))
            ) : (
              <>
                <option value="qwen2.5-coder:1.5b">qwen2.5-coder:1.5b</option>
                <option value="qwen2.5-coder:3b">qwen2.5-coder:3b</option>
                <option value="qwen2.5-coder:7b">qwen2.5-coder:7b</option>
              </>
            )}
          </select>

          <button
            onClick={handleClearChat}
            title="Clear Chat Conversation"
            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowSetupModal(true)}
            title="Ollama Setup & Model Instructions"
            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Action Chips */}
      <div className="px-3 py-1.5 border-b border-[#E2E8F0] bg-[#FFFFFF] flex flex-wrap gap-1.5">
        <button
          onClick={handleExplainCode}
          disabled={isSending}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-[11px] transition-colors shadow-2xs font-medium"
        >
          <FileCode className="w-3 h-3 text-blue-600" />
          <span>Explain File</span>
        </button>

        <button
          onClick={handleDebugError}
          disabled={isSending}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 text-[11px] transition-colors shadow-2xs font-medium"
        >
          <Wrench className="w-3 h-3 text-amber-600" />
          <span>Debug Error</span>
        </button>

        <button
          onClick={handleProposeChange}
          disabled={isSending}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-800 border border-slate-200 text-[11px] transition-colors shadow-2xs font-medium"
        >
          <Sparkles className="w-3 h-3 text-purple-600" />
          <span>Propose Edit</span>
        </button>
      </div>

      {/* Pending Proposal Banner */}
      {pendingProposal && pendingProposal.status === 'pending' && (
        <div className="p-2.5 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Proposed Diff Ready
            </div>
            <p className="text-[10px] text-blue-700 mt-0.5 font-mono truncate max-w-[180px]">
              {pendingProposal.changes[0]?.filePath}
            </p>
          </div>
          <button
            onClick={() => setActiveProposal(pendingProposal)}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Review Diff</span>
          </button>
        </div>
      )}

      {/* Messages List with ChatGPT-Style Rendering */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 select-text">
        {messages.map((m) => (
          <ChatMessageView
            key={m.id}
            role={m.role}
            content={m.content}
            isStreaming={m.isStreaming}
            onSuggestionClick={(sug) => handleSend(sug)}
          />
        ))}

        {isSending && !messages.some((m) => m.isStreaming) && (
          <div className="flex items-center gap-2 text-xs text-blue-700 p-2.5 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
            <Bot className="w-4 h-4 animate-spin text-blue-600" />
            <span>CloudBase AI is thinking and formulating response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-2.5 border-t border-[#E2E8F0] bg-[#FFFFFF]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask CloudBase AI (ChatGPT Mode)..."
            value={input}
            disabled={isSending}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-white text-[#1E293B] text-xs px-3 py-2 rounded-lg border border-[#CBD5E1] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-xs"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-all shadow-xs"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Ollama Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-[#1E293B] text-base">Local AI Engine Configuration</h3>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              CloudBase AI runs 100% locally on your machine. You can connect it to local Ollama neural models or use the built-in offline coding engine.
            </p>

            <div className="space-y-3 text-xs font-mono bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <p className="text-[#64748B] font-sans text-[11px] mb-1">1. Install Ollama for Windows:</p>
                <p className="text-blue-600">https://ollama.com/download</p>
              </div>
              <div>
                <p className="text-[#64748B] font-sans text-[11px] mb-1">2. Download Qwen2.5-Coder model:</p>
                <p className="text-emerald-700">$ ollama pull qwen2.5-coder:1.5b</p>
              </div>
              <div>
                <p className="text-[#64748B] font-sans text-[11px] mb-1">3. Start the local service:</p>
                <p className="text-emerald-700">$ ollama serve</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => {
                  refreshStatus();
                  setShowSetupModal(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                Check Local AI Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
