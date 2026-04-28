const wardrobeAgent = require("../../services/wardrobeAgent.js");
const wearLogService = require("../../services/wearLogService.js");

Page({
  data: {
    loading: false,
    saving: false,

    weather: null,
    answer: "",
    outfits: [],
    fallbackSuggestions: [],
    decisionSteps: [],
    toolsUsed: [],
    errorMessage: ""
  },

  onLoad() {
    this.loadRecommendation();
  },

  async loadRecommendation() {
    this.setData({
      loading: true,
      errorMessage: ""
    });

    try {
      const result = await wardrobeAgent.runTodayRecommendation();

      this.setData({
        weather: result.weather || null,
        answer: result.answer || "",
        outfits: result.outfits || [],
        fallbackSuggestions: result.fallbackSuggestions || [],
        decisionSteps: result.decisionSteps || [],
        toolsUsed: result.toolsUsed || [],
        errorMessage: result.success ? "" : result.errorMessage || ""
      });
    } catch (err) {
      console.error("[recommendation] Agent 加载失败：", err);

      this.setData({
        errorMessage: err.message || "Agent 加载失败"
      });
    } finally {
      this.setData({
        loading: false
      });
    }
  },

  handleRefresh() {
    this.loadRecommendation();
  },

  async handleSaveWearLog(e) {
    const index = e.currentTarget.dataset.index;
    const outfit = this.data.outfits[index];

    if (!outfit) {
      wx.showToast({
        title: "未找到搭配",
        icon: "none"
      });
      return;
    }

    this.setData({
      saving: true
    });

    try {
      const result = await wearLogService.saveTodayWearLog(
        outfit,
        this.data.weather
      );

      if (result.success) {
        wx.showToast({
          title: result.duplicated ? "今天已记录过" : "已记录今日穿搭",
          icon: "success"
        });
      } else {
        wx.showToast({
          title: result.errorMessage || "保存失败",
          icon: "none"
        });
      }
    } catch (err) {
      console.error("[recommendation] 保存穿搭失败：", err);

      wx.showToast({
        title: err.message || "保存失败",
        icon: "none"
      });
    } finally {
      this.setData({
        saving: false
      });
    }
  },

  goWearLogs() {
    wx.navigateTo({
      url: "/pages/wear-logs/wear-logs"
    });
  },

  goCloset() {
    wx.switchTab({
      url: "/pages/closet/closet"
    });
  },

  goAddItem() {
    wx.navigateTo({
      url: "/pages/add-item/add-item"
    });
  }
});