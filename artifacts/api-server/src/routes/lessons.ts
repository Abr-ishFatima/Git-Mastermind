import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { lessonsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const LESSONS_DATA = [
  {
    id: "git-intro",
    title: "What is Git?",
    description: "Understand version control and why Git is the industry standard for tracking code changes.",
    level: "beginner",
    order: 1,
    xpReward: 50,
    estimatedMinutes: 10,
    tags: ["version-control", "basics", "history"],
    steps: [
      { id: "s1", type: "concept", title: "Version Control Basics", content: "Git is a distributed version control system that tracks changes in your files over time. Every developer uses it." },
      { id: "s2", type: "concept", title: "Why Git?", content: "Git lets you collaborate with others, revert mistakes, and maintain a complete history of your project." },
      { id: "s3", type: "quiz", title: "Quick Check", content: "What does Git primarily do?", hint: "Think about tracking changes over time" }
    ]
  },
  {
    id: "git-init",
    title: "git init - Initialize a Repository",
    description: "Create your very first Git repository and understand what happens under the hood.",
    level: "beginner",
    order: 2,
    xpReward: 75,
    estimatedMinutes: 12,
    tags: ["init", "repository", "basics"],
    steps: [
      { id: "s1", type: "concept", title: "What is a Repository?", content: "A repository (repo) is a directory tracked by Git. It contains your files plus a hidden .git folder." },
      { id: "s2", type: "command", title: "Initialize Git", content: "Run git init to create a new repository in the current directory.", command: "git init", expectedOutput: "Initialized empty Git repository in .git/" },
      { id: "s3", type: "challenge", title: "Your Turn!", content: "Initialize a new repository", command: "git init", expectedOutput: "Initialized empty Git repository" }
    ]
  },
  {
    id: "git-add",
    title: "git add - Staging Files",
    description: "Learn how to stage changes before committing them to your repository.",
    level: "beginner",
    order: 3,
    xpReward: 100,
    estimatedMinutes: 15,
    tags: ["staging", "add", "index"],
    steps: [
      { id: "s1", type: "concept", title: "The Staging Area", content: "The staging area (index) is where you prepare changes before committing. Think of it as a draft area." },
      { id: "s2", type: "command", title: "Stage a file", content: "Use git add <filename> to stage a specific file, or git add . to stage all changes.", command: "git add README.md", expectedOutput: "" },
      { id: "s3", type: "challenge", title: "Stage Everything", content: "Stage all files in the directory", command: "git add .", expectedOutput: "" }
    ]
  },
  {
    id: "git-commit",
    title: "git commit - Saving Changes",
    description: "Create permanent snapshots of your staged changes with meaningful commit messages.",
    level: "beginner",
    order: 4,
    xpReward: 100,
    estimatedMinutes: 15,
    tags: ["commit", "snapshot", "message"],
    steps: [
      { id: "s1", type: "concept", title: "What is a Commit?", content: "A commit is a snapshot of your staged changes. Each commit has a unique hash, author, timestamp, and message." },
      { id: "s2", type: "command", title: "Create a Commit", content: "Use git commit -m 'message' to commit staged changes with a message.", command: "git commit -m 'Initial commit'", expectedOutput: "[main (root-commit) abc1234] Initial commit" },
      { id: "s3", type: "concept", title: "Good Commit Messages", content: "Write commit messages in imperative mood: 'Add feature' not 'Added feature'. Be descriptive but concise." }
    ]
  },
  {
    id: "git-status-log",
    title: "git status & git log",
    description: "Inspect your repository state and view the complete commit history.",
    level: "beginner",
    order: 5,
    xpReward: 75,
    estimatedMinutes: 12,
    tags: ["status", "log", "inspection"],
    steps: [
      { id: "s1", type: "command", title: "Check Status", content: "git status shows which files are modified, staged, or untracked.", command: "git status", expectedOutput: "On branch main\nnothing to commit, working tree clean" },
      { id: "s2", type: "command", title: "View History", content: "git log shows the full commit history with hashes, authors, and messages.", command: "git log --oneline", expectedOutput: "abc1234 Initial commit" }
    ]
  },
  {
    id: "github-connect",
    title: "Connecting to GitHub",
    description: "Link your local repository to GitHub and understand remote origins.",
    level: "beginner",
    order: 6,
    xpReward: 125,
    estimatedMinutes: 20,
    tags: ["github", "remote", "origin"],
    steps: [
      { id: "s1", type: "concept", title: "What is GitHub?", content: "GitHub is a cloud hosting platform for Git repositories. It enables collaboration and serves as a backup." },
      { id: "s2", type: "command", title: "Add Remote", content: "Connect your local repo to GitHub with git remote add origin <url>", command: "git remote add origin https://github.com/user/repo.git", expectedOutput: "" },
      { id: "s3", type: "command", title: "Push to GitHub", content: "Upload your commits to GitHub", command: "git push -u origin main", expectedOutput: "Branch 'main' set up to track remote branch 'main' from 'origin'." }
    ]
  },
  {
    id: "git-branch",
    title: "git branch - Creating Branches",
    description: "Master the art of branching to develop features in isolation without affecting main code.",
    level: "intermediate",
    order: 7,
    xpReward: 150,
    estimatedMinutes: 20,
    tags: ["branch", "feature", "isolation"],
    steps: [
      { id: "s1", type: "concept", title: "What is a Branch?", content: "A branch is an independent line of development. The default branch is called 'main'. Create branches for features or bug fixes." },
      { id: "s2", type: "command", title: "Create a Branch", content: "Create and switch to a new branch", command: "git branch feature/my-feature", expectedOutput: "" },
      { id: "s3", type: "command", title: "List Branches", content: "See all branches in your repo", command: "git branch", expectedOutput: "* main\n  feature/my-feature" }
    ]
  },
  {
    id: "git-checkout-switch",
    title: "git checkout & git switch",
    description: "Navigate between branches and understand the difference between the two commands.",
    level: "intermediate",
    order: 8,
    xpReward: 125,
    estimatedMinutes: 15,
    tags: ["checkout", "switch", "navigate"],
    steps: [
      { id: "s1", type: "command", title: "Switch with checkout", content: "The classic way to switch branches", command: "git checkout feature/my-feature", expectedOutput: "Switched to branch 'feature/my-feature'" },
      { id: "s2", type: "command", title: "Switch with switch", content: "The modern way to switch branches (Git 2.23+)", command: "git switch feature/my-feature", expectedOutput: "Switched to branch 'feature/my-feature'" },
      { id: "s3", type: "command", title: "Create and Switch", content: "Create a branch and switch to it in one command", command: "git switch -c feature/new-thing", expectedOutput: "Switched to a new branch 'feature/new-thing'" }
    ]
  },
  {
    id: "git-merge",
    title: "git merge - Combining Work",
    description: "Learn merge strategies to integrate work from different branches.",
    level: "intermediate",
    order: 9,
    xpReward: 175,
    estimatedMinutes: 25,
    tags: ["merge", "fast-forward", "three-way"],
    steps: [
      { id: "s1", type: "concept", title: "Merge Strategies", content: "Fast-forward merge (linear history) vs Three-way merge (creates merge commit). Both integrate changes." },
      { id: "s2", type: "command", title: "Merge a Branch", content: "Merge feature branch into main", command: "git merge feature/my-feature", expectedOutput: "Updating abc1234..def5678\nFast-forward" },
      { id: "s3", type: "concept", title: "No Fast-Forward", content: "Use --no-ff to always create a merge commit, preserving branch history." }
    ]
  },
  {
    id: "git-pull-push",
    title: "git pull & git push",
    description: "Synchronize your local repository with remote and collaborate with your team.",
    level: "intermediate",
    order: 10,
    xpReward: 150,
    estimatedMinutes: 20,
    tags: ["pull", "push", "remote", "sync"],
    steps: [
      { id: "s1", type: "command", title: "Pull Changes", content: "Fetch and merge remote changes", command: "git pull origin main", expectedOutput: "Already up to date." },
      { id: "s2", type: "command", title: "Push Changes", content: "Upload your commits to remote", command: "git push origin feature/my-feature", expectedOutput: "To https://github.com/user/repo.git\n * [new branch]  feature/my-feature -> feature/my-feature" }
    ]
  },
  {
    id: "merge-conflicts",
    title: "Merge Conflicts - Resolving Them",
    description: "Don't fear merge conflicts! Learn to identify, understand, and resolve them like a pro.",
    level: "intermediate",
    order: 11,
    xpReward: 200,
    estimatedMinutes: 30,
    tags: ["conflicts", "merge", "resolve"],
    steps: [
      { id: "s1", type: "concept", title: "Why Conflicts Happen", content: "Conflicts occur when two branches modify the same lines. Git marks them with <<<<<<, =======, >>>>>>>" },
      { id: "s2", type: "concept", title: "Reading Conflict Markers", content: "<<<< HEAD is your changes. >>>> branch-name is incoming. Choose which to keep or combine both." },
      { id: "s3", type: "command", title: "After Resolving", content: "Stage the resolved file and commit", command: "git add . && git commit -m 'Resolve merge conflict'", expectedOutput: "[main abc1234] Resolve merge conflict" }
    ]
  },
  {
    id: "git-stash",
    title: "git stash - Temporary Storage",
    description: "Save your work-in-progress temporarily to switch context without losing changes.",
    level: "intermediate",
    order: 12,
    xpReward: 125,
    estimatedMinutes: 15,
    tags: ["stash", "temporary", "context-switch"],
    steps: [
      { id: "s1", type: "command", title: "Stash Changes", content: "Save uncommitted changes to stash", command: "git stash", expectedOutput: "Saved working directory and index state WIP on main" },
      { id: "s2", type: "command", title: "Apply Stash", content: "Restore stashed changes", command: "git stash pop", expectedOutput: "On branch main\nChanges not staged for commit:" }
    ]
  },
  {
    id: "git-rebase",
    title: "git rebase - Rewriting History",
    description: "Create a clean, linear history by replaying commits on top of another branch.",
    level: "advanced",
    order: 13,
    xpReward: 250,
    estimatedMinutes: 35,
    tags: ["rebase", "linear-history", "replay"],
    steps: [
      { id: "s1", type: "concept", title: "Rebase vs Merge", content: "Rebase replays your commits on top of another branch, creating a linear history without merge commits." },
      { id: "s2", type: "command", title: "Rebase onto Main", content: "Rebase your feature branch onto main", command: "git rebase main", expectedOutput: "Successfully rebased and updated refs/heads/feature/my-feature" },
      { id: "s3", type: "concept", title: "Golden Rule of Rebase", content: "Never rebase commits that have been pushed to a shared remote branch. It rewrites history." }
    ]
  },
  {
    id: "git-cherry-pick",
    title: "git cherry-pick - Selective Commits",
    description: "Apply specific commits from one branch to another without merging the entire branch.",
    level: "advanced",
    order: 14,
    xpReward: 225,
    estimatedMinutes: 25,
    tags: ["cherry-pick", "selective", "commits"],
    steps: [
      { id: "s1", type: "concept", title: "When to Cherry-Pick", content: "Use cherry-pick to bring a specific bug fix from one branch to another without merging all changes." },
      { id: "s2", type: "command", title: "Cherry-Pick a Commit", content: "Apply a specific commit by its hash", command: "git cherry-pick abc1234", expectedOutput: "[main def5678] Fix critical bug\n 1 file changed, 1 insertion(+)" }
    ]
  },
  {
    id: "interactive-rebase",
    title: "Interactive Rebase - Clean History",
    description: "Squash, reorder, and edit commits to create a beautiful, readable git history.",
    level: "advanced",
    order: 15,
    xpReward: 300,
    estimatedMinutes: 40,
    tags: ["interactive-rebase", "squash", "reorder"],
    steps: [
      { id: "s1", type: "command", title: "Start Interactive Rebase", content: "Rebase the last 3 commits interactively", command: "git rebase -i HEAD~3", expectedOutput: "Opens editor with commits listed..." },
      { id: "s2", type: "concept", title: "Rebase Commands", content: "pick=keep, squash=combine with previous, reword=edit message, drop=delete commit" },
      { id: "s3", type: "concept", title: "Squashing Commits", content: "Change 'pick' to 'squash' (or 's') on commits you want to combine into the one above." }
    ]
  },
  {
    id: "git-bisect",
    title: "git bisect - Finding Bugs",
    description: "Use binary search to find exactly which commit introduced a bug in your codebase.",
    level: "advanced",
    order: 16,
    xpReward: 275,
    estimatedMinutes: 30,
    tags: ["bisect", "debug", "binary-search"],
    steps: [
      { id: "s1", type: "command", title: "Start Bisect", content: "Begin the binary search process", command: "git bisect start", expectedOutput: "" },
      { id: "s2", type: "command", title: "Mark Bad Commit", content: "Mark current commit as bad (has the bug)", command: "git bisect bad", expectedOutput: "" },
      { id: "s3", type: "command", title: "Mark Good Commit", content: "Mark a known good commit", command: "git bisect good v1.0", expectedOutput: "Bisecting: 10 revisions left to test (roughly 4 steps)" }
    ]
  },
  {
    id: "git-hooks",
    title: "Git Hooks - Automation",
    description: "Automate tasks that run automatically when Git events occur, like pre-commit linting.",
    level: "advanced",
    order: 17,
    xpReward: 250,
    estimatedMinutes: 30,
    tags: ["hooks", "automation", "scripts"],
    steps: [
      { id: "s1", type: "concept", title: "What are Git Hooks?", content: "Hooks are scripts in .git/hooks/ that run automatically on Git events: pre-commit, post-commit, pre-push, etc." },
      { id: "s2", type: "concept", title: "Common Hooks", content: "pre-commit: run linters/tests before commit. commit-msg: validate commit message format. pre-push: run full test suite." },
      { id: "s3", type: "concept", title: "Husky for Teams", content: "Use Husky + lint-staged to share Git hooks across your team via package.json" }
    ]
  },
  {
    id: "github-actions",
    title: "GitHub Actions & CI/CD",
    description: "Automate your build, test, and deployment workflows using GitHub Actions.",
    level: "advanced",
    order: 18,
    xpReward: 350,
    estimatedMinutes: 45,
    tags: ["github-actions", "ci-cd", "automation", "workflows"],
    steps: [
      { id: "s1", type: "concept", title: "What is CI/CD?", content: "Continuous Integration/Deployment: automatically build, test, and deploy code on every push." },
      { id: "s2", type: "concept", title: "GitHub Actions Workflow", content: "Workflows are YAML files in .github/workflows/. They define triggers, jobs, and steps." },
      { id: "s3", type: "concept", title: "Common Patterns", content: "Test on PR: run tests on every pull request. Deploy on merge: deploy to production when merging to main." }
    ]
  }
];

async function seedLessons() {
  try {
    for (const lesson of LESSONS_DATA) {
      await db.insert(lessonsTable).values(lesson as any).onConflictDoNothing();
    }
  } catch (err) {
    // silent - already seeded
  }
}

seedLessons();

router.get("/lessons", async (_req, res) => {
  try {
    const lessons = await db.select({
      id: lessonsTable.id,
      title: lessonsTable.title,
      description: lessonsTable.description,
      level: lessonsTable.level,
      order: lessonsTable.order,
      xpReward: lessonsTable.xpReward,
      estimatedMinutes: lessonsTable.estimatedMinutes,
      tags: lessonsTable.tags,
    }).from(lessonsTable).orderBy(lessonsTable.order);
    
    const withLock = lessons.map((l, i) => ({ ...l, isLocked: false }));
    res.json(withLock);
  } catch (err) {
    req.log?.error({ err }, "Failed to get lessons");
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
});

router.get("/lessons/:id", async (req, res) => {
  try {
    const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, req.params.id));
    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lesson" });
  }
});

export default router;
