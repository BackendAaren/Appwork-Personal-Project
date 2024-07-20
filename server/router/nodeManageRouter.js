import express from "express";
import {
  checkNodeHealth,
  checkNodeStatus,
  receiveNodesCameUp,
} from "../controller/nodeManageController.js";
const router = express.Router();

router.route("/health").get(checkNodeHealth);
router.route("/status").get(checkNodeStatus);
router.route("/nodeCameUp").post(receiveNodesCameUp);

export default router;
