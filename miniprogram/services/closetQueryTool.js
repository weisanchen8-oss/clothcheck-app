const db = wx.cloud.database();

function getCurrentWardrobeId() {
  return wx.getStorageSync("currentWardrobeId") || "";
}

async function getActiveClothesByCurrentWardrobe() {
  const wardrobeId = getCurrentWardrobeId();

  if (!wardrobeId) {
    return {
      success: false,
      toolName: "closetQueryTool",
      wardrobeId: "",
      data: [],
      message: "当前没有选中的衣柜"
    };
  }

  const res = await db
    .collection("clothes")
    .where({
      wardrobeId,
      status: "active"
    })
    .get();

  const clothes = res.data || [];

  return {
    success: true,
    toolName: "closetQueryTool",
    wardrobeId,
    data: clothes,
    message: `读取衣柜：找到 ${clothes.length} 件可用衣物`
  };
}

module.exports = {
  getCurrentWardrobeId,
  getActiveClothesByCurrentWardrobe
};