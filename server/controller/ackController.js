import { MessageQueue, MessageType } from "./messageQueue.js";
import dotenv from "dotenv";
dotenv.config();
const PORT = process.env.PORT;
const host = process.env.SERVER_HOST;

const messageQueue = new MessageQueue(process.env.SERVER_HOST, PORT);

export const autoAcknowledgement = async (req, res) => {
  const { channel, messageID } = req.params;
  try {
    const success = await messageQueue.ack(channel, messageID);
    if (success) {
      res.status(200).send({
        message: "Message acknowledged successfully",
        SuccessMessage: `${success}`,
      });
    } else {
      res.status(404).send({
        message: "Message can't be found",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: "Failed to acknowledge message",
      details: error.message,
    });
  }
};
