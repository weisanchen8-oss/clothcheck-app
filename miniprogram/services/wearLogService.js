const db = wx.cloud.database();

const MAIN_CATEGORIES = ["top", "bottom", "outerwear", "dress", "shoes"];

function getCurrentUserId() {
  return wx.getStorageSync("userId") || "";
}

function getCurrentWardrobeId() {
  return wx.getStorageSync("currentWardrobeId") || "";
}

function getTodayDateText() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeClothingIds(ids) {
  return [...(ids || [])].sort();
}

function isSameClothingIds(a, b) {
  const listA = normalizeClothingIds(a);
  const listB = normalizeClothingIds(b);

  if (listA.length !== listB.length) return false;

  return listA.every((id, index) => id === listB[index]);
}

function buildOutfitSignature(outfit) {
  const items = outfit.items || [];

  const mainIds = items
    .filter((item) => MAIN_CATEGORIES.includes(item.category))
    .map((item) => item._id);

  const ids = mainIds.length > 0 ? mainIds : outfit.clothingIds || [];

  return normalizeClothingIds(ids).join("_");
}

async function findExistingWearLog(wardrobeId, date, clothingIds) {
  const res = await db
    .collection("wear_logs")
    .where({
      wardrobeId,
      date
    })
    .get();

  const logs = res.data || [];

  return logs.find((log) => {
    return isSameClothingIds(log.clothingIds || [], clothingIds || []);
  });
}

async function saveTodayWearLog(outfit, weather) {
  try {
    const userId = getCurrentUserId();
    const wardrobeId = getCurrentWardrobeId();
    const date = getTodayDateText();

    if (!wardrobeId) throw new Error("缺少当前衣柜 ID，无法保存穿搭记录");
    if (!outfit || !Array.isArray(outfit.clothingIds) || outfit.clothingIds.length === 0) {
      throw new Error("当前搭配没有衣物，无法保存");
    }

    const existing = await findExistingWearLog(
      wardrobeId,
      date,
      outfit.clothingIds
    );

    if (existing) {
      return {
        success: true,
        duplicated: true,
        wearLogId: existing._id,
        errorMessage: ""
      };
    }

    const outfitSignature = buildOutfitSignature(outfit);

    const record = {
      userId,
      wardrobeId,
      date,

      outfitId: "",
      outfitSignature,
      clothingIds: outfit.clothingIds,

      weatherSnapshot: {
        temperature: weather?.temperature ?? null,
        tempMin: weather?.tempMin ?? null,
        tempMax: weather?.tempMax ?? null,
        weatherText: weather?.weatherText || "",
        windLevel: weather?.windLevel || "",
        humidity: weather?.humidity ?? null,
        source: weather?.source || ""
      },

      scene: "daily",
      source: "recommendation",
      note: outfit.reason || "",

      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    };

    const addRes = await db.collection("wear_logs").add({
      data: record
    });

    return {
      success: true,
      duplicated: false,
      wearLogId: addRes._id,
      errorMessage: ""
    };
  } catch (err) {
    console.error("[wearLogService] 保存穿搭记录失败：", err);

    return {
      success: false,
      duplicated: false,
      wearLogId: "",
      errorMessage: err.message || "保存穿搭记录失败"
    };
  }
}

async function listWearLogsByCurrentWardrobe() {
  try {
    const wardrobeId = getCurrentWardrobeId();

    if (!wardrobeId) throw new Error("缺少当前衣柜 ID");

    const res = await db
      .collection("wear_logs")
      .where({ wardrobeId })
      .orderBy("date", "desc")
      .orderBy("createdAt", "desc")
      .get();

    return {
      success: true,
      data: res.data || [],
      errorMessage: ""
    };
  } catch (err) {
    console.error("[wearLogService] 读取穿搭记录失败：", err);

    return {
      success: false,
      data: [],
      errorMessage: err.message || "读取穿搭记录失败"
    };
  }
}

async function updateWearLogDate(wearLogId, date) {
  try {
    if (!wearLogId) throw new Error("缺少穿搭记录 ID");
    if (!date) throw new Error("请选择日期");

    await db.collection("wear_logs").doc(wearLogId).update({
      data: {
        date,
        updatedAt: db.serverDate()
      }
    });

    return {
      success: true,
      errorMessage: ""
    };
  } catch (err) {
    console.error("[wearLogService] 修改穿搭日期失败：", err);

    return {
      success: false,
      errorMessage: err.message || "修改日期失败"
    };
  }
}

async function deleteWearLogs(wearLogIds) {
  try {
    if (!Array.isArray(wearLogIds) || wearLogIds.length === 0) {
      throw new Error("请选择要删除的记录");
    }

    await Promise.all(
      wearLogIds.map((id) => {
        return db.collection("wear_logs").doc(id).remove();
      })
    );

    return {
      success: true,
      errorMessage: ""
    };
  } catch (err) {
    console.error("[wearLogService] 批量删除穿搭记录失败：", err);

    return {
      success: false,
      errorMessage: err.message || "批量删除失败"
    };
  }
}

module.exports = {
  saveTodayWearLog,
  listWearLogsByCurrentWardrobe,
  updateWearLogDate,
  deleteWearLogs
};