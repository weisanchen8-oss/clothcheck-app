const userService = require('./services/userService')

App({
  globalData: {
    initReady: false,
    initError: ''
  },

  async onLaunch() {
    wx.cloud.init({
      env: wx.cloud.DYNAMIC_CURRENT_ENV,
      traceUser: true
    })

    try {
      const initData = await userService.initUser()

      this.globalData.initReady = true
      this.globalData.initError = ''

      console.log('[app] 用户初始化成功：', initData)
    } catch (error) {
      this.globalData.initReady = false
      this.globalData.initError = error.message || '用户初始化失败'

      console.error('[app] 用户初始化失败：', error)
    }
  }
})