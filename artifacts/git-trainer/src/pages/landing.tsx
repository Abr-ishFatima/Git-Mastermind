import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Zap, Brain, Terminal, Target, ChevronRight, Star, ArrowRight, CheckCircle2, Users, BookOpen } from 'lucide-react';
import { useLocation } from 'wouter';

const features = [
  {
    icon: <Terminal className="w-6 h-6" />,
    title: "Interactive Terminal",
    desc: "Type real git commands in a simulated terminal. Get instant feedback as if you're working on a real project.",
    color: "from-green-500/20 to-emerald-500/20 border-green-500/30"
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "Human In The Loop AI",
    desc: "Every AI explanation shows a confidence score. Disagree? Correct the AI — it learns and adapts to you instantly.",
    color: "from-purple-500/20 to-violet-500/20 border-purple-500/30"
  },
  {
    icon: <GitBranch className="w-6 h-6" />,
    title: "Visual Git Tree",
    desc: "Watch branches, commits, and merges come to life in a real-time interactive visualization as you type commands.",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30"
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Structured Curriculum",
    desc: "18 hands-on lessons from absolute beginner to advanced Git power user. Progress at your own pace.",
    color: "from-orange-500/20 to-amber-500/20 border-orange-500/30"
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "XP & Achievements",
    desc: "Earn XP for every lesson you complete, maintain streaks, and track your journey to Git mastery.",
    color: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30"
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Progress Dashboard",
    desc: "Your personal learning hub — see completed lessons, XP earned, level progress, and personalized study plans.",
    color: "from-pink-500/20 to-rose-500/20 border-pink-500/30"
  }
];

