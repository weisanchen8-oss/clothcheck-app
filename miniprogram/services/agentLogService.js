const db = wx.cloud.database();

function getCurrentUserId() {
  return wx.getStorageSync("userId") || "";
}

function getCurrentWardrobeId() {
  return wx.getStorageSync("currentWardrobeId") || "";
}

async function saveAgentRun(params) {
  try {
    const userId = params.userId || getCurrentUserId();
    const wardrobeId = params.wardrobeId || getCurrentWardrobeId();

    const record = {
      userId,
      wardrobeId,

      intent: params.intent || "unknown",
      inputText: params.inputText || "",

      toolsUsed: params.toolsUsed || [],
      decisionSteps: params.decisionSteps || [],

      resultSummary: params.resultSummary || "",
      success: !!params.success,
      errorMessage: params.errorMessage || "",

      createdAt: db.serverDate()
    };

    await db.collection("agent_runs").add({
      data: record
    });

    return {
      success: true,
      errorMessage: ""
    };
  } catch (err) {
    console.error("[agentLogService] 保存 Agent 日志失败：", err);

    return {
      success: false,
      errorMessage: err.message || "保存 Agent 日志失败"
    };
  }
}

module.exports = {
  saveAgentRun
};