// MessageType class
export class MessageType {
  constructor(messageId, channel, messageType, payload) {
    this.messageId = messageId; // 每個訊息的唯一識別碼
    this.channel = channel;
    this.messageType = messageType;
    this.payload = payload;
  }
}

// MessageQueue class
export class MessageQueue {
  constructor() {
    this.channels = {};
    this.waiting = {};
    this.pendingMessages = {}; // 追踪等待確認回執的訊息
  }

  async enqueue(channel, message) {
    if (!this.channels[channel]) {
      this.channels[channel] = [];
    }

    // Assign a unique messageId to the message
    const messageId = Math.random().toString(36).substr(2, 9); // 簡易的唯一識別碼產生方式

    const messageTypeObj = new MessageType(
      messageId,
      channel,
      message.messageType,
      message.payload
    );

    this.channels[channel].push(messageTypeObj);

    // 將訊息加入待確認回執的列表
    this.pendingMessages[messageId] = messageTypeObj;

    // 若 dequeue 進入等待狀態，enqueue 將 resolve 通知 dequeue 繼續運作
    if (this.waiting[channel] && this.waiting[channel].length > 0) {
      const resolveNext = this.waiting[channel].shift();
      resolveNext();
    }

    // 返回 messageId，供接收者後續發送確認回執使用
    return messageId;
  }

  async dequeue(channel) {
    if (!this.channels[channel]) {
      this.channels[channel] = [];
    }

    while (this.channels[channel].length === 0) {
      if (!this.waiting[channel]) {
        this.waiting[channel] = [];
      }
      await new Promise((resolve) => this.waiting[channel].push(resolve));
    }

    // 取出訊息
    const messageTypeObj = this.channels[channel].shift();
    const messageId = messageTypeObj.messageId;

    // 等待確認回執
    while (!this.pendingMessages[messageId]) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待一段時間後重新檢查
    }

    // 從待確認回執的列表中刪除該訊息
    delete this.pendingMessages[messageId];

    return messageTypeObj;
  }

  // 接收者使用此方法來發送確認回執
  async acknowledge(messageId) {
    if (this.pendingMessages[messageId]) {
      delete this.pendingMessages[messageId]; // 刪除待確認回執的列表中的該訊息
      return true; // 確認成功
    } else {
      return false; // 訊息不存在或已經確認過
    }
  }
}
