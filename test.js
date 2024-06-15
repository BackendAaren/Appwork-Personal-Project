// get the reference of EventEmitter class of events module
import events from "events";
//create an object of EventEmitter class by using above reference.
var em = new events.EventEmitter();
//綁定事件函式
em.on("FirstEvent", function (data) {
  console.log("First subscriber:" + data);
});
//emit觸發事件
em.emit("FirstEvent", "我已經進入了第一事件的監聽函式!");
