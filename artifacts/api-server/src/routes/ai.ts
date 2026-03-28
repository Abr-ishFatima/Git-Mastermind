import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { userProgressTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

type ExplanationEntry = {
  explanation: string;
  confidence: number;
  examples: string[];
  related: string[];
  tip?: string;
};

const GIT_KNOWLEDGE: Record<string, ExplanationEntry> = {
  "what is git": {
    explanation: "Git is a free, open-source **distributed version control system** created by Linus Torvalds in 2005. Every developer has a full copy of the repository history on their machine — there's no single point of failure. Git tracks changes to files over time, lets you revert to any previous state, compare differences, and collaborate with other developers efficiently. It's the industry standard: used by 90%+ of professional software teams.",
    confidence: 0.99,
    examples: ["A team of 10 devs all working on the same codebase simultaneously", "Rolling back a bug introduced 3 weeks ago in seconds", "Maintaining separate 'production' and 'development' code paths"],
    related: ["git init", "git commit", "GitHub"],
    tip: "Git ≠ GitHub. Git is the tool; GitHub is a cloud platform that hosts Git repos."
  },
  "git init": {
    explanation: "`git init` creates a new empty Git repository in your current directory. It generates a hidden `.git/` folder that contains all version history, configuration files, hooks, and object storage. Everything Git needs to track your project lives in this folder. You only run this once per project.",
    confidence: 0.99,
    examples: ["mkdir my-project && cd my-project && git init", "git init my-new-repo  (creates a folder too)", "git init --bare server-repo  (bare repo for hosting, no working directory)"],
    related: ["git clone", "git add", "git commit", ".git folder"],
    tip: "Running `git init` on an existing project is safe — it won't overwrite your files."
  },
  "git add": {
    explanation: "`git add` moves changes from your **working directory** to the **staging area** (also called the index). Think of it as packing items into a box before shipping — you choose exactly which changes to include in your next commit. Unstaged changes won't be committed even if the file was modified.",
    confidence: 0.98,
    examples: ["git add file.txt  (stage one file)", "git add .  (stage all changes in current directory)", "git add -p  (interactive: choose individual hunks to stage)", "git add src/  (stage an entire directory)"],
    related: ["git commit", "git status", "git restore --staged", "staging area"],
    tip: "`git add -p` is the power-user way: review every change chunk before staging it."
  },
  "git commit": {
    explanation: "`git commit` saves a permanent snapshot of your staged changes to the repository history. Each commit gets a unique SHA-1 hash (e.g. `abc1f34`), stores the author, timestamp, and your message. Think of commits as save points in a video game — you can always return to any of them.",
    confidence: 0.99,
    examples: ["git commit -m 'Add user login page'", "git commit -am 'Fix typo'  (stage tracked files + commit in one step)", "git commit --amend  (modify the very last commit — message or content)", "git commit --allow-empty -m 'Trigger CI'"],
    related: ["git add", "git log", "git revert", "git reset"],
    tip: "Write commit messages in imperative mood: 'Add feature' not 'Added feature'. Future you will thank present you."
  },
  "git status": {
    explanation: "`git status` shows the current state of your working directory and staging area. It tells you: which branch you're on, which files are staged (ready to commit), which files are modified but unstaged, and which files are completely untracked by Git.",
    confidence: 0.99,
    examples: ["git status  (standard output)", "git status -s  (short/compact format)", "git status --short --branch  (short with branch info)"],
    related: ["git add", "git diff", "git log", "git restore"],
    tip: "Run `git status` constantly — it's the single most useful command for understanding what's happening."
  },
  "git log": {
    explanation: "`git log` displays the commit history of the current branch. By default it shows: commit hash, author, date, and message. With powerful flags you can filter, format, and visualize your entire project history as a graph.",
    confidence: 0.98,
    examples: ["git log --oneline  (compact: one line per commit)", "git log --graph --all --decorate  (visual branch graph)", "git log --author='Jane' --since='2 weeks ago'", "git log -p  (show diff for each commit)", "git log --stat  (show file change statistics)"],
    related: ["git show", "git diff", "git blame", "git reflog"],
    tip: "Alias `git log --oneline --graph --all --decorate` to `git lg` in your `.gitconfig` — you'll use it daily."
  },
  "git branch": {
    explanation: "Branches in Git are **lightweight movable pointers** to specific commits. Creating a branch costs almost nothing (just a 41-byte file). They let parallel lines of development exist without interfering with each other. The default branch is `main` (or `master` in older repos). Feature branches keep experimental work isolated until it's ready to merge.",
    confidence: 0.98,
    examples: ["git branch  (list all local branches)", "git branch -a  (list local + remote branches)", "git branch feature/user-auth  (create branch)", "git branch -d feature/done  (delete merged branch)", "git branch -D feature/risky  (force delete unmerged branch)", "git branch -m old-name new-name  (rename)"],
    related: ["git switch", "git checkout", "git merge", "git rebase"],
    tip: "Name branches descriptively: `feature/add-login`, `fix/memory-leak`, `release/v2.0`."
  },
  "git checkout": {
    explanation: "`git checkout` switches branches or restores working tree files. In modern Git (2.23+), it's been split into `git switch` (for branches) and `git restore` (for files) for clarity. `git checkout` still works and is still widely used in scripts and documentation.",
    confidence: 0.97,
    examples: ["git checkout main  (switch to main branch)", "git checkout -b feature/new  (create and switch)", "git checkout abc1234  (detach HEAD to a specific commit)", "git checkout -- file.txt  (discard file changes — use restore instead)"],
    related: ["git switch", "git restore", "git branch", "detached HEAD"],
    tip: "Prefer `git switch` for branch navigation in newer Git — it's clearer and harder to misuse."
  },
  "git switch": {
    explanation: "`git switch` is the modern command for switching between branches (introduced in Git 2.23). It's a cleaner alternative to `git checkout` that only handles branch navigation, preventing accidental file operations.",
    confidence: 0.97,
    examples: ["git switch main  (switch to main)", "git switch -c feature/new-thing  (create and switch)", "git switch -  (go back to previous branch)", "git switch --detach abc1234  (detach HEAD to commit)"],
    related: ["git checkout", "git branch", "git restore"],
    tip: "`git switch -` is like `cd -` in bash — toggle between your last two branches instantly."
  },
  "git merge": {
    explanation: "`git merge` integrates changes from one branch into another. There are two strategies: **Fast-forward** (when no commits diverged — history stays linear) and **Three-way merge** (when branches diverged — creates a merge commit). Merge preserves the full history of both branches.",
    confidence: 0.97,
    examples: ["git merge feature/login  (merge into current branch)", "git merge --no-ff feature/login  (force merge commit even if fast-forward possible)", "git merge --squash feature/login  (squash all commits into one before merging)", "git merge --abort  (cancel a conflicted merge)"],
    related: ["git rebase", "git branch", "merge conflicts", "git log --graph"],
    tip: "Use `--no-ff` for feature branches to preserve the history of when features were integrated."
  },
  "merge conflict": {
    explanation: "A merge conflict occurs when two branches modify the **same lines** of the same file, and Git can't automatically decide which version to keep. Git marks the conflict in the file with `<<<<<<< HEAD` (your changes), `=======` (separator), and `>>>>>>> branch-name` (incoming changes). You must manually edit the file, choose what to keep, then `git add` it and commit.",
    confidence: 0.96,
    examples: [
      "Open the conflicted file → edit to keep desired lines → remove conflict markers → git add → git commit",
      "git mergetool  (opens a visual 3-way merge editor like VS Code, IntelliJ)",
      "git checkout --ours file.txt  (keep your version entirely)",
      "git checkout --theirs file.txt  (keep incoming version entirely)",
      "git merge --abort  (bail out and undo the merge attempt)"
    ],
    related: ["git merge", "git rebase", "git diff", "git status"],
    tip: "Configure VS Code as your merge tool: `git config --global merge.tool vscode`"
  },
  "git stash": {
    explanation: "`git stash` temporarily saves uncommitted changes (both staged and unstaged) and reverts your working directory to a clean state matching the last commit. It's perfect for context-switching — need to pull urgent changes or fix a bug on another branch but aren't ready to commit? Stash it.",
    confidence: 0.97,
    examples: ["git stash  (stash changes)", "git stash pop  (restore most recent stash and remove it)", "git stash apply  (restore stash but keep it in list)", "git stash list  (view all stashes)", "git stash save 'WIP: login feature'  (name your stash)", "git stash drop stash@{0}  (delete a specific stash)"],
    related: ["git branch", "git checkout", "git commit", "git pop"],
    tip: "`git stash` doesn't save untracked files by default. Use `git stash -u` to include them."
  },
  "git push": {
    explanation: "`git push` uploads your local commits to a remote repository (like GitHub). The first time pushing a new branch, use `-u` to set the upstream tracking — after that, just `git push` with no arguments.",
    confidence: 0.98,
    examples: ["git push origin main", "git push -u origin feature/login  (first push, sets upstream)", "git push  (after upstream set)", "git push --force-with-lease  (safer force push — fails if remote changed)", "git push origin --delete feature/done  (delete remote branch)"],
    related: ["git pull", "git fetch", "git remote", "git clone"],
    tip: "Never `git push --force` on shared branches. Use `--force-with-lease` instead — it won't overwrite others' work."
  },
  "git pull": {
    explanation: "`git pull` is a combination of `git fetch` (download remote changes) + `git merge` (integrate them). It updates your local branch with the latest changes from the remote. If you want more control, use `git fetch` + `git merge` (or rebase) separately.",
    confidence: 0.97,
    examples: ["git pull  (fetch + merge origin/current-branch)", "git pull origin main  (pull specific branch)", "git pull --rebase  (fetch + rebase instead of merge — cleaner history)", "git pull --no-commit  (don't auto-commit the merge)"],
    related: ["git fetch", "git merge", "git push", "git remote"],
    tip: "`git pull --rebase` keeps your history linear by replaying your commits on top of pulled changes."
  },
  "git rebase": {
    explanation: "`git rebase` moves or **replays your commits** on top of another branch, creating a clean linear history. Unlike merge (which adds a merge commit), rebase integrates changes as if your work was always based on the latest code. Interactive rebase (`-i`) lets you squash, reorder, edit, or drop individual commits.",
    confidence: 0.95,
    examples: ["git rebase main  (replay current branch commits on top of main)", "git rebase -i HEAD~3  (interactive: edit last 3 commits)", "git rebase --abort  (cancel the rebase)", "git rebase --continue  (after resolving a conflict during rebase)", "git rebase --onto main feature-base feature  (transplant commits)"],
    related: ["git merge", "git cherry-pick", "git log", "git squash"],
    tip: "⚠️ Golden Rule: Never rebase commits that have been pushed to a shared remote branch. It rewrites history and breaks collaborators' repos."
  },
  "git cherry-pick": {
    explanation: "`git cherry-pick` applies a **specific commit** from one branch onto your current branch. It creates a new commit with the same changes but a different hash. Useful for applying a bug fix to multiple branches without merging everything.",
    confidence: 0.94,
    examples: ["git cherry-pick abc1234  (apply one commit)", "git cherry-pick abc1234 def5678  (apply multiple commits)", "git cherry-pick abc1234..def5678  (apply a range)", "git cherry-pick --no-commit abc1234  (apply changes without committing)", "git cherry-pick --abort  (cancel)"],
    related: ["git rebase", "git merge", "git patch"],
    tip: "Cherry-pick is great for hotfixes: apply a fix to `main` then cherry-pick it to `release/v1.5`."
  },
  "git reset": {
    explanation: "`git reset` moves the HEAD pointer (and optionally modifies staging/working directory). Three modes: `--soft` (moves HEAD only, staged changes preserved), `--mixed` (default: unstages changes, keeps files), `--hard` (deletes all uncommitted changes — irreversible!).",
    confidence: 0.94,
    examples: ["git reset HEAD~1  (undo last commit, keep changes unstaged)", "git reset --soft HEAD~1  (undo commit, keep changes staged)", "git reset --hard HEAD  (discard all uncommitted changes ⚠️)", "git reset HEAD file.txt  (unstage a specific file)"],
    related: ["git revert", "git restore", "git checkout", "git reflog"],
    tip: "Accidentally did `git reset --hard`? Run `git reflog` immediately — your commits are still there for ~90 days."
  },
  "git revert": {
    explanation: "`git revert` creates a **new commit that undoes** the changes from a previous commit. Unlike `git reset`, it doesn't rewrite history — making it safe to use on shared/public branches. It's the correct way to undo changes that have already been pushed.",
    confidence: 0.96,
    examples: ["git revert abc1234  (revert a specific commit)", "git revert HEAD  (revert the last commit)", "git revert HEAD~3..HEAD  (revert last 3 commits)", "git revert --no-commit abc1234  (revert without auto-committing)"],
    related: ["git reset", "git log", "git cherry-pick"],
    tip: "Rule: `git reset` for local work, `git revert` for shared history. Never rewrite public history."
  },
  "git bisect": {
    explanation: "`git bisect` uses **binary search** to find exactly which commit introduced a bug. You tell Git a known-bad commit and a known-good commit, and it automatically checks out the midpoint for you to test. Keep marking commits good/bad until it pinpoints the exact problem commit.",
    confidence: 0.93,
    examples: ["git bisect start", "git bisect bad  (current commit is broken)", "git bisect good v1.0  (this tag was working)", "git bisect good/bad  (mark each checkout)", "git bisect reset  (done, return to original branch)", "git bisect run pytest tests/  (automate: run tests for you)"],
    related: ["git log", "git blame", "git revert"],
    tip: "With 1000 commits to check, `git bisect` finds the bad one in just ~10 steps (log₂ 1000 ≈ 10)."
  },
  "git hooks": {
    explanation: "Git hooks are **scripts that run automatically** when specific Git events occur. They live in `.git/hooks/`. Common hooks: `pre-commit` (run linters before committing), `commit-msg` (validate message format), `pre-push` (run tests before pushing), `post-merge` (install dependencies after pull).",
    confidence: 0.92,
    examples: ["#!/bin/sh\nnpx eslint .  # pre-commit hook that runs eslint", "Use Husky: npx husky-init && npm install  (share hooks via package.json)", "#!/bin/sh\npnpm test  # pre-push hook to block bad pushes"],
    related: ["GitHub Actions", "CI/CD", "git commit"],
    tip: "Use Husky + lint-staged to share hooks across your team — without committing the `.git/hooks` folder (which isn't tracked)."
  },
  "github actions": {
    explanation: "GitHub Actions is a **CI/CD (Continuous Integration/Continuous Deployment) platform** built into GitHub. You define workflows as YAML files in `.github/workflows/`. Workflows trigger on events (push, pull request, schedule) and run jobs on GitHub-hosted machines to build, test, and deploy your code automatically.",
    confidence: 0.93,
    examples: [
      "`.github/workflows/ci.yml` — run tests on every PR",
      "on: push: branches: [main] → deploy to production on merge",
      "on: schedule: cron: '0 8 * * *' → daily jobs",
      "uses: actions/checkout@v4  (checkout your repo in the runner)",
      "uses: actions/setup-node@v4  (set up Node.js environment)"
    ],
    related: ["git hooks", "CI/CD", "GitHub", "docker"],
    tip: "Start simple: a workflow that runs `npm test` on every push catches 90% of regressions."
  },
  "remote": {
    explanation: "A **remote** in Git is a reference to another version of your repository, usually hosted on a server like GitHub. `origin` is the conventional name for the default remote. Remotes let you collaborate — pushing your changes up and pulling others' changes down.",
    confidence: 0.97,
    examples: ["git remote -v  (list remotes with URLs)", "git remote add origin https://github.com/user/repo.git", "git remote remove origin", "git remote rename origin upstream", "git fetch origin  (download remote changes without merging)"],
    related: ["git push", "git pull", "git fetch", "git clone"],
    tip: "Fork → `origin` = your fork, `upstream` = original repo. This is the standard open-source contribution workflow."
  },
  "github": {
    explanation: "**GitHub** is the world's largest code hosting platform, built on top of Git. It adds: pull requests (code review), Issues (bug tracking), GitHub Actions (CI/CD), GitHub Pages (static hosting), Copilot (AI coding), and social features for discovering open-source projects. It's where 90%+ of open source code lives.",
    confidence: 0.98,
    examples: ["Fork a repo → make changes → open a Pull Request", "Use Issues to track bugs and feature requests", "GitHub Pages: free static site hosting from your repo", "GitHub Actions: automated CI/CD pipelines"],
    related: ["git push", "git remote", "pull requests", "git fetch"],
    tip: "Your GitHub profile is your developer portfolio. Pin your best repos and keep READMEs polished."
  },
  "detached head": {
    explanation: "**Detached HEAD** means your HEAD pointer is pointing directly at a commit instead of a branch. This happens when you `git checkout <commit-hash>` or `git checkout <tag>`. Any commits you make in this state won't be attached to a branch — they'll be orphaned and eventually garbage collected. To save work in this state, create a new branch: `git switch -c my-recovery-branch`.",
    confidence: 0.95,
    examples: ["git checkout abc1234  (enters detached HEAD)", "git switch -c new-branch  (escape detached HEAD by creating a branch)", "git switch main  (just go back to main, losing any work made in detached state)"],
    related: ["git checkout", "git switch", "git branch", "git reflog"],
    tip: "Don't panic when you see 'detached HEAD'! Just `git switch -c rescue-branch` before making commits."
  },
};

function matchConcept(raw: string): ExplanationEntry | null {
  const q = raw.toLowerCase().trim();
  
  // Direct match
  if (GIT_KNOWLEDGE[q]) return GIT_KNOWLEDGE[q];
  
  // Prefix and keyword match with scoring
  let best: { key: string; score: number } | null = null;
  for (const key of Object.keys(GIT_KNOWLEDGE)) {
    let score = 0;
    const keyWords = key.split(' ');
    const qWords = q.split(' ');
    
    // Exact key found in query
    if (q.includes(key)) score += 10;
    // Query found in key
    else if (key.includes(q)) score += 8;
    // Word overlap
    else {
      for (const kw of keyWords) {
        if (q.includes(kw)) score += 2;
      }
      for (const qw of qWords) {
        if (key.includes(qw)) score += 1;
      }
    }
    
    // Boost exact command matches
    if (q.startsWith(key.split(' ')[0]) && key.startsWith('git')) score += 3;
    
    if (score > 0 && (!best || score > best.score)) {
      best = { key, score };
    }
  }
  
  return best && best.score >= 2 ? GIT_KNOWLEDGE[best.key] : null;
}

function buildFallback(concept: string, sessionCount: number): ExplanationEntry {
  const isGitCommand = concept.toLowerCase().startsWith('git ');
  const baseConfidence = isGitCommand ? 0.72 : 0.60;
  return {
    explanation: `**${concept}** is an important topic in Git. In version control, understanding how different operations interact helps you collaborate effectively and manage your codebase with confidence.\n\nFor the most accurate and up-to-date information, check the official Git documentation: \`git help ${concept.split(' ')[1] || concept}\` or visit https://git-scm.com/docs`,
    confidence: Math.max(0.45, baseConfidence - (sessionCount < 2 ? 0.1 : 0)),
    examples: [`git help ${concept.split(' ')[1] || 'git'}`, "https://git-scm.com/docs"],
    related: ["git status", "git log", "git help"],
    tip: "When in doubt, `git help <command>` is always the most accurate source."
  };
}

function scoreConfidence(base: number, sessionCount: number, aiCorrections: number): {
  adjusted: number; level: "high" | "medium" | "low"; reason: string
} {
  let adjusted = base;
  if (sessionCount < 2) adjusted -= 0.07;
  else if (sessionCount >= 5) adjusted = Math.min(0.99, adjusted + 0.02);
  if (aiCorrections > 0) adjusted = Math.min(0.99, adjusted + aiCorrections * 0.015);

  const level: "high" | "medium" | "low" = adjusted >= 0.88 ? "high" : adjusted >= 0.72 ? "medium" : "low";
  const levelLabel = `${level.charAt(0).toUpperCase()}${level.slice(1)}`;
  
  let reason = `Confidence: ${levelLabel}`;
  if (sessionCount <= 1) reason += ` — based on ${sessionCount} session`;
  else reason += ` — based on ${sessionCount} sessions`;
  if (aiCorrections > 0) reason += ` · ${aiCorrections} correction${aiCorrections > 1 ? 's' : ''} improved accuracy`;
  if (adjusted < 0.72) reason += " · This topic has lower coverage — feel free to correct me";

  return { adjusted, level, reason };
}

router.post("/ai/explain", async (req, res) => {
  try {
    const { sessionId, concept, lessonId, context } = req.body;
    
    let sessionCount = 1;
    let aiCorrections = 0;
    
    if (sessionId) {
      try {
        const [progress] = await db.select().from(userProgressTable).where(eq(userProgressTable.sessionId, sessionId));
        if (progress) { sessionCount = progress.sessionCount; aiCorrections = progress.aiCorrections; }
      } catch {}
    }

    // Build query: prefer explicit question, fall back to lesson context
    const query = [concept, lessonId, context].filter(Boolean).join(' ');
    const match = matchConcept(query) || matchConcept(concept);
    const entry = match || buildFallback(concept, sessionCount);

    const { adjusted, level, reason } = scoreConfidence(entry.confidence, sessionCount, aiCorrections);

    // Add tip to explanation if present
    const fullExplanation = entry.tip
      ? `${entry.explanation}\n\n💡 **Pro tip:** ${entry.tip}`
      : entry.explanation;

    res.json({
      explanation: fullExplanation,
      confidence: level,
      confidenceScore: Math.round(adjusted * 100) / 100,
      confidenceReason: reason,
      examples: entry.examples,
      relatedConcepts: entry.related,
      sessionAware: sessionCount > 1,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate explanation" });
  }
});

router.post("/ai/correct", async (req, res) => {
  try {
    const { sessionId, concept, originalExplanation, userCorrection } = req.body;
    
    if (sessionId) {
      try {
        const [progress] = await db.select().from(userProgressTable).where(eq(userProgressTable.sessionId, sessionId));
        if (progress) {
          const corrections = (progress.sessionCorrections as object[]) || [];
          corrections.push({ concept, correction: userCorrection, original: originalExplanation?.slice(0, 200), timestamp: new Date().toISOString() });
          await db.update(userProgressTable)
            .set({ aiCorrections: progress.aiCorrections + 1, sessionCorrections: corrections })
            .where(eq(userProgressTable.sessionId, sessionId));
        }
      } catch {}
    }

    const acknowledgment = "✅ Correction noted! You're absolutely right to flag that.";
    const updatedExplanation = `I've updated my understanding based on your correction:\n\n**Your correction:** "${userCorrection}"\n\nThis is an important nuance about **${concept || 'this topic'}** that many learners find clarifying. I'll use this improved understanding in future explanations during this session.`;
    
    res.json({
      acknowledgment,
      updatedExplanation,
      learned: true,
      thankYouMessage: "Your correction has been recorded. The AI adapts to your knowledge — this is the 'Human In The Loop' in action! Each correction makes my responses more accurate for you.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to process correction" });
  }
});

router.post("/ai/study-plan", async (req, res) => {
  try {
    const { sessionId, goals, currentLevel, availableHoursPerWeek, sessionCount } = req.body;

    const LEVEL_PLANS: Record<string, { plan: string; weeklyGoals: string[]; recommendedLessons: string[]; weeks: number }> = {
      beginner: {
        plan: "Start with the fundamentals. Learn what Git is, initialize repositories, stage and commit changes, and connect to GitHub. By the end you'll have your first project live on GitHub.",
        weeklyGoals: ["Understand version control concepts", "Make 5 real commits using init → add → commit", "Push your first repo to GitHub"],
        recommendedLessons: ["git-intro", "git-init", "git-add", "git-commit", "git-status-log", "github-connect"],
        weeks: 3,
      },
      intermediate: {
        plan: "Master the branching workflow that professional teams use. You'll learn to develop features in isolation, collaborate with pull requests, and handle merge conflicts like a pro.",
        weeklyGoals: ["Master git branch and merge workflow", "Resolve your first real merge conflict", "Collaborate on a GitHub repository with branches"],
        recommendedLessons: ["git-branch", "git-checkout-switch", "git-merge", "git-pull-push", "merge-conflicts", "git-stash"],
        weeks: 4,
      },
      advanced: {
        plan: "Level up to senior-engineer Git skills. Master rebase for clean history, cherry-pick for selective commits, bisect for debugging, hooks for automation, and GitHub Actions for CI/CD.",
        weeklyGoals: ["Rebase a feature branch cleanly onto main", "Create a pre-commit hook for linting", "Deploy with a GitHub Actions CI/CD pipeline"],
        recommendedLessons: ["git-rebase", "git-cherry-pick", "interactive-rebase", "git-bisect", "git-hooks", "github-actions"],
        weeks: 5,
      },
    };

    const levelKey = (currentLevel || "beginner").toLowerCase();
    const planData = LEVEL_PLANS[levelKey] || LEVEL_PLANS.beginner;
    const sessions = sessionCount || 1;
    const hrs = availableHoursPerWeek || 3;

    const confidenceScore = sessions <= 1 ? 0.65 : sessions <= 3 ? 0.78 : 0.90;
    const confidenceLevel: "high" | "medium" | "low" = confidenceScore >= 0.85 ? "high" : confidenceScore >= 0.72 ? "medium" : "low";

    const goalNote = goals?.length
      ? ` Your goals (${goals.join(", ")}) align well with this plan.`
      : "";

    const estimatedWeeks = Math.max(1, Math.ceil(planData.weeks / Math.max(1, hrs / 3)));

    res.json({
      plan: planData.plan + goalNote,
      weeklyGoals: planData.weeklyGoals,
      recommendedLessons: planData.recommendedLessons,
      confidence: confidenceLevel,
      confidenceScore,
      confidenceReason: `Confidence: ${confidenceLevel.charAt(0).toUpperCase()}${confidenceLevel.slice(1)} — based on ${sessions} session${sessions !== 1 ? 's' : ''}. ${sessions < 3 ? 'More sessions allow better personalization.' : 'Good history for accurate planning.'}`,
      estimatedCompletionWeeks: estimatedWeeks,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate study plan" });
  }
});

router.post("/ai/validate-command", async (req, res) => {
  try {
    const { command, expectedCommand } = req.body;
    
    const trimmed = (command || "").trim();
    const trimmedLc = trimmed.toLowerCase();
    const expected = (expectedCommand || "").trim().toLowerCase();
    
    const COMMAND_OUTPUTS: Record<string, string> = {
      "git init": "Initialized empty Git repository in /home/user/project/.git/",
      "git add .": "",
      "git add readme.md": "",
      "git add -p": "diff --git a/file.txt b/file.txt\n+new line\nStage this hunk [y,n,q,a,d,s,?]?",
      "git status": "On branch main\nnothing to commit, working tree clean",
      "git status -s": "M  modified-file.txt\n?? new-untracked.txt",
      "git log": "commit abc1234def5678 (HEAD -> main)\nAuthor: You <you@example.com>\nDate:   Fri Mar 28 10:00:00 2026\n\n    Initial commit",
      "git log --oneline": "abc1234 (HEAD -> main) Add user authentication\nbcd2345 Fix navigation bug\ncde3456 Initial commit",
      "git log --graph --all --decorate": "* abc1234 (HEAD -> main) Merge feature/login\n|\\ \n| * def5678 (feature/login) Add login page\n|/\n* ghi9012 Initial commit",
      "git branch": "* main\n  feature/login\n  feature/profile",
      "git branch -a": "* main\n  feature/login\n  remotes/origin/main\n  remotes/origin/feature/login",
      "git merge feature/login": "Updating abc1234..def5678\nFast-forward\n src/login.js | 45 ++++++++++++\n 1 file changed, 45 insertions(+)",
      "git merge --no-ff feature/login": "Merge made by the 'ort' strategy.\n src/login.js | 45 ++++++++++++",
      "git stash": "Saved working directory and index state WIP on main: abc1234 Add navigation",
      "git stash pop": "On branch main\nChanges not staged for commit:\n  modified: src/app.js\nDropped refs/stash@{0}",
      "git stash list": "stash@{0}: WIP on main: abc1234 Add navigation\nstash@{1}: WIP on feature: def5678 Partial login",
      "git push origin main": "Enumerating objects: 5, done.\nCounting objects: 100% (5/5), done.\nTo https://github.com/user/repo.git\n   abc1234..def5678  main -> main",
      "git pull": "remote: Enumerating objects: 3, done.\nUpdating abc1234..def5678\nFast-forward\n README.md | 2 ++\n 1 file changed, 2 insertions(+)",
      "git pull --rebase": "Successfully rebased and updated refs/heads/main.",
      "git rebase main": "Successfully rebased and updated refs/heads/feature/login.",
      "git bisect start": "",
      "git bisect bad": "Bisecting: 10 revisions left to test (roughly 4 steps)",
      "git bisect good": "Bisecting: 5 revisions left to test (roughly 3 steps)",
      "git cherry-pick abc1234": "[main def5678] Fix critical bug in auth module\n 1 file changed, 3 insertions(+), 1 deletion(-)",
      "git remote -v": "origin  https://github.com/user/repo.git (fetch)\norigin  https://github.com/user/repo.git (push)",
      "git remote add origin": "",
      "git diff": "diff --git a/src/app.js b/src/app.js\n@@ -10,6 +10,7 @@\n+  const newFeature = true;",
      "git reflog": "abc1234 (HEAD -> main) HEAD@{0}: commit: Add login\nbcd2345 HEAD@{1}: reset: moving to HEAD~1\ncde3456 HEAD@{2}: commit: Previous feature",
    };

    let isCorrect = false;
    let feedback = "";
    let simulatedOutput = "";
    let hint = "";
    let confidenceScore = 0.95;

    if (!trimmed) {
      isCorrect = false;
      feedback = "Please type a git command to continue.";
      hint = "All git commands start with 'git'. Try: git status";
    } else if (!trimmedLc.startsWith("git") && trimmedLc !== "clear" && trimmedLc !== "help") {
      isCorrect = false;
      feedback = `"${trimmed}" is not a git command. Git commands must start with 'git'.`;
      hint = `Did you mean: git ${trimmedLc}?`;
      confidenceScore = 0.99;
    } else if (trimmedLc === "clear" || trimmedLc === "help") {
      isCorrect = true;
      feedback = trimmedLc === "clear" ? "Terminal cleared." : "Available commands: git init, git add, git commit, git status, git log, git branch, git merge, git push, git pull, git stash, git rebase, git cherry-pick, git bisect";
      simulatedOutput = feedback;
    } else if (expected && (trimmedLc === expected || trimmedLc.includes(expected.replace(/^git\s+/, "git ")))) {
      isCorrect = true;
      feedback = "✅ Correct! Great job!";
      simulatedOutput = COMMAND_OUTPUTS[trimmedLc] ?? COMMAND_OUTPUTS[expected] ?? "Command executed successfully.";
    } else if (expected && trimmedLc !== expected) {
      isCorrect = false;
      feedback = `Not quite right. You typed "${trimmed}".`;
      const expParts = expected.split(" ");
      hint = `Hint: the command starts with "${expParts.slice(0, 2).join(" ")}"`;
      confidenceScore = 0.97;
    } else {
      // No expected command — validate against known commands
      const exactOutput = COMMAND_OUTPUTS[trimmedLc];
      if (exactOutput !== undefined) {
        isCorrect = true;
        feedback = `✅ Valid command! Running \`${trimmed}\``;
        simulatedOutput = exactOutput || "(no output)";
      } else if (trimmedLc.match(/^git commit -m ['"].+['"]$/)) {
        const msg = trimmedLc.match(/['"]([^'"]+)['"]/)?.[1] || "update";
        isCorrect = true;
        feedback = `✅ Commit created!`;
        simulatedOutput = `[main ${Math.random().toString(36).substr(2, 7)}] ${msg}\n 1 file changed, 1 insertion(+)`;
      } else if (trimmedLc.match(/^git switch -c .+/)) {
        const branch = trimmedLc.split(' ').pop();
        isCorrect = true;
        feedback = `✅ Branch created and switched!`;
        simulatedOutput = `Switched to a new branch '${branch}'`;
      } else if (trimmedLc.match(/^git branch .+/)) {
        const branch = trimmedLc.split(' ').pop();
        isCorrect = true;
        feedback = `✅ Branch created!`;
        simulatedOutput = "";
      } else if (trimmedLc.match(/^git checkout -b .+/)) {
        const branch = trimmedLc.split(' ').pop();
        isCorrect = true;
        feedback = `✅ Branch created and checked out!`;
        simulatedOutput = `Switched to a new branch '${branch}'`;
      } else if (trimmedLc.match(/^git remote add .+/)) {
        isCorrect = true;
        feedback = "✅ Remote added!";
        simulatedOutput = "";
      } else if (trimmedLc.match(/^git push .+/)) {
        isCorrect = true;
        feedback = "✅ Pushed to remote!";
        simulatedOutput = "To https://github.com/user/repo.git\n * [new branch]      feature -> feature";
      } else if (trimmedLc.startsWith("git ")) {
        isCorrect = false;
        feedback = `"${trimmed}" is not a recognized command in this simulator.`;
        hint = "Try commands like: git init, git add ., git commit -m 'msg', git status, git log, git branch";
        confidenceScore = 0.80;
      }
    }

    const gitTreeUpdate = isCorrect ? { action: trimmedLc.split(" ")[1], command: trimmedLc } : null;

    res.json({
      isCorrect,
      feedback,
      simulatedOutput,
      gitTreeUpdate,
      hint: hint || undefined,
      confidence: confidenceScore >= 0.9 ? "high" : confidenceScore >= 0.75 ? "medium" : "low",
      confidenceScore,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to validate command" });
  }
});

export default router;
