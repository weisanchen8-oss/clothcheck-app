const recommendationService = require("/services/recommendationService.js");

Page({
  data: {
    loading: false,
    currentWardrobe: null,
    weather: null,
    outfits: [],
    fallbackSuggestions: [],
    decisionSteps: []
  },

  onShow() {
    this.loadRecommendation()
  },

  async loadRecommendation() {
    try {
      this.setData({ loading: true })

      const result = await recommendationService.getTodayRecommendation()

      this.setData({
        currentWardrobe: result.wardrobe,
        weather: result.weather,
        outfits: result.outfits || [],
        fallbackSuggestions: result.fallbackSuggestions || [],
        decisionSteps: result.decisionSteps || []
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '推荐加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  refreshRecommendation() {
    this.loadRecommendation()
  },

  goAddItem() {
    wx.navigateTo({
      url: '/pages/add-item/add-item'
    })
  },

  goWardrobes() {
    wx.navigateTo({
      url: '/pages/wardrobes/wardrobes'
    })
  }
})