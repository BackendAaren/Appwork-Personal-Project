import express from "express";
import { dequeue } from "../controller/dequeueController.js";
const router = express.Router();

router.route("/dequeue/:channel").get(dequeue);

export default router;
