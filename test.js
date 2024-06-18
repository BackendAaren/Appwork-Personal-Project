import osUtils from "node-os-utils";

// 監控 CPU 使用率
osUtils.cpu.usage().then((cpuPercentage) => {
  console.log(`Current CPU Usage`, cpuPercentage);
});

// 監控記憶體使用量

setInterval(() => {
  osUtils.mem.info().then((memInfo) => {
    console.log("Total Memory:", memInfo.totalMemMb, "MB");
    console.log("Free Memory:", memInfo.freeMemMb, "MB");
    console.log("Used Memory:", memInfo.usedMemMb, "MB");
    console.log(memInfo);
  });
}, 1000);
