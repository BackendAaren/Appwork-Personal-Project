import { EventEmitter } from "events";
class Watcher extends EventEmitter {
  constructor() {
    super();
  }

  watch(eventName, callback) {
    this.on(eventName, callback);
  }

  trigger(eventName, data) {
    this.emit(eventName, data);
  }
}

export default Watcher;
