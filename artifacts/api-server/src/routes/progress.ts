import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { userProgressTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const XP_THRESHOLDS = {
  beginner: 0,
  intermediate: 500,
  advanced: 1200,
};

function calculateLevel(xp: number): string {
  if (xp >= XP_THRESHOLDS.advanced) return "advanced";
  if (xp >= XP_THRESHOLDS.intermediate) return "intermediate";
  return "beginner";
}

router.get("/progress", async (req, res) => {
  try {
    const { sessionId } = req.query as { sessionId: string };
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    let [progress] = await db.select().from(userProgressTable).where(eq(userProgressTable.sessionId, sessionId));
    
    if (!progress) {
      await db.insert(userProgressTable).values({
        sessionId,
        completedLessons: [],
        totalXp: 0,
        currentLevel: "beginner",
        streak: 0,
        sessionCount: 1,
        goals: ["Learn Git basics", "Make my first commit"],
        aiCorrections: 0,
        sessionCorrections: [],
      });
      [progress] = await db.select().from(userProgressTable).where(eq(userProgressTable.sessionId, sessionId));
    }

    res.json({
      sessionId: progress.sessionId,
      completedLessons: progress.completedLessons,
      totalXp: progress.totalXp,
      currentLevel: progress.currentLevel,
      streak: progress.streak,
      sessionCount: progress.sessionCount,
      goals: progress.goals,
      aiCorrections: progress.aiCorrections,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

router.post("/progress/complete", async (req, res) => {
  try {
    const { sessionId, lessonId, timeSpentMinutes } = req.body;
    if (!sessionId || !lessonId) {
      return res.status(400).json({ error: "sessionId and lessonId are required" });
    }

    let [progress] = await db.select().from(userProgressTable).where(eq(userProgressTable.sessionId, sessionId));
    
    if (!progress) {
      await db.insert(userProgressTable).values({
        sessionId,
        completedLessons: [],
        totalXp: 0,
        currentLevel: "beginner",
        streak: 0,
        sessionCount: 1,
        goals: [],
        aiCorrections: 0,
        sessionCorrections: [],
      });
      [progress] = await db.select().from(userProgressTable).where(eq(userProgressTable.sessionId, sessionId));
    }

    const completedLessons = progress.completedLessons as string[];
    if (completedLessons.includes(lessonId)) {
      return res.json({
        sessionId: progress.sessionId,
        completedLessons: progress.completedLessons,
        totalXp: progress.totalXp,
        currentLevel: progress.currentLevel,
        streak: progress.streak,
        sessionCount: progress.sessionCount,
        goals: progress.goals,
        aiCorrections: progress.aiCorrections,
      });
    }

    const xpGain = 100;
    const newXp = progress.totalXp + xpGain;
    const newCompleted = [...completedLessons, lessonId];
    const newLevel = calculateLevel(newXp);

    await db.update(userProgressTable)
      .set({
        completedLessons: newCompleted,
        totalXp: newXp,
        currentLevel: newLevel,
        streak: progress.streak + 1,
        lastActiveAt: new Date(),
      })
      .where(eq(userProgressTable.sessionId, sessionId));

    const [updated] = await db.select().from(userProgressTable).where(eq(userProgressTable.sessionId, sessionId));
    
    res.json({
      sessionId: updated.sessionId,
      completedLessons: updated.completedLessons,
      totalXp: updated.totalXp,
      currentLevel: updated.currentLevel,
      streak: updated.streak,
      sessionCount: updated.sessionCount,
      goals: updated.goals,
      aiCorrections: updated.aiCorrections,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to complete lesson" });
  }
});

export default router;
