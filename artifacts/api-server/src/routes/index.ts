import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import sftpRouter from "./sftp.js";
import keysRouter from "./keys.js";
import { requireAuth } from "../middleware/auth.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requireAuth);
router.use(sftpRouter);
router.use(keysRouter);

export default router;
