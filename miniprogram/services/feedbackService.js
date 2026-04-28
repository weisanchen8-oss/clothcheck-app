const db = wx.cloud.database();

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

function getTemperatureAdjustment(feedback) {
  if (feedback === "cold") return -1;
  if (feedback === "hot") return 1;
  return 0;
}

function calculateTotalAdjustment(morning, noon, evening) {
  const total =
    getTemperatureAdjustment(morning) +
    getTemperatureAdjustment(noon) +
    getTemperatureAdjustment(evening);

  if (total <= -2) return -1;
  if (total >= 2) return 1;
  return 0;
}

async function getFeedbackByWearLogId(wearLogId) {
  const res = await db
    .collection("feedback_logs")
    .where({ wearLogId })
    .limit(1)
    .get();

  return (res.data || [])[0] || null;
}

async function upsertDailyFeedback(params) {
  try {
    const userId = getCurrentUserId();
    const wardrobeId = getCurrentWardrobeId();

    if (!wardrobeId) throw new Error("缺少当前衣柜 ID");
    if (!params.wearLogId) throw new Error("缺少穿搭记录 ID");

    const morningFeedback = params.morningFeedback || "ok";
    const noonFeedback = params.noonFeedback || "ok";
    const eveningFeedback = params.eveningFeedback || "ok";

    const data = {
      userId,
      wardrobeId,
      wearLogId: params.wearLogId,
      date: getTodayDateText(),
      targetDate: params.targetDate || getTodayDateText(),

      outfitSignature: params.outfitSignature || "",

      morningFeedback,
      noonFeedback,
      eveningFeedback,
      layeringFeedback: params.layeringFeedback || "ok",

      temperatureFeedback: "multi_period",
      styleFeedback: params.styleFeedback || "neutral",
      comfortFeedback: params.comfortFeedback || "normal",

      temperatureAdjustment: calculateTotalAdjustment(
        morningFeedback,
        noonFeedback,
        eveningFeedback
      ),

      likedClothingIds: params.likedClothingIds || [],
      dislikedClothingIds: params.dislikedClothingIds || [],
      comment: params.comment || "",

      updatedAt: db.serverDate()
    };

    const existing = await getFeedbackByWearLogId(params.wearLogId);

    if (existing) {
      await db.collection("feedback_logs").doc(existing._id).update({
        data
      });

      return {
        success: true,
        mode: "update",
        feedbackId: existing._id,
        errorMessage: ""
      };
    }

    const addRes = await db.collection("feedback_logs").add({
      data: {
        ...data,
        createdAt: db.serverDate()
      }
    });

    return {
      success: true,
      mode: "create",
      feedbackId: addRes._id,
      errorMessage: ""
    };
  } catch (err) {
    console.error("[feedbackService] 保存反馈失败：", err);

    return {
      success: false,
      mode: "",
      feedbackId: "",
      errorMessage: err.message || "保存反馈失败"
    };
  }
}

async function listFeedbackLogsByCurrentWardrobe() {
  try {
    const wardrobeId = getCurrentWardrobeId();

    if (!wardrobeId) throw new Error("缺少当前衣柜 ID");

    const res = await db
      .collection("feedback_logs")
      .where({ wardrobeId })
      .orderBy("updatedAt", "desc")
      .get();

    return {
      success: true,
      data: res.data || [],
      errorMessage: ""
    };
  } catch (err) {
    console.error("[feedbackService] 读取反馈记录失败：", err);

    return {
      success: false,
      data: [],
      errorMessage: err.message || "读取反馈记录失败"
    };
  }
}

module.exports = {
  upsertDailyFeedback,
  listFeedbackLogsByCurrentWardrobe
};