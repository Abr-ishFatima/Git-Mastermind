import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Trash2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useValidateCommand } from '@workspace/api-client-react';
import { TerminalHistoryItem } from '@/store/use-app-state';

interface TerminalProps {
  sessionId: string;
  lessonId: string | null;
  history: TerminalHistoryItem[];
  onAddEntry: (type: TerminalHistoryItem['type'], content: string) => void;
  onClear: () => void;
  onValidationResult?: (res: any) => void;
}

const HISTORY_STORAGE_KEY = 'git-trainer-cmd-history';

export function Terminal({ sessionId, lessonId, history, onAddEntry, onClear, onValidationResult }: TerminalProps) {
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [histIdx, setHistIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const validateMutation = useValidateCommand();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const pushCmdHistory = (cmd: string) => {
    const updated = [cmd, ...cmdHistory.filter(c => c !== cmd)].slice(0, 50);
    setCmdHistory(updated);
    setHistIdx(-1);
    try { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated)); } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, cmdHistory.length - 1);
      setHistIdx(next);
      setInput(cmdHistory[next] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? '' : cmdHistory[next] || '');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion for common commands
      const completions = ['git init', 'git add .', 'git add -p', 'git commit -m ""', 'git status', 'git log', 'git log --oneline', 'git branch', 'git switch -c ', 'git merge ', 'git stash', 'git stash pop', 'git push origin main', 'git pull', 'git rebase main', 'git cherry-pick ', 'git reset HEAD~1', 'git revert HEAD', 'git diff', 'git fetch', 'git remote -v'];
      const match = completions.find(c => c.startsWith(input) && c !== input);
      if (match) setInput(match);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    pushCmdHistory(cmd);

    // Handle clear locally without API call
    if (cmd.toLowerCase() === 'clear') {
      onClear();
      setInput('');
      return;
    }

    onAddEntry('input', cmd);
    setInput('');

    try {
      const res = await validateMutation.mutateAsync({
        data: {
          sessionId,
          command: cmd,
          lessonContext: lessonId || undefined
        }
      });

      // Handle special clear signal from API
      if (res.simulatedOutput === '__CLEAR__') {
        onClear();
        return;
      }

      // Show simulated output (only if there's real content)
      if (res.simulatedOutput && res.simulatedOutput.trim()) {
        onAddEntry('output', res.simulatedOutput);
      }

      // Show error feedback for failed commands
      if (!res.isCorrect && res.feedback) {
        onAddEntry('error', res.feedback);
        if ((res as any).hint) onAddEntry('system', `💡 ${(res as any).hint}`);
      }

      if (onValidationResult) onValidationResult(res);

    } catch {
      onAddEntry('error', 'Could not connect to the command validator. Check your connection.');
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-[#0d0d14] rounded-xl border border-white/8 shadow-2xl overflow-hidden relative"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#111118] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          {/* macOS-style dots */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <div className="flex items-center gap-1.5 ml-1">
            <TerminalIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">bash — practice-repo</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/50 font-mono hidden md:block">↑↓ history · Tab to complete</span>
          <button
            onClick={e => { e.stopPropagation(); onClear(); }}
            className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Clear terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1.5">
        {history.length === 0 && (
          <div className="text-muted-foreground/40 text-xs">
            <p className="text-green-400/60">Git Mastermind Terminal Simulator v1.0</p>
            <p className="mt-1">Type any git command and press Enter to run it.</p>
            <p>Use ↑↓ arrow keys to navigate command history. Press Tab to auto-complete.</p>
            <p className="mt-2 text-primary/50">Try: <span className="text-primary/70">git init</span> → <span className="text-primary/70">git add .</span> → <span className="text-primary/70">git commit -m "first commit"</span></p>
          </div>
        )}
        {history.map((item) => (
          <div key={item.id} className="leading-relaxed">
            {item.type === 'input' && (
              <div className="flex gap-2 text-foreground">
                <span className="text-green-400 shrink-0 select-none">➜</span>
                <span className="text-blue-400 font-medium select-none">~/practice-repo</span>
                <span className="text-muted-foreground select-none">git:(</span>
                <span className="text-yellow-400 select-none">main</span>
                <span className="text-muted-foreground select-none">)</span>
                <span className="text-foreground">{item.content}</span>
              </div>
            )}
            {item.type === 'output' && (
              <pre className="text-[#a8b3cf] whitespace-pre-wrap pl-4 text-xs leading-relaxed">{item.content}</pre>
            )}
            {item.type === 'error' && (
              <div className="text-red-400 whitespace-pre-wrap pl-4 text-xs bg-red-500/5 border-l-2 border-red-500/40 py-1 rounded-r">
                {item.content}
              </div>
            )}
            {item.type === 'system' && (
              <div className="text-emerald-400/80 whitespace-pre-wrap pl-4 text-xs italic">
                {item.content}
              </div>
            )}
          </div>
        ))}
        {validateMutation.isPending && (
          <div className="flex items-center gap-2 pl-4 text-muted-foreground text-xs animate-pulse">
            <span className="inline-block w-2 h-2 bg-primary rounded-full animate-bounce" />
            running...
          </div>
        )}
      </div>

      {/* Input row */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 bg-[#0d0d14] border-t border-white/5 shrink-0"
      >
        <span className="text-green-400 font-mono select-none">➜</span>
        <span className="text-blue-400 font-mono font-medium select-none">~/practice-repo</span>
        <span className="text-muted-foreground font-mono select-none">git:(</span>
        <span className="text-yellow-400 font-mono select-none">main</span>
        <span className="text-muted-foreground font-mono select-none">)</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none border-none text-foreground font-mono text-sm placeholder:text-muted-foreground/25 focus:ring-0"
          placeholder="type a git command..."
          autoComplete="off"
          spellCheck={false}
          autoFocus
          disabled={validateMutation.isPending}
        />
        <button
          type="submit"
          disabled={!input.trim() || validateMutation.isPending}
          className="p-1.5 rounded-md bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30"
        >
          <Play className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
