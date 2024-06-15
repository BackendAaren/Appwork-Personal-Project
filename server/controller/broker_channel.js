export class MessageType {
  constructor(channel, messageType, payload) {
    this.channel = channel;
    this.messageType = messageType;
    this.payload = payload;
  }
}

export class MessageQueue {
  constructor() {
    this.channels = {};
    this.waiting = {};
  }

  async enqueue(channel, message) {
    if (!this.channels[channel]) {
      this.channels[channel] = [];
    }
    this.channels[channel].push(message);
    //若dequeue進入等待狀態，enqueue將information推入channel將resolve取出告知dequeue繼續運作
    if (this.waiting[channel] && this.waiting[channel].length > 0) {
      const resolveNext = this.waiting[channel].shift();
      resolveNext();
    }
  }

  async dequeue(channel) {
    if (!this.channels[channel]) {
      this.channels[channel] = [];
    }

    while (this.channels[channel].length === 0) {
      if (!this.waiting[channel]) {
        this.waiting[channel] = [];
      }
      //當channel裡面沒有information時將resolve推入waiting進入等待狀態
      await new Promise((resolve) => this.waiting[channel].push(resolve));
    }
    return this.channels[channel].shift();
  }
}
