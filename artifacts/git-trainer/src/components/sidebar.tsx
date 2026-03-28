import React from 'react';
import { CheckCircle2, Lock, PlayCircle, Trophy, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Lesson, UserProgress } from '@workspace/api-client-react';

interface SidebarProps {
  lessons: Lesson[];
  progress?: UserProgress;
  selectedLessonId: string | null;
  onSelectLesson: (id: string) => void;
  isLoading: boolean;
  justCompleted?: string[];
}

export function Sidebar({ lessons, progress, selectedLessonId, onSelectLesson, isLoading, justCompleted = [] }: SidebarProps) {
  const levels = ['beginner', 'intermediate', 'advanced'] as const;
  
  if (isLoading) {
    return <div className="w-72 border-r bg-card/50 p-6 animate-pulse">
       <div className="h-6 w-32 bg-border rounded mb-8"></div>
       <div className="space-y-4">
         {[1,2,3,4].map(i => <div key={i} className="h-12 w-full bg-border rounded-lg"></div>)}
       </div>
    </div>;
  }

  return (
    <div className="w-[300px] h-full border-r bg-card/30 backdrop-blur-sm flex flex-col overflow-hidden shadow-2xl z-20">
      <div className="p-6 border-b border-border/50 bg-card/80">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-neon-accent">
            <BookOpen className="text-accent-foreground w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground tracking-tight leading-none">GitTrainer</h1>
            <p className="text-xs text-accent font-medium mt-1">Interactive Learning</p>
          </div>
        </div>

        {/* User Stats Mini */}
        {progress && (
          <div className="flex gap-2">
            <div className="flex-1 bg-background border rounded-lg p-2.5 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Total XP</div>
              <div className="text-lg font-mono text-primary glow-primary font-bold">{progress.totalXp}</div>
            </div>
            <div className="flex-1 bg-background border rounded-lg p-2.5 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Streak</div>
              <div className="text-lg font-mono text-warning font-bold flex items-center justify-center gap-1">
                {progress.streak} <span className="text-sm">🔥</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 scroll-smooth">
        {levels.map(level => {
          const levelLessons = lessons.filter(l => l.level === level).sort((a,b) => a.order - b.order);
          if (levelLessons.length === 0) return null;

          return (
            <div key={level}>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                {level} 
                <div className="h-px bg-border flex-1 ml-2"></div>
              </h3>
              <div className="space-y-2">
                {levelLessons.map(lesson => {
                  const isCompleted = progress?.completedLessons.includes(lesson.id);
                  const isSelected = selectedLessonId === lesson.id;
                  const isLocked = lesson.isLocked && !isCompleted; // Simple mock logic

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => !isLocked && onSelectLesson(lesson.id)}
                      disabled={isLocked}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all duration-300 group relative overflow-hidden",
                        isSelected 
                          ? "bg-primary/10 border-primary/50 shadow-neon-primary" 
                          : "bg-background border-transparent hover:border-border hover:bg-card",
                        isLocked && "opacity-50 cursor-not-allowed grayscale"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-neon-primary"></div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : isLocked ? (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          ) : isSelected ? (
                            <PlayCircle className="w-5 h-5 text-primary animate-pulse" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground group-hover:border-primary transition-colors"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={cn("text-sm font-semibold truncate", isSelected ? "text-primary" : "text-foreground group-hover:text-primary transition-colors")}>
                            {lesson.title}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{lesson.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] flex items-center gap-1 font-mono text-warning font-medium">
                              <Trophy className="w-3 h-3" /> {lesson.xpReward} XP
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {lesson.estimatedMinutes} min
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
