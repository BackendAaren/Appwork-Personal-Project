export class MessageType {
  constructor(channel, messageType, payload) {
    this.messageId = messageId; //information unique id
    this.channel = channel;
    this.messageType = messageType;
    this.payload = payload;
  }
}

class Message {
  constructor(id, content) {
    this.id = id;
    this.content = content;
    this.acknowledged = false;
  }
}

export class MessageQueue {
  constructor() {
    this.channels = {};
    this.waiting = {};
  }

  async enqueue(channel, messageType, payload) {
    const message = new MessageType(channel, messageType, payload);
    if (!this.channels[channel]) {
      this.channels[channel] = [];
    }

    const messageId = this.channels[channel].length + 1;
    const newMessage = new Message(messageId, message);
    this.channels[channel].push(newMessage);
    this.processNext(channel);
  }

  async dequeue(channel) {
    if (!this.channels[channel]) {
      this.channels[channel] = [];
    }

    while (true) {
      if (this.channels[channel].length > 0) {
        const message = this.channels[channel][0];
        if (message.acknowledged) {
          this.channels[channel].shift();
          return message.content;
        }
      }
      await new Promise((resolve) => {
        if (!this.waiting[channel]) {
          this.waiting[channel] = [];
        }
        this.waiting[channel].push(resolve);
      });
    }
  }

  acknowledge(channel, messageId) {
    const channelMessage = this.channels[channel];
    if (!channelMessage || channelMessage.length === 0) {
      return;
    }
    const message = channelMessage.find((msg) => msg.id === messageId);
    if (message) {
      message.acknowledged = true;
    }

    this.processNext(channel);
  }

  processNext(channel) {
    if (this.waiting[channel] && this.waiting[channel].length > 0) {
      const resolveNext = this.waiting[channel].shift();
      resolveNext();
    }
  }
}
