Page({
  goCloset() {
    wx.switchTab({
      url: '/pages/closet/closet'
    })
  },

  goRecommendation() {
    wx.switchTab({
      url: "/pages/recommendation/recommendation"
    });
  },

  goAddItem() {
    wx.navigateTo({
      url: '/pages/add-item/add-item'
    })
  }
})