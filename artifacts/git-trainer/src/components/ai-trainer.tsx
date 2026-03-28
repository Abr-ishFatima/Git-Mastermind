import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, RotateCcw, Lightbulb, BookOpen, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfidenceBadge } from './ui/confidence-badge';
import { useAiExplain, useAiCorrect } from '@workspace/api-client-react';
import { cn } from '../lib/utils';

interface AiTrainerProps {
  sessionId: string;
  lessonContext?: string;
  activeLessonDescription?: string;
  latestFeedback?: {
    feedback: string;
    confidence: 'high' | 'medium' | 'low';
    confidenceScore: number;
  } | null;
}

type Message = {
  role: 'ai' | 'user';
  content: string;
  confidence?: { level: 'high' | 'medium' | 'low'; score: number; reason: string };
  isCorrection?: boolean;
  correctionFor?: number;
};

const QUICK_QUESTIONS = [
  "Explain this concept",
  "Give me an example",
  "What's a common mistake?",
  "When should I use this?",
];

export function AiTrainer({ sessionId, lessonContext, activeLessonDescription, latestFeedback }: AiTrainerProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'ai', 
      content: "Hi! I'm your Personal Git Trainer. Ask me anything about Git, type a command in the terminal, or click a quick question below. I'll always show you how confident I am in my answer — and you can correct me anytime!",
      confidence: { level: 'high', score: 0.99, reason: 'System initialization' }
    }
  ]);
  const [input, setInput] = useState('');
  const [correctingIndex, setCorrectingIndex] = useState<number | null>(null);
  const [correctionInput, setCorrectionInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLessonRef = useRef<string | undefined>(undefined);

  const explainMutation = useAiExplain();
  const correctMutation = useAiCorrect();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Greet when a new lesson is selected
  useEffect(() => {
    if (lessonContext && lessonContext !== prevLessonRef.current) {
      prevLessonRef.current = lessonContext;
      const greeting = `📚 Now on: **${lessonContext}**\n\n${activeLessonDescription || ''}\n\nFeel free to ask me anything about this topic, or try the commands in the terminal!`;
      setMessages(prev => [...prev, {
        role: 'ai',
        content: greeting,
        confidence: { level: 'high', score: 0.96, reason: `Lesson context: ${lessonContext}` }
      }]);
    }
  }, [lessonContext, activeLessonDescription]);

  // Show terminal feedback in chat
  useEffect(() => {
    if (latestFeedback) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: latestFeedback.feedback,
        confidence: {
          level: latestFeedback.confidence,
          score: latestFeedback.confidenceScore,
          reason: "Based on your terminal command"
        }
      }]);
    }
  }, [latestFeedback]);

  const buildSmartConcept = (raw: string) => {
    if (!raw.trim()) return lessonContext || 'git basics';
    // If it looks like a quick action, combine with lesson
    const lc = raw.toLowerCase();
    if (lc === "explain this concept" && lessonContext) return lessonContext;
    if (lc === "give me an example" && lessonContext) return `example of ${lessonContext}`;
    if (lc === "what's a common mistake?" && lessonContext) return `common mistakes with ${lessonContext}`;
    if (lc === "when should i use this?" && lessonContext) return `when to use ${lessonContext}`;
    return raw.trim();
  };

  const handleSend = async (overrideText?: string) => {
    const text = overrideText ?? input;
    if (!text.trim()) return;
    if (!overrideText) setInput('');
    const userMsg = text;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const concept = buildSmartConcept(userMsg);
      const res = await explainMutation.mutateAsync({
        data: { sessionId, concept, lessonId: lessonContext, context: activeLessonDescription }
      });
      setMessages(prev => [...prev, {
        role: 'ai',
        content: res.explanation,
        confidence: { level: res.confidence as 'high'|'medium'|'low', score: res.confidenceScore, reason: res.confidenceReason }
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: "Sorry, I couldn't connect right now. Please try again.",
        confidence: { level: 'low', score: 0.1, reason: 'Connection error' }
      }]);
    }
  };

  const handleCorrectSubmit = async (msgIndex: number) => {
    if (!correctionInput.trim()) return;
    const original = messages[msgIndex];
    const corrText = correctionInput;
    setCorrectingIndex(null);
    setCorrectionInput('');
    setMessages(prev => [...prev, { role: 'user', content: `✏️ Correction: ${corrText}`, isCorrection: true, correctionFor: msgIndex }]);

    try {
      const res = await correctMutation.mutateAsync({
        data: { sessionId, originalExplanation: original.content, concept: lessonContext || 'git', userCorrection: corrText }
      });
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `${res.acknowledgment}\n\n${res.updatedExplanation}\n\n💡 ${res.thankYouMessage}`,
        confidence: { level: 'high', score: 0.92, reason: 'Updated based on your correction — thank you!' }
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: "Thanks for the correction! I've noted it." }]);
    }
  };

  const renderContent = (text: string) => {
    // Bold **text** and code `text`
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
      if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[0.8em] font-mono">{part.slice(1, -1)}</code>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="h-full flex flex-col bg-card/30 border-l border-border backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">AI Trainer</div>
            <div className="text-xs text-green-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
              Online & Adaptive
            </div>
          </div>
          {lessonContext && (
            <div className="ml-auto text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-medium truncate max-w-[110px]">
              {lessonContext}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "flex flex-col max-w-[92%]",
                msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              {/* Avatar */}
              <div className={cn("flex items-end gap-1.5 mb-1", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                  msg.role === 'ai' ? "bg-primary/20 border border-primary/30" : "bg-muted border border-border"
                )}>
                  {msg.role === 'ai' ? <Bot className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                {/* Bubble */}
                <div className={cn(
                  "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'user'
                    ? msg.isCorrection
                      ? "bg-orange-500/10 border border-orange-500/20 text-orange-200 rounded-tr-sm"
                      : "bg-primary/15 border border-primary/20 text-foreground rounded-tr-sm"
                    : "bg-card border border-border text-foreground rounded-tl-sm"
                )}>
                  <p className="whitespace-pre-line text-[0.82rem]">{renderContent(msg.content)}</p>
                </div>
              </div>

              {/* Confidence badge + correct button for AI messages */}
              {msg.role === 'ai' && msg.confidence && (
                <div className="ml-8 flex flex-col gap-1.5">
                  <ConfidenceBadge
                    level={msg.confidence.level}
                    score={msg.confidence.score}
                    reason={msg.confidence.reason}
                  />
                  {/* Correct the AI */}
                  {correctingIndex !== idx ? (
                    <button
                      onClick={() => { setCorrectingIndex(idx); setCorrectionInput(''); }}
                      className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Correct this answer
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-col gap-1.5"
                    >
                      <textarea
                        autoFocus
                        value={correctionInput}
                        onChange={e => setCorrectionInput(e.target.value)}
                        placeholder="What's the correct information?"
                        className="w-full text-xs bg-background border border-border rounded-lg p-2 resize-none focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
                        rows={3}
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleCorrectSubmit(idx)}
                          disabled={!correctionInput.trim() || correctMutation.isPending}
                          className="flex-1 text-xs bg-primary text-primary-foreground rounded-lg py-1.5 font-semibold hover:bg-primary/90 disabled:opacity-40 transition-all"
                        >
                          {correctMutation.isPending ? "Submitting..." : "Submit Correction"}
                        </button>
                        <button
                          onClick={() => setCorrectingIndex(null)}
                          className="text-xs bg-card border border-border rounded-lg px-2.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {(explainMutation.isPending || correctMutation.isPending) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 ml-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex gap-1 px-3 py-2 bg-card border border-border rounded-2xl rounded-tl-sm">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Questions */}
      <div className="px-3 pb-2 shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              disabled={explainMutation.isPending}
              className="text-[10px] px-2.5 py-1 bg-background border border-border rounded-full text-muted-foreground hover:border-primary/40 hover:text-primary transition-all disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex items-end gap-2 bg-background border border-border rounded-xl px-3 py-2 focus-within:border-primary/50 transition-colors">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask anything about Git…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none min-h-[36px] max-h-[100px]"
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || explainMutation.isPending}
            className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-40 shrink-0"
          >
            <Send className="w-3.5 h-3.5 text-primary-foreground" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
