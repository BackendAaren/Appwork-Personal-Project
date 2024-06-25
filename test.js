let availableNodes = [3002];
let testNodes = [3002, 3003, 3004];

const nodesCameUp = availableNodes.filter((node) => !testNodes.has(node));
console.log(nodesCameUp);
