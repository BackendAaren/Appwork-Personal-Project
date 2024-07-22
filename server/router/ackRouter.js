import express from "express";
import { autoAcknowledgement } from "../controller/ackController.js";
const router = express.Router();

router.route("/ack/:channel/:messageID").post(autoAcknowledgement);

export default router;
