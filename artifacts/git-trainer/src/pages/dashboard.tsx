import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useSession } from '@/hooks/use-session';
import { useGetLessons, useGetProgress } from '@workspace/api-client-react';
import { ArrowLeft, Trophy, Zap, BookOpen, Target, CheckCircle2, Lock, GitBranch, Flame, Star, BarChart3, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEVEL_XP: Record<string, { min: number; max: number; next: string | null }> = {
  beginner:     { min: 0,    max: 500,  next: "intermediate" },
  intermediate: { min: 500,  max: 1200, next: "advanced" },
  advanced:     { min: 1200, max: 2000, next: null },
};

const ACHIEVEMENTS = [
  { id: "first-commit", title: "First Commit", desc: "Complete your first lesson", icon: "🎯", xp: 50, requirement: 1 },
  { id: "on-a-roll", title: "On A Roll", desc: "Complete 3 lessons", icon: "🔥", xp: 100, requirement: 3 },
  { id: "halfway", title: "Halfway There", desc: "Complete 9 lessons", icon: "⚡", xp: 200, requirement: 9 },
  { id: "git-master", title: "Git Master", desc: "Complete all 18 lessons", icon: "👑", xp: 500, requirement: 18 },
  { id: "corrector", title: "Human In The Loop", desc: "Correct the AI at least once", icon: "🧠", corrections: 1 },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { sessionId, isReady } = useSession();

  const { data: lessons } = useGetLessons();
  const { data: progress } = useGetProgress(
    { sessionId },
    { query: { enabled: isReady && !!sessionId } }
  );

  if (!isReady || !progress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading your dashboard...</div>
      </div>
    );
  }

  const completedLessons = (progress.completedLessons as string[]) || [];
  const totalLessons = lessons?.length || 18;
  const completionPct = Math.round((completedLessons.length / totalLessons) * 100);
  
  const levelInfo = LEVEL_XP[progress.currentLevel] || LEVEL_XP.beginner;
  const levelPct = Math.round(((progress.totalXp - levelInfo.min) / (levelInfo.max - levelInfo.min)) * 100);
  const xpToNext = levelInfo.next ? levelInfo.max - progress.totalXp : 0;

  const levelsByGroup = ['beginner', 'intermediate', 'advanced'].map(level => ({
    level,
    lessons: (lessons || []).filter(l => l.level === level).sort((a, b) => a.order - b.order),
    completed: (lessons || []).filter(l => l.level === level && completedLessons.includes(l.id)).length,
    total: (lessons || []).filter(l => l.level === level).length,
  }));

  const levelColors: Record<string, string> = {
    beginner: "text-green-400 bg-green-500/10 border-green-500/25",
    intermediate: "text-blue-400 bg-blue-500/10 border-blue-500/25",
    advanced: "text-purple-400 bg-purple-500/10 border-purple-500/25",
  };
  const levelBarColors: Record<string, string> = {
    beginner: "bg-green-400",
    intermediate: "bg-blue-400",
    advanced: "bg-purple-400",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/learn')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Learning
          </button>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <span className="font-bold">Git Mastermind</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Your Dashboard</h1>
          <p className="text-muted-foreground text-lg">Track your progress, see your achievements, and plan what's next.</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {[
            { icon: <Zap className="w-5 h-5 text-primary" />, label: "Total XP", value: progress.totalXp, color: "text-primary" },
            { icon: <Flame className="w-5 h-5 text-orange-400" />, label: "Current Streak", value: `${progress.streak} days`, color: "text-orange-400" },
            { icon: <BookOpen className="w-5 h-5 text-green-400" />, label: "Lessons Done", value: `${completedLessons.length} / ${totalLessons}`, color: "text-green-400" },
            { icon: <Brain className="w-5 h-5 text-violet-400" />, label: "AI Corrections", value: progress.aiCorrections, color: "text-violet-400" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">{stat.icon}<span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span></div>
              <div className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Overall Progress */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Overall Progress</h2>
              </div>
              <div className="space-y-5">
                {levelsByGroup.map(({ level, lessons: lvlLessons, completed, total }) => (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn("text-sm font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border text-xs", levelColors[level])}>
                        {level}
                      </span>
                      <span className="text-sm text-muted-foreground">{completed}/{total} lessons</span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", levelBarColors[level])}
                        style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Total Completion</span>
                  <span className="text-sm font-bold text-primary">{completionPct}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-violet-400 rounded-full transition-all duration-700" style={{ width: `${completionPct}%` }} />
                </div>
              </div>
            </motion.div>

            {/* Lesson Checklist */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Lesson Progress</h2>
                </div>
                <button onClick={() => navigate('/learn')} className="text-sm text-primary hover:underline">Continue →</button>
              </div>
              <div className="space-y-6">
                {levelsByGroup.map(({ level, lessons: lvlLessons }) => (
                  <div key={level}>
                    <div className={cn("text-xs font-bold uppercase tracking-widest mb-3 px-2.5 py-1 rounded-full border w-fit", levelColors[level])}>
                      {level}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {lvlLessons.map(lesson => {
                        const done = completedLessons.includes(lesson.id);
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => navigate('/learn')}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:scale-[1.01]",
                              done
                                ? "bg-green-500/5 border-green-500/20 text-green-300"
                                : "bg-background border-border text-muted-foreground hover:border-primary/40"
                            )}
                          >
                            {done
                              ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                              : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                            }
                            <span className="text-xs font-medium truncate">{lesson.title}</span>
                            <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono shrink-0">+{lesson.xpReward}xp</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Level Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-bold">Your Level</h2>
              </div>
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 mb-3">
                  <span className="text-3xl">{progress.currentLevel === 'beginner' ? '🌱' : progress.currentLevel === 'intermediate' ? '🚀' : '⭐'}</span>
                </div>
                <div className="text-2xl font-bold capitalize">{progress.currentLevel}</div>
                <div className="text-sm text-muted-foreground mt-1">{progress.totalXp} XP earned</div>
              </div>
              {levelInfo.next && (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>{levelInfo.min} XP</span>
                    <span className="text-primary font-medium">{levelInfo.max} XP → {levelInfo.next}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-violet-400 rounded-full" style={{ width: `${Math.min(100, levelPct)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">{xpToNext} XP until {levelInfo.next}</p>
                </div>
              )}
              {!levelInfo.next && (
                <div className="text-center text-sm text-yellow-400 font-medium mt-2">🏆 Maximum Level Reached!</div>
              )}
            </motion.div>

            {/* Achievements */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-bold">Achievements</h2>
              </div>
              <div className="space-y-3">
                {ACHIEVEMENTS.map(ach => {
                  const isEarned = (ach.requirement && completedLessons.length >= ach.requirement)
                    || (ach.corrections && progress.aiCorrections >= ach.corrections);
                  return (
                    <div key={ach.id} className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all",
                      isEarned
                        ? "bg-yellow-500/5 border-yellow-500/20"
                        : "bg-background border-border opacity-50 grayscale"
                    )}>
                      <span className="text-xl">{ach.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={cn("text-sm font-semibold", isEarned ? "text-foreground" : "text-muted-foreground")}>{ach.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{ach.desc}</div>
                      </div>
                      {isEarned && <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <button
                onClick={() => navigate('/learn')}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
              >
                Continue Learning →
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
