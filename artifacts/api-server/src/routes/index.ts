import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lessonsRouter from "./lessons";
import progressRouter from "./progress";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(lessonsRouter);
router.use(progressRouter);
router.use(aiRouter);

export default router;
