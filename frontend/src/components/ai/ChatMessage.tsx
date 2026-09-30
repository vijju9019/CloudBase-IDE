import React, { useState } from 'react';
import { Copy, Check, FileCode, ArrowDownToLine, Sparkles } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  onSuggestionClick?: (prompt: string) => void;
}

export const ChatMessageView: React.FC<ChatMessageProps> = ({
  role,
  content,
  isStreaming,
  onSuggestionClick
}) => {
  const { openTabs, activeTabPath, updateTabContent } = useProjectStore();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [insertedIndex, setInsertedIndex] = useState<number | null>(null);

  const activeTab = openTabs.find((t) => t.path === activeTabPath);

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleInsertIntoFile = (code: string, index: number) => {
    if (!activeTab) {
      alert('Please open a file in the editor first to insert code.');
      return;
    }

    const currentContent = activeTab.content;
    const separator = currentContent.endsWith('\n') ? '\n' : '\n\n';
    const newContent = `${currentContent}${separator}# Added by CloudBase AI Assistant\n${code}\n`;

    updateTabContent(activeTab.path, newContent);
    setInsertedIndex(index);
    setTimeout(() => setInsertedIndex(null), 2000);
  };

  // Helper to split markdown into text and code blocks
  const renderFormattedContent = (rawText: string) => {
    const parts = rawText.split(/(```[\w-]*\n[\s\S]*?\n```)/g);

    return parts.map((part, index) => {
      const codeMatch = part.match(/```([\w-]*)\n([\s\S]*?)\n```/);

      if (codeMatch) {
        const lang = codeMatch[1] || 'code';
        const codeText = codeMatch[2];

        return (
          <div
            key={index}
            className="my-3 rounded-lg overflow-hidden border border-[#334155] bg-[#0F172A] shadow-md text-left"
          >
            {/* Code Block Header */}
            <div className="h-8 bg-[#1E293B] px-3 border-b border-[#334155] flex items-center justify-between text-[11px] font-mono text-slate-300 select-none">
              <span className="flex items-center gap-1.5 text-blue-400 font-semibold uppercase">
                <FileCode className="w-3.5 h-3.5" />
                {lang}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(codeText, index)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors"
                  title="Copy code to clipboard"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-sans">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="font-sans">Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleInsertIntoFile(codeText, index)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 transition-colors"
                  title={activeTab ? `Insert into ${activeTab.name}` : 'Open file first to insert'}
                >
                  {insertedIndex === index ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-sans">Inserted!</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="w-3 h-3" />
                      <span className="font-sans">Insert into File</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Content */}
            <pre className="p-3 text-[12px] font-mono text-slate-100 overflow-x-auto leading-relaxed select-text">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      // Format markdown text with headers, bold, bullet points
      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-1.5 leading-relaxed text-left">
          {lines.map((line, lIdx) => {
            if (line.startsWith('### ')) {
              return (
                <h4 key={lIdx} className="text-xs font-bold text-[#1E293B] mt-2 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  {line.replace('### ', '')}
                </h4>
              );
            }
            if (line.startsWith('## ')) {
              return <h3 key={lIdx} className="text-xs font-bold text-blue-700 mt-2">{line.replace('## ', '')}</h3>;
            }
            if (line.startsWith('- ') || line.startsWith('* ')) {
              return (
                <div key={lIdx} className="flex items-start gap-1.5 pl-2 text-slate-700">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{formatInline(line.slice(2))}</span>
                </div>
              );
            }
            if (!line.trim()) {
              return <div key={lIdx} className="h-1.5" />;
            }
            return <p key={lIdx} className={role === 'user' ? 'text-white' : 'text-[#334155]'}>{formatInline(line)}</p>;
          })}
        </div>
      );
    });
  };

  // Helper for inline bold and code tags
  const formatInline = (text: string) => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((seg, i) => {
      if (seg.startsWith('`') && seg.endsWith('`')) {
        return (
          <code
            key={i}
            className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
              role === 'user'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-blue-700 border border-slate-200'
            }`}
          >
            {seg.slice(1, -1)}
          </code>
        );
      }
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return (
          <strong key={i} className={`font-semibold ${role === 'user' ? 'text-white' : 'text-[#1E293B]'}`}>
            {seg.slice(2, -2)}
          </strong>
        );
      }
      return seg;
    });
  };

  // Contextual suggested follow-up prompts
  const suggestions = [
    '💡 Explain this step-by-step',
    '🧪 Write unit tests for this',
    '⚡ Optimize performance',
    '🚀 How do I run this?'
  ];

  return (
    <div className={`flex flex-col ${role === 'user' ? 'items-end' : 'items-start'} my-2`}>
      <div
        className={`max-w-[94%] rounded-xl p-3 text-xs shadow-xs ${
          role === 'user'
            ? 'bg-blue-600 text-white rounded-tr-none'
            : 'bg-[#FFFFFF] text-[#1E293B] border border-[#E2E8F0] rounded-tl-none shadow-xs'
        }`}
      >
        {renderFormattedContent(content)}
        {isStreaming && (
          <span className="inline-block w-1.5 h-3.5 bg-blue-600 ml-1 animate-pulse" />
        )}
      </div>

      <div className="flex items-center gap-2 mt-1 px-1">
        <span className="text-[10px] text-[#94A3B8] font-medium">
          {role === 'user' ? 'You' : 'CloudBase AI (ChatGPT Mode)'}
        </span>
      </div>

      {/* Suggested Follow-ups for Assistant Responses */}
      {role === 'assistant' && !isStreaming && onSuggestionClick && (
        <div className="flex flex-wrap gap-1.5 mt-2 pl-1 select-none">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick(s)}
              className="text-[10px] px-2.5 py-1 rounded-full bg-[#FFFFFF] hover:bg-blue-50 text-[#475569] hover:text-blue-700 border border-[#E2E8F0] hover:border-blue-300 transition-colors shadow-2xs"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
