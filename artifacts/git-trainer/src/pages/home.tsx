import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Terminal } from '@/components/terminal';
import { GitTree } from '@/components/git-tree';
import { AiTrainer } from '@/components/ai-trainer';
import { useSession } from '@/hooks/use-session';
import { useAppState } from '@/store/use-app-state';
import { useGetLessons, useGetProgress, useGetLesson } from '@workspace/api-client-react';

export default function Home() {
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

  const { data: lessons, isLoading: lessonsLoading } = useGetLessons();
  
  const { data: progress, isLoading: progressLoading } = useGetProgress(
    { sessionId }, 
    { query: { enabled: isReady && !!sessionId } }
  );

  const { data: activeLesson } = useGetLesson(
    selectedLessonId || '', 
    { query: { enabled: !!selectedLessonId } }
  );

  // Auto-select first lesson if none selected
  useEffect(() => {
    if (lessons && lessons.length > 0 && !selectedLessonId) {
      setSelectedLessonId(lessons[0].id);
    }
  }, [lessons, selectedLessonId, setSelectedLessonId]);

  const handleTerminalValidation = (result: any) => {
    setLatestFeedback({
      feedback: result.feedback,
      confidence: result.confidence,
      confidenceScore: result.confidenceScore
    });
  };

  if (!isReady) return null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30">
      
      {/* Left Sidebar - Curriculum */}
      <Sidebar 
        lessons={lessons || []} 
        progress={progress}
        selectedLessonId={selectedLessonId}
        onSelectLesson={setSelectedLessonId}
        isLoading={lessonsLoading || progressLoading}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top bar for active lesson context */}
        <div className="h-16 border-b flex items-center px-6 bg-card/50 backdrop-blur-sm shrink-0">
          {activeLesson ? (
            <div className="flex items-center gap-4">
              <span className="px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
                {activeLesson.level}
              </span>
              <h2 className="text-lg font-display font-semibold">{activeLesson.title}</h2>
              <span className="text-sm text-muted-foreground ml-2 hidden md:inline-block">
                Goal: {activeLesson.steps[0]?.content || "Complete the exercise"}
              </span>
            </div>
          ) : (
            <div className="animate-pulse h-6 w-64 bg-muted rounded"></div>
          )}
        </div>

        {/* Split pane: Tree (Top) & Terminal (Bottom) */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden relative">
          
          {/* Subtle glow behind content */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

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
           latestFeedback={latestFeedback}
         />
      </div>

    </div>
  );
}
