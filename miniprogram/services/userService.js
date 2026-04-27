async function initUser() {
  const res = await wx.cloud.callFunction({
    name: 'initUser',
    data: {}
  })

  if (!res || !res.result || !res.result.success) {
    throw new Error(
      (res && res.result && res.result.errorMessage) || '用户初始化失败'
    )
  }

  const data = res.result.data

  wx.setStorageSync('openid', data.openid)
  wx.setStorageSync('userId', data.userId)
  wx.setStorageSync('wardrobeId', data.wardrobeId)

  return data
}

function getCurrentUserId() {
  return wx.getStorageSync('userId') || ''
}

function getCurrentWardrobeId() {
  return wx.getStorageSync('wardrobeId') || ''
}

module.exports = {
  initUser,
  getCurrentUserId,
  getCurrentWardrobeId
}