import { checkNodeStatus } from "./nodeManageController.js";
import { describe, expect, it, vi } from "vitest";
import * as nodeManagerModule from "./nodeManager.js"; // 引入整個模塊

vi.mock("./nodeManager.js", () => {
  // 模擬整個模塊，特別是NodeManager類
  return {
    ...vi.importActual("./nodeManager.js"),
    NodeManager: vi.fn().mockImplementation(() => {
      return {
        getPrimaryNodes: vi.fn(),
      };
    }),
  };
});

describe("checkNodeStatus", () => {
  it("should return primary node status", async () => {
    const mockPrimaryNodes = [{ id: 1, status: "200" }];

    // 獲取模擬的 NodeManager 實例並設置返回值
    const nodeManager = new nodeManagerModule.NodeManager();
    nodeManager.getPrimaryNodes.mockReturnValue(mockPrimaryNodes);

    const req = {};
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // 使用測試中的 nodeManager 實例
    await checkNodeStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ primaryNodes: mockPrimaryNodes });
  });
});
