import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { io, Socket } from 'socket.io-client';
import { useProjectStore } from '../../store/useProjectStore';
import { useAppStore } from '../../store/useAppStore';

interface XTermTerminalProps {
  projectId: string;
}

export const XTermTerminal: React.FC<XTermTerminalProps> = ({ projectId }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const terminalRunTrigger = useProjectStore((s) => s.terminalRunTrigger);
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const lastTriggerTimeRef = useRef<number>(0);

  const getTerminalTheme = (dark: boolean) => {
    if (dark) {
      return {
        background: '#0F172A',
        foreground: '#F8FAFC',
        cursor: '#38BDF8',
        selectionBackground: '#3B82F650',
        black: '#1E293B',
        red: '#EF4444',
        green: '#10B981',
        yellow: '#F59E0B',
        blue: '#3B82F6',
        magenta: '#8B5CF6',
        cyan: '#06B6D4',
        white: '#F8FAFC',
      };
    }
    return {
      background: '#FFFFFF',
      foreground: '#0F172A',
      cursor: '#2563EB',
      selectionBackground: '#BFDBFE',
      black: '#0F172A',
      red: '#DC2626',
      green: '#16A34A',
      yellow: '#D97706',
      blue: '#2563EB',
      magenta: '#9333EA',
      cyan: '#0891B2',
      white: '#FFFFFF',
    };
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    // 1. Initialize xterm.js instance with active theme
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
      fontSize: 12.5,
      theme: getTerminalTheme(isDark),
      convertEol: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermInstance.current = term;
    fitAddonRef.current = fitAddon;

    // 2. Connect to backend WebSocket
    const socket = io({
      path: '/socket.io'
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('terminal:init', {
        projectId,
        cols: term.cols,
        rows: term.rows
      });
    });

    socket.on('terminal:data', (data: string) => {
      term.write(data);
    });

    // 3. User keystroke input sent to backend container shell
    term.onData((data) => {
      socket.emit('terminal:input', { data });
    });

    // Resize handling
    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch {}
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.disconnect();
      term.dispose();
    };
  }, [projectId]);

  // Synchronize terminal theme on dark/light mode toggle
  useEffect(() => {
    if (xtermInstance.current) {
      xtermInstance.current.options.theme = getTerminalTheme(isDark);
    }
  }, [isDark]);

  // Handle external Run Code button clicks
  useEffect(() => {
    if (!terminalRunTrigger || !socketRef.current) return;
    if (terminalRunTrigger.timestamp <= lastTriggerTimeRef.current) return;

    lastTriggerTimeRef.current = terminalRunTrigger.timestamp;

    if (terminalRunTrigger.command === '\x03') {
      // Send Ctrl+C interrupt
      socketRef.current.emit('terminal:input', { data: '\x03' });
    } else if (terminalRunTrigger.command) {
      socketRef.current.emit('terminal:run', {
        command: terminalRunTrigger.command,
        filePath: terminalRunTrigger.filePath
      });
    }
  }, [terminalRunTrigger]);

  return (
    <div className={`h-full w-full ${isDark ? 'bg-[#0F172A]' : 'bg-[#FFFFFF]'} p-2 overflow-hidden select-text transition-colors`}>
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
};
