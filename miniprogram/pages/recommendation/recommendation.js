const wardrobeAgent = require("../../services/wardrobeAgent.js");

Page({
  data: {
    loading: false,
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

  onShow() {
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
        errorMessage: result.success ? "" : result.errorMessage
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