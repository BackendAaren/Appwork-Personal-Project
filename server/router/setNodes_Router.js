import express from "express";
import { setClusterNodes, setNodes } from "../controller/setNodesController.js";

const router = express.Router();

router.route("/set-nodes").post(setNodes);

router.route("/set_clusterNodes").post(setClusterNodes);

export default router;
