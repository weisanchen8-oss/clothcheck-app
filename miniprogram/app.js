// app.js
App({
  onLaunch() {
    // 1️⃣ 初始化云开发（必须）
    wx.cloud.init({
      env: 'cloud1-d0g4518tl4ecde1f9', 
      traceUser: true
    })

    // 2️⃣ 写入测试用户（必须）
    wx.setStorageSync('userId', 'test_user_001')
    wx.setStorageSync('wardrobeId', 'test_wardrobe_001')
  }
})