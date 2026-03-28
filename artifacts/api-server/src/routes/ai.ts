import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { userProgressTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const GIT_EXPLANATIONS: Record<string, { explanation: string; confidence: number; examples: string[]; related: string[] }> = {
  "git init": {
    explanation: "git init creates a new Git repository in the current directory. It initializes a hidden `.git` folder that stores all version history, configuration, and objects. This is always your first step when starting a new project.",
    confidence: 0.97,
    examples: ["git init my-project", "mkdir new-repo && cd new-repo && git init"],
    related: ["git clone", "git add", "git commit"],
  },
  "git add": {
    explanation: "git add moves changes from your working directory to the staging area (also called the index). The staging area lets you carefully craft your next commit by choosing exactly which changes to include.",
    confidence: 0.95,
    examples: ["git add file.txt", "git add .", "git add -p (interactive staging)"],
    related: ["git commit", "git status", "git reset"],
  },
  "git commit": {
    explanation: "git commit creates a permanent snapshot of your staged changes in the repository history. Each commit gets a unique SHA-1 hash identifier, and should have a clear message explaining what changed and why.",
    confidence: 0.96,
    examples: ["git commit -m 'Add user authentication'", "git commit --amend (modify last commit)"],
    related: ["git add", "git log", "git push"],
  },
  "git branch": {
    explanation: "Branches in Git are lightweight pointers to commits. They allow parallel lines of development. The 'main' branch is the default. Feature branches keep experimental work isolated from stable code.",
    confidence: 0.94,
    examples: ["git branch feature/login", "git branch -d old-feature (delete branch)", "git branch -v (list with last commit)"],
    related: ["git checkout", "git merge", "git switch"],
  },
  "git merge": {
    explanation: "git merge integrates changes from one branch into another. There are two strategies: fast-forward (linear history, when no divergence) and three-way merge (creates a merge commit when branches diverged).",
    confidence: 0.91,
    examples: ["git merge feature/login", "git merge --no-ff feature/login (force merge commit)", "git merge --squash (squash into single commit)"],
    related: ["git rebase", "git cherry-pick", "git branch"],
  },
  "git rebase": {
    explanation: "git rebase replays your commits on top of another branch, creating a clean linear history. Unlike merge, it rewrites commit history. Never rebase shared/public branches as it creates diverged histories for collaborators.",
    confidence: 0.88,
    examples: ["git rebase main", "git rebase -i HEAD~3 (interactive rebase)", "git rebase --onto main feature/old feature/new"],
    related: ["git merge", "git cherry-pick", "git log"],
  },
  "git stash": {
    explanation: "git stash temporarily saves your uncommitted changes (both staged and unstaged) and reverts your working directory to the last commit. Use it when you need to switch context quickly without committing incomplete work.",
    confidence: 0.93,
    examples: ["git stash", "git stash pop (restore latest)", "git stash list", "git stash apply stash@{2} (restore specific)"],
    related: ["git branch", "git checkout", "git pop"],
  },
  "git log": {
    explanation: "git log displays the commit history of the repository. It shows commit hashes, authors, dates, and messages. Powerful flags let you filter and format output to exactly what you need.",
    confidence: 0.97,
    examples: ["git log --oneline", "git log --graph --all --decorate", "git log --author='Jane' --since='2 weeks ago'"],
    related: ["git status", "git diff", "git show"],
  },
  "merge conflict": {
    explanation: "A merge conflict occurs when two branches modify the same part of a file differently. Git marks conflicts with <<<<<<, =======, and >>>>>>> markers. You must manually choose which version to keep, then stage and commit the resolved file.",
    confidence: 0.89,
    examples: ["Open conflicted file → edit to resolve → git add → git commit", "git mergetool (visual merge tool)", "git merge --abort (cancel the merge)"],
    related: ["git merge", "git rebase", "git diff"],
  },
  "git reset": {
    explanation: "git reset moves the HEAD pointer and optionally modifies the staging area and working directory. --soft keeps changes staged, --mixed (default) unstages changes, --hard discards all changes. Use with caution on shared branches.",
    confidence: 0.86,
    examples: ["git reset HEAD~1 (undo last commit, keep changes)", "git reset --soft HEAD~2", "git reset --hard HEAD (discard all uncommitted changes)"],
    related: ["git revert", "git checkout", "git clean"],
  },
};

function getExplanation(concept: string, sessionCount: number, userCorrections: number) {
  const key = concept.toLowerCase().trim();
  const match = Object.keys(GIT_EXPLANATIONS).find(k => key.includes(k) || k.includes(key));
  
  const base = match ? GIT_EXPLANATIONS[match] : {
    explanation: `${concept} is an important Git concept. In Git, everything revolves around tracking changes to files over time. Understanding this concept will help you collaborate effectively with your team and manage your codebase confidently.`,
    confidence: 0.65,
    examples: [`git ${concept.split(' ')[0] || 'help'}`, `git --help ${concept.split(' ')[0] || ''}`],
    related: ["git status", "git log", "git add"],
  };

  let adjustedConfidence = base.confidence;
  if (sessionCount < 2) adjustedConfidence -= 0.08;
  if (userCorrections > 0) adjustedConfidence = Math.min(0.99, adjustedConfidence + (userCorrections * 0.02));

  const confidenceLevel = adjustedConfidence >= 0.9 ? "high" : adjustedConfidence >= 0.75 ? "medium" : "low";
  
  let confidenceReason = "";
  if (sessionCount <= 1) {
    confidenceReason = `Confidence: ${confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1)} — based on ${sessionCount} session. More sessions improve accuracy.`;
  } else {
    confidenceReason = `Confidence: ${confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1)} — based on ${sessionCount} sessions`;
    if (userCorrections > 0) {
      confidenceReason += ` and ${userCorrections} user correction${userCorrections > 1 ? 's' : ''} that improved my accuracy`;
    }
  }

  return { ...base, adjustedConfidence, confidenceLevel, confidenceReason };
}

router.post("/ai/explain", async (req, res) => {
  try {
    const { sessionId, concept } = req.body;
    
    let sessionCount = 1;
    let aiCorrections = 0;
    
    if (sessionId) {
      const [progress] = await db.select().from(userProgressTable).where(eq(userProgressTable.sessionId, sessionId));
      if (progress) {
        sessionCount = progress.sessionCount;
        aiCorrections = progress.aiCorrections;
      }
    }

    const { explanation, examples, related, adjustedConfidence, confidenceLevel, confidenceReason } = getExplanation(concept, sessionCount, aiCorrections);

    res.json({
      explanation,
      confidence: confidenceLevel,
      confidenceScore: Math.round(adjustedConfidence * 100) / 100,
      confidenceReason,
      examples,
      relatedConcepts: related,
      sessionAware: sessionCount > 1,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate explanation" });
  }
});

router.post("/ai/correct", async (req, res) => {
  try {
    const { sessionId, concept, userCorrection } = req.body;
    
    if (sessionId) {
      const [progress] = await db.select().from(userProgressTable).where(eq(userProgressTable.sessionId, sessionId));
      if (progress) {
        const corrections = (progress.sessionCorrections as object[]) || [];
        corrections.push({ concept, correction: userCorrection, timestamp: new Date().toISOString() });
        await db.update(userProgressTable)
          .set({ 
            aiCorrections: progress.aiCorrections + 1,
            sessionCorrections: corrections,
          })
          .where(eq(userProgressTable.sessionId, sessionId));
      }
    }

    const acknowledgment = `You're absolutely right! Thank you for that correction.`;
    const updatedExplanation = `Based on your correction: "${userCorrection}" — I've updated my understanding of ${concept}. This is a great point that many learners find clarifying. I'll incorporate this nuance into future explanations.`;
    
    res.json({
      acknowledgment,
      updatedExplanation,
      learned: true,
      thankYouMessage: "Your correction has been saved and will improve accuracy for this session. The AI trainer learns from you!",
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
        plan: "Start with the fundamentals. You'll learn what Git is, how to initialize repositories, stage changes, and make your first commits. Then connect to GitHub to start sharing your work.",
        weeklyGoals: ["Understand version control concepts", "Make 5 commits using git init, add, commit", "Create a GitHub account and push your first repo"],
        recommendedLessons: ["git-intro", "git-init", "git-add", "git-commit", "git-status-log", "github-connect"],
        weeks: 3,
      },
      intermediate: {
        plan: "Build on your Git foundation by mastering branching workflows. You'll learn to work in parallel on features, collaborate with teams, and handle merge conflicts confidently.",
        weeklyGoals: ["Master git branch and merge workflow", "Resolve your first merge conflict", "Use git pull/push with a team on GitHub"],
        recommendedLessons: ["git-branch", "git-checkout-switch", "git-merge", "git-pull-push", "merge-conflicts", "git-stash"],
        weeks: 4,
      },
      advanced: {
        plan: "Level up to professional Git workflows. Master history rewriting with rebase, debugging with bisect, automating with hooks, and deploying with GitHub Actions.",
        weeklyGoals: ["Rebase a feature branch cleanly onto main", "Set up a pre-commit hook for linting", "Create a GitHub Actions CI/CD pipeline"],
        recommendedLessons: ["git-rebase", "git-cherry-pick", "interactive-rebase", "git-bisect", "git-hooks", "github-actions"],
        weeks: 5,
      },
    };

    const levelKey = (currentLevel || "beginner").toLowerCase();
    const planData = LEVEL_PLANS[levelKey] || LEVEL_PLANS.beginner;

    const sessions = sessionCount || 1;
    const confidenceScore = sessions <= 1 ? 0.65 : sessions <= 3 ? 0.75 : 0.88;
    const confidenceLevel = confidenceScore >= 0.85 ? "high" : confidenceScore >= 0.72 ? "medium" : "low";

    let goalNote = "";
    if (goals && goals.length > 0) {
      goalNote = ` Your specific goals (${goals.join(", ")}) have been incorporated into this plan.`;
    }

    res.json({
      plan: planData.plan + goalNote,
      weeklyGoals: planData.weeklyGoals,
      recommendedLessons: planData.recommendedLessons,
      confidence: confidenceLevel,
      confidenceScore,
      confidenceReason: `Confidence: ${confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1)} — based on ${sessions} session${sessions !== 1 ? 's' : ''}. ${sessions < 3 ? 'More sessions allow better personalization.' : 'Good session history for accurate planning.'}`,
      estimatedCompletionWeeks: Math.ceil(planData.weeks / Math.max(1, Math.floor(availableHoursPerWeek / 3))),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate study plan" });
  }
});

router.post("/ai/validate-command", async (req, res) => {
  try {
    const { command, expectedCommand } = req.body;
    
    const trimmed = (command || "").trim().toLowerCase();
    const expected = (expectedCommand || "").trim().toLowerCase();
    
    const COMMAND_OUTPUTS: Record<string, string> = {
      "git init": "Initialized empty Git repository in /home/user/project/.git/",
      "git add .": "",
      "git add readme.md": "",
      "git status": "On branch main\nnothing to commit, working tree clean",
      "git log": "commit abc1234def5678 (HEAD -> main)\nAuthor: You <you@example.com>\nDate:   Fri Mar 28 10:00:00 2026\n\n    Initial commit",
      "git log --oneline": "abc1234 (HEAD -> main) Initial commit",
      "git branch": "* main\n  feature/my-feature",
      "git branch feature/my-feature": "",
      "git merge feature/my-feature": "Updating abc1234..def5678\nFast-forward\n README.md | 1 +\n 1 file changed, 1 insertion(+)",
      "git stash": "Saved working directory and index state WIP on main: abc1234 Initial commit",
      "git stash pop": "On branch main\nChanges not staged for commit:\n  modified: README.md\nDropped refs/stash@{0}",
      "git push origin main": "Enumerating objects: 3, done.\nCounting objects: 100% (3/3), done.\nTo https://github.com/user/repo.git\n * [new branch]      main -> main",
      "git pull": "Already up to date.",
      "git rebase main": "Successfully rebased and updated refs/heads/feature/my-feature",
      "git cherry-pick abc1234": "[main def5678] Fix critical bug\n 1 file changed, 1 insertion(+)",
    };

    let isCorrect = false;
    let feedback = "";
    let simulatedOutput = "";
    let hint = "";
    let confidenceScore = 0.93;

    if (!trimmed) {
      isCorrect = false;
      feedback = "Please type a git command.";
      hint = "All git commands start with 'git', for example: git status";
    } else if (!trimmed.startsWith("git")) {
      isCorrect = false;
      feedback = "Git commands must start with 'git'.";
      hint = `Did you mean: git ${trimmed}?`;
      confidenceScore = 0.98;
    } else if (expected && (trimmed === expected || trimmed.includes(expected.replace(/^git\s+/, "")))) {
      isCorrect = true;
      feedback = "Correct! Well done!";
      simulatedOutput = COMMAND_OUTPUTS[trimmed] || COMMAND_OUTPUTS[expected] || "Command executed successfully.";
    } else if (expected) {
      isCorrect = false;
      feedback = `Not quite. You typed "${command}" but the expected command was different.`;
      hint = `Hint: The command starts with "${expected.split(" ")[0]} ${expected.split(" ")[1] || ""}"`;
      confidenceScore = 0.95;
    } else {
      const exactMatch = COMMAND_OUTPUTS[trimmed];
      if (exactMatch !== undefined) {
        isCorrect = true;
        feedback = "Valid git command!";
        simulatedOutput = exactMatch || "Command executed successfully.";
      } else if (trimmed.startsWith("git commit -m")) {
        isCorrect = true;
        const message = trimmed.match(/"([^"]+)"|'([^']+)'/)?.[1] || "update";
        simulatedOutput = `[main abc1234] ${message}\n 1 file changed, 1 insertion(+)`;
        feedback = "Commit created successfully!";
      } else {
        isCorrect = false;
        feedback = `Command "${command}" is not recognized in this simulator. Try a standard git command.`;
        hint = "Try commands like: git init, git add, git commit, git status, git log";
        confidenceScore = 0.78;
      }
    }

    const gitTreeUpdate = isCorrect ? { action: trimmed.split(" ")[1], command: trimmed } : null;

    res.json({
      isCorrect,
      feedback,
      simulatedOutput,
      gitTreeUpdate,
      hint,
      confidence: confidenceScore >= 0.9 ? "high" : confidenceScore >= 0.75 ? "medium" : "low",
      confidenceScore,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to validate command" });
  }
});

export default router;
