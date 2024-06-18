import { MessageQueue } from "./messageQueue.js";

const MAX_RETRIES = 3; // 設定最大重試次數

export default class Broker {
  constructor(messageQueue) {
    this.messageQueue = messageQueue;
    this.inProgressMessages = {}; // 追蹤正在處理的訊息
  }

  async processMessage(channel, handleMessage) {
    while (true) {
      const message = await this.messageQueue.dequeue(channel);
      if (!message) continue; // 如果 dequeue 返回 null，繼續等待下一個訊息

      const messageId = message.messageId; // 假設 MessageType 類有 messageId 欄位

      // 檢查是否已經處理過這個訊息，如果是則跳過
      if (this.inProgressMessages[messageId]) continue;

      try {
        // 處理訊息
        await handleMessage(message.payload);

        // 訊息處理成功，從 inProgressMessages 中移除
        delete this.inProgressMessages[messageId];

        // 手動確認，從 message queue 中移除訊息
        await this.messageQueue.confirm(channel);
      } catch (error) {
        console.error(`Error processing message ${messageId}:`, error);

        // 處理失敗，增加重試次數
        message.retries = message.retries ? message.retries + 1 : 1;

        // 如果重試次數未達上限，重新加入 message queue 中等待重試
        if (message.retries <= MAX_RETRIES) {
          await this.messageQueue.requeue(channel, message);
          console.log(
            `Message ${messageId} requeued for retry (${message.retries}/${MAX_RETRIES})`
          );
        } else {
          console.log(
            `Message ${messageId} retries exceeded. Message discarded.`
          );
        }
      }
    }
  }
}
