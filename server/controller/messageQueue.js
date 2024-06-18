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
    this.monitorClients = new Set();
    this.monitorStatus = {
      consumedCount: 0,
      completedMessage: null,
      processingMessage: null,
      processingPercentage: 0,
    };
    this.stats = {
      length: {},
      throughput: {},
      delay: {},
      blocked: {},
    };
  }

  async enqueue(channel, message) {
    const enqueueTime = Date.now();
    if (!this.channels[channel]) {
      this.channels[channel] = [];
    }
    this.channels[channel].push(message);

    //監控佇列長度
    this.stats.length[channel] = this.channels[channel].length;
    //計算吞吐量
    if (!this.stats.throughput[channel]) {
      this.stats.throughput[channel] = { in: 0, out: 0 };
    }
    this.stats.throughput[channel].in += 1;
    message.enqueueTime = enqueueTime;
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
    const message = this.channels[channel].shift();

    //計算throughput
    if (!this.stats.throughput[channel]) {
      this.stats.throughput[channel] = { in: 0, out: 0 };
    }
    this.stats.throughput[channel].out += 1;

    //計算延遲

    const dequeueTime = Date.now();
    this.stats.delay[channel] = dequeueTime - message.enqueueTime;

    return message;
  }

  getStats() {
    return this.stats;
  }
}
