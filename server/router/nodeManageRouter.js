import express from "express";
import {
  checkNodeHealth,
  checkNodeStatus,
  receiveNodesCameUp,
} from "../controller/nodeManageController.js";
const router = express.Router();

router.route("/health").post(checkNodeHealth);
router.route("/status").post(checkNodeStatus);
router.route("/nodeCameUp").post(receiveNodesCameUp);

export default router;
