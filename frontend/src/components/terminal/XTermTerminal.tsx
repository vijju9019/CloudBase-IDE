import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { io, Socket } from 'socket.io-client';

interface XTermTerminalProps {
  projectId: string;
}

export const XTermTerminal: React.FC<XTermTerminalProps> = ({ projectId }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // 1. Initialize xterm.js instance
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
      fontSize: 12.5,
      theme: {
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
      },
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

  return (
    <div className="h-full w-full bg-[#0F172A] p-2 overflow-hidden select-text">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
};
