import express from "express";
import { enqueue } from "../controller/enqueueController.js";
const router = express.Router();

router.route("/enqueue/:channel").post(enqueue);

export default router;
