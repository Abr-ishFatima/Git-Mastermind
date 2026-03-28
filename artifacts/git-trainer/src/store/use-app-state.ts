import { useState, useCallback } from 'react';
import { LessonDetail } from '@workspace/api-client-react';

// Simple lightweight state management to share state between siblings
// Usually we'd use Zustand, but React state + Context is fine here.
// We'll just export a custom hook that the main App layout uses and passes down.

export type TerminalHistoryItem = {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
};

export function useAppState() {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [terminalHistory, setTerminalHistory] = useState<TerminalHistoryItem[]>([
    { id: 'init-1', type: 'system', content: 'Welcome to Personal AI Git Trainer v1.0.0' },
    { id: 'init-2', type: 'system', content: 'Select a lesson to begin or type a git command.' }
  ]);
  
  // Simulated local git tree state for visualizer
  const [gitNodes, setGitNodes] = useState<any[]>([
    { id: 'init', hash: 'e3b0c44', message: 'Initial commit', branch: 'main', color: 'var(--color-branch-main)', x: 0, y: 0 }
  ]);

  const addTerminalEntry = useCallback((type: TerminalHistoryItem['type'], content: string) => {
    setTerminalHistory(prev => [...prev, { id: Math.random().toString(36).substring(7), type, content }]);
  }, []);

  const clearTerminal = useCallback(() => {
    setTerminalHistory([]);
  }, []);

  return {
    selectedLessonId,
    setSelectedLessonId,
    terminalHistory,
    addTerminalEntry,
    clearTerminal,
    gitNodes,
    setGitNodes
  };
}
