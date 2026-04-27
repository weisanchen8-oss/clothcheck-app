const weatherService = require("/services/weatherService.js");

Page({
  data: {
    loading: false,
    weather: null,
    outfits: [],
    fallbackSuggestions: [],
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
      const result = await recommendationService.getTodayRecommendation();

      this.setData({
        weather: result.weather,
        outfits: result.outfits || [],
        fallbackSuggestions: result.fallbackSuggestions || [],
        errorMessage: result.success ? "" : result.errorMessage
      });
    } catch (err) {
      console.error("[recommendation] 加载推荐失败：", err);

      this.setData({
        errorMessage: err.message || "加载推荐失败"
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