import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Play, Trash2 } from 'lucide-react';
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

export function Terminal({ sessionId, lessonId, history, onAddEntry, onClear, onValidationResult }: TerminalProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateMutation = useValidateCommand();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    if (cmd === 'clear') {
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

      if (res.simulatedOutput) {
         onAddEntry('output', res.simulatedOutput);
      }
      
      if (res.feedback && !res.isCorrect) {
         onAddEntry('error', res.feedback);
      } else if (res.feedback && res.isCorrect) {
         onAddEntry('system', `Success! ${res.feedback}`);
      }

      if (onValidationResult) {
        onValidationResult(res);
      }

    } catch (err) {
      onAddEntry('error', 'Command validation failed. The API might be unavailable.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d14] rounded-xl border shadow-lg overflow-hidden flex-shrink-0 relative">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-white/5">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">bash ~ practice-repo</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onClear} className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground transition-colors" title="Clear terminal">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Output Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2" onClick={() => inputRef.current?.focus()}>
        {history.map((item) => (
          <div key={item.id} className="leading-relaxed">
            {item.type === 'input' && (
              <div className="flex gap-2 text-foreground">
                <span className="text-accent shrink-0">➜</span>
                <span className="text-primary font-medium">~</span>
                <span className="text-foreground">{item.content}</span>
              </div>
            )}
            {item.type === 'output' && (
              <div className="text-muted-foreground whitespace-pre-wrap pl-6">{item.content}</div>
            )}
            {item.type === 'error' && (
              <div className="text-destructive whitespace-pre-wrap pl-6 border-l-2 border-destructive/50 bg-destructive/5 py-1 px-2 rounded-r">{item.content}</div>
            )}
            {item.type === 'system' && (
              <div className="text-success whitespace-pre-wrap pl-6 italic opacity-80">{item.content}</div>
            )}
          </div>
        ))}
        {validateMutation.isPending && (
          <div className="text-muted-foreground pl-6 animate-pulse">Running command...</div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 pt-0 flex gap-2 items-center bg-[#0d0d14]">
        <span className="text-accent font-mono shrink-0">➜</span>
        <span className="text-primary font-mono font-medium">~</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent outline-none border-none text-foreground font-mono placeholder:text-muted-foreground/30 focus:ring-0"
          placeholder="type a git command..."
          autoComplete="off"
          spellCheck="false"
          disabled={validateMutation.isPending}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || validateMutation.isPending}
          className="p-1.5 rounded-md bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
