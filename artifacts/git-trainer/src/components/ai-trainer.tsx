import React, { useState } from 'react';
import { Bot, Send, User, ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfidenceBadge } from './ui/confidence-badge';
import { useAiExplain, useAiCorrect } from '@workspace/api-client-react';
import { cn } from '../lib/utils';

interface AiTrainerProps {
  sessionId: string;
  lessonContext?: string;
  latestFeedback?: {
    feedback: string;
    confidence: 'high' | 'medium' | 'low';
    confidenceScore: number;
  } | null;
}

export function AiTrainer({ sessionId, lessonContext, latestFeedback }: AiTrainerProps) {
  const [messages, setMessages] = useState<{role: 'ai'|'user', content: string, confidence?: any, isCorrection?: boolean}[]>([
    { 
      role: 'ai', 
      content: "Hello! I'm your Personal Git Trainer. I monitor your commands and explain concepts. You can also ask me questions directly, or correct me if I'm wrong!",
      confidence: { level: 'high', score: 0.99, reason: 'System initialization message' }
    }
  ]);
  const [input, setInput] = useState('');
  const [isCorrecting, setIsCorrecting] = useState<number | null>(null); // index of message being corrected
  const [correctionInput, setCorrectionInput] = useState('');

  const explainMutation = useAiExplain();
  const correctMutation = useAiCorrect();

  // Effect to add latest feedback from terminal to chat
  React.useEffect(() => {
    if (latestFeedback) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: latestFeedback.feedback,
        confidence: {
          level: latestFeedback.confidence,
          score: latestFeedback.confidenceScore,
          reason: "Based on terminal command analysis"
        }
      }]);
    }
  }, [latestFeedback]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const res = await explainMutation.mutateAsync({
        data: {
          sessionId,
          concept: userMsg,
          lessonId: lessonContext
        }
      });

      setMessages(prev => [...prev, {
        role: 'ai',
        content: res.explanation,
        confidence: {
          level: res.confidence,
          score: res.confidenceScore,
          reason: res.confidenceReason
        }
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I had trouble connecting to my knowledge base." }]);
    }
  };

  const handleCorrectSubmit = async (msgIndex: number) => {
    if (!correctionInput.trim()) return;
    const originalMsg = messages[msgIndex];
    const correctionText = correctionInput;
    
    setIsCorrecting(null);
    setCorrectionInput('');
    
    // Add user's correction to UI
    setMessages(prev => [...prev, { role: 'user', content: `Correction: ${correctionText}`, isCorrection: true }]);

    try {
      const res = await correctMutation.mutateAsync({
        data: {
          sessionId,
          originalExplanation: originalMsg.content,
          concept: lessonContext || "general",
          userCorrection: correctionText
        }
      });

      setMessages(prev => [...prev, {
        role: 'ai',
        content: res.updatedExplanation,
        confidence: { level: 'high', score: 0.95, reason: 'Updated based on direct user correction' }
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "Thanks for the feedback! I couldn't process it completely right now, but I'll remember this for later." }]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/40 backdrop-blur-md border-l shadow-2xl relative">
      <div className="p-4 border-b bg-card/80 backdrop-blur-xl flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-neon-primary">
            <Bot className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">AI Trainer</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span> Online & Adaptive
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx} 
              className={cn("flex flex-col max-w-[90%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}
            >
              <div className={cn(
                "p-3 rounded-2xl text-sm leading-relaxed shadow-sm relative group",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                  : "bg-secondary text-secondary-foreground rounded-tl-sm border border-border/50",
                msg.isCorrection && "border-2 border-warning bg-warning/10 text-warning-foreground"
              )}>
                {msg.content}
                
                {/* Correct Button for AI messages */}
                {msg.role === 'ai' && (
                  <button 
                    onClick={() => setIsCorrecting(idx)}
                    className="absolute -right-2 -bottom-2 bg-card border shadow-sm p-1.5 rounded-full text-muted-foreground hover:text-warning hover:border-warning transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Correct this AI response"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Confidence Badge for AI */}
              {msg.role === 'ai' && msg.confidence && (
                <div className="mt-2 ml-1 flex flex-col gap-1 items-start">
                  <ConfidenceBadge level={msg.confidence.level} score={msg.confidence.score} />
                  <span className="text-[10px] text-muted-foreground/70 italic px-1 max-w-[200px]">{msg.confidence.reason}</span>
                </div>
              )}

              {/* Inline Correction Form */}
              {isCorrecting === idx && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 w-full max-w-[280px] bg-card border border-warning/30 rounded-xl p-3 shadow-lg ml-2"
                >
                  <div className="text-xs font-medium text-warning mb-2 flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Correcting AI Knowledge
                  </div>
                  <textarea 
                    value={correctionInput}
                    onChange={(e) => setCorrectionInput(e.target.value)}
                    placeholder="Explain what the AI got wrong..."
                    className="w-full bg-background border rounded-lg p-2 text-sm min-h-[80px] focus:ring-1 focus:ring-warning focus:outline-none placeholder:text-muted-foreground/50 resize-none"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setIsCorrecting(null)} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                    <button 
                      onClick={() => handleCorrectSubmit(idx)}
                      disabled={!correctionInput.trim() || correctMutation.isPending}
                      className="px-3 py-1.5 text-xs bg-warning text-warning-foreground rounded-lg font-medium hover:bg-warning/90 disabled:opacity-50 flex items-center gap-1"
                    >
                      {correctMutation.isPending ? 'Updating...' : <><CheckCircle2 className="w-3.5 h-3.5" /> Teach AI</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
          
          {explainMutation.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 p-3 bg-secondary rounded-2xl rounded-tl-sm w-16 mr-auto items-center justify-center">
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t bg-card/80 backdrop-blur-xl">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="w-full bg-background border-2 border-border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            disabled={explainMutation.isPending}
          />
          <button 
            type="submit"
            disabled={!input.trim() || explainMutation.isPending}
            className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
