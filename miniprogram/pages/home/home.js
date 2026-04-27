Page({
  goCloset() {
    wx.navigateTo({
      url: '/pages/closet/closet'
    })
  },

  goAddItem() {
    wx.navigateTo({
      url: '/pages/add-item/add-item'
    })
  }
})