const curriculum = [
  { level: "Beginner", color: "text-green-400", count: 6, items: ["What is Git?", "git init", "git add & commit", "git status & log", "Connecting to GitHub", "Remote basics"] },
  { level: "Intermediate", color: "text-blue-400", count: 6, items: ["git branch", "git checkout", "git merge", "pull & push", "Merge conflicts", "git stash"] },
  { level: "Advanced", color: "text-purple-400", count: 6, items: ["git rebase", "cherry-pick", "Interactive rebase", "git bisect", "Git Hooks", "GitHub Actions"] },
];

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Git Mastermind</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/learn')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              Start Learning
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
          >
            <Zap className="w-4 h-4" />
            AI-Powered Git Learning with Human In The Loop
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight"
          >
            Master Git &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-blue-400">
              GitHub
            </span>
            <br />
            Like a Pro
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            An interactive AI trainer that teaches Git from beginner to advanced. 
            Practice real commands, see live visualizations, and get AI coaching — 
            where <strong className="text-foreground">you stay in control</strong> and can correct the AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => navigate('/learn')}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-xl text-lg font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02]"
            >
              Get Started — It's Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-3 px-8 py-4 bg-card border border-border rounded-xl text-lg font-medium hover:border-primary/50 hover:bg-card/80 transition-all"
            >
              <BookOpen className="w-5 h-5" />
              View Dashboard
            </button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-8 mt-16 text-sm text-muted-foreground"
          >
            {[
              { label: "Lessons", value: "18" },
              { label: "Topics Covered", value: "50+" },
              { label: "AI Confidence Scores", value: "Always On" },
              { label: "Your Corrections Learned", value: "Instantly" }
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-foreground">{s.value}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* App preview strip */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm overflow-hidden shadow-2xl"
          >
            {/* Fake window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="text-xs text-muted-foreground ml-3">git-mastermind — Interactive Trainer</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border/50 min-h-[300px]">
              {/* Sidebar preview */}
              <div className="p-4 space-y-3 bg-card/20">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Curriculum</div>
                {["What is Git?", "git init", "git add"].map((t, i) => (
                  <div key={t} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${i === 0 ? 'bg-primary/15 border border-primary/30 text-primary' : 'text-muted-foreground'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${i < 2 ? 'text-green-400' : 'text-muted-foreground/40'}`} />
                    {t}
                  </div>
                ))}
                <div className="flex items-center gap-2 p-2 rounded-lg text-xs text-muted-foreground/50">
                  <div className="w-4 h-4 rounded-full border border-muted-foreground/20" />
                  git commit
                </div>
              </div>
              {/* Terminal preview */}
              <div className="p-4 font-mono text-xs bg-black/40 col-span-1">
                <div className="text-green-400/60 mb-3">$ bash — practice-repo</div>
                <div className="text-muted-foreground">$ <span className="text-green-400">git init</span></div>
                <div className="text-blue-300 mt-1">Initialized empty Git repository in .git/</div>
                <div className="text-muted-foreground mt-2">$ <span className="text-green-400">git add .</span></div>
                <div className="text-muted-foreground mt-2">$ <span className="text-green-400">git commit -m <span className="text-yellow-400">"first commit"</span></span></div>
                <div className="text-blue-300 mt-1">[main abc1234] first commit</div>
                <div className="text-muted-foreground mt-2 animate-pulse">$ <span className="text-green-400">_</span></div>
              </div>
              {/* AI panel preview */}
              <div className="p-4 space-y-3 bg-card/10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Brain className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-xs font-medium">AI Trainer</span>
                  <span className="ml-auto text-[10px] text-green-400">● Online</span>
                </div>
                <div className="bg-card/60 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
                  git init creates a hidden <code className="text-primary">.git</code> folder that stores all version history...
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 font-medium">✓ High Confidence (97%)</span>
                </div>
                <div className="text-[10px] text-muted-foreground/60 italic">Based on 2 sessions</div>
                <button className="text-[10px] text-primary/70 hover:text-primary border border-primary/20 rounded px-2 py-1 mt-1">
                  ✏ Correct the AI
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need to master Git</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Built for how developers actually learn — by doing, not just reading.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`p-6 rounded-2xl bg-gradient-to-br border ${f.color} backdrop-blur-sm hover:scale-[1.02] transition-transform`}
              >
                <div className="text-foreground mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="px-6 py-24 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">18 Lessons, 3 Levels</h2>
            <p className="text-muted-foreground text-lg">A complete journey from your first git init to GitHub Actions CI/CD.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {curriculum.map((lvl, i) => (
              <motion.div
                key={lvl.level}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <div className={`text-sm font-bold uppercase tracking-widest mb-1 ${lvl.color}`}>{lvl.level}</div>
                <div className="text-2xl font-bold mb-4">{lvl.count} Lessons</div>
                <div className="space-y-2">
                  {lvl.items.map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Human In The Loop callout */}
      <section className="px-6 py-24 border-t border-border/30">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-violet-500/5 to-blue-500/10 border border-primary/20 p-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/25 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <Star className="w-3.5 h-3.5" />
              The Twist: Human In The Loop
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">You're Always In Control</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
              Every AI response comes with a <strong className="text-foreground">transparency score</strong> — 
              "Confidence: Medium — based on 3 sessions." If the AI gets something wrong, 
              <strong className="text-foreground"> you correct it</strong>, and it immediately updates its explanation. 
              The AI adapts to your knowledge, not the other way around.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                <CheckCircle2 className="w-4 h-4" /> High Confidence — Verified explanation
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                <CheckCircle2 className="w-4 h-4" /> Medium — You can refine it
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <CheckCircle2 className="w-4 h-4" /> Low — AI is uncertain, correct freely
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 border-t border-border/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to become a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">
              Git Mastermind?
            </span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Start your first lesson in seconds. No sign-up required.
          </p>
          <button
            onClick={() => navigate('/learn')}
            className="group inline-flex items-center gap-3 px-10 py-5 bg-primary text-primary-foreground rounded-2xl text-xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:scale-[1.03] hover:shadow-primary/50"
          >
            Get Started Now
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-sm text-muted-foreground mt-4">Free forever · No account needed · Start in 30 seconds</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Git Mastermind</span>
          </div>
          <span>Built for hackathon excellence · Human In The Loop AI</span>
        </div>
      </footer>
    </div>
  );
}
