import express from "express";
import {
  nodesBackup,
  updateBackupNodes,
  backupNodeRecoverMessage,
} from "../controller/nodesBackupController.js";
const router = express.Router();

router.route("/backup/:channel").post(nodesBackup);

router.route("/updateBackupNode/:channel").post(updateBackupNodes);

router.route("/backupNodeRecoverMessage").post(backupNodeRecoverMessage);

export default router;
