import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from '@/components/sidebar';
import { Terminal } from '@/components/terminal';
import { GitTree } from '@/components/git-tree';
import { AiTrainer } from '@/components/ai-trainer';
import { useSession } from '@/hooks/use-session';
import { useAppState } from '@/store/use-app-state';
import { useGetLessons, useGetProgress, useGetLesson, useCompleteLesson } from '@workspace/api-client-react';
import { CheckCircle2, Trophy, X, LayoutDashboard, Home as HomeIcon, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

function XpCelebration({ xp, onDone }: { xp: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999] pointer-events-none"
    >
      <div className="bg-card border-2 border-primary/60 shadow-2xl shadow-primary/30 rounded-3xl px-12 py-8 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <div className="text-2xl font-bold text-foreground mb-1">Lesson Complete!</div>
        <div className="text-4xl font-black text-primary mt-2">+{xp} XP</div>
        <div className="text-sm text-muted-foreground mt-2">Keep it up!</div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const { sessionId, isReady } = useSession();
  const { 
    selectedLessonId, 
    setSelectedLessonId, 
    terminalHistory, 
    addTerminalEntry, 
    clearTerminal,
    gitNodes
  } = useAppState();

  const [latestFeedback, setLatestFeedback] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationXp, setCelebrationXp] = useState(0);
  const [justCompleted, setJustCompleted] = useState<string[]>([]);

  const { data: lessons, isLoading: lessonsLoading } = useGetLessons();
  
  const { data: progress, isLoading: progressLoading, refetch: refetchProgress } = useGetProgress(
    { sessionId }, 
    { query: { enabled: isReady && !!sessionId } }
  );

  const { data: activeLesson } = useGetLesson(
    selectedLessonId || '', 
    { query: { enabled: !!selectedLessonId } }
  );

  const completeLessonMutation = useCompleteLesson();

  // Auto-select first lesson if none selected
  useEffect(() => {
    if (lessons && lessons.length > 0 && !selectedLessonId) {
      setSelectedLessonId(lessons[0].id);
    }
  }, [lessons, selectedLessonId, setSelectedLessonId]);

  const handleTerminalValidation = useCallback((result: any) => {
    setLatestFeedback({
      feedback: result.feedback,
      confidence: result.confidence,
      confidenceScore: result.confidenceScore
    });
  }, []);

  const completedLessons = (progress?.completedLessons as string[]) || [];
  const isCurrentLessonDone = selectedLessonId ? completedLessons.includes(selectedLessonId) : false;

  const handleCompleteLesson = async () => {
    if (!selectedLessonId || isCurrentLessonDone) return;
    const xp = activeLesson?.xpReward || 100;
    try {
      await completeLessonMutation.mutateAsync({
        data: {
          sessionId,
          lessonId: selectedLessonId,
          timeSpentMinutes: 10,
        }
      });
      await refetchProgress();
      setCelebrationXp(xp);
      setShowCelebration(true);
      setJustCompleted(prev => [...prev, selectedLessonId]);

      // Auto-advance to next lesson after celebration
      setTimeout(() => {
        if (lessons) {
          const currentIndex = lessons.findIndex(l => l.id === selectedLessonId);
          if (currentIndex < lessons.length - 1) {
            setSelectedLessonId(lessons[currentIndex + 1].id);
          }
        }
      }, 3200);
    } catch (e) {
      console.error('Failed to complete lesson', e);
    }
  };

  if (!isReady) return null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30">
      
      <AnimatePresence>
        {showCelebration && (
          <XpCelebration xp={celebrationXp} onDone={() => setShowCelebration(false)} />
        )}
      </AnimatePresence>

      {/* Left Sidebar - Curriculum */}
      <Sidebar 
        lessons={lessons || []} 
        progress={progress}
        selectedLessonId={selectedLessonId}
        onSelectLesson={setSelectedLessonId}
        isLoading={lessonsLoading || progressLoading}
        justCompleted={justCompleted}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top bar */}
        <div className="h-16 border-b flex items-center px-4 bg-card/50 backdrop-blur-sm shrink-0 gap-3">
          {activeLesson ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider shrink-0">
                {activeLesson.level}
              </span>
              <h2 className="text-base font-semibold truncate">{activeLesson.title}</h2>
              <span className="text-xs text-yellow-400 font-mono font-bold shrink-0 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> +{activeLesson.xpReward} XP
              </span>
            </div>
          ) : (
            <div className="flex-1 animate-pulse h-6 w-64 bg-muted rounded" />
          )}

          {/* Nav buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg hover:border-primary/40 transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg hover:border-primary/40 transition-all"
            >
              <HomeIcon className="w-3.5 h-3.5" />
            </button>

            {/* Complete Lesson Button */}
            {activeLesson && (
              <motion.button
                whileHover={{ scale: isCurrentLessonDone ? 1 : 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCompleteLesson}
                disabled={isCurrentLessonDone || completeLessonMutation.isPending}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all border",
                  isCurrentLessonDone
                    ? "bg-green-500/10 border-green-500/30 text-green-400 cursor-default"
                    : "bg-primary text-primary-foreground border-primary/80 hover:bg-primary/90 shadow-lg shadow-primary/20 cursor-pointer"
                )}
              >
                {isCurrentLessonDone ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                  </>
                ) : completeLessonMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4" />
                    Mark Complete
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* Lesson step overview strip */}
        {activeLesson && activeLesson.steps && activeLesson.steps.length > 0 && (
          <div className="border-b bg-background/40 px-6 py-2 flex items-center gap-4 overflow-x-auto shrink-0">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Steps:</span>
            {(activeLesson.steps as any[]).map((step: any, i: number) => (
              <div key={step.id} className="flex items-center gap-1.5 shrink-0">
                <span className={cn(
                  "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                  step.type === 'command' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  step.type === 'challenge' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                  step.type === 'quiz' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                  'bg-card text-muted-foreground border-border'
                )}>
                  {i + 1}. {step.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Split pane: Tree & Terminal */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="flex-1 min-h-0 relative z-10">
            <GitTree nodes={gitNodes} />
          </div>
          
          <div className="h-[300px] shrink-0 relative z-10">
            <Terminal 
              sessionId={sessionId}
              lessonId={selectedLessonId}
              history={terminalHistory}
              onAddEntry={addTerminalEntry}
              onClear={clearTerminal}
              onValidationResult={handleTerminalValidation}
            />
          </div>
        </div>
      </div>

      {/* Right Panel - AI Trainer */}
      <div className="w-[360px] shrink-0 z-20">
        <AiTrainer 
          sessionId={sessionId} 
          lessonContext={activeLesson?.title}
          activeLessonDescription={activeLesson?.description}
          latestFeedback={latestFeedback}
        />
      </div>
    </div>
  );
}
